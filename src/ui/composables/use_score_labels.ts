/**
 * Vue access to pack-backed score labels for the active run.
 *
 * Safe without an active Pinia (unit mounts fall back to id title-case).
 */

import { getActivePinia } from 'pinia'

import { useGameStore } from '@/ui/stores/game_store'
import {
  findScoreById,
  resolveScoreLabels,
  scoreConversionLabel,
  scoreFullName,
  scoreShortName,
} from '@/ui/play/score_labels'

/**
 * Resolves short/full score names from the loaded scenario bundle.
 */
export function useScoreLabels() {
  const pinia = getActivePinia()
  const gameStore = pinia ? useGameStore() : null

  function scoreFor(scoreId: string) {
    return findScoreById(gameStore?.scenarioBundle?.scores, scoreId)
  }

  return {
    short: (scoreId: string) => scoreShortName(scoreId, scoreFor(scoreId)),
    full: (scoreId: string) => scoreFullName(scoreId, scoreFor(scoreId)),
    conversion: (scoreId: string) => scoreConversionLabel(scoreId, scoreFor(scoreId)),
    labels: (scoreId: string) => resolveScoreLabels(scoreId, scoreFor(scoreId)),
  }
}
