<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    :title="replaceMode ? 'Consult the Archives' : 'Grimoire'"
    :subtitle="replaceMode
      ? 'Mark one hand card, then choose a page from the shelves — or take a random one. This spends the turn.'
      : 'Look, but do not play. These cards are not in your hand.'"
    size="lg"
    :close-on-backdrop="true"
    @close="$emit('close')"
  >
    <div v-if="replaceMode" class="grimoire-replace">
      <section class="grimoire-section" aria-label="Your hand">
        <header class="grimoire-section-head">
          <p class="grimoire-kicker">In hand</p>
          <h3>Mark the card to set aside</h3>
        </header>
        <ul class="grimoire-grid">
          <li v-for="entry in selectableHand" :key="'hand-' + entry.card.id + '-v' + entry.card.version">
            <TableCard
              :card="entry.card"
              :availability="entry.availability"
              :isTutorialLocked="isHandLocked(entry.card.id)"
              :isTutorialHighlighted="selectedHandId === entry.card.id || requiredDiscardId === entry.card.id"
              primaryActionLabel="Set aside"
              @showDetails="$emit('inspect', entry.card.id)"
              @play="$emit('selectHand', entry.card.id)"
            />
          </li>
        </ul>
      </section>

      <section class="grimoire-section" aria-label="Remaining deck">
        <header class="grimoire-section-head">
          <p class="grimoire-kicker">On the shelves</p>
          <h3>Choose the page that enters</h3>
        </header>
        <p v-if="cards.length === 0" class="grimoire-empty">The remaining shelves are empty.</p>
        <ul v-else class="grimoire-grid">
          <li v-for="entry in cards" :key="'deck-' + entry.card.id + '-v' + entry.card.version">
            <TableCard
              :card="entry.card"
              :availability="entry.availability"
              :isTutorialLocked="isDeckLocked(entry.card.id)"
              :isTutorialHighlighted="selectedDeckId === entry.card.id || requiredDrawId === entry.card.id"
              primaryActionLabel="Take this"
              @showDetails="$emit('inspect', entry.card.id)"
              @play="$emit('selectDeck', entry.card.id)"
            />
          </li>
        </ul>
      </section>
    </div>

    <template v-else>
      <p v-if="cards.length === 0" class="grimoire-empty">The remaining shelves are empty.</p>
      <ul v-else class="grimoire-list">
        <li v-for="entry in cards" :key="entry.card.id + '-v' + entry.card.version">
          <button class="grimoire-row" type="button" @click="$emit('inspect', entry.card.id)">
            <span class="grimoire-name">{{ entry.card.name }}</span>
            <span class="grimoire-effects">{{ scoreGlance(entry.card) }}</span>
            <span class="grimoire-copy">{{ entry.availability?.short_summary ?? entry.card.description }}</span>
          </button>
        </li>
      </ul>
    </template>

    <template v-if="replaceMode" #footer>
      <div class="grimoire-footer">
        <button class="grimoire-footer-btn ghost" type="button" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="grimoire-footer-btn"
          type="button"
          :disabled="!selectedHandId || Boolean(requiredDrawId)"
          @click="$emit('randomReplace')"
        >
          Replace with a random card
        </button>
        <button
          class="grimoire-footer-btn primary"
          type="button"
          :disabled="!canConfirmChosen"
          @click="$emit('confirmReplace')"
        >
          Replace these
        </button>
      </div>
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Card } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import TableCard from '@/ui/play/table_card.vue'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { shortMetricLabel } from '@/ui/play/weather_band'

const props = defineProps<{
  isOpen: boolean
  cards: Array<{ card: Card; availability?: TurnBriefingActionSummary }>
  handCards?: Array<{ card: Card; availability?: TurnBriefingActionSummary }>
  replaceMode?: boolean
  selectedHandId?: string | null
  selectedDeckId?: string | null
  requiredDiscardId?: string | null
  requiredDrawId?: string | null
}>()

defineEmits<{
  close: []
  inspect: [cardId: string]
  selectHand: [cardId: string]
  selectDeck: [cardId: string]
  randomReplace: []
  confirmReplace: []
}>()

const canConfirmChosen = computed(() => {
  return Boolean(props.selectedHandId && props.selectedDeckId)
})

const selectableHand = computed(() => {
  return (props.handCards ?? []).map((entry) => ({
    card: entry.card,
    availability: entry.availability
      ? { ...entry.availability, is_playable: true }
      : entry.availability,
  }))
})

function isHandLocked(cardId: string): boolean {
  return Boolean(props.requiredDiscardId && cardId !== props.requiredDiscardId)
}

function isDeckLocked(cardId: string): boolean {
  return Boolean(props.requiredDrawId && cardId !== props.requiredDrawId)
}

function scoreGlance(card: Card): string {
  if (card.score_changes.length === 0) return 'No immediate score shift'
  return card.score_changes.slice(0, 3).map((change) => {
    const label = shortMetricLabel(change.score_id, getMetricPresentation(change.score_id).label)
    const sign = change.delta > 0 ? '+' : ''
    return `${sign}${change.delta} ${label}`
  }).join(' · ')
}
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
  margin-bottom: 0.15rem;
}

.grimoire-effects {
  display: block;
  font-size: var(--text-sm);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #ead58a;
  margin-bottom: 0.2rem;
}

.grimoire-copy {
  display: block;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.grimoire-replace {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.grimoire-section-head h3 {
  margin: 0.1rem 0 0.55rem;
  font-family: var(--font-heading);
  font-size: 1rem;
  color: #ffe7b0;
}

.grimoire-kicker {
  margin: 0;
  font-size: var(--text-kicker);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f0c060;
}

.grimoire-grid {
  list-style: none;
  margin: 0;
  padding: 0 0 0.4rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 0.7rem;
}

.grimoire-grid li {
  justify-self: start;
}

.grimoire-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
  width: 100%;
}

.grimoire-footer-btn {
  appearance: none;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(176, 132, 42, 0.45);
  background: rgba(18, 12, 6, 0.9);
  color: var(--text-secondary);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.grimoire-footer-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.grimoire-footer-btn.ghost {
  background: transparent;
}

.grimoire-footer-btn.primary {
  border-color: rgba(232, 196, 96, 0.7);
  color: var(--dng-title-gold);
}

@media (max-width: 720px) {
  .grimoire-grid {
    grid-template-columns: repeat(auto-fill, minmax(122px, 1fr));
    gap: 0.45rem;
  }
}
</style>
