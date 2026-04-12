import { describe, expect, it } from 'vitest'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { auditStructuralContent } from '@/domains/simulation/services/audit/structural_content_audit'
import { createMockContentProvider } from '../content/test_helpers'
import type { ScenarioBundle } from '@/domains/content/model/scenario_bundle'
import type { Scenario, Stakeholder, StakeholderReactionRule, Card, Event } from '@/domains/content/model/content_types'

async function createTestBundle(): Promise<ScenarioBundle> {
  return buildScenarioBundle('test_scenario', 1, createMockContentProvider())
}

function makeMinimalBundle(overrides: Partial<ScenarioBundle> = {}): ScenarioBundle {
  const scenario: Scenario = {
    id: 'healthy_scenario', version: 1, name: 'Healthy', description: '',
    short_description: '', flavor_text: '', max_turns: 8,
    starting_scores: { budget: 60 },
    score_refs: [], stakeholder_refs: [], card_refs: [], event_refs: [],
    outcome_tier_refs: [], outcome_archetype_refs: [],
  }

  const positiveRule: StakeholderReactionRule = {
    id: 'cto_happy', version: 1, name: 'CTO Happy', description: '',
    condition_description: 'delivery > 60',
    score_changes: [],
    stakeholder_changes: [{ stakeholder_id: 'cto', delta: 6 }],
  }

  const negativeRule: StakeholderReactionRule = {
    id: 'cto_sad', version: 1, name: 'CTO Sad', description: '',
    condition_description: 'clarity < 40',
    score_changes: [],
    stakeholder_changes: [{ stakeholder_id: 'cto', delta: -5 }],
  }

  const stakeholder: Stakeholder = {
    id: 'cto', version: 1, name: 'CTO', description: '',
    reaction_rule_refs: [
      { id: 'cto_happy', version: 1 },
      { id: 'cto_sad', version: 1 },
    ],
  }

  const card: Card = {
    id: 'refactor', version: 1, name: 'Refactor', description: '',
    score_changes: [{ score_id: 'budget', delta: -2 }],
    stakeholder_changes: [{ stakeholder_id: 'cto', delta: 3 }],
    delayed_effect_refs: [],
  }

  const event: Event = {
    id: 'good_event', version: 1, name: 'Good Event', description: '',
    occurrence_weight: 4,
    score_changes: [{ score_id: 'budget', delta: 8 }],
    stakeholder_changes: [{ stakeholder_id: 'cto', delta: 2 }],
    delayed_effect_refs: [],
  }

  const negEvent: Event = {
    id: 'bad_event', version: 1, name: 'Bad Event', description: '',
    occurrence_weight: 4,
    score_changes: [{ score_id: 'budget', delta: -5 }],
    stakeholder_changes: [{ stakeholder_id: 'cto', delta: -2 }],
    delayed_effect_refs: [],
  }

  return {
    scenario,
    scores: new Map(),
    stakeholders: new Map([['cto-v1', stakeholder]]),
    stakeholder_reaction_rules: new Map([
      ['cto_happy-v1', positiveRule],
      ['cto_sad-v1', negativeRule],
    ]),
    cards: new Map([['refactor-v1', card]]),
    events: new Map([['good_event-v1', event], ['bad_event-v1', negEvent]]),
    delayed_effects: new Map(),
    outcome_tiers: new Map(),
    outcome_archetypes: new Map(),
    ...overrides,
  }
}

describe('auditStructuralContent', () => {
  it('returns an array of AuditFinding objects with correct shape', async () => {
    const bundle = await createTestBundle()
    const findings = auditStructuralContent(bundle)

    expect(Array.isArray(findings)).toBe(true)
    for (const f of findings) {
      expect(typeof f.id).toBe('string')
      expect(['info', 'warning', 'critical']).toContain(f.severity)
      expect(typeof f.category).toBe('string')
      expect(typeof f.title).toBe('string')
      expect(Array.isArray(f.evidence)).toBe(true)
      expect(f.recommended_fix_surface).toBe('content')
    }
  })

  it('flags thin rule set for stakeholder with fewer than 2 rules', async () => {
    // Mock tech_lead has 1 rule
    const bundle = await createTestBundle()
    const findings = auditStructuralContent(bundle)

    const finding = findings.find(f => f.id.includes('thin_rule_set.tech_lead'))
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('warning')
  })

  it('flags no_positive_rule_path for stakeholder with only negative rules', async () => {
    const bundle = await createTestBundle()
    const findings = auditStructuralContent(bundle)

    const finding = findings.find(f => f.id.includes('no_positive_rule_path.tech_lead'))
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('critical')
    expect(finding!.category).toBe('stakeholder_balance')
  })

  it('flags absent stakeholder_changes across the entire card set', async () => {
    const bundle = await createTestBundle()
    const findings = auditStructuralContent(bundle)

    const finding = findings.find(f => f.id === 'structural.no_card_stakeholder_changes')
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('warning')
    expect(finding!.category).toBe('card_ecosystem')
  })

  it('flags negative event pool skew', async () => {
    // Mock bundle has only one event: production_incident with negative score
    const bundle = await createTestBundle()
    const findings = auditStructuralContent(bundle)

    const finding = findings.find(f => f.id === 'structural.event_pool_negative_skew')
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('warning')
    expect(finding!.category).toBe('event_fairness')
  })

  it('flags events with no stakeholder_changes', async () => {
    const bundle = await createTestBundle()
    const findings = auditStructuralContent(bundle)

    const finding = findings.find(f => f.id === 'structural.no_event_stakeholder_changes')
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('info')
  })

  it('emits no findings for a balanced healthy bundle', () => {
    const bundle = makeMinimalBundle()
    const findings = auditStructuralContent(bundle)
    expect(findings).toHaveLength(0)
  })

  it('flags rule magnitude asymmetry when negative delta is 2× positive', () => {
    const bigNegRule: StakeholderReactionRule = {
      id: 'cto_very_sad', version: 1, name: 'CTO Very Sad', description: '',
      condition_description: 'failure',
      score_changes: [],
      stakeholder_changes: [{ stakeholder_id: 'cto', delta: -14 }],
    }

    const smallPosRule: StakeholderReactionRule = {
      id: 'cto_slightly_happy', version: 1, name: 'CTO Slightly Happy', description: '',
      condition_description: 'ok',
      score_changes: [],
      stakeholder_changes: [{ stakeholder_id: 'cto', delta: 4 }],
    }

    const stakeholder: Stakeholder = {
      id: 'cto', version: 1, name: 'CTO', description: '',
      reaction_rule_refs: [
        { id: 'cto_very_sad', version: 1 },
        { id: 'cto_slightly_happy', version: 1 },
      ],
    }

    const bundle = makeMinimalBundle({
      stakeholders: new Map([['cto-v1', stakeholder]]),
      stakeholder_reaction_rules: new Map([
        ['cto_very_sad-v1', bigNegRule],
        ['cto_slightly_happy-v1', smallPosRule],
      ]),
    })

    const findings = auditStructuralContent(bundle)
    const asymmetry = findings.find(f => f.id.includes('rule_magnitude_asymmetry.cto'))
    expect(asymmetry).toBeDefined()
    expect(asymmetry!.severity).toBe('warning')
  })

  it('produces identical findings for the same bundle (determinism)', async () => {
    const bundle = await createTestBundle()
    const first = auditStructuralContent(bundle)
    const second = auditStructuralContent(bundle)
    expect(first).toEqual(second)
  })
})
