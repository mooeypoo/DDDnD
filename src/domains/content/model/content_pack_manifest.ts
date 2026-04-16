import type { VersionRef } from './version_ref'

export interface PackDependency {
  pack_id: string
  version: string
}

export interface PackAuthor {
  name: string
  url?: string
}

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

export type ContentInventoryKey = keyof ContentPackInventory
