/**
 * Remote Pack Loader (ADR 0003, M2)
 *
 * Loads a community pack from a GitHub manifest URL into a validated
 * `PackSnapshot`:
 *
 * 1. source policy: is this URL an allowed place to load from?
 * 2. manifest: fetched without following redirects, byte-capped, validated
 * 3. content base: `base_url` resolved against the manifest, kept in scope
 * 4. every inventory file: fetched (a few at a time), byte-capped
 * 5. snapshot: every file validated, content hashed
 *
 * Nothing is registered or played here. The caller decides what to do with
 * the snapshot (show the consent screen, cache it, register it).
 */

import type { PackSnapshot } from '../model/pack_snapshot'
import { CONTENT_LIMITS } from '../validation/content_limits'
import { readTextWithLimit } from './bounded_json_reader'
import {
  buildPackSnapshot,
  inventoryPaths,
  PackLoadError,
  parseManifestText,
} from './pack_snapshot_builder'
import { checkPackSourceUrl, resolvePackContentBase } from './pack_source_policy'

export interface RemotePackLoaderOptions {
  /** Injected for tests. Defaults to the global fetch. */
  fetchImpl?: typeof fetch
  /** Files fetched at the same time. */
  concurrency?: number
}

/**
 * Fetches one file under the policy's rules. Redirects are refused
 * (ADR 0003): a github.io site with a custom domain redirects away from the
 * allowlist, and following it would leave the checked origin.
 */
async function fetchText(fetchImpl: typeof fetch, url: string, maxBytes: number): Promise<string> {
  let response: Response
  try {
    response = await fetchImpl(url, { redirect: 'error', credentials: 'omit' })
  } catch {
    throw new Error('could not be fetched (network error, or the server tried to redirect)')
  }
  if (response.redirected) {
    throw new Error('redirected to another address, which is not allowed')
  }
  if (!response.ok) {
    throw new Error(`could not be fetched (HTTP ${response.status})`)
  }
  return readTextWithLimit(response, maxBytes, url)
}

/**
 * Loads and validates a pack from its manifest URL.
 *
 * Throws PackLoadError with the stage (`source`, `manifest`, `fetch`,
 * `content`) and every issue found.
 */
export async function loadRemotePackSnapshot(manifestUrl: string, options: RemotePackLoaderOptions = {}): Promise<PackSnapshot> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
  const concurrency = Math.max(1, options.concurrency ?? 6)

  const check = checkPackSourceUrl(manifestUrl)
  if (!check.ok) {
    throw new PackLoadError('source', [{ file: 'manifest.json', message: check.reason }])
  }
  const source = check.source

  let manifestText: string
  try {
    manifestText = await fetchText(fetchImpl, source.manifest_url, CONTENT_LIMITS.max_manifest_bytes)
  } catch (error) {
    throw new PackLoadError('fetch', [{ file: 'manifest.json', message: (error as Error).message }])
  }

  const manifest = parseManifestText(manifestText)
  const base = resolvePackContentBase(source, manifest.base_url)
  if (!base.ok) {
    throw new PackLoadError('manifest', [{ file: 'manifest.json', message: `base_url: ${base.reason}` }])
  }

  const contentBase = base.url
  const paths = inventoryPaths(manifest)
  const files: Record<string, string> = {}
  const fetchIssues: Array<{ file: string; message: string }> = []
  let next = 0
  let totalBytes = manifestText.length

  async function worker(): Promise<void> {
    while (next < paths.length && fetchIssues.length === 0) {
      const path = paths[next++]
      try {
        const text = await fetchText(fetchImpl, new URL(path, contentBase).href, CONTENT_LIMITS.max_file_bytes)
        totalBytes += text.length
        if (totalBytes > CONTENT_LIMITS.max_pack_bytes) {
          fetchIssues.push({ file: 'pack', message: `is larger than ${CONTENT_LIMITS.max_pack_bytes} bytes` })
          return
        }
        files[path] = text
      } catch (error) {
        fetchIssues.push({ file: path, message: (error as Error).message })
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, paths.length) }, () => worker()))
  if (fetchIssues.length > 0) {
    throw new PackLoadError('fetch', fetchIssues)
  }

  return buildPackSnapshot(
    { manifest_text: manifestText, files },
    { kind: 'remote', manifest_url: source.manifest_url, pinning: source.pinning },
  )
}
