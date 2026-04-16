import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONTENT_PACK_MANIFEST_URLS,
  resolveContentPackManifestUrls,
} from '@/domains/content/services/content_pack_manifest_urls'

describe('content pack manifest urls', () => {
  it('returns defaults when no external urls are provided', () => {
    expect(resolveContentPackManifestUrls()).toEqual(DEFAULT_CONTENT_PACK_MANIFEST_URLS)
  })

  it('appends external manifest urls after defaults', () => {
    const urls = resolveContentPackManifestUrls([
      '/content/expansion/manifest.json',
      'https://cdn.example.com/pack/manifest.json',
    ])

    expect(urls).toEqual([
      ...DEFAULT_CONTENT_PACK_MANIFEST_URLS,
      '/content/expansion/manifest.json',
      'https://cdn.example.com/pack/manifest.json',
    ])
  })

  it('trims values and drops duplicates', () => {
    const urls = resolveContentPackManifestUrls([
      '/content/manifest.json',
      '  /content/expansion/manifest.json  ',
      '/content/expansion/manifest.json',
      '   ',
    ])

    expect(urls).toEqual([
      ...DEFAULT_CONTENT_PACK_MANIFEST_URLS,
      '/content/expansion/manifest.json',
    ])
  })
})
