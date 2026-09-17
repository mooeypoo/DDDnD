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
import type { TurnResolutionContext } from '@/domains/simulation/model/turn_resolution_context'
import type { EventSceneAssetId } from '@/ui/config/presentation_asset_types'

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

export const TURN_BEAT_DURATION_MS: Record<TurnBeatKind, number> = {
  aftershock: 1700,
  action: 2100,
  consult: 2100,
  event: 1900,
  stakeholder: 1500,
}

/**
 * Builds ordered presentation beats from one resolved turn.
 *
 * Order matches the engine pipeline: aftershocks, player intent, event,
 * then each stakeholder reaction.
 */
export function buildTurnBeats(
  context: TurnResolutionContext,
  names: TurnTheaterNames = {},
): TurnBeat[] {
  const beats: TurnBeat[] = []

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

  if (context.player_intent.type === 'consult_archives') {
    const discardedId = context.player_intent.discarded_refs[0]?.id
    const discardedName = discardedId
      ? names.cardName?.(discardedId) ?? discardedId
      : null
    const summary = discardedName
      ? `${context.action_resolution.presentation.summary} You set aside ${discardedName}.`
      : context.action_resolution.presentation.summary

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

/**
 * Fan placement for a legal hand along the near edge of the table.
 */
export function handFanTransform(index: number, count: number): { rotate: number; y: number } {
  if (count <= 1) {
    return { rotate: 0, y: 0 }
  }

  const spread = Math.min(42, 9 * (count - 1))
  const start = -spread / 2
  const step = spread / (count - 1)
  const rotate = start + step * index
  const y = Math.abs(rotate) * 0.5

  return { rotate, y }
}
