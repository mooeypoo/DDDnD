/**
 * Hostile-pack suite (M1.7, docs/CONTENT_PACKS_SECURITY.md §5).
 *
 * Each case starts from a small, valid community `extension` pack, applies one
 * attack or one mistake, writes the pack to disk, and runs it through the full
 * pipeline next to the real base pack:
 *
 *   manifest validation → registry (ownership) → scoped provider →
 *   bundle build (bounded read + schema per file) → bundle validation
 *
 * The baseline must pass end to end. Every variant must be stopped, at the
 * stage and with the message an author would need. The cases are meant to be
 * readable as a catalog of "what an attack looks like" (talk material).
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import type { ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { validateScenarioBundle } from '@/domains/content/services/bundle_validator'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { validateContentPackManifest } from '@/domains/content/services/manifest_validator'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

type Json = Record<string, unknown>

interface PackFiles {
  manifest: Json
  /** `<type>/<filename>` → JSON value, or a raw string to write as-is */
  files: Record<string, Json | string>
}

const BASE_ROOT = path.resolve('content')
const workRoot = mkdtempSync(path.join(tmpdir(), 'dddnd-hostile-packs-'))
afterAll(() => rmSync(workRoot, { recursive: true, force: true }))

const BASE_SCORES = ['domain_clarity', 'maintainability', 'delivery_confidence', 'team_morale', 'user_trust', 'budget']

/** A small, valid community extension pack: one scenario on base scores. */
function baselinePack(): PackFiles {
  return {
    manifest: {
      schema_version: 1,
      kind: 'extension',
      id: 'workshop_pack',
      version: '1.0.0',
      name: 'Workshop Pack',
      description: 'A facilitator retells the monolith for their own organization.',
      depends_on: [{ pack_id: 'base', version: '1.0.0' }],
      base_url: 'https://raw.githubusercontent.com/example/dddnd-workshop/v1.0.0/content',
      license: 'GPL-3.0-only',
      authors: [{ name: 'Example Facilitator', url: 'https://example.com' }],
      scenarios: [{ id: 'payments_monolith', version: 1 }],
      classes: [],
      challenge_modifiers: [],
      tutorials: [],
      content: {
        scenarios: ['payments_monolith-v1.json'],
        cards: ['split_payments_context-v1.json'],
        stakeholders: ['head_of_payments-v1.json'],
        stakeholder_reaction_rules: ['payments_wants_stability-v1.json'],
        scores: [],
        events: ['card_network_outage-v1.json'],
        delayed_effects: [],
        outcome_tiers: [],
        outcome_archetypes: [],
        classes: [],
        challenge_modifiers: [],
      },
    },
    files: {
      'scenarios/payments_monolith-v1.json': {
        id: 'payments_monolith',
        version: 1,
        name: 'The Payments Monolith',
        description: 'Everything touches the ledger. Untangle it before the audit.',
        max_turns: 8,
        starting_scores: Object.fromEntries(BASE_SCORES.map((id) => [id, 45])),
        score_refs: BASE_SCORES.map((id) => ({ id, version: 1 })),
        stakeholder_refs: [{ id: 'head_of_payments', version: 1 }],
        card_refs: [{ id: 'split_payments_context', version: 1 }],
        event_refs: [{ id: 'card_network_outage', version: 1 }],
      },
      'cards/split_payments_context-v1.json': {
        id: 'split_payments_context',
        version: 1,
        name: 'Split the Payments Context',
        description: 'Give the ledger its own bounded context.',
        score_changes: [{ score_id: 'domain_clarity', delta: 6 }, { score_id: 'delivery_confidence', delta: -3 }],
        delayed_effect_refs: [],
      },
      'stakeholders/head_of_payments-v1.json': {
        id: 'head_of_payments',
        version: 1,
        name: 'Head of Payments',
        description: 'Wants nothing to break, ever.',
        reaction_rule_refs: [{ id: 'payments_wants_stability', version: 1 }],
      },
      'stakeholder-reaction-rules/payments_wants_stability-v1.json': {
        id: 'payments_wants_stability',
        version: 1,
        name: 'Payments Wants Stability',
        description: 'Gets nervous when trust drops.',
        condition_description: 'User trust < 40',
        condition: { target_type: 'score', target_id: 'user_trust', operator: '<', value: 40 },
        score_changes: [],
        stakeholder_changes: [{ stakeholder_id: 'head_of_payments', delta: -4 }],
      },
      'events/card_network_outage-v1.json': {
        id: 'card_network_outage',
        version: 1,
        name: 'Card Network Outage',
        description: 'An upstream provider goes dark.',
        occurrence_weight: 2,
        score_changes: [{ score_id: 'user_trust', delta: -5 }],
        delayed_effect_refs: [],
      },
    },
  }
}

/** Outcome of running a pack through the pipeline: where it stopped and why. */
interface PipelineResult {
  stage: 'passed' | 'manifest' | 'registry' | 'bundle_build' | 'bundle_validation'
  messages: string[]
}

let packCounter = 0

async function runPipeline(pack: PackFiles): Promise<PipelineResult> {
  const root = path.join(workRoot, `pack_${packCounter++}`)
  for (const [relativePath, value] of Object.entries(pack.files)) {
    const filePath = path.join(root, relativePath)
    mkdirSync(path.dirname(filePath), { recursive: true })
    writeFileSync(filePath, typeof value === 'string' ? value : JSON.stringify(value, null, 2))
  }

  const manifestCheck = validateContentPackManifest(pack.manifest)
  if (!manifestCheck.valid) {
    return { stage: 'manifest', messages: manifestCheck.errors.map((error) => `${error.field}: ${error.message}`) }
  }
  const manifest = pack.manifest as unknown as ContentPackManifest

  const registry = new ContentPackRegistry()
  const baseManifest = JSON.parse(readFileSync(path.join(BASE_ROOT, 'manifest.json'), 'utf8')) as ContentPackManifest
  registry.registerPack(baseManifest, createFileContentProvider(BASE_ROOT))
  try {
    registry.registerPack(manifest, createFileContentProvider(root))
  } catch (error) {
    return { stage: 'registry', messages: [(error as Error).message] }
  }

  for (const scenarioRef of manifest.scenarios) {
    let bundle
    try {
      bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, registry.createScenarioProvider(scenarioRef))
    } catch (error) {
      return { stage: 'bundle_build', messages: [(error as Error).message] }
    }
    const validation = validateScenarioBundle(bundle)
    if (!validation.valid) {
      return { stage: 'bundle_validation', messages: validation.errors.map((error) => error.message) }
    }
  }

  return { stage: 'passed', messages: [] }
}

/** Clones the baseline and applies one change. */
function variant(change: (pack: PackFiles) => void): PackFiles {
  const pack = structuredClone(baselinePack())
  change(pack)
  return pack
}

const card = (pack: PackFiles) => pack.files['cards/split_payments_context-v1.json'] as Json
const scenario = (pack: PackFiles) => pack.files['scenarios/payments_monolith-v1.json'] as Json
const rule = (pack: PackFiles) => pack.files['stakeholder-reaction-rules/payments_wants_stability-v1.json'] as Json
const inventory = (pack: PackFiles) => pack.manifest.content as Record<string, string[]>

describe('baseline community pack', () => {
  it('passes the whole pipeline, using base scores through its declared dependency', async () => {
    expect(await runPipeline(baselinePack())).toEqual({ stage: 'passed', messages: [] })
  })
})

interface HostileCase {
  threat: string
  attack: string
  pack: () => PackFiles
  stage: PipelineResult['stage']
  message: RegExp
}

const HOSTILE_CASES: HostileCase[] = [
  {
    threat: 'T2',
    attack: 'a javascript: link as the author URL',
    pack: () => variant((pack) => { pack.manifest.authors = [{ name: 'Mallory', url: 'javascript:alert(document.cookie)' }] }),
    stage: 'manifest',
    message: /authors\[0\]\.url: must be an absolute https:\/\/ URL/,
  },
  {
    threat: 'T3',
    attack: 'an inventory filename that climbs out of the pack folder',
    pack: () => variant((pack) => { inventory(pack).cards = ['../../../etc/passwd-v1.json'] }),
    stage: 'manifest',
    message: /content\.cards\[0\]: must be a versioned filename/,
  },
  {
    threat: 'T3',
    attack: 'a base_url that climbs out of a folder',
    pack: () => variant((pack) => { pack.manifest.base_url = '/content/../../admin' }),
    stage: 'manifest',
    message: /base_url: must be a root-relative path/,
  },
  {
    threat: 'T3',
    attack: 'a content ref id that tries path traversal',
    pack: () => variant((pack) => { scenario(pack).card_refs = [{ id: '../../secrets', version: 1 }] }),
    stage: 'bundle_build',
    message: /card_refs\[0\]\.id: must be lowercase snake_case/,
  },
  {
    threat: 'T4',
    attack: 'a "__proto__" key in starting scores (prototype pollution)',
    pack: () => variant((pack) => {
      pack.files['scenarios/payments_monolith-v1.json'] = JSON.stringify(scenario(pack)).replace('"starting_scores":{', '"starting_scores":{"__proto__":{"polluted":true},')
    }),
    stage: 'bundle_build',
    message: /starting_scores: "__proto__" is a reserved word/,
  },
  {
    threat: 'T4',
    attack: '"constructor" as a score id',
    pack: () => variant((pack) => { card(pack).score_changes = [{ score_id: 'constructor', delta: 1 }] }),
    stage: 'bundle_build',
    message: /score_changes\[0\]\.score_id: is a reserved word/,
  },
  {
    threat: 'T5',
    attack: 'a billion turns to freeze the tab',
    pack: () => variant((pack) => { scenario(pack).max_turns = 1_000_000_000 }),
    stage: 'bundle_build',
    message: /max_turns: must be at most 50/,
  },
  {
    threat: 'T5',
    attack: 'an infinite delta (1e999 parses to Infinity)',
    pack: () => variant((pack) => {
      pack.files['cards/split_payments_context-v1.json'] = JSON.stringify(card(pack)).replace('"delta":6', '"delta":1e999')
    }),
    stage: 'bundle_build',
    message: /score_changes\[0\]\.delta: must be a number/,
  },
  {
    threat: 'T5',
    attack: 'a 100 KB card file',
    pack: () => variant((pack) => { card(pack).flavor_text = 'x'.repeat(100_000) }),
    stage: 'bundle_build',
    message: /Content too large/,
  },
  {
    threat: 'T6',
    attack: 'shipping its own copy of a base card to change the base game',
    pack: () => variant((pack) => { inventory(pack).cards = ['define_bounded_context-v1.json', 'split_payments_context-v1.json'] }),
    stage: 'registry',
    message: /which pack "base" already provides/,
  },
  {
    threat: 'T6',
    attack: 'calling itself "base"',
    pack: () => variant((pack) => { pack.manifest.id = 'base'; pack.manifest.kind = 'standalone'; pack.manifest.depends_on = []; pack.manifest.license = 'MIT' }),
    stage: 'registry',
    message: /A pack with id "base" is already loaded/,
  },
  {
    threat: 'T7',
    attack: 'a reaction rule with only a prose condition',
    pack: () => variant((pack) => { delete rule(pack).condition }),
    stage: 'bundle_build',
    message: /condition: is required/,
  },
  {
    threat: 'T7',
    attack: 'a condition on a score the scenario does not track (would silently read 0)',
    pack: () => variant((pack) => { rule(pack).condition = { target_type: 'score', target_id: 'technical_debt', operator: '>', value: 10 } }),
    stage: 'bundle_validation',
    message: /references score "technical_debt" which is not in the scenario score_refs/,
  },
  {
    threat: 'T7',
    attack: 'a typo in a field name',
    pack: () => variant((pack) => { card(pack).stakehoder_changes = [] }),
    stage: 'bundle_build',
    message: /unknown field "stakehoder_changes"/,
  },
  {
    threat: 'T14',
    attack: 'a pack written for a newer pack format',
    pack: () => variant((pack) => { pack.manifest.schema_version = 2 }),
    stage: 'manifest',
    message: /supports up to 1/,
  },
  {
    threat: 'ADR 0004',
    attack: 'building on base under an incompatible license',
    pack: () => variant((pack) => { pack.manifest.license = 'MIT' }),
    stage: 'manifest',
    message: /license: packs that build on the base pack must use a GPL-3\.0-compatible license/,
  },
  {
    threat: 'scope',
    attack: 'using base content without declaring base as a dependency',
    pack: () => variant((pack) => { pack.manifest.kind = 'standalone'; pack.manifest.depends_on = [] }),
    stage: 'bundle_build',
    message: /belongs to pack "base", which pack "workshop_pack" does not declare in depends_on/,
  },
]

describe('hostile and broken packs are stopped', () => {
  it.each(HOSTILE_CASES.map((testCase) => [`${testCase.threat}: ${testCase.attack}`, testCase] as const))('%s', async (_label, testCase) => {
    const result = await runPipeline(testCase.pack())
    expect(result.stage).toBe(testCase.stage)
    expect(result.messages.join('\n')).toMatch(testCase.message)
  })

  it('treats markup in text as plain text (T1): validation does not sanitize, rendering never interprets', async () => {
    const markup = '<img src=x onerror=alert(1)>'
    const pack = variant((value) => { card(value).name = markup })
    expect((await runPipeline(pack)).stage).toBe('passed')
    // The defense is the rendering rule (tests/ui/no_markup_injection.test.ts) and
    // the CSP (netlify.toml). The text reaches the UI unchanged and is shown as text.
  })
})
