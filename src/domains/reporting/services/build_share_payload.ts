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
  /** Set for runs played with a community pack: its name and publisher, as the UI shows them. */
  community_pack?: { name: string; publisher: string } | null
  /** Display names of the ending and tier, from the run's content. */
  names?: { archetype: string; tier: string }
  /** Display names of the scenario and class, from the run's content (journal M3.11). */
  run_names?: {
    scenario?: string
    player_class?: string
    /** Stakeholder display names, by id. */
    stakeholders?: Record<string, string>
    /** Score short names, by id. */
    scores?: Record<string, string>
  }
}

/** Names for the ids the payload carries, or nothing when there are none. */
function namesFor<K extends 'stn' | 'scn'>(
  field: K,
  carried: Record<string, number>,
  names: Record<string, string> | undefined,
): Partial<Record<K, Record<string, string>>> {
  if (!names) return {}
  const picked = Object.fromEntries(Object.keys(carried).filter((id) => names[id]).map((id) => [id, names[id]]))
  return Object.keys(picked).length > 0 ? ({ [field]: picked } as Partial<Record<K, Record<string, string>>>) : {}
}

/**
 * Build a share payload from the canonical run outcome and final game state.
 *
 * Scores are rounded to integers for compactness.
 */
export function buildSharePayload(input: BuildSharePayloadInput): SharePayload {
  const { run_outcome, game_state, community_pack, names, run_names } = input

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
    cr: run_outcome.completion_reason,
    sd: game_state.meta.seed || undefined,
    ...(community_pack ? { cp: { n: community_pack.name, p: community_pack.publisher } } : {}),
    ...(names ? { an: names.archetype, tn: names.tier } : {}),
    ...(run_names?.scenario ? { sn: run_names.scenario } : {}),
    ...(run_names?.player_class ? { cn: run_names.player_class } : {}),
    ...namesFor('stn', roundedStakeholders, run_names?.stakeholders),
    ...namesFor('scn', roundedScores, run_names?.scores)
  }
}
