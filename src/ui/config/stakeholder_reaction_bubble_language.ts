/**
 * Tone ids for stakeholder speech bubble presentation text.
 */
export type StakeholderReactionBubbleTone = 'positive' | 'mixed' | 'concern' | 'critical' | 'fallback'

/**
 * Central UI language mapping for stakeholder speech bubbles.
 * This is intentionally separate from gameplay content packs.
 */
export const STAKEHOLDER_REACTION_BUBBLE_LANGUAGE: Record<StakeholderReactionBubbleTone, string[]> = {
  positive: [
    'This seems like a move in the right direction.',
    'I can support this direction for now.',
    'This helps us more than it hurts us.',
  ],
  mixed: [
    'I can live with this, but there are trade-offs.',
    'Some progress, some friction. Keep a close eye on it.',
    'This helps in places and strains others.',
  ],
  concern: [
    'This raises concerns for my team.',
    'I am not convinced this is sustainable.',
    'This introduces risk we need to manage quickly.',
  ],
  critical: [
    'This is a hard direction for us to support.',
    'This is putting too much pressure on our priorities.',
    'We need corrective action before this worsens.',
  ],
  fallback: [
    'Noted. I am watching where this goes next.',
    'We will adapt, but we need clarity.',
    'This changes things. Keep us informed.',
  ],
}
