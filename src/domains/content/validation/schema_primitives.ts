/**
 * Schema Primitives
 *
 * Shared building blocks for content and manifest schemas.
 *
 * Two deliberate choices (ADR 0007):
 *
 * 1. `zod/mini`, not the classic `zod` API. Same validation core, but
 *    tree-shakable functions instead of methods on every schema. The classic
 *    API added ~28 kB gzipped to the game bundle; mini adds a fraction.
 *
 * 2. `jitless` mode, configured here before any schema is constructed. By
 *    default Zod v4 probes `new Function` to compile faster parsers. It catches
 *    the failure under a strict Content Security Policy, but the browser still
 *    reports a CSP violation. Jitless mode means content validation never
 *    evaluates generated code. Every schema module imports from here, so this
 *    configuration runs first.
 */

import * as z from 'zod/mini'
import { CONTENT_LIMITS } from './content_limits'

z.config({ jitless: true })

export { z }

/**
 * Characters we refuse in any text field:
 * - C0/C1 control characters, except tab, line feed, and carriage return
 * - Unicode bidirectional overrides and isolates, which can make text render
 *   in a different order than it is stored (a known spoofing trick)
 *
 * We reject instead of silently stripping, so authors see exactly what is
 * wrong. Zero-width joiners are allowed: they are legitimate in emoji
 * sequences and several writing systems.
 */
// eslint-disable-next-line no-control-regex
const FORBIDDEN_TEXT_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩]/

/**
 * Identifier: lowercase snake_case, bounded, not a JavaScript object internal.
 */
export const idSchema = z.string().check(
  z.regex(CONTENT_LIMITS.id_pattern, 'must be lowercase snake_case (a-z, 0-9, _), 1–64 characters'),
  z.refine((value: string) => !CONTENT_LIMITS.reserved_ids.includes(value), 'is a reserved word and cannot be used as an id'),
)

/**
 * Bounded integer. Zod rejects NaN and Infinity for numbers.
 */
export function boundedInt(range: { min: number; max: number }) {
  return z.int().check(z.gte(range.min), z.lte(range.max))
}

/**
 * Content version number used in `<id>-v<version>.json`.
 */
export const contentVersionSchema = boundedInt({ min: 1, max: CONTENT_LIMITS.max_content_version })

/**
 * Required, non-blank, bounded text with no control or bidi-override characters.
 */
export function textSchema(maxLength: number) {
  return z.string().check(
    z.maxLength(maxLength),
    z.refine((value: string) => value.trim().length > 0, 'must not be blank'),
    z.refine((value: string) => !FORBIDDEN_TEXT_CHARACTERS.test(value), 'contains control or bidirectional-override characters'),
  )
}

/**
 * Reference to a versioned content entity.
 */
export const versionRefSchema = z.strictObject({
  id: idSchema,
  version: contentVersionSchema,
})

/**
 * Bounded array helper.
 */
export function boundedArray<T extends z.ZodMiniType>(item: T, maxItems: number) {
  return z.array(item).check(z.maxLength(maxItems))
}

/**
 * Record keyed by content ids with a bounded number of entries.
 *
 * JSON.parse turns a `"__proto__"` key into an ordinary own property. Zod's
 * record schema silently drops that key (safe, but invisible to the author),
 * so we check the raw input first and report it as an error instead. Other
 * reserved keys (`constructor`, `prototype`) are caught by the id schema.
 */
export function idRecord<T extends z.ZodMiniType>(value: T, maxEntries: number) {
  const hasProtoKey = (input: unknown) =>
    typeof input === 'object' && input !== null && Object.prototype.hasOwnProperty.call(input, '__proto__')

  return z.pipe(
    z.unknown().check(z.refine((input) => !hasProtoKey(input), '"__proto__" is a reserved word and cannot be used as a key')),
    z.record(idSchema, value).check(
      z.refine((record: object) => Object.keys(record).length <= maxEntries, `must have at most ${maxEntries} entries`),
    ),
  )
}

/**
 * Absolute `https:` URL with no credentials. Used for author and homepage links,
 * which are rendered as clickable links (threat T2: no `javascript:` URLs).
 */
export const httpsUrlSchema = z.string().check(
  z.maxLength(2048),
  z.refine((value: string) => {
    try {
      const url = new URL(value)
      return url.protocol === 'https:' && url.username === '' && url.password === ''
    } catch {
      return false
    }
  }, 'must be an absolute https:// URL without credentials'),
)
