/**
 * Connecting from where you are (the UI/UX audit, slice 3b): one picker for
 * a new change that can also bring someone to the table, and the list of
 * changes it adds to.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChangeTargetPicker from '@studio/workspace/change_target_picker.vue'
import EffectsEditor from '@studio/workspace/effects_editor.vue'

const scores = [{ id: 'domain_clarity', name: 'Domain Clarity' }, { id: 'budget', name: 'Budget' }]
const members = [{ id: 'cto', name: 'Chief Technology Officer' }]
const gameMembers = [{ ref: { id: 'cfo', version: 1 }, name: 'Chief Financial Officer' }]

function picker(props: Partial<InstanceType<typeof ChangeTargetPicker>['$props']> = {}) {
  return mount(ChangeTargetPicker, { props: { scores, members, gameMembers, knownNames: ['Chief Technology Officer', 'Chief Financial Officer'], canSeat: true, seatsLeft: 4, ...props }, attachTo: document.body })
}

const options = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('[role="option"]').map((option) => option.find('.option-name').text())

describe('the change picker', () => {
  it('is a labelled combobox, focused, offering scores, the table and the game\'s unseated members', async () => {
    const wrapper = picker()
    await flushPromises()
    const input = wrapper.find('input[role="combobox"]')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.find('label').text()).toBe('Who or what does it change?')
    expect(options(wrapper)).toEqual(['Domain Clarity', 'Budget', 'Chief Technology Officer', 'Chief Financial Officer'])
    expect(input.attributes('aria-activedescendant')).toBe(wrapper.findAll('[role="option"]')[0].attributes('id'))
    wrapper.unmount()
  })

  it('offers a typed name as a new council member, and Enter makes them', async () => {
    const wrapper = picker()
    await wrapper.find('input').setValue('Head of Pay')
    expect(options(wrapper)).toEqual(['+ “Head of Pay” as a new council member'])
    expect(wrapper.find('.option-hint').text()).toBe('seats them, 4 seats free')
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('create')).toEqual([['Head of Pay']])
    wrapper.unmount()
  })

  it('never offers an existing name as someone new, and moves with the arrow keys', async () => {
    const wrapper = picker()
    await wrapper.find('input').setValue('chief')
    // What exists comes first; someone new last
    expect(options(wrapper)).toEqual(['Chief Technology Officer', 'Chief Financial Officer', '+ “chief” as a new council member'])
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('seat')).toEqual([[{ id: 'cfo', version: 1 }]])
    wrapper.unmount()
  })

  it('offers nobody new when every seat is taken, and says so', async () => {
    const wrapper = picker({ canSeat: false, seatsLeft: 0 })
    await wrapper.find('input').setValue('Head of Payments')
    expect(options(wrapper)).toEqual([])
    expect(wrapper.find('.picker-empty').text().replace(/\s+/g, ' ')).toBe('Nothing called “Head of Payments”. Every seat is taken, so nobody new can join.')
    wrapper.unmount()
  })

  it('closes on Escape', async () => {
    const wrapper = picker()
    await wrapper.find('.picker').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('what it changes', () => {
  const props = {
    scoreChanges: [{ score_id: 'budget', delta: -5 }],
    stakeholderChanges: [{ stakeholder_id: 'cto', delta: 2 }],
    scoreOptions: scores,
    stakeholderOptions: members,
    gameMembers,
    seatsLeft: 4,
  }

  it('lists scores and council members together, each with what it\'s measured on', () => {
    const wrapper = mount(EffectsEditor, { props })
    expect(wrapper.findAll('.effect-row').map((row) => [row.find('.effect-name').text(), row.find('.effect-kind').text(), row.find('.effect-word').text()])).toEqual([
      ['Budget', 'score', 'down'],
      ['Chief Technology Officer', 'council', 'satisfaction'],
    ])
    expect(wrapper.find('input[type="number"]').attributes()).toMatchObject({ min: expect.any(String), max: expect.any(String) })
  })

  it('adds a change from the picker at +1, and passes a new member up to be made and seated', async () => {
    const wrapper = mount(EffectsEditor, { props, attachTo: document.body })
    await wrapper.find('.effect-add').trigger('click')
    await wrapper.find('input[role="combobox"]').setValue('domain')
    await wrapper.find('input[role="combobox"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('change')).toEqual([[{ score_changes: [{ score_id: 'budget', delta: -5 }, { score_id: 'domain_clarity', delta: 1 }], stakeholder_changes: [{ stakeholder_id: 'cto', delta: 2 }] }]])

    await wrapper.find('.effect-add').trigger('click')
    await wrapper.find('input[role="combobox"]').setValue('Head of Payments')
    await wrapper.find('input[role="combobox"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('createMember')).toEqual([['Head of Payments']])
    expect(wrapper.find('input[role="combobox"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
