import type { AuditFinding } from '../content_audit_contract'
import type { SimulationReport } from '../simulation_runner'

/**
 * Oracle win-rate gap that indicates the catalog can recover when the legal
 * hand cannot. Info-only: this is not the pass gate.
 */
export const CATALOG_ONLY_RECOVERY_WIN_RATE_GAP = 0.15

/**
 * Compares player-true telemetry to a full-pool oracle. A large oracle-only
 * win-rate gap is an author signal that a rescue lives in the catalog, not a
 * reason to reopen the satchel or fail the audit gate.
 */
export function auditCatalogOnlyRecovery(
  playerTrueReport: SimulationReport,
  oracleReport: SimulationReport
): AuditFinding[] {
  const playerWinRate = playerTrueReport.aggregate.win_rate
  const oracleWinRate = oracleReport.aggregate.win_rate
  const gap = oracleWinRate - playerWinRate

  if (gap < CATALOG_ONLY_RECOVERY_WIN_RATE_GAP) {
    return []
  }

  const scenarioId = playerTrueReport.scenario_id

  return [
    {
      id: `card_ecosystem.catalog_only_recovery.${scenarioId}`,
      severity: 'info',
      category: 'card_ecosystem',
      title: `${scenarioId}: catalog-only recovery vs the legal hand`,
      description:
        `The full-pool oracle wins ${(gap * 100).toFixed(1)} percentage points more often ` +
        `than the player-true hand bot. A rescue may exist in the catalog that a six-card ` +
        `hand plus Consult the Archives cannot reach. That is an author signal, not a reason ` +
        `to make the satchel legal again.`,
      evidence: [
        `player_true_win_rate = ${(playerWinRate * 100).toFixed(1)}%`,
        `oracle_win_rate = ${(oracleWinRate * 100).toFixed(1)}%`,
        `gap = ${(gap * 100).toFixed(1)}%`,
        `threshold = ${(CATALOG_ONLY_RECOVERY_WIN_RATE_GAP * 100).toFixed(1)}%`,
      ],
      recommended_fix_surface: 'content',
    },
  ]
}
