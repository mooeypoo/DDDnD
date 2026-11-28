<template>
  <section class="editor" :aria-labelledby="`add-${section}`">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">From the game</span>
        <h1 :id="`add-${section}`" class="editor-title">Add {{ section === 'cards' ? 'cards' : 'events' }} from DDDnD</h1>
      </div>
    </div>
    <p class="field-hint">The base game's {{ section }} that aren't in your deck yet. Adding one is a reference: it plays exactly as in the game.</p>

    <label class="field filter">Filter by name
      <input v-model="filter" type="search" autocomplete="off" />
    </label>

    <p v-if="!choices" class="loading" role="status">Loading the game's {{ section }}…</p>
    <p v-else-if="shown.length === 0" class="loading">{{ choices.length === 0 ? `Every ${section === 'cards' ? 'card' : 'event'} from the game is already in your deck.` : 'Nothing matches that name.' }}</p>
    <ul v-else class="choice-list">
      <li v-for="choice in shown" :key="choice.ref.id" class="choice-row">
        <span class="choice-text">
          <span class="choice-name">{{ choice.name }}</span>
          <span class="choice-summary">{{ choice.summary }}</span>
        </span>
        <button type="button" class="button button-quiet" :aria-label="`Add ${choice.name} to the deck`" @click="add(choice.ref)">Add to deck</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { addToDeck, isReferenced, type DeckSection, type DraftPack } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import { listBaseRefs, loadFirstParty } from '@studio/content/first_party'

const props = defineProps<{ section: DeckSection; draft: DraftPack }>()
const emit = defineEmits<{ change: [draft: DraftPack] }>()

interface Choice { ref: VersionRef; name: string; summary: string }

const filter = ref('')
const all = ref<Choice[] | null>(null)

watch(() => props.section, async (section) => {
  all.value = null
  const [{ base }, refs] = await Promise.all([loadFirstParty(), listBaseRefs(section)])
  const loaded = await Promise.all(refs.map(async (ref) => {
    const entity = section === 'cards' ? await base.loadCard(ref) : await base.loadEvent(ref)
    return { ref, name: entity.name, summary: entity.description }
  }))
  all.value = loaded.sort((a, b) => a.name.localeCompare(b.name))
}, { immediate: true })

const choices = computed(() => all.value?.filter((choice) => !isReferenced(props.draft, props.section === 'cards' ? 'card_refs' : 'event_refs', choice.ref)) ?? null)
const shown = computed(() => {
  const needle = filter.value.trim().toLowerCase()
  return (choices.value ?? []).filter((choice) => !needle || choice.name.toLowerCase().includes(needle))
})

function add(ref: VersionRef) {
  emit('change', addToDeck(props.draft, props.section, ref))
}
</script>

<style scoped>



.filter {
  max-width: 24rem;
}

.choice-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.choice-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid rgba(160, 112, 24, 0.2);
}

.choice-row:last-child {
  border-bottom: none;
}

.choice-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1 1 16rem;
}

.choice-name {
  color: var(--forge-text-bright);
  font-weight: 500;
}

.choice-summary {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}
</style>
