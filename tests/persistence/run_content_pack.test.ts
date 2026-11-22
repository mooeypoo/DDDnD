/**
 * Pack identity on runs (M2.6): recorded in saves and exact-run exports,
 * validated on the way back in.
 */

import { describe, expect, it } from 'vitest'

import { isRunContentPack } from '@/domains/persistence/services/validation'

describe('run content pack identity', () => {
  const hash = `sha256:${'a'.repeat(64)}`

  it('accepts first-party and community identities', () => {
    expect(isRunContentPack({ key: 'dddnd:base', id: 'base', version: '1.0.0', origin: 'first_party' })).toBe(true)
    expect(isRunContentPack({ key: 'github:o/r', id: 'gilded_ledger', version: '1.0.0', origin: 'remote', content_hash: hash, source_url: 'https://raw.githubusercontent.com/o/r/t/manifest.json' })).toBe(true)
    expect(isRunContentPack({ key: `file:${hash}`, id: 'gilded_ledger', version: '1.0.0', origin: 'file', content_hash: hash })).toBe(true)
  })

  it('rejects malformed identities', () => {
    expect(isRunContentPack({ key: 'dddnd:base', id: '', version: '1.0.0', origin: 'first_party' })).toBe(false)
    // ADR 0012: a pack identity without its unique key is not an identity.
    expect(isRunContentPack({ id: 'base', version: '1.0.0', origin: 'first_party' })).toBe(false)
    expect(isRunContentPack({ key: '', id: 'base', version: '1.0.0', origin: 'first_party' })).toBe(false)
    expect(isRunContentPack({ id: 'x', version: '1.0.0', origin: 'somewhere' })).toBe(false)
    expect(isRunContentPack({ id: 'x', version: '1.0.0', origin: 'file', content_hash: 'md5:abc' })).toBe(false)
  })
})

describe('pack identity survives saves and exports', () => {
  async function communityRun() {
    const { createInitialGameState } = await import('@/domains/simulation/model')
    const gameState = createInitialGameState({
      run_id: 'run-community-001',
      seed: 'seed-community-001',
      scenario_ref: { id: 'ledger_payments_monolith', version: 1 },
      max_turns: 10,
      starting_scores: { user_trust: 56 },
      stakeholder_refs: [{ id: 'ledger_head_of_payments', version: 1 }],
      available_action_refs: [{ id: 'ledger_split_refunds_context', version: 1 }],
      available_event_refs: [],
      created_at_utc: '2026-11-22T00:00:00.000Z',
    })
    gameState.meta.content_pack = {
      key: 'github:mooeypoo/dddnd-packs/packs/gilded_ledger',
      id: 'gilded_ledger',
      version: '1.0.0',
      origin: 'remote',
      content_hash: `sha256:${'b'.repeat(64)}`,
      source_url: 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json',
    }
    return gameState
  }

  it('round-trips through a save file', async () => {
    const { serialize_save_file, deserialize_save_file } = await import('@/domains/persistence')
    const gameState = await communityRun()
    const parsed = deserialize_save_file(JSON.parse(JSON.stringify(serialize_save_file(gameState))))
    expect(parsed.ok && parsed.value.game_state.meta.content_pack).toEqual(gameState.meta.content_pack)
  })

  it('is summarized in exact-run exports and round-trips', async () => {
    const { serialize_exact_run, deserialize_exact_run } = await import('@/domains/persistence')
    const gameState = await communityRun()
    const exported = serialize_exact_run(gameState, '2026-11-22T00:00:00.000Z')
    expect(exported.seed_info.content_pack).toEqual(gameState.meta.content_pack)
    const parsed = deserialize_exact_run(JSON.parse(JSON.stringify(exported)))
    expect(parsed.ok).toBe(true)
  })

  it('rejects a save whose pack identity is malformed', async () => {
    const { serialize_save_file, deserialize_save_file } = await import('@/domains/persistence')
    const gameState = await communityRun()
    gameState.meta.content_pack = { key: 'github:mooeypoo/dddnd-packs/packs/gilded_ledger', id: 'gilded_ledger', version: '1.0.0', origin: 'remote', content_hash: 'not-a-hash' }
    expect(deserialize_save_file(JSON.parse(JSON.stringify(serialize_save_file(gameState)))).ok).toBe(false)
  })
})
