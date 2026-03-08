import { describe, expect, it } from 'vitest'
import { createInitialGameState, GameState, TurnHistoryEntry } from '@/domains/simulation/model'
import {
  create_local_storage_save_adapter,
  deserialize_exact_run,
  deserialize_save_file,
  serialize_exact_run,
  serialize_save_file
} from '@/domains/persistence'

class InMemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.has(key) ? this.values.get(key)! : null
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

function createHistoryEntry(): TurnHistoryEntry {
  return {
    turn_number: 1,
    resolved_aftershocks: [],
    action_resolution: {
      selected_action: { id: 'define_bounded_context', version: 1 },
      score_changes: [{ score_id: 'domain_clarity', delta: 5 }],
      stakeholder_changes: [{ stakeholder_id: 'cto', delta: 1 }],
      queued_delayed_effects: [],
      presentation: {
        title: 'Defined Bounded Context',
        summary: 'A clear boundary was introduced.'
      }
    },
    event_resolution: {
      selected_event: { id: 'critical_bug_discovered', version: 1 },
      score_changes: [{ score_id: 'user_trust', delta: -4 }],
      stakeholder_changes: [{ stakeholder_id: 'operations_manager', delta: -2 }],
      queued_delayed_effects: [],
      presentation: {
        title: 'Critical Bug Discovered',
        summary: 'A production issue hit confidence.'
      }
    },
    stakeholder_resolution: {
      reactions: [],
      presentation: {
        title: 'Stakeholders Reacted',
        summary: 'Stakeholders responded to the new state.'
      }
    },
    total_score_changes: [{ score_id: 'domain_clarity', delta: 5 }],
    total_stakeholder_changes: [{ stakeholder_id: 'cto', delta: 1 }],
    end_of_turn_scores: {
      domain_clarity: 40,
      maintainability: 35,
      user_trust: 52
    },
    end_of_turn_stakeholders: {
      cto: { satisfaction: 51 },
      operations_manager: { satisfaction: 48 }
    },
    run_status_after_turn: 'in_progress'
  }
}

function createFixtureGameState(): GameState {
  const gameState = createInitialGameState({
    run_id: 'run-persistence-001',
    seed: 'seed-persistence-001',
    scenario_ref: { id: 'monolith_of_mild_despair', version: 1 },
    max_turns: 8,
    starting_scores: {
      domain_clarity: 35,
      maintainability: 35,
      user_trust: 56
    },
    stakeholder_refs: [
      { id: 'cto', version: 1 },
      { id: 'operations_manager', version: 1 }
    ],
    available_action_refs: [{ id: 'define_bounded_context', version: 1 }],
    available_event_refs: [{ id: 'critical_bug_discovered', version: 1 }],
    selected_class_ref: { id: 'boundary_mage', version: 1 },
    created_at_utc: '2026-03-07T00:00:00.000Z'
  })

  gameState.progress.current_turn = 2
  gameState.run_analytics.turns_completed = 1
  gameState.history = [createHistoryEntry()]

  return gameState
}

describe('Persistence export/import', () => {
  it('save-file serialization returns expected top-level structure', () => {
    const gameState = createFixtureGameState()

    const exportPayload = serialize_save_file(gameState, '2026-03-07T12:00:00.000Z')

    expect(exportPayload.export_type).toBe('save_file')
    expect(exportPayload.format_version).toBe(1)
    expect(exportPayload.exported_at).toBe('2026-03-07T12:00:00.000Z')
    expect(exportPayload.game_state.meta.run_id).toBe('run-persistence-001')
  })

  it('save-file deserialization round-trips correctly for valid game_state', () => {
    const gameState = createFixtureGameState()
    const serialized = serialize_save_file(gameState, '2026-03-07T12:00:00.000Z')

    const parsed = deserialize_save_file(serialized)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      throw new Error(parsed.error.message)
    }

    expect(parsed.value.save_file).toEqual(serialized)
    expect(parsed.value.game_state).toEqual(gameState)
  })

  it('exact-run serialization returns expected top-level structure', () => {
    const gameState = createFixtureGameState()

    const exportPayload = serialize_exact_run(gameState, '2026-03-07T12:00:00.000Z')

    expect(exportPayload.export_type).toBe('exact_run')
    expect(exportPayload.format_version).toBe(1)
    expect(exportPayload.scenario_ref).toEqual({ id: 'monolith_of_mild_despair', version: 1 })
    expect(exportPayload.seed_info.seed).toBe('seed-persistence-001')
    expect(exportPayload.turn_history).toHaveLength(1)
    expect(exportPayload.action_sequence).toHaveLength(1)
    expect(exportPayload.outcome_snapshot.run_status).toBe('in_progress')
    expect(exportPayload.outcome_snapshot.archetype).toBeTruthy()
    expect(['success', 'partial_success', 'failure']).toContain(exportPayload.outcome_snapshot.tier)
  })

  it('exact-run deserialization round-trips correctly for valid input', () => {
    const gameState = createFixtureGameState()
    const serialized = serialize_exact_run(gameState, '2026-03-07T12:00:00.000Z')

    const parsed = deserialize_exact_run(serialized)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      throw new Error(parsed.error.message)
    }

    expect(parsed.value).toEqual(serialized)
  })

  it('fails clearly on invalid export type', () => {
    const invalidPayload = {
      export_type: 'wrong_type',
      format_version: 1,
      exported_at: '2026-03-07T12:00:00.000Z',
      game_state: createFixtureGameState()
    }

    const parsed = deserialize_save_file(invalidPayload)

    expect(parsed.ok).toBe(false)
    if (parsed.ok) {
      throw new Error('Expected invalid export type to fail')
    }

    expect(parsed.error.code).toBe('invalid_export_type')
  })

  it('fails clearly on unsupported format version', () => {
    const invalidPayload = {
      ...serialize_exact_run(createFixtureGameState(), '2026-03-07T12:00:00.000Z'),
      format_version: 999
    }

    const parsed = deserialize_exact_run(invalidPayload)

    expect(parsed.ok).toBe(false)
    if (parsed.ok) {
      throw new Error('Expected unsupported version to fail')
    }

    expect(parsed.error.code).toBe('unsupported_format_version')
  })

  it('fails clearly on malformed input', () => {
    const parsed = deserialize_save_file(null)

    expect(parsed.ok).toBe(false)
    if (parsed.ok) {
      throw new Error('Expected malformed input to fail')
    }

    expect(parsed.error.code).toBe('invalid_input')
  })

  it('localStorage adapter stores and retrieves serialized save data correctly', () => {
    const storage = new InMemoryStorage()
    const adapter = create_local_storage_save_adapter({
      storage,
      storage_key: 'dddnd.test.save'
    })

    const savePayload = JSON.stringify(serialize_save_file(createFixtureGameState(), '2026-03-07T12:00:00.000Z'))

    const saveResult = adapter.save_serialized_save_file(savePayload)
    expect(saveResult.ok).toBe(true)

    const loadResult = adapter.load_serialized_save_file()
    expect(loadResult.ok).toBe(true)
    if (!loadResult.ok) {
      throw new Error(loadResult.error.message)
    }

    expect(loadResult.value).toBe(savePayload)

    const clearResult = adapter.clear_saved_run()
    expect(clearResult.ok).toBe(true)

    const afterClear = adapter.load_serialized_save_file()
    expect(afterClear.ok).toBe(true)
    if (!afterClear.ok) {
      throw new Error(afterClear.error.message)
    }

    expect(afterClear.value).toBeNull()
  })

  it('persistence services run without Vue or simulation engine side effects', () => {
    const gameState = createFixtureGameState()

    const savePayload = serialize_save_file(gameState, '2026-03-07T12:00:00.000Z')
    const exactPayload = serialize_exact_run(gameState, '2026-03-07T12:00:00.000Z')

    expect(savePayload.game_state.meta.seed).toBe('seed-persistence-001')
    expect(exactPayload.seed_info.seed).toBe('seed-persistence-001')
    expect(exactPayload.game_state.history).toHaveLength(1)
  })
})
