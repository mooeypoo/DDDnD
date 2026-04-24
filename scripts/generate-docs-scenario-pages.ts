import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type Scenario = {
  id: string
  name: string
}

type ContentCatalog = {
  scenarios?: Scenario[]
}

type AuditReport = {
  scenarios?: Record<
    string,
    {
      scenario_id?: string
    }
  >
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const dataDir = path.resolve(projectRoot, 'docs-site/public/data')
const outputDir = path.resolve(projectRoot, 'docs-site/dashboard/scenarios')

const GENERATED_MARKER = '<!-- GENERATED_SCENARIO_PAGE: DO NOT EDIT -->'

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

function asSortedUniqueScenarioIds(catalog: ContentCatalog, audit: AuditReport): string[] {
  const ids = new Set<string>()

  for (const scenario of catalog.scenarios ?? []) {
    if (scenario?.id) {
      ids.add(scenario.id)
    }
  }

  for (const scenarioId of Object.keys(audit.scenarios ?? {})) {
    if (scenarioId) {
      ids.add(scenarioId)
    }
  }

  return Array.from(ids).sort((a, b) => a.localeCompare(b))
}

function buildScenarioPage(scenarioId: string, scenarioName: string): string {
  const safeName = scenarioName.trim().length > 0 ? scenarioName : scenarioId

  return [
    GENERATED_MARKER,
    '---',
    `title: ${safeName}`,
    '---',
    '',
    `<ScenarioDetail scenario-id="${scenarioId}" />`,
    '',
    '[Back to Scenario Catalog](/dashboard/scenarios)',
    '',
  ].join('\n')
}

async function cleanupRemovedScenarioPages(validScenarioIds: Set<string>) {
  const files = await readdir(outputDir, { withFileTypes: true })

  for (const entry of files) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue
    }

    const scenarioId = entry.name.replace(/\.md$/, '')
    if (validScenarioIds.has(scenarioId)) {
      continue
    }

    const filePath = path.join(outputDir, entry.name)
    const content = await readFile(filePath, 'utf8')
    if (!content.startsWith(GENERATED_MARKER)) {
      continue
    }

    await rm(filePath)
    console.log(`Removed stale generated page: ${filePath}`)
  }
}

async function main() {
  const catalog = await readJson<ContentCatalog>(path.join(dataDir, 'content-catalog.json'))
  const audit = await readJson<AuditReport>(path.join(dataDir, 'audit-report.json'))

  const scenarioIds = asSortedUniqueScenarioIds(catalog, audit)
  const scenarioNameById = new Map((catalog.scenarios ?? []).map((scenario) => [scenario.id, scenario.name] as const))

  await mkdir(outputDir, { recursive: true })

  for (const scenarioId of scenarioIds) {
    const filePath = path.join(outputDir, `${scenarioId}.md`)
    const scenarioName = scenarioNameById.get(scenarioId) ?? scenarioId
    const content = buildScenarioPage(scenarioId, scenarioName)
    await writeFile(filePath, content, 'utf8')
  }

  await cleanupRemovedScenarioPages(new Set(scenarioIds))

  console.log(`Generated ${scenarioIds.length} scenario pages in ${outputDir}`)
}

main().catch((error) => {
  console.error('Failed to generate scenario docs pages:', error)
  process.exit(1)
})
