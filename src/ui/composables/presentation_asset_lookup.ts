import {
  DEFAULT_AVATAR_MOOD,
  DEFAULT_AVATAR_ROLE_ID,
  getAvatarRoleAssetUrl,
} from '@/ui/config/presentation_avatar_registry'
import {
  DEFAULT_SCENE_BACKGROUND_ID,
  getSceneBackgroundAssetUrl,
} from '@/ui/config/presentation_scene_registry'
import type {
  AvatarMood,
  AvatarRoleId,
  SceneBackgroundId,
} from '@/ui/config/presentation_asset_types'

/**
 * UI request model for avatar artwork lookup.
 */
export interface AvatarImageRequest {
  avatarRole: AvatarRoleId | string | undefined
  mood: AvatarMood | string | undefined
}

/**
 * UI helper for requesting a scenario scene background.
 *
 * Usage from a component:
 * const sceneUrl = requestSceneBackground('strategic_war_room')
 * <img :src="sceneUrl" alt="" />
 */
export function requestSceneBackground(sceneId: SceneBackgroundId | string | undefined): string {
  return getSceneBackgroundAssetUrl(sceneId)
}

/**
 * UI helper for requesting avatarRole mood art.
 *
 * Usage from a component:
 * const avatarUrl = requestAvatarRoleImage({ avatarRole: 'wizard', mood: 'concerned' })
 * <img :src="avatarUrl" alt="" />
 */
export function requestAvatarRoleImage(request: AvatarImageRequest): string {
  return getAvatarRoleAssetUrl(request.avatarRole, request.mood)
}

export const PRESENTATION_ASSET_DEFAULTS = {
  sceneBackgroundId: DEFAULT_SCENE_BACKGROUND_ID,
  avatarRoleId: DEFAULT_AVATAR_ROLE_ID,
  avatarMood: DEFAULT_AVATAR_MOOD,
} as const
