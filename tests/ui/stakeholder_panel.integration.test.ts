import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Stakeholder } from '@/domains/content/model/content_types'
import StakeholderPanel from '@/ui/components/stakeholders/stakeholder_panel.vue'
import { buildStakeholderNamesMap } from '@/ui/composables/stakeholder_presentation'

function makeStakeholder(id: string, name: string): Stakeholder {
  return {
    id,
    version: 1,
    name,
    description: `${name} stakeholder`,
    reaction_rule_refs: []
  }
}

describe('stakeholder_panel integration', () => {
  it('renders stakeholder names from content definitions via stakeholderNames map', () => {
    const stakeholders = {
      cto: { satisfaction: 72 },
      vp_product: { satisfaction: 64 }
    }

    const bundleLike = {
      stakeholders: new Map<string, Stakeholder>([
        ['cto-v1', makeStakeholder('cto', 'Chief Technology Officer')],
        ['vp_product-v1', makeStakeholder('vp_product', 'VP of Product')]
      ])
    }

    const stakeholderNames = buildStakeholderNamesMap(bundleLike)

    const wrapper = mount(StakeholderPanel, {
      props: {
        stakeholders,
        stakeholderNames
      }
    })

    expect(wrapper.text()).toContain('Chief Technology Officer')
    expect(wrapper.text()).toContain('VP of Product')
    expect(wrapper.text()).not.toContain('Cto')
    expect(wrapper.text()).not.toContain('Vp Product')
  })
})
