/**
 * The example packs (D14, D40, M4.29): vendored from DDDnD-packs at their
 * release tags, still valid against the game as it is now, and opened
 * view-only (never saved, no edit reaches them).
 */

import { mount } from '@vue/test-utils'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { checkDraft, draftFromPack, type FirstPartyPack } from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { buildPackSnapshot, inventoryPaths, parseManifestText } from '@/domains/content/services/pack_snapshot_builder'
import { EXAMPLE_PACKS, exampleOfKind } from '@studio/content/example_packs'
import ContentsNav from '@studio/workspace/contents_nav.vue'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const EXAMPLES = path.resolve('studio/examples')
const PACKS_REPO = path.resolve('../DDDnD-packs')

function firstParty(): FirstPartyPack[] {
  return ['content', 'content/tutorial'].map((root) => ({
    manifest: JSON.parse(readFileSync(path.resolve(root, 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(path.resolve(root)),
  }))
}

describe('the vendored example packs', () => {
  it('are one DDD retelling and one new subject, the ones the Studio points to', () => {
    expect(EXAMPLE_PACKS.map((example) => [example.tag, example.kind])).toEqual([['gilded_ledger-v1.1.0', 'retelling'], ['sre_on_call-v1.0.0', 'new_topic']])
    expect(exampleOfKind('new_topic')?.name).toBe('SRE: The Pager Storm')
  })

  for (const example of EXAMPLE_PACKS) {
    it(`${example.tag}: reads back as the release it was vendored from, opens in the Studio, and passes the game's checks today`, async () => {
      const snapshot = await readPackBundle(readFileSync(path.join(EXAMPLES, example.file), 'utf8'), example.file)
      expect(snapshot.content_hash).toBe(example.content_hash)
      expect(snapshot.manifest.name).toBe(example.name)
      const imported = draftFromPack(snapshot)
      if (!imported.ok) throw new Error(imported.problems.join('; '))
      expect(imported.draft.kind).toBe(example.kind)
      // The base game may move on; an example that stops passing its checks needs a new release
      expect((await checkDraft(imported.draft, firstParty())).issues).toEqual([])
    })

    // Only where the packs repository sits beside this one (a developer's machine, not CI)
    it.skipIf(!existsSync(path.join(PACKS_REPO, '.git')))(`${example.tag}: is exactly what the tag holds in DDDnD-packs`, async () => {
      const show = (file: string) => execFileSync('git', ['-C', PACKS_REPO, 'show', `${example.tag}:packs/${example.folder}/${file}`], { encoding: 'utf8' })
      const manifestText = show('manifest.json')
      const files = Object.fromEntries(inventoryPaths(parseManifestText(manifestText)).map((file) => [file, show(file)]))
      const snapshot = await buildPackSnapshot({ manifest_text: manifestText, files }, { kind: 'file', file_name: example.file })
      expect(snapshot.content_hash).toBe(example.content_hash)
    })
  }
})

describe('an example, opened', () => {
  it('is view-only: never saved, never listed, and no edit reaches it', async () => {
    vi.resetModules()
    vi.doMock('@studio/content/first_party', () => ({
      listBaseRefs: async () => [],
      loadFirstParty: async () => {
        const registry = new ContentPackRegistry()
        for (const pack of firstParty()) registry.registerPack(pack.manifest, pack.provider)
        return { packs: firstParty(), base: registry.createScopedProvider(firstPartyPackKey('base')) }
      },
      loadGameBalance: async () => null,
      baseFrameRef: async () => null,
    }))
    const served = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => new Response(readFileSync(path.join(EXAMPLES, String(url).replace('/examples/', '')), 'utf8')))
    const { initStudio, openExample, ownWord, studio, updateDraft } = await import('@studio/state/studio_state')
    await initStudio()
    expect(ownWord()).toBe('yours')
    expect(await openExample('gilded_ledger')).toBe(true)
    expect(studio.current?.example?.tag).toBe('gilded_ledger-v1.1.0')
    // Someone else's pack: what's in it is "its own", never the visitor's
    expect(ownWord()).toBe('its own')
    const name = studio.current!.draft.name
    updateDraft({ ...studio.current!.draft, name: 'Mine now' })
    expect(studio.current!.draft.name).toBe(name)
    await vi.waitFor(() => expect(studio.check.state).toBe('done'), { timeout: 10_000 })
    expect(studio.check.issues).toEqual([])
    expect(studio.drafts).toEqual([])
    expect(await openExample('not_an_example')).toBe(false)
    served.mockRestore()
    vi.doUnmock('@studio/content/first_party')
  })

  it('offers nothing to make in the sidebar: no “+ New …” and no “+ From the game”', () => {
    const snapshot = readFileSync(path.join(EXAMPLES, EXAMPLE_PACKS[0].file), 'utf8')
    return readPackBundle(snapshot, EXAMPLE_PACKS[0].file).then((pack) => {
      const imported = draftFromPack(pack)
      if (!imported.ok) throw new Error('not ok')
      const props = { draft: imported.draft, selection: { kind: 'summary' as const }, councilRefs: [], decks: [{ section: 'cards' as const, title: 'Cards', singular: 'card', refs: [] }], seats: 8, nameOf: () => '', toFillIn: new Set<string>(), changeCounts: {}, scores: [], showScores: false, maxScores: 12 }
      const editable = mount(ContentsNav, { props })
      expect(editable.findAll('.action').map((button) => button.text())).toContain('+ New card')
      const viewOnly = mount(ContentsNav, { props: { ...props, viewOnly: true } })
      expect(viewOnly.findAll('.action').map((button) => button.text()).filter((text) => text.startsWith('+'))).toEqual([])
    })
  })
})
