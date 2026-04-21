/**
 * UI-only avatar mood states used for artwork lookup.
 */
export type AvatarMood = 'happy' | 'neutral' | 'concerned' | 'angry'

/**
 * UI-only avatar role ids used for stakeholder presentation.
 */
export type AvatarRoleId =
  | 'bard'
  | 'cleric'
  | 'dragonwarrior'
  | 'paladin'
  | 'rogue'
  | 'sorcerer'
  | 'warrior'
  | 'witch'
  | 'wizard'

/**
 * Supported scenario background ids for presentation scenes.
 */
export type SceneBackgroundId =
  | 'fortified_monolith_hall'
  | 'strategic_war_room'
  | 'archive_library_chamber'

/**
 * Event-scene artwork ids.
 */
export type EventSceneAssetId =
  | 'system_incident'
  | 'audit_pressure'
  | 'scaling_crisis'
