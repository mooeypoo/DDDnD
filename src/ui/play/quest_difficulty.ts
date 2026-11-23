/**
 * Player-facing difficulty mark for a quest.
 *
 * Derived from the win-rate band the scenario's own `balance_targets` declare
 * (journal M3.8), the same band the balance audit gates on, so the badge and
 * the design intent cannot drift apart. A scenario expected to be won 25–50%
 * of the time is harder than one expected at 50–80%.
 *
 * Presentation only: it labels a plate. It does not change a rule, a
 * threshold, or an outcome. Scenarios without targets (including tutorials)
 * simply carry no mark.
 */

/** What difficulty reads from a quest. */
export interface DifficultyTarget {
  winRateTarget?: { min: number; max: number }
}

export type QuestDifficultyId = 'easy' | 'normal' | 'hard'

export interface QuestDifficultyPresentation {
  id: QuestDifficultyId
  label: string
  blurb: string
}

const PRESENTATION: Record<QuestDifficultyId, QuestDifficultyPresentation> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    blurb: 'A forgiving table. A good first quest.',
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    blurb: 'A fair fight. Expect to give up some ground.',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    blurb: 'An unforgiving table. Bring scars from another quest.',
  },
}

/** Above this share of expected wins, a quest is a gentle place to start. */
const EASY_WIN_RATE = 0.6
/** Below this, the pack expects most attempts to fail. */
const NORMAL_WIN_RATE = 0.45

/** Share of attempts the pack expects to end in a win, or null if untargeted. */
function expectedWinRate(quest: DifficultyTarget): number | null {
  const target = quest.winRateTarget
  if (!target) {
    return null
  }

  return (target.min + target.max) / 2
}

/**
 * Difficulty mark for a scenario, or null when the pack sets no target.
 */
export function questDifficulty(quest: DifficultyTarget): QuestDifficultyPresentation | null {
  const expected = expectedWinRate(quest)
  if (expected === null) {
    return null
  }

  if (expected >= EASY_WIN_RATE) return PRESENTATION.easy
  if (expected >= NORMAL_WIN_RATE) return PRESENTATION.normal
  return PRESENTATION.hard
}

/**
 * Orders quests gentlest first, so a newcomer reads the fan left to right and
 * the first plate is the one to open.
 *
 * Sorting on the expected win rate rather than the three tiers keeps the run
 * smooth inside a tier and monotonic with the marks, since the marks are
 * thresholds on the same number. Untargeted quests hold their pack order at
 * the end, where they cannot displace a graded opening plate.
 */
export function sortQuestsByDifficulty<T extends DifficultyTarget>(quests: readonly T[]): T[] {
  return [...quests].sort((left, right) => {
    const leftRate = expectedWinRate(left)
    const rightRate = expectedWinRate(right)

    if (leftRate === null && rightRate === null) return 0
    if (leftRate === null) return 1
    if (rightRate === null) return -1

    return rightRate - leftRate
  })
}
