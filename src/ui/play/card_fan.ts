/**
 * Arc placement for overlapping portrait cards.
 *
 * Presentation only. The legal hand uses this on the war table; the lobby
 * quest fan reuses the same arc so choosing an adventure rhymes with play
 * without pretending these cards are the engine hand.
 */
export function handFanTransform(index: number, count: number): { rotate: number; y: number } {
  if (count <= 1) {
    return { rotate: 0, y: 0 }
  }

  const spread = Math.min(42, 9 * (count - 1))
  const start = -spread / 2
  const step = spread / (count - 1)
  const rotate = start + step * index
  const y = Math.abs(rotate) * 0.5

  return { rotate, y }
}
