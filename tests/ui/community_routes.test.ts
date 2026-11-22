/**
 * Where community packs live (journal M2.11, M2.12): the routes to a pack's
 * table, where a run returns to, and how a community run is labelled.
 */

import { describe, expect, it } from 'vitest'

import type { RunContentPack } from '@/domains/simulation/model'
import { lobbyRouteFor, packKeyFromParam, packTableRoute } from '@/ui/community/community_routes'
import { describeRunCommunityPack } from '@/ui/play/community_pack_review'

const GITHUB_KEY = 'github:mooeypoo/dddnd-packs/packs/gilded_ledger'
const FILE_KEY = 'file:sha256:90fae984cfca6bc175a4067f7acdd439c996073e16ce80f771b2146d651ea078'

describe('community routes', () => {
  it('puts the whole pack key in the path, slashes included, and reads it back', () => {
    const route = packTableRoute(GITHUB_KEY) as { name: string; params: { packKey: string[] } }
    expect(route.name).toBe('community-pack')
    expect(packKeyFromParam(route.params.packKey)).toBe(GITHUB_KEY)
    expect(packKeyFromParam(FILE_KEY)).toBe(FILE_KEY)
  })

  it('reads a missing or empty param as no pack', () => {
    expect(packKeyFromParam(undefined)).toBeUndefined()
    expect(packKeyFromParam('')).toBeUndefined()
    expect(packKeyFromParam([])).toBeUndefined()
  })

  it("sends a community run back to its pack's table, and everything else to the lobby", () => {
    expect(lobbyRouteFor(GITHUB_KEY)).toEqual(packTableRoute(GITHUB_KEY))
    expect(lobbyRouteFor('dddnd:base')).toBe('/play')
    expect(lobbyRouteFor('dddnd:tutorial')).toBe('/play')
    // Saves from before pack identity are always first-party
    expect(lobbyRouteFor(undefined)).toBe('/play')
  })
})

describe('describeRunCommunityPack (the external marker on play, results and share)', () => {
  const remote: RunContentPack = {
    key: GITHUB_KEY,
    id: 'gilded_ledger',
    version: '1.0.0',
    origin: 'remote',
    content_hash: 'sha256:abc',
    source_url: 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json',
  }

  it('names the pack and its publisher', () => {
    expect(describeRunCommunityPack(remote, 'Demo: The Gilded Ledger')).toEqual({
      name: 'Demo: The Gilded Ledger',
      publisher: 'mooeypoo on GitHub (mooeypoo/DDDnD-packs)',
    })
  })

  it('still marks the run when the pack has since been removed, using the recorded id', () => {
    expect(describeRunCommunityPack(remote)).toEqual({ name: 'gilded_ledger', publisher: 'mooeypoo on GitHub (mooeypoo/DDDnD-packs)' })
  })

  it('says a file pack has an unknown publisher', () => {
    expect(describeRunCommunityPack({ key: FILE_KEY, id: 'gilded_ledger', version: '1.0.0', origin: 'file' })?.publisher)
      .toBe('unknown (loaded from a file)')
  })

  it('marks nothing for first-party runs or runs without pack identity', () => {
    expect(describeRunCommunityPack({ key: 'dddnd:base', id: 'base', version: '1.0.0', origin: 'first_party' })).toBeNull()
    expect(describeRunCommunityPack(undefined)).toBeNull()
  })
})
