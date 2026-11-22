/**
 * Pack identity (ADR 0012): a manifest id is a name, the pack key is the
 * identity. Two authors can both publish a `gilded_ledger`; their keys differ.
 */

import { describe, expect, it } from 'vitest'

import { demoPackSnapshot } from './support/demo_pack'

import {
  checkPackSourceUrl,
  communityManifestIssues,
  PackLoadError,
  firstPartyPackKey,
  isPackKey,
  packKeyForOrigin,
  packKeyForSource,
} from '@/domains/content/services'

const RAW = 'https://raw.githubusercontent.com'
const HASH = `sha256:${'c'.repeat(64)}`

function keyOf(url: string): string {
  const check = checkPackSourceUrl(url)
  if (!check.ok) throw new Error(check.reason)
  return packKeyForSource(check.source)
}

describe('pack keys (ADR 0012)', () => {
  it('names first-party packs after their id', () => {
    expect(firstPartyPackKey('base')).toBe('dddnd:base')
  })

  it('keys GitHub raw packs by owner, repository and folder', () => {
    expect(keyOf(`${RAW}/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json`))
      .toBe('github:mooeypoo/dddnd-packs/packs/gilded_ledger')
    expect(keyOf(`${RAW}/someone/one-pack/v1.0.0/manifest.json`)).toBe('github:someone/one-pack')
  })

  it('gives every version of the same pack the same key: the ref is not identity', () => {
    const keys = new Set([
      `${RAW}/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json`,
      `${RAW}/mooeypoo/DDDnD-packs/gilded_ledger-v1.1.0/packs/gilded_ledger/manifest.json`,
      `${RAW}/mooeypoo/DDDnD-packs/main/packs/gilded_ledger/manifest.json`,
      `${RAW}/mooeypoo/DDDnD-packs/refs/tags/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json`,
      `${RAW}/mooeypoo/DDDnD-packs/${'a'.repeat(40)}/packs/gilded_ledger/manifest.json`,
      // GitHub owner and repository names are case-insensitive.
      `${RAW}/MooeyPoo/dddnd-PACKS/main/packs/gilded_ledger/manifest.json`,
    ].map(keyOf))
    expect([...keys]).toEqual(['github:mooeypoo/dddnd-packs/packs/gilded_ledger'])
  })

  it('tells apart same-named packs from different authors, repositories, or folders', () => {
    const keys = [
      `${RAW}/mooeypoo/DDDnD-packs/v1.0.0/packs/gilded_ledger/manifest.json`,
      `${RAW}/someone-else/DDDnD-packs/v1.0.0/packs/gilded_ledger/manifest.json`,
      `${RAW}/mooeypoo/other-packs/v1.0.0/packs/gilded_ledger/manifest.json`,
      `${RAW}/mooeypoo/DDDnD-packs/v1.0.0/experiments/gilded_ledger/manifest.json`,
      // Folder paths are case-sensitive on GitHub.
      `${RAW}/mooeypoo/DDDnD-packs/v1.0.0/packs/Gilded_Ledger/manifest.json`,
      'https://mooeypoo.github.io/DDDnD-packs/packs/gilded_ledger/manifest.json',
    ].map(keyOf)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('keys GitHub Pages packs by site owner and folder', () => {
    expect(keyOf('https://MooeyPoo.github.io/DDDnD-packs/packs/gilded_ledger/manifest.json'))
      .toBe('github-pages:mooeypoo/DDDnD-packs/packs/gilded_ledger')
  })

  it('keys a file by its content: a file cannot claim a GitHub pack\'s identity', () => {
    expect(packKeyForOrigin({ kind: 'file', file_name: 'gilded_ledger.dddnd-pack.json' }, HASH)).toBe(`file:${HASH}`)
    expect(packKeyForOrigin({ kind: 'file', file_name: 'renamed.dddnd-pack.json' }, HASH)).toBe(`file:${HASH}`)
  })

  it('refuses to key a remote origin that is not an allowed source (tampered storage)', () => {
    expect(() => packKeyForOrigin({ kind: 'remote', manifest_url: 'https://evil.example/manifest.json', pinning: 'release_tag' }, HASH))
      .toThrow(/not an allowed source/)
  })

  it('recognizes well-formed keys only', () => {
    for (const key of ['dddnd:base', 'github:o/r/packs/x', 'github-pages:o/site/x', `file:${HASH}`]) {
      expect(isPackKey(key), key).toBe(true)
    }
    for (const key of ['', 'base', 'dddnd:', 'file:md5:abc', 'github:has space', 'ftp:o/r', `github:${'x'.repeat(600)}`]) {
      expect(isPackKey(key), key).toBe(false)
    }
  })
})

describe('community packs can only build on packs whose identity we control (ADR 0013)', () => {
  const manifest = (id: string, ...deps: string[]) => ({ id, depends_on: deps.map((pack_id) => ({ pack_id, version: '1.0.0' })), classes: [], challenge_modifiers: [] })

  it('allows depending on the packs that ship with DDDnD', () => {
    expect(communityManifestIssues(manifest('gilded_ledger', 'base'))).toEqual([])
    expect(communityManifestIssues(manifest('my_tutorial', 'base', 'tutorial'))).toEqual([])
    expect(communityManifestIssues(manifest('standalone_world'))).toEqual([])
  })

  it('refuses a dependency on any other pack: its id proves nothing about which pack it is', () => {
    expect(communityManifestIssues(manifest('sequel', 'base', 'gilded_ledger'))).toEqual([
      { file: 'manifest.json', message: expect.stringMatching(/^depends_on: "gilded_ledger" is not a pack that ships with DDDnD/) },
    ])
  })

  it('refuses a community pack that uses a first-party id', () => {
    for (const id of ['base', 'tutorial']) {
      expect(communityManifestIssues(manifest(id))).toEqual([{ file: 'manifest.json', message: expect.stringMatching(/belongs to a pack that ships with DDDnD/) }])
    }
  })

  it('refuses game-wide choices: player classes and challenge modifiers (ADR 0014)', () => {
    expect(communityManifestIssues({ ...manifest('gilded_ledger', 'base'), classes: [{ id: 'sneaky', version: 1 }] }))
      .toEqual([{ file: 'manifest.json', message: expect.stringMatching(/^classes: community packs can't add player classes/) }])
    expect(communityManifestIssues({ ...manifest('gilded_ledger', 'base'), challenge_modifiers: [{ id: 'sneaky', version: 1 }] }))
      .toEqual([{ file: 'manifest.json', message: expect.stringMatching(/^challenge_modifiers: community packs can't add challenge modifiers/) }])
  })

  it('is enforced when any community pack is read, before its content is used', async () => {
    const dependent = demoPackSnapshot((files) => {
      files['manifest.json'] = files['manifest.json'].replace('"depends_on": [', '"depends_on": [\n    { "pack_id": "alice_core", "version": "1.0.0" },')
    })
    await expect(dependent).rejects.toBeInstanceOf(PackLoadError)
    await expect(dependent).rejects.toMatchObject({ stage: 'manifest', issues: [expect.objectContaining({ message: expect.stringMatching(/alice_core/) })] })

    const impostor = demoPackSnapshot((files) => {
      files['manifest.json'] = files['manifest.json'].replace('"id": "gilded_ledger"', '"id": "tutorial"')
    })
    await expect(impostor).rejects.toMatchObject({ stage: 'manifest', issues: [expect.objectContaining({ message: expect.stringMatching(/"tutorial" belongs to a pack that ships with DDDnD/) })] })
  })
})
