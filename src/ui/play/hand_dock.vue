<template>
  <section
    class="hand-dock"
    data-play-highlight="hand"
    aria-label="Your hand"
  >
    <div class="hand-stage">
      <button
        v-if="canConsult"
        class="consult-action"
        type="button"
        :class="{ armed: consultMode }"
        :disabled="isDisabled"
        @click="$emit('toggleConsult')"
      >
        <span class="consult-kicker">{{ consultMode ? 'Searching the shelves' : 'Replace a card in hand' }}</span>
        <span class="consult-title">{{ consultMode ? 'Cancel search' : 'Consult the Archives' }}</span>
        <span class="consult-copy">
          {{ consultMode
            ? 'Mark a hand card and choose a Grimoire page, or take a random one.'
            : 'Spend the turn. Search the Grimoire for a replacement.' }}
        </span>
      </button>

      <div class="hand-main">
        <p class="hand-kicker">
          <span>Hand</span>
          <span class="hand-count">{{ cards.length }}</span>
        </p>

        <div class="hand-fan" role="list">
          <div
            v-for="(entry, index) in cards"
            :key="entry.card.id + '-v' + entry.card.version"
            class="fan-slot"
            :data-card-id="entry.card.id"
            :style="fanStyle(index)"
            role="listitem"
          >
            <TableCard
              :card="entry.card"
              :availability="entry.availability"
              :isDisabled="isDisabled"
              :isTutorialLocked="isCardLocked(entry.card.id)"
              :isTutorialHighlighted="isCardHighlighted(entry.card.id)"
              @showDetails="$emit('showDetails', entry.card.id)"
              @play="$emit('play', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Card } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import TableCard from '@/ui/play/table_card.vue'
import { handFanTransform } from '@/ui/play/turn_theater'

const props = defineProps<{
  cards: Array<{ card: Card; availability?: TurnBriefingActionSummary }>
  isDisabled?: boolean
  requiredCardId?: string | null
  consultMode?: boolean
  canConsult?: boolean
}>()

defineEmits<{
  play: [cardId: string]
  showDetails: [cardId: string]
  toggleConsult: []
}>()

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
  position: relative;
  min-height: var(--hand-dock-height, 260px);
  padding: 0.2rem 0.4rem 1.6rem;
}

.hand-stage {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.7rem;
}

.hand-main {
  min-width: 0;
  flex: 1;
}

.consult-action {
  appearance: none;
  flex: 0 0 auto;
  width: min(13.5rem, 36vw);
  margin-bottom: 1.4rem;
  padding: 0.85rem 0.85rem 0.9rem;
  text-align: left;
  border-radius: 14px;
  border: 1px solid rgba(232, 196, 96, 0.7);
  background:
    linear-gradient(180deg, rgba(78, 52, 16, 0.98), rgba(26, 16, 6, 0.96));
  color: var(--text-primary);
  box-shadow:
    inset 0 1px 0 rgba(255, 220, 140, 0.28),
    0 0 18px rgba(232, 196, 96, 0.18),
    0 10px 22px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.consult-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.consult-action.armed {
  border-color: rgba(240, 208, 96, 0.85);
  box-shadow:
    0 0 0 1px rgba(240, 208, 96, 0.35),
    0 10px 22px rgba(0, 0, 0, 0.4);
}

.consult-kicker {
  display: block;
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #f0c060;
}

.consult-title {
  display: block;
  margin: 0.2rem 0 0.3rem;
  font-family: var(--font-heading);
  font-size: 1.02rem;
  line-height: 1.2;
  color: var(--dng-title-gold);
}

.consult-copy {
  display: block;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--text-secondary);
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

  .hand-stage {
    flex-direction: column;
    align-items: stretch;
  }

  .consult-action {
    width: 100%;
    margin-bottom: 0;
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
