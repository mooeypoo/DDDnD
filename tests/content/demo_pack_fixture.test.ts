/**
 * The demo pack (ADR 0006, ADR 0008) through the real pipeline, offline.
 *
 * A copy of mooeypoo/DDDnD-packs/packs/gilded_ledger lives under
 * tests/content/fixtures/packs. This proves an `extension` pack that reuses
 * base content by reference validates and builds next to the real base pack.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { validateScenarioBundle } from '@/domains/content/services/bundle_validator'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { assertValidContentPackManifest } from '@/domains/content/services/manifest_validator'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const BASE_ROOT = path.resolve('content')
const DEMO_ROOT = path.resolve('tests/content/fixtures/packs/gilded_ledger')

function readManifest(root: string): ContentPackManifest {
  const raw = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8')) as unknown
  assertValidContentPackManifest(raw)
  return raw
}

describe('demo pack: The Gilded Ledger', () => {
  it('is a valid extension of the base pack, built on base content it declares', async () => {
    const manifest = readManifest(DEMO_ROOT)
    expect(manifest.kind).toBe('extension')
    expect(manifest.base_url).toBe('.')

    const registry = new ContentPackRegistry()
    registry.registerPack(readManifest(BASE_ROOT), createFileContentProvider(BASE_ROOT))
    const demoKey = registry.registerPack(manifest, createFileContentProvider(DEMO_ROOT))

    for (const ref of manifest.scenarios) {
      const bundle = await buildScenarioBundle(ref.id, ref.version, registry.createScopedProvider(demoKey))
      expect(validateScenarioBundle(bundle).errors).toEqual([])
      expect([...bundle.cards.keys()]).toContain('define_bounded_context-v1')
      expect([...bundle.cards.keys()]).toContain('ledger_split_refunds_context-v1')
    }
  })

  it('only affects stakeholders who are in its scenario (no phantom stakeholders)', async () => {
    const manifest = readManifest(DEMO_ROOT)
    const registry = new ContentPackRegistry()
    registry.registerPack(readManifest(BASE_ROOT), createFileContentProvider(BASE_ROOT))
    const demoKey = registry.registerPack(manifest, createFileContentProvider(DEMO_ROOT))

    const ref = manifest.scenarios[0]
    const bundle = await buildScenarioBundle(ref.id, ref.version, registry.createScopedProvider(demoKey))
    const present = new Set([...bundle.stakeholders.values()].map((stakeholder) => stakeholder.id))
    const targets = [
      ...[...bundle.cards.values()].flatMap((entity) => entity.stakeholder_changes ?? []),
      ...[...bundle.events.values()].flatMap((entity) => entity.stakeholder_changes ?? []),
      ...[...bundle.delayed_effects.values()].flatMap((entity) => entity.stakeholder_changes ?? []),
      ...[...bundle.stakeholder_reaction_rules.values()].flatMap((entity) => entity.stakeholder_changes ?? []),
    ].map((change) => change.stakeholder_id)

    expect(targets.filter((id) => !present.has(id))).toEqual([])
  })
})
