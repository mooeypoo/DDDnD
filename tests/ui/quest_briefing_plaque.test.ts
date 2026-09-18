import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import QuestBriefingPlaque from '@/ui/play/quest_briefing_plaque.vue'

const quest: QuestDisplayModel = {
  id: 'compliance_gauntlet',
  version: 1,
  name: 'Compliance Gauntlet',
  description: 'A looming audit forces the team to confront unclear boundaries.',
  shortDescription: 'Survive a regulatory gauntlet.',
  flavorText: 'The auditors are coming',
  turnCount: 12,
  stakeholderCount: 2,
  actionCardCount: 8,
  councilNames: ['CTO', 'Security Officer'],
  startingScores: {
    team_morale: 32,
    delivery_confidence: 55,
  },
}

describe('quest_briefing_plaque', () => {
  it('shows description, council, and authored starting mood', () => {
    const wrapper = mount(QuestBriefingPlaque, {
      props: { isOpen: true, quest },
    })

    expect(wrapper.text()).toContain('The auditors are coming')
    expect(wrapper.text()).toContain('A looming audit forces the team to confront unclear boundaries.')
    expect(wrapper.text()).toContain('CTO')
    expect(wrapper.text()).toContain('Security Officer')
    expect(wrapper.text()).toContain('12 turns remain on this quest.')
    expect(wrapper.text()).toContain('Morale')
    expect(wrapper.text()).toContain('How the system starts')
    expect(wrapper.text()).toContain('32 · Troubled')
    expect(wrapper.text()).toContain('Delivery')
    expect(wrapper.text()).toContain('55 · Strained')
  })
})
