import { describe, expect, it } from 'vitest'
import { SCENARIO_BALANCE_TARGETS } from '@/domains/simulation'
import { questDifficulty, sortQuestsByDifficulty } from '@/ui/play/quest_difficulty'

describe('questDifficulty', () => {
  it('carries no mark for scenarios the pack sets no target for', () => {
    expect(questDifficulty('tutorial_basics')).toBeNull()
    expect(questDifficulty('not_a_scenario')).toBeNull()
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
    expect(questDifficulty(scenarioId)?.label).toBe(label)
  })

  it('marks every scenario the balance audit gates on', () => {
    for (const scenarioId of Object.keys(SCENARIO_BALANCE_TARGETS)) {
      expect(questDifficulty(scenarioId)).not.toBeNull()
    }
  })

  it('never calls a harder band easier than a softer one', () => {
    const rank = { easy: 0, normal: 1, hard: 2 }
    const marked = Object.entries(SCENARIO_BALANCE_TARGETS).map(([scenarioId, target]) => ({
      expectedWinRate: (target.win_rate_min + target.win_rate_max) / 2,
      rank: rank[questDifficulty(scenarioId)!.id],
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
  const shipped = Object.keys(SCENARIO_BALANCE_TARGETS).map((id) => ({ id }))

  it('opens on the gentlest quest whatever order the pack lists', () => {
    const forward = sortQuestsByDifficulty(shipped)
    const reversed = sortQuestsByDifficulty([...shipped].reverse())

    expect(forward[0].id).toBe('merger_of_minor_chaos')
    expect(reversed[0].id).toBe('merger_of_minor_chaos')
    expect(questDifficulty(forward[0].id)?.label).toBe('Easy')
  })

  it('runs easy then normal then hard, never doubling back', () => {
    const labels = sortQuestsByDifficulty(shipped).map((q) => questDifficulty(q.id)!.label)
    const rank = { Easy: 0, Normal: 1, Hard: 2 } as const

    expect(labels).toEqual([...labels].sort((a, b) => rank[a as keyof typeof rank] - rank[b as keyof typeof rank]))
    expect(labels[0]).toBe('Easy')
    expect(labels[labels.length - 1]).toBe('Hard')
  })

  it('leaves untargeted quests in pack order at the end', () => {
    const mixed = [
      { id: 'custom_b' },
      { id: 'microservice_sprawl' },
      { id: 'custom_a' },
      { id: 'merger_of_minor_chaos' },
    ]

    expect(sortQuestsByDifficulty(mixed).map((q) => q.id)).toEqual([
      'merger_of_minor_chaos',
      'microservice_sprawl',
      'custom_b',
      'custom_a',
    ])
  })

  it('does not mutate the list it was given', () => {
    const original = [{ id: 'microservice_sprawl' }, { id: 'merger_of_minor_chaos' }]
    sortQuestsByDifficulty(original)

    expect(original.map((q) => q.id)).toEqual(['microservice_sprawl', 'merger_of_minor_chaos'])
  })
})
