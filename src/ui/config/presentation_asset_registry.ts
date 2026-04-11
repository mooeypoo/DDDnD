import logoMarkUrl from '@/assets/presentation/branding/logo_mark.svg?url'

import boundaryMagePortraitUrl from '@/assets/presentation/avatars/player-classes/boundary_mage.svg?url'
import stakeholderBardPortraitUrl from '@/assets/presentation/avatars/player-classes/stakeholder_bard.svg?url'
import reliabilityClericPortraitUrl from '@/assets/presentation/avatars/player-classes/reliability_cleric.svg?url'
import legacyRangerPortraitUrl from '@/assets/presentation/avatars/player-classes/legacy_ranger.svg?url'
import deliveryRoguePortraitUrl from '@/assets/presentation/avatars/player-classes/delivery_rogue.svg?url'

import refactorActionUrl from '@/assets/presentation/action-effect-icons/cards/refactor_action.svg?url'
import infrastructureInvestmentUrl from '@/assets/presentation/action-effect-icons/cards/infrastructure_investment.svg?url'
import quickPatchUrl from '@/assets/presentation/action-effect-icons/cards/quick_patch.svg?url'

import boundaryBuilderEndingUrl from '@/assets/presentation/ending-visuals/boundary_builder.svg?url'
import firefighterEndingUrl from '@/assets/presentation/ending-visuals/firefighter.svg?url'
import systemStabilizerEndingUrl from '@/assets/presentation/ending-visuals/system_stabilizer.svg?url'
import stakeholderWhispererEndingUrl from '@/assets/presentation/ending-visuals/stakeholder_whisperer.svg?url'
import runawayRefactorerEndingUrl from '@/assets/presentation/ending-visuals/runaway_refactorer.svg?url'

import {
  AVATAR_ROLE_ASSETS,
  DEFAULT_AVATAR_MOOD,
  DEFAULT_AVATAR_ROLE_ID,
  getAvatarRoleAssetUrl,
} from '@/ui/config/presentation_avatar_registry'
import {
  DEFAULT_SCENE_BACKGROUND_ID,
  EVENT_SCENE_ASSETS,
  SCENE_BACKGROUND_ASSETS,
  getSceneBackgroundAssetUrl,
} from '@/ui/config/presentation_scene_registry'
import type {
  AvatarMood,
  AvatarRoleId,
  EventSceneAssetId,
  SceneBackgroundId,
} from '@/ui/config/presentation_asset_types'

export type PlayerClassAssetId =
  | 'boundary_mage'
  | 'stakeholder_bard'
  | 'reliability_cleric'
  | 'legacy_ranger'
  | 'delivery_rogue'

export type EndingVisualId =
  | 'boundary_builder'
  | 'firefighter'
  | 'system_stabilizer'
  | 'stakeholder_whisperer'
  | 'runaway_refactorer'

export type CardArtworkAssetId =
  | 'refactor_action'
  | 'infrastructure_investment'
  | 'quick_patch'

export const BRANDING_ASSETS = {
  logo_mark: logoMarkUrl,
} as const

export const UI_SURFACE_ASSETS = {
  // Reserved for reusable decorative frames, separators, and panel textures.
} as const

export const SCENE_ASSETS = {
  backgrounds: SCENE_BACKGROUND_ASSETS,
  events: EVENT_SCENE_ASSETS as Record<EventSceneAssetId, string>,
} as const

export const STAKEHOLDER_AVATAR_ROLE_ASSETS: Record<AvatarRoleId, Record<AvatarMood, string>> =
  AVATAR_ROLE_ASSETS

export {
  DEFAULT_SCENE_BACKGROUND_ID,
  DEFAULT_AVATAR_ROLE_ID,
  DEFAULT_AVATAR_MOOD,
  getSceneBackgroundAssetUrl,
  getAvatarRoleAssetUrl,
}

export type {
  SceneBackgroundId,
  AvatarRoleId,
  AvatarMood,
}

export const PLAYER_CLASS_ASSETS: Record<PlayerClassAssetId, string> = {
  boundary_mage: boundaryMagePortraitUrl,
  stakeholder_bard: stakeholderBardPortraitUrl,
  reliability_cleric: reliabilityClericPortraitUrl,
  legacy_ranger: legacyRangerPortraitUrl,
  delivery_rogue: deliveryRoguePortraitUrl,
}

export const ACTION_EFFECT_ICON_ASSETS = {
  cards: {
    refactor_action: refactorActionUrl,
    infrastructure_investment: infrastructureInvestmentUrl,
    quick_patch: quickPatchUrl,
  } as Record<CardArtworkAssetId, string>,
  effects: {},
  icons: {},
} as const

export const ENDING_VISUAL_ASSETS: Record<EndingVisualId, string> = {
  boundary_builder: boundaryBuilderEndingUrl,
  firefighter: firefighterEndingUrl,
  system_stabilizer: systemStabilizerEndingUrl,
  stakeholder_whisperer: stakeholderWhispererEndingUrl,
  runaway_refactorer: runawayRefactorerEndingUrl,
}

export const PRESENTATION_ASSET_REGISTRY = {
  branding: BRANDING_ASSETS,
  ui_surfaces: UI_SURFACE_ASSETS,
  scenes: SCENE_ASSETS,
  stakeholder_avatar_roles: STAKEHOLDER_AVATAR_ROLE_ASSETS,
  player_classes: PLAYER_CLASS_ASSETS,
  action_effect_icons: ACTION_EFFECT_ICON_ASSETS,
  ending_visuals: ENDING_VISUAL_ASSETS,
} as const
