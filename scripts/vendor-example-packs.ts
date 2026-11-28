/**
 * Vendors the Studio's example packs (docs/PACK_STUDIO.md D14, D40): each
 * pack in DDDnD-packs, at its pinned release tag, bundled into one
 * `.dddnd-pack.json` under studio/examples/, which the Studio serves from its
 * own site (its CSP reaches nothing else). The files are read from the tag
 * with `git show`, so the packs repository's checkout doesn't matter.
 *
 * Usage:
 *   npm run studio:examples -- [--packs-repo ../DDDnD-packs]
 *
 * To move an example to a new release, change its tag in
 * studio/examples/examples.json and run this; the test in
 * tests/studio/example_packs.test.ts holds the files to what it records.
 */

import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { draftFromPack } from '../src/domains/authoring/pack_files.js'
import { PACK_BUNDLE_EXTENSION, writePackBundle } from '../src/domains/content/services/pack_bundle_file.js'
import { buildPackSnapshot, inventoryPaths, parseManifestText } from '../src/domains/content/services/pack_snapshot_builder.js'

interface ExampleEntry {
  /** The pack's folder in DDDnD-packs, under packs/. */
  folder: string
  /** The release tag it's pinned to (D14). */
  tag: string
  /** Written by this script: */
  file?: string
  name?: string
  /** The pack's own version, which the Studio shows (never the tag, an id). */
  version?: string
  description?: string
  kind?: 'retelling' | 'new_topic'
  content_hash?: string
}

const EXAMPLES_DIR = path.resolve('studio/examples')
const LIST = path.join(EXAMPLES_DIR, 'examples.json')

function argument(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index === -1 ? undefined : process.argv[index + 1]
}

const repo = path.resolve(argument('--packs-repo') ?? '../DDDnD-packs')
const show = (tag: string, file: string) => execFileSync('git', ['-C', repo, 'show', `${tag}:${file}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })

const entries = JSON.parse(await readFile(LIST, 'utf8')) as ExampleEntry[]
for (const entry of entries) {
  const root = `packs/${entry.folder}`
  const manifestText = show(entry.tag, `${root}/manifest.json`)
  const manifest = parseManifestText(manifestText)
  const files: Record<string, string> = {}
  for (const relativePath of inventoryPaths(manifest)) files[relativePath] = show(entry.tag, `${root}/${relativePath}`)

  const file = `${manifest.id}-v${manifest.version}${PACK_BUNDLE_EXTENSION}`
  const snapshot = await buildPackSnapshot({ manifest_text: manifestText, files }, { kind: 'file', file_name: file })
  const imported = draftFromPack(snapshot)
  if (!imported.ok) throw new Error(`${entry.tag} doesn't open in the Studio: ${imported.problems.join('; ')}`)

  await writeFile(path.join(EXAMPLES_DIR, file), writePackBundle(snapshot))
  Object.assign(entry, { file, name: manifest.name, version: manifest.version, description: manifest.description, kind: imported.draft.kind, content_hash: snapshot.content_hash })
  console.log(`${entry.tag}: ${file} (${imported.draft.kind}, ${Object.keys(snapshot.entities).length} files, ${snapshot.content_hash})`)
}
await writeFile(LIST, `${JSON.stringify(entries, null, 2)}\n`)
