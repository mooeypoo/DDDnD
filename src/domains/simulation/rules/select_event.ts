import { Event, ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { VersionedContentRef } from '@/shared/contracts'
import { SeededRandom } from '@/shared/random/seeded_random'
import { GameState } from '../model'
import {
  ConditionEvaluationState,
  evaluateNumericCondition,
  parseConditionDescription
} from './condition_evaluator'

export interface EligibleEvent {
  event_ref: VersionedContentRef
  event: Event
  weight: number
}

export function collectEligibleEvents(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  conditionState: ConditionEvaluationState
): EligibleEvent[] {
  const events = gameState.event_state.available_event_refs
    .map((eventRef) => {
      const event = scenarioBundle.events.get(versionRefKey(eventRef))
      if (!event) {
        return null
      }

      const weight = Math.max(0, event.occurrence_weight ?? 0)
      if (weight <= 0) {
        return null
      }

      if (event.trigger_condition_description) {
        const condition = parseConditionDescription(event.trigger_condition_description, scenarioBundle)
        if (!condition || !evaluateNumericCondition(condition, conditionState)) {
          return null
        }
      }

      return {
        event_ref: eventRef,
        event,
        weight
      }
    })
    .filter((value): value is EligibleEvent => value !== null)

  return events.sort((a, b) => {
    const idComparison = a.event_ref.id.localeCompare(b.event_ref.id)
    if (idComparison !== 0) {
      return idComparison
    }

    return a.event_ref.version - b.event_ref.version
  })
}

export function selectEvent(
  gameState: GameState,
  scenarioBundle: ScenarioBundle,
  random: SeededRandom,
  conditionState: ConditionEvaluationState
): EligibleEvent | null {
  const eligibleEvents = collectEligibleEvents(gameState, scenarioBundle, conditionState)

  if (eligibleEvents.length === 0) {
    return null
  }

  const totalWeight = eligibleEvents.reduce((sum, candidate) => sum + candidate.weight, 0)
  if (totalWeight <= 0) {
    return null
  }

  const roll = random.nextInt(1, totalWeight)
  let cursor = 0

  for (const candidate of eligibleEvents) {
    cursor += candidate.weight
    if (roll <= cursor) {
      return candidate
    }
  }

  return eligibleEvents[eligibleEvents.length - 1]
}
