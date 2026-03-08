import { describe, it, expect, vi } from 'vitest'
import type { Scenario } from '@/domains/content/model'
import { loadQuestDisplayModel, loadQuestDisplayModels } from '@/ui/services/quest_loader'

// Mock data
const mockScenario: Scenario = {
  id: 'test_scenario',
  version: 1,
  name: 'Test Quest',
  description: 'A test scenario for questing',
  short_description: 'Short test quest',
  flavor_text: 'Flavor text here',
  max_turns: 10,
  starting_scores: {
    clarity: 50
  },
  score_refs: [{ id: 'clarity', version: 1 }],
  stakeholder_refs: [
    { id: 'cto', version: 1 },
    { id: 'product_manager', version: 1 }
  ],
  card_refs: [
    { id: 'action_1', version: 1 },
    { id: 'action_2', version: 1 },
    { id: 'action_3', version: 1 }
  ],
  event_refs: []
}

describe('quest loader', () => {
  it('loads a single quest and transforms it to display model', async () => {
    const mockProvider = {
      loadScenario: vi.fn().mockResolvedValue(mockScenario),
      // Mock other required methods
      loadScore: vi.fn(),
      loadStakeholder: vi.fn(),
      loadStakeholderReactionRule: vi.fn(),
      loadCard: vi.fn(),
      loadEvent: vi.fn(),
      loadDelayedEffect: vi.fn(),
      loadOutcomeTier: vi.fn(),
      loadOutcomeArchetype: vi.fn(),
      loadPlayerClass: vi.fn()
    }

    const quest = await loadQuestDisplayModel(
      { id: 'test_scenario', version: 1 },
      mockProvider as any
    )

    expect(quest.id).toBe('test_scenario')
    expect(quest.version).toBe(1)
    expect(quest.name).toBe('Test Quest')
    expect(quest.description).toBe('A test scenario for questing')
    expect(quest.shortDescription).toBe('Short test quest')
    expect(quest.flavorText).toBe('Flavor text here')
    expect(quest.turnCount).toBe(10)
    expect(quest.stakeholderCount).toBe(2)
    expect(quest.actionCardCount).toBe(3)
    expect(mockProvider.loadScenario).toHaveBeenCalledWith({ id: 'test_scenario', version: 1 })
  })

  it('loads multiple quests and returns successful ones', async () => {
    const mockProvider = {
      loadScenario: vi.fn()
        .mockResolvedValueOnce(mockScenario)
        .mockRejectedValueOnce(new Error('Failed to load'))
        .mockResolvedValueOnce({
          ...mockScenario,
          id: 'another_scenario',
          name: 'Another Quest'
        }),
      // Mock other required methods
      loadScore: vi.fn(),
      loadStakeholder: vi.fn(),
      loadStakeholderReactionRule: vi.fn(),
      loadCard: vi.fn(),
      loadEvent: vi.fn(),
      loadDelayedEffect: vi.fn(),
      loadOutcomeTier: vi.fn(),
      loadOutcomeArchetype: vi.fn(),
      loadPlayerClass: vi.fn()
    }

    const quests = await loadQuestDisplayModels(
      [
        { id: 'test_scenario', version: 1 },
        { id: 'failing_scenario', version: 1 },
        { id: 'another_scenario', version: 1 }
      ],
      mockProvider as any
    )

    // Should only return 2 successful loads
    expect(quests).toHaveLength(2)
    expect(quests[0].id).toBe('test_scenario')
    expect(quests[1].id).toBe('another_scenario')
    expect(mockProvider.loadScenario).toHaveBeenCalledTimes(3)
  })

  it('handles gracefully when all quests fail to load', async () => {
    const mockProvider = {
      loadScenario: vi.fn().mockRejectedValue(new Error('Content not found')),
      // Mock other required methods
      loadScore: vi.fn(),
      loadStakeholder: vi.fn(),
      loadStakeholderReactionRule: vi.fn(),
      loadCard: vi.fn(),
      loadEvent: vi.fn(),
      loadDelayedEffect: vi.fn(),
      loadOutcomeTier: vi.fn(),
      loadOutcomeArchetype: vi.fn(),
      loadPlayerClass: vi.fn()
    }

    const quests = await loadQuestDisplayModels(
      [
        { id: 'missing_1', version: 1 },
        { id: 'missing_2', version: 1 }
      ],
      mockProvider as any
    )

    expect(quests).toHaveLength(0)
  })

  it('derives stats from scenario content', async () => {
    const scenarioWithDifferentStats: Scenario = {
      ...mockScenario,
      id: 'epic_scenario',
      max_turns: 20,
      stakeholder_refs: [
        { id: 's1', version: 1 },
        { id: 's2', version: 1 },
        { id: 's3', version: 1 },
        { id: 's4', version: 1 }
      ],
      card_refs: Array.from({ length: 15 }, (_, i) => ({
        id: `action_${i}`,
        version: 1
      }))
    }

    const mockProvider = {
      loadScenario: vi.fn().mockResolvedValue(scenarioWithDifferentStats),
      // Mock other required methods
      loadScore: vi.fn(),
      loadStakeholder: vi.fn(),
      loadStakeholderReactionRule: vi.fn(),
      loadCard: vi.fn(),
      loadEvent: vi.fn(),
      loadDelayedEffect: vi.fn(),
      loadOutcomeTier: vi.fn(),
      loadOutcomeArchetype: vi.fn(),
      loadPlayerClass: vi.fn()
    }

    const quest = await loadQuestDisplayModel(
      { id: 'epic_scenario', version: 1 },
      mockProvider as any
    )

    expect(quest.turnCount).toBe(20)
    expect(quest.stakeholderCount).toBe(4)
    expect(quest.actionCardCount).toBe(15)
  })
})
