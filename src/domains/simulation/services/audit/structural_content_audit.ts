import type { ScenarioBundle } from '@/domains/content/model/scenario_bundle'
import type { StakeholderReactionRule } from '@/domains/content/model/content_types'
import type { AuditFinding } from '../content_audit_contract'

// ── Thresholds ──────────────────────────────────────────────────

/** Minimum number of reaction rules expected per stakeholder. */
const MIN_RULES_PER_STAKEHOLDER = 2

/** Minimum ratio of positive-outcome events (by occurrence_weight). */
const MIN_POSITIVE_EVENT_WEIGHT_RATIO = 0.25

/** If the magnitude of the largest negative rule is this many times the
 *  largest positive rule for the same stakeholder, flag asymmetry. */
const RULE_MAGNITUDE_ASYMMETRY = 2.0

// ── Helpers ─────────────────────────────────────────────────────

function netStakeholderDelta(rule: StakeholderReactionRule, stakeholderId?: string): number {
  const targets = stakeholderId
    ? rule.stakeholder_changes?.filter(c => c.stakeholder_id === stakeholderId)
    : rule.stakeholder_changes
  return (targets ?? []).reduce((sum, c) => sum + c.delta, 0)
}

// ── Synthesis ───────────────────────────────────────────────────

/**
 * Audits static scenario content structure for balance and completeness risks.
 */
export function auditStructuralContent(bundle: ScenarioBundle): AuditFinding[] {
  const findings: AuditFinding[] = []

  // ── 1. Per-stakeholder rule polarity ──────────────────────────
  for (const [, stakeholder] of bundle.stakeholders) {
    const rules = stakeholder.reaction_rule_refs
      .map(ref => bundle.stakeholder_reaction_rules.get(`${ref.id}-v${ref.version}`))
      .filter((r): r is StakeholderReactionRule => r !== undefined)

    // 1a. Thin rule set
    if (rules.length < MIN_RULES_PER_STAKEHOLDER) {
      findings.push({
        id: `structural.thin_rule_set.${stakeholder.id}`,
        severity: 'warning',
        category: 'stakeholder_balance',
        title: `${stakeholder.id}: fewer than ${MIN_RULES_PER_STAKEHOLDER} reaction rules`,
        description: `${stakeholder.name} has only ${rules.length} reaction rule(s). Stakeholders need at least ${MIN_RULES_PER_STAKEHOLDER} rules to produce varied gameplay.`,
        evidence: rules.map(r => r.id),
        recommended_fix_surface: 'content',
      })
    }

    // 1b. No positive rule path
    const hasPositive = rules.some(r => netStakeholderDelta(r, stakeholder.id) > 0)
    if (!hasPositive && rules.length > 0) {
      findings.push({
        id: `structural.no_positive_rule_path.${stakeholder.id}`,
        severity: 'critical',
        category: 'stakeholder_balance',
        title: `${stakeholder.id}: no positive reaction rule`,
        description: `${stakeholder.name} has no rule that increases their satisfaction. They can only decline, never recover.`,
        evidence: rules.map(r => `${r.id}: net = ${netStakeholderDelta(r, stakeholder.id)}`),
        recommended_fix_surface: 'content',
      })
    }

    // 1c. Rule magnitude asymmetry
    const deltas = rules.map(r => netStakeholderDelta(r, stakeholder.id)).filter(d => d !== 0)
    const maxPositive = Math.max(0, ...deltas.filter(d => d > 0))
    const maxNegative = Math.abs(Math.min(0, ...deltas.filter(d => d < 0)))

    if (maxPositive > 0 && maxNegative > 0 && maxNegative / maxPositive >= RULE_MAGNITUDE_ASYMMETRY) {
      findings.push({
        id: `structural.rule_magnitude_asymmetry.${stakeholder.id}`,
        severity: 'warning',
        category: 'stakeholder_balance',
        title: `${stakeholder.id}: negative rule magnitude outweighs positive`,
        description: `${stakeholder.name}'s largest negative rule (−${maxNegative}) is ${(maxNegative / maxPositive).toFixed(1)}× the largest positive rule (+${maxPositive}).`,
        evidence: [
          `max_negative_delta = −${maxNegative}`,
          `max_positive_delta = +${maxPositive}`,
          `ratio = ${(maxNegative / maxPositive).toFixed(2)}×  (threshold: ≥${RULE_MAGNITUDE_ASYMMETRY}×)`,
        ],
        recommended_fix_surface: 'content',
      })
    }
  }

  // ── 2. Card ecosystem — no direct stakeholder impact ─────────
  const cardsWithStakeholderChanges = [...bundle.cards.values()].filter(
    c => c.stakeholder_changes && c.stakeholder_changes.length > 0,
  )
  const totalCards = bundle.cards.size

  if (totalCards > 0 && cardsWithStakeholderChanges.length === 0) {
    findings.push({
      id: `structural.no_card_stakeholder_changes`,
      severity: 'warning',
      category: 'card_ecosystem',
      title: 'No cards directly affect stakeholder satisfaction',
      description: `All ${totalCards} cards in this scenario affect only scores. Players have no direct way to recover stakeholder satisfaction through card play.`,
      evidence: [`cards_with_stakeholder_changes = 0 / ${totalCards}`],
      recommended_fix_surface: 'content',
    })
  } else if (totalCards > 0) {
    const ratio = cardsWithStakeholderChanges.length / totalCards
    if (ratio < 0.15) {
      findings.push({
        id: `structural.few_card_stakeholder_changes`,
        severity: 'info',
        category: 'card_ecosystem',
        title: 'Very few cards affect stakeholder satisfaction directly',
        description: `Only ${cardsWithStakeholderChanges.length} of ${totalCards} cards (${(ratio * 100).toFixed(0)}%) include stakeholder_changes.`,
        evidence: [
          `cards_with_stakeholder_changes = ${cardsWithStakeholderChanges.length} / ${totalCards}`,
          ...cardsWithStakeholderChanges.map(c => c.id),
        ],
        recommended_fix_surface: 'content',
      })
    }
  }

  // ── 3. Event pool composition ─────────────────────────────────
  const events = [...bundle.events.values()]

  if (events.length > 0) {
    let positiveWeightSum = 0
    let negativeWeightSum = 0

    for (const event of events) {
      const net = (event.score_changes ?? []).reduce((s, c) => s + c.delta, 0)
      const weight = event.occurrence_weight ?? 1
      if (net > 0) positiveWeightSum += weight
      else if (net < 0) negativeWeightSum += weight
    }

    const totalWeight = positiveWeightSum + negativeWeightSum
    const positiveRatio = totalWeight > 0 ? positiveWeightSum / totalWeight : 0

    if (positiveRatio < MIN_POSITIVE_EVENT_WEIGHT_RATIO) {
      findings.push({
        id: `structural.event_pool_negative_skew`,
        severity: 'warning',
        category: 'event_fairness',
        title: 'Event pool is heavily weighted toward negative outcomes',
        description: `Only ${(positiveRatio * 100).toFixed(1)}% of event occurrence weight is positive. Players face disproportionate external pressure.`,
        evidence: [
          `positive_weight = ${positiveWeightSum}`,
          `negative_weight = ${negativeWeightSum}`,
          `positive_ratio = ${(positiveRatio * 100).toFixed(1)}%  (threshold: ≥${MIN_POSITIVE_EVENT_WEIGHT_RATIO * 100}%)`,
        ],
        recommended_fix_surface: 'content',
      })
    }

    // 3b. Events with no stakeholder impact
    const eventsWithStakeholderChanges = events.filter(
      e => e.stakeholder_changes && e.stakeholder_changes.length > 0,
    )
    if (eventsWithStakeholderChanges.length === 0) {
      findings.push({
        id: `structural.no_event_stakeholder_changes`,
        severity: 'info',
        category: 'event_fairness',
        title: 'No events directly affect stakeholder satisfaction',
        description: `All ${events.length} events in this scenario affect only scores. Events could also be used to drive stakeholder reactions.`,
        evidence: [`events_with_stakeholder_changes = 0 / ${events.length}`],
        recommended_fix_surface: 'content',
      })
    }
  }

  return findings
}
