import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { PlayerClass } from '@/domains/content/model'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import CouncilLobby from '@/ui/play/council_lobby.vue'

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
    ...extras,
  }
}

function makeClass(id: string, name: string): PlayerClass {
  return {
    id,
    version: 1,
    name,
    description: `${name} description`,
    flavor_text: `${name} flavor`,
  }
}

const adventures = [
  makeQuest('monolith_of_mild_despair', 'The Monolith of Mild Despair'),
  makeQuest('microservice_sprawl', 'Microservice Sprawl'),
]

const tutorials = [
  makeQuest('tutorial_basics', 'The Basics', { isTutorial: true, tutorialOrder: 1, turnCount: 5, stakeholderCount: 2 }),
  makeQuest('tutorial_pressure', 'Systems Under Pressure', { isTutorial: true, tutorialOrder: 2, turnCount: 5, stakeholderCount: 2 }),
]

function mountLobby(selectedQuest: QuestDisplayModel | null = adventures[0]) {
  return mount(CouncilLobby, {
    props: {
      quests: adventures,
      tutorials,
      classes: [makeClass('boundary_mage', 'Boundary Mage')],
      modifiers: [],
      selectedQuest,
      selectedClass: makeClass('boundary_mage', 'Boundary Mage'),
      selectedModifier: null,
      characterName: '',
    },
  })
}

describe('council_lobby adventure fan', () => {
  it('fans adventures by default and does not mount a second tutorial row', () => {
    const wrapper = mountLobby()

    expect(wrapper.text()).toContain('Adventures')
    expect(wrapper.text()).toContain('Tutorials')
    expect(wrapper.text()).toContain('Choose your adventure')
    expect(wrapper.findAll('.table-quest')).toHaveLength(2)
    expect(wrapper.text()).toContain('The Monolith of Mild Despair')
    expect(wrapper.text()).not.toContain('Systems Under Pressure')
    expect(wrapper.find('.quest-fan').exists()).toBe(true)
    expect(wrapper.findAll('.fan-slot')).toHaveLength(2)
    expect(wrapper.text()).toContain('council of 4')
    expect(wrapper.text()).not.toContain('voices')
    expect(wrapper.find('.table-hook').text()).toContain('The Monolith of Mild Despair short')
    expect(wrapper.find('.table-flavor').text()).toContain('The Monolith of Mild Despair flavor')
    expect(wrapper.find('.brief-more').exists()).toBe(true)
    expect(
      wrapper.find('.quest-deck').element.compareDocumentPosition(wrapper.find('.table-stage').element)
        & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(wrapper.text()).toContain('Join the council')
  })

  it('swaps the fan to tutorials without launching a run', async () => {
    const wrapper = mountLobby()

    await wrapper.findAll('.deck-tab')[0].trigger('click')

    expect(wrapper.emitted('selectQuest')?.[0]?.[0]).toEqual(tutorials[0])
    expect(wrapper.emitted('sit')).toBeUndefined()
    expect(wrapper.emitted('launchTutorial')).toBeUndefined()
  })

  it('selects a tutorial card instead of launching it', async () => {
    const wrapper = mountLobby(tutorials[0])

    expect(wrapper.text()).toContain('Learn the ropes')
    expect(wrapper.findAll('.tutorial-mark')).toHaveLength(2)
    expect(wrapper.text()).toContain('The Basics')

    await wrapper.findAll('.table-quest')[1].trigger('click')

    expect(wrapper.emitted('selectQuest')?.[0]?.[0]).toMatchObject({ id: 'tutorial_pressure' })
    expect(wrapper.emitted('sit')).toBeUndefined()
  })

  it('opens a briefing plaque from Read more', async () => {
    const wrapper = mountLobby(makeQuest('monolith_of_mild_despair', 'The Monolith of Mild Despair', {
      councilNames: ['CTO', 'Tech Lead'],
      startingScores: { team_morale: 32 },
    }))

    await wrapper.find('.brief-more').trigger('click')

    expect(wrapper.text()).toContain('The Monolith of Mild Despair description')
    expect(wrapper.text()).toContain('CTO')
    expect(wrapper.text()).toContain('Tech Lead')
    expect(wrapper.text()).toContain('32 · Troubled')
  })
})
