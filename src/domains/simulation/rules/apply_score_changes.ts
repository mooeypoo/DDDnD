import { ScenarioBundle } from '@/domains/content/model'
import { ScoreChangeRecord } from '@/shared/contracts'
import { GameState } from '../model'

export function applyScoreChanges(
  scores: GameState['scores'],
  scoreChanges: ScoreChangeRecord[],
  scenarioBundle: ScenarioBundle
): GameState['scores'] {
  const nextScores: GameState['scores'] = { ...scores }

  for (const change of scoreChanges) {
    const score = nextScores[change.score_id] ?? 0
    const scoreDefinition = Array.from(scenarioBundle.scores.values()).find(
      (candidate) => candidate.id === change.score_id
    )

    let nextValue = score + change.delta

    if (typeof scoreDefinition?.min_value === 'number') {
      nextValue = Math.max(scoreDefinition.min_value, nextValue)
    }

    if (typeof scoreDefinition?.max_value === 'number') {
      nextValue = Math.min(scoreDefinition.max_value, nextValue)
    }

    nextScores[change.score_id] = nextValue
  }

  return nextScores
}
