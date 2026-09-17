import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import DungeonMasterModal from '@/ui/components/common/dungeon_master_modal.vue'

describe('chamber lore plaques', () => {
  it('About names the council, not a catalog', () => {
    const wrapper = mount(AboutModal, { props: { isOpen: true } })

    expect(wrapper.text()).toContain('join the council')
    expect(wrapper.text()).toContain('The council gathers around')
    expect(wrapper.text()).not.toContain('Stakeholders')
    expect(wrapper.text()).toContain('Vials')
    expect(wrapper.text()).not.toContain('Weather')
    expect(wrapper.text()).toContain('legal hand')
    expect(wrapper.text()).toContain('Grimoire')
    expect(wrapper.text()).toContain('Consult the Archives')
    expect(wrapper.text()).not.toContain('Action Satchel')
    expect(wrapper.text()).toContain('Return to the council')
  })

  it('How to play teaches the chamber the player actually joins', () => {
    const wrapper = mount(RulesModal, { props: { isOpen: true } })

    expect(wrapper.text()).toContain('legal hand')
    expect(wrapper.text()).toContain('Consult the Archives')
    expect(wrapper.text()).toContain('Grimoire')
    expect(wrapper.text()).toContain('Continue')
    expect(wrapper.text()).toContain('Keep the system in balance')
    expect(wrapper.text()).toContain('the council may speak')
    expect(wrapper.text()).toContain('The council gathers around the scene')
    expect(wrapper.text()).not.toContain('Stakeholders')
    expect(wrapper.text()).not.toContain('Balance the weather')
    expect(wrapper.text()).toContain("Those vials are the system's mood")
    expect(wrapper.text()).not.toContain('System Ledger')
    expect(wrapper.text()).not.toContain('Action Satchel')
    expect(wrapper.text()).not.toContain('archetype')
    expect(wrapper.text()).toContain('ending')
  })

  it('Dungeon Master is a maker mark, not a second rulebook', () => {
    const wrapper = mount(DungeonMasterModal, { props: { isOpen: true } })

    expect(wrapper.text()).toContain('Moriel Schottlender')
    expect(wrapper.text()).toContain("maker's mark")
    expect(wrapper.text()).toContain('Return to the council')
  })
})
