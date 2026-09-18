import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type {
  Card,
  DelayedEffect,
  Event,
  OutcomeArchetype,
  OutcomeTier,
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  VersionRef,
} from '@/domains/content/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { create_engine } from '@/domains/simulation/services'

function createFileContentProvider(contentRoot: string): ContentProvider {
  async function loadJson<T extends { id: string; version: number }>(
    directory: string,
    ref: VersionRef,
  ): Promise<T> {
    const filename = `${ref.id}-v${ref.version}.json`
    const filePath = path.join(contentRoot, directory, filename)
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw) as T

    if (parsed.id !== ref.id || parsed.version !== ref.version) {
      throw new Error(
        `Version mismatch in ${filename}: expected ${ref.id} v${ref.version}, got ${parsed.id} v${parsed.version}`,
      )
    }

    return parsed
  }

  return {
    loadScenario: (ref) => loadJson<Scenario>('scenarios', ref),
    loadScore: (ref) => loadJson<Score>('scores', ref),
    loadStakeholder: (ref) => loadJson<Stakeholder>('stakeholders', ref),
    loadStakeholderReactionRule: (ref) =>
      loadJson<StakeholderReactionRule>('stakeholder-reaction-rules', ref),
    loadCard: (ref) => loadJson<Card>('cards', ref),
    loadEvent: (ref) => loadJson<Event>('events', ref),
    loadDelayedEffect: (ref) => loadJson<DelayedEffect>('delayed-effects', ref),
    loadOutcomeTier: (ref) => loadJson<OutcomeTier>('outcome-tiers', ref),
    loadOutcomeArchetype: (ref) => loadJson<OutcomeArchetype>('outcome-archetypes', ref),
    loadPlayerClass: async () => {
      throw new Error('Player class loading is not required for this scenario')
    },
    loadChallengeModifier: async () => {
      throw new Error('Challenge modifier loading is not required for this scenario')
    },
  }
}

describe('Systems Under Pressure recoverability', () => {
  it('deals recovery into the post-collapse hand and leaves Rest in the Grimoire', async () => {
    const contentRoot = path.resolve(__dirname, '../../content/tutorial')
    const bundle = await buildScenarioBundle(
      'tutorial_systems_under_pressure',
      1,
      createFileContentProvider(contentRoot),
    )
    const engine = create_engine({ scenario_bundle: bundle, seed: 'pressure-recover' })
    const opening = engine.create_run()
    const openingBriefing = engine.get_turn_briefing()

    expect(opening.hand_state.hand_refs.map((ref) => ref.id)).toEqual([
      'tutorial_push_through',
      'tutorial_deep_refactor',
      'tutorial_quick_patch',
      'tutorial_clean_up_code',
      'tutorial_stabilize_system',
      'tutorial_rally_the_guild',
    ])
    expect(opening.hand_state.deck_refs.map((ref) => ref.id)).toEqual([
      'tutorial_call_in_help',
      'tutorial_rest_the_team',
    ])
    expect(openingBriefing.can_consult_archives).toBe(true)

    const afterPush = engine.play_turn('tutorial_push_through')
    const collapsed = afterPush.game_state.scores

    expect(collapsed.team_capacity).toBeLessThan(25)
    expect(collapsed.system_health).toBeLessThan(25)
    expect(afterPush.game_state.hand_state.hand_refs.map((ref) => ref.id)).toContain('tutorial_call_in_help')
    expect(afterPush.game_state.hand_state.hand_refs.map((ref) => ref.id)).toContain('tutorial_rally_the_guild')
    expect(afterPush.game_state.hand_state.hand_refs.map((ref) => ref.id)).toContain('tutorial_stabilize_system')
    expect(afterPush.game_state.hand_state.deck_refs.map((ref) => ref.id)).toContain('tutorial_rest_the_team')
    expect(afterPush.game_state.hand_state.hand_refs.map((ref) => ref.id)).not.toContain('tutorial_rest_the_team')
    expect(engine.get_turn_briefing().can_consult_archives).toBe(true)

    engine.consult_archives(['tutorial_deep_refactor'], 'tutorial_rest_the_team')
    expect(engine.get_turn_briefing().available_action_card_ids).toContain('tutorial_rest_the_team')

    const afterRest = engine.play_turn('tutorial_rest_the_team')
    expect(afterRest.game_state.scores.team_capacity).toBeGreaterThanOrEqual(25)

    const afterRally = engine.play_turn('tutorial_rally_the_guild')
    expect(afterRally.game_state.scores.team_capacity).toBeGreaterThanOrEqual(25)
    expect(afterRally.game_state.scores.system_health).toBeGreaterThanOrEqual(25)
  })
})
