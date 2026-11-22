/**
 * Manifest Schema
 *
 * Field-level schema for `manifest.json`, plus the pack-level rules that span
 * several fields (kind vs. dependencies, license compatibility, entry points
 * listed in the inventory, total file count).
 */

import validateSpdx from 'spdx-expression-validate'

import type { ContentPackManifest } from '../model/content_pack_manifest'
import { CONTENT_LIMITS } from './content_limits'
import {
  BASE_PACK_ID,
  GPL_COMPATIBLE_LICENSES,
  MAX_FILES_PER_PACK,
  SUPPORTED_PACK_KINDS,
} from './pack_policy'
import {
  boundedArray,
  httpsUrlSchema,
  idSchema,
  textSchema,
  versionRefSchema,
  z,
} from './schema_primitives'

const { text, counts } = CONTENT_LIMITS

/** Pack version: semantic version, optionally with a pre-release tag. */
const packVersionSchema = z.string().check(
  z.regex(/^\d{1,6}\.\d{1,6}\.\d{1,6}(-[0-9A-Za-z.-]{1,32})?$/, 'must be a semantic version such as 1.0.0'),
)

/**
 * Inventory filename: `<id>-v<version>.json`, built only from safe ids.
 * This is what stops `../` or absolute paths from ever becoming fetch targets.
 */
const inventoryFilenameSchema = z.string().check(
  z.regex(/^[a-z0-9_]{1,64}-v[1-9]\d{0,2}\.json$/, 'must be a versioned filename such as define_bounded_context-v1.json'),
)

/**
 * Where a pack's content lives:
 * - `.` or `./sub/folder`: relative to the manifest's own location. The
 *   recommended form for hosted packs: a tagged release needs no edits.
 * - `/content`: a root-relative path on this site (first-party packs).
 * - an absolute https URL.
 * `..` is never allowed. Whether a given https host is allowed is the source
 * policy's job (M2).
 */
const contentLocationSchema = z.string().check(
  z.maxLength(2048),
  z.refine((value: string) => {
    if (value === '.' || value.startsWith('./')) {
      return /^\.(\/[A-Za-z0-9_\-.]+)*\/?$/.test(value) && !value.split('/').includes('..')
    }
    if (value.startsWith('/')) {
      return /^\/[A-Za-z0-9_\-./]*$/.test(value) && !value.split('/').includes('..') && !value.startsWith('//')
    }
    try {
      const url = new URL(value)
      return url.protocol === 'https:' && url.username === '' && url.password === ''
    } catch {
      return false
    }
  }, 'must be "." (the manifest\'s folder), a path such as ./content or /content, or an https:// URL'),
)

const inventorySectionSchema = boundedArray(inventoryFilenameSchema, counts.inventory_section)

const inventorySchema = z.strictObject({
  scenarios: inventorySectionSchema,
  cards: inventorySectionSchema,
  stakeholders: inventorySectionSchema,
  stakeholder_reaction_rules: inventorySectionSchema,
  scores: inventorySectionSchema,
  events: inventorySectionSchema,
  delayed_effects: inventorySectionSchema,
  outcome_tiers: inventorySectionSchema,
  outcome_archetypes: inventorySectionSchema,
  coupling_rules: z.optional(inventorySectionSchema),
  classes: inventorySectionSchema,
  challenge_modifiers: inventorySectionSchema,
})

const entryPointsSchema = boundedArray(versionRefSchema, counts.inventory_section)

/**
 * Shape-only manifest schema. Cross-field rules are in `manifestRuleIssues`.
 */
export const manifestShapeSchema: z.ZodMiniType<ContentPackManifest> = z.strictObject({
  schema_version: z.int().check(z.gte(1)),
  kind: z.enum(SUPPORTED_PACK_KINDS),
  id: idSchema,
  version: packVersionSchema,
  name: textSchema(text.name),
  description: textSchema(text.description),
  depends_on: boundedArray(
    z.strictObject({
      pack_id: idSchema,
      version: packVersionSchema,
    }),
    counts.depends_on,
  ),
  base_url: contentLocationSchema,
  license: z.string().check(
    z.refine((value: string) => value.trim().length > 0, 'is required'),
    z.refine((value: string) => value.trim().length === 0 || validateSpdx(value), 'must be a valid SPDX license expression'),
  ),
  authors: z.array(
    z.strictObject({
      name: textSchema(text.name),
      url: z.optional(httpsUrlSchema),
    }),
  ).check(z.minLength(1, 'must list at least one author'), z.maxLength(counts.authors)),
  pack_homepage_url: z.optional(httpsUrlSchema),
  scenarios: entryPointsSchema,
  classes: entryPointsSchema,
  challenge_modifiers: entryPointsSchema,
  tutorials: entryPointsSchema,
  tutorial_base_url: z.optional(contentLocationSchema),
  content: inventorySchema,
})

/**
 * A manifest-level rule violation.
 */
export interface ManifestRuleIssue {
  path: string
  message: string
}

/**
 * Pack-level rules that need several fields at once. Runs only on manifests
 * that already passed the shape schema.
 */
export function manifestRuleIssues(manifest: ContentPackManifest): ManifestRuleIssue[] {
  const issues: ManifestRuleIssue[] = []

  if (manifest.kind === 'standalone' && manifest.depends_on.length > 0) {
    issues.push({
      path: 'depends_on',
      message: 'a standalone pack must not depend on other packs (use kind "extension")',
    })
  }

  if (manifest.kind === 'extension' && manifest.depends_on.length === 0) {
    issues.push({
      path: 'depends_on',
      message: 'an extension pack must declare the pack it builds on',
    })
  }

  const dependsOnBase = manifest.depends_on.some((dependency) => dependency.pack_id === BASE_PACK_ID)
  if (dependsOnBase && !GPL_COMPATIBLE_LICENSES.includes(manifest.license)) {
    issues.push({
      path: 'license',
      message: `packs that build on the base pack must use a GPL-3.0-compatible license (${GPL_COMPATIBLE_LICENSES.join(' or ')})`,
    })
  }

  const entryPoints: Array<[keyof Pick<ContentPackManifest, 'scenarios' | 'classes' | 'challenge_modifiers' | 'tutorials'>, keyof ContentPackManifest['content']]> = [
    ['scenarios', 'scenarios'],
    ['classes', 'classes'],
    ['challenge_modifiers', 'challenge_modifiers'],
    ['tutorials', 'scenarios'],
  ]
  for (const [field, section] of entryPoints) {
    manifest[field].forEach((ref, index) => {
      const filename = `${ref.id}-v${ref.version}.json`
      if (!(manifest.content[section] ?? []).includes(filename)) {
        issues.push({
          path: `${field}[${index}]`,
          message: `${filename} is an entry point but is not listed in content.${section}`,
        })
      }
    })
  }

  const totalFiles = Object.values(manifest.content).reduce((sum, files) => sum + files.length, 0)
  if (totalFiles > MAX_FILES_PER_PACK) {
    issues.push({
      path: 'content',
      message: `a pack may list at most ${MAX_FILES_PER_PACK} files (this one lists ${totalFiles})`,
    })
  }

  return issues
}
