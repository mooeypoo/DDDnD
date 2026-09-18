import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RunIntroSplash from '@/ui/components/common/run_intro_splash.vue'

const baseProps = {
  isOpen: true,
  scenarioName: 'The Monolith of Mild Despair',
  flavorText: 'You inherit a codebase where every change touches everything',
  playerClassName: 'Boundary Mage',
  scores: { morale: 40, delivery: 55 },
  stakeholders: {},
  maxTurns: 10
}

describe('run_intro_splash table moment', () => {
  it('names the scenario and flavor without re-ledging scores', () => {
    const wrapper = mount(RunIntroSplash, { props: baseProps })

    expect(wrapper.text()).toContain('The council gathers')
    expect(wrapper.text()).toContain('The Monolith of Mild Despair')
    expect(wrapper.text()).toContain('You inherit a codebase where every change touches everything')
    expect(wrapper.text()).toContain('10 turns remain')
    expect(wrapper.text()).toContain('Join the adventure')
    expect(wrapper.text()).not.toContain('40')
    expect(wrapper.text()).not.toContain('55')
  })

  it('teaches the objective, the turn, and the tradeoff', () => {
    const wrapper = mount(RunIntroSplash, { props: baseProps })
    const text = wrapper.text()

    expect(text).toContain('Your charge')
    expect(text).toContain('Leave the system stronger than you found it')
    expect(text).toContain('How a turn goes')
    expect(text).toContain('A turn is one card')
    expect(text).toContain('The catch')
    expect(text).toContain('trades something away')
  })

  it('names the weakest scores as the current pressure', () => {
    const wrapper = mount(RunIntroSplash, {
      props: { ...baseProps, scores: { morale: 80, delivery: 22, user_trust: 15 } }
    })

    expect(wrapper.text()).toContain('user trust and delivery are the weakest right now')
  })

  it('invites first-timers to the tutorial only when asked to', async () => {
    const withoutInvite = mount(RunIntroSplash, { props: baseProps })
    expect(withoutInvite.find('.briefing-tutorial-link').exists()).toBe(false)

    const withInvite = mount(RunIntroSplash, {
      props: { ...baseProps, showTutorialInvite: true }
    })
    expect(withInvite.text()).toContain('First time?')

    await withInvite.find('.briefing-tutorial-link').trigger('click')
    expect(withInvite.emitted('startTutorial')).toHaveLength(1)
  })

  it('lets the player mute the briefing, but not during a tutorial', async () => {
    const wrapper = mount(RunIntroSplash, { props: baseProps })
    const checkbox = wrapper.find('.briefing-mute input')

    await checkbox.setValue(true)
    expect(wrapper.emitted('muteBriefing')).toEqual([[true]])

    const tutorial = mount(RunIntroSplash, { props: { ...baseProps, isTutorial: true } })
    expect(tutorial.find('.briefing-mute').exists()).toBe(false)
  })
})
