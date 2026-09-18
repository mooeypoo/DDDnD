/**
 * Player-facing name for the people around the war table.
 *
 * Engine content stays `stakeholder`. Live UI says "the council" so lobby,
 * plaques, tutorials, and play share one word — not voices, court, or party.
 */
export function councilCountLabel(count: number): string {
  return `council of ${count}`
}
