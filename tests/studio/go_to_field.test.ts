/**
 * "Go to it" lands on the field a check is about (M4.23), and the warning
 * when the pack's id changed since its last export.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createDraft, releaseDraft, updateDraftDetails } from '@/domains/authoring'
import ChecksPanel from '@studio/workspace/checks_panel.vue'
import PackIdWarning from '@studio/workspace/pack_id_warning.vue'
import { fieldElement } from '@studio/workspace/field_focus'

function page(html: string): HTMLElement {
  const root = document.createElement('main')
  root.innerHTML = html
  return root
}

describe('finding the field on the page', () => {
  const memberPage = page(`
    <input data-field="name" id="member-name">
    <textarea data-field="description" id="member-description"></textarea>
    <article data-subject="stakeholder_reaction_rules/ours_nervous">
      <input data-field="name" id="reaction-name">
      <input data-field="description" id="reaction-description">
      <input data-field="score_changes" data-index="0" id="reaction-change-0">
      <input data-field="score_changes" data-index="1" id="reaction-change-1">
    </article>`)

  it("finds the page's own field, never a reaction's of the same name", () => {
    expect(fieldElement(memberPage, { field: { field: 'description' } })?.id).toBe('member-description')
    expect(fieldElement(memberPage, { field: { field: 'name' } })?.id).toBe('member-name')
  })

  it("finds a reaction's field inside that reaction, at the place in a list the check names", () => {
    expect(fieldElement(memberPage, { subject: 'stakeholder_reaction_rules/ours_nervous', field: { field: 'description' } })?.id).toBe('reaction-description')
    expect(fieldElement(memberPage, { subject: 'stakeholder_reaction_rules/ours_nervous', field: { field: 'score_changes', index: 1 } })?.id).toBe('reaction-change-1')
  })

  it('falls back to the first input when the field has none (or the check names no field)', () => {
    expect(fieldElement(memberPage, { field: { field: 'usage_limit' } })?.id).toBe('member-name')
    expect(fieldElement(memberPage, {})?.id).toBe('member-name')
    expect(fieldElement(memberPage, { subject: 'stakeholder_reaction_rules/ours_nervous' })?.id).toBe('reaction-name')
    expect(fieldElement(memberPage, { subject: 'delayed_effects/gone' })).toBeNull()
  })
})

describe('"Go to it" in the checks', () => {
  it('carries the field the problem is about', async () => {
    const wrapper = mount(ChecksPanel, {
      props: { state: 'done', issues: [{ file: 'cards/ours_a-v1.json', message: 'score_changes[1].delta: must be at most 100' }, { file: 'manifest.json', message: 'authors: must be at least 1 items' }] },
    })
    const buttons = wrapper.findAll('.issue-go')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('goTo')).toEqual([
      [{ kind: 'item', section: 'cards', ref: { id: 'ours_a', version: 1 }, field: { field: 'score_changes', index: 1 } }],
      [{ kind: 'details', field: { field: 'authors' } }],
    ])
  })
})

describe('a pack id changed since its export', () => {
  const draft = releaseDraft({ ...createDraft({ kind: 'retelling', name: 'Ours' }), authors: [{ name: 'A' }] }, '1.0.0')

  it('says nothing while it is the same pack', () => {
    expect(mount(PackIdWarning, { props: { draft } }).find('.pack-id-warning').exists()).toBe(false)
  })

  it('warns, and changes it back', async () => {
    const renamed = updateDraftDetails(draft, { prefix: 'acme' })
    const wrapper = mount(PackIdWarning, { props: { draft: renamed } })
    expect(wrapper.find('strong').text()).toBe('This exports as a different pack.')
    expect(wrapper.text()).toContain('It now exports as “acme”')
    await wrapper.find('button').trigger('click')
    const [[back]] = wrapper.emitted('change') as [[typeof draft]]
    expect(back.prefix).toBe(draft.prefix)
  })
})
