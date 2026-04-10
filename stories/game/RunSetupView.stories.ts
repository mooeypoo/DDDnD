import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'
import RunSetupView from '@/ui/views/run_setup_view.vue'
import { useGameStore } from '@/ui/stores/game_store'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'

// vue-router is provided globally by .storybook/preview.ts

const meta: Meta<typeof RunSetupView> = {
  title: 'Views/RunSetupView',
  component: RunSetupView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  beforeEach() {
    setActivePinia(createPinia())
  }
}

export default meta

type Story = StoryObj<typeof meta>

// Mock quest data for stories
const mockQuests: QuestDisplayModel[] = [
  {
    id: 'monolith_of_mild_despair',
    version: 1,
    name: 'The Monolith of Mild Despair',
    description: 'A legacy monolith is slowing delivery and blurring domain boundaries.',
    shortDescription: 'Stabilize a tangled legacy monolith before delivery confidence collapses.',
    flavorText: 'You inherit a codebase where every change touches everything',
    turnCount: 8,
    stakeholderCount: 4,
    actionCardCount: 10
  },
  {
    id: 'microservice_chaos',
    version: 1,
    name: 'The Microservice Maelstrom',
    description: 'Services are multiplying and coordination is chaos.',
    shortDescription: 'Tame the microservice sprawl before operations collapses.',
    flavorText: 'Every service deployment is an adventure',
    turnCount: 10,
    stakeholderCount: 5,
    actionCardCount: 12
  }
]

/**
 * Default story showing the setup view with quests loaded and ready for selection
 */
export const Default: Story = {
  async beforeEach() {
    setActivePinia(createPinia())
    const store = useGameStore()
    // Simulate loaded quests
    store.availableQuests = mockQuests
    // Simulate loaded classes
    store.availableClasses = [
      { id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'Expert at bounded contexts', flavor_text: 'Clear boundaries keep the codebase at peace' },
      { id: 'stakeholder_bard', version: 1, name: 'Stakeholder Bard', description: 'Master of stakeholder relations', flavor_text: 'A well-told story smooths the path forward' },
      { id: 'reliability_cleric', version: 1, name: 'Reliability Cleric', description: 'Guardian of system health', flavor_text: 'Stability is the foundation of all progress' },
      { id: 'legacy_ranger', version: 1, name: 'Legacy Ranger', description: 'Scout of inherited code', flavor_text: 'Every system has history; honor it' },
      { id: 'delivery_rogue', version: 1, name: 'Delivery Rogue', description: 'Swift executor of change', flavor_text: 'Speed matters when the deadline approaches' }
    ]
  }
}

/**
 * Story showing the view while quests are still loading
 */
export const LoadingQuests: Story = {
  async beforeEach() {
    setActivePinia(createPinia())
    const store = useGameStore()
    // Simulate loading state - no quests yet
    store.isLoadingQuests = true
    store.availableClasses = [
      { id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'Expert at bounded contexts', flavor_text: 'Clear boundaries' }
    ]
  }
}

/**
 * Story showing the view with a single quest (MVP case)
 */
export const SingleQuest: Story = {
  async beforeEach() {
    setActivePinia(createPinia())
    const store = useGameStore()
    store.availableQuests = [mockQuests[0]] // Only first quest
    store.availableClasses = [
      { id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'Expert at bounded contexts', flavor_text: 'Clear boundaries keep the codebase at peace' },
      { id: 'stakeholder_bard', version: 1, name: 'Stakeholder Bard', description: 'Master of stakeholder relations', flavor_text: 'A well-told story smooths the path forward' },
      { id: 'reliability_cleric', version: 1, name: 'Reliability Cleric', description: 'Guardian of system health', flavor_text: 'Stability is the foundation of all progress' },
      { id: 'legacy_ranger', version: 1, name: 'Legacy Ranger', description: 'Scout of inherited code', flavor_text: 'Every system has history; honor it' },
      { id: 'delivery_rogue', version: 1, name: 'Delivery Rogue', description: 'Swift executor of change', flavor_text: 'Speed matters when the deadline approaches' }
    ]
  }
}

/**
 * Story showing the view with multiple quests for future expansion
 */
export const MultipleQuests: Story = {
  name: 'Multiple Quests (Future Expansion)',
  async beforeEach() {
    setActivePinia(createPinia())
    const store = useGameStore()
    store.availableQuests = mockQuests
    store.availableClasses = [
      { id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'Expert at bounded contexts', flavor_text: 'Clear boundaries keep the codebase at peace' },
      { id: 'stakeholder_bard', version: 1, name: 'Stakeholder Bard', description: 'Master of stakeholder relations', flavor_text: 'A well-told story smooths the path forward' },
      { id: 'reliability_cleric', version: 1, name: 'Reliability Cleric', description: 'Guardian of system health', flavor_text: 'Stability is the foundation of all progress' },
      { id: 'legacy_ranger', version: 1, name: 'Legacy Ranger', description: 'Scout of inherited code', flavor_text: 'Every system has history; honor it' },
      { id: 'delivery_rogue', version: 1, name: 'Delivery Rogue', description: 'Swift executor of change', flavor_text: 'Speed matters when the deadline approaches' }
    ]
  }
}

/**
 * Story showing the view when no quests are available (error case)
 */
export const NoQuestsAvailable: Story = {
  async beforeEach() {
    setActivePinia(createPinia())
    const store = useGameStore()
    store.availableQuests = [] // No quests
    store.availableClasses = [
      { id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'Expert at bounded contexts', flavor_text: 'Clear boundaries' }
    ]
  }
}

/**
 * Story showing the Tutorials tab with two mock tutorials loaded.
 * Demonstrates the dungeon-styled QuestCard tutorial variant, the Compass sigil,
 * purple-tinted inset, and "Enter Tutorial →" action label.
 */
export const TutorialsTab: Story = {
  name: 'Tutorials Tab',
  async beforeEach() {
    setActivePinia(createPinia())
    const store = useGameStore()
    store.availableQuests = mockQuests
    store.availableClasses = [
      { id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'Expert at bounded contexts', flavor_text: 'Clear boundaries keep the codebase at peace' },
      { id: 'stakeholder_bard', version: 1, name: 'Stakeholder Bard', description: 'Master of stakeholder relations', flavor_text: 'A well-told story smooths the path forward' }
    ]
    store.availableTutorials = [
      {
        id: 'tutorial_basics',
        version: 1,
        name: 'The First Domain',
        description: 'A short guided mission that walks you through stakeholder management, card plays, and the Core Score.',
        shortDescription: 'A step-by-step introduction to DDDnD mechanics.',
        turnCount: 3,
        stakeholderCount: 2,
        actionCardCount: 5,
        isTutorial: true,
        tutorialOrder: 1
      } satisfies QuestDisplayModel,
      {
        id: 'tutorial_advanced',
        version: 1,
        name: 'The Tangled Dependency',
        description: 'Navigate an architecture dilemma involving conflicting stakeholders and scarce technical runway.',
        shortDescription: 'Apply everything you learned in a more complex scenario.',
        turnCount: 5,
        stakeholderCount: 3,
        actionCardCount: 8,
        isTutorial: true,
        tutorialOrder: 2
      } satisfies QuestDisplayModel
    ]
  }
}

// Shared class data reused across stories
const mockClasses = [
  { id: 'boundary_mage',     version: 1, name: 'Boundary Mage',      description: 'Expert at bounded contexts',         flavor_text: 'Clear boundaries keep the codebase at peace' },
  { id: 'stakeholder_bard',  version: 1, name: 'Stakeholder Bard',   description: 'Master of stakeholder relations',    flavor_text: 'A well-told story smooths the path forward' },
  { id: 'reliability_cleric',version: 1, name: 'Reliability Cleric', description: 'Guardian of system health',         flavor_text: 'Stability is the foundation of all progress' },
  { id: 'legacy_ranger',     version: 1, name: 'Legacy Ranger',      description: 'Scout of inherited code',           flavor_text: 'Every system has history; honor it' },
  { id: 'delivery_rogue',    version: 1, name: 'Delivery Rogue',     description: 'Swift executor of change',          flavor_text: 'Speed matters when the deadline approaches' },
]

/**
 * Quests tab with all five ClassCards visible beneath the quest grid.
 * Demonstrates the dungeon ClassCard accent spectrum alongside quest selection.
 */
export const QuestsTabWithClasses: Story = {
  name: 'Quests Tab — With Class Selection',
  async beforeEach() {
    setActivePinia(createPinia())
    const store = useGameStore()
    store.availableQuests = mockQuests
    store.availableClasses = mockClasses
  }
}
