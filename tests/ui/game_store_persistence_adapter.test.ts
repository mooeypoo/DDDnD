import { describe, expect, it, vi } from 'vitest'
import type { LocalStorageSaveAdapter } from '@/domains/persistence/adapters/local_storage_save_adapter'
import { createInitialGameState } from '@/domains/simulation/model'
import { createGameStorePersistenceAdapter } from '@/ui/stores/game_store_persistence_adapter'

function createFixtureGameState() {
  return createInitialGameState({
    run_id: 'run-store-persistence-1',
    seed: 'seed-store-persistence-1',
    scenario_ref: { id: 'monolith_of_mild_despair', version: 1 },
    max_turns: 8,
    starting_scores: {
      domain_clarity: 40,
      maintainability: 35,
      user_trust: 55,
    },
    stakeholder_refs: [{ id: 'cto', version: 1 }],
    available_action_refs: [{ id: 'define_bounded_context', version: 1 }],
    available_event_refs: [{ id: 'critical_bug_discovered', version: 1 }],
  })
}

function createMockSaveAdapter(
  overrides: Partial<LocalStorageSaveAdapter> = {},
): LocalStorageSaveAdapter {
  return {
    save_serialized_save_file: vi.fn(() => ({ ok: true, value: undefined })),
    load_serialized_save_file: vi.fn(() => ({ ok: true, value: null })),
    clear_saved_run: vi.fn(() => ({ ok: true, value: undefined })),
    ...overrides,
  }
}

describe('game_store_persistence_adapter', () => {
  it('does not persist when game state is null', () => {
    const saveAdapter = createMockSaveAdapter()
    const adapter = createGameStorePersistenceAdapter(saveAdapter)

    adapter.persistGameState(null)

    expect(saveAdapter.save_serialized_save_file).not.toHaveBeenCalled()
  })

  it('serializes and persists a valid game state', () => {
    const saveAdapter = createMockSaveAdapter()
    const adapter = createGameStorePersistenceAdapter(saveAdapter)
    const gameState = createFixtureGameState()

    adapter.persistGameState(gameState)

    expect(saveAdapter.save_serialized_save_file).toHaveBeenCalledTimes(1)
    const [serializedPayload] = vi.mocked(saveAdapter.save_serialized_save_file).mock.calls[0]
    const parsed = JSON.parse(serializedPayload)
    expect(parsed.export_type).toBe('save_file')
    expect(parsed.game_state.meta.run_id).toBe('run-store-persistence-1')
  })

  it('returns null when no saved payload exists', () => {
    const saveAdapter = createMockSaveAdapter({
      load_serialized_save_file: vi.fn(() => ({ ok: true, value: null })),
    })
    const adapter = createGameStorePersistenceAdapter(saveAdapter)

    expect(adapter.loadRestorableGameState()).toBeNull()
  })

  it('clears invalid JSON payloads and returns null', () => {
    const saveAdapter = createMockSaveAdapter({
      load_serialized_save_file: vi.fn(() => ({ ok: true, value: '{not-json' })),
    })
    const adapter = createGameStorePersistenceAdapter(saveAdapter)

    expect(adapter.loadRestorableGameState()).toBeNull()
    expect(saveAdapter.clear_saved_run).toHaveBeenCalledTimes(1)
  })

  it('returns a game state for valid saved payloads', () => {
    const gameState = createFixtureGameState()
    const payload = JSON.stringify({
      export_type: 'save_file',
      format_version: 1,
      exported_at: '2026-04-21T00:00:00.000Z',
      game_state: gameState,
    })

    const saveAdapter = createMockSaveAdapter({
      load_serialized_save_file: vi.fn(() => ({ ok: true, value: payload })),
    })

    const adapter = createGameStorePersistenceAdapter(saveAdapter)

    expect(adapter.loadRestorableGameState()).toEqual(gameState)
    expect(saveAdapter.clear_saved_run).not.toHaveBeenCalled()
  })
})
