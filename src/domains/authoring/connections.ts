/**
 * Connections between a draft's content (the UI/UX audit, slice 3): what
 * changes each council member's satisfaction, and what an author still has
 * to fill in.
 *
 * One walk answers "what changes whom" for every person, seated or not. The
 * council notes (M4.5a) are the part of it about people who aren't seated;
 * a member's page shows the part about them; the contents sidebar counts it.
 * They agree because they are the same walk.
 */

import type { Card, Event, ScoreChange, StakeholderChange, VersionRef } from '../content/model'
import { AFTERSHOCK_PLACEHOLDER } from './aftershocks'
import { addToCouncil, COUNCIL_PLACEHOLDERS, COUNCIL_SEATS, createOwnMember } from './council'
import { isOwn, PLACEHOLDER_NAMES, type DeckSection } from './deck'
import { copyToEdit } from './draft_from_base'
import { putContent, withEffects, type DraftPack } from './draft_pack'
import { resolveRef, scenarioRefs, type BaseContentReader } from './draft_reading'
import { TOPIC_PLACEHOLDERS } from './topics'
import { ENDING_PLACEHOLDER } from './endings'

/** Where a change to someone's satisfaction can come from. */
export type ChangeSection = 'cards' | 'events' | 'delayed_effects' | 'stakeholder_reaction_rules'

/** One card, event, aftershock or reaction that changes someone's satisfaction. */
export interface ChangeSource {
  section: ChangeSection
  ref: VersionRef
  name: string
  /** True when it's the draft's own (editable here); false for the game's. */
  own: boolean
  delta: number
  /** For an aftershock or a reaction: the card, event or member it belongs to. */
  via?: { section: 'cards' | 'events' | 'stakeholders'; ref: VersionRef; name: string }
}

/** One scenario's table: who sits at it, and what changes each person (seated or not). */
export interface ScenarioChanges {
  scenario_id: string
  seated: ReadonlySet<string>
  /** Per person, in the order they first come up. */
  by_person: ReadonlyMap<string, ChangeSource[]>
}

type Named = { id: string; version: number; name: string; stakeholder_changes?: StakeholderChange[] }

/**
 * What changes whom, per scenario: the scenario's cards and events, their
 * aftershocks, and the reactions of the members it seats. Each source is
 * listed once per person, even when two cards share an aftershock.
 */
export async function scenarioChanges(draft: DraftPack, base: BaseContentReader): Promise<ScenarioChanges[]> {
  const resolve = async (section: ChangeSection | 'stakeholders', ref: VersionRef) => {
    const found = await resolveRef(draft, section, ref, base)
    return found ? { item: found.entity as Named & { delayed_effect_refs?: VersionRef[]; reaction_rule_refs?: VersionRef[] }, own: found.own } : null
  }

  const tables: ScenarioChanges[] = []
  for (const scenario of Object.values(draft.content.scenarios)) {
    const byPerson = new Map<string, ChangeSource[]>()
    const seen = new Set<string>()
    const note = (section: ChangeSection, entry: { item: Named; own: boolean }, via?: ChangeSource['via']) => {
      const key = `${section}/${entry.item.id}-v${entry.item.version}`
      if (seen.has(key)) return
      seen.add(key)
      for (const change of entry.item.stakeholder_changes ?? []) {
        const sources = byPerson.get(change.stakeholder_id) ?? []
        sources.push({ section, ref: { id: entry.item.id, version: entry.item.version }, name: entry.item.name, own: entry.own, delta: change.delta, ...(via ? { via } : {}) })
        byPerson.set(change.stakeholder_id, sources)
      }
    }

    const deck: Array<['cards' | 'events', VersionRef[]]> = [['cards', scenario.card_refs], ['events', scenario.event_refs]]
    for (const [section, refs] of deck) {
      const entries = await Promise.all(refs.map((ref) => resolve(section, ref)))
      for (const entry of entries) {
        if (!entry) continue
        note(section, entry)
        const via = { section, ref: { id: entry.item.id, version: entry.item.version }, name: entry.item.name }
        const aftershocks = await Promise.all((entry.item.delayed_effect_refs ?? []).map((ref) => resolve('delayed_effects', ref)))
        for (const aftershock of aftershocks) if (aftershock) note('delayed_effects', aftershock, via)
      }
    }

    // Seated members' reactions change themselves, and can name someone else
    const members = await Promise.all(scenario.stakeholder_refs.map((ref) => resolve('stakeholders', ref)))
    for (const member of members) {
      if (!member) continue
      const via = { section: 'stakeholders' as const, ref: { id: member.item.id, version: member.item.version }, name: member.item.name }
      const rules = await Promise.all((member.item.reaction_rule_refs ?? []).map((ref) => resolve('stakeholder_reaction_rules', ref)))
      for (const rule of rules) if (rule) note('stakeholder_reaction_rules', rule, via)
    }

    tables.push({ scenario_id: scenario.id, seated: new Set(scenario.stakeholder_refs.map((ref) => ref.id)), by_person: byPerson })
  }
  return tables
}

/**
 * Everything that changes each person's satisfaction, across the draft's
 * scenarios, each source once. Keyed by council member id.
 */
export async function changesByMember(draft: DraftPack, base: BaseContentReader): Promise<Map<string, ChangeSource[]>> {
  return changesByMemberFrom(await scenarioChanges(draft, base))
}

/** `changesByMember`, from a walk already made (the Studio walks once per check). */
export function changesByMemberFrom(tables: readonly ScenarioChanges[]): Map<string, ChangeSource[]> {
  const merged = new Map<string, ChangeSource[]>()
  const seen = new Set<string>()
  for (const table of tables) {
    for (const [person, sources] of table.by_person) {
      for (const source of sources) {
        const key = `${person}/${source.section}/${source.ref.id}-v${source.ref.version}`
        if (seen.has(key)) continue
        seen.add(key)
        merged.set(person, [...(merged.get(person) ?? []), source])
      }
    }
  }
  return merged
}

/** What a draft's own item still needs before it reads as finished. */
export type MissingPart = 'name' | 'description'

/** One of the draft's own items that is still a placeholder. */
export interface ToFillIn {
  section: 'scores' | 'outcome_archetypes' | 'stakeholders' | 'cards' | 'events' | 'delayed_effects'
  ref: VersionRef
  name: string
  missing: MissingPart[]
}

/** The Studio's placeholder name per section. Built on use: the modules that define them import this one. */
function placeholders(): Record<ToFillIn['section'], string> {
  return {
    scores: TOPIC_PLACEHOLDERS.score,
    outcome_archetypes: ENDING_PLACEHOLDER,
    stakeholders: COUNCIL_PLACEHOLDERS.member,
    cards: PLACEHOLDER_NAMES.cards,
    events: PLACEHOLDER_NAMES.events,
    delayed_effects: AFTERSHOCK_PLACEHOLDER,
  }
}

/**
 * The draft's own scores, members, cards, events and aftershocks that are still
 * placeholders: a name that is empty or still the Studio's ("New card"), or
 * no description. Fine while an author works; the summary lists them, and
 * the game's checks stop an export that still lacks a required part.
 */
export function toFillIn(draft: DraftPack): ToFillIn[] {
  const found: ToFillIn[] = []
  const names = placeholders()
  for (const section of Object.keys(names) as Array<ToFillIn['section']>) {
    for (const item of Object.values(draft.content[section]) as Array<{ id: string; version: number; name: string; description: string }>) {
      const missing: MissingPart[] = []
      if (!item.name.trim() || item.name.trim() === names[section]) missing.push('name')
      if (!item.description.trim()) missing.push('description')
      if (missing.length > 0) found.push({ section, ref: { id: item.id, version: item.version }, name: item.name, missing })
    }
  }
  return found
}

/** The draft's own items that can change someone's satisfaction. */
export type ChangeHolder = ChangeSection

/**
 * One of the draft's own cards, events, aftershocks or reactions, with a
 * change to `memberId`'s satisfaction: added, or set when it has one.
 */
export function addMemberChange(draft: DraftPack, section: ChangeHolder, itemId: string, memberId: string, delta = 1): DraftPack {
  const item = draft.content[section][itemId] as (Named & { score_changes: ScoreChange[] }) | undefined
  if (!item) return draft
  const changes = item.stakeholder_changes ?? []
  const next = changes.some((change) => change.stakeholder_id === memberId)
    ? changes.map((change) => (change.stakeholder_id === memberId ? { ...change, delta } : change))
    : [...changes, { stakeholder_id: memberId, delta }]
  return putContent(draft, section, withEffects(item, { score_changes: item.score_changes, stakeholder_changes: next }) as never)
}

/**
 * "+ “Head of Payments” as a new council member", from inside an item: the
 * member is made with that name, seated, and the item changes them. The
 * author stays where they are and fills the member in later (toFillIn says
 * so). Null when every seat is taken or the name is empty.
 */
export function connectNewMember(
  draft: DraftPack,
  section: ChangeHolder,
  itemId: string,
  name: string,
): { draft: DraftPack; member: VersionRef } | null {
  if (!name.trim() || scenarioRefs(draft, 'stakeholder_refs').length >= COUNCIL_SEATS) return null
  const made = createOwnMember(draft, name.trim())
  return { draft: addMemberChange(made.draft, section, itemId, made.id), member: { id: made.id, version: 1 } }
}

/** One of the game's members who isn't seated: seated, and the item changes them. Null when every seat is taken. */
export function connectGameMember(draft: DraftPack, section: ChangeHolder, itemId: string, member: VersionRef): DraftPack | null {
  if (scenarioRefs(draft, 'stakeholder_refs').length >= COUNCIL_SEATS) return null
  return addMemberChange(addToCouncil(draft, member), section, itemId, member.id)
}

/**
 * From a member's page: make a card or event in the deck change them. One of
 * the game's is copied first (D7, "make my own version"): the game's own
 * content is never edited, and the copy replaces it in the deck. Returns the
 * item that now holds the change.
 */
export function connectItemToMember<S extends DeckSection>(
  draft: DraftPack,
  section: S,
  item: S extends 'cards' ? Card : Event,
  memberId: string,
  delta: number,
): { draft: DraftPack; item: VersionRef } {
  const ref = { id: item.id, version: item.version }
  if (isOwn(draft, section, ref)) return { draft: addMemberChange(draft, section, item.id, memberId, delta), item: ref }
  const copied = copyToEdit(draft, section, item as never)
  return { draft: addMemberChange(copied.draft, section, copied.id, memberId, delta), item: { id: copied.id, version: 1 } }
}
