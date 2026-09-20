import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import TutorialPointerArrow from '@/ui/components/tutorial/tutorial_pointer_arrow.vue'
import { tutorialPointerSelector } from '@/ui/play/tutorial_pointer'

describe('tutorialPointerSelector', () => {
  it('anchors a required card, not the whole dock', () => {
    expect(tutorialPointerSelector('tutorial_plan_ahead', 'satchel')).toBe(
      '.fan-slot[data-card-id="tutorial_plan_ahead"]',
    )
  })

  it('aliases satchel to the hand dock', () => {
    expect(tutorialPointerSelector(null, 'satchel')).toBe('[data-play-highlight="hand"]')
    expect(tutorialPointerSelector(null, 'hand')).toBe('[data-play-highlight="hand"]')
  })

  it('points weather, seats, aftershocks, coupling, and consult at table anchors', () => {
    expect(tutorialPointerSelector(null, 'scores')).toBe('[data-play-highlight="weather"]')
    expect(tutorialPointerSelector(null, 'stakeholders')).toBe('[data-play-highlight="stakeholders"]')
    expect(tutorialPointerSelector(null, 'aftershocks')).toContain('aftershocks')
    expect(tutorialPointerSelector(null, 'coupling')).toContain('coupling')
    expect(tutorialPointerSelector(null, 'consult')).toBe('[data-play-highlight="consult"]')
  })

  it('points a consult step at Consult, not the discard card, until the Grimoire opens', () => {
    expect(
      tutorialPointerSelector('tutorial_deep_refactor', 'consult', { requiredVerb: 'consult' }),
    ).toBe('[data-play-highlight="consult"]')
    expect(
      tutorialPointerSelector('tutorial_deep_refactor', 'consult', {
        requiredVerb: 'consult',
        consultMode: true,
      }),
    ).toBeNull()
  })
})

describe('TutorialPointerArrow', () => {
  it('places the arrow above the highlighted card box', async () => {
    const card = document.createElement('div')
    card.className = 'fan-slot'
    card.setAttribute('data-card-id', 'tutorial_plan_ahead')
    Object.defineProperty(card, 'getBoundingClientRect', {
      value: () => ({
        x: 300,
        y: 400,
        top: 400,
        left: 300,
        width: 120,
        height: 160,
        bottom: 560,
        right: 420,
        toJSON: () => ({}),
      }),
    })
    document.body.appendChild(card)

    const wrapper = mount(TutorialPointerArrow, {
      props: {
        show: true,
        selector: '.fan-slot[data-card-id="tutorial_plan_ahead"]',
      },
      attachTo: document.body,
    })

    await nextTick()
    const arrow = wrapper.get('.tutorial-arrow').element as HTMLElement
    expect(arrow.style.left).toBe('336px')
    expect(arrow.style.top).toBe('334px')

    wrapper.unmount()
    card.remove()
  })
})
