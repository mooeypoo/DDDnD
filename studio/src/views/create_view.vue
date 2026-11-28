<template>
  <!--
    Create a pack (#/new, the first-screen audit, M4.28): two questions. What
    it's about sets what the second offers; how to start is step by step
    (the guided round), from one of the game's scenarios (with a preview
    before anything is copied), or from scratch. Nothing is made until the
    author says so.
  -->
  <main id="main" class="create" tabindex="-1">
    <a href="#/" class="back">‹ Welcome</a>
    <h1 class="create-title">Create a pack</h1>

    <fieldset class="question">
      <legend class="question-label">What's your pack about?</legend>
      <div class="choices">
        <label v-for="option in ABOUT" :key="option.kind" class="choice" :class="{ chosen: about === option.kind }">
          <input v-model="about" type="radio" name="about" :value="option.kind" />
          <span class="choice-text">
            <KindPill :kind="option.kind" />
            <span class="choice-title">{{ option.title }}</span>
            <span>{{ KIND_SUMMARIES[option.kind] }}</span>
          </span>
        </label>
      </div>
    </fieldset>

    <fieldset class="question">
      <legend class="question-label">How do you want to start?</legend>
      <div class="choices choices-three">
        <label v-for="option in ways" :key="option.how" class="choice" :class="{ chosen: how === option.how, 'choice-guided': option.how === 'guided' }">
          <input v-model="how" type="radio" name="how" :value="option.how" />
          <span class="choice-text">
            <span v-if="option.how === 'guided'" class="recommended">Recommended for a first pack</span>
            <span class="choice-title">{{ option.title }}</span>
            <span>{{ option.text }}</span>
          </span>
        </label>
      </div>
    </fieldset>

    <p v-if="exampleOfKind(about)" class="example-line">
      Want to see a finished one first? <a :href="`#/example/${exampleOfKind(about)!.folder}`">Look inside {{ exampleOfKind(about)!.name }}</a>: view-only, nothing is made.
    </p>

    <!-- From one of the game's scenarios (or the round's starting point): look first, then say yes -->
    <section v-if="about === 'retelling' && (how === 'guided' || how === 'scenario')" class="question" aria-labelledby="gallery-title">
      <h2 id="gallery-title" class="question-label">{{ how === 'guided' ? 'Which of the game\'s stories is closest to yours?' : 'Choose a scenario to start from' }}</h2>
      <p v-if="how === 'guided'" class="field-hint">The round starts from a copy, so your pack plays from the first minute. Pick the one whose trouble sounds most like yours; you'll rewrite the rest.</p>
      <p v-if="scenarioError" class="note note-warning" role="alert">The game's scenarios couldn't be loaded: {{ scenarioError }}</p>
      <p v-else-if="!scenarios" class="loading" role="status">Loading the game's scenarios…</p>
      <ul v-else class="gallery" aria-label="The game's scenarios">
        <li v-for="scenario in scenarios" :key="scenario.ref.id" class="scenario">
          <span class="scenario-name">{{ scenario.name }}</span>
          <span class="scenario-summary">{{ scenario.summary }}</span>
          <span class="scenario-facts">{{ scenario.council }} at the table · {{ scenario.cards }} cards · {{ scenario.events }} events · {{ scenario.turns }} turns</span>
          <button type="button" class="button button-quiet" :aria-label="`Preview ${scenario.name}`" @click="openPreview(scenario, $event)">Preview</button>
        </li>
      </ul>
    </section>

    <!-- From an example (M4.30): what it is, a look inside, then your copy's name -->
    <form v-else-if="how === 'example' && subjectExample" class="question name-form" @submit.prevent="startCopy">
      <h2 class="question-label">Start from {{ subjectExample.name }}</h2>
      <div class="example-card">
        <span class="choice-title">{{ subjectExample.name }}</span>
        <span>{{ subjectExample.description }}</span>
        <a :href="`#/example/${subjectExample.folder}`" target="_blank" rel="noopener">Look inside first<span class="visually-hidden"> (opens in a new tab)</span></a>
      </div>
      <p class="field-hint">Your copy has all of it, under your name and a pack id of its own. Change anything; the original stays as it is.</p>
      <label class="field">What will you call it?
        <input v-model="name" maxlength="80" placeholder="Incident response" required autocomplete="off" />
      </label>
      <label class="field">In a sentence, for players (optional)
        <input v-model="description" maxlength="300" :placeholder="subjectExample.description.slice(0, 80)" autocomplete="off" />
      </label>
      <p v-if="startError" class="note note-warning" role="alert">{{ startError }}</p>
      <button type="submit" class="button button-primary" :disabled="!name.trim() || starting !== null">
        <span :class="{ working: starting === 'named' }">{{ starting === 'named' ? 'Copying…' : 'Make my copy' }}</span>
      </button>
    </form>

    <!-- From scratch, or a new subject's round: a name and a sentence -->
    <form v-else-if="how === 'scratch' || (about === 'new_topic' && how === 'guided')" class="question name-form" @submit.prevent="startNamed">
      <h2 class="question-label">{{ about === 'new_topic' ? 'What does your pack teach?' : 'What\'s your pack called?' }}</h2>
      <label class="field">{{ about === 'new_topic' ? 'Its subject' : 'Its name' }}
        <input v-model="name" maxlength="80" :placeholder="about === 'new_topic' ? 'Incident response' : 'Payments at Acme'" required autocomplete="off" />
        <span class="field-hint">This names the pack and its first scenario. You can change both later.</span>
      </label>
      <label class="field">In a sentence, for players (optional)
        <input v-model="description" maxlength="300" :placeholder="about === 'new_topic' ? 'Keep the pager quiet without burning out the team.' : 'Untangle the payments monolith before the audit.'" autocomplete="off" />
      </label>
      <p v-if="startError" class="note note-warning" role="alert">{{ startError }}</p>
      <button type="submit" class="button button-primary" :disabled="!name.trim() || starting !== null">
        <span :class="{ working: starting === 'named' }">{{ starting === 'named' ? 'Starting…' : how === 'guided' ? 'Start the guided round' : 'Create the pack' }}</span>
      </button>
    </form>

    <p class="import-line">
      Already have a pack file or zip?
      <ImportButton link label="Import it" @imported="(id) => $emit('openDraft', id, false)" />
      to keep editing it.
    </p>

    <ScenarioPreview
      v-if="previewing"
      :choice="previewing"
      :guided="how === 'guided'"
      :starting="starting === 'scenario'"
      @start="startFromScenario(previewing!)"
      @close="closePreview"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import { KIND_SUMMARIES, type DraftKind } from '@/domains/authoring'
import ImportButton from '@studio/components/import_button.vue'
import { exampleOfKind } from '@studio/content/example_packs'
import KindPill from '@studio/components/kind_pill.vue'
import ScenarioPreview from '@studio/components/scenario_preview.vue'
import { listBaseScenarios, type BaseScenarioChoice } from '@studio/content/first_party'
import { startFromBaseScenario, startFromExample, startNewTopic, startRetellingFromScratch } from '@studio/state/studio_state'

type How = 'guided' | 'scenario' | 'example' | 'scratch'

/** Old addresses (#/new-topic, #/guided) arrive with their answers already chosen. */
const props = withDefaults(defineProps<{ about?: DraftKind; how?: How | null }>(), { about: 'retelling', how: null })
const emit = defineEmits<{ openDraft: [draftId: string, guided: boolean] }>()

const ABOUT: Array<{ kind: DraftKind; title: string }> = [
  { kind: 'retelling', title: 'Domain-driven design, in your world' },
  { kind: 'new_topic', title: 'Something else' },
]

const about = ref<DraftKind>(props.about)
const how = ref<How | null>(props.how)

/** The ways in for each kind: a new subject has no scenario of the game's to start from. */
const subjectExample = exampleOfKind('new_topic')
const ways = computed(() => about.value === 'retelling'
  ? [
      { how: 'guided' as const, title: 'Step by step', text: 'A guided round builds a small, playable pack with you, about your own organization. About 15 minutes, with an example beside every step.' },
      { how: 'scenario' as const, title: 'From one of the game\'s scenarios', text: 'A working, balanced scenario to change: its council, cards and events come with it.' },
      { how: 'scratch' as const, title: 'From scratch', text: 'Your own scenario on the game\'s scores and endings. Seat your people and fill the deck, yours or the game\'s.' },
    ]
  : [
      { how: 'guided' as const, title: 'Step by step', text: 'A guided round builds it with you: what it trades off, who\'s at the table, the moves, the endings. Two sittings, with an example from the SRE pack beside every step.' },
      // A finished pack to change (M4.30): a new subject's counterpart to starting from one of the game's scenarios
      ...(subjectExample ? [{ how: 'example' as const, title: 'From an example', text: `A finished pack to change: ${subjectExample.name}, with its scores, council, cards and endings.` }] : []),
      { how: 'scratch' as const, title: 'From scratch', text: 'A scenario, an ending every run can reach and a class to play as. The summary lists what\'s left.' },
    ])

// A way the new kind doesn't have is unchosen
watch(about, () => {
  if (how.value && !ways.value.some((way) => way.how === how.value)) how.value = null
})

const scenarios = ref<BaseScenarioChoice[] | null>(null)
const scenarioError = ref<string | null>(null)
onMounted(async () => {
  try {
    scenarios.value = await listBaseScenarios()
  } catch (error) {
    scenarioError.value = (error as Error).message
  }
})

const previewing = ref<BaseScenarioChoice | null>(null)
/** The "Preview" button that opened the dialog: focus goes back to it when the dialog closes (§10). */
let opener: HTMLElement | null = null

function openPreview(scenario: BaseScenarioChoice, event: Event) {
  opener = event.currentTarget as HTMLElement
  previewing.value = scenario
}

async function closePreview() {
  previewing.value = null
  await nextTick()
  opener?.focus()
  opener = null
}
const name = ref('')
const description = ref('')
const starting = ref<'scenario' | 'named' | null>(null)
const startError = ref<string | null>(null)

async function startFromScenario(choice: BaseScenarioChoice) {
  if (starting.value) return
  starting.value = 'scenario'
  const guided = how.value === 'guided'
  try {
    emit('openDraft', await startFromBaseScenario(choice, { guided }), guided)
  } finally {
    starting.value = null
  }
}

async function startCopy() {
  if (!subjectExample || !name.value.trim() || starting.value) return
  starting.value = 'named'
  startError.value = null
  try {
    emit('openDraft', await startFromExample(subjectExample.folder, name.value, description.value), false)
  } catch (error) {
    startError.value = (error as Error).message
  } finally {
    starting.value = null
  }
}

async function startNamed() {
  if (!name.value.trim() || starting.value) return
  starting.value = 'named'
  startError.value = null
  const guided = how.value === 'guided'
  try {
    const draftId = about.value === 'new_topic'
      ? await startNewTopic(name.value, description.value, { guided })
      : await startRetellingFromScratch(name.value, description.value)
    emit('openDraft', draftId, guided)
  } catch (error) {
    startError.value = (error as Error).message
  } finally {
    starting.value = null
  }
}
</script>

<style scoped>
.create {
  flex: 1;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 2.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.create:focus {
  outline: none;
}

.back {
  align-self: flex-start;
  font-size: 0.9375rem;
}

.create-title {
  margin: -1rem 0 0;
  font-size: 2rem;
}

.question {
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  min-width: 0;
}

.question-label {
  margin: 0 0 0.875rem;
  padding: 0;
  font-family: var(--forge-font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--forge-gold);
}

h2.question-label {
  margin-bottom: 0;
}

.choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1rem;
}

.choices-three {
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}

.choice {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem 1.125rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-panel);
  cursor: pointer;
}

.choice input {
  flex: none;
  margin-top: 0.3rem;
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--forge-gold);
}

.choice:focus-within {
  box-shadow: var(--forge-focus);
}

.choice.chosen {
  border-color: var(--forge-gold);
  box-shadow: inset 0 0 0 1px var(--forge-gold);
}

.choice-guided {
  border-color: var(--forge-ember);
  background: var(--forge-ember-ground);
}

.choice-guided input {
  accent-color: var(--forge-ember);
}

.choice-text {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.choice-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--forge-text-bright);
}

.recommended {
  align-self: flex-start;
  padding: 0.05rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--forge-ember);
  font-size: 0.75rem;
  color: var(--forge-ember-soft);
}

.gallery {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: 1rem;
}

.scenario {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.125rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.scenario .button {
  align-self: flex-start;
  margin-top: auto;
}

.scenario-name {
  font-weight: 600;
  color: var(--forge-text-bright);
}

.scenario-summary {
  font-size: 0.9375rem;
}

.scenario-facts {
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}

.name-form {
  max-width: 40rem;
}

.name-form .button {
  align-self: flex-start;
}

.example-card {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem 1.125rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
  font-size: 0.9375rem;
}

.example-card a {
  align-self: flex-start;
}

.example-line {
  margin: -1rem 0 0;
  font-size: 0.9375rem;
  color: var(--forge-text-secondary);
}

.import-line {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.375rem;
  font-size: 0.9375rem;
  color: var(--forge-text-secondary);
}

@media (max-width: 40rem) {
  .create {
    padding: 1.5rem 1.25rem;
  }
}
</style>
