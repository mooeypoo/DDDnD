/**
 * "Play it": the Pack Studio hands a pack to the game in memory
 * (docs/PACK_STUDIO.md §11, D15, D17; threat T12).
 *
 * A pack that arrives this way skips the bazaar's review screen, so whoever
 * can send one decides what the player sees. The game therefore accepts one
 * only:
 * - from the window that opened it (`event.source` is its opener);
 * - at a trusted origin (a constant in the game's code, never a setting);
 * - carrying the nonce the game made for this page, after it said it was ready;
 * - once: the first valid pack is played, and everything after is ignored.
 *
 * Then the pack goes through the same validation as any import. These are
 * the rules of the exchange, shared by both apps; the windows and events
 * stay in the apps.
 */

/** The name the Studio gives the game's preview tab, so "Play it" again reuses it. Not a credential: it only selects the game's no-op storage. */
export const PREVIEW_WINDOW_NAME = 'dddnd-studio-preview'

/** The game's preview route. */
export const PREVIEW_PATH = '/preview'

export const PREVIEW_MESSAGES = {
  /** Game → Studio: the preview tab is listening, with this page's nonce. */
  ready: 'dddnd-preview-ready',
  /** Studio → game: the pack, as `.dddnd-pack.json` text, with the game's nonce. */
  pack: 'dddnd-preview-pack',
  /** Game → Studio: whether the pack plays, or why it doesn't. */
  status: 'dddnd-preview-status',
} as const

export interface PreviewReady { type: typeof PREVIEW_MESSAGES.ready; nonce: string }
export interface PreviewPack { type: typeof PREVIEW_MESSAGES.pack; nonce: string; bundle: string }
export interface PreviewStatus { type: typeof PREVIEW_MESSAGES.status; nonce: string; ok: boolean; problems: string[] }

/** What the apps pass in from a `message` event. */
export interface PreviewMessageEvent { origin: string; source: unknown; data: unknown }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** A nonce is long, random and plain: hex only, so it can't carry anything else. */
export function isNonce(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{32,128}$/.test(value)
}

/**
 * The game's side: accepts one pack, from the tab that opened it, at a
 * trusted origin, carrying this page's nonce. Returns the bundle text, or
 * null for anything else (ignored, never answered).
 */
export function createPreviewReceiver(options: { trustedOrigins: readonly string[]; opener: unknown; nonce: string }) {
  if (!isNonce(options.nonce)) throw new Error('A preview needs a random nonce')
  let accepted = false
  return {
    accept(event: PreviewMessageEvent): string | null {
      if (accepted) return null
      if (!options.opener || event.source !== options.opener) return null
      if (!options.trustedOrigins.includes(event.origin)) return null
      const data = event.data
      if (!isRecord(data) || data.type !== PREVIEW_MESSAGES.pack || data.nonce !== options.nonce || typeof data.bundle !== 'string') return null
      accepted = true
      return data.bundle
    },
    get accepted() {
      return accepted
    },
  }
}

/** The Studio's side: a "ready" from the tab it opened, at the game's origin. Returns its nonce, or null. */
export function previewReadyNonce(event: PreviewMessageEvent, expected: { origin: string; tab: unknown }): string | null {
  if (!expected.tab || event.source !== expected.tab || event.origin !== expected.origin) return null
  const data = event.data
  return isRecord(data) && data.type === PREVIEW_MESSAGES.ready && isNonce(data.nonce) ? data.nonce : null
}

/** The Studio's side: the game's answer about the pack it sent with `nonce`, or null. */
export function previewStatus(event: PreviewMessageEvent, expected: { origin: string; tab: unknown; nonce: string }): { ok: boolean; problems: string[] } | null {
  if (!expected.tab || event.source !== expected.tab || event.origin !== expected.origin) return null
  const data = event.data
  if (!isRecord(data) || data.type !== PREVIEW_MESSAGES.status || data.nonce !== expected.nonce || typeof data.ok !== 'boolean') return null
  const problems = Array.isArray(data.problems) ? data.problems.filter((problem): problem is string => typeof problem === 'string').slice(0, 12) : []
  return { ok: data.ok, problems }
}
