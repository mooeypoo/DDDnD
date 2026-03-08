<template>
  <div class="score-panel">
    <h3 class="panel-title">
      <span class="title-icon">📊</span>
      System Health
    </h3>
    <div class="scores-list">
      <div 
        v-for="(value, scoreId) in scores" 
        :key="scoreId"
        class="score-item"
      >
        <div class="score-header">
          <span class="score-name">{{ formatScoreName(scoreId) }}</span>
          <span class="score-value" :class="getScoreClass(value)">{{ Math.round(value) }}</span>
        </div>
        <div class="score-bar-container">
          <div 
            class="score-bar" 
            :class="getScoreClass(value)" 
            :style="{ width: value + '%' }"
          >
            <div class="score-bar-glow"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  scores: Record<string, number>
}>()

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getScoreClass(value: number): string {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  if (value >= 20) return 'low'
  return 'critical'
}
</script>

<style scoped>
.score-panel {
  background: var(--panel-bg);
  border: 2px solid var(--panel-border);
  border-radius: var(--radius-xl);
  padding: var(--panel-padding);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
}

.panel-title {
  color: var(--color-primary);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-lg) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.title-icon {
  font-size: var(--text-2xl);
}

.scores-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.score-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-name {
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.score-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-black);
  min-width: 2.5rem;
  text-align: right;
}

.score-value.critical {
  color: var(--score-critical);
}

.score-value.low {
  color: var(--score-low);
}

.score-value.medium {
  color: var(--score-medium);
}

.score-value.high {
  color: var(--score-high);
}

.score-bar-container {
  height: 10px;
  background: var(--color-bg-overlay);
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}

.score-bar {
  height: 100%;
  border-radius: var(--radius-md);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.score-bar.critical {
  background: var(--score-critical);
}

.score-bar.low {
  background: var(--score-low);
}

.score-bar.medium {
  background: var(--score-medium);
}

.score-bar.high {
  background: var(--score-high);
}

.score-bar-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 100%);
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

@media (max-width: 768px) {
  .score-panel {
    padding: var(--space-lg);
  }
}
</style>
