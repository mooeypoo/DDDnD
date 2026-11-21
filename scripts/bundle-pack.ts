/**
 * Bundles a pack folder into a single `.dddnd-pack.json` file that players
 * can load into DDDnD without hosting it.
 *
 * Usage:
 *   npm run content:bundle -- --content-root ../DDDnD-packs/packs/gilded_ledger [--out gilded_ledger.dddnd-pack.json]
 *
 * The pack is fully validated on the way (the same checks the game runs when
 * loading it). Cross-pack checks (dependencies, scenario bundles) are done by
 * `npm run content:validate`; run that first.
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { PACK_BUNDLE_EXTENSION, writePackBundle } from '../src/domains/content/services/pack_bundle_file.js'
import { buildPackSnapshot, inventoryPaths, PackLoadError, parseManifestText } from '../src/domains/content/services/pack_snapshot_builder.js'

function argument(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index === -1 ? undefined : process.argv[index + 1]
}

const contentRoot = argument('--content-root')
if (!contentRoot) {
  console.error('Usage: npm run content:bundle -- --content-root <pack folder> [--out <file>]')
  process.exit(1)
}

try {
  const manifestText = await readFile(path.join(contentRoot, 'manifest.json'), 'utf8')
  const manifest = parseManifestText(manifestText)
  const files: Record<string, string> = {}
  for (const relativePath of inventoryPaths(manifest)) {
    files[relativePath] = await readFile(path.join(contentRoot, relativePath), 'utf8')
  }

  const out = argument('--out') ?? `${manifest.id}-v${manifest.version}${PACK_BUNDLE_EXTENSION}`
  const snapshot = await buildPackSnapshot({ manifest_text: manifestText, files }, { kind: 'file', file_name: path.basename(out) })
  await writeFile(out, writePackBundle(snapshot))
  console.log(`Wrote ${out}`)
  console.log(`  pack: ${manifest.id} ${manifest.version} (${Object.keys(snapshot.entities).length} files)`)
  console.log(`  content hash: ${snapshot.content_hash}`)
} catch (error) {
  if (error instanceof PackLoadError) {
    console.error(`Pack could not be bundled (${error.stage}):`)
    for (const issue of error.issues) console.error(`  ${issue.file}: ${issue.message}`)
  } else {
    console.error(error instanceof Error ? error.message : String(error))
  }
  process.exit(1)
}
