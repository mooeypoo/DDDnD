import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/ui/components/common/AppInput.vue'
import AppSelect from '@/ui/components/common/AppSelect.vue'
import AppTabs from '@/ui/components/common/AppTabs.vue'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'

describe('AppInput accessibility id wiring', () => {
  it('keeps a stable generated id for label association across updates', async () => {
    const wrapper = mount(AppInput, {
      props: {
        label: 'Character name',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    const label = wrapper.find('label')
    const initialId = input.attributes('id')
    expect(initialId).toBeTruthy()
    expect(label.attributes('for')).toBe(initialId)

    await wrapper.setProps({ modelValue: 'Architect' })
    expect(wrapper.find('input').attributes('id')).toBe(initialId)
    expect(wrapper.find('label').attributes('for')).toBe(initialId)
  })
})

describe('AppSelect accessibility attrs', () => {
  it('forwards aria attributes to the native select element', () => {
    const wrapper = mount(AppSelect, {
      attrs: {
        'aria-label': 'Sort action cards'
      },
      props: {
        modelValue: 'default',
        options: [
          { value: 'default', label: 'Default' },
          { value: 'name', label: 'Name A → Z' }
        ]
      }
    })

    expect(wrapper.find('select').attributes('aria-label')).toBe('Sort action cards')
  })
})

describe('AppTabs keyboard navigation', () => {
  it('emits updated tab index for arrow and home/end keys', async () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs: ['One', 'Two', 'Three'],
        modelValue: 0
      }
    })

    await wrapper.findAll('button')[0].trigger('keydown', { key: 'ArrowRight' })
    await wrapper.setProps({ modelValue: 1 })
    await wrapper.findAll('button')[1].trigger('keydown', { key: 'ArrowLeft' })
    await wrapper.setProps({ modelValue: 0 })
    await wrapper.findAll('button')[0].trigger('keydown', { key: 'End' })
    await wrapper.setProps({ modelValue: 2 })
    await wrapper.findAll('button')[2].trigger('keydown', { key: 'Home' })

    expect(wrapper.emitted('update:modelValue')).toEqual([[1], [0], [2], [0]])
  })
})

describe('SurfaceModalPanel keyboard focus management', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('traps focus and restores opener focus when closed', async () => {
    const opener = document.createElement('button')
    opener.textContent = 'Open'
    document.body.appendChild(opener)
    opener.focus()

    const wrapper = mount(SurfaceModalPanel, {
      attachTo: document.body,
      props: {
        isOpen: true,
        title: 'A11y Test'
      },
      slots: {
        default: '<p>Body</p>',
        footer: '<button type="button">First action</button><button type="button">Last action</button>'
      }
    })

    await wrapper.vm.$nextTick()

    const modal = wrapper.find('.dungeon-modal')
    const focusable = modal.element.querySelectorAll<HTMLElement>('button')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    last.focus()
    await modal.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    await modal.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)

    await wrapper.setProps({ isOpen: false })
    await wrapper.vm.$nextTick()
    expect(document.activeElement).toBe(opener)
  })
})
