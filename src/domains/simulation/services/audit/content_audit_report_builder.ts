import type { ScenarioBundle } from '@/domains/content/model/scenario_bundle'
import type {
  AuditFinding,
  AuditSummary,
  ContentAuditReport,
  StructuralAuditCheck,
} from '../content_audit_contract'
import type { SimulationReport } from '../simulation_runner'
import { auditStakeholderBalance } from './stakeholder_balance_audit'
import { auditStructuralContent } from './structural_content_audit'
import { auditScenarioBalanceTargets } from './scenario_balance_targets_audit'

interface BuildContentAuditReportInput {
  content_pack_id?: string
  scenario_bundle: ScenarioBundle
  simulation_report: SimulationReport
}

const SEVERITY_WEIGHT = {
  critical: 3,
  warning: 2,
  info: 1,
} as const

function sortFindings(findings: AuditFinding[]): AuditFinding[] {
  return [...findings].sort((a, b) => {
    const severityDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]
    if (severityDiff !== 0) {
      return severityDiff
    }
    return a.id.localeCompare(b.id)
  })
}

function computeSummary(findings: AuditFinding[]): AuditSummary {
  const summary: AuditSummary = {
    overall_status: 'pass',
    info_count: 0,
    warning_count: 0,
    critical_count: 0,
  }

  for (const finding of findings) {
    if (finding.severity === 'info') summary.info_count += 1
    if (finding.severity === 'warning') summary.warning_count += 1
    if (finding.severity === 'critical') summary.critical_count += 1
  }

  if (summary.critical_count > 0) {
    summary.overall_status = 'critical'
  } else if (summary.warning_count > 0) {
    summary.overall_status = 'warning'
  }

  return summary
}

function toStructuralChecks(structuralFindings: AuditFinding[]): StructuralAuditCheck[] {
  if (structuralFindings.length === 0) {
    return [
      {
        id: 'structural.pass.no_findings',
        status: 'pass',
        description: 'No structural content findings detected.',
      },
    ]
  }

  return structuralFindings.map((finding) => ({
    id: finding.id,
    status: finding.severity === 'critical' ? 'critical' : 'warning',
    description: finding.description,
    evidence: finding.evidence,
  }))
}

export function buildContentAuditReport(input: BuildContentAuditReportInput): ContentAuditReport {
  const structuralFindings = auditStructuralContent(input.scenario_bundle)
  const dynamicFindings = auditStakeholderBalance(input.simulation_report)
  const preliminaryFindings = [...structuralFindings, ...dynamicFindings]
  const scenarioTargetFindings = auditScenarioBalanceTargets(
    input.simulation_report,
    preliminaryFindings,
  )

  const findings = sortFindings([...preliminaryFindings, ...scenarioTargetFindings])

  return {
    content_pack_id: input.content_pack_id ?? 'core',
    scenario_id: input.simulation_report.scenario_id,
    scenario_version: input.simulation_report.scenario_version,
    structural_checks: {
      checks: toStructuralChecks(structuralFindings),
    },
    dynamic_metrics: {
      simulation_report: input.simulation_report,
    },
    findings,
    summary: computeSummary(findings),
  }
}
