/**
 * Content Audit Gate
 *
 * Runs the full content audit across all production scenarios and exits non-zero
 * if any scenario has critical-severity findings. Intended for use in CI to block
 * merges that introduce content balance regressions.
 *
 * Usage:
 *   npm run audit:gate
 *   npm run audit:gate -- --runs 100   (override simulation run count)
 */

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const contentRoot = path.resolve(projectRoot, 'content')

// ── Node fs-based content provider (mirrors run-simulation.ts) ───

interface VersionRef {
  id: string
  version: number
}

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

// ── List production scenarios ────────────────────────────────────

async function listProductionScenarios(): Promise<string[]> {
  const files = await readdir(path.join(contentRoot, 'scenarios'))
  return files
    .filter((f) => f.endsWith('.json') && !f.startsWith('test_'))
    .map((f) => f.replace(/-v\d+\.json$/, ''))
    .sort()
}

// ── Severity indicator ───────────────────────────────────────────

const SEVERITY_ICON: Record<string, string> = {
  critical: '✗',
  warning: '△',
  info: '·',
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const runsArg = args.indexOf('--runs')
  const runs = runsArg !== -1 ? parseInt(args[runsArg + 1], 10) : 50

  if (isNaN(runs) || runs < 1) {
    console.error('Error: --runs must be a positive integer')
    process.exit(1)
  }

  const { buildScenarioBundle } = await import('../src/domains/content/services/bundle_builder.js')
  const { simulate_runs } = await import('../src/domains/simulation/services/simulation_runner.js')
  const { buildContentAuditReport } = await import('../src/domains/simulation/services/audit/content_audit_report_builder.js')

  const scenarios = await listProductionScenarios()
  const provider = createFileContentProvider()

  console.log('')
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║              DDDnD Content Audit Gate               ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log(`  Scenarios: ${scenarios.join(', ')}`)
  console.log(`  Runs/scenario: ${runs}`)
  console.log('')

  let totalCritical = 0
  let totalWarnings = 0

  for (const scenarioId of scenarios) {
    process.stdout.write(`  Auditing ${scenarioId}...`)

    let bundle: any
    try {
      bundle = await buildScenarioBundle(scenarioId, 1, provider)
    } catch (err: any) {
      console.log(` FAILED`)
      console.error(`    Error loading bundle: ${err.message}`)
      totalCritical++
      continue
    }

    const report = simulate_runs({ scenario_bundle: bundle, runs, seed: 'audit-gate' })
    const auditReport = buildContentAuditReport({
      content_pack_id: 'core',
      scenario_bundle: bundle,
      simulation_report: report,
    })

    const { summary, findings } = auditReport
    const statusIcon = summary.overall_status === 'pass' ? '✓' : summary.overall_status === 'warn' ? '△' : '✗'

    console.log(` ${statusIcon} ${summary.overall_status.toUpperCase()}  (critical: ${summary.critical_count}, warning: ${summary.warning_count}, info: ${summary.info_count})`)

    if (findings.length > 0) {
      for (const finding of findings) {
        const icon = SEVERITY_ICON[finding.severity] ?? '·'
        console.log(`      [${icon}] ${finding.id}`)
        console.log(`          ${finding.title}`)
        if (finding.evidence?.length > 0) {
          console.log(`          ${finding.evidence[0]}`)
        }
      }
      console.log('')
    }

    totalCritical += summary.critical_count
    totalWarnings += summary.warning_count
  }

  console.log('── Summary ─────────────────────────────────────────────')
  console.log(`  Scenarios audited: ${scenarios.length}`)
  console.log(`  Total critical:    ${totalCritical}`)
  console.log(`  Total warnings:    ${totalWarnings}`)
  console.log('')

  if (totalCritical > 0) {
    console.error(`✗ Audit gate FAILED — ${totalCritical} critical finding(s) must be resolved before merge.`)
    process.exit(1)
  } else if (totalWarnings > 0) {
    console.log(`△ Audit gate PASSED with warnings — ${totalWarnings} warning(s) noted.`)
    process.exit(0)
  } else {
    console.log('✓ Audit gate PASSED — no critical or warning findings.')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
