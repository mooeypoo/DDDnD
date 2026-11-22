/**
 * Tier and ending names come from the run's own content (M3 slice 1).
 */

import { describe, expect, it } from 'vitest'

import { createEmptyBundle, type OutcomeArchetype, type OutcomeTier, type Scenario } from '@/domains/content/model'
import { describeOutcome, titleCaseId } from '@/ui/play/outcome_presentation'

function bundleWith(tiers: OutcomeTier[], archetypes: OutcomeArchetype[]) {
  const bundle = createEmptyBundle({ id: 's', version: 1 } as Scenario)
  for (const tier of tiers) bundle.outcome_tiers.set(`${tier.id}-v${tier.version}`, tier)
  for (const archetype of archetypes) bundle.outcome_archetypes.set(`${archetype.id}-v${archetype.version}`, archetype)
  return bundle
}

const pack = bundleWith(
  [{ id: 'reliability_win', version: 1, name: 'Five Nines', description: 'd', rank: 5 }],
  [{ id: 'toil_slayer', version: 1, name: 'The Toil Slayer', description: 'You automated the pager away.', flavor_text: 'Nobody got paged.' }],
)

describe('describeOutcome', () => {
  it("uses the pack's own names, description and flavor text", () => {
    expect(describeOutcome(pack, 'reliability_win', 'toil_slayer')).toEqual({
      tierName: 'Five Nines',
      archetypeName: 'The Toil Slayer',
      archetypeDescription: 'You automated the pager away.',
      archetypeFlavor: 'Nobody got paged.',
    })
  })

  it('names the coarse result when no content tier matched', () => {
    expect(describeOutcome(pack, 'partial_success', 'toil_slayer').tierName).toBe('Partial Success')
  })

  it('falls back to a title-cased id and a generic description only when content has nothing', () => {
    const text = describeOutcome(null, 'struggle', 'the_visionary')
    expect(text.tierName).toBe('Struggle')
    expect(text.archetypeName).toBe('The Visionary')
    expect(text.archetypeDescription).toMatch(/unique/)
    expect(text.archetypeFlavor).toBeUndefined()
  })

  it('title-cases ids', () => {
    expect(titleCaseId('stakeholder_whisperer')).toBe('Stakeholder Whisperer')
  })
})
