import { describe, expect, it } from 'vitest'
import type { Stakeholder } from '@/domains/content/model/content_types'
import {
  buildStakeholderNamesMap,
  formatStakeholderName
} from '@/ui/composables/stakeholder_presentation'

function makeStakeholder(id: string, name: string): Stakeholder {
  return {
    id,
    version: 1,
    name,
    description: `${name} stakeholder`,
    reaction_rule_refs: []
  }
}

describe('stakeholder_presentation', () => {
  it('builds stakeholderNames keyed by stakeholder.id (not versioned map keys)', () => {
    const stakeholders = new Map<string, Stakeholder>([
      ['cto-v1', makeStakeholder('cto', 'Chief Technology Officer')],
      ['vp_product-v1', makeStakeholder('vp_product', 'VP Product')]
    ])

    const names = buildStakeholderNamesMap({ stakeholders })

    expect(names).toEqual({
      cto: 'Chief Technology Officer',
      vp_product: 'VP Product'
    })
    expect(names['cto-v1']).toBeUndefined()
    expect(names['vp_product-v1']).toBeUndefined()
  })

  it('formats using defined name and only falls back when missing', () => {
    const names = {
      cto: 'Chief Technology Officer',
      vp_product: 'VP Product'
    }

    expect(formatStakeholderName('cto', names)).toBe('Chief Technology Officer')
    expect(formatStakeholderName('vp_product', names)).toBe('VP Product')
    expect(formatStakeholderName('head_of_platform', names)).toBe('Head Of Platform')
  })
})
