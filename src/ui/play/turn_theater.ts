/**
 * Session director helpers for the war table.
 *
 * `play_turn` / `consult_archives` stay atomic in the engine. This module only
 * sequences the already-resolved `turn_resolution_context` into presentation
 * beats. It does not pick events, apply rules, or invent card legality.
 */

import type {
  ScoreChangeRecord,
  StakeholderChangeRecord,
} from '@/shared/contracts'
import type {
  PlayerTurnIntent,
  TurnResolutionContext,
} from '@/domains/simulation/model/turn_resolution_context'
import type { EventSceneAssetId } from '@/ui/config/presentation_asset_types'
import { consultReplaceSummary } from '@/ui/play/hand_swap'

export type TurnBeatSource = Pick<
  TurnResolutionContext,
  | 'turn_number'
  | 'resolved_aftershocks'
  | 'player_intent'
  | 'action_resolution'
  | 'event_resolution'
  | 'stakeholder_resolution'
>

export type TurnBeatKind = 'aftershock' | 'action' | 'consult' | 'event' | 'stakeholder'

export interface TurnBeat {
  id: string
  kind: TurnBeatKind
  title: string
  summary: string
  flavor_text?: string
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  stakeholder_id?: string
  event_id?: string
}

export interface TurnTheaterNames {
  cardName?: (id: string) => string
  stakeholderName?: (id: string) => string
}

export interface AnnalsTurn {
  turn_number: number
  intent: PlayerTurnIntent['type']
  title: string
  summary: string
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  beats: TurnBeat[]
}

/**
 * Player-facing kicker for one theater beat.
 */
export function beatKicker(kind: TurnBeatKind | undefined): string {
  switch (kind) {
    case 'aftershock':
      return 'Aftershock'
    case 'action':
      return 'You play'
    case 'consult':
      return 'You search'
    case 'event':
      return 'The system moves'
    case 'stakeholder':
      return 'The council speaks'
    default:
      return 'The table'
  }
}

/**
 * Builds ordered presentation beats from one resolved turn.
 *
 * Replay order is the player's move, then aftershocks, then the system.
 * The engine still computes aftershocks first; this only changes the table
 * so the card the player just committed is visible before last turn lands.
 */
export function buildTurnBeats(
  context: TurnBeatSource,
  names: TurnTheaterNames = {},
): TurnBeat[] {
  const beats: TurnBeat[] = []

  if (context.player_intent.type === 'consult_archives') {
    const discardedId = context.player_intent.discarded_refs[0]?.id
    const discardedName = discardedId
      ? names.cardName?.(discardedId) ?? discardedId
      : null
    const drawnId = context.player_intent.drawn_refs[0]?.id
    const drawnName = drawnId
      ? names.cardName?.(drawnId) ?? drawnId
      : null
    const summary = consultReplaceSummary(discardedName, drawnName)

    beats.push({
      id: `consult-${context.turn_number}`,
      kind: 'consult',
      title: context.action_resolution.presentation.title,
      summary,
      flavor_text: context.action_resolution.presentation.flavor_text,
      score_changes: context.action_resolution.score_changes,
      stakeholder_changes: context.action_resolution.stakeholder_changes,
    })
  } else {
    beats.push({
      id: `action-${context.turn_number}`,
      kind: 'action',
      title: context.action_resolution.presentation.title,
      summary: context.action_resolution.presentation.summary,
      flavor_text: context.action_resolution.presentation.flavor_text,
      score_changes: context.action_resolution.score_changes,
      stakeholder_changes: context.action_resolution.stakeholder_changes,
    })
  }

  for (const aftershock of context.resolved_aftershocks) {
    beats.push({
      id: `aftershock-${aftershock.effect_instance_id}`,
      kind: 'aftershock',
      title: aftershock.presentation.title,
      summary: aftershock.presentation.summary,
      flavor_text: aftershock.presentation.flavor_text,
      score_changes: aftershock.score_changes,
      stakeholder_changes: aftershock.stakeholder_changes,
    })
  }

  if (context.event_resolution) {
    beats.push({
      id: `event-${context.event_resolution.selected_event.id}`,
      kind: 'event',
      title: context.event_resolution.presentation.title,
      summary: context.event_resolution.presentation.summary,
      flavor_text: context.event_resolution.presentation.flavor_text,
      score_changes: context.event_resolution.score_changes,
      stakeholder_changes: context.event_resolution.stakeholder_changes,
      event_id: context.event_resolution.selected_event.id,
    })
  }

  for (const reaction of context.stakeholder_resolution.reactions) {
    const displayName = names.stakeholderName?.(reaction.stakeholder_id)
    beats.push({
      id: `stakeholder-${reaction.stakeholder_id}-${context.turn_number}`,
      kind: 'stakeholder',
      title: displayName ?? reaction.presentation.title,
      summary: reaction.presentation.summary,
      flavor_text: reaction.presentation.flavor_text,
      score_changes: reaction.score_changes,
      stakeholder_changes: reaction.stakeholder_changes,
      stakeholder_id: reaction.stakeholder_id,
    })
  }

  return beats
}

/**
 * Groups engine history into newest-first Annals turns.
 *
 * Presentation only. Totals come from the history entry when present.
 */
export function buildAnnalsTurns(
  history: Array<TurnBeatSource & {
    total_score_changes?: ScoreChangeRecord[]
    total_stakeholder_changes?: StakeholderChangeRecord[]
  }>,
  names: TurnTheaterNames = {},
): AnnalsTurn[] {
  return [...history].reverse().map((entry) => {
    const beats = buildTurnBeats(entry, names)
    const commitment = beats.find((beat) => beat.kind === 'action' || beat.kind === 'consult')

    return {
      turn_number: entry.turn_number,
      intent: entry.player_intent.type,
      title: commitment?.title ?? `Turn ${entry.turn_number}`,
      summary: commitment?.summary ?? '',
      score_changes: entry.total_score_changes ?? commitment?.score_changes ?? [],
      stakeholder_changes: entry.total_stakeholder_changes ?? commitment?.stakeholder_changes ?? [],
      beats,
    }
  })
}

/**
 * Maps an event id/title to existing event-scene artwork. Presentation only.
 */
export function resolveEventSceneId(eventId: string, title = ''): EventSceneAssetId {
  const haystack = `${eventId} ${title}`.toLowerCase()

  if (/audit|compliance|regulat|legal|policy/.test(haystack)) {
    return 'audit_pressure'
  }

  if (/scale|growth|traffic|load|capacity|demand/.test(haystack)) {
    return 'scaling_crisis'
  }

  return 'system_incident'
}

export { handFanTransform } from './card_fan'
