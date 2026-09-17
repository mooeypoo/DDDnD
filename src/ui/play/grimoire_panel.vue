<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="Grimoire"
    subtitle="Look, but do not play. These cards are not in your hand."
    size="lg"
    @close="$emit('close')"
  >
    <p v-if="cards.length === 0" class="grimoire-empty">The remaining shelves are empty.</p>
    <ul v-else class="grimoire-list">
      <li v-for="entry in cards" :key="entry.card.id + '-v' + entry.card.version">
        <button class="grimoire-row" type="button" @click="$emit('inspect', entry.card.id)">
          <span class="grimoire-name">{{ entry.card.name }}</span>
          <span class="grimoire-copy">{{ entry.availability?.short_summary ?? entry.card.description }}</span>
        </button>
      </li>
    </ul>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import type { Card } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'

defineProps<{
  isOpen: boolean
  cards: Array<{ card: Card; availability?: TurnBriefingActionSummary }>
}>()

defineEmits<{
  close: []
  inspect: [cardId: string]
}>()
</script>

<style scoped>
.grimoire-empty {
  margin: 0;
  color: var(--text-secondary);
}

.grimoire-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.grimoire-row {
  width: 100%;
  appearance: none;
  border: 1px solid rgba(176, 132, 42, 0.22);
  background: rgba(8, 12, 16, 0.45);
  color: inherit;
  text-align: left;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
}

.grimoire-row:hover {
  border-color: rgba(232, 196, 96, 0.45);
}

.grimoire-name {
  display: block;
  font-family: var(--font-heading);
  color: var(--text-bright);
  margin-bottom: 0.2rem;
}

.grimoire-copy {
  display: block;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.35;
}
</style>
