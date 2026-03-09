import { describe, it, expect } from 'vitest'
import {
  resolveCategory,
  filterByCategory,
  sortCards,
  getAvailableCategories,
  getAffectedMetrics,
  TAG_TO_CATEGORY,
} from '@/ui/composables/card_filter_sort'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function entry(
  name: string,
  tags: string[],
  scoreChanges: Array<{ score_id: string; delta: number }> = [],
) {
  return {
    card: {
      name,
      style_tags: tags,
      score_changes: scoreChanges,
    },
  }
}

const CARDS = [
  entry('Define Bounded Context', ['boundary', 'architecture', 'incremental'], [
    { score_id: 'domain_clarity', delta: 8 },
    { score_id: 'maintainability', delta: 4 },
    { score_id: 'budget', delta: -3 },
  ]),
  entry('Fortify Observability', ['infrastructure', 'platform', 'stability'], [
    { score_id: 'maintainability', delta: 6 },
    { score_id: 'delivery_confidence', delta: 4 },
    { score_id: 'user_trust', delta: 2 },
    { score_id: 'budget', delta: -4 },
  ]),
  entry('Ship Quick Fix', ['short-term', 'quick', 'patch'], [
    { score_id: 'delivery_confidence', delta: 5 },
    { score_id: 'user_trust', delta: 3 },
    { score_id: 'maintainability', delta: -4 },
  ]),
  entry('Hold Architecture Workshop', ['team', 'alignment', 'high-impact'], [
    { score_id: 'domain_clarity', delta: 6 },
    { score_id: 'team_morale', delta: 5 },
    { score_id: 'budget', delta: -2 },
  ]),
  entry('Document Ubiquitous Language', ['documentation', 'team', 'process'], [
    { score_id: 'domain_clarity', delta: 5 },
    { score_id: 'team_morale', delta: 3 },
  ]),
]

// ---------------------------------------------------------------------------
// resolveCategory
// ---------------------------------------------------------------------------

describe('resolveCategory', () => {
  it('returns the first matching category', () => {
    expect(resolveCategory(['boundary', 'architecture'])).toBe('refactor')
    expect(resolveCategory(['infrastructure', 'platform'])).toBe('infrastructure')
    expect(resolveCategory(['team', 'alignment'])).toBe('team')
    expect(resolveCategory(['documentation', 'process'])).toBe('process')
    expect(resolveCategory(['short-term', 'quick'])).toBe('fix')
  })

  it('returns "default" when no tags match', () => {
    expect(resolveCategory([])).toBe('default')
    expect(resolveCategory(['unknown-tag'])).toBe('default')
  })

  it('is case-insensitive', () => {
    expect(resolveCategory(['INFRASTRUCTURE'])).toBe('infrastructure')
    expect(resolveCategory(['Team'])).toBe('team')
  })
})

// ---------------------------------------------------------------------------
// filterByCategory
// ---------------------------------------------------------------------------

describe('filterByCategory', () => {
  it('returns all cards when category is "all"', () => {
    const result = filterByCategory(CARDS, 'all')
    expect(result).toHaveLength(CARDS.length)
  })

  it('filters to a specific category', () => {
    const result = filterByCategory(CARDS, 'refactor')
    expect(result).toHaveLength(1)
    expect(result[0].card.name).toBe('Define Bounded Context')
  })

  it('returns cards matching infrastructure', () => {
    const result = filterByCategory(CARDS, 'infrastructure')
    expect(result).toHaveLength(1)
    expect(result[0].card.name).toBe('Fortify Observability')
  })

  it('returns cards matching fix', () => {
    const result = filterByCategory(CARDS, 'fix')
    expect(result).toHaveLength(1)
    expect(result[0].card.name).toBe('Ship Quick Fix')
  })

  it('returns cards matching team', () => {
    const result = filterByCategory(CARDS, 'team')
    expect(result).toHaveLength(1)
    expect(result[0].card.name).toBe('Hold Architecture Workshop')
  })

  it('returns cards matching process', () => {
    const result = filterByCategory(CARDS, 'process')
    expect(result).toHaveLength(1)
    expect(result[0].card.name).toBe('Document Ubiquitous Language')
  })

  it('returns empty when no cards match', () => {
    const result = filterByCategory(CARDS, 'nonexistent')
    expect(result).toHaveLength(0)
  })

  it('does not mutate the input array', () => {
    const original = [...CARDS]
    filterByCategory(CARDS, 'team')
    expect(CARDS).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// sortCards
// ---------------------------------------------------------------------------

describe('sortCards', () => {
  it('preserves order for "default" sort', () => {
    const result = sortCards(CARDS, 'default')
    expect(result.map((c) => c.card.name)).toEqual(CARDS.map((c) => c.card.name))
  })

  it('sorts alphabetically by name', () => {
    const result = sortCards(CARDS, 'name')
    const names = result.map((c) => c.card.name)
    expect(names).toEqual([
      'Define Bounded Context',
      'Document Ubiquitous Language',
      'Fortify Observability',
      'Hold Architecture Workshop',
      'Ship Quick Fix',
    ])
  })

  it('sorts by boost for a specific metric — highest delta first', () => {
    const result = sortCards(CARDS, 'boost_domain_clarity')
    const names = result.map((c) => c.card.name)
    // domain_clarity deltas: Define=8, Hold=6, Document=5, others=none
    expect(names[0]).toBe('Define Bounded Context')
    expect(names[1]).toBe('Hold Architecture Workshop')
    expect(names[2]).toBe('Document Ubiquitous Language')
  })

  it('pushes cards without the target metric to the end', () => {
    const result = sortCards(CARDS, 'boost_team_morale')
    const names = result.map((c) => c.card.name)
    // team_morale: Hold=5, Document=3, others=none
    expect(names[0]).toBe('Hold Architecture Workshop')
    expect(names[1]).toBe('Document Ubiquitous Language')
    // remaining cards (no team_morale) are at the end
    expect(names.slice(2)).toContain('Define Bounded Context')
    expect(names.slice(2)).toContain('Fortify Observability')
    expect(names.slice(2)).toContain('Ship Quick Fix')
  })

  it('handles negative deltas correctly — positive before negative', () => {
    const result = sortCards(CARDS, 'boost_maintainability')
    const names = result.map((c) => c.card.name)
    // maintainability: Fortify=6, Define=4, Ship=-4
    expect(names[0]).toBe('Fortify Observability')
    expect(names[1]).toBe('Define Bounded Context')
    // Ship Quick Fix has -4 but still has the metric, so it's before cards without it
    expect(names.indexOf('Ship Quick Fix')).toBeLessThan(names.length)
  })

  it('does not mutate the input array', () => {
    const original = CARDS.map((c) => c.card.name)
    sortCards(CARDS, 'name')
    expect(CARDS.map((c) => c.card.name)).toEqual(original)
  })
})

// ---------------------------------------------------------------------------
// getAvailableCategories
// ---------------------------------------------------------------------------

describe('getAvailableCategories', () => {
  it('returns categories present in the card set in stable order', () => {
    const cats = getAvailableCategories(CARDS)
    expect(cats).toEqual(['refactor', 'infrastructure', 'team', 'process', 'fix'])
  })

  it('omits categories not present', () => {
    const subset = [CARDS[0], CARDS[3]] // refactor, team
    const cats = getAvailableCategories(subset)
    expect(cats).toEqual(['refactor', 'team'])
  })

  it('returns empty for no cards', () => {
    expect(getAvailableCategories([])).toEqual([])
  })

  it('omits "default" category', () => {
    const noTags = [entry('Mystery', [], [])]
    expect(getAvailableCategories(noTags)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getAffectedMetrics
// ---------------------------------------------------------------------------

describe('getAffectedMetrics', () => {
  it('returns all metrics affected by at least one card', () => {
    const metrics = getAffectedMetrics(CARDS)
    expect(metrics).toContain('maintainability')
    expect(metrics).toContain('delivery_confidence')
    expect(metrics).toContain('team_morale')
    expect(metrics).toContain('user_trust')
    expect(metrics).toContain('budget')
    expect(metrics).toContain('domain_clarity')
  })

  it('preserves known order', () => {
    const metrics = getAffectedMetrics(CARDS)
    const idxMaint = metrics.indexOf('maintainability')
    const idxBudget = metrics.indexOf('budget')
    expect(idxMaint).toBeLessThan(idxBudget)
  })

  it('returns empty for no cards', () => {
    expect(getAffectedMetrics([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// TAG_TO_CATEGORY consistency
// ---------------------------------------------------------------------------

describe('TAG_TO_CATEGORY', () => {
  it('maps to a known set of category ids', () => {
    const validCategories = new Set(['refactor', 'infrastructure', 'team', 'process', 'fix'])
    for (const [_tag, cat] of Object.entries(TAG_TO_CATEGORY)) {
      expect(validCategories.has(cat)).toBe(true)
    }
  })
})
