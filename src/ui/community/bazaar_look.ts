/**
 * The bazaar's look (journal M2.11, M2.12). Community packs are shown in a
 * room of their own, styled so that a player (and anyone seeing a
 * screenshot) can tell at a glance that this content is external.
 *
 * Two looks are being compared; `?look=night` switches while that's open.
 * The palettes live in design-system.css as `.bazaar-look-<look>` tokens.
 */

export type BazaarLook = 'awning' | 'night'

export const DEFAULT_BAZAAR_LOOK: BazaarLook = 'awning'

export function bazaarLookFromQuery(value: unknown): BazaarLook {
  return value === 'night' ? 'night' : DEFAULT_BAZAAR_LOOK
}

/** The CSS class that carries a look's tokens. */
export function bazaarLookClass(look: BazaarLook): string {
  return `bazaar-look-${look}`
}
