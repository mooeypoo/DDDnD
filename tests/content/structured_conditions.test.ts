/**
 * Structured conditions (M1.4).
 *
 * Reaction rules and conditional events used to be evaluated by parsing their
 * English prose at runtime. They now carry explicit `condition` /
 * `trigger_condition` objects, and the prose is for people only.
 */

import { readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { createEmptyBundle, addToBundle, type ScenarioBundle, type StakeholderReactionRule } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { validateScenarioBundle } from '@/domains/content/services/bundle_validator'
import { ContentSchemaError, parseContentEntity } from '@/domains/content/validation'
import { resolveStakeholderRules } from '@/domains/simulation/rules/resolve_stakeholder_rules'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'
import { parseConditionDescription } from './support/legacy_condition_parser'

const PACK_ROOTS = ['content', 'content/tutorial'].map((root) => path.resolve(root))

async function playableFirstPartyBundles(): Promise<Array<{ label: string; bundle: ScenarioBundle }>> {
  const bundles: Array<{ label: string; bundle: ScenarioBundle }> = []
  for (const root of PACK_ROOTS) {
    const provider = createFileContentProvider(root)
    for (const file of readdirSync(path.join(root, 'scenarios'))) {
      const match = file.match(/^(.+)-v(\d+)\.json$/)
      if (!match) continue
      const bundle = await buildScenarioBundle(match[1], Number(match[2]), provider)
      // Retired scenario versions that no longer pass bundle validation cannot be
      // played, so their rules' behavior there is moot.
      if (validateScenarioBundle(bundle).valid) {
        bundles.push({ label: file, bundle })
      }
    }
  }
  return bundles
}

describe('first-party structured conditions match their prose', () => {
  it('every rule and conditional event says in data exactly what its text says', async () => {
    const bundles = await playableFirstPartyBundles()
    expect(bundles.length).toBeGreaterThanOrEqual(7)

    let checked = 0
    for (const { label, bundle } of bundles) {
      for (const [key, rule] of bundle.stakeholder_reaction_rules) {
        expect(rule.condition, `${label} ${key}`).toEqual(parseConditionDescription(rule.condition_description, bundle))
        checked += 1
      }
      for (const [key, event] of bundle.events) {
        if (event.trigger_condition_description) {
          expect(event.trigger_condition, `${label} ${key}`).toEqual(
            parseConditionDescription(event.trigger_condition_description, bundle),
          )
          checked += 1
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
  })
})

describe('structured condition schema rules', () => {
  const ref = { id: 'sample', version: 1 }
  const baseRule = {
    id: 'sample',
    version: 1,
    name: 'Rule',
    description: 'A rule',
    condition_description: 'Budget < 30',
    score_changes: [],
  }

  function issuesOf(fn: () => unknown) {
    try {
      fn()
    } catch (error) {
      if (error instanceof ContentSchemaError) return error.issues
      throw error
    }
    throw new Error('Expected ContentSchemaError')
  }

  it('requires a structured condition on reaction rules', () => {
    expect(issuesOf(() => parseContentEntity('stakeholder-reaction-rules', ref, baseRule)))
      .toEqual([{ path: 'condition', message: 'is required' }])
  })

  it('requires trigger_condition whenever an event describes one', () => {
    const event = {
      id: 'sample',
      version: 1,
      name: 'Event',
      description: 'An event',
      occurrence_weight: 1,
      score_changes: [],
      delayed_effect_refs: [],
      trigger_condition_description: 'Budget < 30',
    }
    expect(issuesOf(() => parseContentEntity('events', ref, event))).toEqual([
      expect.objectContaining({ path: 'trigger_condition' }),
    ])
    expect(() => parseContentEntity('events', ref, {
      ...event,
      trigger_condition: { target_type: 'score', target_id: 'budget', operator: '<', value: 30 },
    })).not.toThrow()
  })
})

function bundleWithRule(rule: StakeholderReactionRule): ScenarioBundle {
  const bundle = createEmptyBundle({
    id: 'scenario',
    version: 1,
    name: 'Scenario',
    description: 'Scenario',
    max_turns: 5,
    starting_scores: { budget: 50 },
    score_refs: [{ id: 'budget', version: 1 }],
    stakeholder_refs: [{ id: 'cfo', version: 1 }],
    card_refs: [],
    event_refs: [],
  })
  addToBundle(bundle, 'score', { id: 'budget', version: 1, name: 'Budget', short_name: 'Gold', description: 'Money', default_value: 50 })
  addToBundle(bundle, 'stakeholder', { id: 'cfo', version: 1, name: 'CFO', description: 'Money person', reaction_rule_refs: [{ id: rule.id, version: rule.version }] })
  addToBundle(bundle, 'stakeholder_reaction_rule', rule)
  return bundle
}

describe('bundle validation of condition targets', () => {
  const rule = (condition: StakeholderReactionRule['condition']): StakeholderReactionRule => ({
    id: 'cfo_rule',
    version: 1,
    name: 'CFO rule',
    description: 'A rule',
    condition_description: 'whatever',
    condition,
    score_changes: [],
  })

  it('accepts conditions on tracked scores and present stakeholders', () => {
    expect(validateScenarioBundle(bundleWithRule(rule({ target_type: 'score', target_id: 'budget', operator: '<', value: 30 }))).valid).toBe(true)
    expect(validateScenarioBundle(bundleWithRule(rule({ target_type: 'stakeholder', target_id: 'cfo', operator: '<', value: 30 }))).valid).toBe(true)
  })

  it('rejects a condition on a score the scenario does not track (it would silently read 0)', () => {
    const result = validateScenarioBundle(bundleWithRule(rule({ target_type: 'score', target_id: 'maintainability', operator: '<', value: 45 })))
    expect(result.errors).toEqual([expect.objectContaining({ type: 'untracked_score', details: expect.objectContaining({ sourceType: 'reaction_condition' }) })])
  })

  it('rejects a condition on a stakeholder that is not in the scenario', () => {
    const result = validateScenarioBundle(bundleWithRule(rule({ target_type: 'stakeholder', target_id: 'ghost', operator: '<', value: 30 })))
    expect(result.errors).toEqual([expect.objectContaining({ type: 'unknown_condition_stakeholder' })])
  })
})

describe('the engine reads structured conditions only', () => {
  it('ignores the prose and evaluates the structured condition', () => {
    const misleadingProse: StakeholderReactionRule = {
      id: 'cfo_rule',
      version: 1,
      name: 'CFO rule',
      description: 'A rule',
      condition_description: 'Budget > 0',
      condition: { target_type: 'score', target_id: 'budget', operator: '<', value: 10 },
      score_changes: [{ score_id: 'budget', delta: -1 }],
    }
    const bundle = bundleWithRule(misleadingProse)

    const notFiring = resolveStakeholderRules(bundle, { scores: { budget: 50 }, stakeholders: { cfo: { satisfaction: 50 } } as never })
    expect(notFiring.stakeholder_resolution.reactions).toHaveLength(0)

    const firing = resolveStakeholderRules(bundle, { scores: { budget: 5 }, stakeholders: { cfo: { satisfaction: 50 } } as never })
    expect(firing.stakeholder_resolution.reactions).toHaveLength(1)
  })
})
