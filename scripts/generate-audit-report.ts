import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface VersionRef {
  id: string
  version: number
}

interface Manifest {
  id: string
  version: string
  scenarios: VersionRef[]
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2)
  const opts: Record<string, string | boolean> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--runs' && args[i + 1]) {
      opts.runs = args[++i]
    } else if (arg === '--seed' && args[i + 1]) {
      opts.seed = args[++i]
    } else if (arg === '--per-run') {
      opts.perRun = true
    }
  }

  return opts
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const contentRoot = path.resolve(projectRoot, 'content')
const outputDir = path.resolve(projectRoot, 'docs-site/public/data')

async function loadJson<T extends { id: string; version: number }>(
  directory: string,
  ref: VersionRef
): Promise<T> {
  const filename = `${ref.id}-v${ref.version}.json`
  const filePath = path.join(contentRoot, directory, filename)
  const raw = await readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as T

  if (parsed.id !== ref.id || parsed.version !== ref.version) {
    throw new Error(
      `Version mismatch in ${filename}: expected ${ref.id} v${ref.version}, got ${parsed.id} v${parsed.version}`
    )
  }

  return parsed
}

function createFileContentProvider() {
  return {
    loadScenario: (ref: VersionRef) => loadJson('scenarios', ref),
    loadScore: (ref: VersionRef) => loadJson('scores', ref),
    loadStakeholder: (ref: VersionRef) => loadJson('stakeholders', ref),
    loadStakeholderReactionRule: (ref: VersionRef) => loadJson('stakeholder-reaction-rules', ref),
    loadCard: (ref: VersionRef) => loadJson('cards', ref),
    loadEvent: (ref: VersionRef) => loadJson('events', ref),
    loadDelayedEffect: (ref: VersionRef) => loadJson('delayed-effects', ref),
    loadOutcomeTier: (ref: VersionRef) => loadJson('outcome-tiers', ref),
    loadOutcomeArchetype: (ref: VersionRef) => loadJson('outcome-archetypes', ref),
    loadPlayerClass: (ref: VersionRef) => loadJson('classes', ref),
  }
}

function omitPerRun(simulationReport: any) {
  return {
    ...simulationReport,
    per_run: `[${simulationReport.per_run.length} runs omitted — use --per-run to include]`,
  }
}

function maybeOmitPerRun(auditReport: any) {
  return {
    ...auditReport,
    dynamic_metrics: {
      ...auditReport.dynamic_metrics,
      simulation_report: omitPerRun(auditReport.dynamic_metrics.simulation_report),
    },
  }
}

async function main() {
  const opts = parseArgs(process.argv)
  const runCount = Number(opts.runs ?? process.env.AUDIT_RUNS ?? 100)
  const seed = String(opts.seed ?? process.env.AUDIT_SEED ?? 'pages-build')
  const includePerRun = Boolean(opts.perRun)

  if (!Number.isInteger(runCount) || runCount < 1) {
    throw new Error('--runs (or AUDIT_RUNS) must be a positive integer')
  }

  const manifestRaw = await readFile(path.join(contentRoot, 'manifest.json'), 'utf8')
  const manifest = JSON.parse(manifestRaw) as Manifest

  const { buildScenarioBundle } = await import('../src/domains/content/services/bundle_builder.js')
  const { simulate_runs } = await import('../src/domains/simulation/services/simulation_runner.js')
  const { buildContentAuditReport } = await import(
    '../src/domains/simulation/services/audit/content_audit_report_builder.js'
  )

  const provider = createFileContentProvider()
  const scenarioReports: Record<string, any> = {}

  for (const scenarioRef of manifest.scenarios) {
    const scenarioId = scenarioRef.id
    process.stdout.write(`Generating audit report for ${scenarioId}...`)

    const bundle = await buildScenarioBundle(scenarioRef.id, scenarioRef.version, provider)
    const simulationReport = simulate_runs({
      scenario_bundle: bundle,
      runs: runCount,
      seed,
    })

    const auditReport = buildContentAuditReport({
      content_pack_id: manifest.id,
      scenario_bundle: bundle,
      simulation_report: simulationReport,
    })

    const simulation = includePerRun ? simulationReport : omitPerRun(simulationReport)
    const audit = includePerRun ? auditReport : maybeOmitPerRun(auditReport)

    scenarioReports[scenarioId] = {
      scenario_id: scenarioRef.id,
      scenario_version: scenarioRef.version,
      simulation,
      audit,
    }

    console.log(' done')
  }

  const output = {
    meta: {
      generated_at: new Date().toISOString(),
      content_pack_id: manifest.id,
      content_pack_version: manifest.version,
      run_count: runCount,
      seed,
      per_run_included: includePerRun,
      scenario_count: manifest.scenarios.length,
      commit_sha: process.env.COMMIT_SHA ?? null,
      generator: 'scripts/generate-audit-report.ts',
    },
    scenarios: scenarioReports,
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(path.join(outputDir, 'audit-report.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`Wrote ${path.join(outputDir, 'audit-report.json')}`)
}

main().catch((error) => {
  console.error('Failed to generate audit report:', error)
  process.exit(1)
})
