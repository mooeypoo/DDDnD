<template>
  <!--
    The welcome page (#/, the first-screen audit, M4.27): what DDDnD is, what
    a pack holds, the two kinds, and where a pack goes, with one ember action,
    "Create a pack". Returning authors see their latest packs high on it
    (the owner's call: one front door).
  -->
  <main id="main" class="welcome" tabindex="-1">
    <p v-if="!studio.persistent" class="note note-warning" role="status">
      <strong>This browser isn't letting the Studio keep anything,</strong> so drafts last only until you close the page.
      Export your pack to keep a copy.
    </p>

    <section class="hero" aria-labelledby="welcome-title">
      <div class="hero-text">
        <span class="section-label">The Pack Studio</span>
        <h1 id="welcome-title" class="hero-title">Make DDDnD about your world</h1>
        <p class="hero-lede">
          DDDnD is a free card game about systems architecture under pressure. The Studio lets you write your own
          scenarios for it, with no code: your system, your people, and the moves your team argues about.
          Players import your pack and play it in the game.
        </p>
        <div class="hero-actions">
          <button type="button" class="button button-primary" @click="$emit('create')">Create a pack</button>
          <a class="button button-quiet" :href="LINKS.game" target="_blank" rel="noopener noreferrer">Play DDDnD first<span class="visually-hidden"> (opens in a new tab)</span></a>
        </div>
      </div>
      <!-- A real move from the game, read from its content (never written into the Studio) -->
      <figure v-if="move" class="turn">
        <figcaption class="section-label">A move in {{ move.scenario }}</figcaption>
        <p class="turn-card"><strong>{{ move.card }}</strong> {{ move.words }}</p>
        <p class="turn-text">Every move trades something away. Events land between turns, the council reacts, and at the end an ending names the leader you were.</p>
      </figure>
    </section>

    <section v-if="recent.length" class="continue" aria-labelledby="continue-title">
      <h2 id="continue-title" class="section-label">Pick up where you left off</h2>
      <ul class="continue-tiles">
        <li v-for="entry in recent" :key="entry.draft_id" class="continue-tile">
          <KindPill :kind="entry.draft.kind" />
          <span class="continue-name">{{ entry.draft.name || 'Untitled pack' }}</span>
          <span class="continue-line">{{ whereItStands(entry.draft) }}</span>
          <button type="button" class="button button-quiet continue-open" :aria-label="`${entry.draft.round ? 'Continue' : 'Open'} ${entry.draft.name || 'Untitled pack'}`" @click="$emit('openDraft', entry.draft_id, !!entry.draft.round)">
            {{ entry.draft.round ? 'Continue' : 'Open' }}
          </button>
        </li>
        <li class="continue-tile continue-all">
          <a href="#/packs" class="continue-name">All your packs ({{ studio.drafts.length }})</a>
          <span class="continue-line">Kept in this browser. Export a pack to keep a copy.</span>
        </li>
      </ul>
    </section>

    <section class="block" aria-labelledby="holds-title">
      <h2 id="holds-title" class="block-title">What a pack holds</h2>
      <dl class="parts">
        <div v-for="part in PARTS" :key="part.name" class="part">
          <dt>{{ part.name }}</dt>
          <dd>{{ part.text }}</dd>
        </div>
      </dl>
    </section>

    <section class="block" aria-labelledby="kinds-title">
      <h2 id="kinds-title" class="block-title">Two kinds of pack</h2>
      <div class="kinds">
        <div v-for="kind in KINDS" :key="kind.kind" class="kind">
          <KindPill :kind="kind.kind" />
          <h3 class="kind-title">{{ kind.title }}</h3>
          <p>{{ KIND_SUMMARIES[kind.kind] }} {{ kind.for }}</p>
          <p class="kind-example">Example: {{ kind.example }}</p>
        </div>
      </div>
    </section>

    <section class="block" aria-labelledby="path-title">
      <h2 id="path-title" class="block-title">From draft to players</h2>
      <ol class="path">
        <li v-for="step in PATH" :key="step.name"><strong>{{ step.name }}</strong> {{ step.text }}</li>
      </ol>
    </section>

    <nav class="links" aria-label="More about DDDnD">
      <a :href="LINKS.game" target="_blank" rel="noopener noreferrer">Play DDDnD</a>
      <a :href="LINKS.playerHelp" target="_blank" rel="noopener noreferrer">Player help</a>
      <a :href="LINKS.studioGuide" target="_blank" rel="noopener noreferrer">Making a pack in the Studio</a>
      <a :href="LINKS.formatGuide" target="_blank" rel="noopener noreferrer">The pack format (advanced)</a>
      <a :href="LINKS.examplePacks" target="_blank" rel="noopener noreferrer">Example packs</a>
      <a :href="LINKS.source" target="_blank" rel="noopener noreferrer">Source</a>
    </nav>
  </main>

  <footer class="welcome-footer">
    <span>Made for a laptop or desktop screen. Tablets work; on a phone you can look around, not edit.</span>
    <span>Packs are text and numbers only: no code, no images.</span>
  </footer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { KIND_SUMMARIES, describeOwnContent, roundPlace, type DraftKind, type DraftPack } from '@/domains/authoring'
import KindPill from '@studio/components/kind_pill.vue'
import { exampleMove } from '@studio/content/first_party'
import { LINKS } from '@studio/content/links'
import { studio } from '@studio/state/studio_state'

defineEmits<{ create: []; openDraft: [draftId: string, guided: boolean] }>()

/** The latest few packs (the list is newest first); the rest are on "Your packs". */
const RECENT = 3
const recent = computed(() => studio.drafts.slice(0, RECENT))

/** A pack in progress: its place in the guided round, or what's its own. */
function whereItStands(draft: DraftPack): string {
  const place = roundPlace(draft)
  return place ? `Guided round: step ${place.step} of ${place.of}` : describeOwnContent(draft)
}

const move = ref<{ scenario: string; card: string; words: string } | null>(null)
onMounted(async () => {
  move.value = await exampleMove().catch(() => null)
})

const PARTS = [
  { name: 'Scores', text: 'What a run is judged on, each phrased so higher is better.' },
  { name: 'The council', text: 'The people whose satisfaction rises and falls with your moves.' },
  { name: 'Cards', text: 'One move a turn. Each gains something and costs something.' },
  { name: 'Events', text: 'What happens between turns, good and bad.' },
  { name: 'Endings', text: 'The kind of leader the run says you were.' },
]

const KINDS: Array<{ kind: DraftKind; title: string; for: string; example: string }> = [
  { kind: 'retelling', title: 'Domain-driven design, in your world', for: 'For workshops: "the Monolith, but ours".', example: 'The Gilded Ledger, a payments company.' },
  { kind: 'new_topic', title: 'Teach something else', for: 'Incident response, security, product discovery.', example: 'SRE: The Pager Storm.' },
]

const PATH = [
  { name: 'Make it.', text: 'Step by step, from one of the game\'s scenarios, or from scratch.' },
  { name: 'Check it.', text: 'The game\'s own checks run as you work.' },
  { name: 'Play it.', text: 'Try your pack in the game, in a tab of its own.' },
  { name: 'Share it.', text: 'Export a pack file; players import it in the game\'s bazaar.' },
]
</script>

<style scoped>
.welcome {
  flex: 1;
  width: 100%;
  max-width: 75rem;
  margin: 0 auto;
  padding: 3rem 2.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.welcome:focus {
  outline: none;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: center;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-title {
  margin: 0;
  font-size: clamp(2rem, 4.5vw, 3rem);
  line-height: 1.15;
  text-wrap: balance;
}

.hero-lede {
  margin: 0;
  max-width: 38rem;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--forge-text-bright);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

a.button {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.turn {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.turn-card {
  margin: 0;
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-rail);
  line-height: 1.55;
}

.turn-card strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--forge-text-bright);
}

.turn-text {
  margin: 0;
  font-size: 0.9375rem;
}

.continue,
.block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.continue-tiles {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1rem;
}

.continue-tile {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.125rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.continue-name {
  font-weight: 600;
  color: var(--forge-text-bright);
}

a.continue-name {
  color: var(--forge-gold);
}

.continue-line {
  font-size: 0.9375rem;
}

.continue-open {
  align-self: flex-start;
  margin-top: auto;
}

.continue-all {
  justify-content: center;
  border-style: dashed;
  background: transparent;
}

.block-title {
  margin: 0;
  font-size: 1.375rem;
}

.parts {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 1rem 1.5rem;
}

.part {
  padding-top: 0.75rem;
  border-top: 2px solid var(--forge-hairline-strong);
}

.part dt {
  font-family: var(--forge-font-heading);
  font-weight: 600;
  color: var(--forge-text-bright);
}

.part dd {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
}

.kinds {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
  gap: 1rem;
}

.kind {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.125rem 1.25rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.kind p {
  margin: 0;
}

.kind-title {
  margin: 0;
  font-size: 1.125rem;
  color: var(--forge-text-bright);
}

.kind-example {
  font-size: 0.9375rem;
  color: var(--forge-text-secondary);
}

.path {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: path;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.75rem;
}

.path li {
  counter-increment: path;
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  border: 1px dashed var(--forge-hairline-strong);
  font-size: 0.9375rem;
}

.path li::before {
  content: counter(path);
  display: block;
  font-family: var(--forge-font-heading);
  color: var(--forge-gold);
}

.path strong {
  color: var(--forge-text-bright);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--forge-hairline);
  font-size: 0.9375rem;
}

.welcome-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 2.5rem;
  border-top: 1px solid var(--forge-hairline);
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}

@media (max-width: 52rem) {
  .hero {
    grid-template-columns: 1fr;
  }

  .welcome {
    padding: 2rem 1.25rem;
  }
}
</style>
