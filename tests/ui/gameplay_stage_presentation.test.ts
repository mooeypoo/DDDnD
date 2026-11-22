import { describe, expect, it } from 'vitest'

import {
  ALL_SCENE_BACKGROUND_IDS,
  AVATAR_ROLE_ROTATION,
  buildGameplayStageActors,
  buildRunCast,
  castRoleFor,
  resolveScenarioSceneId,
} from '@/ui/composables/gameplay_stage_presentation'
import { createSeededRandom } from '@/shared/random/seeded_random'

const BASE_KEY = 'dddnd:base'
const COMMUNITY_KEY = 'github:someone/packs/packs/demo'

describe('resolveScenarioSceneId', () => {
  it('gives each first-party adventure its own scene', () => {
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
      expect(resolveScenarioSceneId(scenarioId, BASE_KEY)).toBe(sceneId)
      // Runs and quests from before pack identity are first-party
      expect(resolveScenarioSceneId(scenarioId)).toBe(sceneId)
    }
  })

  it('keeps the tutorials visually distinct from each other', () => {
    expect(resolveScenarioSceneId('tutorial_basics', 'dddnd:tutorial')).toBe('forge_of_heroes')
    expect(resolveScenarioSceneId('tutorial_systems_under_pressure', 'dddnd:tutorial')).toBe('dark_dungeon_room')
  })

  it('uses the hall when there is no scenario', () => {
    expect(resolveScenarioSceneId(undefined)).toBe('fortified_monolith_hall')
  })

  it('picks a scene from the pool for other scenarios, the same every time (ADR 0002)', () => {
    const scene = resolveScenarioSceneId('ledger_payments_monolith', COMMUNITY_KEY)
    expect(ALL_SCENE_BACKGROUND_IDS).toContain(scene)
    expect(resolveScenarioSceneId('ledger_payments_monolith', COMMUNITY_KEY)).toBe(scene)
  })

  it('spreads other scenarios across the pool instead of all using one scene', () => {
    const scenes = new Set(
      Array.from({ length: 40 }, (_, i) => resolveScenarioSceneId(`scenario_${i}`, COMMUNITY_KEY)),
    )
    expect(scenes.size).toBeGreaterThan(3)
  })

  it("doesn't give a community scenario a first-party scene just because it reuses the id (ADR 0014)", () => {
    // Sample several pack keys: a pick may land on the hall by chance, but not every time
    const scenes = new Set(
      Array.from({ length: 12 }, (_, i) => resolveScenarioSceneId('monolith_of_mild_despair', `github:someone/packs/p${i}`)),
    )
    expect(scenes.size).toBeGreaterThan(1)
  })
})

describe('buildRunCast (ADR 0002)', () => {
  const stakeholders = ['cfo', 'cto', 'head_of_product', 'support_lead', 'staff_engineer']

  it('gives every stakeholder a different role', () => {
    const cast = buildRunCast('seed-1', stakeholders)
    const roles = stakeholders.map((id) => cast[id])
    expect(new Set(roles).size).toBe(stakeholders.length)
  })

  it('gives distinct roles even to ids that the old id hash put on the same role', () => {
    // 'ab' and 'ba' have the same character sum, so `hash(id) % pool` matched them
    const cast = buildRunCast('seed-1', ['ab', 'ba'])
    expect(cast.ab).not.toBe(cast.ba)
  })

  it('is the same for the same seed, whatever order the stakeholders come in', () => {
    const first = buildRunCast('seed-1', stakeholders)
    const again = buildRunCast('seed-1', [...stakeholders].reverse())
    expect(again).toEqual(first)
  })

  it('varies between runs', () => {
    const casts = new Set(
      Array.from({ length: 20 }, (_, i) => JSON.stringify(buildRunCast(`seed-${i}`, stakeholders))),
    )
    expect(casts.size).toBeGreaterThan(10)
  })

  it('cycles through the pool when there are more stakeholders than roles', () => {
    const many = Array.from({ length: AVATAR_ROLE_ROTATION.length + 2 }, (_, i) => `s${String(i).padStart(2, '0')}`)
    const cast = buildRunCast('seed-1', many)
    const roles = many.map((id) => cast[id])
    expect(new Set(roles.slice(0, AVATAR_ROLE_ROTATION.length)).size).toBe(AVATAR_ROLE_ROTATION.length)
    expect(roles.every((role) => AVATAR_ROLE_ROTATION.includes(role))).toBe(true)
  })

  it("doesn't touch the simulation's random stream", () => {
    const before = createSeededRandom('seed-1')
    const expected = [before.next(), before.next(), before.next()]

    buildRunCast('seed-1', stakeholders)
    const after = createSeededRandom('seed-1')
    expect([after.next(), after.next(), after.next()]).toEqual(expected)
  })

  it('still gives a stable role to a stakeholder the cast does not know', () => {
    const cast = buildRunCast('seed-1', ['cfo'])
    expect(AVATAR_ROLE_ROTATION).toContain(castRoleFor(cast, 'stranger'))
    expect(castRoleFor(cast, 'stranger')).toBe(castRoleFor(cast, 'stranger'))
  })

  it('is the cast the stage uses', () => {
    const snapshot = Object.fromEntries(stakeholders.map((id) => [id, { satisfaction: 60 }]))
    const cast = buildRunCast('seed-1', stakeholders)
    const actors = buildGameplayStageActors(snapshot as never, {}, cast)
    for (const actor of actors) {
      expect(actor.avatarRole).toBe(cast[actor.id])
    }
  })
})
