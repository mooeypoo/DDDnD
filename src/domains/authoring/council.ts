/**
 * The council: who sits at the scenario's table (docs/PACK_STUDIO.md §4.1, D21).
 *
 * The scenario decides who takes part. Anyone not seated simply doesn't, and
 * changes aimed at them do nothing (journal M3.9), so the game's council
 * members a draft doesn't want can just be left out.
 *
 * The game's council members can't be edited (D21): the game's cards and
 * events name them by id. A copy (`copyMember`) is a new member with a new
 * id, which the game's content doesn't reach. Authors seat their own members,
 * with their own reactions, and change how a game card treats the council by
 * making their own version of the card.
 */

import type { NumericCondition, Scenario, Stakeholder, StakeholderChange, StakeholderReactionRule, VersionRef } from '../content/model'
import { CONTENT_LIMITS } from '../content/validation/content_limits'
import { addContent, putContent, removeContent, type DraftPack } from './draft_pack'
import { removeChangesTo } from './council_notes'
import { isOwnRef } from './draft_reading'
import { conditionText, startingCondition } from './conditions'
import { settlePlaceholderId } from './placeholder_ids'

/** The most council members a scenario seats (the game's own limit). */
export const COUNCIL_SEATS = CONTENT_LIMITS.counts.stakeholder_refs

/** Names new members and reactions start with, before the author names them. */
export const COUNCIL_PLACEHOLDERS = { member: 'New council member', reaction: 'New reaction' } as const

/** True when the member is the draft's own (editable), not the game's. */
export function isOwnMember(draft: DraftPack, ref: VersionRef): boolean {
  return isOwnRef(draft, 'stakeholders', ref)
}

/** The draft's own member a reaction belongs to, or null. */
export function memberOfReaction(draft: DraftPack, ruleId: string): Stakeholder | null {
  return Object.values(draft.content.stakeholders).find((member) => member.reaction_rule_refs.some((ref) => ref.id === ruleId)) ?? null
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

/**
 * The draft's own content that names a member and stays when they're
 * removed: for the draft's own member, everything but their own reactions
 * (which go with them).
 */
export function ownItemsNamingAfterRemoval(draft: DraftPack, ref: VersionRef): ReturnType<typeof ownReactionsTo> {
  const theirs = new Set(isOwnMember(draft, ref) ? draft.content.stakeholders[ref.id].reaction_rule_refs.map((rule) => rule.id) : [])
  return ownReactionsTo(draft, ref.id).filter((item) => !(item.section === 'stakeholder_reaction_rules' && theirs.has(item.id)))
}

/**
 * Takes a member out of every scenario: they no longer take part. Their
 * satisfaction floor goes too (it can only name someone at the table). The
 * draft's own member is deleted with their reactions, and the draft's own
 * content stops naming them. The game's member is only unseated: content that
 * still names them is left as it is, and noted (M4.5a).
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
  // A deleted member can't be seated again, so the draft's own changes to them go too.
  // One of the game's members stays named: the Checks rail notes it (council_notes.ts)
  // and offers to seat them or change the content, rather than editing it unasked.
  if (own) {
    for (const { section, id } of ownReactionsTo(next, ref.id)) next = removeChangesTo(next, section, id, ref.id)
  }
  return next
}

/** A new member of the draft's own, seated at the table. The author fills them in. */
export function createOwnMember(draft: DraftPack, name: string = COUNCIL_PLACEHOLDERS.member): { draft: DraftPack; id: string } {
  const added = addContent(draft, 'stakeholders', { name, description: '', reaction_rule_refs: [] })
  return { draft: addToCouncil(added.draft, { id: added.id, version: 1 }), id: added.id }
}

/**
 * A new member of the draft's own, started as a copy of one of the game's:
 * same description and reactions, all editable, seated next to the original.
 * It's a new member (D21): the game's cards that move the original don't move
 * the copy. Its reactions that moved the original move the copy instead.
 */
export function copyMember(
  draft: DraftPack,
  original: Stakeholder,
  reactions: StakeholderReactionRule[],
): { draft: DraftPack; id: string } {
  const { id: originalId, version: _version, reaction_rule_refs: _refs, ...fields } = JSON.parse(JSON.stringify(original)) as Stakeholder
  const added = addContent(draft, 'stakeholders', { ...fields, reaction_rule_refs: [] })
  const copyId = added.id
  let next = putContent(added.draft, 'stakeholders', { ...added.draft.content.stakeholders[copyId], name: `${original.name} (copy)` })
  const ruleRefs: VersionRef[] = []
  for (const rule of reactions) {
    const { id: _ruleId, version: _ruleVersion, ...ruleFields } = JSON.parse(JSON.stringify(rule)) as StakeholderReactionRule
    const retargeted = {
      ...ruleFields,
      condition: ruleFields.condition.target_type === 'stakeholder' && ruleFields.condition.target_id === originalId
        ? { ...ruleFields.condition, target_id: copyId }
        : ruleFields.condition,
      ...(ruleFields.stakeholder_changes
        ? { stakeholder_changes: ruleFields.stakeholder_changes.map((change) => (change.stakeholder_id === originalId ? { ...change, stakeholder_id: copyId } : change)) }
        : {}),
    }
    const copied = addContent(next, 'stakeholder_reaction_rules', retargeted)
    next = copied.draft
    ruleRefs.push({ id: copied.id, version: 1 })
  }
  next = putContent(next, 'stakeholders', { ...next.content.stakeholders[copyId], reaction_rule_refs: ruleRefs })
  return { draft: addToCouncil(next, { id: copyId, version: 1 }), id: copyId }
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

/**
 * A new reaction for one of the draft's own members: when a score is below
 * 40, they get unhappier. A starting point the author changes.
 */
export function addReaction(
  draft: DraftPack,
  memberId: string,
  score: { id: string; name: string },
): { draft: DraftPack; id: string } {
  const member = draft.content.stakeholders[memberId]
  if (!member) throw new Error(`Not the draft's own council member: ${memberId}`)
  const condition = startingCondition(score.id)
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
