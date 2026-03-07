import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  Card,
  DelayedEffect,
  Event,
  OutcomeArchetype,
  OutcomeTier,
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  VersionRef
} from '@/domains/content/model'
import { ContentProvider } from '@/domains/content/services/content_provider'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { assertValidBundle } from '@/domains/content/services/bundle_validator'

function createFileContentProvider(contentRoot: string): ContentProvider {
  async function loadJson<T extends { id: string; version: number }>(
    directory: string,
    ref: VersionRef
  ): Promise<T> {
    const filename = `${ref.id}-v${ref.version}.json`
    const filePath = path.join(contentRoot, directory, filename)
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw) as T

    if (parsed.id !== ref.id || parsed.version !== ref.version) {
      throw new Error(
        `Version mismatch in ${filename}: expected ${ref.id} v${ref.version}, got ${parsed.id} v${parsed.version}`
      )
    }

    return parsed
  }

  return {
    loadScenario: (ref) => loadJson<Scenario>('scenarios', ref),
    loadScore: (ref) => loadJson<Score>('scores', ref),
    loadStakeholder: (ref) => loadJson<Stakeholder>('stakeholders', ref),
    loadStakeholderReactionRule: (ref) => loadJson<StakeholderReactionRule>('stakeholder-reaction-rules', ref),
    loadCard: (ref) => loadJson<Card>('cards', ref),
    loadEvent: (ref) => loadJson<Event>('events', ref),
    loadDelayedEffect: (ref) => loadJson<DelayedEffect>('delayed-effects', ref),
    loadOutcomeTier: (ref) => loadJson<OutcomeTier>('outcome-tiers', ref),
    loadOutcomeArchetype: (ref) => loadJson<OutcomeArchetype>('outcome-archetypes', ref),
    loadPlayerClass: async (_ref) => {
      throw new Error('Player class loading is not required for scenario bundle construction')
    }
  }
}

describe('MVP content pack', () => {
  it('builds and validates the monolith scenario bundle from authored content', async () => {
    const contentRoot = path.resolve(__dirname, '../../content')
    const provider = createFileContentProvider(contentRoot)

    const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

    expect(() => assertValidBundle(bundle)).not.toThrow()

    expect(bundle.scenario.id).toBe('monolith_of_mild_despair')
    expect(bundle.scenario.max_turns).toBe(8)
    expect(bundle.scores.size).toBe(6)
    expect(bundle.stakeholders.size).toBe(4)
    expect(bundle.stakeholder_reaction_rules.size).toBe(8)
    expect(bundle.cards.size).toBe(10)
    expect(bundle.events.size).toBe(5)
    expect(bundle.delayed_effects.size).toBe(7)
    expect(bundle.outcome_tiers.size).toBe(5)
    expect(bundle.outcome_archetypes.size).toBe(5)
  })

  it('resolves stakeholder rules and delayed effects transitively with no missing references', async () => {
    const contentRoot = path.resolve(__dirname, '../../content')
    const provider = createFileContentProvider(contentRoot)

    const bundle = await buildScenarioBundle('monolith_of_mild_despair', 1, provider)

    for (const stakeholder of bundle.stakeholders.values()) {
      for (const ruleRef of stakeholder.reaction_rule_refs) {
        const key = `${ruleRef.id}-v${ruleRef.version}`
        expect(bundle.stakeholder_reaction_rules.has(key)).toBe(true)
      }
    }

    for (const card of bundle.cards.values()) {
      for (const delayedEffectRef of card.delayed_effect_refs) {
        const key = `${delayedEffectRef.id}-v${delayedEffectRef.version}`
        expect(bundle.delayed_effects.has(key)).toBe(true)
      }
    }

    for (const event of bundle.events.values()) {
      for (const delayedEffectRef of event.delayed_effect_refs) {
        const key = `${delayedEffectRef.id}-v${delayedEffectRef.version}`
        expect(bundle.delayed_effects.has(key)).toBe(true)
      }
    }
  })
})
