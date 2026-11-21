/**
 * Remote pack loading (M2.3), against a fake GitHub that serves the demo pack
 * fixture. No network.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import type { ContentPackManifest } from '@/domains/content/model'
import { buildScenarioBundle } from '@/domains/content/services/bundle_builder'
import { validateScenarioBundle } from '@/domains/content/services/bundle_validator'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import {
  buildPackSnapshot,
  createSnapshotContentProvider,
  PackLoadError,
  type RawPackFiles,
} from '@/domains/content/services/pack_snapshot_builder'
import { loadRemotePackSnapshot } from '@/domains/content/services/remote_pack_loader'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const DEMO_ROOT = path.resolve('tests/content/fixtures/packs/gilded_ledger')
const PACK_URL = 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/'
const MANIFEST_URL = `${PACK_URL}manifest.json`

function readTree(root: string, prefix = ''): Record<string, string> {
  const files: Record<string, string> = {}
  for (const entry of readdirSync(path.join(root, prefix))) {
    const relative = prefix ? `${prefix}/${entry}` : entry
    if (statSync(path.join(root, relative)).isDirectory()) Object.assign(files, readTree(root, relative))
    else files[relative] = readFileSync(path.join(root, relative), 'utf8')
  }
  return files
}

/** A fake raw.githubusercontent.com serving `files` under PACK_URL. */
function fakeGitHub(files: Record<string, string>, overrides: Record<string, () => Response> = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (overrides[url]) return overrides[url]()
    const relative = url.startsWith(PACK_URL) ? url.slice(PACK_URL.length) : null
    if (relative !== null && files[relative] !== undefined) return new Response(files[relative])
    return new Response('not found', { status: 404 })
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>
}

function demoRaw(): RawPackFiles {
  const tree = readTree(DEMO_ROOT)
  const { 'manifest.json': manifest_text, ...files } = tree
  return { manifest_text, files }
}

async function expectPackError(promise: Promise<unknown>, stage: string, message: RegExp) {
  const error = await promise.then(() => null, (caught: unknown) => caught)
  expect(error).toBeInstanceOf(PackLoadError)
  expect((error as PackLoadError).stage).toBe(stage)
  expect((error as PackLoadError).message).toMatch(message)
}

describe('loading the demo pack from a GitHub URL', () => {
  it('fetches every inventory file, validates it, and plays with the base pack', async () => {
    const fetchImpl = fakeGitHub(readTree(DEMO_ROOT))
    const snapshot = await loadRemotePackSnapshot(MANIFEST_URL, { fetchImpl })

    expect(snapshot.manifest.id).toBe('gilded_ledger')
    expect(Object.keys(snapshot.entities)).toHaveLength(16)
    expect(snapshot.origin).toEqual({ kind: 'remote', manifest_url: MANIFEST_URL, pinning: 'release_tag' })
    expect(snapshot.content_hash).toMatch(/^sha256:[0-9a-f]{64}$/)
    for (const [, init] of fetchImpl.mock.calls) {
      expect(init).toMatchObject({ redirect: 'error', credentials: 'omit' })
    }

    const registry = new ContentPackRegistry()
    const baseRoot = path.resolve('content')
    registry.registerPack(JSON.parse(readFileSync(path.join(baseRoot, 'manifest.json'), 'utf8')) as ContentPackManifest, createFileContentProvider(baseRoot))
    registry.registerPack(snapshot.manifest, createSnapshotContentProvider(snapshot))
    const ref = snapshot.manifest.scenarios[0]
    const bundle = await buildScenarioBundle(ref.id, ref.version, registry.createScenarioProvider(ref))
    expect(validateScenarioBundle(bundle).errors).toEqual([])
  })

  it('gives the same content the same hash, and any change a different one', async () => {
    const raw = demoRaw()
    const origin = { kind: 'file' as const, file_name: 'demo.dddnd-pack.json' }
    const first = await buildPackSnapshot(raw, origin)
    const again = await buildPackSnapshot(demoRaw(), origin)
    const changedFile = Object.keys(raw.files)[0]
    const changed = await buildPackSnapshot({ ...raw, files: { ...raw.files, [changedFile]: raw.files[changedFile].replace('\n}', ' \n}') } }, origin)

    expect(again.content_hash).toBe(first.content_hash)
    expect(changed.content_hash).not.toBe(first.content_hash)
  })
})

describe('remote loading refuses what it should', () => {
  it('rejects a disallowed URL without fetching anything', async () => {
    const fetchImpl = fakeGitHub({})
    await expectPackError(loadRemotePackSnapshot('https://example.com/pack/manifest.json', { fetchImpl }), 'source', /only be loaded from GitHub/)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('refuses redirects', async () => {
    const redirected = () => {
      const response = new Response('{}')
      Object.defineProperty(response, 'redirected', { value: true })
      return response
    }
    const fetchImpl = fakeGitHub(readTree(DEMO_ROOT), { [MANIFEST_URL]: redirected })
    await expectPackError(loadRemotePackSnapshot(MANIFEST_URL, { fetchImpl }), 'fetch', /redirected/)
  })

  it('reports a file the inventory lists but the host does not have', async () => {
    const files = readTree(DEMO_ROOT)
    delete files['cards/ledger_split_refunds_context-v1.json']
    await expectPackError(loadRemotePackSnapshot(MANIFEST_URL, { fetchImpl: fakeGitHub(files) }), 'fetch', /cards\/ledger_split_refunds_context-v1\.json: could not be fetched \(HTTP 404\)/)
  })

  it('reports every invalid file with its path', async () => {
    const files = readTree(DEMO_ROOT)
    files['cards/ledger_freeze_payment_changes-v1.json'] = files['cards/ledger_freeze_payment_changes-v1.json'].replace('"usage_limit": 2', '"usage_limit": 2000')
    files['events/ledger_chargeback_storm-v1.json'] = '{ not json'
    const error = (await loadRemotePackSnapshot(MANIFEST_URL, { fetchImpl: fakeGitHub(files) }).catch((caught: unknown) => caught)) as PackLoadError
    expect(error).toBeInstanceOf(PackLoadError)
    expect(error.stage).toBe('content')
    expect(error.issues).toEqual(expect.arrayContaining([
      { file: 'cards/ledger_freeze_payment_changes-v1.json', message: 'usage_limit: must be at most 50' },
      { file: 'events/ledger_chargeback_storm-v1.json', message: 'is not valid JSON' },
    ]))
  })

  it('refuses a base_url that leaves the pack\'s repository and tag', async () => {
    const files = readTree(DEMO_ROOT)
    files['manifest.json'] = files['manifest.json'].replace('"base_url": "."', '"base_url": "https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/main/packs/gilded_ledger"')
    await expectPackError(loadRemotePackSnapshot(MANIFEST_URL, { fetchImpl: fakeGitHub(files) }), 'manifest', /points outside the pack's location/)
  })

  it('refuses files that are not in the inventory (bundle files)', async () => {
    const raw = demoRaw()
    await expectPackError(
      buildPackSnapshot({ ...raw, files: { ...raw.files, 'cards/smuggled-v1.json': '{}' } }, { kind: 'file', file_name: 'x' }),
      'content',
      /cards\/smuggled-v1\.json: is not listed in the manifest inventory/,
    )
  })
})
