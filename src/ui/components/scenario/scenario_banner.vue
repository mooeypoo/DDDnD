<template>
  <section class="scenario-banner">
    <div class="banner-main">
      <p class="banner-label">Scenario</p>
      <h1 class="banner-title">{{ title }}</h1>
      <p class="banner-summary">{{ shortDescription }}</p>
    </div>

    <div class="banner-meta">
      <div class="turn-pill">
        <span class="turn-label">Turn</span>
        <span class="turn-value">{{ currentTurn }}</span>
        <span class="turn-divider">/</span>
        <span class="turn-max">{{ maxTurns }}</span>
      </div>
      <button
        v-if="description"
        class="expand-button"
        type="button"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? 'Hide full description' : 'Show full description' }}
      </button>
    </div>

    <p v-if="isExpanded && description" class="banner-description">
      {{ description }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  shortDescription: string
  description?: string
  currentTurn: number
  maxTurns: number
}>()

const isExpanded = ref(false)
</script>

<style scoped>
.scenario-banner {
  background: var(--card-bg);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-md);
}

.banner-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.banner-label {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: var(--text-xs);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: var(--font-semibold);
}

.banner-title {
  color: var(--color-text-bright);
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
}

.banner-summary {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.banner-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.turn-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--color-bg-overlay);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-md);
}

.turn-label {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  font-weight: var(--font-semibold);
}

.turn-value {
  color: var(--color-primary);
  font-weight: var(--font-black);
  font-size: var(--text-base);
}

.turn-divider,
.turn-max {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.expand-button {
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-overlay);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.expand-button:hover {
  border-color: var(--color-border-focus);
  color: var(--color-text-bright);
}

.banner-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border-default);
}

@media (max-width: 768px) {
  .scenario-banner {
    padding: var(--space-lg);
  }

  .banner-title {
    font-size: var(--text-xl);
  }
}
</style>
