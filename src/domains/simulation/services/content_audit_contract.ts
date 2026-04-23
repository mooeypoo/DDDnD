import type { SimulationReport } from './simulation_runner'

/**
 * Severity levels for audit findings.
 */
export type AuditFindingSeverity = 'info' | 'warning' | 'critical'

/**
 * Taxonomy for audit finding categorization.
 */
export type AuditFindingCategory =
  | 'scenario_difficulty'
  | 'score_balance'
  | 'stakeholder_balance'
  | 'event_fairness'
  | 'card_ecosystem'
  | 'aftershock_fairness'
  | 'ui_explainability'
  | 'content_completeness'

/**
 * Primary area where a finding should be addressed.
 */
export type AuditFixSurface = 'content' | 'simulation' | 'runner' | 'ui' | 'docs'

export interface StructuralAuditCheck {
  id: string
  status: 'pass' | 'warning' | 'critical'
  description: string
  evidence?: string[]
}

export interface StructuralAuditSection {
  checks: StructuralAuditCheck[]
}

/**
 * Dynamic audit data is expected to be derived from the canonical simulation
 * telemetry report rather than from a second execution path.
 */
export interface DynamicAuditSection {
  simulation_report: SimulationReport
}

export interface AuditFinding {
  id: string
  severity: AuditFindingSeverity
  category: AuditFindingCategory
  title: string
  description: string
  evidence: string[]
  recommended_fix_surface: AuditFixSurface
}

/**
 * Summary counters for final audit status.
 */
export interface AuditSummary {
  overall_status: 'pass' | 'warning' | 'critical'
  info_count: number
  warning_count: number
  critical_count: number
}

/**
 * Full content audit report combining structural and telemetry-derived findings.
 */
export interface ContentAuditReport {
  content_pack_id: string
  scenario_id: string
  scenario_version: number
  structural_checks: StructuralAuditSection
  dynamic_metrics: DynamicAuditSection
  findings: AuditFinding[]
  summary: AuditSummary
}
