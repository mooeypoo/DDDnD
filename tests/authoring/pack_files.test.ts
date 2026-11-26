/**
 * Packs as files, in and out of the Studio (docs/PACK_STUDIO.md M4.8, D26):
 * the zip's layout, and importing a pack file or a zip back into a draft,
 * losslessly or not at all. The zip format itself is the Studio adapter's
 * (tests/studio/pack_zip.test.ts); here an archive is a plain map of files.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import {
  createOwnCard,
  draftFromPack,
  exportDraftArchive,
  exportDraftBundle,
  packRoot,
  planRelease,
  putContent,
  readPackArchive,
  type FirstPartyPack,
  type PackArchive,
} from '@/domains/authoring'
import type { ContentPackManifest, PackSnapshot } from '@/domains/content/model'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOTS = { base: path.resolve('content'), tutorial: path.resolve('content/tutorial') }
const LEDGER = path.resolve('tests/content/fixtures/packs/gilded_ledger')

function firstParty(): FirstPartyPack[] {
  return Object.values(ROOTS).map((root) => ({
    manifest: JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8')) as ContentPackManifest,
    provider: createFileContentProvider(root),
  }))
}

/** Every file under a folder, by its path below `prefix`. */
function folderFiles(root: string, prefix: string): Record<string, string> {
  const files: Record<string, string> = {}
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else files[`${prefix}${path.relative(root, full).split(path.sep).join('/')}`] = readFileSync(full, 'utf8')
    }
  }
  walk(root)
  return files
}

function archiveOf(files: Record<string, string>): PackArchive {
  return {
    names: Object.keys(files),
    read: vi.fn(async (names: readonly string[], maxBytes: number) => Object.fromEntries(names.map((name) => {
      if (new TextEncoder().encode(files[name]).byteLength > maxBytes) throw new Error(`${name} too large`)
      return [name, files[name]]
    }))),
  }
}

async function ledger(): Promise<PackSnapshot> {
  return readPackArchive(archiveOf(folderFiles(LEDGER, 'gilded_ledger/')), 'gilded_ledger.zip')
}

describe('reading a pack from an archive', () => {
  it('finds the pack wherever its manifest is, and reads only what the manifest lists', async () => {
    const files = {
      ...folderFiles(LEDGER, 'DDDnD-packs-main/packs/gilded_ledger/'),
      'DDDnD-packs-main/README.md': '# packs',
      'DDDnD-packs-main/packs/gilded_ledger/README.md': '# ledger',
      'DDDnD-packs-main/packs/gilded_ledger/notes/unlisted.json': '{"not": "content"}',
    }
    const archive = archiveOf(files)
    const snapshot = await readPackArchive(archive, 'repo.zip')
    expect(snapshot.manifest.id).toBe('gilded_ledger')
    // Two passes: the manifest under the manifest limit, then the listed files under the file limit
    const [first, second] = vi.mocked(archive.read).mock.calls
    expect(first).toEqual([['DDDnD-packs-main/packs/gilded_ledger/manifest.json'], CONTENT_LIMITS.max_manifest_bytes])
    expect(second[1]).toBe(CONTENT_LIMITS.max_file_bytes)
    expect(second[0]).not.toContain('DDDnD-packs-main/packs/gilded_ledger/notes/unlisted.json')
    expect(second[0].some((name) => name.endsWith('README.md'))).toBe(false)
    expect(vi.mocked(archive.read).mock.calls).toHaveLength(2)
  })

  it('refuses an archive with no pack, or with several', () => {
    expect(() => packRoot(['README.md'], 'a.zip')).toThrow(/no manifest\.json/)
    expect(() => packRoot(['a/manifest.json', 'b/manifest.json'], 'a.zip')).toThrow(/holds 2 packs/)
    expect(packRoot(['manifest.json', 'cards/x-v1.json'], 'a.zip')).toBe('')
  })

  it('reports a listed file that is missing, as the game does', async () => {
    const files = folderFiles(LEDGER, '')
    const missing = Object.keys(files).find((name) => name.startsWith('cards/')) as string
    delete files[missing]
    await expect(readPackArchive(archiveOf(files), 'a.zip')).rejects.toThrow(/listed in the inventory but missing/)
  })
})

describe('a pack as a draft', () => {
  it('keeps everything, and counts its content as already released', async () => {
    const snapshot = await ledger()
    const result = draftFromPack(snapshot)
    if (!result.ok) throw new Error(result.problems.join('\n'))
    const { draft } = result
    expect(draft).toMatchObject({ kind: 'retelling', name: snapshot.manifest.name, prefix: 'gilded_ledger', version: '1.0.0' })
    expect(draft.homepage_url).toBe(snapshot.manifest.pack_homepage_url)
    expect(draft.license).toBeUndefined()
    expect(Object.keys(draft.content.scenarios)).toEqual(['ledger_payments_monolith'])
    expect(planRelease(draft)).toMatchObject({ since: '1.0.0', kind: 'unchanged' })
  })

  it('exports again as the same pack: same id, content, license and homepage', async () => {
    const snapshot = await ledger()
    const result = draftFromPack(snapshot)
    if (!result.ok) throw new Error(result.problems.join('\n'))
    const exported = await exportDraftBundle(result.draft, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))
    const again = await readPackBundle(exported.text, exported.file_name)
    expect(again.entities).toEqual(snapshot.entities)
    const keep = (manifest: ContentPackManifest) => ({
      id: manifest.id, version: manifest.version, name: manifest.name, description: manifest.description, kind: manifest.kind,
      license: manifest.license, authors: manifest.authors, homepage: manifest.pack_homepage_url, depends_on: manifest.depends_on, scenarios: manifest.scenarios,
    })
    expect(keep(again.manifest)).toEqual(keep(snapshot.manifest))
  })

  it('then compares the next export with what it imported', async () => {
    const result = draftFromPack(await ledger())
    if (!result.ok) throw new Error(result.problems.join('\n'))
    const card = Object.values(result.draft.content.cards)[0]
    const plan = planRelease(putContent(result.draft, 'cards', { ...card, cooldown_turns: (card.cooldown_turns ?? 0) + 1 }))
    expect(plan).toMatchObject({ since: '1.0.0', kind: 'play', suggested: '1.1.0' })
  })

  it('keeps a license other than the Studio\'s own', async () => {
    const snapshot = await ledger()
    const result = draftFromPack({ ...snapshot, manifest: { ...snapshot.manifest, license: 'GPL-3.0-or-later' } })
    if (!result.ok) throw new Error(result.problems.join('\n'))
    expect(result.draft.license).toBe('GPL-3.0-or-later')
    const exported = await exportDraftBundle(result.draft, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))
    expect((await readPackBundle(exported.text, exported.file_name)).manifest.license).toBe('GPL-3.0-or-later')
  })

  it('refuses what a draft can\'t hold, saying why', async () => {
    const snapshot = await ledger()
    const variant = (manifest: Partial<ContentPackManifest>) => draftFromPack({ ...snapshot, manifest: { ...snapshot.manifest, ...manifest } })
    const problems = (result: ReturnType<typeof draftFromPack>) => (result.ok ? [] : result.problems)
    expect(problems(variant({ kind: 'standalone', depends_on: [] }))).toEqual([expect.stringMatching(/standalone pack/)])
    expect(problems(variant({ depends_on: [...snapshot.manifest.depends_on, { pack_id: 'tutorial', version: '1.0.0' }] }))).toEqual([expect.stringMatching(/builds on "tutorial"/)])
    expect(problems(variant({ tutorials: [{ id: 'x', version: 1 }] }))).toEqual([expect.stringMatching(/tutorials/)])
    expect(problems(variant({ id: 'the_very_long_ledger_of_gilded_things' }))).toEqual([expect.stringMatching(/isn't one the Studio can keep/)])
    expect(problems(variant({ scenarios: [] }))).toEqual([expect.stringMatching(/scenarios aren't all offered/)])
  })

  it('refuses two versions of one piece of content', async () => {
    const snapshot = await ledger()
    const [cardPath, card] = Object.entries(snapshot.entities).find(([file]) => file.startsWith('cards/')) as [string, { id: string; version: number }]
    const newer = { ...card, version: card.version + 1 }
    const manifest = { ...snapshot.manifest, content: { ...snapshot.manifest.content, cards: [...snapshot.manifest.content.cards, `${card.id}-v${newer.version}.json`] } }
    const result = draftFromPack({ ...snapshot, manifest, entities: { ...snapshot.entities, [cardPath.replace(/-v\d+\.json$/, `-v${newer.version}.json`)]: newer as never } })
    expect(result.ok ? [] : result.problems).toEqual([expect.stringMatching(new RegExp(`two versions of "${card.id}"`))])
  })
})

describe('the zip export', () => {
  it('is the packs repository layout under the pack id, with a README, and imports back', async () => {
    const result = draftFromPack(await ledger())
    if (!result.ok) throw new Error(result.problems.join('\n'))
    const made = createOwnCard(result.draft, 'Reconcile Nightly')
    const draft = putContent(made.draft, 'cards', { ...made.draft.content.cards[made.id], description: 'Match the books every night.', score_changes: [{ score_id: 'budget', delta: -1 }] })
    const exported = await exportDraftArchive(draft, firstParty())
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues))
    expect(exported.file_name).toBe('gilded_ledger-v1.0.0.zip')
    const names = Object.keys(exported.files)
    expect(names.slice(0, 2)).toEqual(['gilded_ledger/README.md', 'gilded_ledger/manifest.json'])
    expect(names.every((name) => name.startsWith('gilded_ledger/'))).toBe(true)
    expect(names).toContain('gilded_ledger/scenarios/ledger_payments_monolith-v1.json')

    const readme = exported.files['gilded_ledger/README.md']
    expect(readme).toContain(`# ${draft.name}`)
    expect(readme).toContain('Made for:** DDDnD\'s base game 1.0.0 (it works in any 1.x version from 1.0.0 on)')
    expect(readme).toContain('Reconcile Nightly')
    expect(readme).toContain('gilded_ledger-v1.0.0.dddnd-pack.json')
    expect(readme).toContain('Pin the URL to a tag')

    const back = draftFromPack(await readPackArchive(archiveOf(exported.files), exported.file_name))
    if (!back.ok) throw new Error(back.problems.join('\n'))
    expect(back.draft.content).toEqual(draft.content)
  })
})
