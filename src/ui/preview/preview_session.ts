/**
 * Whether this tab is a preview of a pack from the Pack Studio ("Play it",
 * docs/PACK_STUDIO.md §11, D15). Decided once, when the page loads, before
 * the game store builds its storage: a preview tab saves nothing and reads no
 * saved run or stored pack, from its first moment to its last.
 *
 * A tab is a preview when it was opened at the preview route, or by the
 * Studio under the preview's window name (which a reload keeps). The name
 * only switches storage off, the safe direction: trusting a pack still needs
 * the exact origin, the opener and the nonce (preview_handoff.ts).
 */
import { PREVIEW_PATH, PREVIEW_WINDOW_NAME } from '@/domains/content/services/preview_handoff'

/**
 * The origins the game accepts a preview pack from (D17): a constant in code,
 * never a setting. Production trusts none until the Studio launches; the
 * launch adds https://studio.dddnd.app here, with an ADR note (§12, the
 * owner's call on 2026-11-26). A development build also trusts the local
 * Studio dev server; a production build never does.
 */
export const PRODUCTION_PREVIEW_ORIGINS: readonly string[] = []
export const DEVELOPMENT_PREVIEW_ORIGINS: readonly string[] = ['http://localhost:5318']

export function trustedPreviewOrigins(): readonly string[] {
  return import.meta.env.DEV ? [...PRODUCTION_PREVIEW_ORIGINS, ...DEVELOPMENT_PREVIEW_ORIGINS] : PRODUCTION_PREVIEW_ORIGINS
}

let session: boolean | null = null

export function isPreviewSession(): boolean {
  if (session === null) {
    session = typeof window !== 'undefined' && (window.name === PREVIEW_WINDOW_NAME || window.location.pathname === PREVIEW_PATH)
    // A reload of any page in this tab stays a preview
    if (session) window.name = PREVIEW_WINDOW_NAME
  }
  return session
}

/** Tests only: decide again on the next call. */
export function resetPreviewSessionForTests(): void {
  session = null
}
