import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type NamedEntity = {
  id: string
  name: string
}

type ContentCatalog = {
  scenarios?: NamedEntity[]
  cards?: NamedEntity[]
  stakeholders?: NamedEntity[]
  events?: NamedEntity[]
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

const GENERATED_MARKER = '<!-- GENERATED_ENTITY_PAGE: DO NOT EDIT -->'

type EntityKind = 'scenario' | 'card' | 'stakeholder' | 'event'

type EntityPageDefinition = {
  kind: EntityKind
  collectionKey: keyof ContentCatalog
  outputSubdir: string
  backLabel: string
  backHref: string
  titleFallbackPrefix: string
}

const entityDefinitions: EntityPageDefinition[] = [
  {
    kind: 'scenario',
    collectionKey: 'scenarios',
    outputSubdir: 'scenarios',
    backLabel: 'Back to Scenario Catalog',
    backHref: '/dashboard/scenarios',
    titleFallbackPrefix: 'Scenario',
  },
  {
    kind: 'card',
    collectionKey: 'cards',
    outputSubdir: 'cards',
    backLabel: 'Back to Card Catalog',
    backHref: '/dashboard/cards',
    titleFallbackPrefix: 'Card',
  },
  {
    kind: 'stakeholder',
    collectionKey: 'stakeholders',
    outputSubdir: 'stakeholders',
    backLabel: 'Back to Stakeholder Catalog',
    backHref: '/dashboard/stakeholders',
    titleFallbackPrefix: 'Stakeholder',
  },
  {
    kind: 'event',
    collectionKey: 'events',
    outputSubdir: 'events',
    backLabel: 'Back to Event Catalog',
    backHref: '/dashboard/events',
    titleFallbackPrefix: 'Event',
  },
]

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

function asSortedUniqueEntityIds(catalog: ContentCatalog, collectionKey: keyof ContentCatalog): string[] {
  const ids = new Set<string>()
  for (const entity of catalog[collectionKey] ?? []) {
    if (entity?.id) {
      ids.add(entity.id)
    }
  }

  return Array.from(ids).sort((a, b) => a.localeCompare(b))
}

function escapeYamlTitle(value: string): string {
  return value.replace(/"/g, '\\"')
}

function buildEntityPage(
  definition: EntityPageDefinition,
  entityId: string,
  entityName: string
): string {
  const baseName = entityName.trim().length > 0 ? entityName : `${definition.titleFallbackPrefix} ${entityId}`
  const safeName = escapeYamlTitle(baseName)

  return [
    GENERATED_MARKER,
    '---',
    `title: "${safeName}"`,
    '---',
    '',
    definition.kind === 'scenario'
      ? `<ScenarioDetail scenario-id="${entityId}" />`
      : `<EntityDetail entity-type="${definition.kind}" entity-id="${entityId}" />`,
    '',
    `[${definition.backLabel}](${definition.backHref})`,
    '',
  ].join('\n')
}

async function cleanupRemovedEntityPages(outputDir: string, validEntityIds: Set<string>) {
  const files = await readdir(outputDir, { withFileTypes: true })

  for (const entry of files) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue
    }

    const entityId = entry.name.replace(/\.md$/, '')
    if (validEntityIds.has(entityId)) {
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

  for (const definition of entityDefinitions) {
    const outputDir = path.resolve(projectRoot, `docs-site/dashboard/${definition.outputSubdir}`)
    await mkdir(outputDir, { recursive: true })

    const entityIds =
      definition.kind === 'scenario'
        ? asSortedUniqueScenarioIds(catalog, audit)
        : asSortedUniqueEntityIds(catalog, definition.collectionKey)

    const namedEntities = (catalog[definition.collectionKey] ?? []) as NamedEntity[]
    const entityNameById = new Map(namedEntities.map((entity) => [entity.id, entity.name] as const))

    for (const entityId of entityIds) {
      const filePath = path.join(outputDir, `${entityId}.md`)
      const entityName = entityNameById.get(entityId) ?? entityId
      const content = buildEntityPage(definition, entityId, entityName)
      await writeFile(filePath, content, 'utf8')
    }

    await cleanupRemovedEntityPages(outputDir, new Set(entityIds))
    console.log(`Generated ${entityIds.length} ${definition.outputSubdir} pages in ${outputDir}`)
  }
}

main().catch((error) => {
  console.error('Failed to generate docs entity pages:', error)
  process.exit(1)
})
