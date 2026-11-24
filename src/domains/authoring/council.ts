/**
 * The council: who sits at the scenario's table (docs/PACK_STUDIO.md §4.1, D21).
 *
 * The scenario decides who takes part. Anyone not seated simply doesn't, and
 * changes aimed at them do nothing (journal M3.9), so the game's council
 * members a draft doesn't want can just be left out.
 *
 * The game's council members can't be copied to edit (D21): the game's cards
 * and events name them by id, and a copy has a new id, so the deck would stop
 * reaching it. Authors seat their own members instead, with their own
 * reactions, and change how a game card treats the council by making their
 * own version of the card.
 */

import type { NumericCondition, Scenario, StakeholderChange, VersionRef } from '../content/model'
import { CONTENT_LIMITS } from '../content/validation/content_limits'
import { addContent, putContent, removeContent, type DraftPack } from './draft_pack'
import { settlePlaceholderId } from './placeholder_ids'

/** The most council members a scenario seats (the game's own limit). */
export const COUNCIL_SEATS = CONTENT_LIMITS.counts.stakeholder_refs

/** Names new members and reactions start with, before the author names them. */
export const COUNCIL_PLACEHOLDERS = { member: 'New council member', reaction: 'New reaction' } as const

/** True when the member is the draft's own (editable), not the game's. */
export function isOwnMember(draft: DraftPack, ref: VersionRef): boolean {
  const own = draft.content.stakeholders[ref.id]
  return own !== undefined && own.version === ref.version
}

function mapScenarios(draft: DraftPack, change: (scenario: Scenario) => Scenario | null): DraftPack {
  let next = draft
  for (const scenario of Object.values(draft.content.scenarios)) {
    const changed = change(scenario)
    if (changed) next = putContent(next, 'scenarios', changed)
  }
  return next
}

/** Seats a member in every scenario (once). */
export function addToCouncil(draft: DraftPack, ref: VersionRef): DraftPack {
  return mapScenarios(draft, (scenario) =>
    scenario.stakeholder_refs.some((existing) => existing.id === ref.id)
      ? null
      : { ...scenario, stakeholder_refs: [...scenario.stakeholder_refs, { id: ref.id, version: ref.version }] })
}

type WithPeople = { stakeholder_changes?: StakeholderChange[] }
const PEOPLE_SECTIONS = ['cards', 'events', 'delayed_effects', 'stakeholder_reaction_rules'] as const

/** The draft's own content that changes how this member feels. */
export function ownReactionsTo(draft: DraftPack, stakeholderId: string): Array<{ section: (typeof PEOPLE_SECTIONS)[number]; id: string; name: string }> {
  return PEOPLE_SECTIONS.flatMap((section) =>
    Object.values(draft.content[section] as Record<string, WithPeople & { id: string; name: string }>)
      .filter((item) => item.stakeholder_changes?.some((change) => change.stakeholder_id === stakeholderId))
      .map((item) => ({ section, id: item.id, name: item.name })))
}

function withoutPerson<T extends WithPeople>(item: T, stakeholderId: string): T {
  const kept = (item.stakeholder_changes ?? []).filter((change) => change.stakeholder_id !== stakeholderId)
  const next = { ...item }
  if (kept.length) next.stakeholder_changes = kept
  else delete next.stakeholder_changes
  return next
}

/**
 * Takes a member out of every scenario: they no longer take part. Their
 * satisfaction floor goes too (it can only name someone at the table), and
 * the draft's own content stops naming them (those changes would do nothing).
 * The draft's own member is deleted with their reactions; the game's is only
 * unseated, so taking them out can't affect anything outside this pack.
 */
export function removeFromCouncil(draft: DraftPack, ref: VersionRef): DraftPack {
  const own = isOwnMember(draft, ref)
  let next = mapScenarios(draft, (scenario) => {
    if (!scenario.stakeholder_refs.some((existing) => existing.id === ref.id)) return null
    const updated: Scenario = { ...scenario, stakeholder_refs: scenario.stakeholder_refs.filter((existing) => existing.id !== ref.id) }
    const targets = scenario.balance_targets
    const floors = targets?.min_avg_stakeholder_satisfaction
    if (targets && floors && ref.id in floors) {
      const kept = { ...floors }
      delete kept[ref.id]
      updated.balance_targets = { ...targets, min_avg_stakeholder_satisfaction: kept }
    }
    return updated
  })
  if (own) {
    for (const rule of draft.content.stakeholders[ref.id].reaction_rule_refs) {
      if (next.content.stakeholder_reaction_rules[rule.id]?.version === rule.version) next = removeContent(next, 'stakeholder_reaction_rules', rule.id)
    }
    next = removeContent(next, 'stakeholders', ref.id)
  }
  for (const { section, id } of ownReactionsTo(next, ref.id)) {
    next = putContent(next, section, withoutPerson(next.content[section][id] as never, ref.id))
  }
  return next
}

/** A new member of the draft's own, seated at the table. The author fills them in. */
export function createOwnMember(draft: DraftPack, name: string = COUNCIL_PLACEHOLDERS.member): { draft: DraftPack; id: string } {
  const added = addContent(draft, 'stakeholders', { name, description: '', reaction_rule_refs: [] })
  return { draft: addToCouncil(added.draft, { id: added.id, version: 1 }), id: added.id }
}

/** Gives a new member the id of their name, once named (see placeholder_ids). */
export function settleNewMemberId(draft: DraftPack, id: string): { draft: DraftPack; id: string } {
  return settlePlaceholderId(draft, 'stakeholders', id, COUNCIL_PLACEHOLDERS.member, (moved, oldId, newId) => {
    let next = mapScenarios(moved, (scenario) =>
      scenario.stakeholder_refs.some((ref) => ref.id === oldId)
        ? { ...scenario, stakeholder_refs: scenario.stakeholder_refs.map((ref) => (ref.id === oldId ? { id: newId, version: ref.version } : ref)) }
        : null)
    for (const { section, id: itemId } of ownReactionsTo(next, oldId)) {
      const item = next.content[section][itemId] as WithPeople
      next = putContent(next, section, {
        ...item,
        stakeholder_changes: item.stakeholder_changes!.map((change) => (change.stakeholder_id === oldId ? { ...change, stakeholder_id: newId } : change)),
      } as never)
    }
    return next
  })
}

/** Comparisons a reaction can wait for, in words (§4.1). Equality is left out: scores rarely land on one number. */
export const CONDITION_WORDS: Record<'<' | '<=' | '>' | '>=', string> = {
  '<': 'drops below',
  '<=': 'is at most',
  '>': 'rises above',
  '>=': 'is at least',
}

/** A condition in plain words: "Budget drops below 25". Any of the game's comparisons. */
export function describeCondition(condition: NumericCondition, targetName: string): string {
  const words: Record<NumericCondition['operator'], string> = { ...CONDITION_WORDS, '=': 'is exactly', '==': 'is exactly' }
  return `${targetName} ${words[condition.operator]} ${condition.value}`
}

/** The condition in people's words, as the game's own reactions write it ("Budget < 25"). */
export function conditionText(condition: NumericCondition, targetName: string): string {
  return `${targetName} ${condition.operator} ${condition.value}`
}

/**
 * A new reaction for one of the draft's own members: when a score drops below
 * 40, they get unhappier. A starting point the author changes.
 */
export function addReaction(
  draft: DraftPack,
  memberId: string,
  score: { id: string; name: string },
): { draft: DraftPack; id: string } {
  const member = draft.content.stakeholders[memberId]
  if (!member) throw new Error(`Not the draft's own council member: ${memberId}`)
  const condition: NumericCondition = { target_type: 'score', target_id: score.id, operator: '<', value: 40 }
  const added = addContent(draft, 'stakeholder_reaction_rules', {
    name: COUNCIL_PLACEHOLDERS.reaction,
    description: '',
    condition,
    condition_description: conditionText(condition, score.name),
    score_changes: [],
    stakeholder_changes: [{ stakeholder_id: memberId, delta: -3 }],
  })
  const withRef = putContent(added.draft, 'stakeholders', {
    ...member,
    reaction_rule_refs: [...member.reaction_rule_refs, { id: added.id, version: 1 }],
  })
  return { draft: withRef, id: added.id }
}

/** Changes a reaction's condition, keeping its words in step. */
export function setReactionCondition(draft: DraftPack, ruleId: string, condition: NumericCondition, targetName: string): DraftPack {
  const rule = draft.content.stakeholder_reaction_rules[ruleId]
  return putContent(draft, 'stakeholder_reaction_rules', { ...rule, condition, condition_description: conditionText(condition, targetName) })
}

/** Removes one of an own member's reactions. */
export function removeReaction(draft: DraftPack, memberId: string, ruleId: string): DraftPack {
  const member = draft.content.stakeholders[memberId]
  const next = member
    ? putContent(draft, 'stakeholders', { ...member, reaction_rule_refs: member.reaction_rule_refs.filter((ref) => ref.id !== ruleId) })
    : draft
  return removeContent(next, 'stakeholder_reaction_rules', ruleId)
}

/** Gives a new reaction the id of its name, once named. Its member follows. */
export function settleNewReactionId(draft: DraftPack, memberId: string, ruleId: string): { draft: DraftPack; id: string } {
  return settlePlaceholderId(draft, 'stakeholder_reaction_rules', ruleId, COUNCIL_PLACEHOLDERS.reaction, (moved, oldId, newId) => {
    const member = moved.content.stakeholders[memberId]
    if (!member) return moved
    return putContent(moved, 'stakeholders', {
      ...member,
      reaction_rule_refs: member.reaction_rule_refs.map((ref) => (ref.id === oldId ? { id: newId, version: ref.version } : ref)),
    })
  })
}
