import type { StakeholderReactionRecord } from '@/domains/simulation'
import {
  STAKEHOLDER_REACTION_BUBBLE_LANGUAGE,
  type StakeholderReactionBubbleTone,
} from '@/ui/config/stakeholder_reaction_bubble_language'

export interface StakeholderSpeechBubblePresentation {
  text: string
  tone: StakeholderReactionBubbleTone
}

const TONE_PRIORITY: Record<StakeholderReactionBubbleTone, number> = {
  critical: 4,
  concern: 3,
  mixed: 2,
  positive: 1,
  fallback: 0,
}

function stableHash(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function pickBubbleTemplate(
  tone: StakeholderReactionBubbleTone,
  seed: string,
): string {
  const templates = STAKEHOLDER_REACTION_BUBBLE_LANGUAGE[tone]
  if (!templates || templates.length === 0) {
    return STAKEHOLDER_REACTION_BUBBLE_LANGUAGE.fallback[0]
  }
  const idx = stableHash(seed) % templates.length
  return templates[idx]
}

export function inferReactionBubbleTone(
  reaction: StakeholderReactionRecord,
): StakeholderReactionBubbleTone {
  const allDeltas = [
    ...reaction.score_changes.map(change => change.delta),
    ...reaction.stakeholder_changes.map(change => change.delta),
  ]

  if (allDeltas.length === 0) {
    return 'fallback'
  }

  const hasPositive = allDeltas.some(delta => delta > 0)
  const hasNegative = allDeltas.some(delta => delta < 0)

  if (hasPositive && hasNegative) {
    return 'mixed'
  }

  const stakeholderDelta = reaction.stakeholder_changes
    .filter(change => change.stakeholder_id === reaction.stakeholder_id)
    .reduce((sum, change) => sum + change.delta, 0)

  const totalDelta = allDeltas.reduce((sum, delta) => sum + delta, 0)
  const signal = stakeholderDelta !== 0 ? stakeholderDelta : totalDelta

  if (signal <= -8) {
    return 'critical'
  }
  if (signal < 0) {
    return 'concern'
  }
  if (signal >= 8) {
    return 'positive'
  }
  if (signal > 0) {
    return 'mixed'
  }

  return 'fallback'
}

export function buildStakeholderSpeechBubbles(
  reactions: StakeholderReactionRecord[],
  turnNumber: number,
): Record<string, StakeholderSpeechBubblePresentation> {
  const bubbleMap: Record<string, StakeholderSpeechBubblePresentation> = {}

  for (const reaction of reactions) {
    const tone = inferReactionBubbleTone(reaction)
    const existing = bubbleMap[reaction.stakeholder_id]

    if (existing && TONE_PRIORITY[existing.tone] > TONE_PRIORITY[tone]) {
      continue
    }

    bubbleMap[reaction.stakeholder_id] = {
      tone,
      text: pickBubbleTemplate(
        tone,
        `${turnNumber}:${reaction.stakeholder_id}:${reaction.presentation.summary}`,
      ),
    }
  }

  return bubbleMap
}
