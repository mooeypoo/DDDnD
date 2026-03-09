import { describe, expect, it } from 'vitest'
import {
  SHARE_PAYLOAD_VERSION,
  type SharePayload
} from '@/domains/reporting/services/share_payload'
import { buildSharePayload } from '@/domains/reporting/services/build_share_payload'
import {
  encodeSharePayload,
  decodeSharePayload,
  buildShareUrl
} from '@/domains/reporting/services/share_serialization'
import type { RunOutcome } from '@/domains/simulation/services/get_run_outcome'
import type { GameState } from '@/domains/simulation/model'

// ─── Fixtures ─────────────────────────────────────────────────

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    meta: {
      run_id: 'test-run-1',
      seed: 'test-seed',
      created_at_utc: '2026-01-01T00:00:00.000Z',
      last_updated_at: '2026-01-01T01:00:00.000Z'
    },
    player_profile: {
      selected_class_ref: { id: 'boundary_mage', version: 1 },
      display_name: 'Archibald'
    },
    scenario_ref: { id: 'the_monolith_of_mild_despair', version: 1 },
    progress: {
      current_turn: 8,
      max_turns: 8,
      run_status: 'completed_max_turns'
    },
    scores: {
      domain_clarity: 62.5,
      maintainability: 55.3,
      delivery_confidence: 48.1,
      team_morale: 70.9,
      user_trust: 45.0,
      budget: 38.7
    },
    stakeholders: {
      cto: { satisfaction: 65 },
      vp_product: { satisfaction: 50 },
      lead_developer: { satisfaction: 72 },
      operations_manager: { satisfaction: 45 }
    },
    action_state: {
      card_usage: {}
    },
    effect_state: {
      queued_effects: []
    },
    event_state: {
      available_event_refs: [],
      total_events_triggered: 0
    },
    history: [],
    run_analytics: {
      turns_completed: 8,
      total_events_triggered: 3,
      total_aftershocks_resolved: 2,
      cards_played: {},
      cumulative_score_deltas: {},
      cumulative_stakeholder_deltas: {}
    },
    ...overrides
  } as GameState
}

function createMockRunOutcome(overrides: Partial<RunOutcome> = {}): RunOutcome {
  return {
    tier: 'success',
    archetype: 'boundary_builder',
    outcome_snapshot: {
      tier: 'success',
      archetype: 'boundary_builder',
      run_status: 'completed_max_turns',
      completion_reason: 'max_turns_reached',
      turns_completed: 8,
      max_turns: 8,
      score_average: 53.4,
      matched_failure_conditions: []
    },
    has_outcome: true,
    completion_reason: 'max_turns_reached',
    scenario_id: 'the_monolith_of_mild_despair',
    scenario_version: 1,
    run_status: 'completed_max_turns',
    turns_completed: 8,
    max_turns: 8,
    matched_failure_conditions: [],
    selected_tier_id: 'survival',
    selected_archetype_id: 'boundary_builder',
    score_average: 53.4,
    ...overrides
  }
}

function createSamplePayload(overrides: Partial<SharePayload> = {}): SharePayload {
  return {
    v: SHARE_PAYLOAD_VERSION,
    sid: 'the_monolith_of_mild_despair',
    sv: 1,
    cls: 'boundary_mage',
    name: 'Archibald',
    tier: 'success',
    arch: 'boundary_builder',
    tid: 'survival',
    tc: 8,
    mt: 8,
    avg: 53,
    scores: {
      domain_clarity: 63,
      maintainability: 55,
      delivery_confidence: 48,
      team_morale: 71,
      user_trust: 45,
      budget: 39
    },
    cr: 'max_turns_reached',
    ...overrides
  }
}

// ─── Share Payload Builder ────────────────────────────────────

describe('buildSharePayload', () => {
  it('builds a payload from run outcome and game state', () => {
    const gameState = createMockGameState()
    const runOutcome = createMockRunOutcome()

    const payload = buildSharePayload({ run_outcome: runOutcome, game_state: gameState })

    expect(payload.v).toBe(SHARE_PAYLOAD_VERSION)
    expect(payload.sid).toBe('the_monolith_of_mild_despair')
    expect(payload.sv).toBe(1)
    expect(payload.cls).toBe('boundary_mage')
    expect(payload.name).toBe('Archibald')
    expect(payload.tier).toBe('success')
    expect(payload.arch).toBe('boundary_builder')
    expect(payload.tid).toBe('survival')
    expect(payload.tc).toBe(8)
    expect(payload.mt).toBe(8)
    expect(payload.avg).toBe(53) // rounded from 53.4
    expect(payload.cr).toBe('max_turns_reached')
  })

  it('rounds score values to integers', () => {
    const gameState = createMockGameState()
    const runOutcome = createMockRunOutcome()

    const payload = buildSharePayload({ run_outcome: runOutcome, game_state: gameState })

    expect(payload.scores.domain_clarity).toBe(63) // rounded from 62.5
    expect(payload.scores.maintainability).toBe(55) // rounded from 55.3
    expect(payload.scores.budget).toBe(39) // rounded from 38.7
  })

  it('omits name when display_name is not set', () => {
    const gameState = createMockGameState({
      player_profile: {
        selected_class_ref: { id: 'boundary_mage', version: 1 }
      }
    })
    const runOutcome = createMockRunOutcome()

    const payload = buildSharePayload({ run_outcome: runOutcome, game_state: gameState })

    expect(payload.name).toBeUndefined()
  })

  it('uses "unknown" class when no class ref is set', () => {
    const gameState = createMockGameState({
      player_profile: {}
    })
    const runOutcome = createMockRunOutcome()

    const payload = buildSharePayload({ run_outcome: runOutcome, game_state: gameState })

    expect(payload.cls).toBe('unknown')
  })
})

// ─── Serialization Round-Trip ─────────────────────────────────

describe('encodeSharePayload / decodeSharePayload', () => {
  it('round-trips a valid payload', () => {
    const payload = createSamplePayload()

    const encoded = encodeSharePayload(payload)
    const result = decodeSharePayload(encoded)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload).toEqual(payload)
    }
  })

  it('produces a URL-safe string without +, /, or = characters', () => {
    const payload = createSamplePayload()

    const encoded = encodeSharePayload(payload)

    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
  })

  it('round-trips a payload without optional name', () => {
    const payload = createSamplePayload({ name: undefined })

    const encoded = encodeSharePayload(payload)
    const result = decodeSharePayload(encoded)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.name).toBeUndefined()
    }
  })

  it('round-trips a payload with null tid', () => {
    const payload = createSamplePayload({ tid: null })

    const encoded = encodeSharePayload(payload)
    const result = decodeSharePayload(encoded)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.tid).toBeNull()
    }
  })

  it('round-trips payloads with special characters in name', () => {
    const payload = createSamplePayload({ name: 'Über Ärchitect 🏗️' })

    const encoded = encodeSharePayload(payload)
    const result = decodeSharePayload(encoded)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.name).toBe('Über Ärchitect 🏗️')
    }
  })
})

// ─── Invalid Payload Handling ─────────────────────────────────

describe('decodeSharePayload — error handling', () => {
  it('rejects empty string', () => {
    const result = decodeSharePayload('')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Empty')
    }
  })

  it('rejects non-base64 garbage', () => {
    const result = decodeSharePayload('!!!not-valid!!!')
    expect(result.ok).toBe(false)
  })

  it('rejects valid base64 that is not JSON', () => {
    const encoded = btoa('this is not json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const result = decodeSharePayload(encoded)
    expect(result.ok).toBe(false)
  })

  it('rejects JSON that is not an object', () => {
    const encoded = btoa('"just a string"').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const result = decodeSharePayload(encoded)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('object')
    }
  })

  it('rejects payload with missing version', () => {
    const payload = createSamplePayload()
    const { v: _, ...noVersion } = payload
    const encoded = btoa(JSON.stringify(noVersion)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const result = decodeSharePayload(encoded)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('version')
    }
  })

  it('rejects payload with unsupported version', () => {
    const payload = createSamplePayload({ v: 999 })
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const result = decodeSharePayload(encoded)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('version')
    }
  })

  it('rejects payload missing required string fields', () => {
    for (const field of ['sid', 'tier', 'arch', 'cls', 'cr']) {
      const payload = createSamplePayload()
      ;(payload as unknown as Record<string, unknown>)[field] = ''
      const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      const result = decodeSharePayload(encoded)
      expect(result.ok).toBe(false)
    }
  })

  it('rejects payload with unknown archetype', () => {
    const payload = createSamplePayload()
    ;(payload as unknown as Record<string, unknown>).arch = 'mysterious_wizard'
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const result = decodeSharePayload(encoded)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('archetype')
    }
  })

  it('rejects payload missing numeric fields', () => {
    for (const field of ['sv', 'tc', 'mt', 'avg']) {
      const payload = createSamplePayload()
      ;(payload as unknown as Record<string, unknown>)[field] = 'not-a-number'
      const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      const result = decodeSharePayload(encoded)
      expect(result.ok).toBe(false)
    }
  })

  it('rejects payload with invalid scores', () => {
    const payload = createSamplePayload()
    ;(payload as unknown as Record<string, unknown>).scores = 'not-an-object'
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const result = decodeSharePayload(encoded)
    expect(result.ok).toBe(false)
  })
})

// ─── URL Construction ─────────────────────────────────────────

describe('buildShareUrl', () => {
  it('builds a valid share URL', () => {
    const payload = createSamplePayload()
    const url = buildShareUrl(payload, 'https://dddnd.com')

    expect(url).toMatch(/^https:\/\/dddnd\.com\/share\?d=/)
  })

  it('produces a URL whose query param can be decoded back', () => {
    const payload = createSamplePayload()
    const url = buildShareUrl(payload, 'https://dddnd.com')

    const urlObj = new URL(url)
    const encoded = urlObj.searchParams.get('d')!
    const result = decodeSharePayload(encoded)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload).toEqual(payload)
    }
  })
})

// ─── Full Integration: build → encode → decode ───────────────

describe('share integration: build → encode → decode', () => {
  it('full pipeline preserves all significant data', () => {
    const gameState = createMockGameState()
    const runOutcome = createMockRunOutcome()

    const payload = buildSharePayload({ run_outcome: runOutcome, game_state: gameState })
    const encoded = encodeSharePayload(payload)
    const result = decodeSharePayload(encoded)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.sid).toBe('the_monolith_of_mild_despair')
      expect(result.payload.arch).toBe('boundary_builder')
      expect(result.payload.tier).toBe('success')
      expect(result.payload.v).toBe(SHARE_PAYLOAD_VERSION)
      expect(result.payload.name).toBe('Archibald')
      expect(result.payload.cls).toBe('boundary_mage')
      expect(result.payload.scores.domain_clarity).toBe(63)
    }
  })

  it('payload is compact enough for URL use', () => {
    const gameState = createMockGameState()
    const runOutcome = createMockRunOutcome()

    const payload = buildSharePayload({ run_outcome: runOutcome, game_state: gameState })
    const encoded = encodeSharePayload(payload)

    // A reasonable share payload should be under 1000 chars for URL safety
    expect(encoded.length).toBeLessThan(1000)
  })
})
