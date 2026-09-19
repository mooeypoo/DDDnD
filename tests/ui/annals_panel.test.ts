import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AnnalsPanel from '@/ui/play/annals_panel.vue'
import type { AnnalsTurn } from '@/ui/play/turn_theater'

const turns: AnnalsTurn[] = [
  {
    turn_number: 2,
    intent: 'consult_archives',
    title: 'Consult the Archives',
    summary: 'You searched instead of committing.',
    score_changes: [{ score_id: 'budget', delta: -2 }],
    stakeholder_changes: [],
    beats: [],
  },
  {
    turn_number: 1,
    intent: 'play_card',
    title: 'Draw a boundary',
    summary: 'You played Draw a Bounded Context.',
    score_changes: [],
    stakeholder_changes: [],
    beats: [],
  },
]

describe('annals as a book', () => {
  it('opens on the latest turn and flips earlier then later', async () => {
    const wrapper = mount(AnnalsPanel, {
      props: { isOpen: true, turns },
      global: {
        stubs: {
          Transition: {
            template: '<div class="transition-stub"><slot /></div>',
          },
        },
      },
    })

    expect(wrapper.find('.annals-folio').text()).toContain('Turn 2 of 2')
    expect(wrapper.text()).toContain('Consult the Archives')
    expect(wrapper.text()).toContain('You searched')

    const [previous, next] = wrapper.findAll('.annals-flip')
    expect(next.attributes('disabled')).toBeDefined()

    await previous.trigger('click')
    expect(wrapper.find('.annals-folio').text()).toContain('Turn 1 of 2')
    expect(wrapper.text()).toContain('Draw a boundary')
    expect(wrapper.text()).toContain('You played')

    await wrapper.findAll('.annals-flip')[1].trigger('click')
    expect(wrapper.find('.annals-folio').text()).toContain('Turn 2 of 2')
    expect(wrapper.text()).toContain('Consult the Archives')
  })
})
