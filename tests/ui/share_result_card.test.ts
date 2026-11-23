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

describe('share_result_card community pack marker (journal M2.12)', () => {
  it('says a community run is not a DDDnD scenario, naming the pack and publisher', () => {
    const wrapper = mount(ShareResultCard, {
      props: { payload: makePayload({ cp: { n: 'Demo: The Gilded Ledger', p: 'mooeypoo on GitHub (mooeypoo/DDDnD-packs)' } }) },
    })
    expect(wrapper.find('.community-pack-line').text()).toBe(
      'Community pack · Demo: The Gilded Ledger · mooeypoo on GitHub (mooeypoo/DDDnD-packs) · not a DDDnD scenario',
    )
  })

  it('shows pack-supplied text as text, never markup', () => {
    const wrapper = mount(ShareResultCard, { props: { payload: makePayload({ cp: { n: '<b>bold</b>', p: 'x' } }) } })
    expect(wrapper.find('.community-pack-line b').exists()).toBe(false)
    expect(wrapper.find('.community-pack-line').text()).toContain('<b>bold</b>')
  })

  it('has no marker for first-party runs', () => {
    expect(mount(ShareResultCard, { props: { payload: makePayload() } }).find('.community-pack-line').exists()).toBe(false)
  })
})

describe('share_result_card names (M3 slice 1)', () => {
  it("shows the ending and tier names the link carries, from the run's content", () => {
    const wrapper = mount(ShareResultCard, { props: { payload: makePayload({ an: 'The Toil Slayer', tn: 'Five Nines' }) } })
    expect(wrapper.find('.archetype-name').text()).toBe('The Toil Slayer')
    expect(wrapper.find('.tier-label').text()).toBe('Five Nines')
  })

  it('falls back to title-cased ids for links made before names were carried', () => {
    const wrapper = mount(ShareResultCard, { props: { payload: makePayload() } })
    expect(wrapper.find('.archetype-name').text()).toBe('Boundary Builder')
    expect(wrapper.find('.tier-label').text()).toBe('Failure')
  })
})


describe('share_result_card names (journal M3.11)', () => {
  it("shows the scenario and class names a pack run's link carries", () => {
    const text = mount(ShareResultCard, {
      props: { payload: makePayload({ sid: 'sre_pager_storm', cls: 'sre_pager_paladin', sn: 'The Pager Storm', cn: 'Pager Paladin' }) },
    }).text()
    expect(text).toContain('The Pager Storm')
    expect(text).toContain('Pager Paladin')
    expect(text).not.toContain('Sre ')
  })

  it('falls back to title-cased ids for older links', () => {
    const text = mount(ShareResultCard, { props: { payload: makePayload({ sid: 'monolith_of_mild_despair', cls: 'boundary_mage' }) } }).text()
    expect(text).toContain('Monolith Of Mild Despair')
    expect(text).toContain('Boundary Mage')
  })

  it("shows the council's and scores' names a link carries, not their ids", () => {
    const text = mount(ShareResultCard, {
      props: { payload: makePayload({ stakeholders: { sre_vp_engineering: 60 }, scores: { sre_availability: 70 }, stn: { sre_vp_engineering: 'VP of Engineering' }, scn: { sre_availability: 'Uptime' } }) },
    }).text()
    expect(text).toContain('VP of Engineering')
    expect(text).toContain('Uptime')
    expect(text).not.toMatch(/Sre /)
  })
})
