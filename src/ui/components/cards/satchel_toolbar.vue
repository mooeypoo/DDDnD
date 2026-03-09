<template>
  <div class="satchel-toolbar" role="toolbar" aria-label="Filter and sort cards">
    <!-- Category filter pills -->
    <div class="filter-group" role="radiogroup" aria-label="Filter by category">
      <button
        class="filter-pill"
        :class="{ active: activeCategory === 'all' }"
        type="button"
        @click="$emit('update:activeCategory', 'all')"
      >
        All
      </button>
      <button
        v-for="cat in availableCategories"
        :key="cat"
        class="filter-pill"
        :class="[`pill-${cat}`, { active: activeCategory === cat }]"
        type="button"
        @click="$emit('update:activeCategory', cat)"
      >
        <span class="pill-icon">{{ categoryMeta(cat).icon }}</span>
        <span class="pill-label">{{ categoryMeta(cat).label }}</span>
      </button>
    </div>

    <!-- Sort selector -->
    <div class="sort-group">
      <label class="sort-label" for="satchel-sort">Sort</label>
      <select
        id="satchel-sort"
        class="sort-select"
        :value="activeSort"
        @change="$emit('update:activeSort', ($event.target as HTMLSelectElement).value)"
      >
        <option value="default">Default</option>
        <option value="name">Name A → Z</option>
        <option
          v-for="metric in affectedMetrics"
          :key="metric"
          :value="`boost_${metric}`"
        >
          Best for: {{ metricLabel(metric) }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORY_META } from '@/ui/composables/card_filter_sort'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'

defineProps<{
  availableCategories: string[]
  affectedMetrics: string[]
  activeCategory: string
  activeSort: string
}>()

defineEmits<{
  'update:activeCategory': [value: string]
  'update:activeSort': [value: string]
}>()

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, icon: '📦' }
}

function metricLabel(scoreId: string): string {
  return getMetricPresentation(scoreId).label
}
</script>

<style scoped>
.satchel-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

/* ---- Filter pills ---- */
.filter-group {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.filter-pill {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  background: var(--bg-overlay);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  line-height: 1.3;
}

.filter-pill:hover {
  border-color: var(--border-accent);
  color: var(--text-bright);
  background: var(--bg-overlay-strong);
}

.filter-pill.active {
  border-color: var(--border-accent);
  background: var(--border-accent);
  color: var(--text-bright);
}

.pill-icon {
  font-size: var(--text-xs);
  line-height: 1;
}

/* ---- Sort ---- */
.sort-group {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-left: auto;
}

.sort-label {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
  white-space: nowrap;
}

.sort-select {
  appearance: none;
  padding: 5px 26px 5px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background-color: rgba(20, 27, 45, 0.95);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23ccc'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  color: var(--text-bright);
  font-family: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: border-color var(--transition-fast);
  min-width: 0;
}

.sort-select option {
  background: #141b2d;
  color: #e8e6f0;
}

.sort-select:hover,
.sort-select:focus {
  border-color: var(--border-accent);
  outline: none;
}

/* Mobile: stack filter + sort vertically */
@media (max-width: 480px) {
  .satchel-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-group {
    margin-left: 0;
  }

  .sort-select {
    width: 100%;
    font-size: var(--text-sm);
    padding: 8px 28px 8px 10px;
  }

  .pill-label {
    display: none;
  }
}
</style>
