/**
 * File Content Provider (Node scripts)
 *
 * Disk-based ContentProvider shared by the CLI scripts (validate, audit gate,
 * simulation runner, audit report).
 *
 * It applies the same boundary as the browser provider: byte limit, JSON
 * parse, field-level schema, then the filename identity check. Before M1,
 * each script had its own copy of a loader that only checked id/version, so a
 * pack could pass the CLI validator and still be rejected by the game.
 */

import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import type { VersionRef } from '../../src/domains/content/model/version_ref.js'
import type { ContentProvider, ContentType } from '../../src/domains/content/services/content_provider.js'
import { CONTENT_LIMITS } from '../../src/domains/content/validation/content_limits.js'
import {
  parseContentEntity,
  type ContentEntityByType,
} from '../../src/domains/content/validation/content_entity_parser.js'

async function loadEntity<K extends ContentType>(
  contentRoot: string,
  contentType: K,
  ref: VersionRef,
): Promise<ContentEntityByType[K]> {
  const filename = `${ref.id}-v${ref.version}.json`
  const filePath = path.join(contentRoot, contentType, filename)

  const { size } = await stat(filePath)
  if (size > CONTENT_LIMITS.max_file_bytes) {
    throw new Error(`Content too large: ${filePath} is ${size} bytes (limit ${CONTENT_LIMITS.max_file_bytes})`)
  }

  const raw = JSON.parse(await readFile(filePath, 'utf8')) as unknown
  const entity = parseContentEntity(contentType, ref, raw)

  if (entity.id !== ref.id || entity.version !== ref.version) {
    throw new Error(
      `Version mismatch in ${filename}: expected ${ref.id} v${ref.version}, got ${entity.id} v${entity.version}`,
    )
  }

  return entity
}

/**
 * Creates a validating ContentProvider that reads `<contentRoot>/<type>/<id>-v<version>.json`.
 */
export function createFileContentProvider(contentRoot: string): ContentProvider {
  return {
    loadScenario: (ref) => loadEntity(contentRoot, 'scenarios', ref),
    loadScore: (ref) => loadEntity(contentRoot, 'scores', ref),
    loadStakeholder: (ref) => loadEntity(contentRoot, 'stakeholders', ref),
    loadStakeholderReactionRule: (ref) => loadEntity(contentRoot, 'stakeholder-reaction-rules', ref),
    loadCard: (ref) => loadEntity(contentRoot, 'cards', ref),
    loadEvent: (ref) => loadEntity(contentRoot, 'events', ref),
    loadDelayedEffect: (ref) => loadEntity(contentRoot, 'delayed-effects', ref),
    loadOutcomeTier: (ref) => loadEntity(contentRoot, 'outcome-tiers', ref),
    loadOutcomeArchetype: (ref) => loadEntity(contentRoot, 'outcome-archetypes', ref),
    loadCouplingRule: (ref) => loadEntity(contentRoot, 'coupling-rules', ref),
    loadPlayerClass: (ref) => loadEntity(contentRoot, 'classes', ref),
    loadChallengeModifier: (ref) => loadEntity(contentRoot, 'challenge-modifiers', ref),
  }
}
