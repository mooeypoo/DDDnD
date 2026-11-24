/**
 * The base-content lock (docs/PACK_STUDIO.md D25).
 *
 * Community packs name base content by `{ id, version }` and declare the base
 * pack they were made with (`depends_on`, caret semantics: any later 1.x
 * accepts a pack made for 1.0.0). So within one major version, the base pack
 * makes a promise to every pack already out there:
 *
 * - every `<id>-v<n>` it has shipped stays shipped, and
 * - plays the same (wording may change), and
 * - new content comes with a later base version, so a pack that uses it
 *   declares a base that has it.
 *
 * `scripts/base-content-lock.json` records that promise, and CI checks it.
 * Breaking it on purpose means a new major base version, which resets the lock.
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { playSignature } from '../../src/domains/authoring/releases'
import type { ContentPackManifest } from '../../src/domains/content/model/content_pack_manifest'
import { CONTENT_TYPE_BY_SECTION } from '../../src/domains/content/services/pack_snapshot_builder'

export const BASE_ROOT = path.resolve('content')
export const LOCK_PATH = path.resolve('scripts/base-content-lock.json')

export interface BaseContentLock {
  /** The base pack version this lock was last recorded at. */
  version: string
  /** Every file base `<major>.x` has shipped, by section, with how it plays (a short hash). */
  files: Record<string, Record<string, string>>
}

function parse(version: string): [number, number, number] {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) throw new Error(`"${version}" is not a version of three numbers`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function isLater(next: string, previous: string): boolean {
  const a = parse(next)
  const b = parse(previous)
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return false
}

/** The base pack as it is in the repository now, in the lock's shape. */
export function currentBase(root = BASE_ROOT): BaseContentLock {
  const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8')) as ContentPackManifest
  const files: BaseContentLock['files'] = {}
  for (const [section, names] of Object.entries(manifest.content)) {
    const folder = CONTENT_TYPE_BY_SECTION[section as keyof typeof CONTENT_TYPE_BY_SECTION]
    files[section] = {}
    for (const name of [...(names as string[])].sort()) {
      const entity = JSON.parse(readFileSync(path.join(root, folder, name), 'utf8')) as object
      files[section][name] = createHash('sha256').update(playSignature(entity)).digest('hex').slice(0, 16)
    }
  }
  return { version: manifest.version, files }
}

export function readLock(): BaseContentLock {
  return JSON.parse(readFileSync(LOCK_PATH, 'utf8')) as BaseContentLock
}

/**
 * Every way `now` breaks the promise `lock` recorded, in words. Empty when
 * `now` keeps it (and may then be recorded as the new lock).
 *
 * `accepted` names files (`cards/x-v1.json`) whose recorded play may change
 * anyway: CONTENT_VERSIONING.md allows moving behaviour into a new structured
 * field when a test proves it plays identically. Only `npm run content:lock
 * -- --accept <file>` passes it, so it is always a deliberate, reviewed step.
 */
export function lockProblems(lock: BaseContentLock, now: BaseContentLock, accepted: ReadonlySet<string> = new Set()): string[] {
  // A new major version is allowed to break the promise: it starts a new lock
  if (parse(now.version)[0] > parse(lock.version)[0]) return []
  if (parse(now.version)[0] < parse(lock.version)[0] || isLater(lock.version, now.version)) {
    return [`The base pack is at ${now.version}, older than ${lock.version} in the lock. Base versions only move forward.`]
  }

  const problems: string[] = []
  let added = false
  for (const section of new Set([...Object.keys(lock.files), ...Object.keys(now.files)])) {
    const before = lock.files[section] ?? {}
    const after = now.files[section] ?? {}
    for (const [name, hash] of Object.entries(before)) {
      if (!(name in after)) {
        problems.push(`${section}/${name} was removed. Packs made for base ${lock.version} may use it: keep it, or make the next base version a new major version.`)
      } else if (after[name] !== hash && !accepted.has(`${section}/${name}`)) {
        problems.push(`${section}/${name} plays differently than when it shipped. Give the change a new version (a new -v file) and point the base content at it; packs made for an earlier base still use this one.`)
      }
    }
    if (Object.keys(after).some((name) => !(name in before))) added = true
  }
  if (added && !isLater(now.version, lock.version)) {
    problems.push(`The base pack has new content but is still version ${now.version}. Raise its version (a new minor, such as ${parse(now.version)[0]}.${parse(now.version)[1] + 1}.0), so packs that use the new content declare a base that has it.`)
  }
  return problems
}
