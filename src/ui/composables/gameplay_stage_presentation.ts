import type { StakeholderSnapshot } from '@/domains/simulation/model'
import type { AvatarMood, AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import type { SceneActorSlot } from '@/ui/composables/scene_avatar_positioning'

export interface GameplayStageActor {
  id: string
  displayName: string
  satisfaction: number
  avatarRole: AvatarRoleId
  mood: AvatarMood
  slot: SceneActorSlot
}

const AVATAR_ROLE_ROTATION: AvatarRoleId[] = [
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

export function resolveStakeholderAvatarRole(stakeholderId: string): AvatarRoleId {
  const hash = stakeholderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_ROLE_ROTATION[hash % AVATAR_ROLE_ROTATION.length]
}

export function buildGameplayStageActors(
  stakeholders: StakeholderSnapshot | undefined,
  stakeholderNames: Record<string, string>
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
      avatarRole: resolveStakeholderAvatarRole(stakeholderId),
      mood: resolveStakeholderMood(data.satisfaction),
      slot: ACTOR_SLOTS[index] ?? 'far',
    }))
}
