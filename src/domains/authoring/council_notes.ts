/**
 * Notes about council members who aren't seated (docs/PACK_STUDIO.md M4.5a).
 *
 * A card, event, aftershock or reaction may change how someone feels who
 * isn't at this scenario's table. That's allowed (shared content does it all
 * the time) and the game ignores the change (journal M3.9), but an author
 * probably didn't mean it. So the Studio notes it, without blocking export,
 * and offers to seat them or to change the content.
 */

import type { StakeholderChange, VersionRef } from '../content/model'
import { putContent, withEffects, type DraftPack } from './draft_pack'
import { resolveRef, type BaseContentReader } from './draft_reading'

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
  const resolve = async (section: NoteSection | 'stakeholders', ref: VersionRef) => {
    const found = await resolveRef(draft, section, ref, base)
    return found ? { item: found.entity as Named & { delayed_effect_refs?: VersionRef[]; reaction_rule_refs?: VersionRef[] }, own: found.own } : null
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

    // Seated members' reactions can name someone else
    const members = await Promise.all(scenario.stakeholder_refs.map((ref) => resolve('stakeholders', ref)))
    for (const member of members) {
      if (!member) continue
      const via = { section: 'stakeholders' as const, ref: { id: member.item.id, version: member.item.version }, name: member.item.name }
      const rules = await Promise.all((member.item.reaction_rule_refs ?? []).map((ref) => resolve('stakeholder_reaction_rules', ref)))
      for (const rule of rules) if (rule) note('stakeholder_reaction_rules', rule, via)
    }

    for (const [stakeholderId, sources] of byPerson) notes.push({ scenario_id: scenario.id, stakeholder_id: stakeholderId, sources })
  }
  return notes
}

/** Removes the changes to one person from one of the draft's own cards, events, aftershocks or reactions. */
export function removeChangesTo(draft: DraftPack, section: NoteSection, id: string, stakeholderId: string): DraftPack {
  const item = draft.content[section][id]
  if (!item) return draft
  const kept = (item.stakeholder_changes ?? []).filter((change: StakeholderChange) => change.stakeholder_id !== stakeholderId)
  return putContent(draft, section, withEffects(item, { score_changes: item.score_changes, stakeholder_changes: kept }) as never)
}
