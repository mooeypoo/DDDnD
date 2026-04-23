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
  classes: string[]
  challenge_modifiers: string[]
}

/**
 * Validated manifest model for a pack namespace.
 *
 * This model describes where content exists and which scenario/class/tutorial
 * refs are entry points. Simulation does not consume this directly; content
 * services resolve this into validated runtime content structures.
 */
export interface ContentPackManifest {
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
