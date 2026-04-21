import type { AvatarMood, AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import type { SceneActorSlot } from '@/ui/composables/scene_avatar_positioning'

/**
 * Preview actor configuration used by avatar/scene preview tooling.
 */
export interface PreviewActorConfig {
  id: string
  avatarRole: AvatarRoleId
  mood: AvatarMood
  slot: SceneActorSlot
}

/**
 * Available scene options for preview tooling.
 */
export const SCENE_PREVIEW_OPTIONS: ReadonlyArray<{
  id: SceneBackgroundId
  label: string
}> = [
  { id: 'fortified_monolith_hall', label: 'Fortified Monolith Hall' },
  { id: 'strategic_war_room', label: 'Strategic War Room' },
  { id: 'archive_library_chamber', label: 'Archive / Library Chamber' },
]

export const AVATAR_ROLE_OPTIONS: ReadonlyArray<AvatarRoleId> = [
  'bard',
  'cleric',
  'dragonwarrior',
  'paladin',
  'rogue',
  'sorcerer',
  'warrior',
  'witch',
  'wizard',
]

export const AVATAR_MOOD_OPTIONS: ReadonlyArray<AvatarMood> = [
  'happy',
  'neutral',
  'concerned',
  'angry',
]

export const SLOT_OPTIONS: ReadonlyArray<SceneActorSlot> = ['left', 'center', 'right', 'far']

export const DEFAULT_PREVIEW_ACTORS: ReadonlyArray<PreviewActorConfig> = [
  { id: 'actor_1', avatarRole: 'wizard', mood: 'neutral', slot: 'left' },
  { id: 'actor_2', avatarRole: 'rogue', mood: 'concerned', slot: 'center' },
  { id: 'actor_3', avatarRole: 'paladin', mood: 'happy', slot: 'right' },
  { id: 'actor_4', avatarRole: 'witch', mood: 'angry', slot: 'far' },
]
