<template>
  <div class="game-hud" role="banner" aria-label="Game status bar">
    <div class="hud-inner">
      <!-- Turn tracker -->
      <div class="hud-turn" :title="`Turn ${currentTurn} of ${maxTurns}`">
        <span class="turn-icon">⚔️</span>
        <span class="turn-label-text">Turn</span>
        <span class="turn-text">
          <span class="turn-current">{{ currentTurn }}</span>
          <span class="turn-sep">/</span>
          <span class="turn-max">{{ maxTurns }}</span>
        </span>
        <div class="turn-progress">
          <div class="turn-progress-fill" :style="{ width: turnProgress + '%' }"></div>
        </div>
      </div>

      <!-- Divider -->
      <div class="hud-divider" aria-hidden="true"></div>

      <!-- Scores section -->
      <div class="hud-section" v-if="scores">
        <span class="hud-section-label">📊 <span class="hud-section-label-text">System</span></span>
        <ScoreHud :scores="scores" />
      </div>

      <!-- Divider -->
      <div class="hud-divider" aria-hidden="true"></div>

      <!-- Stakeholders section -->
      <div class="hud-section" v-if="stakeholders">
        <span class="hud-section-label">👥 <span class="hud-section-label-text">Stakeholders</span></span>
        <StakeholderHud
          :stakeholders="stakeholders"
          :stakeholderNames="stakeholderNames"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StakeholderSnapshot } from '@/domains/simulation/model'
import ScoreHud from '@/ui/components/scores/score_hud.vue'
import StakeholderHud from '@/ui/components/stakeholders/stakeholder_hud.vue'

const props = defineProps<{
  currentTurn: number
  maxTurns: number
  scores?: Record<string, number>
  stakeholders?: StakeholderSnapshot
  stakeholderNames?: Record<string, string>
}>()

const turnProgress = computed(() => {
  if (!props.maxTurns) return 0
  return Math.round((props.currentTurn / props.maxTurns) * 100)
})
</script>

<style scoped>
.game-hud {
  position: sticky;
  top: 0;
  z-index: var(--z-hud);
  background: var(--hud-bg);
  border-bottom: 1px solid var(--hud-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-height: var(--hud-height);
  display: flex;
  align-items: center;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
}

.hud-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  min-height: var(--hud-height);
  flex-wrap: wrap;
}

/* HUD section: groups label + panel */
.hud-section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.hud-section-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  line-height: 1;
}

.hud-section-label-text {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

/* Turn tracker */
.hud-turn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.turn-icon {
  font-size: var(--text-sm);
}

.turn-label-text {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.turn-text {
  display: flex;
  align-items: baseline;
  gap: 1px;
  font-family: var(--font-mono);
  font-weight: var(--font-bold);
  line-height: 1;
}

.turn-current {
  color: var(--text-accent);
  font-size: var(--text-base);
}

.turn-sep {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.turn-max {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.turn-progress {
  width: 40px;
  height: 4px;
  background: var(--bg-overlay-strong);
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
}

.turn-progress-fill {
  height: 100%;
  background: var(--text-accent);
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) cubic-bezier(0.4, 0, 0.2, 1);
}

/* Divider */
.hud-divider {
  width: 1px;
  height: 24px;
  background: var(--border-subtle);
  flex-shrink: 0;
}

/* Desktop: scale up HUD elements */
@media (min-width: 769px) {
  .hud-section-label {
    font-size: var(--text-sm);
  }

  .hud-section-label-text {
    font-size: var(--text-xs);
  }

  .turn-icon {
    font-size: var(--text-base);
  }

  .turn-label-text {
    font-size: var(--text-xs);
  }

  .turn-current {
    font-size: var(--text-lg);
  }

  .turn-sep,
  .turn-max {
    font-size: var(--text-sm);
  }

  .turn-progress {
    width: 52px;
    height: 5px;
  }

  .hud-divider {
    height: 28px;
  }
}

@media (max-width: 768px) {
  .game-hud {
    min-height: auto;
  }

  .hud-inner {
    padding: var(--space-xs) var(--space-sm);
    gap: var(--space-xs) var(--space-sm);
    justify-content: center;
  }

  .turn-progress {
    width: 28px;
  }

  .turn-label-text,
  .hud-section-label-text {
    display: none;
  }

  .hud-divider {
    height: 18px;
  }

  .hud-section {
    gap: var(--space-xs);
  }
}

@media (max-width: 480px) {
  .hud-inner {
    gap: var(--space-xs) var(--space-1);
  }

  .turn-progress {
    display: none;
  }

  .hud-divider {
    display: none;
  }
}
</style>
