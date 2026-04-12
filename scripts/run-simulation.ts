/**
 * Simulation Runner CLI
 *
 * Runs automated gameplay simulations and prints telemetry to stdout.
 *
 * Usage:
 *   npm run simulate -- --scenario monolith_of_mild_despair --runs 100 --seed test
 *
 * Options:
 *   --scenario <id>   Scenario ID (required)
 *   --runs <n>        Number of runs (default: 50)
 *   --seed <string>   Base seed for determinism (default: "default-seed")
 *   --json            Output raw JSON instead of formatted summary
 *   --per-run         Include per-run detail in JSON output
 *   --audit           Include content audit synthesis output
 *   --list            List available scenarios and exit
 */

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Resolve project paths ───────────────────────────────────────

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const contentRoot = path.resolve(projectRoot, 'content')

// ── Inline file-based content provider ──────────────────────────
// The production ContentProvider uses fetch (browser). This script
// needs a Node fs-based equivalent. We build one here to avoid
// coupling the simulation domain to Node APIs.

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

// Dynamic import so tsx resolves the @/ aliases via tsconfig paths
// When that doesn't work, we fall back to relative imports.
const contentModel = await import('../src/domains/content/model/index.js')
const { buildScenarioBundle } = await import('../src/domains/content/services/bundle_builder.js')
const { simulate_runs } = await import('../src/domains/simulation/services/simulation_runner.js')

type ContentProvider = {
  loadScenario: (ref: VersionRef) => Promise<any>
  loadScore: (ref: VersionRef) => Promise<any>
  loadStakeholder: (ref: VersionRef) => Promise<any>
  loadStakeholderReactionRule: (ref: VersionRef) => Promise<any>
  loadCard: (ref: VersionRef) => Promise<any>
  loadEvent: (ref: VersionRef) => Promise<any>
  loadDelayedEffect: (ref: VersionRef) => Promise<any>
  loadOutcomeTier: (ref: VersionRef) => Promise<any>
  loadOutcomeArchetype: (ref: VersionRef) => Promise<any>
  loadPlayerClass: (ref: VersionRef) => Promise<any>
}

function createFileContentProvider(): ContentProvider {
  return {
    loadScenario: (ref) => loadJson('scenarios', ref),
    loadScore: (ref) => loadJson('scores', ref),
    loadStakeholder: (ref) => loadJson('stakeholders', ref),
    loadStakeholderReactionRule: (ref) => loadJson('stakeholder-reaction-rules', ref),
    loadCard: (ref) => loadJson('cards', ref),
    loadEvent: (ref) => loadJson('events', ref),
    loadDelayedEffect: (ref) => loadJson('delayed-effects', ref),
    loadOutcomeTier: (ref) => loadJson('outcome-tiers', ref),
    loadOutcomeArchetype: (ref) => loadJson('outcome-archetypes', ref),
    loadPlayerClass: (ref) => loadJson('classes', ref)
  }
}

// ── CLI argument parsing ────────────────────────────────────────

function parseArgs(argv: string[]) {
  const args = argv.slice(2)
  const opts: Record<string, string | boolean> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--list') {
      opts.list = true
    } else if (arg === '--json') {
      opts.json = true
    } else if (arg === '--per-run') {
      opts.perRun = true
    } else if (arg === '--audit') {
      opts.audit = true
    } else if (arg === '--scenario' && args[i + 1]) {
      opts.scenario = args[++i]
    } else if (arg === '--runs' && args[i + 1]) {
      opts.runs = args[++i]
    } else if (arg === '--seed' && args[i + 1]) {
      opts.seed = args[++i]
    }
  }

  return opts
}

// ── List available scenarios ────────────────────────────────────

async function listScenarios(): Promise<string[]> {
  const files = await readdir(path.join(contentRoot, 'scenarios'))
  return files
    .filter((f) => f.endsWith('.json') && !f.startsWith('test_'))
    .map((f) => f.replace(/-v\d+\.json$/, ''))
    .sort()
}

// ── Formatted output ────────────────────────────────────────────

function printFormattedReport(report: any) {
  const agg = report.aggregate

  console.log('')
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║          DDDnD Simulation Telemetry Report          ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`  Scenario:   ${report.scenario_id} v${report.scenario_version}`)
  console.log(`  Runs:       ${report.total_runs}`)
  console.log(`  Base seed:  ${report.base_seed}`)
  console.log('')

  // Outcome distribution
  console.log('── Outcomes ────────────────────────────────────────────')
  console.log(`  Win rate:        ${(agg.win_rate * 100).toFixed(1)}%`)
  console.log(`  Avg turns:       ${agg.average_turns_completed.toFixed(1)}`)
  console.log('')
  for (const [tier, count] of Object.entries(agg.outcome_distribution)) {
    const pct = (((count as number) / report.total_runs) * 100).toFixed(1)
    console.log(`  ${tier.padEnd(20)} ${String(count).padStart(4)}  (${pct}%)`)
  }

  // Average scores
  console.log('')
  console.log('── Average Final Scores ────────────────────────────────')
  for (const [scoreId, value] of Object.entries(agg.average_scores)) {
    console.log(`  ${scoreId.padEnd(24)} ${(value as number).toFixed(1)}`)
  }

  // Average stakeholder satisfaction
  console.log('')
  console.log('── Average Stakeholder Satisfaction ────────────────────')
  for (const [id, value] of Object.entries(agg.average_stakeholder_satisfaction)) {
    console.log(`  ${id.padEnd(24)} ${(value as number).toFixed(1)}`)
  }

  // Card usage
  console.log('')
  console.log('── Card Usage (total across all runs) ──────────────────')
  const sortedCards = Object.entries(agg.card_usage).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  )
  for (const [cardId, count] of sortedCards) {
    console.log(`  ${cardId.padEnd(40)} ${String(count).padStart(4)}`)
  }

  // Event frequency
  console.log('')
  console.log('── Event Frequency ─────────────────────────────────────')
  const sortedEvents = Object.entries(agg.event_frequency).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  )
  for (const [eventId, count] of sortedEvents) {
    console.log(`  ${eventId.padEnd(40)} ${String(count).padStart(4)}`)
  }

  // Reaction frequency
  if (Object.keys(agg.reaction_frequency).length > 0) {
    console.log('')
    console.log('── Reaction Frequency ──────────────────────────────────')
    const sortedReactions = Object.entries(agg.reaction_frequency).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )
    for (const [reactionId, count] of sortedReactions) {
      console.log(`  ${reactionId.padEnd(40)} ${String(count).padStart(4)}`)
    }
  }

  // Archetype distribution
  if (Object.keys(agg.archetype_distribution).length > 0) {
    console.log('')
    console.log('── Archetype Distribution ──────────────────────────────')
    for (const [arch, count] of Object.entries(agg.archetype_distribution)) {
      const pct = (((count as number) / report.total_runs) * 100).toFixed(1)
      console.log(`  ${arch.padEnd(28)} ${String(count).padStart(4)}  (${pct}%)`)
    }
  }

  // Opening card frequency (strategy fingerprint)
  if (Object.keys(agg.opening_card_frequency).length > 0) {
    console.log('')
    console.log('── Opening Card Frequency ──────────────────────────────')
    const sortedOpening = Object.entries(agg.opening_card_frequency).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )
    for (const [cardId, count] of sortedOpening) {
      const pct = (((count as number) / report.total_runs) * 100).toFixed(1)
      console.log(`  ${cardId.padEnd(40)} ${String(count).padStart(4)}  (${pct}%)`)
    }
  }

  // Opening sequence frequency (strategy fingerprint)
  if (Object.keys(agg.opening_sequence_frequency).length > 0) {
    console.log('')
    console.log('── Opening Sequence Frequency (top 15) ─────────────────')
    const sortedSeqs = Object.entries(agg.opening_sequence_frequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
    for (const [seq, count] of sortedSeqs) {
      const pct = (((count as number) / report.total_runs) * 100).toFixed(1)
      console.log(`  ${seq.padEnd(60)} ${String(count).padStart(4)}  (${pct}%)`)
    }
  }

  // Average score by turn (strategy fingerprint)
  if (Object.keys(agg.average_score_by_turn).length > 0) {
    console.log('')
    console.log('── Average Score by Turn ───────────────────────────────')
    const scoreIds = Object.keys(agg.average_score_by_turn).sort()
    const maxTurns = Math.max(...Object.values(agg.average_score_by_turn).map((t) => t.length))

    // Header row
    const turnHeaders = Array.from({ length: maxTurns }, (_, i) => `T${i + 1}`.padStart(6)).join('')
    console.log(`  ${'Score'.padEnd(24)} ${turnHeaders}`)

    for (const scoreId of scoreIds) {
      const values = agg.average_score_by_turn[scoreId]
      const valueStr = values.map((v) => v.toFixed(1).padStart(6)).join('')
      console.log(`  ${scoreId.padEnd(24)} ${valueStr}`)
    }
  }

  // Winning card pairs (strategy fingerprint)
  if (Object.keys(agg.winning_card_pairs).length > 0) {
    console.log('')
    console.log('── Winning Card Pairs (top 15) ─────────────────────────')
    const sortedPairs = Object.entries(agg.winning_card_pairs)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
    const successCount = Object.values(agg.outcome_distribution).reduce(
      (sum, v) => sum + (v as number), 0
    )
    for (const [pair, count] of sortedPairs) {
      const pct = successCount > 0
        ? (((count as number) / (agg.outcome_distribution['success'] ?? 1)) * 100).toFixed(1)
        : '0.0'
      console.log(`  ${pair.padEnd(50)} ${String(count).padStart(4)}  (${pct}%)`)
    }
  }

  // Successful low-score rates (strategy fingerprint)
  if (Object.keys(agg.successful_low_score_rates).length > 0) {
    console.log('')
    console.log('── Successful Low-Score Rates ──────────────────────────')
    for (const [label, rate] of Object.entries(agg.successful_low_score_rates)) {
      console.log(`  ${label.padEnd(40)} ${((rate as number) * 100).toFixed(1)}%`)
    }
  }

  // Stakeholder trajectory by turn (phase 1 telemetry)
  if (agg.average_stakeholder_satisfaction_by_turn && Object.keys(agg.average_stakeholder_satisfaction_by_turn).length > 0) {
    console.log('')
    console.log('── Avg Stakeholder Satisfaction by Turn ────────────────')
    const stakeholderIds = Object.keys(agg.average_stakeholder_satisfaction_by_turn).sort()
    const maxTurns = Math.max(
      ...Object.values(agg.average_stakeholder_satisfaction_by_turn as Record<string, number[]>).map((t) => t.length)
    )
    const turnHeaders = Array.from({ length: maxTurns }, (_, i) => `T${i + 1}`.padStart(6)).join('')
    console.log(`  ${'Stakeholder'.padEnd(24)} ${turnHeaders}`)
    for (const sid of stakeholderIds) {
      const values = (agg.average_stakeholder_satisfaction_by_turn as Record<string, number[]>)[sid]
      const valueStr = values.map((v) => v.toFixed(1).padStart(6)).join('')
      console.log(`  ${sid.padEnd(24)} ${valueStr}`)
    }
  }

  // Stakeholder balance rates (phase 1 telemetry)
  const hasRecovery = agg.stakeholder_recovery_rate && Object.keys(agg.stakeholder_recovery_rate).length > 0
  const hasDecline = agg.stakeholder_decline_rate && Object.keys(agg.stakeholder_decline_rate).length > 0
  const hasRuleTrigger = agg.rule_trigger_rate_by_stakeholder && Object.keys(agg.rule_trigger_rate_by_stakeholder).length > 0

  if (hasRecovery || hasDecline || hasRuleTrigger) {
    console.log('')
    console.log('── Stakeholder Balance Rates ───────────────────────────')
    console.log(`  ${'Stakeholder'.padEnd(24)} ${'Recovery'.padStart(10)} ${'Decline'.padStart(10)} ${'Rule Hits'.padStart(10)}`)

    const allStakeholderIds = new Set([
      ...Object.keys(agg.stakeholder_recovery_rate ?? {}),
      ...Object.keys(agg.stakeholder_decline_rate ?? {}),
      ...Object.keys(agg.rule_trigger_rate_by_stakeholder ?? {}),
    ])

    for (const sid of [...allStakeholderIds].sort()) {
      const recovery = ((agg.stakeholder_recovery_rate?.[sid] ?? 0) * 100).toFixed(1) + '%'
      const decline = ((agg.stakeholder_decline_rate?.[sid] ?? 0) * 100).toFixed(1) + '%'
      const stakeholderRuleRates = agg.rule_trigger_rate_by_stakeholder?.[sid] ?? {}
      const totalRuleRate = typeof stakeholderRuleRates === 'number'
        ? stakeholderRuleRates
        : Object.values(stakeholderRuleRates).reduce((sum, value) => sum + Number(value), 0)
      const ruleHits = (totalRuleRate * 100).toFixed(1) + '%'
      console.log(`  ${sid.padEnd(24)} ${recovery.padStart(10)} ${decline.padStart(10)} ${ruleHits.padStart(10)}`)
    }
  }

  console.log('')
}

function printFormattedAudit(auditReport: any) {
  const summary = auditReport.summary

  console.log('── Content Audit Summary ────────────────────────────────')
  console.log(`  Content pack: ${auditReport.content_pack_id}`)
  console.log(`  Scenario:     ${auditReport.scenario_id} v${auditReport.scenario_version}`)
  console.log(`  Overall:      ${summary.overall_status.toUpperCase()}`)
  console.log(`  Findings:     ${auditReport.findings.length}`)
  console.log(`  Critical:     ${summary.critical_count}`)
  console.log(`  Warning:      ${summary.warning_count}`)
  console.log(`  Info:         ${summary.info_count}`)

  if (auditReport.findings.length > 0) {
    console.log('')
    console.log('── Top Findings (first 15) ─────────────────────────────')
    for (const finding of auditReport.findings.slice(0, 15)) {
      console.log(`  [${finding.severity.toUpperCase()}] ${finding.id}`)
      console.log(`    ${finding.title}`)
      console.log(`    ${finding.description}`)
      if (finding.evidence?.length > 0) {
        console.log(`    Evidence: ${finding.evidence[0]}`)
      }
    }
  }

  console.log('')
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv)

  // --list
  if (opts.list) {
    const scenarios = await listScenarios()
    console.log('Available scenarios:')
    for (const s of scenarios) {
      console.log(`  - ${s}`)
    }
    process.exit(0)
  }

  // Validate --scenario
  if (!opts.scenario) {
    const scenarios = await listScenarios()
    console.error('Error: --scenario is required.\n')
    console.error('Available scenarios:')
    for (const s of scenarios) {
      console.error(`  - ${s}`)
    }
    console.error('\nUsage: npm run simulate -- --scenario <id> [--runs N] [--seed S] [--json] [--per-run] [--audit]')
    process.exit(1)
  }

  const scenarioId = opts.scenario as string
  const runs = opts.runs ? parseInt(opts.runs as string, 10) : 50
  const seed = (opts.seed as string) ?? 'default-seed'

  if (isNaN(runs) || runs < 1) {
    console.error('Error: --runs must be a positive integer')
    process.exit(1)
  }

  // Build scenario bundle
  const provider = createFileContentProvider()
  let bundle: any
  try {
    bundle = await buildScenarioBundle(scenarioId, 1, provider)
  } catch (err: any) {
    console.error(`Error loading scenario "${scenarioId}":`, err.message)
    process.exit(1)
  }

  // Run simulation
  console.log(`Running ${runs} simulations for "${scenarioId}" with seed "${seed}"...`)
  const startTime = performance.now()
  const report = simulate_runs({ scenario_bundle: bundle, runs, seed })
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
  console.log(`Completed in ${elapsed}s`)

  let auditReport: any | null = null
  if (opts.audit) {
    const { buildContentAuditReport } = await import('../src/domains/simulation/services/audit/content_audit_report_builder.js')
    auditReport = buildContentAuditReport({
      content_pack_id: 'core',
      scenario_bundle: bundle,
      simulation_report: report,
    })
  }

  // Output
  if (opts.json) {
    const output = opts.perRun ? report : { ...report, per_run: `[${report.per_run.length} runs omitted — use --per-run to include]` }
    if (auditReport) {
      const auditOutput = opts.perRun
        ? auditReport
        : {
            ...auditReport,
            dynamic_metrics: {
              ...auditReport.dynamic_metrics,
              simulation_report: {
                ...auditReport.dynamic_metrics.simulation_report,
                per_run: `[${report.per_run.length} runs omitted — use --per-run to include]`,
              },
            },
          }
      console.log(JSON.stringify({ simulation: output, audit: auditOutput }, null, 2))
    } else {
      console.log(JSON.stringify(output, null, 2))
    }
  } else {
    printFormattedReport(report)
    if (auditReport) {
      printFormattedAudit(auditReport)
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
