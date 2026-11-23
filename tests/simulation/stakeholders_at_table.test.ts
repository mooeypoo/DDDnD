/**
 * A change to a stakeholder who isn't at the scenario's table does nothing
 * (M3 slice 7, journal M3.9). Before, the engine created a "phantom"
 * stakeholder that counted toward endings and could reach the stage.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { toStakeholderChanges } from '@/domains/simulation/rules/change_record_converters'
import { auditStructuralContent } from '@/domains/simulation/services/audit/structural_content_audit'
import { simulate_runs } from '@/domains/simulation/services/simulation_runner'
import { createDiskBackedRegistry } from '../content/support/demo_pack'

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.resolve(file), 'utf8')) as T
}

async function baseBundle(id: string, version: number) {
  const registry = createDiskBackedRegistry()
  registry.registerPack(readJson<ContentPackManifest>('content/manifest.json'))
  return buildScenarioBundle(id, version, registry.createScopedProvider(firstPartyPackKey('base')))
}

describe('stakeholders at the table', () => {
  it('drops changes for stakeholders the scenario lacks', () => {
    const bundle = { scenario: { stakeholder_refs: [{ id: 'cto', version: 1 }] } } as Parameters<typeof toStakeholderChanges>[1]
    expect(toStakeholderChanges([{ stakeholder_id: 'cto', delta: 3 }, { stakeholder_id: 'vp_product', delta: 5 }], bundle))
      .toEqual([{ stakeholder_id: 'cto', delta: 3 }])
  })

  it('never creates a phantom VP Product in Microservice Sprawl (its deploy-pipeline card names one)', async () => {
    const bundle = await baseBundle('microservice_sprawl', 2)
    const present = bundle.scenario.stakeholder_refs.map((ref) => ref.id).sort()
    expect(present).not.toContain('vp_product')

    const report = simulate_runs({ scenario_bundle: bundle, runs: 12, seed: 'phantom', play_policy: 'full_pool_oracle' })
    // On main this listed vp_product too (journal M3.9)
    expect(Object.keys(report.aggregate.average_stakeholder_satisfaction).sort()).toEqual(present)
  })

  it('tells authors, as audit info, which shared content does nothing here', async () => {
    const findings = auditStructuralContent(await baseBundle('microservice_sprawl', 2))
      .filter((finding) => finding.id.startsWith('structural.stakeholder_not_at_table'))
    expect(findings.map((finding) => finding.id)).toEqual(['structural.stakeholder_not_at_table.automate_deployment_pipeline.vp_product'])
    expect(findings[0].severity).toBe('info')
  })

  it('finds no such content in the other base scenarios', async () => {
    const manifest = readJson<ContentPackManifest>('content/manifest.json')
    for (const ref of manifest.scenarios.filter((scenario) => scenario.id !== 'microservice_sprawl')) {
      const findings = auditStructuralContent(await baseBundle(ref.id, ref.version))
      expect(findings.filter((finding) => finding.id.startsWith('structural.stakeholder_not_at_table')), ref.id).toEqual([])
    }
  })
})
