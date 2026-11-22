import { describe, expect, it } from 'vitest'

import { checkPackSourceUrl, resolvePackContentBase, type PackSource } from '@/domains/content/services/pack_source_policy'

const RAW = 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs'

function sourceOf(url: string): PackSource {
  const result = checkPackSourceUrl(url)
  if (!result.ok) throw new Error(result.reason)
  return result.source
}

describe('pack source policy (ADR 0003)', () => {
  it.each([
    [`${RAW}/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json`, 'github_raw', 'release_tag'],
    [`${RAW}/v1.0.0/packs/gilded_ledger/manifest.json`, 'github_raw', 'release_tag'],
    [`${RAW}/0b38f2f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7/packs/gilded_ledger/manifest.json`, 'github_raw', 'commit'],
    [`${RAW}/main/packs/gilded_ledger/manifest.json`, 'github_raw', 'unpinned'],
    [`${RAW}/refs/heads/main/packs/gilded_ledger/manifest.json`, 'github_raw', 'unpinned'],
    [`${RAW}/refs/tags/first-release/packs/gilded_ledger/manifest.json`, 'github_raw', 'release_tag'],
    ['https://mooeypoo.github.io/DDDnD-packs/packs/gilded_ledger/manifest.json', 'github_pages', 'unpinned'],
  ])('allows %s', (url, hostKind, pinning) => {
    const source = sourceOf(url)
    expect(source.host_kind).toBe(hostKind)
    expect(source.pinning).toBe(pinning)
  })

  it.each([
    ['http://raw.githubusercontent.com/o/r/v1.0.0/manifest.json', /https/],
    ['https://user:pass@raw.githubusercontent.com/o/r/v1.0.0/manifest.json', /username or password/],
    ['https://raw.githubusercontent.com:8443/o/r/v1.0.0/manifest.json', /port/],
    ['https://raw.githubusercontent.com/o/r/v1.0.0/manifest.json?token=1', /query/],
    ['https://raw.githubusercontent.com/o/r/v1.0.0/pack.json', /manifest\.json/],
    ['https://raw.githubusercontent.com/o/r/manifest.json', /branch, tag, or commit/],
    ['https://example.com/packs/manifest.json', /only be loaded from GitHub/],
    ['https://github.io.evil.example/manifest.json', /only be loaded from GitHub/],
    ['https://raw.githubusercontent.com.evil.example/o/r/v1/manifest.json', /only be loaded from GitHub/],
    ['https://evil.example/raw.githubusercontent.com/o/r/v1/manifest.json', /only be loaded from GitHub/],
    ['https://a.b.github.io/manifest.json', /github\.io/],
    ['javascript:alert(1)//manifest.json', /https/],
    ['not a url', /valid URL/],
  ])('refuses %s', (url, reason) => {
    const result = checkPackSourceUrl(url)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(reason)
  })

  it('keeps content inside the same repository and ref on GitHub raw', () => {
    const source = sourceOf(`${RAW}/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json`)
    expect(resolvePackContentBase(source, '.')).toEqual({ ok: true, url: `${RAW}/gilded_ledger-v1.0.0/packs/gilded_ledger/` })
    expect(resolvePackContentBase(source, './content')).toEqual({ ok: true, url: `${RAW}/gilded_ledger-v1.0.0/packs/gilded_ledger/content/` })
    expect(resolvePackContentBase(source, `${RAW}/gilded_ledger-v1.0.0/packs/gilded_ledger`).ok).toBe(true)

    for (const outside of [
      '/content',
      `${RAW}/main/packs/gilded_ledger`,
      'https://raw.githubusercontent.com/someone-else/repo/v1.0.0/packs',
      'https://mooeypoo.github.io/DDDnD-packs/packs/gilded_ledger',
    ]) {
      expect(resolvePackContentBase(source, outside).ok, outside).toBe(false)
    }
  })

  it('keeps content on the same GitHub Pages site', () => {
    const source = sourceOf('https://mooeypoo.github.io/DDDnD-packs/packs/gilded_ledger/manifest.json')
    expect(resolvePackContentBase(source, '.').ok).toBe(true)
    expect(resolvePackContentBase(source, 'https://someone.github.io/packs').ok).toBe(false)
  })
})
