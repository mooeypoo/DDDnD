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
  background: var(--surface-panel);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-xl);
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-panel), var(--shadow-inset-ridge);
}

.banner-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.banner-label {
  color: var(--text-muted);
  margin: 0;
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  font-weight: var(--font-semibold);
}

.banner-title {
  color: var(--text-bright);
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
}

.banner-summary {
  margin: 0;
  color: var(--text-primary);
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
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: var(--space-xs) var(--space-md);
}

.turn-label {
  color: var(--text-muted);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wider);
}

.turn-value {
  color: var(--text-accent);
  font-weight: var(--font-black);
  font-size: var(--text-base);
}

.turn-divider,
.turn-max {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.expand-button {
  border: 1px solid var(--border-subtle);
  background: var(--bg-inset);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.expand-button:hover {
  border-color: var(--border-focus);
  color: var(--text-bright);
}

.banner-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
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
