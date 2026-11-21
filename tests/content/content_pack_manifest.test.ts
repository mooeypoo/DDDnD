import { describe, expect, it } from 'vitest'
import type { ContentPackManifest } from '@/domains/content/model'
import { validateContentPackManifest } from '@/domains/content/services/manifest_validator'

function createValidManifest(overrides: Partial<ContentPackManifest> = {}): ContentPackManifest {
  return {
    schema_version: 1,
    kind: 'standalone',
    id: 'base',
    version: '1.0.0',
    name: 'Base Pack',
    description: 'Core content pack',
    depends_on: [],
    base_url: '/content',
    license: 'GPL-3.0-only',
    authors: [
      {
        name: 'Test Author',
      },
    ],
    pack_homepage_url: 'https://example.com/pack',
    scenarios: [{ id: 'monolith_of_mild_despair', version: 1 }],
    classes: [{ id: 'boundary_mage', version: 1 }],
    challenge_modifiers: [],
    tutorials: [],
    content: {
      scenarios: ['monolith_of_mild_despair-v1.json'],
      cards: ['define_bounded_context-v1.json'],
      stakeholders: ['cto-v1.json'],
      stakeholder_reaction_rules: ['cto_wants_clarity-v1.json'],
      scores: ['domain_clarity-v1.json'],
      events: ['urgent_feature_request-v1.json'],
      delayed_effects: ['boundaries_clarify-v1.json'],
      outcome_tiers: ['success-v1.json'],
      outcome_archetypes: ['boundary_builder-v1.json'],
      classes: ['boundary_mage-v1.json'],
      challenge_modifiers: [],
    },
    ...overrides,
  }
}

describe('content pack manifest validator', () => {
  it('accepts a valid manifest with SPDX license', () => {
    const result = validateContentPackManifest(createValidManifest())

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing top-level license', () => {
    const manifest = createValidManifest()
    const withoutLicense = { ...manifest, license: '' }

    const result = validateContentPackManifest(withoutLicense)

    expect(result.valid).toBe(false)
    expect(result.errors.some(error => error.field === 'license')).toBe(true)
  })

  it('rejects invalid SPDX expressions', () => {
    const result = validateContentPackManifest(
      createValidManifest({ license: 'totally-not-a-license' }),
    )

    expect(result.valid).toBe(false)
    expect(result.errors.some(error => error.field === 'license')).toBe(true)
  })

  it('rejects missing authors and blank author names', () => {
    const noAuthorsResult = validateContentPackManifest(
      createValidManifest({ authors: [] }),
    )
    const blankAuthorResult = validateContentPackManifest(
      createValidManifest({ authors: [{ name: '   ' }] }),
    )

    expect(noAuthorsResult.valid).toBe(false)
    expect(noAuthorsResult.errors.some(error => error.field === 'authors')).toBe(true)
    expect(blankAuthorResult.valid).toBe(false)
    expect(blankAuthorResult.errors.some(error => error.field === 'authors[0].name')).toBe(true)
  })

  it('accepts optional author url and rejects non-string url', () => {
    const validResult = validateContentPackManifest(
      createValidManifest({
        authors: [
          {
            name: 'Test Author',
            url: 'https://example.com/profile',
          },
        ],
      }),
    )

    const invalidResult = validateContentPackManifest(
      createValidManifest({
        authors: [
          {
            name: 'Test Author',
            url: 42 as unknown as string,
          },
        ],
      }),
    )

    expect(validResult.valid).toBe(true)
    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.errors.some(error => error.field === 'authors[0].url')).toBe(true)
  })
})

describe('manifest pack rules (M1.2)', () => {
  function errorsFor(manifest: unknown) {
    return validateContentPackManifest(manifest).errors
  }

  it('rejects a pack written for a newer pack format with one clear message', () => {
    const errors = errorsFor({ ...createValidManifest(), schema_version: 99, some_future_field: true })
    expect(errors).toEqual([
      expect.objectContaining({ field: 'schema_version', message: expect.stringMatching(/newer|supports up to 1/) }),
    ])
  })

  it('requires schema_version and kind', () => {
    const { schema_version: _version, kind: _kind, ...rest } = createValidManifest()
    const fields = errorsFor(rest).map((error) => error.field)
    expect(fields).toEqual(expect.arrayContaining(['schema_version', 'kind']))
  })

  it('does not accept overlay packs yet', () => {
    expect(errorsFor(createValidManifest({ kind: 'overlay' as never }))[0].field).toBe('kind')
  })

  it('requires standalone packs to have no dependencies and extensions to have one', () => {
    expect(errorsFor(createValidManifest({ depends_on: [{ pack_id: 'base', version: '1.0.0' }] }))[0].field).toBe('depends_on')
    expect(errorsFor(createValidManifest({ kind: 'extension' }))[0].field).toBe('depends_on')
  })

  it('requires a GPL-3.0-compatible license for packs that build on base (ADR 0004)', () => {
    const extension = createValidManifest({ kind: 'extension', depends_on: [{ pack_id: 'base', version: '1.0.0' }] })
    expect(validateContentPackManifest(extension).valid).toBe(true)
    expect(validateContentPackManifest({ ...extension, license: 'GPL-3.0-or-later' }).valid).toBe(true)
    expect(errorsFor({ ...extension, license: 'MIT' })).toEqual([expect.objectContaining({ field: 'license' })])
  })

  it('lets standalone packs choose any valid SPDX license', () => {
    expect(validateContentPackManifest(createValidManifest({ license: 'CC-BY-SA-4.0' })).valid).toBe(true)
  })

  it('rejects inventory filenames that could escape the content folder', () => {
    const manifest = createValidManifest()
    const errors = errorsFor({ ...manifest, content: { ...manifest.content, cards: ['../../secrets-v1.json'] } })
    expect(errors).toEqual([expect.objectContaining({ field: 'content.cards[0]' })])
  })

  it('rejects entry points missing from the inventory', () => {
    const errors = errorsFor(createValidManifest({ scenarios: [{ id: 'forgotten_scenario', version: 1 }] }))
    expect(errors).toEqual([expect.objectContaining({ field: 'scenarios[0]', message: expect.stringMatching(/forgotten_scenario-v1.json/) })])
  })

  it('rejects non-https and script URLs in links', () => {
    expect(errorsFor(createValidManifest({ pack_homepage_url: 'javascript:alert(1)' }))[0].field).toBe('pack_homepage_url')
    expect(errorsFor(createValidManifest({ authors: [{ name: 'A', url: 'http://example.com' }] }))[0].field).toBe('authors[0].url')
  })

  it('rejects base_url values that climb out of a folder or use other schemes', () => {
    for (const base_url of ['/content/../secrets', '//evil.example/content', 'ftp://example.com/content', 'content']) {
      expect(errorsFor(createValidManifest({ base_url }))[0]?.field).toBe('base_url')
    }
    expect(validateContentPackManifest(createValidManifest({ base_url: 'https://raw.githubusercontent.com/owner/repo/v1/content' })).valid).toBe(true)
    for (const base_url of ['.', './', './content', './packs/demo']) {
      expect(validateContentPackManifest(createValidManifest({ base_url })).valid, base_url).toBe(true)
    }
    for (const base_url of ['./..', './../secrets', './a/../../b']) {
      expect(errorsFor(createValidManifest({ base_url }))[0]?.field, base_url).toBe('base_url')
    }
  })

  it('rejects unknown manifest fields', () => {
    expect(errorsFor({ ...createValidManifest(), homepage: 'https://example.com' })[0].message).toMatch(/homepage/)
  })

  it('rejects packs that list too many files', () => {
    const manifest = createValidManifest()
    const many = Array.from({ length: 450 }, (_, index) => `card_${index}-v1.json`)
    const content = { ...manifest.content, cards: many, events: many, stakeholders: many, scores: many, delayed_effects: many }
    expect(errorsFor({ ...manifest, content })).toEqual([expect.objectContaining({ field: 'content' })])
  })
})

describe('documented example manifests stay valid', () => {
  it.each(['docs/CONTENT_PACK_AUTHORING_GUIDE.md', 'docs-site/guide/content-authoring.md'])('%s', async (docPath) => {
    const { readFileSync } = await import('node:fs')
    const markdown = readFileSync(docPath, 'utf8')
    const example = [...markdown.matchAll(/```json\n([\s\S]*?)```/g)]
      .map((match) => match[1])
      .find((block) => block.includes('"schema_version"'))
    expect(example, 'guide should contain an example manifest').toBeDefined()
    expect(validateContentPackManifest(JSON.parse(example as string)).errors).toEqual([])
  })
})
