/**
 * Feature flags (UI layer).
 *
 * Build-time switches for unreleased features. They gate UI entry points only;
 * domain rules (such as content validation) are always on.
 */

/**
 * Parses a build-time flag value. Only the exact string "true" turns a flag
 * on, so production stays off unless someone deliberately sets it.
 */
export function parseFlag(value: string | undefined): boolean {
  return value === 'true'
}

/**
 * Community content packs (ADR 0009). Off in production until launch.
 *
 * Every community-pack entry point (lobby entry, `?pack=` links, file import,
 * restoring a community-pack run) must check this.
 */
export function isCommunityPacksEnabled(): boolean {
  return parseFlag(import.meta.env.VITE_ENABLE_COMMUNITY_PACKS)
}
