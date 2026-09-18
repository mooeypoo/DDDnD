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
