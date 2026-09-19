import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HandDock from '@/ui/play/hand_dock.vue'

describe('hand dock layout', () => {
  it('sits the player above consult, beside the fan', () => {
    const wrapper = mount(HandDock, {
      props: {
        cards: [],
        canConsult: true,
        playerName: 'Moriel',
        playerClassId: 'boundary_mage',
        playerClassName: 'Boundary Mage',
      },
    })

    const rail = wrapper.find('.player-rail')
    expect(rail.exists()).toBe(true)
    expect(rail.find('.player-seat').text()).toContain('Moriel')
    expect(rail.find('.consult-action').text()).toContain('Replace a card in hand')
    expect(wrapper.find('.hand-main').exists()).toBe(true)
  })
})
