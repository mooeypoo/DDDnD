import type { StakeholderSnapshot } from '@/domains/simulation/model'
import type { AvatarMood, AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import type { SceneActorSlot } from '@/ui/composables/scene_avatar_positioning'
import type { StakeholderReactionBubbleTone } from '@/ui/config/stakeholder_reaction_bubble_language'

export interface StakeholderSpeechBubblePresentation {
  text: string
  tone: StakeholderReactionBubbleTone
}

export interface GameplayStageActor {
  id: string
  displayName: string
  satisfaction: number
  avatarRole: AvatarRoleId
  mood: AvatarMood
  slot: SceneActorSlot
  speechBubble?: StakeholderSpeechBubblePresentation
}

export const ALL_SCENE_BACKGROUND_IDS: SceneBackgroundId[] = [
  'fortified_monolith_hall',
  'strategic_war_room',
  'archive_library_chamber',
]

export const AVATAR_ROLE_ROTATION: AvatarRoleId[] = [
  'wizard',
  'rogue',
  'paladin',
  'witch',
  'cleric',
  'bard',
  'warrior',
  'sorcerer',
  'dragonwarrior',
]

const ACTOR_SLOTS: SceneActorSlot[] = ['left', 'center', 'right', 'far']

export function pickRandomSceneId(): SceneBackgroundId {
  return ALL_SCENE_BACKGROUND_IDS[Math.floor(Math.random() * ALL_SCENE_BACKGROUND_IDS.length)]
}

export function shuffleAvatarRoles(): AvatarRoleId[] {
  const roles = [...AVATAR_ROLE_ROTATION]
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[roles[i], roles[j]] = [roles[j], roles[i]]
  }
  return roles
}

export function resolveGameplaySceneId(scenarioId: string | undefined): SceneBackgroundId {
  if (!scenarioId) {
    return 'fortified_monolith_hall'
  }

  if (/microservice|distributed|sprawl/i.test(scenarioId)) {
    return 'strategic_war_room'
  }

  if (/compliance|audit|archive|library/i.test(scenarioId)) {
    return 'archive_library_chamber'
  }

  return 'fortified_monolith_hall'
}

export function resolveStakeholderMood(satisfaction: number): AvatarMood {
  if (satisfaction >= 70) {
    return 'happy'
  }

  if (satisfaction >= 50) {
    return 'neutral'
  }

  if (satisfaction >= 30) {
    return 'concerned'
  }

  return 'angry'
}

export function resolveStakeholderAvatarRole(stakeholderId: string, rolePool: AvatarRoleId[] = AVATAR_ROLE_ROTATION): AvatarRoleId {
  const hash = stakeholderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return rolePool[hash % rolePool.length]
}

export function buildGameplayStageActors(
  stakeholders: StakeholderSnapshot | undefined,
  stakeholderNames: Record<string, string>,
  rolePool?: AvatarRoleId[],
  speechBubblesByStakeholderId: Record<string, StakeholderSpeechBubblePresentation> = {},
): GameplayStageActor[] {
  if (!stakeholders) {
    return []
  }

  return Object.entries(stakeholders)
    .slice(0, 4)
    .map(([stakeholderId, data], index) => ({
      id: stakeholderId,
      displayName: stakeholderNames[stakeholderId] ?? stakeholderId,
      satisfaction: data.satisfaction,
      avatarRole: resolveStakeholderAvatarRole(stakeholderId, rolePool),
      mood: resolveStakeholderMood(data.satisfaction),
      slot: ACTOR_SLOTS[index] ?? 'far',
      speechBubble: speechBubblesByStakeholderId[stakeholderId],
    }))
}
