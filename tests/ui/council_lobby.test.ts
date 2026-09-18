import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
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

async function mountLobby(
  selectedQuest: QuestDisplayModel | null = adventures[0],
  extras: Record<string, unknown> = {},
) {
  const wrapper = mount(CouncilLobby, {
    props: {
      quests: adventures,
      tutorials,
      classes: [makeClass('boundary_mage', 'Boundary Mage')],
      modifiers: [],
      selectedQuest,
      selectedClass: makeClass('boundary_mage', 'Boundary Mage'),
      selectedModifier: null,
      characterName: '',
      ...extras,
    },
  })
  await flushPromises()
  return wrapper
}

describe('council_lobby adventure fan', () => {
  it('fans adventures by default and does not mount a second tutorial row', async () => {
    const wrapper = await mountLobby()

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
    const wrapper = await mountLobby()

    await wrapper.findAll('.deck-tab')[0].trigger('click')

    expect(wrapper.emitted('selectQuest')?.[0]?.[0]).toEqual(tutorials[0])
    expect(wrapper.emitted('sit')).toBeUndefined()
    expect(wrapper.emitted('launchTutorial')).toBeUndefined()
  })

  it('selects a tutorial card instead of launching it', async () => {
    const wrapper = await mountLobby(tutorials[0])

    expect(wrapper.text()).toContain('Learn the ropes')
    expect(wrapper.findAll('.tutorial-mark')).toHaveLength(2)
    expect(wrapper.text()).toContain('The Basics')

    await wrapper.findAll('.table-quest')[1].trigger('click')

    expect(wrapper.emitted('selectQuest')?.[0]?.[0]).toMatchObject({ id: 'tutorial_pressure' })
    expect(wrapper.emitted('sit')).toBeUndefined()
  })

  it('says what varies between adventures and marks how hard each one is', async () => {
    const wrapper = await mountLobby()

    const blurb = wrapper.find('.row-blurb').text()
    expect(blurb).toContain('starting health')
    expect(blurb).toContain('council')
    expect(blurb).toContain('clock')

    const marks = wrapper.findAll('.quest-difficulty')
    expect(marks.map((mark) => mark.text())).toEqual(['Normal', 'Hard'])
    expect(marks[1].attributes('title')).toContain('unforgiving')
  })

  it('fans adventures easy to hard whatever order they arrive in', async () => {
    const shuffled = [
      makeQuest('microservice_sprawl', 'Microservice Sprawl'),
      makeQuest('startup_hypergrowth', 'Startup Hypergrowth'),
      makeQuest('merger_of_minor_chaos', 'The Merger of Minor Chaos'),
      makeQuest('compliance_gauntlet', 'Compliance Gauntlet'),
      makeQuest('monolith_of_mild_despair', 'The Monolith of Mild Despair'),
    ]
    const wrapper = mount(CouncilLobby, {
      props: {
        quests: shuffled,
        tutorials,
        classes: [makeClass('boundary_mage', 'Boundary Mage')],
        modifiers: [],
        selectedQuest: shuffled[0],
        selectedClass: makeClass('boundary_mage', 'Boundary Mage'),
        selectedModifier: null,
        characterName: '',
      },
    })
    await flushPromises()

    expect(wrapper.findAll('.quest-difficulty').map((mark) => mark.text())).toEqual([
      'Easy',
      'Normal',
      'Normal',
      'Normal',
      'Hard',
    ])
    expect(wrapper.findAll('.quest-name').map((name) => name.text())).toEqual([
      'The Merger of Minor Chaos',
      'The Monolith of Mild Despair',
      'Compliance Gauntlet',
      'Startup Hypergrowth',
      'Microservice Sprawl',
    ])
  })

  it('picks the easiest adventure when returning from tutorials', async () => {
    const shuffled = [
      makeQuest('microservice_sprawl', 'Microservice Sprawl'),
      makeQuest('merger_of_minor_chaos', 'The Merger of Minor Chaos'),
      makeQuest('monolith_of_mild_despair', 'The Monolith of Mild Despair'),
    ]
    const wrapper = mount(CouncilLobby, {
      props: {
        quests: shuffled,
        tutorials,
        classes: [makeClass('boundary_mage', 'Boundary Mage')],
        modifiers: [],
        selectedQuest: tutorials[0],
        selectedClass: makeClass('boundary_mage', 'Boundary Mage'),
        selectedModifier: null,
        characterName: '',
      },
    })
    await flushPromises()

    await wrapper.findAll('.deck-tab')[1].trigger('click')

    const picked = wrapper.emitted('selectQuest')
    expect(picked?.[picked.length - 1]?.[0]).toMatchObject({ id: 'merger_of_minor_chaos' })
  })

  it('marks tutorials as tutorials rather than grading them', async () => {
    const wrapper = await mountLobby(tutorials[0])

    expect(wrapper.findAll('.tutorial-mark')).toHaveLength(2)
    expect(wrapper.findAll('.quest-difficulty')).toHaveLength(0)
    expect(wrapper.find('.row-blurb').text()).toContain('guided runs')
  })

  it('heads the seat row and marks the chosen class as chosen', async () => {
    const wrapper = await mountLobby()

    expect(wrapper.find('.rim-kicker').text()).toBe('Choose your class')

    const seat = wrapper.find('.class-seat')
    expect(seat.classes()).toContain('selected')
    expect(seat.attributes('aria-pressed')).toBe('true')
  })

  it('opens a briefing plaque from Read more', async () => {
    const wrapper = await mountLobby(makeQuest('monolith_of_mild_despair', 'The Monolith of Mild Despair', {
      councilNames: ['CTO', 'Tech Lead'],
      startingScores: { team_morale: 32 },
    }))

    await wrapper.find('.brief-more').trigger('click')

    expect(wrapper.text()).toContain('The Monolith of Mild Despair description')
    expect(wrapper.text()).toContain('CTO')
    expect(wrapper.text()).toContain('Tech Lead')
    expect(wrapper.text()).toContain('32 · Troubled')
  })

  it('holds a chamber veil while content or scenes are still arriving', async () => {
    const wrapper = await mountLobby(adventures[0], { isLoading: true })

    expect(wrapper.classes()).toContain('is-awaiting-chamber')
    expect(wrapper.find('.chamber-veil').exists()).toBe(true)
    expect(wrapper.text()).toContain('The council is gathering')
    expect(wrapper.text()).toContain('Lighting the chamber')
    expect(wrapper.find('.sit-btn').attributes('disabled')).toBeDefined()
  })

  it('lifts the chamber veil once assets and content are ready', async () => {
    const wrapper = await mountLobby()

    expect(wrapper.classes()).not.toContain('is-awaiting-chamber')
    expect(wrapper.find('.chamber-veil').exists()).toBe(false)
    expect(wrapper.find('.sit-btn').text()).toContain('Join this adventure')
  })
})
