import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { BASE_PACK_ID } from '@/domains/content/validation/pack_policy'
import type { StakeholderSnapshot } from '@/domains/simulation/model'
import { createSeededRandom } from '@/shared/random/seeded_random'
import type { AvatarMood, AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import type { SceneActorSlot } from '@/ui/composables/scene_avatar_positioning'
import type { StakeholderReactionBubbleTone } from '@/ui/config/stakeholder_reaction_bubble_language'

/**
 * UI-only speech bubble presentation payload for scene actors.
 */
export interface StakeholderSpeechBubblePresentation {
  text: string
  tone: StakeholderReactionBubbleTone
}

/**
 * UI-only scene actor projection derived from stakeholder runtime state.
 */
export interface GameplayStageActor {
  id: string
  displayName: string
  satisfaction: number
  avatarRole: AvatarRoleId
  mood: AvatarMood
  slot: SceneActorSlot
  /** Seat index at the war table (0 = leftmost). */
  seat?: number
  speechBubble?: StakeholderSpeechBubblePresentation
}

export const ALL_SCENE_BACKGROUND_IDS: SceneBackgroundId[] = [
  'fortified_monolith_hall',
  'strategic_war_room',
  'archive_library_chamber',
  'dark_dungeon_room',
  'medieval_throne_room',
  'forge_of_heroes',
]

/**
 * Hand-picked scenes for first-party scenarios. Presentation only: content
 * packs never name a scene (ADR 0002). Keyed by scenario id, and only used
 * for first-party packs, so a community scenario that reuses one of these
 * ids doesn't borrow its scene (ADR 0014).
 */
const FIRST_PARTY_SCENE_BY_SCENARIO_ID: Record<string, SceneBackgroundId> = {
  monolith_of_mild_despair: 'fortified_monolith_hall',
  microservice_sprawl: 'strategic_war_room',
  compliance_gauntlet: 'archive_library_chamber',
  startup_hypergrowth: 'medieval_throne_room',
  merger_of_minor_chaos: 'dark_dungeon_room',
  tutorial_basics: 'forge_of_heroes',
  tutorial_systems_under_pressure: 'dark_dungeon_room',
}

const DEFAULT_SCENE_ID: SceneBackgroundId = 'fortified_monolith_hall'

export const AVATAR_ROLE_ROTATION: readonly AvatarRoleId[] = [
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

/**
 * Salt for the presentation generator. It keeps the cast's random stream
 * apart from the simulation's, which is seeded with the bare run seed: art can
 * never change gameplay (ADR 0002, decision 3). Changing the salt reshuffles
 * every run's cast, which is cosmetic.
 */
const CAST_SALT = 'dddnd:presentation-cast:v1'

/** A run's cast: which avatar role plays each stakeholder. */
export type RunCast = Readonly<Record<string, AvatarRoleId>>

/** Small stable string hash (FNV-1a), for picks that have no run seed. */
function stableHash(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * The cast for one run (ADR 0002). Every screen that draws a stakeholder
 * (play, end of run, share card) calls this with the same seed and the same
 * stakeholders, so a stakeholder looks the same everywhere and after a reload.
 *
 * - Distinct: stakeholders get different roles until the pool runs out, then
 *   it cycles. Validation caps stakeholders below the pool size.
 * - Stable: roles go out in sorted id order, so the order stakeholders are
 *   listed in doesn't matter.
 * - Separate: its own generator instance with its own salt; the simulation's
 *   random stream is never touched.
 *
 * `seed` may be empty (share links made before the seed was shared); the cast
 * is then still distinct and stable, just the same for every such link.
 */
export function buildRunCast(
  seed: string,
  stakeholderIds: Iterable<string>,
  pool: readonly AvatarRoleId[] = AVATAR_ROLE_ROTATION,
): RunCast {
  const random = createSeededRandom(`${CAST_SALT}|${seed}`)
  const roles = [...pool]
  for (let i = roles.length - 1; i > 0; i--) {
    const j = random.nextInt(0, i)
    ;[roles[i], roles[j]] = [roles[j], roles[i]]
  }

  const ids = [...new Set(stakeholderIds)].sort()
  const cast: Record<string, AvatarRoleId> = {}
  ids.forEach((id, index) => {
    cast[id] = roles[index % roles.length]
  })
  return cast
}

/**
 * A stakeholder's role in a cast. A stakeholder the cast doesn't know (which
 * shouldn't happen) still gets a stable role rather than none.
 */
export function castRoleFor(cast: RunCast, stakeholderId: string): AvatarRoleId {
  return cast[stakeholderId] ?? AVATAR_ROLE_ROTATION[stableHash(stakeholderId) % AVATAR_ROLE_ROTATION.length]
}

/**
 * The scene for a scenario (ADR 0002, decision 4).
 *
 * First-party scenarios keep their hand-picked scene. Any other scenario gets
 * a pick from the scene pool derived from its pack key and id, so the lobby
 * preview and the run show the same scene, and two packs' same-named
 * scenarios can differ. A missing pack key means first-party: runs and quests
 * from before pack identity always were.
 */
export function resolveScenarioSceneId(
  scenarioId: string | undefined,
  packKey: string = firstPartyPackKey(BASE_PACK_ID),
): SceneBackgroundId {
  if (!scenarioId) {
    return DEFAULT_SCENE_ID
  }

  if (packKey.startsWith(firstPartyPackKey(''))) {
    const handPicked = FIRST_PARTY_SCENE_BY_SCENARIO_ID[scenarioId]
    if (handPicked) {
      return handPicked
    }
  }

  return ALL_SCENE_BACKGROUND_IDS[stableHash(`${packKey}|${scenarioId}`) % ALL_SCENE_BACKGROUND_IDS.length]
}

/**
 * Maps stakeholder satisfaction to presentation mood.
 */
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

/** Player-facing word for a seat's mood, shared by seats and the "others" list. */
export function stakeholderMoodLabel(mood: AvatarMood | string): string {
  switch (mood) {
    case 'happy':
      return 'Allied'
    case 'neutral':
      return 'Watching'
    case 'concerned':
      return 'Uneasy'
    case 'angry':
      return 'Opposed'
    default:
      return 'Present'
  }
}

/**
 * Builds scene actor presentation models from stakeholder runtime snapshots.
 */
export function buildGameplayStageActors(
  stakeholders: StakeholderSnapshot | undefined,
  stakeholderNames: Record<string, string>,
  cast: RunCast,
  speechBubblesByStakeholderId: Record<string, StakeholderSpeechBubblePresentation> = {},
  /**
   * Who sits at the table, by seat (see council_seating.ts). Without it, the
   * first four in council order: the table's original behavior.
   */
  seatedIds?: readonly string[],
): GameplayStageActor[] {
  if (!stakeholders) {
    return []
  }

  const ids = seatedIds ?? Object.keys(stakeholders).slice(0, 4)
  return ids
    .filter((stakeholderId) => stakeholders[stakeholderId] !== undefined)
    .map((stakeholderId, index) => {
      const data = stakeholders[stakeholderId]
      return {
        id: stakeholderId,
        displayName: stakeholderNames[stakeholderId] ?? stakeholderId,
        satisfaction: data.satisfaction,
        avatarRole: castRoleFor(cast, stakeholderId),
        mood: resolveStakeholderMood(data.satisfaction),
        slot: ACTOR_SLOTS[index] ?? 'far',
        seat: index,
        speechBubble: speechBubblesByStakeholderId[stakeholderId],
      }
    })
}
