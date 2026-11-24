/**
 * The Studio shell (docs/PACK_STUDIO.md): its name and subtitle, and the
 * text-size setting (§10), which works with or without storage.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import DisplayMenu from '@studio/components/display_menu.vue'
import StudioHeader from '@studio/components/studio_header.vue'
import { applyTextSize, readTextSize, writeTextSize } from '@studio/preferences/text_size'

describe('Studio header', () => {
  it('leads with "DDDnD Pack Studio", subtitled "The Forge" (D11)', () => {
    const wrapper = mount(StudioHeader, { props: { textSize: 'standard' } })
    expect(wrapper.find('.brand-name').text()).toBe('DDDnD Pack Studio')
    expect(wrapper.find('.brand-subtitle').text()).toBe('The Forge')
  })

  it('keeps display settings behind one button', () => {
    const wrapper = mount(StudioHeader, { props: { textSize: 'standard' } })
    const toggle = wrapper.find('.display-toggle')
    expect(toggle.attributes('aria-label')).toBe('Display settings')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.display-panel').exists()).toBe(false)
  })
})

describe('display menu (§10)', () => {
  it('opens a labelled text-size group with the current size checked, and focuses it', async () => {
    const wrapper = mount(DisplayMenu, { props: { textSize: 'large' }, attachTo: document.body })
    await wrapper.find('.display-toggle').trigger('click')
    await flushPromises()
    expect(wrapper.find('.display-toggle').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('legend').text()).toBe('Text size')
    const radios = wrapper.findAll<HTMLInputElement>('input[type="radio"]')
    expect(radios.map((radio) => radio.element.closest('label')?.textContent?.replace('A', '').trim())).toEqual(['Standard', 'Large', 'Largest'])
    expect(radios.map((radio) => radio.element.checked)).toEqual([false, true, false])
    expect(document.activeElement).toBe(radios[1].element)
    wrapper.unmount()
  })

  it('emits the chosen size', async () => {
    const wrapper = mount(DisplayMenu, { props: { textSize: 'standard' } })
    await wrapper.find('.display-toggle').trigger('click')
    await wrapper.findAll('input[type="radio"]')[2].trigger('change')
    expect(wrapper.emitted('update:textSize')).toEqual([['largest']])
  })

  it('closes on Escape and returns focus to the button', async () => {
    const wrapper = mount(DisplayMenu, { props: { textSize: 'standard' }, attachTo: document.body })
    await wrapper.find('.display-toggle').trigger('click')
    await flushPromises()
    await wrapper.find('.display-panel').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.display-panel').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.display-toggle').element)
    wrapper.unmount()
  })

  it('closes on a click outside', async () => {
    const wrapper = mount(DisplayMenu, { props: { textSize: 'standard' }, attachTo: document.body })
    await wrapper.find('.display-toggle').trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find('.display-panel').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('text size setting (§10)', () => {
  it('is remembered when storage works', () => {
    const store = new Map<string, string>()
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value) }
    writeTextSize('largest', storage)
    expect(readTextSize(storage)).toBe('largest')
  })

  it('falls back to standard without storage, or with anything unexpected stored', () => {
    expect(readTextSize(null)).toBe('standard')
    expect(readTextSize({ getItem: () => 'gigantic' })).toBe('standard')
    expect(readTextSize({ getItem: () => { throw new Error('blocked') } })).toBe('standard')
    expect(() => writeTextSize('large', { setItem: vi.fn(() => { throw new Error('blocked') }) })).not.toThrow()
  })

  it('scales the page from the root element', () => {
    const root = document.createElement('html')
    applyTextSize('large', root)
    expect(root.dataset.textSize).toBe('large')
  })
})
