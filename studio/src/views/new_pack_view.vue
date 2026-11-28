<template>
  <!--
    Starting a pack (the UI/UX audit, slice 4; Q14): one step in from the
    start screen, so the start screen leads with the author's own packs.
    Each of the game's scenarios is copied with its council, cards and events.
  -->
  <main id="main" class="new-view" tabindex="-1">
    <button type="button" class="button button-quiet back" @click="$emit('back')">‹ Your packs</button>
    <div class="new-head">
      <span class="kind-pill" :class="{ 'kind-guided': guided }">{{ guided ? 'Guided round' : 'Same game, new setting' }}</span>
      <h1 class="new-title">{{ guided ? 'Which of the game\'s stories is closest to yours?' : 'Choose a scenario to retell' }}</h1>
      <p v-if="guided" class="new-lede">
        The round starts from a copy of one of the game's scenarios, so your pack plays from the first minute.
        Then, step by step, it becomes about your organization: your system, your people, the moves your team argues about.
        Pick the one whose trouble sounds most like yours; you'll rewrite the rest.
      </p>
      <p v-if="guided" class="new-lede">
        Teaching something other than domain-driven design?
        <button type="button" class="link-button" @click="$emit('newTopic')">Start a new topic, with its own round</button>
      </p>
      <p v-else class="new-lede">
        Your copy starts with the scenario's council, cards and events, and plays exactly like it. Then make it yours:
        your story, your people, the moves your team argues about. The original stays as it is.
      </p>
    </div>

    <p v-if="scenarioError" class="note-warning" role="alert">The game's scenarios couldn't be loaded: {{ scenarioError }}</p>
    <p v-else-if="!scenarios" class="loading" role="status">Loading the game's scenarios…</p>
    <ul v-else class="scenario-list" aria-label="DDDnD scenarios">
      <li v-for="scenario in scenarios" :key="scenario.ref.id" class="scenario-row">
        <span class="scenario-text">
          <span class="scenario-name">{{ scenario.name }}</span>
          <span class="scenario-summary">{{ scenario.summary }}</span>
        </span>
        <button
          type="button"
          class="button button-quiet"
          :disabled="starting !== null"
          :aria-label="guided ? `Start the round from ${scenario.name}` : `Copy and adapt ${scenario.name}`"
          @click="start(scenario)"
        ><span :class="{ working: starting === scenario.ref.id }">{{ starting === scenario.ref.id ? 'Copying…' : guided ? 'Start from this one' : 'Copy and adapt' }}</span></button>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { listBaseScenarios, type BaseScenarioChoice } from '@studio/content/first_party'
import { startFromBaseScenario } from '@studio/state/studio_state'

const props = withDefaults(defineProps<{ guided?: boolean }>(), { guided: false })
const emit = defineEmits<{ openDraft: [draftId: string]; newTopic: []; back: [] }>()

const scenarios = ref<BaseScenarioChoice[] | null>(null)
const scenarioError = ref<string | null>(null)
const starting = ref<string | null>(null)

onMounted(async () => {
  try {
    scenarios.value = await listBaseScenarios()
  } catch (error) {
    scenarioError.value = (error as Error).message
  }
})

async function start(choice: BaseScenarioChoice) {
  starting.value = choice.ref.id
  try {
    emit('openDraft', await startFromBaseScenario(choice, { guided: props.guided }))
  } finally {
    starting.value = null
  }
}
</script>

<style scoped>
.new-view {
  flex: 1;
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 2.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.new-view:focus {
  outline: none;
}

.back {
  align-self: flex-start;
}

.new-head {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.kind-pill {
  align-self: flex-start;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  color: var(--forge-gold);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.kind-guided {
  border-color: var(--forge-ember);
  background: var(--forge-ember);
  color: var(--forge-ember-ink);
}

.new-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--forge-gold);
}

.new-lede {
  margin: 0;
}

.scenario-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.scenario-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(160, 112, 24, 0.2);
}

.scenario-row:last-child {
  border-bottom: none;
}

.scenario-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1 1 18rem;
  min-width: 0;
}

.scenario-name {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.scenario-summary {
  font-size: 0.9375rem;
  color: var(--forge-text-secondary);
}

.note-warning {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid rgba(251, 191, 36, 0.45);
}
</style>
