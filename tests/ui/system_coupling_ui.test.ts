import { describe, it, expect } from 'vitest'
import {
  getCollapseWarnings,
  getAdjustedScoreChanges,
  getScoreModifiers,
  hasActiveCoupling
} from '@/ui/composables/system_coupling'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function healthyScores(): Record<string, number> {
  return {
    domain_clarity: 50,
    maintainability: 50,
    delivery_confidence: 50,
    team_morale: 50,
    user_trust: 50,
    budget: 50
  }
}

function collapsedScores(
  overrides: Record<string, number> = {}
): Record<string, number> {
  return { ...healthyScores(), ...overrides }
}

// ---------------------------------------------------------------------------
// getCollapseWarnings
// ---------------------------------------------------------------------------

describe('getCollapseWarnings', () => {
  it('returns no warnings when all scores are healthy', () => {
    const warnings = getCollapseWarnings(healthyScores())
    expect(warnings).toHaveLength(0)
  })

  it('returns delivery collapse warning when delivery_confidence < 25', () => {
    const warnings = getCollapseWarnings(collapsedScores({ delivery_confidence: 20 }))
    expect(warnings).toHaveLength(1)
    expect(warnings[0].title).toBe('Delivery Collapse')
    expect(warnings[0].triggerScoreId).toBe('delivery_confidence')
    expect(warnings[0].currentValue).toBe(20)
    expect(warnings[0].threshold).toBe(25)
  })

  it('returns morale collapse warning when team_morale < 25', () => {
    const warnings = getCollapseWarnings(collapsedScores({ team_morale: 10 }))
    expect(warnings).toHaveLength(1)
    expect(warnings[0].title).toBe('Morale Collapse')
    expect(warnings[0].triggerScoreId).toBe('team_morale')
  })

  it('returns trust collapse warning when user_trust < 25', () => {
    const warnings = getCollapseWarnings(collapsedScores({ user_trust: 15 }))
    expect(warnings).toHaveLength(1)
    expect(warnings[0].title).toBe('Trust Collapse')
    expect(warnings[0].triggerScoreId).toBe('user_trust')
  })

  it('does not trigger at exactly threshold value (25)', () => {
    const warnings = getCollapseWarnings(collapsedScores({ delivery_confidence: 25 }))
    expect(warnings).toHaveLength(0)
  })

  it('returns multiple warnings when multiple collapses are active', () => {
    const warnings = getCollapseWarnings(collapsedScores({
      delivery_confidence: 10,
      team_morale: 5,
      user_trust: 20
    }))
    expect(warnings).toHaveLength(3)
    const titles = warnings.map(w => w.title)
    expect(titles).toContain('Delivery Collapse')
    expect(titles).toContain('Morale Collapse')
    expect(titles).toContain('Trust Collapse')
  })

  it('includes human-readable descriptions', () => {
    const warnings = getCollapseWarnings(collapsedScores({ delivery_confidence: 20 }))
    expect(warnings[0].description).toBeTruthy()
    expect(warnings[0].icon).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// hasActiveCoupling
// ---------------------------------------------------------------------------

describe('hasActiveCoupling', () => {
  it('returns false when system is healthy', () => {
    expect(hasActiveCoupling(healthyScores())).toBe(false)
  })

  it('returns true when any score is collapsed', () => {
    expect(hasActiveCoupling(collapsedScores({ team_morale: 10 }))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getScoreModifiers
// ---------------------------------------------------------------------------

describe('getScoreModifiers', () => {
  it('returns 1.0 multipliers when system is healthy', () => {
    const modifiers = getScoreModifiers(healthyScores())
    expect(modifiers.domain_clarity_gain_multiplier).toBe(1.0)
    expect(modifiers.maintainability_gain_multiplier).toBe(1.0)
    expect(modifiers.delivery_confidence_gain_multiplier).toBe(1.0)
  })

  it('returns reduced multipliers under delivery collapse', () => {
    const modifiers = getScoreModifiers(collapsedScores({ delivery_confidence: 20 }))
    expect(modifiers.domain_clarity_gain_multiplier).toBe(0.7)
    expect(modifiers.maintainability_gain_multiplier).toBe(0.7)
    expect(modifiers.delivery_confidence_gain_multiplier).toBe(1.0)
  })

  it('returns reduced maintainability multiplier under morale collapse', () => {
    const modifiers = getScoreModifiers(collapsedScores({ team_morale: 10 }))
    expect(modifiers.domain_clarity_gain_multiplier).toBe(1.0)
    expect(modifiers.maintainability_gain_multiplier).toBe(0.75)
    expect(modifiers.delivery_confidence_gain_multiplier).toBe(1.0)
  })

  it('stacks multipliers when delivery and morale both collapse', () => {
    const modifiers = getScoreModifiers(collapsedScores({
      delivery_confidence: 20,
      team_morale: 10
    }))
    // maintainability: 0.7 * 0.75 = 0.525
    expect(modifiers.maintainability_gain_multiplier).toBeCloseTo(0.525)
    expect(modifiers.domain_clarity_gain_multiplier).toBe(0.7)
  })
})

// ---------------------------------------------------------------------------
// getAdjustedScoreChanges
// ---------------------------------------------------------------------------

describe('getAdjustedScoreChanges', () => {
  const sampleChanges = [
    { score_id: 'domain_clarity', delta: 10 },
    { score_id: 'maintainability', delta: 4 },
    { score_id: 'budget', delta: -3 }
  ]

  it('returns unmodified effects when system is healthy', () => {
    const adjusted = getAdjustedScoreChanges(sampleChanges, healthyScores())
    expect(adjusted).toHaveLength(3)
    for (const effect of adjusted) {
      expect(effect.adjusted_delta).toBe(effect.base_delta)
      expect(effect.is_modified).toBe(false)
      expect(effect.multiplier).toBe(1.0)
    }
  })

  it('shows reduced positive deltas under delivery collapse', () => {
    const scores = collapsedScores({ delivery_confidence: 20 })
    const adjusted = getAdjustedScoreChanges(sampleChanges, scores)

    // domain_clarity: +10 * 0.7 = +7
    const clarity = adjusted.find(e => e.score_id === 'domain_clarity')!
    expect(clarity.base_delta).toBe(10)
    expect(clarity.adjusted_delta).toBe(7)
    expect(clarity.is_modified).toBe(true)
    expect(clarity.multiplier).toBe(0.7)

    // maintainability: +4 * 0.7 = +3 (rounded)
    const maint = adjusted.find(e => e.score_id === 'maintainability')!
    expect(maint.base_delta).toBe(4)
    expect(maint.adjusted_delta).toBe(3)
    expect(maint.is_modified).toBe(true)
  })

  it('does not modify negative deltas even under collapse', () => {
    const scores = collapsedScores({ delivery_confidence: 20 })
    const adjusted = getAdjustedScoreChanges(sampleChanges, scores)

    const budget = adjusted.find(e => e.score_id === 'budget')!
    expect(budget.base_delta).toBe(-3)
    expect(budget.adjusted_delta).toBe(-3)
    expect(budget.is_modified).toBe(false)
  })

  it('does not modify budget gains (not an affected score)', () => {
    const scores = collapsedScores({ delivery_confidence: 20 })
    const budgetGain = [{ score_id: 'budget', delta: 5 }]
    const adjusted = getAdjustedScoreChanges(budgetGain, scores)

    expect(adjusted[0].adjusted_delta).toBe(5)
    expect(adjusted[0].is_modified).toBe(false)
    expect(adjusted[0].multiplier).toBe(1.0)
  })

  it('reflects stacked multipliers for maintainability', () => {
    const scores = collapsedScores({ delivery_confidence: 20, team_morale: 10 })
    const changes = [{ score_id: 'maintainability', delta: 10 }]
    const adjusted = getAdjustedScoreChanges(changes, scores)

    // 10 * 0.7 * 0.75 = 5.25 → rounds to 5
    expect(adjusted[0].adjusted_delta).toBe(5)
    expect(adjusted[0].is_modified).toBe(true)
  })

  it('returns empty array for empty score_changes', () => {
    const adjusted = getAdjustedScoreChanges([], healthyScores())
    expect(adjusted).toHaveLength(0)
  })
})
