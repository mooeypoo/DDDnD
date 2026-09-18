import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TableSeat from '@/ui/play/table_seat.vue'

function mountSeat(extras: Record<string, unknown> = {}) {
  return mount(TableSeat, {
    props: {
      displayName: 'CTO',
      avatarRole: 'wizard',
      mood: 'concerned',
      slot: 'center',
      speechBubble: {
        text: 'This cut will cost us.',
        tone: 'concern',
      },
      ...extras,
    },
  })
}

describe('table seat speech bubbles', () => {
  it('keeps the bubble out of the seat until the council speaks', () => {
    const wrapper = mountSeat({ voicing: false })

    expect(wrapper.find('.seat-bubble').exists()).toBe(false)
    expect(wrapper.classes()).toContain('has-reaction')
  })

  it('shows the bubble while voicing, without relying on hover', () => {
    const wrapper = mountSeat({ voicing: true })

    expect(wrapper.find('.seat-bubble').exists()).toBe(true)
    expect(wrapper.find('.seat-bubble').text()).toContain('This cut will cost us.')
  })

  it('opens the last reaction on hover or tap after the beat', async () => {
    const wrapper = mountSeat({ voicing: false })

    await wrapper.trigger('mouseenter')
    expect(wrapper.find('.seat-bubble').exists()).toBe(true)

    await wrapper.trigger('mouseleave')
    expect(wrapper.find('.seat-bubble').exists()).toBe(false)

    await wrapper.trigger('click')
    expect(wrapper.find('.seat-bubble').exists()).toBe(true)
  })
})
