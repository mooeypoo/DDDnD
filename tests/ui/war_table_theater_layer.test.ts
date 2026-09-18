import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WarTable from '@/ui/play/war_table.vue'
import type { TurnBeat } from '@/ui/play/turn_theater'

const playBeat: TurnBeat = {
  id: 'action-1',
  kind: 'action',
  title: 'Draw a boundary',
  summary: 'You play Draw a Bounded Context.',
  score_changes: [],
  stakeholder_changes: [],
}

function mountTable(extras: Record<string, unknown> = {}) {
  return mount(WarTable, {
    attachTo: document.body,
    props: {
      actors: [],
      sceneId: 'strategic_war_room',
      currentBeat: playBeat,
      beatIndex: 1,
      beatCount: 2,
      ...extras,
    },
  })
}

describe('war table theater plaques', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('pins You play above the table so the hand cannot cover Continue', () => {
    const wrapper = mountTable()
    const layer = document.body.querySelector('.table-focus') as HTMLElement | null
    const plaque = document.body.querySelector('.turn-beat') as HTMLElement | null

    expect(layer).not.toBeNull()
    expect(plaque).not.toBeNull()
    expect(wrapper.element.contains(layer)).toBe(false)
    expect(layer!.parentElement).toBe(document.body)
    expect(document.body.textContent).toContain('You play')
    expect(document.body.textContent).toContain('Continue')
    expect(document.body.textContent).toContain('Skip remaining')
    const continueBtn = document.body.querySelector('.beat-continue')
    const skipBtn = document.body.querySelector('.beat-skip')
    expect(continueBtn?.nextElementSibling).toBe(skipBtn)

    wrapper.unmount()
  })

  it('drops a system omen from the viewport, not an aftershock bolt', () => {
    const wrapper = mountTable({
      currentBeat: null,
      fxKind: 'event',
      fxTone: 'mixed',
    })
    const omen = document.body.querySelector('.system-omen') as HTMLElement | null

    expect(omen).not.toBeNull()
    expect(wrapper.element.contains(omen)).toBe(false)
    expect(omen!.querySelector('.omen-shaft')).not.toBeNull()
    expect(omen!.querySelector('.omen-seal')).not.toBeNull()
    expect(wrapper.find('.aftershock-strike').exists()).toBe(false)
    expect(wrapper.find('.table-board').classes()).toContain('is-omen')

    wrapper.unmount()
  })

  it('marks the system plaque as a decree, not a broken tablet', () => {
    const eventBeat: TurnBeat = {
      id: 'event-1',
      kind: 'event',
      title: 'Incident review',
      summary: 'The system moves.',
      score_changes: [],
      stakeholder_changes: [],
      event_id: 'incident_review',
    }
    const wrapper = mountTable({ currentBeat: eventBeat })
    const plaque = document.body.querySelector('.turn-beat') as HTMLElement | null

    expect(plaque).not.toBeNull()
    expect(plaque!.classList.contains('kind-event')).toBe(true)
    expect(plaque!.querySelector('.omen-rule')).not.toBeNull()
    expect(plaque!.querySelector('.impact-rule')).toBeNull()
    expect(document.body.textContent).toContain('The system moves')

    wrapper.unmount()
  })

  it('keeps the adjourn plate on the same viewport layer', () => {
    const wrapper = mountTable({ currentBeat: null, isAdjourned: true })
    const layer = document.body.querySelector('.table-focus') as HTMLElement | null

    expect(layer).not.toBeNull()
    expect(wrapper.element.contains(layer)).toBe(false)
    expect(document.body.textContent).toContain('The council adjourns')
    expect(document.body.textContent).toContain('View Results')

    wrapper.unmount()
  })
})
