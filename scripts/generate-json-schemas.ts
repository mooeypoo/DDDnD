/**
 * Writes the published JSON Schemas for pack authors to public/schema/v<N>/.
 *
 * Usage: npm run content:schemas
 *
 * The output is committed. A test fails if it drifts from the validator, so
 * run this after changing anything in src/domains/content/validation/.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateJsonSchemas } from '../src/domains/content/validation/json_schema_export.js'
import { CURRENT_PACK_SCHEMA_VERSION } from '../src/domains/content/validation/pack_policy.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(projectRoot, 'public', 'schema', `v${CURRENT_PACK_SCHEMA_VERSION}`)

await mkdir(outputDir, { recursive: true })
const files = generateJsonSchemas()
for (const [filename, schema] of Object.entries(files)) {
  await writeFile(path.join(outputDir, filename), JSON.stringify(schema, null, 2) + '\n')
}
console.log(`Wrote ${Object.keys(files).length} schemas to ${path.relative(projectRoot, outputDir)}`)
