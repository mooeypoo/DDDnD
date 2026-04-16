import { describe, expect, it } from 'vitest'
import type { ContentPackManifest } from '@/domains/content/model'
import { validateContentPackManifest } from '@/domains/content/services/manifest_validator'

function createValidManifest(overrides: Partial<ContentPackManifest> = {}): ContentPackManifest {
  return {
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
