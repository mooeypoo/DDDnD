/**
 * Build Share Payload
 *
 * Constructs a compact SharePayload from the canonical run outcome
 * and game state. This is the single source of truth for what goes
 * into a share link.
 *
 * Lives in the reporting domain — reads engine output, does not
 * modify simulation state.
 */

import type { GameState } from '@/domains/simulation/model'
import type { RunOutcome } from '@/domains/simulation/services/get_run_outcome'
import { SHARE_PAYLOAD_VERSION, type SharePayload } from './share_payload'

export interface BuildSharePayloadInput {
  run_outcome: RunOutcome
  game_state: GameState
}

/**
 * Build a share payload from the canonical run outcome and final game state.
 *
 * Scores are rounded to integers for compactness.
 */
export function buildSharePayload(input: BuildSharePayloadInput): SharePayload {
  const { run_outcome, game_state } = input

  const roundedScores: Record<string, number> = {}
  for (const [scoreId, value] of Object.entries(game_state.scores)) {
    roundedScores[scoreId] = Math.round(value)
  }

  const roundedStakeholders: Record<string, number> = {}
  for (const [stakeholderId, state] of Object.entries(game_state.stakeholders)) {
    roundedStakeholders[stakeholderId] = Math.round(state.satisfaction)
  }

  return {
    v: SHARE_PAYLOAD_VERSION,
    sid: run_outcome.scenario_id,
    sv: run_outcome.scenario_version,
    cls: game_state.player_profile.selected_class_ref?.id ?? 'unknown',
    name: game_state.player_profile.display_name || undefined,
    tier: run_outcome.tier,
    arch: run_outcome.archetype,
    tid: run_outcome.selected_tier_id,
    tc: run_outcome.turns_completed,
    mt: run_outcome.max_turns,
    avg: Math.round(run_outcome.score_average),
    scores: roundedScores,
    stakeholders: roundedStakeholders,
    cr: run_outcome.completion_reason
  }
}
