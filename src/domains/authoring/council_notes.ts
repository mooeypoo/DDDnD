/**
 * Notes about council members who aren't seated (docs/PACK_STUDIO.md M4.5a).
 *
 * A card, event, aftershock or reaction may change how someone feels who
 * isn't at this scenario's table. That's allowed (shared content does it all
 * the time) and the game ignores the change (journal M3.9), but an author
 * probably didn't mean it. So the Studio notes it, without blocking export,
 * and offers to seat them or to change the content.
 */

import type { Card, DelayedEffect, Event, Stakeholder, StakeholderChange, StakeholderReactionRule, VersionRef } from '../content/model'
import { putContent, type DraftPack } from './draft_pack'

/** What the notes need from the base game: the content provider's loaders. */
export interface BaseContentReader {
  loadCard(ref: VersionRef): Promise<Card>
  loadEvent(ref: VersionRef): Promise<Event>
  loadDelayedEffect(ref: VersionRef): Promise<DelayedEffect>
  loadStakeholder(ref: VersionRef): Promise<Stakeholder>
  loadStakeholderReactionRule(ref: VersionRef): Promise<StakeholderReactionRule>
}

export type NoteSection = 'cards' | 'events' | 'delayed_effects' | 'stakeholder_reaction_rules'

export interface UnseatedSource {
  section: NoteSection
  ref: VersionRef
  name: string
  /** True when it's the draft's own (editable here); false for the game's. */
  own: boolean
  delta: number
  /** For an aftershock or a reaction: the card, event or member it belongs to. */
  via?: { section: 'cards' | 'events' | 'stakeholders'; ref: VersionRef; name: string }
}

export interface UnseatedNote {
  scenario_id: string
  stakeholder_id: string
  sources: UnseatedSource[]
}

type Named = { id: string; version: number; name: string; stakeholder_changes?: StakeholderChange[] }

/**
 * Who isn't seated but is changed anyway, per scenario, with what changes
 * them. Grouped by person, in the order they first come up.
 */
export async function unseatedNotes(draft: DraftPack, base: BaseContentReader): Promise<UnseatedNote[]> {
  async function resolve<T extends Named>(section: NoteSection | 'stakeholders', ref: VersionRef, load: (ref: VersionRef) => Promise<T>): Promise<{ item: T; own: boolean } | null> {
    const own = (draft.content[section] as unknown as Record<string, T | undefined>)[ref.id]
    if (own && own.version === ref.version) return { item: own, own: true }
    try {
      return { item: await load(ref), own: false }
    } catch {
      return null // A missing reference is the game's checks' to report
    }
  }

  const notes: UnseatedNote[] = []
  for (const scenario of Object.values(draft.content.scenarios)) {
    const seated = new Set(scenario.stakeholder_refs.map((ref) => ref.id))
    const byPerson = new Map<string, UnseatedSource[]>()
    const seen = new Set<string>()
    const note = (section: NoteSection, entry: { item: Named; own: boolean }, via?: UnseatedSource['via']) => {
      const key = `${section}/${entry.item.id}-v${entry.item.version}`
      if (seen.has(key)) return
      seen.add(key)
      for (const change of entry.item.stakeholder_changes ?? []) {
        if (seated.has(change.stakeholder_id)) continue
        const sources = byPerson.get(change.stakeholder_id) ?? []
        sources.push({ section, ref: { id: entry.item.id, version: entry.item.version }, name: entry.item.name, own: entry.own, delta: change.delta, ...(via ? { via } : {}) })
        byPerson.set(change.stakeholder_id, sources)
      }
    }

    const deck: Array<['cards' | 'events', VersionRef[], (ref: VersionRef) => Promise<Card | Event>]> = [
      ['cards', scenario.card_refs, (ref) => base.loadCard(ref)],
      ['events', scenario.event_refs, (ref) => base.loadEvent(ref)],
    ]
    for (const [section, refs, load] of deck) {
      const entries = await Promise.all(refs.map((ref) => resolve(section, ref, load)))
      for (const entry of entries) {
        if (!entry) continue
        note(section, entry)
        const via = { section, ref: { id: entry.item.id, version: entry.item.version }, name: entry.item.name }
        const aftershocks = await Promise.all(entry.item.delayed_effect_refs.map((ref) => resolve('delayed_effects', ref, (r) => base.loadDelayedEffect(r))))
        for (const aftershock of aftershocks) if (aftershock) note('delayed_effects', aftershock, via)
      }
    }

    // Seated members' reactions can name someone else
    const members = await Promise.all(scenario.stakeholder_refs.map((ref) => resolve('stakeholders', ref, (r) => base.loadStakeholder(r))))
    for (const member of members) {
      if (!member) continue
      const via = { section: 'stakeholders' as const, ref: { id: member.item.id, version: member.item.version }, name: member.item.name }
      const rules = await Promise.all(member.item.reaction_rule_refs.map((ref) => resolve('stakeholder_reaction_rules', ref, (r) => base.loadStakeholderReactionRule(r))))
      for (const rule of rules) if (rule) note('stakeholder_reaction_rules', rule, via)
    }

    for (const [stakeholderId, sources] of byPerson) notes.push({ scenario_id: scenario.id, stakeholder_id: stakeholderId, sources })
  }
  return notes
}

/** Removes the changes to one person from one of the draft's own cards, events, aftershocks or reactions. */
export function removeChangesTo(draft: DraftPack, section: NoteSection, id: string, stakeholderId: string): DraftPack {
  const item = draft.content[section][id] as { stakeholder_changes?: StakeholderChange[] } | undefined
  if (!item) return draft
  const kept = (item.stakeholder_changes ?? []).filter((change) => change.stakeholder_id !== stakeholderId)
  const next = { ...item }
  if (kept.length) next.stakeholder_changes = kept
  else delete next.stakeholder_changes
  return putContent(draft, section, next as never)
}
