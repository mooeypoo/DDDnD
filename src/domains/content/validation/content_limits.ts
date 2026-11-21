/**
 * Content Limits
 *
 * Hard bounds applied to every content pack, first-party or community.
 *
 * Why limits exist: pack content is untrusted input (ADR 0001). Without
 * bounds, a pack could freeze the tab (`max_turns: 1e9`, 100k cards), bloat
 * memory (megabyte strings), or confuse the engine (non-finite numbers).
 *
 * How the numbers were picked (2026-11-21): each limit is the base pack's
 * real maximum with generous headroom, so authors are never squeezed but
 * nothing pathological gets through. The measured base/tutorial maximum is
 * noted next to each value. Changing a limit is a schema decision: record it
 * in docs/CONTENT_PACKS.md and CONTENT_SCHEMA.md.
 */

export const CONTENT_LIMITS = {
  /** Identifier grammar shared by every id and id-valued field. */
  id_pattern: /^[a-z0-9_]{1,64}$/,
  /** Ids that collide with JavaScript object internals. */
  reserved_ids: ['__proto__', 'prototype', 'constructor'] as readonly string[],
  /** Content version numbers (`-v<version>`). Base max: 2. */
  max_content_version: 999,

  /** Bytes per content file. Base max: ~5 KB. */
  max_file_bytes: 64 * 1024,
  /** Bytes per manifest. Base manifest: ~6 KB. */
  max_manifest_bytes: 256 * 1024,

  text: {
    /** Names and titles. */
    name: 120,
    /** Compact score label (weather strip). */
    short_name: 32,
    /** Descriptions. Base max: 174. */
    description: 600,
    /** Short descriptions for compact surfaces. Base max: 95. */
    short_description: 240,
    /** Flavor text. Base max: 93. */
    flavor_text: 400,
    /** Prose conditions on rules and events. */
    condition_description: 240,
    /** Card style tags. */
    style_tag: 40,
  },

  numbers: {
    /** Score values (starting values, defaults, min/max). Base range: 0–100. */
    score_value: { min: -1000, max: 1000 },
    /** Any single delta on a score or stakeholder. Base range: -20..30. */
    delta: { min: -100, max: 100 },
    /** Condition comparison value. */
    condition_value: { min: -1000, max: 1000 },
    /** Scenario length. Base range: 3–12. */
    max_turns: { min: 1, max: 50 },
    /** Delayed effect delay. Base max: 3. */
    turns_until_resolution: { min: 1, max: 20 },
    /** Card cooldown. Base max: 3. */
    cooldown_turns: { min: 0, max: 20 },
    /** Card usage limit (null = unlimited). Base max: 3. */
    usage_limit: { min: 1, max: 50 },
    /** Event selection weight. Base max: 6. */
    occurrence_weight: { min: 1, max: 1000 },
    /** Reaction rule priority. Base max: 50. */
    priority: { min: 0, max: 1000 },
    /** Starting-score random variance. Base: 5. */
    score_variance: { min: 0, max: 50 },
    /** Outcome tier rank. Base max: 5. */
    rank: { min: 1, max: 100 },
    /** Tutorial ordering. */
    tutorial_order: { min: 1, max: 100 },
    /** Stakeholder satisfaction (0–100 scale, ARCHITECTURE.md). */
    satisfaction: { min: 0, max: 100 },
    /** Challenge-modifier turn change. Base: -2. */
    turn_adjustment: { min: -20, max: 20 },
  },

  counts: {
    /** Scores tracked by one scenario. Base max: 6. */
    score_refs: 12,
    /**
     * Stakeholders per scenario. Base max: 5. Kept below the UI avatar pool
     * so every stakeholder can get a distinct cast role (ADR 0002).
     */
    stakeholder_refs: 8,
    /** Cards per scenario. Base max: 26. */
    card_refs: 100,
    /** Events per scenario. Base max: 17. */
    event_refs: 100,
    /** Outcome tiers or archetypes per scenario. Base max: 10. */
    outcome_refs: 30,
    /** Opening hand pins. Base max: 6. */
    opening_hand_card_ids: 12,
    /** Score or stakeholder changes on one entity. Base max: 6. */
    changes: 16,
    /** Delayed effects scheduled by one card or event. Base max: 2. */
    delayed_effect_refs: 8,
    /** Reaction rules on one stakeholder. Base max: 5. */
    reaction_rule_refs: 20,
    /** Requirements on a card, or failure conditions on a scenario. */
    conditions: 12,
    /** Style tags on a card. Base max: 3. */
    style_tags: 8,
    /** Authors on a manifest. */
    authors: 20,
    /** Dependencies on a manifest. */
    depends_on: 10,
    /** Files in one manifest inventory section. Base max: ~45. */
    inventory_section: 500,
  },
} as const
