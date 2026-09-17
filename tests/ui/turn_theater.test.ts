import { describe, expect, it } from 'vitest'

import type { TurnResolutionContext } from '@/domains/simulation/model/turn_resolution_context'
import {
  buildTurnBeats,
  handFanTransform,
  resolveEventSceneId,
} from '@/ui/play/turn_theater'
import { isWarTableEnabled, resolvePlayStage } from '@/ui/play/use_war_table_flag'
import { scoreWeather, shortMetricLabel } from '@/ui/play/weather_band'

function emptyActionPresentation() {
  return {
    selected_action: { id: 'card_split', version: 1 },
    score_changes: [{ score_id: 'maintainability', delta: 8 }],
    stakeholder_changes: [],
    queued_delayed_effects: [],
    presentation: {
      title: 'Split the Monolith',
      summary: 'You carved a cleaner boundary.',
    },
  }
}

function baseContext(overrides: Partial<TurnResolutionContext> = {}): TurnResolutionContext {
  return {
    turn_number: 2,
    resolved_aftershocks: [],
    player_intent: {
      type: 'play_card',
      action_ref: { id: 'card_split', version: 1 },
    },
    selected_action: { id: 'card_split', version: 1 },
    action_resolution: emptyActionPresentation(),
    event_resolution: {
      selected_event: { id: 'audit_surprise', version: 1 },
      score_changes: [{ score_id: 'budget', delta: -4 }],
      stakeholder_changes: [],
      queued_delayed_effects: [],
      presentation: {
        title: 'Surprise Audit',
        summary: 'Compliance arrived uninvited.',
      },
    },
    stakeholder_resolution: {
      reactions: [
        {
          stakeholder_id: 'cto',
          applied_rule_refs: [],
          score_changes: [],
          stakeholder_changes: [{ stakeholder_id: 'cto', delta: 3 }],
          presentation: {
            title: 'The CTO nods',
            summary: 'This might actually work.',
          },
        },
      ],
      presentation: {
        title: 'Council reacts',
        summary: 'Voices around the table.',
      },
    },
    total_score_changes: [],
    total_stakeholder_changes: [],
    ...overrides,
  }
}

describe('buildTurnBeats', () => {
  it('replays engine phases in pipeline order without inventing extra beats', () => {
    const beats = buildTurnBeats(baseContext({
      resolved_aftershocks: [
        {
          effect_instance_id: 'ash-1',
          effect_id: 'delayed_split_cost',
          effect_version: 1,
          source_type: 'card',
          source_id: 'card_split',
          source_version: 1,
          score_changes: [{ score_id: 'team_morale', delta: -6 }],
          stakeholder_changes: [],
          presentation: {
            title: 'The cut still stings',
            summary: 'Yesterday’s boundary work lands.',
          },
        },
      ],
    }), {
      stakeholderName: (id) => (id === 'cto' ? 'Chief Wizard' : id),
    })

    expect(beats.map((beat) => beat.kind)).toEqual([
      'aftershock',
      'action',
      'event',
      'stakeholder',
    ])
    expect(beats[0]?.title).toBe('The cut still stings')
    expect(beats[1]?.title).toBe('Split the Monolith')
    expect(beats[3]?.title).toBe('Chief Wizard')
    expect(beats[3]?.stakeholder_id).toBe('cto')
  })

  it('treats consult as a search beat, not a played card', () => {
    const beats = buildTurnBeats(baseContext({
      player_intent: {
        type: 'consult_archives',
        discarded_refs: [{ id: 'card_patch', version: 1 }],
        drawn_refs: [{ id: 'card_split', version: 1 }],
      },
      action_resolution: {
        selected_action: { id: 'card_patch', version: 1 },
        score_changes: [],
        stakeholder_changes: [],
        queued_delayed_effects: [],
        presentation: {
          title: 'Consult the Archives',
          summary: 'You searched the remaining options instead of committing an architectural move.',
          flavor_text: 'The system did not pause while you looked.',
        },
      },
    }), {
      cardName: (id) => (id === 'card_patch' ? 'Quick Patch' : id),
    })

    expect(beats[0]?.kind).toBe('consult')
    expect(beats[0]?.title).toBe('Consult the Archives')
    expect(beats[0]?.summary).toContain('Quick Patch')
  })
})

describe('handFanTransform', () => {
  it('centers a six-card fan', () => {
    const first = handFanTransform(0, 6)
    const last = handFanTransform(5, 6)
    expect(first.rotate).toBeLessThan(0)
    expect(last.rotate).toBeGreaterThan(0)
    expect(first.rotate).toBeCloseTo(-last.rotate, 5)
  })
})

describe('resolveEventSceneId', () => {
  it('picks existing event art from the event id', () => {
    expect(resolveEventSceneId('quarterly_audit')).toBe('audit_pressure')
    expect(resolveEventSceneId('traffic_spike')).toBe('scaling_crisis')
    expect(resolveEventSceneId('mystery_pager')).toBe('system_incident')
  })
})

describe('scoreWeather', () => {
  it('maps score bands to weather without changing the number', () => {
    expect(scoreWeather(80)).toBe('fair')
    expect(scoreWeather(55)).toBe('overcast')
    expect(scoreWeather(25)).toBe('squall')
    expect(scoreWeather(10)).toBe('tempest')
  })

  it('keeps compact labels presentation-only', () => {
    expect(shortMetricLabel('maintainability', 'Maintainability')).toBe('Craft')
  })
})

describe('war table flag', () => {
  it('defaults to the table and honors ?stage=legacy', () => {
    expect(resolvePlayStage()).toBe('table')
    expect(isWarTableEnabled('legacy')).toBe(false)
    expect(isWarTableEnabled('table')).toBe(true)
  })
})
