import fortifiedMonolithHallUrl from '@/assets/presentation/scenes/scenario/fortified_monolith_hall/background.png?url'
import strategicWarRoomUrl from '@/assets/presentation/scenes/scenario/strategic_war_room/background.png?url'
import archiveLibraryChamberUrl from '@/assets/presentation/scenes/scenario/archive_library_chamber/background.png?url'

import systemIncidentSceneUrl from '@/assets/presentation/scenes/events/system_incident.svg?url'
import auditPressureSceneUrl from '@/assets/presentation/scenes/events/audit_pressure.svg?url'
import scalingCrisisSceneUrl from '@/assets/presentation/scenes/events/scaling_crisis.svg?url'

import type { EventSceneAssetId, SceneBackgroundId } from './presentation_asset_types'

export const DEFAULT_SCENE_BACKGROUND_ID: SceneBackgroundId = 'fortified_monolith_hall'

export const SCENE_BACKGROUND_ASSETS: Record<SceneBackgroundId, string> = {
  fortified_monolith_hall: fortifiedMonolithHallUrl,
  strategic_war_room: strategicWarRoomUrl,
  archive_library_chamber: archiveLibraryChamberUrl,
}

export const EVENT_SCENE_ASSETS: Record<EventSceneAssetId, string> = {
  system_incident: systemIncidentSceneUrl,
  audit_pressure: auditPressureSceneUrl,
  scaling_crisis: scalingCrisisSceneUrl,
}

export function getSceneBackgroundAssetUrl(
  sceneId: SceneBackgroundId | string | undefined
): string {
  if (!sceneId || !(sceneId in SCENE_BACKGROUND_ASSETS)) {
    return SCENE_BACKGROUND_ASSETS[DEFAULT_SCENE_BACKGROUND_ID]
  }

  return SCENE_BACKGROUND_ASSETS[sceneId as SceneBackgroundId]
}
