/**
 * The council (docs/PACK_STUDIO.md M4.5, D21): who sits at the scenario's
 * table. The game's members are seated or left out, never copied; the
 * draft's own members are made and edited, with their own reactions.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  addReaction,
  addToCouncil,
  checkDraft,
  copyToEdit,
  createOwnMember,
  draftFromBaseScenario,
  exportDraftBundle,
  isOwnMember,
  ownReactionsTo,
  putContent,
  removeFromCouncil,
  removeReaction,
  setReactionCondition,
  settleNewMemberId,
  settleNewReactionId,
  type DraftPack,
  type FirstPartyPack,
} from '@/domains/authoring'
import type { Card, ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { firstPartyPackKey, packKeyOf } from '@/domains/content/services/pack_identity'
import { createSnapshotContentProvider } from '@/domains/content/services/pack_snapshot_builder'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOTS = { base: path.resolve('content'), tutorial: path.resolve('content/tutorial') }
const AUTHOR = [{ name: 'Test Author' }]
const MONOLITH = { id: 'monolith_of_mild_despair', version: 2 }
const CTO = { id: 'cto', version: 1 }

function firstParty(): FirstPartyPack[] {
  return (Object.keys(ROOTS) as Array<keyof typeof ROOTS>).map((id) => ({
    manifest: JSON.parse(readFileSync(path.join(ROOTS[id], 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(ROOTS[id]),
  }))
}

function baseRegistry() {
  const registry = new ContentPackRegistry()
  for (const pack of firstParty()) registry.registerPack(pack.manifest, pack.provider)
  return { registry, provider: registry.createScopedProvider(firstPartyPackKey('base')) }
}

async function monolith(): Promise<{ draft: DraftPack; scenarioId: string }> {
  return draftFromBaseScenario(baseRegistry().provider, MONOLITH, { name: 'Ours', prefix: 'ours', authors: AUTHOR })
}

const scenarioOf = (draft: DraftPack) => Object.values(draft.content.scenarios)[0]
const named = (draft: DraftPack, id: string, name: string, description = 'Someone with opinions.') =>
  putContent(draft, 'stakeholders', { ...draft.content.stakeholders[id], name, description })

describe('the game\'s council members', () => {
  it('can be left out: unseated, their floor dropped, and the pack still checks out', async () => {
    const { draft } = await monolith()
    expect(scenarioOf(draft).balance_targets?.min_avg_stakeholder_satisfaction).toHaveProperty('cto')
    const without = removeFromCouncil(draft, CTO)
    expect(scenarioOf(without).stakeholder_refs).not.toContainEqual(CTO)
    expect(scenarioOf(without).balance_targets?.min_avg_stakeholder_satisfaction).not.toHaveProperty('cto')
    expect((await checkDraft(without, firstParty())).issues).toEqual([])
  })

  it('stop being named by the draft\'s own cards when left out', async () => {
    const { provider } = baseRegistry()
    const { draft } = await monolith()
    const cardRef = scenarioOf(draft).card_refs.find((ref) => ref.id === 'define_bounded_context')!
    const copied = copyToEdit(draft, 'cards', await provider.loadCard(cardRef))
    const withCto = putContent(copied.draft, 'cards', {
      ...(copied.draft.content.cards[copied.id] as Card),
      stakeholder_changes: [{ stakeholder_id: 'cto', delta: 4 }, { stakeholder_id: 'vp_product', delta: -2 }],
    })
    expect(ownReactionsTo(withCto, 'cto').map((item) => item.id)).toEqual([copied.id])

    const without = removeFromCouncil(withCto, CTO)
    expect(without.content.cards[copied.id].stakeholder_changes).toEqual([{ stakeholder_id: 'vp_product', delta: -2 }])
    expect(ownReactionsTo(without, 'cto')).toEqual([])
  })

  it('can be seated again, once', async () => {
    const { draft } = await monolith()
    const back = addToCouncil(addToCouncil(removeFromCouncil(draft, CTO), CTO), CTO)
    expect(scenarioOf(back).stakeholder_refs.filter((ref) => ref.id === 'cto')).toHaveLength(1)
    expect(isOwnMember(back, CTO)).toBe(false)
  })
})

describe('the draft\'s own council members', () => {
  it('are seated when made, and take the id of their name once named', async () => {
    const made = createOwnMember((await monolith()).draft)
    expect(made.id).toBe('ours_new_council_member')
    expect(scenarioOf(made.draft).stakeholder_refs).toContainEqual({ id: made.id, version: 1 })

    const settled = settleNewMemberId(named(made.draft, made.id, 'Head of Payments'), made.id)
    expect(settled.id).toBe('ours_head_of_payments')
    expect(scenarioOf(settled.draft).stakeholder_refs).toContainEqual({ id: 'ours_head_of_payments', version: 1 })
    expect(scenarioOf(settled.draft).stakeholder_refs).not.toContainEqual({ id: made.id, version: 1 })
    // An id never changes after that
    expect(settleNewMemberId(named(settled.draft, settled.id, 'Payments Lead'), settled.id).id).toBe(settled.id)
  })

  it('keep their reactions and the cards that move them when their id settles', async () => {
    const made = createOwnMember((await monolith()).draft)
    const reaction = addReaction(made.draft, made.id, { id: 'budget', name: 'Budget' })
    const settled = settleNewMemberId(named(reaction.draft, made.id, 'Head of Payments'), made.id)
    const rule = settled.draft.content.stakeholder_reaction_rules[reaction.id]
    expect(rule.stakeholder_changes).toEqual([{ stakeholder_id: 'ours_head_of_payments', delta: -3 }])
    expect(settled.draft.content.stakeholders.ours_head_of_payments.reaction_rule_refs).toEqual([{ id: reaction.id, version: 1 }])
  })

  it('react in the game: their reaction fires, and they finish the run at the table', async () => {
    const started = await monolith()
    const made = createOwnMember(removeFromCouncil(started.draft, CTO))
    let draft = settleNewMemberId(named(made.draft, made.id, 'Head of Payments', 'Owns the money path.'), made.id).draft
    const memberId = 'ours_head_of_payments'
    // Budget is always above 0, so this reaction fires every turn: a visible, testable effect
    const reaction = addReaction(draft, memberId, { id: 'budget', name: 'Budget' })
    draft = setReactionCondition(reaction.draft, reaction.id, { target_type: 'score', target_id: 'budget', operator: '>', value: 0 }, 'Budget')
    draft = putContent(draft, 'stakeholder_reaction_rules', {
      ...draft.content.stakeholder_reaction_rules[reaction.id],
      name: 'Pleased by a Healthy Budget',
      description: 'Money in the bank makes them calm.',
      stakeholder_changes: [{ stakeholder_id: memberId, delta: 2 }],
    })
    const reactionId = settleNewReactionId(draft, memberId, reaction.id)
    draft = reactionId.draft
    expect(reactionId.id).toBe('ours_pleased_by_a_healthy_budget')
    expect(draft.content.stakeholder_reaction_rules[reactionId.id].condition_description).toBe('Budget > 0')

    const exported = await exportDraftBundle(draft, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))

    const snapshot = await readPackBundle(exported.text, exported.file_name)
    const { registry } = baseRegistry()
    const key = packKeyOf(snapshot)
    registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), key)
    const bundle = await buildScenarioBundle(started.scenarioId, 1, registry.createScopedProvider(key))
    const runs = simulate_runs({ scenario_bundle: bundle, runs: 5, seed: 'council', play_policy: 'player_true' }).per_run
    for (const run of runs) {
      expect(Object.keys(run.final_stakeholder_satisfaction)).toContain(memberId)
      expect(Object.keys(run.final_stakeholder_satisfaction)).not.toContain('cto')
      expect(run.final_stakeholder_satisfaction[memberId]).toBeGreaterThan(50)
    }
  })

  it('go with their reactions when deleted, and the pack still checks out', async () => {
    const made = createOwnMember((await monolith()).draft)
    let draft = named(made.draft, made.id, 'Temporary Person')
    const reaction = addReaction(draft, made.id, { id: 'budget', name: 'Budget' })
    draft = removeFromCouncil(reaction.draft, { id: made.id, version: 1 })
    expect(draft.content.stakeholders).not.toHaveProperty(made.id)
    expect(draft.content.stakeholder_reaction_rules).not.toHaveProperty(reaction.id)
    expect(scenarioOf(draft).stakeholder_refs).not.toContainEqual({ id: made.id, version: 1 })
    expect((await checkDraft(draft, firstParty())).issues).toEqual([])
  })

  it('lose one reaction without losing the rest', async () => {
    const made = createOwnMember((await monolith()).draft)
    const first = addReaction(made.draft, made.id, { id: 'budget', name: 'Budget' })
    const second = addReaction(first.draft, made.id, { id: 'team_morale', name: 'Team Morale' })
    const draft = removeReaction(second.draft, made.id, first.id)
    expect(draft.content.stakeholders[made.id].reaction_rule_refs).toEqual([{ id: second.id, version: 1 }])
    expect(draft.content.stakeholder_reaction_rules).not.toHaveProperty(first.id)
  })
})

describe('conditions in plain words', () => {
  it('reads every comparison the game uses', async () => {
    const { describeCondition } = await import('@/domains/authoring')
    const at = (operator: '<' | '<=' | '>' | '>=' | '=' | '==') => describeCondition({ target_type: 'score', target_id: 'budget', operator, value: 25 }, 'Budget')
    expect(['<', '<=', '>', '>=', '='].map((op) => at(op as never))).toEqual([
      'Budget drops below 25', 'Budget is at most 25', 'Budget rises above 25', 'Budget is at least 25', 'Budget is exactly 25',
    ])
  })
})

describe('copying one of the game\'s members to a new member', () => {
  it('copies the description and reactions as the draft\'s own, aimed at the copy, seated beside the original', async () => {
    const { copyMember } = await import('@/domains/authoring')
    const { provider } = baseRegistry()
    const { draft } = await monolith()
    const cto = await provider.loadStakeholder(CTO)
    const rules = await Promise.all(cto.reaction_rule_refs.map((ref) => provider.loadStakeholderReactionRule(ref)))
    const copied = copyMember(draft, cto, rules)

    expect(copied.id).toBe('ours_chief_technology_officer')
    const member = copied.draft.content.stakeholders[copied.id]
    expect(member).toMatchObject({ name: 'Chief Technology Officer (copy)', description: cto.description, version: 1 })
    expect(member.reaction_rule_refs).toHaveLength(rules.length)
    for (const ref of member.reaction_rule_refs) {
      const rule = copied.draft.content.stakeholder_reaction_rules[ref.id]
      expect(rule.id.startsWith('ours_')).toBe(true)
      expect(JSON.stringify(rule.stakeholder_changes ?? [])).not.toContain('"cto"')
    }
    expect(copied.draft.content.stakeholder_reaction_rules[member.reaction_rule_refs[0].id].stakeholder_changes)
      .toContainEqual({ stakeholder_id: copied.id, delta: -5 })
    expect(scenarioOf(copied.draft).stakeholder_refs).toEqual(expect.arrayContaining([CTO, { id: copied.id, version: 1 }]))
    // The game's CTO is untouched
    expect((await provider.loadStakeholder(CTO)).name).toBe('Chief Technology Officer')
    expect((await checkDraft(copied.draft, firstParty())).issues).toEqual([])
  })
})
