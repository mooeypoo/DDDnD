/**
 * Content ids from names (Pack Studio, docs/PACK_STUDIO.md §4.1).
 *
 * Authors never type ids: the Studio makes one from the name they give,
 * with the pack's prefix ("Tune the Noisy Alerts" in a pack prefixed "sre"
 * becomes `sre_tune_the_noisy_alerts`). Ids follow the content id grammar
 * (CONTENT_LIMITS.id_pattern) and are unique within the pack.
 *
 * Pure: no Vue, DOM or storage (ADR 0005).
 */

import { CONTENT_LIMITS } from '../content/validation/content_limits'

const MAX_ID_LENGTH = 64

/** Lower-case words of a name, ASCII only: accents are dropped, everything else separates words. */
function words(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * A pack prefix from the pack's name or a short word the author picks:
 * lower case, words joined by `_`, at most 16 characters. Empty when nothing usable is left.
 */
export function contentPrefix(text: string): string {
  return words(text).join('_').slice(0, 16).replace(/_+$/, '')
}

/**
 * A new content id for `name`, prefixed with `prefix`, that isn't in `taken`.
 * A name with no usable characters becomes `<prefix>_item`. A clash gets
 * `_2`, `_3`, … The result always matches the content id grammar.
 */
export function contentIdFromName(name: string, prefix: string, taken: ReadonlySet<string> = new Set()): string {
  const head = contentPrefix(prefix)
  const body = words(name).join('_') || 'item'
  const joined = head ? `${head}_${body}` : body

  for (let attempt = 1; ; attempt += 1) {
    const suffix = attempt === 1 ? '' : `_${attempt}`
    const id = joined.slice(0, MAX_ID_LENGTH - suffix.length).replace(/_+$/, '') + suffix
    if (!taken.has(id) && !CONTENT_LIMITS.reserved_ids.includes(id) && CONTENT_LIMITS.id_pattern.test(id)) {
      return id
    }
  }
}
