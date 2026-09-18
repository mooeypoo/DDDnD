import { describe, expect, it, vi } from 'vitest'

import type { TurnResolutionContext } from '@/domains/simulation/model/turn_resolution_context'
import {
  buildAnnalsTurns,
  buildTurnBeats,
  beatKicker,
  aftershockOriginLine,
  handFanTransform,
  resolveEventSceneId,
} from '@/ui/play/turn_theater'
import { tableFxDurationMs, impactTone } from '@/ui/play/table_moment'
import { useTurnTheater } from '@/ui/play/use_turn_theater'
import { isWarTableEnabled, resolvePlayStage } from '@/ui/play/use_war_table_flag'
import {
  compactCouplingLabel,
  collapseUrgencyCopy,
  isLateTurnClock,
  remainingTurns,
  scoreWeather,
  describeScoreWeather,
  shortMetricLabel,
} from '@/ui/play/weather_band'
import * as tableMoment from '@/ui/play/table_moment'

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
  it('shows the player move first, then aftershocks, without inventing extra beats', () => {
    const beats = buildTurnBeats(baseContext({
      resolved_aftershocks: [
        {
          effect_instance_id: 'ash-1',
          effect_id: 'delayed_split_cost',
          effect_version: 1,
          source_type: 'card',
          source_id: 'card_split',
          source_version: 1,
          source_turn: 1,
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
      'action',
      'aftershock',
      'event',
      'stakeholder',
    ])
    expect(beats[0]?.title).toBe('Split the Monolith')
    expect(beats[1]?.title).toBe('The cut still stings')
    expect(beats[1]?.origin).toBe('From card_split · last turn')
    expect(beats[3]?.title).toBe('Chief Wizard')
    expect(beats[3]?.stakeholder_id).toBe('cto')
  })

  it('treats consult as a search beat, not a played card', () => {
    const beats = buildTurnBeats(baseContext({
      resolved_aftershocks: [
        {
          effect_instance_id: 'ash-consult',
          effect_id: 'delayed_split_cost',
          effect_version: 1,
          source_type: 'card',
          source_id: 'card_split',
          source_version: 1,
          source_turn: 1,
          score_changes: [{ score_id: 'team_morale', delta: -3 }],
          stakeholder_changes: [],
          presentation: {
            title: 'The cut still stings',
            summary: 'Yesterday’s boundary work lands.',
          },
        },
      ],
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
      cardName: (id) => {
        if (id === 'card_patch') return 'Quick Patch'
        if (id === 'card_split') return 'Split the Monolith'
        return id
      },
    })

    expect(beats.map((beat) => beat.kind).slice(0, 2)).toEqual(['consult', 'aftershock'])
    expect(beats[0]?.kind).toBe('consult')
    expect(beats[0]?.title).toBe('Consult the Archives')
    expect(beats[0]?.summary).toContain('Quick Patch')
    expect(beats[0]?.summary).toContain('Split the Monolith')
  })

  it('names the queued card and how many turns ago from engine fields', () => {
    const beats = buildTurnBeats(
      baseContext({
        turn_number: 4,
        resolved_aftershocks: [
          {
            effect_instance_id: 'ash-age',
            effect_id: 'delayed_split_cost',
            effect_version: 1,
            source_type: 'card',
            source_id: 'card_split',
            source_version: 1,
            source_turn: 2,
            score_changes: [],
            stakeholder_changes: [],
            presentation: {
              title: 'The cut still stings',
              summary: 'Yesterday’s boundary work lands.',
            },
          },
        ],
      }),
      { cardName: (id) => (id === 'card_split' ? 'Split the Monolith' : id) },
    )

    expect(beats.find((beat) => beat.kind === 'aftershock')?.origin).toBe(
      'From Split the Monolith · 2 turns ago',
    )
  })

  it('names an event source without pretending it was a card', () => {
    expect(
      aftershockOriginLine(
        { source_type: 'event', source_id: 'audit_surprise', source_turn: 1 },
        3,
        { eventName: (id) => (id === 'audit_surprise' ? 'Surprise Audit' : id) },
      ),
    ).toBe('From Surprise Audit · 2 turns ago')
  })

  it('still names the source when an old save omitted source_turn', () => {
    expect(
      aftershockOriginLine(
        { source_type: 'card', source_id: 'card_split' },
        4,
        { cardName: () => 'Split the Monolith' },
      ),
    ).toBe('From Split the Monolith')
  })
})

describe('buildAnnalsTurns', () => {
  it('lists engine history newest first without inventing turns', () => {
    const turns = buildAnnalsTurns([
      baseContext({ turn_number: 1 }),
      baseContext({
        turn_number: 2,
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
            summary: 'You searched instead of committing.',
          },
        },
        total_score_changes: [{ score_id: 'budget', delta: -2 }],
      }),
    ], {
      cardName: (id) => (id === 'card_patch' ? 'Quick Patch' : id),
    })

    expect(turns.map((turn) => turn.turn_number)).toEqual([2, 1])
    expect(turns[0]?.intent).toBe('consult_archives')
    expect(turns[0]?.title).toBe('Consult the Archives')
    expect(turns[0]?.summary).toContain('Quick Patch')
    expect(turns[0]?.score_changes).toEqual([{ score_id: 'budget', delta: -2 }])
    expect(beatKicker('consult')).toBe('You search')
    expect(beatKicker('event')).toBe('Reality hits')
    expect(beatKicker('stakeholder')).toBe('The council speaks')
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
    expect(describeScoreWeather(80).label).toBe('Steady')
    expect(describeScoreWeather(55).label).toBe('Strained')
    expect(describeScoreWeather(25).label).toBe('Troubled')
    expect(describeScoreWeather(10).label).toBe('Critical')
  })

  it('keeps compact labels presentation-only', () => {
    expect(shortMetricLabel('maintainability', 'Maintainability')).toBe('Craft')
  })

  it('collapses coupling titles into one weather chip', () => {
    expect(compactCouplingLabel([])).toBeNull()
    expect(compactCouplingLabel(['Delivery Collapse'])).toBe('Delivery Collapse')
    expect(compactCouplingLabel(['Delivery Collapse', 'Morale Collapse'])).toBe('2 systems bound')
  })

  it('says which gains wither until the trigger recovers', () => {
    expect(collapseUrgencyCopy('team_morale', ['maintainability'], 'fallback')).toBe(
      'Craft gains wither until Morale recovers.',
    )
    expect(
      collapseUrgencyCopy('delivery_confidence', ['domain_clarity', 'maintainability'], 'fallback'),
    ).toBe('Clarity and Craft gains wither until Delivery recovers.')
    expect(collapseUrgencyCopy('user_trust', [], 'Delivery improvements reduced.')).toBe(
      'Delivery improvements reduced.',
    )
  })

  it('marks a late clock without treating tutorial clocks as late', () => {
    expect(isLateTurnClock(8, 10)).toBe(true)
    expect(isLateTurnClock(4, 10)).toBe(false)
    expect(isLateTurnClock(2, 3, { isTutorial: true })).toBe(false)
  })

  it('counts remaining turns including the current one', () => {
    expect(remainingTurns(1, 10)).toBe(10)
    expect(remainingTurns(8, 10)).toBe(3)
    expect(remainingTurns(10, 10)).toBe(1)
    expect(remainingTurns(11, 10)).toBe(0)
    expect(remainingTurns(0, 10)).toBe(10)
  })
})

describe('table moments', () => {
  it('keeps full fx duration when reduced motion is not requested', () => {
    expect(tableFxDurationMs('action')).toBeGreaterThan(0)
    expect(tableFxDurationMs('event')).toBeGreaterThan(tableFxDurationMs('action'))
    expect(tableFxDurationMs('aftershock')).toBeGreaterThan(tableFxDurationMs('event'))
    expect(tableFxDurationMs('stakeholder')).toBeGreaterThan(0)
  })

  it('colors an aftershock from engine score deltas', () => {
    expect(impactTone([{ delta: 5 }, { delta: 3 }])).toBe('boon')
    expect(impactTone([{ delta: -5 }, { delta: -3 }])).toBe('blow')
    expect(impactTone([{ delta: 4 }, { delta: -4 }])).toBe('mixed')
    expect(impactTone([])).toBe('mixed')
  })

  it('holds a stakeholder voice through the readable card, then releases it', () => {
    const spy = vi.spyOn(tableMoment, 'tableFxDurationMs').mockReturnValue(100)
    vi.useFakeTimers()
    const theater = useTurnTheater()
    theater.play(baseContext())

    expect(theater.voicingStakeholderId.value).toBeNull()
    vi.advanceTimersByTime(100)
    theater.advance()
    vi.advanceTimersByTime(100)
    theater.advance()

    expect(theater.phase.value).toBe('fx')
    expect(theater.voicingStakeholderId.value).toBe('cto')

    vi.advanceTimersByTime(100)

    expect(theater.phase.value).toBe('beat')
    expect(theater.currentBeat.value?.kind).toBe('stakeholder')
    expect(theater.voicingStakeholderId.value).toBe('cto')

    theater.advance()

    expect(theater.voicingStakeholderId.value).toBeNull()
    expect(theater.phase.value).toBe('idle')

    spy.mockRestore()
    vi.useRealTimers()
  })

  it('holds an fx interlude before revealing the readable beat', () => {
    const spy = vi.spyOn(tableMoment, 'tableFxDurationMs').mockReturnValue(100)
    vi.useFakeTimers()
    const theater = useTurnTheater()
    theater.play(baseContext())

    expect(theater.phase.value).toBe('fx')
    expect(theater.currentBeat.value).toBeNull()
    expect(theater.fxKind.value).toBe('action')

    vi.advanceTimersByTime(100)

    expect(theater.phase.value).toBe('beat')
    expect(theater.currentBeat.value?.kind).toBe('action')

    spy.mockRestore()
    vi.useRealTimers()
  })

  it('skips remaining beats even during an interlude', () => {
    const spy = vi.spyOn(tableMoment, 'tableFxDurationMs').mockReturnValue(400)
    vi.useFakeTimers()
    const theater = useTurnTheater()
    theater.play(baseContext())
    theater.skip()

    expect(theater.isComplete.value).toBe(true)
    expect(theater.currentBeat.value).toBeNull()
    expect(theater.phase.value).toBe('idle')

    spy.mockRestore()
    vi.useRealTimers()
  })
})

describe('war table flag', () => {
  it('defaults to the table and honors ?stage=legacy', () => {
    expect(resolvePlayStage()).toBe('table')
    expect(isWarTableEnabled('legacy')).toBe(false)
    expect(isWarTableEnabled('table')).toBe(true)
  })
})
