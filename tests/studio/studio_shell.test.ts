/**
 * The Studio shell (docs/PACK_STUDIO.md): its name and subtitle, and the
 * text-size setting (§10), which works with or without storage.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import StudioHeader from '@studio/components/studio_header.vue'
import { applyTextSize, readTextSize, writeTextSize } from '@studio/preferences/text_size'

describe('Studio header', () => {
  it('leads with "DDDnD Pack Studio", subtitled "The Forge" (D11)', () => {
    const wrapper = mount(StudioHeader, { props: { textSize: 'standard' } })
    expect(wrapper.find('.brand-name').text()).toBe('DDDnD Pack Studio')
    expect(wrapper.find('.brand-subtitle').text()).toBe('The Forge')
  })

  it('offers three labelled text sizes, marking the current one', async () => {
    const wrapper = mount(StudioHeader, { props: { textSize: 'large' } })
    const buttons = wrapper.findAll('.text-size-option')
    expect(buttons.map((button) => button.attributes('aria-label'))).toEqual(['Standard text size', 'Large text size', 'Largest text size'])
    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual(['false', 'true', 'false'])
    await buttons[2].trigger('click')
    expect(wrapper.emitted('update:textSize')).toEqual([['largest']])
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
