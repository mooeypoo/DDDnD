/**
 * Pack-owned classes and challenge modifiers (M3 slice 8, journal M3.10).
 *
 * A pack's table offers its own classes and modifiers, then its first-party
 * dependencies' ones, each only where it fits the scenario's scores. A pack
 * that only adds scenarios on the base scores needs to declare none.
 */

import { describe, expect, it } from 'vitest'

import { checkPackPlayable } from '@/domains/content/services/pack_playability_check'
import { packKeyOf } from '@/domains/content/services/pack_identity'
import { createSnapshotContentProvider } from '@/domains/content/services/pack_snapshot_builder'
import {
  classFitsScenario,
  modifierFitsScenario,
  tableChoiceIssues,
} from '@/domains/content/services/table_choices'
import { createDiskBackedRegistry, demoPackSnapshot, readFirstPartyManifest } from './support/demo_pack'

const BASE_CLASSES = ['boundary_mage', 'delivery_rogue', 'legacy_ranger', 'reliability_cleric', 'stakeholder_bard']
const BASE_MODIFIERS = ['hard_mode', 'budget_crisis', 'stakeholder_revolt', 'speed_run']

type Files = Record<string, string>

/** Adds a class and/or modifier file to the demo pack, listed in its manifest. */
function withOwnChoices(files: Files, choices: { classes?: object[]; modifiers?: object[] }): void {
  const manifest = JSON.parse(files['manifest.json'])
  for (const playerClass of choices.classes ?? []) {
    const { id } = playerClass as { id: string }
    files[`classes/${id}-v1.json`] = JSON.stringify({ version: 1, name: id, description: `${id} class`, ...playerClass })
    manifest.classes.push({ id, version: 1 })
    manifest.content.classes.push(`${id}-v1.json`)
  }
  for (const modifier of choices.modifiers ?? []) {
    const { id } = modifier as { id: string }
    files[`challenge-modifiers/${id}-v1.json`] = JSON.stringify({ version: 1, name: id, description: `${id} modifier`, ...modifier })
    manifest.challenge_modifiers.push({ id, version: 1 })
    manifest.content.challenge_modifiers.push(`${id}-v1.json`)
  }
  files['manifest.json'] = JSON.stringify(manifest)
}

async function registerDemo(edit?: (files: Files) => void) {
  const registry = createDiskBackedRegistry()
  registry.registerPack(readFirstPartyManifest('base'))
  registry.registerPack(readFirstPartyManifest('tutorial'))
  const snapshot = await demoPackSnapshot(edit)
  const key = packKeyOf(snapshot)
  registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot), key)
  return { registry, key }
}

describe('fit rules', () => {
  it('a class fits where its favored score is tracked, and a class without one fits everywhere', () => {
    expect(classFitsScenario({ score_affinity: 'uptime' }, ['uptime', 'toil'])).toBe(true)
    expect(classFitsScenario({ score_affinity: 'domain_clarity' }, ['uptime', 'toil'])).toBe(false)
    expect(classFitsScenario({}, ['uptime'])).toBe(true)
  })

  it('a modifier fits only where every score it changes is tracked', () => {
    expect(modifierFitsScenario({ score_adjustments: { uptime: -5 } }, ['uptime', 'toil'])).toBe(true)
    expect(modifierFitsScenario({ score_adjustments: { uptime: -5, team_morale: -10 } }, ['uptime', 'toil'])).toBe(false)
    // Turn and satisfaction changes apply everywhere
    expect(modifierFitsScenario({}, ['uptime'])).toBe(true)
  })
})

describe("a pack's table", () => {
  it('offers the base classes and modifiers to a pack that only adds scenarios on the base scores', async () => {
    const { registry, key } = await registerDemo()
    expect(registry.getTableClasses(key).map((ref) => ref.id)).toEqual(BASE_CLASSES)
    expect(registry.getTableChallengeModifiers(key).map((ref) => ref.id)).toEqual(BASE_MODIFIERS)
    expect(await checkPackPlayable(registry, key)).toEqual([])
  })

  it("offers the pack's own classes and modifiers first, then its dependencies'", async () => {
    const { registry, key } = await registerDemo((files) => withOwnChoices(files, {
      classes: [{ id: 'ledger_auditor', score_affinity: 'budget' }, { id: 'quiet_clerk' }],
      modifiers: [{ id: 'audit_season', score_adjustments: { budget: -10 } }],
    }))
    expect(registry.getTableClasses(key).map((ref) => ref.id)).toEqual(['ledger_auditor', 'quiet_clerk', ...BASE_CLASSES])
    expect(registry.getTableChallengeModifiers(key).map((ref) => ref.id)).toEqual(['audit_season', ...BASE_MODIFIERS])
    expect(await checkPackPlayable(registry, key)).toEqual([])
  })

  it("keeps the base lobby's choices unchanged", async () => {
    const { registry } = await registerDemo((files) => withOwnChoices(files, { classes: [{ id: 'ledger_auditor', score_affinity: 'budget' }] }))
    expect(registry.getAvailableClasses().map((ref) => ref.id)).toEqual(BASE_CLASSES)
  })
})

describe("refusing a pack's own choices that never work", () => {
  it('refuses a class whose favored score none of the pack\'s scenarios track', async () => {
    const { registry, key } = await registerDemo((files) => withOwnChoices(files, { classes: [{ id: 'pager_paladin', score_affinity: 'uptime' }] }))
    expect(await checkPackPlayable(registry, key)).toEqual([
      { file: 'classes/pager_paladin-v1.json', message: expect.stringMatching(/score_affinity "uptime" isn't a score any of this pack's scenarios track/) },
    ])
  })

  it('refuses a modifier that changes a score none of the scenarios track', async () => {
    const { registry, key } = await registerDemo((files) => withOwnChoices(files, {
      modifiers: [{ id: 'sev1_storm', score_adjustments: { budget: -5, uptime: -10 } }],
    }))
    expect(await checkPackPlayable(registry, key)).toEqual([
      { file: 'challenge-modifiers/sev1_storm-v1.json', message: expect.stringMatching(/lacks "uptime"/) },
    ])
  })

  it('refuses a scenario that no class at its table fits', () => {
    const issues = tableChoiceIssues({
      own_classes: [],
      own_modifiers: [],
      table_classes: [{ id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'd', score_affinity: 'domain_clarity' }],
      scenarios: [{ ref: { id: 'pager_storm', version: 1 }, tracked_score_ids: ['uptime', 'toil'] }],
    })
    expect(issues).toEqual([{ file: 'scenarios/pager_storm-v1.json', message: expect.stringMatching(/no player class fits this scenario/) }])
  })

  it('never refuses a dependency\'s class for not fitting: it is only filtered out', () => {
    const issues = tableChoiceIssues({
      own_classes: [{ id: 'pager_paladin', version: 1, name: 'Pager Paladin', description: 'd', score_affinity: 'uptime' }],
      own_modifiers: [],
      table_classes: [
        { id: 'pager_paladin', version: 1, name: 'Pager Paladin', description: 'd', score_affinity: 'uptime' },
        { id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'd', score_affinity: 'domain_clarity' },
      ],
      scenarios: [{ ref: { id: 'pager_storm', version: 1 }, tracked_score_ids: ['uptime'] }],
    })
    expect(issues).toEqual([])
  })
})
