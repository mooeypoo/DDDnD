<template>
  <!--
    "Teach another subject" (M4.17, §3): a name and a sentence, then a small
    skeleton the summary walks the author through. The game's outcome tiers
    come with it (the owner's call); scores, council, cards and endings are
    the author's.
  -->
  <main id="main" class="new-view" tabindex="-1">
    <button type="button" class="button button-quiet back" @click="$emit('back')">‹ Your packs</button>
    <div class="new-head">
      <span class="kind-pill">A different topic</span>
      <h1 class="new-title">Teach another subject</h1>
      <p class="new-lede">
        Your own scores, council, cards and endings, about something other than domain-driven design: incident response,
        security, product discovery. You start with a scenario, an ending every run can reach, and a class to play as.
        The guided round then builds the rest with you, step by step, in two sittings; or start on your own, and the
        summary lists what's left. The SRE pack shows a finished one.
      </p>
    </div>

    <form class="topic-form" @submit.prevent="start(true)">
      <label class="field">What does your pack teach?
        <input v-model="name" maxlength="80" placeholder="Incident response" required autocomplete="off" />
        <span class="field-hint">This names the pack and its first scenario. You can change both later.</span>
      </label>
      <label class="field">In a sentence, for players (optional)
        <input v-model="description" maxlength="300" placeholder="Keep the pager quiet without burning out the team." autocomplete="off" />
      </label>
      <div class="topic-actions">
        <button type="submit" class="button button-primary" :disabled="!name.trim() || starting !== null">{{ starting === 'guided' ? 'Starting…' : 'Start with the guided round' }}</button>
        <button type="button" class="button button-quiet" :disabled="!name.trim() || starting !== null" @click="start(false)">{{ starting === 'own' ? 'Starting…' : 'Start on my own' }}</button>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { startNewTopic } from '@studio/state/studio_state'

const emit = defineEmits<{ openDraft: [draftId: string, guided: boolean]; back: [] }>()

const name = ref('')
const description = ref('')
const starting = ref<'guided' | 'own' | null>(null)

/** The topic's skeleton, opened in the guided round (§5) or in the workspace. */
async function start(guided: boolean) {
  if (!name.value.trim() || starting.value) return
  starting.value = guided ? 'guided' : 'own'
  try {
    emit('openDraft', await startNewTopic(name.value, description.value, { guided }), guided)
  } finally {
    starting.value = null
  }
}
</script>

<style scoped>
.new-view {
  flex: 1;
  width: 100%;
  max-width: 48rem;
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
  color: var(--forge-teal);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.new-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--forge-gold);
}

.new-lede {
  margin: 0;
}

.topic-form {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  padding: 1.5rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.topic-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
