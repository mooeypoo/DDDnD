/**
 * Card filtering and sorting logic for the Action Satchel.
 *
 * Pure functions — no Vue dependency — so they can be tested independently.
 */

import type { ScoreChange } from '@/domains/content/model/content_types'

// ---------------------------------------------------------------------------
// Category resolution
// ---------------------------------------------------------------------------

/** Maps individual style_tags to a visual card category. */
export const TAG_TO_CATEGORY: Record<string, string> = {
  refactor:       'refactor',
  architecture:   'refactor',
  boundary:       'refactor',
  incremental:    'refactor',
  safe:           'refactor',
  'high-impact':  'refactor',
  infrastructure: 'infrastructure',
  stability:      'infrastructure',
  integration:    'infrastructure',
  platform:       'infrastructure',
  team:           'team',
  alignment:      'team',
  organizational: 'team',
  people:         'team',
  process:        'process',
  workflow:       'process',
  documentation:  'process',
  'short-term':   'fix',
  'cost-control': 'fix',
  quick:          'fix',
  patch:          'fix',
}

/** Display metadata for each card category. */
export const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  refactor:       { label: 'Refactor',  icon: '🏗️' },
  infrastructure: { label: 'Infra',     icon: '⚙️' },
  team:           { label: 'Team',      icon: '👥' },
  process:        { label: 'Process',   icon: '📋' },
  fix:            { label: 'Quick Fix', icon: '🩹' },
}

/** Resolve the first matching category from a list of style_tags. */
export function resolveCategory(styleTags: string[]): string {
  for (const tag of styleTags) {
    const cat = TAG_TO_CATEGORY[tag.toLowerCase()]
    if (cat) return cat
  }
  return 'default'
}

// ---------------------------------------------------------------------------
// Shared card-entry shape (structural typing — no coupling to game_view)
// ---------------------------------------------------------------------------

export interface FilterableCard {
  card: {
    name: string
    style_tags?: string[]
    score_changes: ScoreChange[]
  }
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

export type CategoryFilter = 'all' | string

/**
 * Return only the cards that belong to `category`.
 * When category is `'all'` every card passes.
 */
export function filterByCategory<T extends FilterableCard>(
  cards: readonly T[],
  category: CategoryFilter,
): T[] {
  if (category === 'all') return cards.slice()
  return cards.filter(
    (entry) => resolveCategory(entry.card.style_tags ?? []) === category,
  )
}

/**
 * Derive the set of categories *actually present* in the supplied cards
 * (preserving a stable order).
 */
export function getAvailableCategories(cards: readonly FilterableCard[]): string[] {
  const ORDER = ['refactor', 'infrastructure', 'team', 'process', 'fix']
  const present = new Set<string>()
  for (const entry of cards) {
    present.add(resolveCategory(entry.card.style_tags ?? []))
  }
  present.delete('default')
  return ORDER.filter((c) => present.has(c))
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

export type SortOption = 'default' | 'name' | `boost_${string}`

/**
 * Sort a list of card entries *out-of-place*.
 *
 * - `'default'` — original insertion order (no-op copy)
 * - `'name'`    — alphabetical by card name
 * - `'boost_<score_id>'` — biggest positive delta first for that metric
 *    (cards not affecting that metric sort to the end)
 */
export function sortCards<T extends FilterableCard>(
  cards: readonly T[],
  sortBy: SortOption,
): T[] {
  const list = cards.slice()

  if (sortBy === 'default') return list

  if (sortBy === 'name') {
    return list.sort((a, b) =>
      a.card.name.localeCompare(b.card.name, undefined, { sensitivity: 'base' }),
    )
  }

  // 'boost_<score_id>'
  if (sortBy.startsWith('boost_')) {
    const scoreId = sortBy.slice('boost_'.length)
    return list.sort((a, b) => {
      const da = deltaFor(a.card.score_changes, scoreId)
      const db = deltaFor(b.card.score_changes, scoreId)
      return db - da // descending
    })
  }

  return list
}

function deltaFor(changes: ScoreChange[], scoreId: string): number {
  const entry = changes.find((c) => c.score_id === scoreId)
  return entry?.delta ?? -Infinity // push cards without this metric to the end
}

/**
 * Derive the set of score ids affected by at least one card.
 * Preserves a stable deterministic order.
 */
export function getAffectedMetrics(cards: readonly FilterableCard[]): string[] {
  const KNOWN_ORDER = [
    'maintainability',
    'delivery_confidence',
    'team_morale',
    'user_trust',
    'budget',
    'domain_clarity',
  ]
  const present = new Set<string>()
  for (const entry of cards) {
    for (const sc of entry.card.score_changes) {
      present.add(sc.score_id)
    }
  }
  // known first, then any unknowns in insertion order
  const ordered = KNOWN_ORDER.filter((m) => present.has(m))
  for (const m of present) {
    if (!ordered.includes(m)) ordered.push(m)
  }
  return ordered
}
