<template>
  <div
    v-if="flight"
    class="commitment-flight"
    :class="[flight.mode, { moving: flight.moving, held: flight.held }]"
    :style="flightStyle"
    aria-hidden="true"
  >
    <span class="flight-kicker">{{
      flight.held
        ? (flight.mode === 'consult' ? 'Holding' : 'Committed')
        : (flight.mode === 'consult' ? 'Set aside' : 'Played')
    }}</span>
    <span class="flight-name">{{ flight.name }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { CommitmentFlight } from '@/ui/play/use_commitment_flight'
import { CARD_FLIGHT_DURATION_MS } from '@/ui/play/table_moment'

const props = defineProps<{
  flight: CommitmentFlight | null
}>()

const flightStyle = computed(() => {
  const flight = props.flight
  if (!flight) {
    return {}
  }

  return {
    width: `${flight.width}px`,
    height: `${flight.height}px`,
    transform: `translate3d(${flight.x}px, ${flight.y}px, 0) rotate(${flight.rotate}deg) scale(${flight.scale})`,
    transitionDuration: flight.moving ? `${CARD_FLIGHT_DURATION_MS}ms` : '0ms',
  }
})
</script>

<style scoped>
.commitment-flight {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.2rem;
  padding: 0.45rem 0.5rem 0.5rem;
  border-radius: 10px;
  pointer-events: none;
  transform-origin: 50% 50%;
  background:
    linear-gradient(180deg, rgba(62, 42, 12, 0.96), rgba(18, 12, 6, 0.96));
  border: 1px solid rgba(232, 196, 96, 0.7);
  box-shadow:
    0 18px 28px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 220, 140, 0.22);
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.22, 0.84, 0.28, 1);
}

.commitment-flight.consult {
  border-color: rgba(196, 168, 96, 0.55);
}

.commitment-flight.held {
  z-index: 70;
  box-shadow:
    0 0 22px rgba(232, 196, 96, 0.55),
    0 16px 24px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 220, 140, 0.22);
  animation: commit-bob 1.6s ease-in-out infinite;
}

@keyframes commit-bob {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.12); }
}

.flight-kicker {
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #f0c060;
}

.flight-name {
  font-family: var(--font-heading);
  font-size: 0.82rem;
  line-height: 1.2;
  color: var(--dng-title-gold);
}

@media (prefers-reduced-motion: reduce) {
  .commitment-flight,
  .commitment-flight.held {
    animation: none;
  }

  .commitment-flight:not(.held) {
    display: none;
  }
}
</style>
