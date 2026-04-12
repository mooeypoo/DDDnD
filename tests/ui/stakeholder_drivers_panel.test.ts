import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { StakeholderReactionRecord } from '@/domains/simulation'
import StakeholderDriversPanel from '@/ui/components/stakeholders/StakeholderDriversPanel.vue'

function makeReaction(partial: Partial<StakeholderReactionRecord> = {}): StakeholderReactionRecord {
  return {
    stakeholder_id: 'cto',
    applied_rule_refs: [],
    score_changes: [],
    stakeholder_changes: [],
    presentation: {
      title: 'Default Title',
      summary: 'Default summary text.',
    },
    ...partial,
  }
}

describe('StakeholderDriversPanel', () => {
  it('renders empty state when no reactions provided', () => {
    const wrapper = mount(StakeholderDriversPanel, {
      props: { reactions: [] },
    })

    expect(wrapper.text()).toContain('No stakeholder reactions this turn.')
    expect(wrapper.find('.drivers-list').exists()).toBe(false)
  })

  it('renders a driver row per reaction', () => {
    const reactions = [
      makeReaction({ stakeholder_id: 'cto' }),
      makeReaction({ stakeholder_id: 'ops' }),
    ]

    const wrapper = mount(StakeholderDriversPanel, {
      props: { reactions },
    })

    const rows = wrapper.findAll('.driver-row')
    expect(rows).toHaveLength(2)
  })

  it('displays reaction title and summary', () => {
    const reaction = makeReaction({
      presentation: {
        title: 'CTO Concerned',
        summary: 'Architecture drift is a risk.',
      },
    })

    const wrapper = mount(StakeholderDriversPanel, {
      props: { reactions: [reaction] },
    })

    expect(wrapper.text()).toContain('CTO Concerned')
    expect(wrapper.text()).toContain('Architecture drift is a risk.')
  })

  it('displays stakeholder name from namesMap', () => {
    const reaction = makeReaction({ stakeholder_id: 'vp_product' })
    const wrapper = mount(StakeholderDriversPanel, {
      props: {
        reactions: [reaction],
        stakeholderNames: { vp_product: 'VP of Product' },
      },
    })

    expect(wrapper.text()).toContain('VP of Product')
  })

  it('shows delta badge with sign for non-zero satisfaction delta', () => {
    const reaction = makeReaction({
      stakeholder_id: 'ops',
      stakeholder_changes: [{ stakeholder_id: 'ops', delta: -5 }],
    })

    const wrapper = mount(StakeholderDriversPanel, {
      props: { reactions: [reaction] },
    })

    const badge = wrapper.find('.delta-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('-5')
    expect(badge.classes()).toContain('negative')
  })

  it('hides delta badge when net satisfaction delta is zero', () => {
    const reaction = makeReaction({
      stakeholder_id: 'cto',
      stakeholder_changes: [],
    })

    const wrapper = mount(StakeholderDriversPanel, {
      props: { reactions: [reaction] },
    })

    expect(wrapper.find('.delta-badge').exists()).toBe(false)
  })

  it('applies tone data attribute on driver row', () => {
    const reaction = makeReaction({
      stakeholder_id: 'lead_dev',
      stakeholder_changes: [{ stakeholder_id: 'lead_dev', delta: -10 }],
    })

    const wrapper = mount(StakeholderDriversPanel, {
      props: { reactions: [reaction] },
    })

    const row = wrapper.find('.driver-row')
    expect(row.attributes('data-tone')).toBe('critical')
  })

  it('shows score changes as change badges', () => {
    const reaction = makeReaction({
      score_changes: [
        { score_id: 'delivery_velocity', delta: 3 },
        { score_id: 'technical_debt', delta: -2 },
      ],
    })

    const wrapper = mount(StakeholderDriversPanel, {
      props: { reactions: [reaction] },
    })

    const badges = wrapper.findAll('.change-badge')
    expect(badges).toHaveLength(2)
    expect(badges[0].text()).toContain('Delivery Velocity')
    expect(badges[0].text()).toContain('+3')
    expect(badges[1].text()).toContain('Technical Debt')
    expect(badges[1].text()).toContain('-2')
  })
})
