<template>
  <!--
    The guided round's header (D20): ember, with its pill, so you always know
    you're in a lesson and how to leave it. Below it, the steps: any can be
    opened, and each ticks when the draft has what it asks for (the domain's
    roundProgress).
  -->
  <div class="guided-bar">
    <div class="bar-row">
      <span class="guided-pill">Guided round</span>
      <span class="bar-what">Retell DDDnD for your organization</span>
      <span class="bar-name">{{ draft.name || 'Untitled pack' }}</span>
      <span class="bar-save" role="status" aria-live="polite">{{ saveText }}</span>
      <button type="button" class="leave" @click="$emit('leave')">Leave the round (your work is kept)</button>
    </div>
    <ol class="steps" aria-label="Steps of the round">
      <li v-for="(item, index) in progress" :key="item.step">
        <button
          type="button"
          class="step"
          :class="{ 'step-done': item.done, 'step-current': item.current }"
          :aria-current="item.current ? 'step' : undefined"
          @click="$emit('goTo', item.step)"
        >
          {{ index + 1 }} {{ ROUND_WORDS[item.step].short }}<span v-if="item.done" aria-hidden="true"> ✓</span><span v-if="item.done" class="visually-hidden"> (done)</span>
        </button>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { roundProgress, type DraftPack, type RoundStep } from '@/domains/authoring'
import { ROUND_WORDS } from '@studio/guided/round_words'

const props = defineProps<{ draft: DraftPack; saveText: string; checksClean: boolean }>()
defineEmits<{ leave: []; goTo: [step: RoundStep] }>()

const progress = computed(() => roundProgress(props.draft, { clean: props.checksClean }))
</script>

<style scoped>
.guided-bar {
  flex: none;
  border-bottom: 2px solid var(--forge-ember);
  background: var(--forge-ember-ground);
}

.bar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.875rem;
  padding: 0.625rem 1.5rem;
}

.guided-pill {
  padding: 0.1875rem 0.625rem;
  border-radius: 999px;
  background: var(--forge-ember);
  color: var(--forge-ember-ink);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.bar-what {
  color: var(--forge-ember-soft);
}

.bar-name {
  font-weight: 600;
  color: var(--forge-text-bright);
}

.bar-save {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.leave {
  margin-left: auto;
  min-height: 2.5rem;
  padding: 0 0.5rem;
  border: none;
  background: none;
  color: var(--forge-ember-soft);
  font: inherit;
  font-size: 0.9375rem;
  text-decoration: underline;
  cursor: pointer;
}

.steps {
  margin: 0;
  padding: 0.25rem 1.5rem 0.75rem;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.step {
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--forge-hairline-strong);
  background: transparent;
  color: var(--forge-text-secondary);
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}

.step-done {
  border-color: transparent;
  background: rgba(143, 209, 143, 0.12);
  color: var(--forge-up);
}

.step-current {
  border-color: transparent;
  background: var(--forge-gold);
  color: #1a1206;
  font-weight: 600;
}
</style>
