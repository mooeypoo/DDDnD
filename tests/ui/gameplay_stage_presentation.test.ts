import { describe, expect, it } from 'vitest'

import { resolveGameplaySceneId } from '@/ui/composables/gameplay_stage_presentation'

describe('resolveGameplaySceneId', () => {
  it('gives each adventure its own scene', () => {
    const byScenario = {
      monolith_of_mild_despair: 'fortified_monolith_hall',
      microservice_sprawl: 'strategic_war_room',
      compliance_gauntlet: 'archive_library_chamber',
      startup_hypergrowth: 'medieval_throne_room',
      merger_of_minor_chaos: 'dark_dungeon_room',
    }

    const scenes = Object.values(byScenario)
    expect(new Set(scenes).size).toBe(scenes.length)

    for (const [scenarioId, sceneId] of Object.entries(byScenario)) {
      expect(resolveGameplaySceneId(scenarioId)).toBe(sceneId)
    }
  })

  it('keeps the tutorials visually distinct from each other', () => {
    expect(resolveGameplaySceneId('tutorial_basics')).toBe('forge_of_heroes')
    expect(resolveGameplaySceneId('tutorial_systems_under_pressure')).toBe('dark_dungeon_room')
  })

  it('falls back to the hall for unknown packs', () => {
    expect(resolveGameplaySceneId(undefined)).toBe('fortified_monolith_hall')
    expect(resolveGameplaySceneId('test_scenario')).toBe('fortified_monolith_hall')
  })
})
