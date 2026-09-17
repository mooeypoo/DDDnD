import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RunIntroSplash from '@/ui/components/common/run_intro_splash.vue'

describe('run_intro_splash table moment', () => {
  it('names the scenario and flavor without re-ledging scores', () => {
    const wrapper = mount(RunIntroSplash, {
      props: {
        isOpen: true,
        scenarioName: 'The Monolith of Mild Despair',
        flavorText: 'You inherit a codebase where every change touches everything',
        playerClassName: 'Boundary Mage',
        scores: { morale: 40, delivery: 55 },
        stakeholders: {},
        maxTurns: 10
      }
    })

    expect(wrapper.text()).toContain('The council gathers')
    expect(wrapper.text()).toContain('The Monolith of Mild Despair')
    expect(wrapper.text()).toContain('You inherit a codebase where every change touches everything')
    expect(wrapper.text()).toContain('10 turns remain')
    expect(wrapper.text()).toContain('Join the adventure')
    expect(wrapper.text()).not.toContain('40')
    expect(wrapper.text()).not.toContain('55')
  })
})
