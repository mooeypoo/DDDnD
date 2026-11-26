<template>
  <!--
    The pack at a glance (the UI/UX audit, slice 4; Direction C as a view of
    the editor, D28): where to go next, what's still to fill in, what stops
    an export, and the pack's parts with links into them. Every answer comes
    from the authoring domain: nextSteps, toFillIn, packCounts, releaseState.
  -->
  <div class="editor summary">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Pack summary</span>
        <h1 class="editor-title">{{ draft.name || 'Untitled pack' }}</h1>
        <p class="summary-lede">{{ draft.kind === 'retelling' ? 'A retelling of DDDnD' : 'A different topic, built on DDDnD' }} · {{ releaseWords }}</p>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-main">
        <section class="editor-section" aria-labelledby="summary-next">
          <h2 id="summary-next" class="editor-section-title">Where to go next</h2>
          <p class="field-hint">Any order works. Your copy of the scenario already plays, so each step is about making it yours.</p>
          <ol class="steps">
            <li class="step step-done">
              <span class="step-mark" aria-hidden="true">✓</span>
              <span v-if="draft.kind === 'new_topic'" class="step-text"><strong>Started your topic.</strong> A scenario, an ending every run can reach, and a class to play as. The game's outcome tiers come with it.</span>
              <span v-else class="step-text"><strong>Copied the game's scenario.</strong> Its council, cards and events play exactly as in DDDnD.</span>
            </li>
            <li v-for="entry in steps" :key="entry.step" class="step" :class="{ 'step-done': entry.done }">
              <span class="step-mark" aria-hidden="true">{{ entry.done ? '✓' : '' }}</span>
              <span class="visually-hidden">{{ entry.done ? 'Done: ' : 'To do: ' }}</span>
              <span class="step-text">
                <strong>{{ STEP_WORDS[entry.step].title }}</strong> {{ STEP_WORDS[entry.step].text }}
                <span v-if="entry.step === 'fill_in' && fillIn.length" class="fill-list">
                  <button v-for="item in fillIn" :key="`${item.section}/${item.ref.id}`" type="button" class="link-button" @click="openFillIn(item)">{{ item.name || 'Unnamed' }}</button>
                </span>
              </span>
              <span v-if="!entry.done && STEP_WORDS[entry.step].action" class="step-action">
                <button type="button" class="button button-quiet" @click="act(entry.step)">{{ STEP_WORDS[entry.step].action }}</button>
              </span>
            </li>
          </ol>
        </section>

        <div class="parts">
          <div v-if="draft.kind === 'new_topic'" class="part">
            <span class="part-title">Scores</span>
            <span class="part-line">{{ counts.scores === 0 ? 'None yet: name what your topic trades off' : `${counts.scores} tracked` }}</span>
          </div>
          <button type="button" class="part" @click="$emit('select', { kind: 'council' })">
            <span class="part-title">Council</span>
            <span class="part-line">{{ counts.seated }} of {{ seats }} seats · {{ counts.own_members ? `${counts.own_members} of your own` : 'all from the game' }}</span>
          </button>
          <button type="button" class="part" @click="firstScenario && $emit('select', { kind: 'scenario', id: firstScenario.id })">
            <span class="part-title">Scenario</span>
            <span class="part-line">{{ firstScenario?.name || 'Untitled scenario' }} · {{ firstScenario?.max_turns ?? '…' }} turns</span>
          </button>
          <div class="part">
            <span class="part-title">Cards</span>
            <span class="part-line">{{ counts.cards }} in the deck · {{ counts.own_cards ? `${counts.own_cards} of your own` : 'all from the game' }}</span>
          </div>
          <div class="part">
            <span class="part-title">Events</span>
            <span class="part-line">{{ counts.events }} that can happen · {{ counts.own_events ? `${counts.own_events} of your own` : 'all from the game' }}</span>
          </div>
        </div>
      </div>

      <section class="editor-section summary-side" aria-labelledby="summary-export">
        <h2 id="summary-export" class="editor-section-title">Before you export</h2>
        <p v-if="checkState !== 'done'" class="field-hint">Checking…</p>
        <p v-else-if="issues.length === 0" class="ready">Ready to export.</p>
        <template v-else>
          <p class="to-fix">{{ issues.length === 1 ? '1 thing to fix' : `${issues.length} things to fix` }}, from the game's own checks:</p>
          <ul class="issue-list">
            <li v-for="(issue, index) in issues.slice(0, 5)" :key="index"><span class="issue-where">{{ describeIssue(issue).where }}:</span> {{ describeIssue(issue).text }}</li>
          </ul>
          <p v-if="issues.length > 5" class="field-hint">And {{ issues.length - 5 }} more: open the “to fix” button at the top.</p>
        </template>
        <p v-if="notes > 0" class="field-hint"><strong class="worth">Worth a look:</strong> {{ notes === 1 ? '1 note' : `${notes} notes` }} about council members who aren't seated, under the checks button.</p>
        <button type="button" class="button button-quiet" @click="$emit('select', { kind: 'release' })">Open the export page</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { describeIssue, nextSteps, packCounts, releaseState, toFillIn, type DraftPack, type NextStep, type PackIssue, type ToFillIn } from '@/domains/authoring'
import type { CheckState } from '@studio/state/studio_state'
import type { Selection } from '@studio/workspace/selection'

const props = defineProps<{ draft: DraftPack; seats: number; checkState: CheckState; issues: PackIssue[]; notes: number }>()
const emit = defineEmits<{ select: [selection: Selection]; createNew: [section: 'cards']; createMember: []; createScore: []; createEnding: [] }>()

/** The Studio's words for each step; which are done is the domain's (nextSteps). */
const STEP_WORDS: Record<NextStep, { title: string; text: string; action?: string }> = {
  write_endings: { title: 'Write the endings.', text: 'What kind of leader can a player become in your topic? Each ending is chosen by how the run went.', action: '+ New ending' },
  name_scores: { title: 'Name what your topic trades off.', text: 'Three to six scores that pull against each other, each named so more is better ("Rest", not "Fatigue").', action: '+ New score' },
  write_a_card: { title: 'Write a card of your own.', text: 'A move your team actually argues about, with what it costs.', action: '+ New card' },
  bring_your_people: { title: 'Bring your people to the table.', text: 'Add them from a card ("+ Add a change", then a new name), or here.', action: '+ New member' },
  fill_in: { title: 'Fill in what you started.', text: 'Everything of your own has a name and a sentence about it.' },
  add_author: { title: 'Add your name.', text: 'Players see it next to the pack.', action: 'Open pack details' },
  export: { title: 'Export it.', text: 'Download the pack file for players, or a zip for GitHub.', action: 'Open the export page' },
}

const steps = computed(() => nextSteps(props.draft))
const fillIn = computed(() => toFillIn(props.draft))
const counts = computed(() => packCounts(props.draft))
const firstScenario = computed(() => Object.values(props.draft.content.scenarios)[0])

const releaseWords = computed(() => {
  const release = releaseState(props.draft)
  if (release.state === 'never') return 'not exported yet'
  if (release.state === 'unchanged') return `${release.imported ? 'imported' : 'exported'} as ${release.version}`
  return `changed since ${release.version}${release.imported ? ', the version you imported' : ''}`
})

function act(step: NextStep) {
  if (step === 'name_scores') emit('createScore')
  else if (step === 'write_endings') emit('createEnding')
  else if (step === 'write_a_card') emit('createNew', 'cards')
  else if (step === 'bring_your_people') emit('createMember')
  else if (step === 'add_author') emit('select', { kind: 'details' })
  else if (step === 'export') emit('select', { kind: 'release' })
}

function openFillIn(item: ToFillIn) {
  if (item.section === 'scores') emit('select', { kind: 'score', id: item.ref.id })
  else if (item.section === 'outcome_archetypes') emit('select', { kind: 'ending', id: item.ref.id })
  else if (item.section === 'classes') emit('select', { kind: 'class', id: item.ref.id })
  else if (item.section === 'challenge_modifiers') emit('select', { kind: 'challenge', id: item.ref.id })
  else if (item.section === 'coupling_rules') emit('select', { kind: 'coupling', id: item.ref.id })
  else if (item.section === 'stakeholders') emit('select', { kind: 'member', ref: item.ref })
  else if (item.section === 'cards' || item.section === 'events') emit('select', { kind: 'item', section: item.section, ref: item.ref })
}
</script>

<style scoped>
.summary-lede {
  margin: 0.25rem 0 0;
  color: var(--forge-text-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 70rem) {
  .summary-grid { grid-template-columns: minmax(0, 1fr); }
}

.summary-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
}

.step {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem 0.875rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(160, 112, 24, 0.2);
}

.step-mark {
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--forge-hairline-strong);
  color: var(--forge-up);
  font-size: 0.8125rem;
}

.step-done .step-mark {
  border-color: transparent;
  background: rgba(143, 209, 143, 0.14);
}

.step-text {
  flex: 1 1 18rem;
  min-width: 0;
}

.step-text strong {
  color: var(--forge-text-bright);
}

.step-done .step-text {
  color: var(--forge-text-secondary);
}

.fill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin-top: 0.25rem;
}

.link-button {
  padding: 0;
  border: none;
  background: none;
  color: var(--forge-gold);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.parts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.875rem;
}

.part {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.125rem;
  border-radius: 0.75rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
  color: var(--forge-text);
  font: inherit;
  text-align: left;
}

button.part {
  cursor: pointer;
}

.part-title {
  font-family: var(--forge-font-heading);
  font-size: 1.125rem;
  color: var(--forge-text-bright);
}

.part-line {
  font-size: 0.9375rem;
}

.ready {
  margin: 0;
  color: var(--forge-up);
  font-weight: 600;
}

.to-fix {
  margin: 0;
  color: var(--forge-down);
  font-weight: 600;
}

.issue-list {
  margin: 0;
  padding-left: 1.125rem;
  color: var(--forge-text-bright);
}

.issue-where {
  color: var(--forge-text-secondary);
}

.worth {
  color: var(--forge-warning);
}

.summary-side .button {
  align-self: flex-start;
}
</style>
