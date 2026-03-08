<template>
  <div class="score-panel">
    <h3 class="panel-title">System Health</h3>
    <div class="scores-grid">
      <div 
        v-for="(value, scoreId) in scores" 
        :key="scoreId"
        class="score-item"
        :class="getScoreClass(value)"
      >
        <div class="score-name">{{ formatScoreName(scoreId) }}</div>
        <div class="score-bar">
          <div class="score-fill" :style="{ width: value + '%' }"></div>
        </div>
        <div class="score-value">{{ Math.round(value) }}</div>
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
  background: rgba(22, 33, 62, 0.6);
  border: 2px solid rgba(139, 146, 168, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
}

.panel-title {
  color: #e94560;
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
}

.scores-grid {
  display: grid;
  gap: 1rem;
}

.score-item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 0.5rem;
  align-items: center;
}

.score-name {
  color: #e0e0e0;
  font-size: 0.95rem;
  font-weight: 500;
}

.score-bar {
  grid-column: 1 / 2;
  grid-row: 2;
  height: 8px;
  background: rgba(139, 146, 168, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  transition: width 0.5s, background 0.3s;
  border-radius: 4px;
}

.score-item.critical .score-fill {
  background: #e94560;
}

.score-item.low .score-fill {
  background: #f39c12;
}

.score-item.medium .score-fill {
  background: #3498db;
}

.score-item.high .score-fill {
  background: #2ecc71;
}

.score-value {
  grid-column: 2;
  grid-row: 1 / 3;
  color: #e0e0e0;
  font-size: 1.5rem;
  font-weight: 700;
  min-width: 3rem;
  text-align: right;
}

@media (max-width: 640px) {
  .score-panel {
    padding: 1rem;
  }
  
  .score-value {
    font-size: 1.25rem;
  }
}
</style>
