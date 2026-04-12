import type { SimulationReport } from '../simulation_runner'
import type { AuditFinding } from '../content_audit_contract'

// ── Thresholds ──────────────────────────────────────────────────
// These can be tightened as baseline data accumulates.

/** Decline rate above this fraction is flagged as a warning. */
const DECLINE_RATE_WARNING = 0.55

/** Decline rate above this fraction is flagged as critical. */
const DECLINE_RATE_CRITICAL = 0.70

/** Recovery rate below this fraction alongside a high decline rate is flagged. */
const RECOVERY_RATE_LOW = 0.20

/** Ratio of decline-to-recovery above this value is flagged as asymmetry. */
const ASYMMETRY_RATIO_WARNING = 3.0

/** Average final satisfaction below this value is flagged. */
const LOW_SATISFACTION_WARNING = 45

/** Average final satisfaction below this value is flagged as critical. */
const LOW_SATISFACTION_CRITICAL = 30

// ── Synthesis ───────────────────────────────────────────────────

export function auditStakeholderBalance(report: SimulationReport): AuditFinding[] {
  const findings: AuditFinding[] = []
  const agg = report.aggregate

  const recoveryRates = agg.stakeholder_recovery_rate ?? {}
  const declineRates = agg.stakeholder_decline_rate ?? {}
  const avgSatisfaction = agg.average_stakeholder_satisfaction ?? {}

  const stakeholderIds = new Set([
    ...Object.keys(recoveryRates),
    ...Object.keys(declineRates),
    ...Object.keys(avgSatisfaction),
  ])

  for (const sid of stakeholderIds) {
    const recovery = recoveryRates[sid] ?? 0
    const decline = declineRates[sid] ?? 0
    const satisfaction = avgSatisfaction[sid] ?? 100

    // High decline rate
    if (decline >= DECLINE_RATE_CRITICAL) {
      findings.push({
        id: `stakeholder_balance.high_decline_rate.critical.${sid}`,
        severity: 'critical',
        category: 'stakeholder_balance',
        title: `${sid}: very high decline rate`,
        description: `${sid} declines in ${(decline * 100).toFixed(1)}% of turns — stakeholders almost never improve.`,
        evidence: [
          `decline_rate = ${(decline * 100).toFixed(1)}%  (threshold: ${DECLINE_RATE_CRITICAL * 100}%)`,
          `recovery_rate = ${(recovery * 100).toFixed(1)}%`,
          `average_final_satisfaction = ${satisfaction.toFixed(1)}`,
        ],
        recommended_fix_surface: 'content',
      })
    } else if (decline >= DECLINE_RATE_WARNING) {
      findings.push({
        id: `stakeholder_balance.high_decline_rate.warning.${sid}`,
        severity: 'warning',
        category: 'stakeholder_balance',
        title: `${sid}: elevated decline rate`,
        description: `${sid} declines in ${(decline * 100).toFixed(1)}% of turns across ${report.total_runs} runs.`,
        evidence: [
          `decline_rate = ${(decline * 100).toFixed(1)}%  (threshold: ${DECLINE_RATE_WARNING * 100}%)`,
          `recovery_rate = ${(recovery * 100).toFixed(1)}%`,
        ],
        recommended_fix_surface: 'content',
      })
    }

    // Low recovery rate (only flag if decline is also elevated to avoid noise)
    if (recovery <= RECOVERY_RATE_LOW && decline >= DECLINE_RATE_WARNING) {
      findings.push({
        id: `stakeholder_balance.low_recovery_rate.${sid}`,
        severity: 'warning',
        category: 'stakeholder_balance',
        title: `${sid}: low recovery rate`,
        description: `${sid} recovers in only ${(recovery * 100).toFixed(1)}% of turns while declining frequently.`,
        evidence: [
          `recovery_rate = ${(recovery * 100).toFixed(1)}%  (threshold: ≤${RECOVERY_RATE_LOW * 100}%)`,
          `decline_rate = ${(decline * 100).toFixed(1)}%`,
        ],
        recommended_fix_surface: 'content',
      })
    }

    // Asymmetric decline-to-recovery ratio
    if (recovery > 0) {
      const ratio = decline / recovery
      if (ratio >= ASYMMETRY_RATIO_WARNING && decline >= DECLINE_RATE_WARNING) {
        findings.push({
          id: `stakeholder_balance.asymmetric_ratio.${sid}`,
          severity: 'warning',
          category: 'stakeholder_balance',
          title: `${sid}: asymmetric decline/recovery ratio`,
          description: `${sid} declines ${ratio.toFixed(1)}× more often than they recover.`,
          evidence: [
            `decline / recovery = ${(decline * 100).toFixed(1)}% / ${(recovery * 100).toFixed(1)}% = ${ratio.toFixed(2)}×`,
            `threshold: ≥${ASYMMETRY_RATIO_WARNING}×`,
          ],
          recommended_fix_surface: 'content',
        })
      }
    }

    // Low average final satisfaction
    if (satisfaction <= LOW_SATISFACTION_CRITICAL) {
      findings.push({
        id: `stakeholder_balance.low_satisfaction.critical.${sid}`,
        severity: 'critical',
        category: 'stakeholder_balance',
        title: `${sid}: critically low average satisfaction`,
        description: `${sid} ends at an average satisfaction of ${satisfaction.toFixed(1)} — consistently in the Critical band.`,
        evidence: [
          `average_final_satisfaction = ${satisfaction.toFixed(1)}  (threshold: ≤${LOW_SATISFACTION_CRITICAL})`,
        ],
        recommended_fix_surface: 'content',
      })
    } else if (satisfaction <= LOW_SATISFACTION_WARNING) {
      findings.push({
        id: `stakeholder_balance.low_satisfaction.warning.${sid}`,
        severity: 'warning',
        category: 'stakeholder_balance',
        title: `${sid}: low average satisfaction`,
        description: `${sid} ends at an average satisfaction of ${satisfaction.toFixed(1)} — frequently in the Concerned band.`,
        evidence: [
          `average_final_satisfaction = ${satisfaction.toFixed(1)}  (threshold: ≤${LOW_SATISFACTION_WARNING})`,
        ],
        recommended_fix_surface: 'content',
      })
    }
  }

  return findings
}
