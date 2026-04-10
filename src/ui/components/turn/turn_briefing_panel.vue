<template>
  <AppFrame title="Situation Briefing" class="turn-briefing-panel">
    <template #icon><IconScroll :size="14" /></template>
    <template #header-actions>
      <span v-if="currentTurn && totalTurns" class="turn-counter">
        Turn {{ currentTurn }} / {{ totalTurns }}
      </span>
    </template>

    <h2 class="briefing-title">{{ eventTitle }}</h2>

    <p class="briefing-description">{{ narrativeDescription }}</p>

    <div class="briefing-status">
      <span class="status-badge actions-badge">
        <span class="badge-icon"><IconSwords :size="14" /></span>
        {{ availableActions }} action{{ availableActions === 1 ? '' : 's' }} available
      </span>
      <span class="status-badge" :class="pendingAftershocks ? 'aftershocks-badge' : 'quiet-badge'">
        <span class="badge-icon"><IconLightning :size="14" /></span>
        {{ pendingAftershocks || 'No' }} aftershock{{ pendingAftershocks === 1 ? '' : 's' }} pending
      </span>
    </div>

    <!-- Low Turns Warning -->
    <div v-if="isLowTurns" class="low-turns-warning">
      <div class="warning-icon">⏰</div>
      <div class="warning-content">
        <div class="warning-title">Turns Running Low</div>
        <div class="warning-message">
          Only {{ turnsRemaining }} turn{{ turnsRemaining === 1 ? '' : 's' }} remaining. Make your choices count!
        </div>
      </div>
    </div>
  </AppFrame>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppFrame from '@/ui/components/surfaces/AppFrame.vue'
import IconScroll from '@/ui/components/icons/IconScroll.vue'
import IconSwords from '@/ui/components/icons/IconSwords.vue'
import IconLightning from '@/ui/components/icons/IconLightning.vue'

const props = withDefaults(
  defineProps<{
    eventTitle: string
    narrativeDescription: string
    availableActions: number
    pendingAftershocks: number
    currentTurn?: number
    totalTurns?: number
    isTutorial?: boolean
  }>(),
  {}
)

const turnsRemaining = computed(() => {
  if (props.currentTurn && props.totalTurns) {
    return props.totalTurns - props.currentTurn + 1
  }
  return 0
})

const isLowTurns = computed(() => {
  if (props.isTutorial) return false
  return turnsRemaining.value > 0 && turnsRemaining.value <= 3
})
</script>

<style scoped>
.turn-briefing-panel :deep(.dungeon-frame__body) {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
}

.turn-counter {
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-wide);
}

.briefing-title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
}

.briefing-description {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  font-style: italic;
  border-left: 2px solid var(--dng-divider);
  padding-left: var(--space-md);
}

.briefing-status {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border: 1px solid var(--dng-divider);
  background: rgba(11, 28, 36, 0.5);
  color: var(--dng-subtitle-warm);
}

.actions-badge {
  border-color: var(--dng-bronze-mid);
  color: var(--dng-title-gold);
  background: rgba(160, 112, 24, 0.12);
}

.aftershocks-badge {
  border-color: var(--effect-warning-border);
  color: var(--effect-warning);
  background: var(--effect-warning-bg);
}

.quiet-badge {
  color: var(--text-muted);
}

.badge-icon {
  display: inline-flex;
  align-items: center;
}

.low-turns-warning {
  display: flex;
  gap: var(--space-md);
  background: linear-gradient(135deg, var(--effect-warning-bg), rgba(255, 152, 0, 0.06));
  border: 2px solid var(--effect-warning-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  align-items: flex-start;
  animation: pulse-warning 2s ease-in-out infinite;
}

.warning-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
}

.warning-title {
  font-weight: var(--font-semibold);
  color: var(--effect-warning);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.warning-message {
  color: var(--effect-warning);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

@keyframes pulse-warning {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
