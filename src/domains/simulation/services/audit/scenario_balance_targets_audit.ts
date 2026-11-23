import type { BalanceTargets } from '@/domains/content/model'
import type { AuditFinding } from '../content_audit_contract'
import type { SimulationReport } from '../simulation_runner'

/**
 * Produces findings when scenario telemetry falls outside the scenario's own
 * balance targets (`balance_targets` in its content, journal M3.8). A
 * scenario without targets gets no target findings.
 */
export function auditScenarioBalanceTargets(
  report: SimulationReport,
  existingFindings: AuditFinding[],
  target: BalanceTargets | undefined,
): AuditFinding[] {
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

  for (const [stakeholderId, minSatisfaction] of Object.entries(target.min_avg_stakeholder_satisfaction ?? {})) {
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
