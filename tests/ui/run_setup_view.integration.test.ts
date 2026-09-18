import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { PlayerClass } from '@/domains/content/model'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import RunSetupView from '@/ui/views/run_setup_view.vue'

const pushSpy = vi.fn()
const routeQuery: Record<string, string> = {}

let storeMock: any

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushSpy }),
  useRoute: () => ({ query: routeQuery })
}))

vi.mock('@/ui/stores/game_store', () => ({
  useGameStore: () => storeMock
}))

function makeQuest(id: string, name: string, extras: Partial<QuestDisplayModel> = {}): QuestDisplayModel {
  return {
    id,
    version: 1,
    name,
    description: `${name} description`,
    shortDescription: `${name} short`,
    flavorText: `${name} flavor`,
    turnCount: 8,
    stakeholderCount: 4,
    actionCardCount: 10,
    ...extras
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
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })

    // Ensure the default tab is 'quests' for tests
    localStorage.setItem('dddnd.tutorialsComplete', 'true')
    pushSpy.mockReset()
    for (const key of Object.keys(routeQuery)) {
      delete routeQuery[key]
    }

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
      load_available_tutorials: vi.fn().mockResolvedValue(undefined),
      availableTutorials: [],
      isLoadingTutorials: false,
      start_new_run: vi.fn().mockResolvedValue(undefined),
      load_available_challenge_modifiers: vi.fn().mockResolvedValue(undefined),
      availableChallengeModifiers: [],
      isDungeonMasterModalOpen: false,
      openDungeonMasterModal: vi.fn(),
      closeDungeonMasterModal: vi.fn(),
      openAboutModal: vi.fn(),
      closeAboutModal: vi.fn(),
      openRulesModal: vi.fn(),
      closeRulesModal: vi.fn()
    }
  })

  afterEach(() => {
    // Clean up localStorage to avoid side effects
    localStorage.removeItem('dddnd.tutorialsComplete')
  })

  it('renders one quest card per configured quest', async () => {
    const wrapper = mount(RunSetupView)
    await flushPromises()

    const questCards = wrapper.findAll('.table-quest')
    expect(questCards).toHaveLength(2)
    expect(wrapper.findAll('.class-seat')).toHaveLength(1)
    expect(wrapper.find('.rim-seats').exists()).toBe(true)
    expect(wrapper.text()).toContain('The Monolith of Mild Despair')
    expect(wrapper.text()).toContain('Microservice Sprawl')
    expect(wrapper.text()).toContain('Boundary Mage')
  })

  it('opens on the easiest adventure even when the pack listed a harder one first', async () => {
    storeMock.availableQuests = [
      makeQuest('microservice_sprawl', 'Microservice Sprawl'),
      makeQuest('monolith_of_mild_despair', 'The Monolith of Mild Despair'),
      makeQuest('merger_of_minor_chaos', 'The Merger of Minor Chaos'),
    ]

    const wrapper = mount(RunSetupView)
    await flushPromises()

    expect(wrapper.find('.table-nameplate').text()).toBe('The Merger of Minor Chaos')
    expect(wrapper.find('.fan-slot.is-selected .quest-name').text()).toBe('The Merger of Minor Chaos')
    expect(wrapper.findAll('.quest-difficulty').map((mark) => mark.text())).toEqual([
      'Easy',
      'Normal',
      'Hard',
    ])

    await wrapper.find('.sit-btn').trigger('click')

    expect(storeMock.start_new_run).toHaveBeenCalledWith(expect.objectContaining({
      scenario_id: 'merger_of_minor_chaos',
    }))
  })

  it('starts the run with the selected quest id/version', async () => {
    const wrapper = mount(RunSetupView)
    await flushPromises()

    const questCards = wrapper.findAll('.table-quest')
    await questCards[1].trigger('click')
    await wrapper.find('.sit-btn').trigger('click')

    expect(storeMock.start_new_run).toHaveBeenCalledWith({
      scenario_id: 'microservice_sprawl',
      scenario_version: 1,
      selected_class_ref: {
        id: 'boundary_mage',
        version: 1
      },
      character_name: undefined,
      is_tutorial: false
    })
    expect(pushSpy).toHaveBeenCalledWith('/game')
  })

  it('selects a lobby tutorial and joins through start_new_run', async () => {
    storeMock.availableTutorials = [
      makeQuest('tutorial_basics', 'The Basics', {
        isTutorial: true,
        tutorialOrder: 1,
        turnCount: 5,
        stakeholderCount: 2
      }),
      makeQuest('tutorial_pressure', 'Systems Under Pressure', {
        isTutorial: true,
        tutorialOrder: 2,
        turnCount: 5,
        stakeholderCount: 2
      })
    ]

    const wrapper = mount(RunSetupView)
    await flushPromises()

    await wrapper.findAll('.deck-tab')[0].trigger('click')
    await flushPromises()

    expect(storeMock.start_new_run).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('The Basics')
    expect(wrapper.text()).toContain('Tutorial')

    await wrapper.findAll('.table-quest')[1].trigger('click')
    await wrapper.find('.sit-btn').trigger('click')
    await flushPromises()

    expect(storeMock.start_new_run).toHaveBeenCalledWith({
      scenario_id: 'tutorial_pressure',
      scenario_version: 1,
      selected_class_ref: {
        id: 'boundary_mage',
        version: 1
      },
      character_name: undefined,
      is_tutorial: true
    })
    expect(pushSpy).toHaveBeenCalledWith('/game')
  })

  it('auto-launches a door tutorial without waiting on Join', async () => {
    routeQuery.tutorial = 'basics'
    storeMock.availableTutorials = [
      makeQuest('tutorial_basics', 'The Basics', {
        isTutorial: true,
        tutorialOrder: 1,
        turnCount: 5,
        stakeholderCount: 2
      })
    ]

    mount(RunSetupView)
    await flushPromises()

    expect(storeMock.start_new_run).toHaveBeenCalledWith({
      scenario_id: 'tutorial_basics',
      scenario_version: 1,
      selected_class_ref: {
        id: 'boundary_mage',
        version: 1
      },
      is_tutorial: true
    })
    expect(pushSpy).toHaveBeenCalledWith('/game')
  })
})
