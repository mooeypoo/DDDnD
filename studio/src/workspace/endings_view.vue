<template>
  <!--
    All of a topic's endings, in the order the game tries them (M4.18). The
    first one whose conditions all hold is the run's ending; the fallback,
    with none, is always last. Order and words come from the domain.
  -->
  <section class="editor" aria-labelledby="endings-title">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">In your scenario</span>
        <h1 id="endings-title" class="editor-title">Endings</h1>
      </div>
      <div class="head-actions">
        <button type="button" class="button button-quiet" :disabled="!canAdd" @click="$emit('createEnding')">+ New ending</button>
      </div>
    </div>

    <p class="field-hint">
      At the end of a run, the game tries these from the top and picks the first that fits. Put the most particular first;
      the last one, with no conditions, catches every run nothing above fits.
    </p>

    <ol class="ending-list">
      <li v-for="(ending, index) in ordered" :key="ending.id" class="ending-row">
        <span class="ending-place" aria-hidden="true">{{ index + 1 }}</span>
        <span class="ending-text">
          <button type="button" class="ending-name" @click="$emit('open', { kind: 'ending', id: ending.id })">{{ ending.name || 'Unnamed ending' }}</button>
          <span class="ending-when">Chosen {{ describeEnding(ending, names) }}.</span>
        </span>
        <span v-if="!isFallback(ending)" class="ending-move">
          <button type="button" class="button button-quiet" :disabled="index === 0" :aria-label="`Try ${ending.name} earlier`" @click="move(ending.id, 'earlier')">Earlier</button>
          <button type="button" class="button button-quiet" :disabled="index >= ordered.length - 2" :aria-label="`Try ${ending.name} later`" @click="move(ending.id, 'later')">Later</button>
        </span>
        <span v-else class="ending-fallback">every run</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { describeEnding, endingsInOrder, isFallback, moveEnding, type DraftPack } from '@/domains/authoring'
import type { Selection } from '@studio/workspace/selection'

const props = defineProps<{ draft: DraftPack; names: { scores: Record<string, string>; stakeholders: Record<string, string> }; canAdd: boolean }>()
const emit = defineEmits<{ change: [draft: DraftPack]; open: [selection: Selection]; createEnding: [] }>()

const ordered = computed(() => endingsInOrder(props.draft))

function move(id: string, direction: 'earlier' | 'later') {
  emit('change', moveEnding(props.draft, id, direction))
}
</script>

<style scoped>
.ending-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ending-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.ending-place {
  flex: none;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--forge-hairline-strong);
  color: var(--forge-gold);
  font-weight: 600;
}

.ending-text {
  flex: 1 1 20rem;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.ending-name {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: var(--forge-text-bright);
  font: inherit;
  font-weight: 600;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
}

.ending-when {
  font-size: 0.9375rem;
}

.ending-move {
  display: flex;
  gap: 0.375rem;
}

.ending-fallback {
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}
</style>
