<template>
  <section
    class="hand-dock"
    data-play-highlight="hand"
    aria-label="Your hand"
  >
    <p class="hand-kicker">
      <span>Hand</span>
      <span class="hand-count">{{ cards.length }}</span>
    </p>

    <div class="hand-fan" role="list">
      <div
        v-for="(entry, index) in cards"
        :key="entry.card.id + '-v' + entry.card.version"
        class="fan-slot"
        :style="fanStyle(index)"
        role="listitem"
      >
        <TableCard
          :card="entry.card"
          :availability="entry.availability"
          :isDisabled="isDisabled"
          :isTutorialLocked="isCardLocked(entry.card.id)"
          :isTutorialHighlighted="isCardHighlighted(entry.card.id)"
          :primaryActionLabel="primaryActionLabel"
          @showDetails="$emit('showDetails', entry.card.id)"
          @play="$emit('play', $event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Card } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import TableCard from '@/ui/play/table_card.vue'
import { handFanTransform } from '@/ui/play/turn_theater'

const props = defineProps<{
  cards: Array<{ card: Card; availability?: TurnBriefingActionSummary }>
  isDisabled?: boolean
  requiredCardId?: string | null
  consultMode?: boolean
}>()

defineEmits<{
  play: [cardId: string]
  showDetails: [cardId: string]
}>()

const primaryActionLabel = computed(() => (props.consultMode ? 'Set aside' : undefined))

function isCardLocked(cardId: string): boolean {
  if (props.consultMode) {
    return false
  }

  return Boolean(props.requiredCardId && cardId !== props.requiredCardId)
}

function isCardHighlighted(cardId: string): boolean {
  if (props.consultMode) {
    return false
  }

  return Boolean(props.requiredCardId && cardId === props.requiredCardId)
}

function fanStyle(index: number) {
  const { rotate, y } = handFanTransform(index, props.cards.length)
  return {
    transform: `rotate(${rotate}deg) translateY(${y}px)`,
    zIndex: String(index + 1),
  }
}
</script>

<style scoped>
.hand-dock {
  --hand-dock-height: 260px;
  position: relative;
  min-height: var(--hand-dock-height);
  padding: 0.2rem 0.4rem 1.6rem;
}

.hand-kicker {
  margin: 0 auto 0.15rem;
  width: fit-content;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  font-family: var(--font-heading);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.hand-count {
  font-size: 0.86rem;
  color: var(--text-bright);
}

.hand-fan {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  min-height: 220px;
  padding: 0 0.5rem 1.1rem;
}

.fan-slot {
  margin-left: -2.4rem;
  transform-origin: 50% 110%;
  transition: transform 180ms ease, z-index 0s;
}

.fan-slot:first-child {
  margin-left: 0;
}

.fan-slot:hover,
.fan-slot:focus-within {
  transform: translateY(-28px) rotate(0deg) scale(1.05) !important;
  z-index: 30 !important;
}

@media (max-width: 720px) {
  .hand-dock {
    --hand-dock-height: 210px;
  }

  .hand-fan {
    justify-content: flex-start;
    overflow-x: auto;
    min-height: 180px;
    padding-bottom: 0.8rem;
    scroll-snap-type: x proximity;
  }

  .fan-slot {
    margin-left: -1.6rem;
    scroll-snap-align: center;
    flex: 0 0 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fan-slot,
  .fan-slot:hover,
  .fan-slot:focus-within {
    transform: none !important;
  }
}
</style>
