import type { Card } from '@/domains/content/model'

const makeRef = (id: string, version = 1) => ({ id, version })

export const cardMocks: Record<string, Card> = {
  safeIncrementalChange: {
    id: 'safe_incremental_change',
    version: 1,
    name: 'Safe Incremental Change',
    description: 'Ship a narrow bounded-context seam and reduce risk through careful rollout.',
    flavor_text: 'Small steps, clean seams, fewer surprises in production.',
    score_changes: [
      { score_id: 'maintainability', delta: 6 },
      { score_id: 'delivery_confidence', delta: 3 },
      { score_id: 'budget', delta: -2 }
    ],
    delayed_effect_refs: [],
    style_tags: ['incremental', 'safe', 'boundary']
  },
  riskyRefactor: {
    id: 'risky_refactor',
    version: 1,
    name: 'Risky Deep Refactor',
    description: 'Rework key internals quickly to erase years of accidental coupling.',
    flavor_text: 'Bold surgery might heal the system—or pause delivery for weeks.',
    score_changes: [
      { score_id: 'domain_clarity', delta: 10 },
      { score_id: 'maintainability', delta: 8 },
      { score_id: 'delivery_confidence', delta: -9 },
      { score_id: 'team_morale', delta: -3 }
    ],
    stakeholder_changes: [
      { stakeholder_id: 'vp_product', delta: -5 },
      { stakeholder_id: 'lead_engineer', delta: 6 }
    ],
    delayed_effect_refs: [makeRef('refactoring_payoff'), makeRef('integration_complexity_emerges')],
    style_tags: ['refactor', 'high-impact']
  },
  moraleBoostingAction: {
    id: 'morale_boosting_action',
    version: 1,
    name: 'Architecture Workshop Sprint',
    description: 'Align teams on language and ownership with a focused cross-team workshop.',
    flavor_text: 'Shared language turns meetings into decisions instead of debates.',
    score_changes: [
      { score_id: 'domain_clarity', delta: 5 },
      { score_id: 'team_morale', delta: 7 }
    ],
    stakeholder_changes: [
      { stakeholder_id: 'leadership_team', delta: 2 },
      { stakeholder_id: 'product_team', delta: 1 }
    ],
    delayed_effect_refs: [makeRef('team_energized')],
    style_tags: ['team', 'alignment']
  },
  budgetCuttingFix: {
    id: 'budget_cutting_short_term_fix',
    version: 1,
    name: 'Budget-Cutting Patch',
    description: 'Delay cleanup and reduce spend this quarter to hit immediate targets.',
    flavor_text: 'It buys time now, but tomorrow will invoice the interest.',
    score_changes: [
      { score_id: 'budget', delta: 8 },
      { score_id: 'maintainability', delta: -6 },
      { score_id: 'user_trust', delta: -4 }
    ],
    stakeholder_changes: [
      { stakeholder_id: 'finance_team', delta: 6 },
      { stakeholder_id: 'operations_team', delta: -4 }
    ],
    delayed_effect_refs: [makeRef('technical_debt_accumulates')],
    style_tags: ['short-term', 'cost-control']
  },
  infrastructureMove: {
    id: 'high_impact_infrastructure_move',
    version: 1,
    name: 'High-Impact Infrastructure Move',
    description: 'Migrate critical workloads to improve reliability and incident recovery.',
    flavor_text: 'Expensive today, quieter pagers next quarter.',
    score_changes: [
      { score_id: 'user_trust', delta: 9 },
      { score_id: 'delivery_confidence', delta: 4 },
      { score_id: 'budget', delta: -8 }
    ],
    delayed_effect_refs: [makeRef('boundaries_clarify')],
    style_tags: ['infrastructure', 'stability']
  }
}
