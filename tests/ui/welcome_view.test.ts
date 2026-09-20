import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WelcomeView from '@/ui/views/welcome_view.vue'

const pushSpy = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushSpy })
}))

const storeState = { shouldRecommendTutorial: true }

vi.mock('@/ui/stores/game_store', () => ({
  useGameStore: () => ({
    isAboutModalOpen: false,
    isRulesModalOpen: false,
    isDungeonMasterModalOpen: false,
    get shouldRecommendTutorial() {
      return storeState.shouldRecommendTutorial
    },
    openAboutModal: vi.fn(),
    openRulesModal: vi.fn(),
    openDungeonMasterModal: vi.fn(),
    closeAboutModal: vi.fn(),
    closeRulesModal: vi.fn(),
    closeDungeonMasterModal: vi.fn()
  })
}))

describe('welcome_view chamber door', () => {
  it('is a door into the table, not a marketing landing', () => {
    const wrapper = mount(WelcomeView)

    expect(wrapper.text()).toContain('Choose Your Quest.')
    expect(wrapper.text()).toContain('Shape the System.')
    expect(wrapper.text()).toContain('A council is gathering')
    expect(wrapper.text()).toContain('Welcome, architecture explorer')
    expect(wrapper.text()).toContain('The system needs you')
    expect(wrapper.text()).toContain('adventure of software architecture')
    expect(wrapper.text()).toContain('Join the council')
    expect(wrapper.text()).not.toContain('sit with the council')
    expect(wrapper.text()).toContain('worthy ending')
    expect(wrapper.text()).not.toContain('Start Your Journey')
    expect(wrapper.find('.sit-btn').text()).toContain('Enter the chamber')
  })

  it('sends Sit to the lobby without starting a run', async () => {
    const wrapper = mount(WelcomeView)
    await wrapper.find('.sit-btn').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/play')
  })

  it('names the objective in plain words, without table vocabulary', () => {
    const wrapper = mount(WelcomeView)
    const text = wrapper.text().replace(/\s+/g, ' ')

    expect(text).toContain('Leave the system stronger than you found it')
    expect(text).toContain('keep the council with you')
    expect(text).toContain('before the turns run out')
    expect(text).not.toContain('Grimoire')
    expect(text).not.toContain('aftershock')
    expect(text).not.toContain('bounded context')
  })

  it('breaks the quest into scannable plaques instead of a wall of prose', () => {
    const wrapper = mount(WelcomeView)
    const plaques = wrapper.findAll('.door-scroll li')

    expect(plaques).toHaveLength(3)
    expect(wrapper.findAll('.scroll-label').map((node) => node.text()))
      .toEqual(['Your quest', 'Each turn', 'The catch'])

    // The goal sits in its own plaque, not buried in a paragraph.
    expect(plaques[0].text().replace(/\s+/g, ' '))
      .toContain('Leave the system stronger than you found it')
  })

  it('promotes the tutorial until the player has finished one', async () => {
    storeState.shouldRecommendTutorial = true
    const inviting = mount(WelcomeView)
    expect(inviting.find('.teach-btn').text()).toContain('New here?')

    await inviting.find('.teach-btn').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ path: '/play', query: { tutorial: 'basics' } })

    storeState.shouldRecommendTutorial = false
    const returning = mount(WelcomeView)
    expect(returning.find('.teach-btn').exists()).toBe(false)
    expect(returning.text()).toContain('Basics tutorial')
    storeState.shouldRecommendTutorial = true
  })
})
