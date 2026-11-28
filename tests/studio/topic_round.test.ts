/**
 * The new-topic round (§5, M4.25): its words for every step, the guide on a
 * topic's own steps, the break between its two sittings, and the way in
 * from "Teach another subject".
 */

import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { createOwnCard, createOwnScore, draftForNewTopic, goToRoundStep, manifestRefs, putContent, RETELLING_ROUND, startRound, TOPIC_ROUND, type DraftPack } from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import GuidedBar from '@studio/guided/guided_bar.vue'
import GuidedGuide from '@studio/guided/guided_guide.vue'
import { ROUNDS, stepWords } from '@studio/guided/round_words'

const startNewTopic = vi.fn(async () => 'draft-1')
vi.mock('@studio/state/studio_state', () => ({ startNewTopic: (...args: unknown[]) => startNewTopic(...(args as [])) }))
const { default: NewTopicView } = await import('@studio/views/new_topic_view.vue')

const tiers = manifestRefs(JSON.parse(readFileSync(path.resolve('content/manifest.json'), 'utf8')) as ContentPackManifest, 'outcome_tiers')
const topic = (): DraftPack => startRound(draftForNewTopic({ name: 'Incident Response', authors: [{ name: 'Ada' }] }, tiers).draft)

function guide(draft: DraftPack) {
  return mount(GuidedGuide, { props: { draft, step: draft.round!.step, selection: { kind: 'summary' }, nameOf: () => '' } })
}

describe("each round's words", () => {
  it('has words for every one of its steps, and its examples from its own pack (D14)', () => {
    for (const step of RETELLING_ROUND) expect(stepWords('retelling', step).title).not.toBe('')
    for (const step of TOPIC_ROUND) expect(stepWords('new_topic', step).example.title).toBe(ROUNDS.new_topic.example_pack)
    expect(ROUNDS.new_topic.example_pack).toBe('SRE: The Pager Storm')
  })
})

describe("a topic's round, on screen", () => {
  it('says what kind of round it is, with its ten steps', () => {
    const wrapper = mount(GuidedBar, { props: { draft: topic(), saveText: '', checksClean: false } })
    expect(wrapper.find('.bar-what').text()).toBe('Teach your topic with DDDnD')
    expect(wrapper.findAll('.step').map((step) => step.text())).toEqual([
      '1 Name your world', '2 What it trades off', '3 Your scenario', '4 Your council', '5 Your cards',
      '6 Your surprises', '7 Your endings', '8 Your class', '9 Check it', '10 Play it',
    ])
  })

  it('lists the scores so far, each with how the cards pull it', () => {
    let draft = goToRoundStep(topic(), 'scores')
    const rest = createOwnScore(draft, 'Rested On-Call')!
    draft = createOwnScore(rest.draft, 'Availability')!.draft
    const card = createOwnCard(draft, 'Tune the Noisy Alerts')
    draft = putContent(card.draft, 'cards', { ...card.draft.content.cards[card.id], score_changes: [{ score_id: rest.id, delta: 8 }] })
    const wrapper = guide(draft)
    expect(wrapper.find('.guide-kicker').text()).toBe('Step 2 of 10 · first sitting')
    expect(wrapper.findAll('.so-far-row').map((row) => row.text())).toEqual(['Rested On-Callonly goes up', 'Availabilityno card moves it yet'])
    expect(wrapper.findAll('.so-far-empty').map((slot) => slot.text())).toEqual(['Score 3'])
    expect(wrapper.find('.example-from').text()).toBe('From SRE: The Pager Storm')
  })

  it('suggests a break at the end of the first sitting, and only there', () => {
    expect(guide(goToRoundStep(topic(), 'council')).find('.guide-break').text()).toContain('A good place to stop')
    expect(guide(goToRoundStep(topic(), 'cards')).find('.guide-break').exists()).toBe(false)
    expect(guide(goToRoundStep(topic(), 'council')).find('.guide-nav .button-primary').text()).toBe('Next: your cards')
    expect(guide(goToRoundStep(topic(), 'cards')).find('.guide-kicker').text()).toBe('Step 5 of 10 · second sitting')
  })

  it("shows the skeleton's class waiting for a favourite, then for its own name", () => {
    const draft = goToRoundStep(topic(), 'class')
    expect(guide(draft).find('.so-far-row').text()).toBe('Generalistno favourite yet')
    const rest = createOwnScore(draft, 'Rested On-Call')!
    const [generalist] = Object.values(rest.draft.content.classes)
    const favoured = putContent(rest.draft, 'classes', { ...generalist, score_affinity: rest.id })
    expect(guide(favoured).find('.so-far-row').text()).toBe('Generalistfavours Rested On-Call; give it its own name')
  })
})

describe('starting a topic', () => {
  it('starts in the guided round, or on your own', async () => {
    const wrapper = mount(NewTopicView)
    await wrapper.find('input').setValue('Incident Response')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.emitted('openDraft')).toEqual([['draft-1', true]]))
    expect(startNewTopic).toHaveBeenLastCalledWith('Incident Response', '', { guided: true })
    await wrapper.findAll('.topic-actions button').find((button) => button.text() === 'Start on my own')!.trigger('click')
    await vi.waitFor(() => expect(wrapper.emitted('openDraft')?.[1]).toEqual(['draft-1', false]))
  })
})
