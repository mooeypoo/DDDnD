import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { PlayerClass } from '@/domains/content/model'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import RunSetupView from '@/ui/views/run_setup_view.vue'

const pushSpy = vi.fn()

let storeMock: any

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushSpy })
}))

vi.mock('@/ui/stores/game_store', () => ({
  useGameStore: () => storeMock
}))

function makeQuest(id: string, name: string): QuestDisplayModel {
  return {
    id,
    version: 1,
    name,
    description: `${name} description`,
    shortDescription: `${name} short`,
    flavorText: `${name} flavor`,
    turnCount: 8,
    stakeholderCount: 4,
    actionCardCount: 10
  }
}

function makeClass(id: string, name: string): PlayerClass {
  return {
    id,
    version: 1,
    name,
    description: `${name} description`,
    flavor_text: `${name} flavor`
  }
}

describe('run_setup_view quest integration', () => {
  beforeEach(() => {
    pushSpy.mockReset()

    storeMock = {
      isAboutModalOpen: false,
      isRulesModalOpen: false,
      isLoadingBundle: false,
      availableQuests: [
        makeQuest('monolith_of_mild_despair', 'The Monolith of Mild Despair'),
        makeQuest('microservice_sprawl', 'Microservice Sprawl')
      ],
      availableClasses: [makeClass('boundary_mage', 'Boundary Mage')],
      load_available_quests: vi.fn().mockResolvedValue(undefined),
      load_available_classes: vi.fn().mockResolvedValue(undefined),
      start_new_run: vi.fn().mockResolvedValue(undefined),
      openAboutModal: vi.fn(),
      closeAboutModal: vi.fn(),
      openRulesModal: vi.fn(),
      closeRulesModal: vi.fn()
    }
  })

  it('renders one quest card per configured quest', async () => {
    const wrapper = mount(RunSetupView)
    await flushPromises()

    const questCards = wrapper.findAll('.quest-card')
    expect(questCards).toHaveLength(2)
    expect(wrapper.text()).toContain('The Monolith of Mild Despair')
    expect(wrapper.text()).toContain('Microservice Sprawl')
  })

  it('starts the run with the selected quest id/version', async () => {
    const wrapper = mount(RunSetupView)
    await flushPromises()

    const questCards = wrapper.findAll('.quest-card')
    await questCards[1].trigger('click')

    await wrapper.find('.class-card').trigger('click')
    await wrapper.find('.btn-primary').trigger('click')

    expect(storeMock.start_new_run).toHaveBeenCalledWith({
      scenario_id: 'microservice_sprawl',
      scenario_version: 1,
      selected_class_ref: {
        id: 'boundary_mage',
        version: 1
      },
      character_name: undefined
    })
    expect(pushSpy).toHaveBeenCalledWith('/game')
  })
})
