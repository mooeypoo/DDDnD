import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WelcomeView from '@/ui/views/welcome_view.vue'

const pushSpy = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushSpy })
}))

vi.mock('@/ui/stores/game_store', () => ({
  useGameStore: () => ({
    isAboutModalOpen: false,
    isRulesModalOpen: false,
    isDungeonMasterModalOpen: false,
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
    expect(wrapper.text()).toContain('join the council')
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
})
