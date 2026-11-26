/**
 * Draft packs: the Pack Studio's editing model (docs/PACK_STUDIO.md §3–§4).
 *
 * A draft is a pack being made. It holds the pack's own content, already in
 * the game's content shapes, and refers to the base pack's content by
 * `{ id, version }` exactly as a published pack does. Operations are pure and
 * return a new draft, so the Studio can keep history (undo) and save drafts
 * without the domain knowing how.
 */

import type {
  Card,
  ChallengeModifier,
  CouplingRule,
  DelayedEffect,
  Event,
  OutcomeArchetype,
  OutcomeTier,
  PlayerClass,
  Scenario,
  Score,
  ScoreChange,
  Stakeholder,
  StakeholderChange,
  StakeholderReactionRule,
} from '../content/model/content_types'
import type { ContentInventoryKey } from '../content/model/content_pack_manifest'
import type { VersionRef } from '../content/model'
import { GPL_COMPATIBLE_LICENSES } from '../content/validation/pack_policy'
import { contentIdFromName, contentPrefix } from './content_ids'

/** What the author is making (D1). Both export as `extension` packs of the base pack. */
export type DraftKind = 'retelling' | 'new_topic'

/** The content each inventory section holds. */
export interface DraftContentTypes {
  scenarios: Scenario
  cards: Card
  stakeholders: Stakeholder
  stakeholder_reaction_rules: StakeholderReactionRule
  scores: Score
  events: Event
  delayed_effects: DelayedEffect
  outcome_tiers: OutcomeTier
  outcome_archetypes: OutcomeArchetype
  coupling_rules: CouplingRule
  classes: PlayerClass
  challenge_modifiers: ChallengeModifier
}

export type DraftSection = ContentInventoryKey & keyof DraftContentTypes

export const DRAFT_SECTIONS: readonly DraftSection[] = [
  'scenarios', 'stakeholders', 'stakeholder_reaction_rules', 'cards', 'events', 'delayed_effects',
  'scores', 'outcome_tiers', 'outcome_archetypes', 'coupling_rules', 'classes', 'challenge_modifiers',
]

/** The pack's own content, by section, keyed by id. */
export type DraftContent = { [S in DraftSection]: Record<string, DraftContentTypes[S]> }

export interface DraftPack {
  kind: DraftKind
  /** The pack's display name and its description, as players will see them. */
  name: string
  description: string
  /** Prefix for every id the Studio makes (§4.1). */
  prefix: string
  /** The pack's own version (semver), bumped on export when content changed. */
  version: string
  authors: Array<{ name: string; url?: string }>
  content: DraftContent
  /** Set only for an imported pack whose license isn't the Studio's default, so its export keeps it (D26). */
  license?: string
  /** An imported pack's homepage, kept for its export (D26). */
  homepage_url?: string
  /** What it last exported, for the version-bump assistant (M4.7). Absent before the first export. */
  released?: DraftRelease
  /**
   * The game's scenario each of the draft's scenarios was copied from, and
   * who it seated, by the draft's scenario id. The Studio's own memory: never
   * exported. Absent for imported scenarios and for drafts made before M4.14.
   */
  origins?: Record<string, ScenarioOrigin>
  /**
   * The order an imported pack listed its content and its classes,
   * challenges and scenarios in, by id. The game's identity for a pack
   * hashes its manifest, lists in order, so an export keeps this order to
   * stay the same pack (N4). New content comes after, by id. Never shown.
   */
  layout?: PackLayout
  /**
   * An imported pack's own README, as its author wrote it: its zip carries
   * it back unchanged, instead of one the Studio writes (N4). Plain text the
   * Studio stores and exports, never shows.
   */
  readme?: string
}

/** An imported pack's lists, in its own order (ids). */
export interface PackLayout {
  /**
   * The manifest's `content` lists, in its order of sections. A section it
   * didn't list stays out of the export while it's empty: an empty list
   * where there was none is a different pack to the game.
   */
  content: Partial<Record<DraftSection, string[]>>
  /** What it offers players: `scenarios`, `classes`, `challenge_modifiers`. */
  entries: Partial<Record<'scenarios' | 'classes' | 'challenge_modifiers', string[]>>
}

/** Where a draft's scenario came from: one of the game's, and the council it seated. */
export interface ScenarioOrigin {
  scenario: VersionRef
  seated: string[]
}

/** What a draft last exported: its pack version and a copy of its content then. */
export interface DraftRelease {
  version: string
  content: DraftContent
  /** The license it was exported under. Absent on drafts released before the Studio recorded it. */
  license?: string
  /** True when this "last export" is the pack the draft was imported from (D26), not one the Studio exported. */
  imported?: true
}

/**
 * The license every Studio draft carries: drafts build on the base pack,
 * which requires it (ADR 0004). Which base version they depend on comes from
 * the base pack the draft is checked against (`gameTarget`).
 */
export const DRAFT_LICENSE = 'GPL-3.0-or-later'

/** A draft's license: its own (kept from an import, D26) or the Studio's, and whether it is the game's. */
export function draftLicense(draft: Pick<DraftPack, 'license'>): { id: string; same_as_game: boolean } {
  const id = draft.license ?? DRAFT_LICENSE
  return { id, same_as_game: id === DRAFT_LICENSE }
}

/** What each license a Studio pack may use means, in plain words. */
const LICENSE_WORDS: Readonly<Record<string, string>> = {
  'GPL-3.0-or-later': 'Version 3 of the GNU General Public License, or any later version.',
  'GPL-3.0-only': 'Version 3 of the GNU General Public License, and no later version.',
}

/**
 * The licenses an author may choose: a Studio pack builds on the base pack,
 * so it uses one the game accepts for that (ADR 0004). The game's own first.
 */
export function licenseChoices(): Array<{ id: string; same_as_game: boolean; words: string }> {
  const ids = [DRAFT_LICENSE, ...GPL_COMPATIBLE_LICENSES.filter((id) => id !== DRAFT_LICENSE)]
  return ids.map((id) => ({ id, same_as_game: id === DRAFT_LICENSE, words: LICENSE_WORDS[id] ?? id }))
}

/**
 * The draft under `license`, one of `licenseChoices()`. The Studio's own
 * license isn't stored, so a draft carries one only when it differs (D26).
 */
export function withLicense(draft: DraftPack, license: string): DraftPack {
  if (!GPL_COMPATIBLE_LICENSES.includes(license)) throw new Error(`Not a license a Studio pack can use: ${license}`)
  const { license: _previous, ...rest } = draft
  return license === DRAFT_LICENSE ? rest : { ...rest, license }
}

/**
 * Full license texts by SPDX id. The app supplies them (the domain reads no
 * files); an export includes a pack's license text when it has it.
 */
export type LicenseTexts = Readonly<Record<string, string>>

function emptyContent(): DraftContent {
  return Object.fromEntries(DRAFT_SECTIONS.map((section) => [section, {}])) as unknown as DraftContent
}

export interface NewDraftInput {
  kind: DraftKind
  name: string
  description?: string
  /** Defaults to one made from the name. */
  prefix?: string
  authors?: Array<{ name: string; url?: string }>
}

export function createDraft(input: NewDraftInput): DraftPack {
  return {
    kind: input.kind,
    name: input.name.trim(),
    description: (input.description ?? '').trim(),
    prefix: contentPrefix(input.prefix ?? input.name) || 'pack',
    version: '1.0.0',
    authors: input.authors ?? [],
    content: emptyContent(),
  }
}

/** Every id in the draft, across sections: ids must be unique within a pack. */
export function draftIds(draft: DraftPack): Set<string> {
  return new Set(DRAFT_SECTIONS.flatMap((section) => Object.keys(draft.content[section])))
}

/**
 * Adds new content made from `fields`. The id comes from `fields.name`
 * (§4.1), and new content starts at version 1. Returns the new draft and the
 * id it got.
 */
export function addContent<S extends DraftSection>(
  draft: DraftPack,
  section: S,
  fields: Omit<DraftContentTypes[S], 'id' | 'version'>,
): { draft: DraftPack; id: string } {
  const name = (fields as { name?: string }).name ?? section
  const id = contentIdFromName(name, draft.prefix, draftIds(draft))
  const entity = { id, version: 1, ...fields } as unknown as DraftContentTypes[S]
  return { draft: putContent(draft, section, entity), id }
}

/** Replaces (or adds) one piece of the draft's own content, keeping its id. */
export function putContent<S extends DraftSection>(draft: DraftPack, section: S, entity: DraftContentTypes[S]): DraftPack {
  return {
    ...draft,
    content: { ...draft.content, [section]: { ...draft.content[section], [entity.id]: entity } },
  }
}

/**
 * Sets an optional text field. An empty one is left out of the file rather
 * than stored empty, as the game's own content does.
 */
export function withOptionalText<T extends object, K extends keyof T & string>(entity: T, field: K, value: string): T {
  const next = { ...entity }
  if (value.trim()) (next as Record<string, unknown>)[field] = value
  else delete next[field]
  return next
}

/** What something does to the scores and the council. */
export interface Effects {
  score_changes: ScoreChange[]
  stakeholder_changes?: StakeholderChange[]
}

/**
 * Sets what a card, event, aftershock or reaction does. Score changes are
 * always written; council changes only when there are some (the field is
 * optional in the game's content).
 */
export function withEffects<T extends Effects>(item: T, effects: { score_changes: ScoreChange[]; stakeholder_changes: StakeholderChange[] }): T {
  const next: T = { ...item, score_changes: effects.score_changes }
  if (effects.stakeholder_changes.length) next.stakeholder_changes = effects.stakeholder_changes
  else delete next.stakeholder_changes
  return next
}

/** Removes one piece of the draft's own content. References to it are left for validation to report. */
export function removeContent(draft: DraftPack, section: DraftSection, id: string): DraftPack {
  const remaining = { ...draft.content[section] }
  delete remaining[id]
  return { ...draft, content: { ...draft.content, [section]: remaining } }
}

/** Updates the pack's details. The prefix is cleaned the same way as on creation. */
export function updateDraftDetails(
  draft: DraftPack,
  details: Partial<Pick<DraftPack, 'name' | 'description' | 'prefix' | 'authors'>>,
): DraftPack {
  return {
    ...draft,
    ...details,
    ...(details.prefix !== undefined ? { prefix: contentPrefix(details.prefix) || draft.prefix } : {}),
  }
}
