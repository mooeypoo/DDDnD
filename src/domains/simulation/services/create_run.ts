/**
 * Create Run
 * 
 * Initializes a new game state from a scenario bundle.
 * 
 * Responsibilities:
 * - Create initial game state structure
 * - Set starting score values from scenario
 * - Initialize stakeholder satisfaction
 * - Set turn counter to 1
 * - Initialize empty turn history
 * - Create run analytics tracking
 */

import { ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { VersionedContentRef } from '@/shared/contracts'
import { CreateInitialGameStateInput, GameState, createInitialGameState } from '../model'

function toVersionedContentRef(ref: { id: string; version: number }): VersionedContentRef {
  return {
    id: ref.id,
    version: ref.version
  }
}

function hashSeed(seed: string): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function createDeterministicRunId(scenarioBundle: ScenarioBundle, seed: string): string {
  const scenarioKey = versionRefKey({
    id: scenarioBundle.scenario.id,
    version: scenarioBundle.scenario.version
  })

  return `run__${scenarioKey}__${hashSeed(seed).toString(36)}`
}

function createDeterministicTimestamp(seed: string): string {
  const secondsSinceEpoch = hashSeed(seed)
  return new Date(secondsSinceEpoch * 1000).toISOString()
}

export function createRun(scenarioBundle: ScenarioBundle, seed: string): GameState {
  const input: CreateInitialGameStateInput = {
    run_id: createDeterministicRunId(scenarioBundle, seed),
    seed,
    scenario_ref: toVersionedContentRef(scenarioBundle.scenario),
    max_turns: scenarioBundle.scenario.max_turns,
    starting_scores: scenarioBundle.scenario.starting_scores,
    stakeholder_refs: scenarioBundle.scenario.stakeholder_refs.map(toVersionedContentRef),
    available_action_refs: scenarioBundle.scenario.card_refs.map(toVersionedContentRef),
    available_event_refs: scenarioBundle.scenario.event_refs.map(toVersionedContentRef),
    created_at_utc: createDeterministicTimestamp(seed)
  }

  return createInitialGameState(input)
}
