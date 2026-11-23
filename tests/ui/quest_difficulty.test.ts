import { describe, expect, it } from 'vitest'
import { BASE_BALANCE_TARGETS, baseQuest } from '../support/base_balance_targets'
import { questDifficulty, sortQuestsByDifficulty } from '@/ui/play/quest_difficulty'

describe('questDifficulty', () => {
  it('carries no mark for scenarios the pack sets no target for', () => {
    expect(questDifficulty(baseQuest('tutorial_basics'))).toBeNull()
    expect(questDifficulty(baseQuest('not_a_scenario'))).toBeNull()
  })

  // Pins the label every shipped scenario shows the player. Retuning a band is
  // allowed; silently changing what a newcomer is told is not.
  it.each([
    ['merger_of_minor_chaos', 'Easy'],
    ['monolith_of_mild_despair', 'Normal'],
    ['compliance_gauntlet', 'Normal'],
    ['startup_hypergrowth', 'Normal'],
    ['microservice_sprawl', 'Hard'],
  ])('marks %s as %s', (scenarioId, label) => {
    expect(questDifficulty(baseQuest(scenarioId))?.label).toBe(label)
  })

  it('marks every scenario the balance audit gates on', () => {
    for (const scenarioId of Object.keys(BASE_BALANCE_TARGETS)) {
      expect(questDifficulty(baseQuest(scenarioId))).not.toBeNull()
    }
  })

  it('never calls a harder band easier than a softer one', () => {
    const rank = { easy: 0, normal: 1, hard: 2 }
    const marked = Object.entries(BASE_BALANCE_TARGETS).map(([scenarioId, target]) => ({
      expectedWinRate: (target.win_rate_min + target.win_rate_max) / 2,
      rank: rank[questDifficulty(baseQuest(scenarioId))!.id],
    }))

    for (const left of marked) {
      for (const right of marked) {
        if (left.expectedWinRate > right.expectedWinRate) {
          expect(left.rank).toBeLessThanOrEqual(right.rank)
        }
      }
    }
  })
})

describe('sortQuestsByDifficulty', () => {
  const shipped = Object.keys(BASE_BALANCE_TARGETS).map(baseQuest)

  it('opens on the gentlest quest whatever order the pack lists', () => {
    const forward = sortQuestsByDifficulty(shipped)
    const reversed = sortQuestsByDifficulty([...shipped].reverse())

    expect(forward[0].id).toBe('merger_of_minor_chaos')
    expect(reversed[0].id).toBe('merger_of_minor_chaos')
    expect(questDifficulty(forward[0])?.label).toBe('Easy')
  })

  it('runs easy then normal then hard, never doubling back', () => {
    const labels = sortQuestsByDifficulty(shipped).map((q) => questDifficulty(q)!.label)
    const rank = { Easy: 0, Normal: 1, Hard: 2 } as const

    expect(labels).toEqual([...labels].sort((a, b) => rank[a as keyof typeof rank] - rank[b as keyof typeof rank]))
    expect(labels[0]).toBe('Easy')
    expect(labels[labels.length - 1]).toBe('Hard')
  })

  it('leaves untargeted quests in pack order at the end', () => {
    const mixed = [
      { id: 'custom_b' },
      baseQuest('microservice_sprawl'),
      { id: 'custom_a' },
      baseQuest('merger_of_minor_chaos'),
    ]

    expect(sortQuestsByDifficulty(mixed).map((q) => q.id)).toEqual([
      'merger_of_minor_chaos',
      'microservice_sprawl',
      'custom_b',
      'custom_a',
    ])
  })

  it('does not mutate the list it was given', () => {
    const original = [baseQuest('microservice_sprawl'), baseQuest('merger_of_minor_chaos')]
    sortQuestsByDifficulty(original)

    expect(original.map((q) => q.id)).toEqual(['microservice_sprawl', 'merger_of_minor_chaos'])
  })
})

describe("difficulty comes from the quest's own scenario (journal M3.8)", () => {
  it('ignores the id: a community scenario reusing a base id gets no mark unless it declares targets', () => {
    const sameIdNoTargets: { id: string; winRateTarget?: undefined } = { id: 'microservice_sprawl' }
    expect(questDifficulty(sameIdNoTargets)).toBeNull()
    expect(questDifficulty({ winRateTarget: { min: 0.7, max: 0.9 } })?.label).toBe('Easy')
  })
})

