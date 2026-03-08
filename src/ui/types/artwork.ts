/**
 * Artwork metadata types for DDDnD UI components.
 *
 * These types describe optional visual identity data that can be attached
 * to UI presentation of cards, events, archetypes, and scenarios.
 *
 * Artwork is always OPTIONAL. Every component using artwork must render
 * fully and legibly when artwork metadata is absent.
 *
 * Fields are kept intentionally minimal. Extend as the artwork pipeline grows.
 */

/**
 * Optional artwork metadata passed to UI components as presentation data.
 *
 * No field is required. Components must degrade gracefully when artwork
 * metadata is undefined or when individual fields are absent.
 */
export interface ArtworkMeta {
  /**
   * Absolute or relative URL of the illustration image.
   * Used to render artwork regions (card illustration, event scene,
   * archetype portrait, scenario hero).
   */
  illustration_url?: string

  /**
   * Symbolic icon key for icon-map or sprite-based rendering.
   * Useful for compact icon areas where a full illustration is too large.
   * Format: snake_case, e.g. "boundary_builder", "firefighter"
   */
  icon_key?: string

  /**
   * Optional variant hint that allows components to choose among
   * alternative renders (e.g. "dark", "minimal", "full").
   * No component behavior is required based on this field.
   */
  artwork_variant?: string

  /**
   * Accessibility description for the image.
   * Used as aria-label / img alt text.
   * If absent, images are treated as decorative (alt="").
   */
  alt?: string
}

/**
 * Archetype IDs used as keys for artwork lookup maps.
 * Mirrors the OutcomeArchetypeId union from simulation rules.
 */
export type ArchetypeArtworkKey =
  | 'boundary_builder'
  | 'firefighter'
  | 'system_stabilizer'
  | 'stakeholder_whisperer'
  | 'runaway_refactorer'

/**
 * Event illustration keys for known event artwork themes.
 * Additional keys can be added as the artwork set grows.
 */
export type EventArtworkKey =
  | 'system_incident'
  | 'audit_pressure'
  | 'scaling_crisis'

/**
 * Card illustration keys for known card artwork themes.
 */
export type CardArtworkKey =
  | 'refactor_action'
  | 'infrastructure_investment'
  | 'quick_patch'
