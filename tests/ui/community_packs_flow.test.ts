/**
 * Community packs UI flow (M2.5): what the consent screen says, and the
 * load → check → review → confirm sequence.
 */

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PackSnapshot } from '@/domains/content/model'
import { PackLoadError } from '@/domains/content/services/pack_snapshot_builder'
import { useCommunityPacks } from '@/ui/composables/use_community_packs'
import { buildPackReview } from '@/ui/play/community_pack_review'
import { useGameStore } from '@/ui/stores/game_store'
import { demoPackSnapshot } from '../content/support/demo_pack'

const RAW = 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs'

function withOrigin(snapshot: PackSnapshot, origin: PackSnapshot['origin']): PackSnapshot {
  return { ...snapshot, origin }
}

describe('community pack review (the consent screen)', () => {
  it('describes the demo pack plainly', async () => {
    const review = buildPackReview(await demoPackSnapshot())

    expect(review.title).toBe('Demo: The Gilded Ledger')
    expect(review.kindLabel).toBe("Builds on DDDnD's base pack")
    expect(review.license).toBe('GPL-3.0-only')
    expect(review.authors).toEqual([{ name: 'Moriel Schottlender', link: { url: 'https://moriel.tech', host: 'moriel.tech' } }])
    expect(review.scenarios).toEqual([{ name: 'The Gilded Ledger', summary: expect.stringMatching(/regulator/), turns: 10 }])
    expect(review.counts).toEqual({ scenarios: 1, cards: 4, stakeholders: 2, events: 4 })
    expect(review.fingerprint).toMatch(/^[0-9a-f]{12}$/)
  })

  it('says a file was not downloaded, and mentions no network privacy', async () => {
    const review = buildPackReview(await demoPackSnapshot())
    expect(review.origin).toMatchObject({ label: 'From a file on this device', tone: 'calm' })
    expect(review.privacyNote).toBeUndefined()
  })

  it('warns when a GitHub link is not pinned, and explains what GitHub can see', async () => {
    const snapshot = withOrigin(await demoPackSnapshot(), {
      kind: 'remote',
      manifest_url: `${RAW}/main/packs/gilded_ledger/manifest.json`,
      pinning: 'unpinned',
    })
    const review = buildPackReview(snapshot)
    expect(review.origin).toMatchObject({ tone: 'caution', detail: 'raw.githubusercontent.com/mooeypoo/DDDnD-packs/main/packs/gilded_ledger/manifest.json' })
    expect(review.origin.note).toMatch(/can change this content at any time/)
    expect(review.privacyNote).toMatch(/IP address/)
  })

  it('reassures for pinned links', async () => {
    const pinned = buildPackReview(withOrigin(await demoPackSnapshot(), { kind: 'remote', manifest_url: `${RAW}/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json`, pinning: 'release_tag' }))
    expect(pinned.origin).toMatchObject({ label: 'From GitHub, pinned to a release', tone: 'calm' })
  })
})

describe('community packs flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('reviews a pack before anything is added, then adds it on confirm', async () => {
    const snapshot = await demoPackSnapshot()
    const store = useGameStore()
    const check = vi.spyOn(store, 'check_community_pack').mockResolvedValue({ ok: true, issues: [] })
    const add = vi.spyOn(store, 'add_community_pack').mockResolvedValue()
    const flow = useCommunityPacks({ loadRemote: vi.fn().mockResolvedValue(snapshot) })

    await flow.loadFromUrl(`  ${RAW}/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json  `)
    expect(check).toHaveBeenCalledWith(snapshot)
    expect(add).not.toHaveBeenCalled()
    expect(flow.phase.value).toBe('review')
    expect(flow.review.value?.title).toBe('Demo: The Gilded Ledger')

    await flow.confirm()
    expect(add).toHaveBeenCalledWith(snapshot)
    expect(flow.phase.value).toBe('idle')
    expect(flow.lastAdded.value).toBe('Demo: The Gilded Ledger')
  })

  it('never adds a pack the player declines', async () => {
    const store = useGameStore()
    vi.spyOn(store, 'check_community_pack').mockResolvedValue({ ok: true, issues: [] })
    const add = vi.spyOn(store, 'add_community_pack')
    const flow = useCommunityPacks({ loadRemote: vi.fn().mockResolvedValue(await demoPackSnapshot()) })

    await flow.loadFromUrl(`${RAW}/v1.0.0/manifest.json`)
    flow.cancel()
    expect(flow.phase.value).toBe('idle')
    expect(add).not.toHaveBeenCalled()
  })

  it('shows loading problems by stage, capped to a readable list', async () => {
    const issues = Array.from({ length: 15 }, (_, index) => ({ file: `cards/c${index}-v1.json`, message: 'is not valid JSON' }))
    const flow = useCommunityPacks({ loadRemote: vi.fn().mockRejectedValue(new PackLoadError('content', issues)) })

    await flow.loadFromUrl(`${RAW}/v1.0.0/manifest.json`)
    expect(flow.phase.value).toBe('error')
    expect(flow.errorTitle.value).toBe("The pack's content has problems")
    expect(flow.issues.value).toHaveLength(12)
    expect(flow.hiddenIssueCount.value).toBe(3)
  })

  it('explains when a valid pack still can\'t be played next to the loaded packs', async () => {
    const store = useGameStore()
    vi.spyOn(store, 'check_community_pack').mockResolvedValue({ ok: false, issues: [{ file: 'manifest.json', message: 'Pack "x" lists content.cards "a-v1.json", which pack "base" already provides.' }] })
    const flow = useCommunityPacks({ loadRemote: vi.fn().mockResolvedValue(await demoPackSnapshot()) })

    await flow.loadFromUrl(`${RAW}/v1.0.0/manifest.json`)
    expect(flow.errorTitle.value).toBe("This pack can't be played here")
    expect(flow.issues.value[0].message).toMatch(/already provides/)
  })

  it('reads pack files through the bundle reader', async () => {
    const store = useGameStore()
    vi.spyOn(store, 'check_community_pack').mockResolvedValue({ ok: true, issues: [] })
    const readBundle = vi.fn().mockResolvedValue(await demoPackSnapshot())
    const flow = useCommunityPacks({ readBundle })

    await flow.loadFromFile(new File(['{"format":"dddnd-pack"}'], 'demo.dddnd-pack.json'))
    expect(readBundle).toHaveBeenCalledWith('{"format":"dddnd-pack"}', 'demo.dddnd-pack.json')
    expect(flow.phase.value).toBe('review')
  })
})
