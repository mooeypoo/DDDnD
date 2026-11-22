/**
 * Pack Policy
 *
 * Pack-level rules that are product decisions rather than shape rules.
 * Each constant names the decision record it comes from.
 */

/**
 * The pack format version this build of the game understands.
 *
 * Bump this (and add a CONTENT_PACKS.md log entry) when the pack format
 * changes in a way an older game could misread. Packs declaring a higher
 * `schema_version` are rejected with a "needs a newer DDDnD" message.
 */
export const CURRENT_PACK_SCHEMA_VERSION = 1

/** Pack kinds accepted at the current schema version (ADR 0001). */
export const SUPPORTED_PACK_KINDS = ['standalone', 'extension'] as const

/** The first-party base pack id. */
export const BASE_PACK_ID = 'base'

/**
 * Packs that ship with the game (ADR 0013). Their ids are reserved, and they
 * are the only packs a community pack may depend on: a manifest id proves
 * nothing about which pack it is, but these ids are ours.
 */
export const FIRST_PARTY_PACK_IDS: readonly string[] = [BASE_PACK_ID, 'tutorial']

/**
 * Licenses accepted for packs that depend on the base pack (ADR 0004).
 * The base pack is GPL-3.0-only, so derived packs must stay GPL-3.0-compatible.
 */
export const GPL_COMPATIBLE_LICENSES: readonly string[] = ['GPL-3.0-only', 'GPL-3.0-or-later']

/** Total files a single pack may list across all inventory sections. */
export const MAX_FILES_PER_PACK = 2000
