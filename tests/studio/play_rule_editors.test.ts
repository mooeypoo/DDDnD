/**
 * A topic's rules of play in the Studio (M4.19): each editor shows the
 * domain's plain words and turns input into domain calls.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createOwnChallenge, createOwnCoupling, createOwnScore, draftForNewTopic, type DraftPack } from '@/domains/authoring'
import ChallengeEditor from '@studio/workspace/challenge_editor.vue'
import ClassEditor from '@studio/workspace/class_editor.vue'
import CouplingEditor from '@studio/workspace/coupling_editor.vue'

function topic() {
  let draft = draftForNewTopic({ name: 'Incident Response' }, []).draft
  const rest = createOwnScore(draft, 'Rest')!; draft = rest.draft
  const uptime = createOwnScore(draft, 'Uptime')!; draft = uptime.draft
  const scoreOptions = [{ id: rest.id, name: 'Rest' }, { id: uptime.id, name: 'Uptime' }]
  return { draft, rest: rest.id, uptime: uptime.id, scoreOptions }
}
function last<T>(wrapper: { emitted: (name: string) => unknown[][] | undefined }): T { const all = wrapper.emitted('change')!; return all[all.length - 1][0] as T }

describe('the class editor', () => {
  it('sets a favourite score and says what it does; the last class can\'t be deleted, and says why', async () => {
    const { draft, rest, scoreOptions } = topic()
    const classId = Object.keys(draft.content.classes)[0]
    const wrapper = mount(ClassEditor, { props: { draft, classId, scoreOptions } })
    expect(wrapper.text()).toContain('no favourite score: fits any table')
    expect(wrapper.find('button.button-danger').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Every table needs a class to play as')
    await wrapper.find('select').setValue(rest)
    const next = last<DraftPack>(wrapper)
    expect(next.content.classes[classId].score_affinity).toBe(rest)
    await wrapper.setProps({ draft: next })
    expect(wrapper.text()).toContain('Rest +1 every turn')
  })
})

describe('the challenge editor', () => {
  it('changes where a score starts, and a 0 takes it out', async () => {
    const { draft, rest, uptime, scoreOptions } = topic()
    const made = createOwnChallenge(draft, 'Launch Week')
    const wrapper = mount(ChallengeEditor, { props: { draft: made.draft, challengeId: made.id, scoreOptions } })
    expect(wrapper.text()).toContain('Rest starts −10')
    const inputs = wrapper.findAll('fieldset input')
    await inputs[1].setValue('-5'); await inputs[1].trigger('change')
    expect(last<DraftPack>(wrapper).content.challenge_modifiers[made.id].score_adjustments).toEqual({ [rest]: -10, [uptime]: -5 })
    await wrapper.setProps({ draft: last<DraftPack>(wrapper) })
    await inputs[0].setValue('0'); await inputs[0].trigger('change')
    expect(last<DraftPack>(wrapper).content.challenge_modifiers[made.id].score_adjustments).toEqual({ [uptime]: -5 })
  })
})

describe('the coupling rule editor', () => {
  it('shows the cut as a percent, and keeps at least one score to cut', async () => {
    const { draft, uptime, scoreOptions } = topic()
    const made = createOwnCoupling(draft, 'Burnout Spiral')!
    const wrapper = mount(CouplingEditor, { props: { draft: made.draft, couplingId: made.id, scoreOptions } })
    expect(wrapper.text()).toContain('While Rest is below 25, gains to Uptime are cut to 70%.')
    const percent = wrapper.findAll('input[type="number"]')[1]
    expect((percent.element as HTMLInputElement).value).toBe('70')
    await percent.setValue('50'); await percent.trigger('change')
    expect(last<DraftPack>(wrapper).content.coupling_rules[made.id].gain_multiplier).toBe(0.5)
    const boxes = wrapper.findAll('input[type="checkbox"]')
    const before = wrapper.emitted('change')!.length
    await boxes[1].trigger('change') // Uptime: the only score it cuts
    expect(wrapper.emitted('change')!.length).toBe(before)
    expect(made.draft.content.coupling_rules[made.id].affected_score_ids).toEqual([uptime])
  })
})
