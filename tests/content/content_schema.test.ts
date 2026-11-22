/**
 * Content schema tests (M1, ADR 0001).
 *
 * Two promises are checked here:
 * 1. Every first-party content file passes the new field-level schema,
 *    so hardening the boundary does not change the base game.
 * 2. Hostile or malformed content is rejected with a path an author can follow.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ContentType } from '@/domains/content/services/content_provider'
import {
  ContentSchemaError,
  parseContentEntity,
} from '@/domains/content/validation'

const CONTENT_TYPES: ContentType[] = [
  'scenarios',
  'scores',
  'stakeholders',
  'stakeholder-reaction-rules',
  'cards',
  'events',
  'delayed-effects',
  'outcome-tiers',
  'outcome-archetypes',
  'classes',
  'challenge-modifiers',
]

const FIRST_PARTY_ROOTS = ['content', 'content/tutorial']

function listFirstPartyFiles(): Array<{ contentType: ContentType; file: string }> {
  const files: Array<{ contentType: ContentType; file: string }> = []
  for (const root of FIRST_PARTY_ROOTS) {
    for (const contentType of CONTENT_TYPES) {
      const directory = path.resolve(root, contentType)
      let entries: string[]
      try {
        if (!statSync(directory).isDirectory()) continue
        entries = readdirSync(directory)
      } catch {
        continue
      }
      for (const entry of entries.filter((name) => name.endsWith('.json'))) {
        files.push({ contentType, file: path.join(directory, entry) })
      }
    }
  }
  return files
}

function refFromFile(file: string) {
  const match = path.basename(file).match(/^(.+)-v(\d+)\.json$/)
  if (!match) throw new Error(`Unexpected filename ${file}`)
  return { id: match[1], version: Number(match[2]) }
}

function issuesOf(fn: () => unknown): Array<{ path: string; message: string }> {
  try {
    fn()
  } catch (error) {
    if (error instanceof ContentSchemaError) return error.issues
    throw error
  }
  throw new Error('Expected ContentSchemaError')
}

const ref = { id: 'sample', version: 1 }

function validCard(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sample',
    version: 1,
    name: 'Sample Card',
    description: 'A sample card',
    score_changes: [{ score_id: 'budget', delta: -5 }],
    delayed_effect_refs: [],
    ...overrides,
  }
}

function validScore(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sample',
    version: 1,
    name: 'Maintainability',
    short_name: 'Craft',
    description: 'How easy it is to change the system',
    default_value: 40,
    ...overrides,
  }
}

describe('first-party content passes the schema', () => {
  const files = listFirstPartyFiles()

  it('finds the first-party content files', () => {
    expect(files.length).toBeGreaterThan(150)
  })

  it.each(files.map(({ contentType, file }) => [path.relative('content', file), contentType, file] as const))(
    '%s',
    (_label, contentType, file) => {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown
      expect(() => parseContentEntity(contentType, refFromFile(file), raw)).not.toThrow()
    },
  )
})

describe('score rules (moved from the old score_shape check)', () => {
  it('accepts a complete score', () => {
    expect(() => parseContentEntity('scores', ref, validScore())).not.toThrow()
  })

  it('rejects a blank or missing short_name', () => {
    expect(issuesOf(() => parseContentEntity('scores', ref, validScore({ short_name: '   ' }))))
      .toEqual([expect.objectContaining({ path: 'short_name' })])
    expect(issuesOf(() => parseContentEntity('scores', ref, validScore({ short_name: undefined }))))
      .toEqual([expect.objectContaining({ path: 'short_name' })])
  })

  it('rejects a blank name', () => {
    expect(issuesOf(() => parseContentEntity('scores', ref, validScore({ name: '' }))))
      .toEqual([expect.objectContaining({ path: 'name' })])
  })

  it('rejects min_value above max_value', () => {
    expect(issuesOf(() => parseContentEntity('scores', ref, validScore({ min_value: 80, max_value: 20 }))))
      .toEqual([expect.objectContaining({ path: 'min_value' })])
  })
})

describe('hostile and malformed content is rejected', () => {
  it('rejects wrong types with the field path', () => {
    const issues = issuesOf(() =>
      parseContentEntity('cards', ref, validCard({ score_changes: [{ score_id: 'budget', delta: 'lots' }] })),
    )
    expect(issues).toEqual([expect.objectContaining({ path: 'score_changes[0].delta' })])
  })

  it('rejects unknown keys, which catches author typos', () => {
    const issues = issuesOf(() => parseContentEntity('cards', ref, validCard({ stakehoder_changes: [] })))
    expect(issues[0].message).toMatch(/stakehoder_changes/)
  })

  it('rejects non-finite numbers that JSON can still produce', () => {
    const raw = JSON.parse('{"id":"sample","version":1,"name":"C","description":"D","score_changes":[{"score_id":"budget","delta":1e999}],"delayed_effect_refs":[]}') as unknown
    expect(issuesOf(() => parseContentEntity('cards', ref, raw)))
      .toEqual([expect.objectContaining({ path: 'score_changes[0].delta' })])
  })

  it('rejects fractional values where integers are expected', () => {
    expect(issuesOf(() => parseContentEntity('cards', ref, validCard({ cooldown_turns: 1.5 }))))
      .toEqual([expect.objectContaining({ path: 'cooldown_turns' })])
  })

  it('rejects out-of-range numbers that could freeze the game', () => {
    const scenario = {
      id: 'sample',
      version: 1,
      name: 'S',
      description: 'D',
      max_turns: 1_000_000_000,
      starting_scores: {},
      score_refs: [],
      stakeholder_refs: [],
      card_refs: [],
      event_refs: [],
    }
    expect(issuesOf(() => parseContentEntity('scenarios', ref, scenario)))
      .toEqual([expect.objectContaining({ path: 'max_turns' })])
  })

  it('rejects oversized collections', () => {
    const cardRefs = Array.from({ length: 101 }, (_, index) => ({ id: `card_${index}`, version: 1 }))
    const scenario = {
      id: 'sample',
      version: 1,
      name: 'S',
      description: 'D',
      max_turns: 10,
      starting_scores: {},
      score_refs: [],
      stakeholder_refs: [],
      card_refs: cardRefs,
      event_refs: [],
    }
    expect(issuesOf(() => parseContentEntity('scenarios', ref, scenario)))
      .toEqual([expect.objectContaining({ path: 'card_refs' })])
  })

  it('rejects oversized strings', () => {
    expect(issuesOf(() => parseContentEntity('cards', ref, validCard({ description: 'x'.repeat(10_000) }))))
      .toEqual([expect.objectContaining({ path: 'description' })])
  })

  it('rejects ids outside the id grammar, including path traversal', () => {
    expect(issuesOf(() => parseContentEntity('cards', ref, validCard({
      delayed_effect_refs: [{ id: '../../secrets', version: 1 }],
    })))).toEqual([expect.objectContaining({ path: 'delayed_effect_refs[0].id' })])
  })

  it('rejects reserved ids as values and as record keys', () => {
    expect(issuesOf(() => parseContentEntity('cards', ref, validCard({
      score_changes: [{ score_id: 'constructor', delta: 1 }],
    })))).toEqual([expect.objectContaining({ path: 'score_changes[0].score_id' })])

    const raw = JSON.parse('{"id":"sample","version":1,"name":"S","description":"D","max_turns":10,"starting_scores":{"__proto__":50},"score_refs":[],"stakeholder_refs":[],"card_refs":[],"event_refs":[]}') as unknown
    const issues = issuesOf(() => parseContentEntity('scenarios', ref, raw))
    expect(issues[0].path).toMatch(/^starting_scores/)
  })

  it('rejects bidirectional-override and control characters in text', () => {
    expect(issuesOf(() => parseContentEntity('cards', ref, validCard({ name: 'Pay ‮yrros' }))))
      .toEqual([expect.objectContaining({ path: 'name' })])
    expect(issuesOf(() => parseContentEntity('cards', ref, validCard({ description: 'bell\u0007' }))))
      .toEqual([expect.objectContaining({ path: 'description' })])
  })

  it('allows ordinary multilingual text, emoji, and newlines', () => {
    expect(() => parseContentEntity('cards', ref, validCard({
      name: 'Définir le contexte 🧭',
      description: 'שלום\nこんにちは 👩‍💻',
    }))).not.toThrow()
  })

  it('writes author-facing messages', () => {
    const issues = issuesOf(() => parseContentEntity('cards', ref, {
      id: 'sample',
      version: 1,
      description: 'D',
      score_changes: [{ score_id: 'budget', delta: 'lots' }],
      delayed_effect_refs: [],
      cooldown_turns: 1.5,
      stakehoder_changes: [],
    }))
    expect(issues).toEqual(expect.arrayContaining([
      { path: 'name', message: 'is required' },
      { path: 'score_changes[0].delta', message: 'must be a number' },
      { path: 'cooldown_turns', message: 'must be a whole number' },
      { path: '', message: 'unknown field "stakehoder_changes" (check the spelling)' },
    ]))
  })

  it('returns only known fields (no extra data passes through)', () => {
    const parsed = parseContentEntity('cards', ref, validCard())
    expect(Object.keys(parsed).sort()).toEqual(['delayed_effect_refs', 'description', 'id', 'name', 'score_changes', 'version'])
  })
})

/**
 * Guards the CSP promise in ADR 0007. With the classic Zod API this test
 * failed when `jitless` was turned off (verified 2026-11-21). With `zod/mini`
 * our schemas do not reach Zod's JIT path at all, so `jitless` is a second
 * safeguard and this test guards the outcome, whatever the library does.
 */
describe('validation never evaluates generated code (ADR 0007)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not call the Function constructor while parsing', () => {
    const functionSpy = vi.spyOn(globalThis, 'Function')
    parseContentEntity('cards', ref, validCard())
    parseContentEntity('scores', ref, validScore())
    expect(functionSpy).not.toHaveBeenCalled()
  })
})

describe('published JSON Schemas (M1.5)', () => {
  it('match the validator (run `npm run content:schemas` after changing validation)', async () => {
    const { generateJsonSchemas } = await import('@/domains/content/validation/json_schema_export')
    const generated = generateJsonSchemas()
    const directory = path.resolve('public/schema/v1')
    const committed = readdirSync(directory).filter((name) => name.endsWith('.schema.json')).sort()

    expect(committed).toEqual(Object.keys(generated).sort())
    for (const [filename, schema] of Object.entries(generated)) {
      expect(JSON.parse(readFileSync(path.join(directory, filename), 'utf8')), filename).toEqual(schema)
    }
  })

  it('lets authors link a schema with "$schema" without failing strict validation', () => {
    expect(() => parseContentEntity('cards', ref, validCard({ $schema: 'https://dddnd.app/schema/v1/card.schema.json' }))).not.toThrow()
    expect(parseContentEntity('cards', ref, validCard({ $schema: 'https://dddnd.app/schema/v1/card.schema.json' }))).not.toHaveProperty('$schema')
  })
})
