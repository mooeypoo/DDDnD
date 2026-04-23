import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ShareResultCard from '@/ui/components/results/share_result_card.vue'
import type { SharePayload } from '@/domains/reporting/services/share_payload'

function makePayload(overrides: Partial<SharePayload> = {}): SharePayload {
  return {
    v: 1,
    sid: 'monolith_of_mild_despair',
    sv: 1,
    cls: 'boundary_mage',
    tier: 'failure',
    arch: 'boundary_builder',
    tid: 'failure',
    tc: 8,
    mt: 8,
    avg: 35,
    scores: {
      budget: 40,
      maintainability: 50,
    },
    cr: 'failure_condition_met',
    ...overrides,
  }
}

describe('share_result_card score display', () => {
  it('clamps negative score values to 0 for bar width but keeps raw visible label', () => {
    const wrapper = mount(ShareResultCard, {
      props: {
        payload: makePayload({
          scores: {
            budget: -15,
          },
        }),
      },
    })

    const scoreFill = wrapper.find('.score-bar-fill')
    const scoreValue = wrapper.find('.score-value')

    expect(scoreFill.attributes('style')).toContain('width: 0%;')
    expect(scoreValue.text()).toBe('-15')
  })

  it('renders non-negative score values with matching bar width and label', () => {
    const wrapper = mount(ShareResultCard, {
      props: {
        payload: makePayload({
          scores: {
            budget: 42,
          },
        }),
      },
    })

    const scoreFill = wrapper.find('.score-bar-fill')
    const scoreValue = wrapper.find('.score-value')

    expect(scoreFill.attributes('style')).toContain('width: 42%;')
    expect(scoreValue.text()).toBe('42')
  })

  it('caps very high non-negative scores at 100 for bar width but keeps raw label', () => {
    const wrapper = mount(ShareResultCard, {
      props: {
        payload: makePayload({
          scores: {
            budget: 180,
          },
        }),
      },
    })

    const scoreFill = wrapper.find('.score-bar-fill')
    const scoreValue = wrapper.find('.score-value')

    expect(scoreFill.attributes('style')).toContain('width: 100%;')
    expect(scoreValue.text()).toBe('180')
  })
})
