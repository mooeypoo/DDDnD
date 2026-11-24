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
  /** What it last exported, for the version-bump assistant (M4.7). Absent before the first export. */
  released?: DraftRelease
}

/** What a draft last exported: its pack version and a copy of its content then. */
export interface DraftRelease {
  version: string
  content: DraftContent
}

/** The base pack every Studio draft builds on, and the license that requires (ADR 0004). */
export const DRAFT_DEPENDENCY = { pack_id: 'base', version: '1.0.0' } as const
export const DRAFT_LICENSE = 'GPL-3.0-only'

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
