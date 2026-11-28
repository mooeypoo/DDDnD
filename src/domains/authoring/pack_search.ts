/**
 * Finding things in a draft (§6 item 6, M4.24): the author's own content
 * whose name or words contain what they typed. The sidebar's filter finds
 * what it lists by name; this adds what lives inside another's page (a
 * reaction, an aftershock, each with whose it is) and what the author wrote
 * about anything of their own. The game's content is found by name, where
 * the Studio already has its names; its words aren't loaded.
 */

import type { VersionRef } from '../content/model'
import { aftershockUsers } from './aftershocks'
import { memberOfReaction } from './council'
import type { DraftPack, DraftSection } from './draft_pack'

/** The words players read, besides the name. */
const WORD_FIELDS = ['short_name', 'short_description', 'description', 'flavor_text'] as const
type WordField = (typeof WORD_FIELDS)[number]

/** Sections searched, in the order matches are listed (the sidebar's). */
const SEARCHED: DraftSection[] = [
  'scenarios', 'scores', 'outcome_archetypes', 'classes', 'challenge_modifiers', 'coupling_rules',
  'stakeholders', 'stakeholder_reaction_rules', 'cards', 'events', 'delayed_effects',
]

export interface PackMatch {
  section: DraftSection
  ref: VersionRef
  name: string
  /** Where the words were found: its name, or which of its words. */
  found_in: 'name' | WordField
  /** For something edited on another's page: whose (a reaction's member, an aftershock's first card or event). */
  on?: { section: 'stakeholders' | 'cards' | 'events'; ref: VersionRef; name: string }
}

/** Ignores case and accents' absence: "cafe" finds "Café". */
function folded(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
}

/** The author's own content matching `query`: name matches first, then matches in their words. Empty for a blank query. */
export function searchOwnContent(draft: DraftPack, query: string): PackMatch[] {
  const wanted = folded(query.trim())
  if (!wanted) return []
  const byName: PackMatch[] = []
  const byWords: PackMatch[] = []
  for (const section of SEARCHED) {
    for (const entity of Object.values(draft.content[section]) as Array<{ id: string; version: number; name: string } & Partial<Record<WordField, string>>>) {
      const base = { section, ref: { id: entity.id, version: entity.version }, name: entity.name, ...onPage(draft, section, entity.id, entity.version) }
      if (folded(entity.name).includes(wanted)) {
        byName.push({ ...base, found_in: 'name' })
        continue
      }
      const field = WORD_FIELDS.find((key) => typeof entity[key] === 'string' && folded(entity[key]!).includes(wanted))
      if (field) byWords.push({ ...base, found_in: field })
    }
  }
  return [...byName, ...byWords]
}

function onPage(draft: DraftPack, section: DraftSection, id: string, version: number): { on?: PackMatch['on'] } {
  if (section === 'stakeholder_reaction_rules') {
    const member = memberOfReaction(draft, id)
    return member ? { on: { section: 'stakeholders', ref: { id: member.id, version: member.version }, name: member.name } } : {}
  }
  if (section === 'delayed_effects') {
    const user = aftershockUsers(draft, { id, version })[0]
    return user ? { on: { section: user.section, ref: { id: user.id, version: draft.content[user.section][user.id].version }, name: user.name } } : {}
  }
  return {}
}
