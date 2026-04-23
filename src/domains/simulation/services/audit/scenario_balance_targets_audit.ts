import type { AuditFinding } from '../content_audit_contract'
import type { SimulationReport } from '../simulation_runner'

/**
 * Scenario-specific target envelope for balance audits.
 */
interface ScenarioBalanceTarget {
  win_rate_min: number
  win_rate_max: number
  max_critical_findings: number
  min_avg_stakeholder_satisfaction: Record<string, number>
}

export const SCENARIO_BALANCE_TARGETS: Record<string, ScenarioBalanceTarget> = {
  monolith_of_mild_despair: {
    win_rate_min: 0.45,
    win_rate_max: 0.70,
    max_critical_findings: 0,
    min_avg_stakeholder_satisfaction: {
      cto: 45,
      vp_product: 45,
      operations_manager: 45,
      lead_developer: 45,
    },
  },
  microservice_sprawl: {
    win_rate_min: 0.25,
    win_rate_max: 0.50,
    max_critical_findings: 0,
    min_avg_stakeholder_satisfaction: {
      cto: 35,
      operations_manager: 35,
      tech_lead: 45,
      lead_developer: 45,
    },
  },
  compliance_gauntlet: {
    win_rate_min: 0.40,
    win_rate_max: 0.65,
    max_critical_findings: 0,
    min_avg_stakeholder_satisfaction: {
      vp_product: 40,
      security_officer: 50,
      cto: 45,
      operations_manager: 45,
      tech_lead: 45,
    },
  },
  startup_hypergrowth: {
    win_rate_min: 0.35,
    win_rate_max: 0.60,
    max_critical_findings: 0,
    min_avg_stakeholder_satisfaction: {
      vp_product: 40,
      cto: 45,
      operations_manager: 40,
      cfo: 40,
      lead_developer: 45,
    },
  },
  merger_of_minor_chaos: {
    win_rate_min: 0.50,
    win_rate_max: 0.80,
    max_critical_findings: 0,
    min_avg_stakeholder_satisfaction: {
      cto: 40,
      vp_product: 45,
      lead_developer: 50,
      operations_manager: 60,
      integration_program_manager: 40,
    },
  },
}

function getScenarioTarget(scenarioId: string): ScenarioBalanceTarget | undefined {
  return SCENARIO_BALANCE_TARGETS[scenarioId]
}

/**
 * Produces findings when scenario telemetry falls outside configured targets.
 */
export function auditScenarioBalanceTargets(
  report: SimulationReport,
  existingFindings: AuditFinding[],
): AuditFinding[] {
  const target = getScenarioTarget(report.scenario_id)
  if (!target) {
    return []
  }

  const findings: AuditFinding[] = []
  const winRate = report.aggregate.win_rate

  if (winRate < target.win_rate_min) {
    findings.push({
      id: `scenario_target.win_rate_too_low.${report.scenario_id}`,
      severity: 'warning',
      category: 'scenario_difficulty',
      title: `${report.scenario_id}: win rate below target band`,
      description: `Observed win rate (${(winRate * 100).toFixed(1)}%) is below target minimum (${(target.win_rate_min * 100).toFixed(1)}%). Scenario may be too punishing.`,
      evidence: [
        `win_rate = ${(winRate * 100).toFixed(1)}%`,
        `target_min = ${(target.win_rate_min * 100).toFixed(1)}%`,
      ],
      recommended_fix_surface: 'content',
    })
  }

  if (winRate > target.win_rate_max) {
    findings.push({
      id: `scenario_target.win_rate_too_high.${report.scenario_id}`,
      severity: 'warning',
      category: 'scenario_difficulty',
      title: `${report.scenario_id}: win rate above target band`,
      description: `Observed win rate (${(winRate * 100).toFixed(1)}%) exceeds target maximum (${(target.win_rate_max * 100).toFixed(1)}%). Scenario may have become too easy.`,
      evidence: [
        `win_rate = ${(winRate * 100).toFixed(1)}%`,
        `target_max = ${(target.win_rate_max * 100).toFixed(1)}%`,
      ],
      recommended_fix_surface: 'content',
    })
  }

  const criticalCount = existingFindings.filter(f => f.severity === 'critical').length
  if (criticalCount > target.max_critical_findings) {
    findings.push({
      id: `scenario_target.critical_findings_exceeded.${report.scenario_id}`,
      severity: 'warning',
      category: 'scenario_difficulty',
      title: `${report.scenario_id}: critical finding count exceeds target`,
      description: `Critical findings (${criticalCount}) exceed configured target (${target.max_critical_findings}).`,
      evidence: [
        `critical_findings = ${criticalCount}`,
        `target_max_critical_findings = ${target.max_critical_findings}`,
      ],
      recommended_fix_surface: 'content',
    })
  }

  for (const [stakeholderId, minSatisfaction] of Object.entries(target.min_avg_stakeholder_satisfaction)) {
    const observed = report.aggregate.average_stakeholder_satisfaction[stakeholderId]
    if (observed === undefined) {
      continue
    }

    if (observed < minSatisfaction) {
      findings.push({
        id: `scenario_target.stakeholder_satisfaction_too_low.${report.scenario_id}.${stakeholderId}`,
        severity: 'warning',
        category: 'stakeholder_balance',
        title: `${report.scenario_id}: ${stakeholderId} satisfaction below floor`,
        description: `Average ${stakeholderId} satisfaction (${observed.toFixed(1)}) is below configured minimum (${minSatisfaction}).`,
        evidence: [
          `average_stakeholder_satisfaction[${stakeholderId}] = ${observed.toFixed(1)}`,
          `target_min = ${minSatisfaction}`,
        ],
        recommended_fix_surface: 'content',
      })
    }
  }

  return findings
}
