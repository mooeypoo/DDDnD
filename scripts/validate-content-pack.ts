import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  Card,
  ContentPackManifest,
  DelayedEffect,
  Event,
  OutcomeArchetype,
  OutcomeTier,
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  VersionRef,
  PlayerClass,
} from '../src/domains/content/model/index.js'
import type { ContentProvider } from '../src/domains/content/services/content_provider.js'
import { validateContentPack } from '../src/domains/content/services/content_pack_validator.js'
import { assertValidContentPackManifest } from '../src/domains/content/services/manifest_validator.js'
import { simulate_runs } from '../src/domains/simulation/services/simulation_runner.js'
import { buildContentAuditReport } from '../src/domains/simulation/services/audit/content_audit_report_builder.js'
import { buildScenarioBundle } from '../src/domains/content/services/bundle_builder.js'

interface VersionedEntity {
  id: string
  version: number
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultProjectRoot = path.resolve(scriptDir, '..')
const defaultContentRoot = path.resolve(defaultProjectRoot, 'content')

function parseArgs(args: string[]) {
  const getValue = (flag: string): string | undefined => {
    const idx = args.indexOf(flag)
    if (idx === -1 || idx + 1 >= args.length) return undefined
    return args[idx + 1]
  }

  const hasFlag = (flag: string): boolean => args.includes(flag)

  const contentRoot = path.resolve(getValue('--content-root') ?? defaultContentRoot)
  const manifestPath = path.resolve(getValue('--manifest') ?? path.join(contentRoot, 'manifest.json'))
  const packId = getValue('--pack-id')
  const runsRaw = getValue('--runs')
  const runs = runsRaw ? Number.parseInt(runsRaw, 10) : 50
  const withAudit = hasFlag('--audit')
  const failOnAuditCritical = hasFlag('--fail-on-audit-critical')
  const includeTestScenarios = hasFlag('--include-test-scenarios')

  if (!Number.isInteger(runs) || runs < 1) {
    throw new Error('--runs must be a positive integer')
  }

  return {
    contentRoot,
    manifestPath,
    packId,
    runs,
    withAudit,
    failOnAuditCritical,
    includeTestScenarios,
  }
}

async function loadJson<T extends VersionedEntity>(
  contentRoot: string,
  directory: string,
  ref: VersionRef,
): Promise<T> {
  const filename = `${ref.id}-v${ref.version}.json`
  const filePath = path.join(contentRoot, directory, filename)
  const raw = await readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as T

  if (parsed.id !== ref.id || parsed.version !== ref.version) {
    throw new Error(
      `Version mismatch in ${filename}: expected ${ref.id} v${ref.version}, got ${parsed.id} v${parsed.version}`,
    )
  }

  return parsed
}

function createFileContentProvider(contentRoot: string): ContentProvider {
  return {
    loadScenario: (ref: VersionRef) => loadJson<Scenario>(contentRoot, 'scenarios', ref),
    loadScore: (ref: VersionRef) => loadJson<Score>(contentRoot, 'scores', ref),
    loadStakeholder: (ref: VersionRef) => loadJson<Stakeholder>(contentRoot, 'stakeholders', ref),
    loadStakeholderReactionRule: (ref: VersionRef) =>
      loadJson<StakeholderReactionRule>(contentRoot, 'stakeholder-reaction-rules', ref),
    loadCard: (ref: VersionRef) => loadJson<Card>(contentRoot, 'cards', ref),
    loadEvent: (ref: VersionRef) => loadJson<Event>(contentRoot, 'events', ref),
    loadDelayedEffect: (ref: VersionRef) => loadJson<DelayedEffect>(contentRoot, 'delayed-effects', ref),
    loadOutcomeTier: (ref: VersionRef) => loadJson<OutcomeTier>(contentRoot, 'outcome-tiers', ref),
    loadOutcomeArchetype: (ref: VersionRef) => loadJson<OutcomeArchetype>(contentRoot, 'outcome-archetypes', ref),
    loadPlayerClass: (ref: VersionRef) => loadJson<PlayerClass>(contentRoot, 'classes', ref),
  }
}

async function listScenarioRefs(contentRoot: string, includeTestScenarios: boolean): Promise<VersionRef[]> {
  const scenarioDir = path.join(contentRoot, 'scenarios')
  const files = await readdir(scenarioDir)

  return files
    .filter((file: string) => file.endsWith('.json'))
    .map((file: string) => {
      const match = file.match(/^(.+)-v(\d+)\.json$/)
      if (!match) {
        return null
      }

      return {
        id: match[1],
        version: Number.parseInt(match[2], 10),
      } as VersionRef
    })
    .filter((ref: VersionRef | null): ref is VersionRef => !!ref)
    .filter((ref: VersionRef) => includeTestScenarios || !ref.id.startsWith('test_'))
    .sort((a: VersionRef, b: VersionRef) => a.id.localeCompare(b.id) || a.version - b.version)
}

async function loadManifestFromDisk(manifestPath: string): Promise<ContentPackManifest> {
  const raw = await readFile(manifestPath, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  assertValidContentPackManifest(parsed)
  return parsed
}

function listEntryPointScenarioRefs(manifest: ContentPackManifest, includeTestScenarios: boolean): VersionRef[] {
  const scenarioRefs = [...manifest.scenarios, ...manifest.tutorials]
    .filter(ref => includeTestScenarios || !ref.id.startsWith('test_'))
    .sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version)

  return scenarioRefs
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const manifest = await loadManifestFromDisk(options.manifestPath)
  const provider = createFileContentProvider(options.contentRoot)
  const scenarioRefs = listEntryPointScenarioRefs(manifest, options.includeTestScenarios)

  const resolvedPackId = options.packId ?? manifest.id

  if (scenarioRefs.length === 0) {
    const fallbackRefs = await listScenarioRefs(options.contentRoot, options.includeTestScenarios)
    scenarioRefs.push(...fallbackRefs)
  }

  if (scenarioRefs.length === 0) {
    console.error(
      `No scenario entry points found in manifest ${options.manifestPath} and no fallback scenarios under ${path.join(options.contentRoot, 'scenarios')}`,
    )
    process.exit(1)
  }

  const validationReport = await validateContentPack({
    provider,
    scenario_refs: scenarioRefs,
  })

  console.log('')
  console.log('Content Pack Validation')
  console.log(`  pack_id: ${resolvedPackId}`)
  console.log(`  manifest: ${options.manifestPath}`)
  console.log(`  content_root: ${options.contentRoot}`)
  console.log(`  scenarios_checked: ${validationReport.summary.scenarios_checked}`)
  console.log('')

  for (const scenario of validationReport.scenarios) {
    const status = scenario.valid ? 'PASS' : 'FAIL'
    console.log(`- ${status} ${scenario.scenario_ref.id}-v${scenario.scenario_ref.version}`)

    if (scenario.build_error) {
      console.log(`    build_error: ${scenario.build_error}`)
      continue
    }

    if (!scenario.valid) {
      for (const error of scenario.errors) {
        console.log(`    [${error.type}] ${error.message}`)
      }
    }
  }

  let totalAuditCritical = 0
  let totalAuditWarnings = 0

  if (options.withAudit) {
    console.log('')
    console.log(`Audit Check (${options.runs} runs/scenario)`)

    for (const scenarioRef of scenarioRefs) {
      if (!validationReport.scenarios.find(s => s.scenario_ref.id === scenarioRef.id && s.scenario_ref.version === scenarioRef.version)?.valid) {
        continue
      }

      const bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, provider)
      const simulationReport = simulate_runs({
        scenario_bundle: bundle,
        runs: options.runs,
        seed: 'content-pack-validation',
      })

      const auditReport = buildContentAuditReport({
        content_pack_id: resolvedPackId,
        scenario_bundle: bundle,
        simulation_report: simulationReport,
      })

      totalAuditCritical += auditReport.summary.critical_count
      totalAuditWarnings += auditReport.summary.warning_count

      console.log(
        `- ${scenarioRef.id}: critical=${auditReport.summary.critical_count}, warning=${auditReport.summary.warning_count}, status=${auditReport.summary.overall_status}`,
      )
    }
  }

  console.log('')
  console.log('Summary')
  console.log(`  valid_scenarios: ${validationReport.summary.valid_scenarios}`)
  console.log(`  invalid_scenarios: ${validationReport.summary.invalid_scenarios}`)

  if (options.withAudit) {
    console.log(`  audit_critical: ${totalAuditCritical}`)
    console.log(`  audit_warnings: ${totalAuditWarnings}`)
  }

  const structuralFailure = validationReport.summary.invalid_scenarios > 0
  const auditFailure = options.withAudit && options.failOnAuditCritical && totalAuditCritical > 0

  if (structuralFailure || auditFailure) {
    process.exit(1)
  }

  process.exit(0)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
