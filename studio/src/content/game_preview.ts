/**
 * "Play it" (docs/PACK_STUDIO.md §11, D15, D17): the Studio opens the game's
 * preview route in a tab of its own, waits for that tab to say it's ready,
 * and sends it the pack, at the game's exact origin. The rules of the
 * exchange are the content domain's (preview_handoff.ts); this adapter owns
 * the window and its messages.
 *
 * The same tab is reused ("Play it" again replaces what it plays), and a
 * reload of that tab asks again: the Studio answers with the pack it last
 * sent. Nothing is stored anywhere.
 */
import {
  PREVIEW_PATH,
  PREVIEW_MESSAGES,
  PREVIEW_WINDOW_NAME,
  previewReadyNonce,
  previewStatus,
} from '@/domains/content/services/preview_handoff'

/** The game this Studio plays packs in: the local dev server in development, dddnd.app otherwise. */
export const GAME_ORIGIN = import.meta.env.DEV ? 'http://localhost:5173' : 'https://dddnd.app'

/**
 * Whether the production game accepts this Studio's packs yet. False until the
 * launch, which adds https://studio.dddnd.app to the game's trusted origins in
 * the same change (§12; a test keeps the two in step).
 */
export const PLAY_IT_IN_PRODUCTION = false

/** Whether "Play it" works in this build. */
export const PLAY_IT_LIVE = import.meta.env.DEV || PLAY_IT_IN_PRODUCTION

export type PlayStatus =
  | { state: 'opening' }
  | { state: 'playing' }
  | { state: 'refused'; problems: string[] }
  | { state: 'no_answer' }
  | { state: 'blocked' }

const NO_ANSWER_AFTER_MS = 15000

let tab: Window | null = null
let bundle: string | null = null
let report: (status: PlayStatus) => void = () => {}
let sentNonce: string | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let listening = false

function onMessage(event: MessageEvent) {
  if (!tab || bundle === null) return
  const message = { origin: event.origin, source: event.source, data: event.data }
  const nonce = previewReadyNonce(message, { origin: GAME_ORIGIN, tab })
  if (nonce) {
    // The tab is ready (or reloaded): send it the pack, only at the game's origin
    sentNonce = nonce
    tab.postMessage({ type: PREVIEW_MESSAGES.pack, nonce, bundle }, GAME_ORIGIN)
    return
  }
  if (!sentNonce) return
  const status = previewStatus(message, { origin: GAME_ORIGIN, tab, nonce: sentNonce })
  if (!status) return
  if (timer) clearTimeout(timer)
  report(status.ok ? { state: 'playing' } : { state: 'refused', problems: status.problems })
}

/** Opens (or reuses) the game's preview tab and plays `packText` there. */
export function playInGame(packText: string, onStatus: (status: PlayStatus) => void): void {
  if (!listening) {
    window.addEventListener('message', onMessage)
    listening = true
  }
  bundle = packText
  report = onStatus
  sentNonce = null
  // A named tab: "Play it" again reuses it, and the name tells the game to store nothing
  tab = window.open(`${GAME_ORIGIN}${PREVIEW_PATH}`, PREVIEW_WINDOW_NAME)
  if (!tab) {
    onStatus({ state: 'blocked' })
    return
  }
  onStatus({ state: 'opening' })
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    if (!sentNonce) onStatus({ state: 'no_answer' })
  }, NO_ANSWER_AFTER_MS)
}
