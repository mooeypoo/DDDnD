<template>
  <!--
    The guided round's guide (§5, D9): what the step asks, its teaching
    moment, a worked example, and what the author has made for it so far.
    It takes the contents sidebar's place; the editor beside it is the
    workspace's own. Whether a step is done is the domain's (guided_round.ts).
  -->
  <section class="guide" aria-labelledby="guide-title">
    <span class="guide-kicker">Step {{ index + 1 }} of {{ steps.length }}<template v-if="sitting"> · {{ sitting }}</template></span>
    <h1 id="guide-title" class="guide-title">{{ words.title }}</h1>
    <p class="guide-ask">{{ words.ask }}</p>

    <div v-if="words.rule" class="guide-box">
      <h2 class="guide-box-title">{{ words.rule.title }}</h2>
      <p v-for="(line, i) in words.rule.text" :key="i">{{ line }}</p>
    </div>

    <!-- What the author has so far, for the steps that ask for something -->
    <div v-if="step === 'council'" class="so-far">
      <h2 class="so-far-title">Your people so far</h2>
      <button v-for="member in council" :key="member.ref.id" type="button" class="so-far-row" :aria-current="current({ kind: 'member', ref: member.ref }) ? 'true' : undefined" @click="$emit('select', { kind: 'member', ref: member.ref })">
        <span>{{ member.name || 'Unnamed council member' }}</span>
        <span :class="member.reactions > 0 ? 'tone-good' : 'tone-look'">{{ member.reactions > 0 ? `✓ ${member.reactions === 1 ? 'a reaction' : `${member.reactions} reactions`}` : 'needs a reaction' }}</span>
      </button>
      <span v-for="n in Math.max(0, asks.council - council.length)" :key="`empty-${n}`" class="so-far-empty">Person {{ council.length + n }}</span>
      <button type="button" class="button button-quiet so-far-add" :disabled="!canSeat" @click="$emit('createMember')">+ Bring someone to the table</button>
    </div>

    <div v-else-if="step === 'cards'" class="so-far">
      <h2 class="so-far-title">Your cards so far</h2>
      <button v-for="card in cards" :key="card.ref.id" type="button" class="so-far-row" :aria-current="current({ kind: 'item', section: 'cards', ref: card.ref }) ? 'true' : undefined" @click="$emit('select', { kind: 'item', section: 'cards', ref: card.ref })">
        <span>{{ card.name || 'Untitled card' }}</span>
        <span :class="`tone-${VERDICT_WORDS[card.verdict].tone}`">{{ VERDICT_WORDS[card.verdict].tone === 'good' ? '✓ ' : '' }}{{ VERDICT_WORDS[card.verdict].text }}</span>
      </button>
      <span v-for="n in Math.max(0, asks.cards - cards.length)" :key="`empty-${n}`" class="so-far-empty">Card {{ cards.length + n }}</span>
      <button type="button" class="button button-quiet so-far-add" @click="$emit('createNew', 'cards')">+ Write a card</button>
      <p v-if="deckWords" class="field-hint">{{ deckWords.cards }}</p>
    </div>

    <div v-else-if="step === 'surprises'" class="so-far">
      <h2 class="so-far-title">Your surprises so far</h2>
      <button v-for="event in surprises" :key="event.ref.id" type="button" class="so-far-row" :aria-current="current({ kind: 'item', section: 'events', ref: event.ref }) ? 'true' : undefined" @click="$emit('select', { kind: 'item', section: 'events', ref: event.ref })">
        <span>{{ event.name || 'Untitled event' }}</span>
        <span :class="`tone-${LEANING_WORDS[event.leaning].tone}`">{{ LEANING_WORDS[event.leaning].tone === 'good' ? '✓ ' : '' }}{{ LEANING_WORDS[event.leaning].text }}</span>
      </button>
      <span v-for="missing in missingLeanings" :key="missing" class="so-far-empty">A {{ missing }} one</span>
      <button type="button" class="button button-quiet so-far-add" @click="$emit('createNew', 'events')">+ Write an event</button>
      <p v-if="deckWords" class="field-hint">{{ deckWords.events }}</p>
    </div>

    <div v-else-if="step === 'scores'" class="so-far">
      <h2 class="so-far-title">Your scores so far</h2>
      <button v-for="score in scores" :key="score.ref.id" type="button" class="so-far-row" :aria-current="current({ kind: 'score', id: score.ref.id }) ? 'true' : undefined" @click="$emit('select', { kind: 'score', id: score.ref.id })">
        <span>{{ score.name || 'Unnamed score' }}</span>
        <span :class="`tone-${PULL_WORDS[score.pull].tone}`">{{ PULL_WORDS[score.pull].tone === 'good' ? '✓ ' : '' }}{{ PULL_WORDS[score.pull].text }}</span>
      </button>
      <span v-for="n in Math.max(0, asks.scores - scores.length)" :key="`empty-${n}`" class="so-far-empty">Score {{ scores.length + n }}</span>
      <button type="button" class="button button-quiet so-far-add" :disabled="!canAddScore(draft)" @click="$emit('createScore')">+ Name a score</button>
      <p class="field-hint">Each says how your cards move it, once you've written some.</p>
    </div>

    <div v-else-if="step === 'endings'" class="so-far">
      <h2 class="so-far-title">Your endings, in the order they're tried</h2>
      <button v-for="ending in endings" :key="ending.ref.id" type="button" class="so-far-row" :aria-current="current({ kind: 'ending', id: ending.ref.id }) ? 'true' : undefined" @click="$emit('select', { kind: 'ending', id: ending.ref.id })">
        <span>{{ ending.name || 'Unnamed ending' }}</span>
        <span class="so-far-kind">{{ ending.fallback ? 'any run that fits no other' : '' }}</span>
      </button>
      <span v-for="n in missingEndings" :key="`empty-${n}`" class="so-far-empty">Ending {{ ownEndings + n }}</span>
      <button type="button" class="button button-quiet so-far-add" :disabled="!canAddEnding" @click="$emit('createEnding')">+ Write an ending</button>
    </div>

    <div v-else-if="step === 'class'" class="so-far">
      <h2 class="so-far-title">Your classes</h2>
      <button v-for="playerClass in classes" :key="playerClass.id" type="button" class="so-far-row" :aria-current="current({ kind: 'class', id: playerClass.id }) ? 'true' : undefined" @click="$emit('select', { kind: 'class', id: playerClass.id })">
        <span>{{ playerClass.name || 'Unnamed class' }}</span>
        <span :class="playerClass.favourite && playerClass.named ? 'tone-good' : 'tone-look'">{{ classWords(playerClass) }}</span>
      </button>
    </div>

    <div v-else-if="step === 'deck'" class="so-far">
      <h2 class="so-far-title">Your deck</h2>
      <p class="so-far-line">{{ deckCounts }}</p>
      <button type="button" class="so-far-row" :aria-current="current({ kind: 'add', section: 'cards' }) ? 'true' : undefined" @click="$emit('select', { kind: 'add', section: 'cards' })"><span>Add cards from the game</span><span aria-hidden="true">›</span></button>
      <button type="button" class="so-far-row" :aria-current="current({ kind: 'add', section: 'events' }) ? 'true' : undefined" @click="$emit('select', { kind: 'add', section: 'events' })"><span>Add events from the game</span><span aria-hidden="true">›</span></button>
      <h2 class="so-far-title">From the game, in your deck</h2>
      <p class="field-hint">Open one to read it, or to take it out of this pack.</p>
      <template v-for="deck in gameDeck" :key="deck.section">
        <button v-for="ref in deck.refs" :key="`${deck.section}/${ref.id}`" type="button" class="so-far-row" :aria-current="current({ kind: 'item', section: deck.section, ref }) ? 'true' : undefined" @click="$emit('select', { kind: 'item', section: deck.section, ref })">
          <span>{{ nameOf(deck.section, ref) }}</span>
          <span class="so-far-kind">{{ deck.section === 'cards' ? 'card' : 'event' }}</span>
        </button>
      </template>
    </div>

    <aside class="guide-example" :aria-label="`An example from ${round.example_pack}`">
      <span class="example-from">From {{ round.example_pack }}</span>
      <p v-for="(line, i) in words.example.lines" :key="i">{{ line }}</p>
    </aside>

    <div class="guide-nav">
      <!-- A topic's round is two sittings (§5): its first ends here, said where it can't scroll out of view -->
      <p v-if="breakAfter" class="guide-break" role="note"><strong>{{ SITTING_BREAK.title }}.</strong> {{ SITTING_BREAK.text }}</p>
      <button v-if="index > 0" type="button" class="button button-quiet" @click="$emit('back')">Back: {{ wordsOf(steps[index - 1]).short.toLowerCase() }}</button>
      <button v-if="index < steps.length - 1" type="button" class="button button-primary" @click="$emit('next')">Next: {{ wordsOf(steps[index + 1]).short.toLowerCase() }}</button>
      <button v-else type="button" class="button button-primary" @click="$emit('finish')">Finish the round</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { COUNCIL_SEATS, ENDINGS_PER_SCENARIO, ROUND_ASKS, canAddScore, deckBalanceWords, roundCards, roundClasses, roundCouncil, roundEndings, roundScores, roundSteps, roundSurprises, scenarioRefs, secondSitting, isOwn, type BalanceHint, type DeckBalance, type DeckSection, type DraftPack, type GameBalance, type RoundStep } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import { LEANING_WORDS, PULL_WORDS, ROUNDS, SITTING_BREAK, VERDICT_WORDS, stepWords } from '@studio/guided/round_words'
import { isSelected, type Selection } from '@studio/workspace/selection'

const props = defineProps<{
  draft: DraftPack
  step: RoundStep
  selection: Selection
  nameOf: (section: DeckSection, ref: VersionRef) => string
  /** The last check's balance numbers (D3): the cards and surprises steps show the deck beside the game's. */
  balance?: { decks: DeckBalance[]; game: GameBalance | null; hints: BalanceHint[] }
}>()
defineEmits<{ select: [selection: Selection]; createMember: []; createNew: [section: DeckSection]; createScore: []; createEnding: []; back: []; next: []; finish: [] }>()

const asks = ROUND_ASKS
/** This draft's round: a topic's is longer (§5). */
const steps = computed(() => roundSteps(props.draft))
const round = computed(() => ROUNDS[props.draft.kind])
const wordsOf = (step: RoundStep) => stepWords(props.draft.kind, step)
const index = computed(() => steps.value.indexOf(props.step))
const words = computed(() => wordsOf(props.step))
/** Which sitting a step is in, for a round of two (a topic's, §5). */
const sitting = computed(() => {
  const second = secondSitting(props.draft)
  if (second === null) return null
  return index.value < steps.value.indexOf(second) ? 'first sitting' : 'second sitting'
})
/** The last step of a topic's first sitting. */
const breakAfter = computed(() => {
  const second = secondSitting(props.draft)
  return second !== null && steps.value[index.value + 1] === second
})
const current = (target: Selection) => isSelected(props.selection, target)

const council = computed(() => roundCouncil(props.draft))
const canSeat = computed(() => scenarioRefs(props.draft, 'stakeholder_refs').length < COUNCIL_SEATS)
const cards = computed(() => roundCards(props.draft))
const surprises = computed(() => roundSurprises(props.draft))
const scores = computed(() => roundScores(props.draft))
const endings = computed(() => roundEndings(props.draft))
const ownEndings = computed(() => endings.value.filter((ending) => !ending.fallback).length)
const missingEndings = computed(() => Math.max(0, asks.endings - ownEndings.value))
const canAddEnding = computed(() => endings.value.length < ENDINGS_PER_SCENARIO)
const classes = computed(() => roundClasses(props.draft))
/** A class's state in a few words: what it still needs, or what it favours. */
function classWords(playerClass: { favourite: string | null; named: boolean }): string {
  if (!playerClass.favourite) return 'no favourite yet'
  const favours = `favours ${props.draft.content.scores[playerClass.favourite]?.name ?? 'a score'}`
  return playerClass.named ? `✓ ${favours}` : `${favours}; give it its own name`
}
const missingLeanings = computed(() => (['bad', 'good'] as const).filter((leaning) => !surprises.value.some((event) => event.leaning === leaning)))

/** The round's one scenario's deck, in numbers (a retelling has one). */
const deckWords = computed(() => {
  const deck = props.balance?.decks[0]
  return deck ? deckBalanceWords(deck, props.balance?.game ?? null) : null
})

/** The game's cards and events in the deck (the author's own have their steps). */
const gameDeck = computed(() => (['cards', 'events'] as const).map((section) => ({
  section,
  refs: scenarioRefs(props.draft, section === 'cards' ? 'card_refs' : 'event_refs').filter((ref) => !isOwn(props.draft, section, ref)),
})))

const deckCounts = computed(() => {
  const count = (section: DeckSection, field: 'card_refs' | 'event_refs') => {
    const refs = scenarioRefs(props.draft, field)
    const own = refs.filter((ref) => isOwn(props.draft, section, ref)).length
    return { all: refs.length, own }
  }
  const deck = count('cards', 'card_refs')
  const events = count('events', 'event_refs')
  return `${deck.all} cards (${deck.own} of your own) and ${events.all} events (${events.own} of your own).`
})
</script>

<style scoped>
.guide {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1.25rem 2rem;
}

.guide-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-gold);
}

.guide-title {
  margin: 0;
  font-family: var(--forge-font-heading);
  font-size: 1.625rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--forge-text-bright);
}

.guide-ask {
  margin: 0;
  line-height: 1.6;
}

.guide-box,
.guide-example {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-panel);
}

.guide-box p,
.guide-example p {
  margin: 0;
  line-height: 1.55;
}

.guide-box-title {
  margin: 0;
  font-family: var(--forge-font-heading);
  font-size: 1rem;
  font-weight: 600;
  color: var(--forge-gold);
}

.guide-example {
  border-style: dashed;
  background: transparent;
  font-size: 0.9375rem;
}

.example-from {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.so-far {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.so-far-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--forge-text-secondary);
}

.so-far-line {
  margin: 0;
}

.so-far-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.75rem;
  align-items: center;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  background: var(--forge-panel);
  color: var(--forge-text-bright);
  font: inherit;
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
}

.so-far-row[aria-current='true'] {
  border-color: var(--forge-gold);
}

.so-far-empty {
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px dashed var(--forge-hairline-strong);
  color: var(--forge-text-secondary);
  font-size: 0.9375rem;
}

.so-far-add {
  align-self: flex-start;
}

.tone-good {
  flex: none;
  color: var(--forge-up);
}

.tone-look {
  flex: none;
  color: var(--forge-warning);
}

.tone-quiet {
  flex: none;
  color: var(--forge-text-secondary);
}

.guide-break {
  flex-basis: 100%;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--forge-ember-soft);
}

.guide-break strong {
  color: var(--forge-text-bright);
}

.guide-nav {
  /* Always in reach, however long the step: Back and Next stay at the bottom of the guide as it scrolls */
  position: sticky;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0.5rem -1.25rem -2rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

.so-far-kind {
  flex: none;
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}
</style>
