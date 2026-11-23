import type { VersionRef } from './version_ref'

/**
 * Dependency declaration for a content pack.
 *
 * This is metadata only and is resolved/validated by content services.
 */
export interface PackDependency {
  pack_id: string
  version: string
}

/**
 * Human-facing author metadata for a content pack.
 */
export interface PackAuthor {
  name: string
  url?: string
}

/**
 * Canonical inventory of versioned filenames grouped by content type.
 *
 * Inventory entries are still untrusted until manifest/content validation succeeds.
 */
export interface ContentPackInventory {
  scenarios: string[]
  cards: string[]
  stakeholders: string[]
  stakeholder_reaction_rules: string[]
  scores: string[]
  events: string[]
  delayed_effects: string[]
  outcome_tiers: string[]
  outcome_archetypes: string[]
  /** Optional (added in M3): packs written before coupling rules existed omit it. */
  coupling_rules?: string[]
  classes: string[]
  challenge_modifiers: string[]
}

/**
 * What a pack is allowed to be (ADR 0001, docs/CONTENT_PACKS.md §5).
 *
 * - `standalone`: a complete world; declares no dependencies.
 * - `extension`: builds on the scores/stakeholders of the packs it depends on.
 *
 * `overlay` (text-only reskin or translation) is planned for a later
 * `schema_version` and is not accepted yet.
 */
export type PackKind = 'standalone' | 'extension'

/**
 * Validated manifest model for a pack namespace.
 *
 * This model describes where content exists and which scenario/class/tutorial
 * refs are entry points. Simulation does not consume this directly; content
 * services resolve this into validated runtime content structures.
 */
export interface ContentPackManifest {
  /**
   * Version of the pack format this manifest is written for. The game rejects
   * packs written for a newer schema instead of misreading them.
   */
  schema_version: number
  kind: PackKind
  id: string
  version: string
  name: string
  description: string
  depends_on: PackDependency[]
  base_url: string
  license: string
  authors: PackAuthor[]
  pack_homepage_url?: string
  scenarios: VersionRef[]
  classes: VersionRef[]
  challenge_modifiers: VersionRef[]
  tutorials: VersionRef[]
  tutorial_base_url?: string
  content: ContentPackInventory
}

/**
 * Type-safe key for inventory sections in a content pack manifest.
 */
export type ContentInventoryKey = keyof ContentPackInventory
