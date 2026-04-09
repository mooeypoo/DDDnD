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
      <span class="sort-label">Sort</span>
      <AppSelect
        :modelValue="activeSort"
        :options="sortOptions"
        @update:modelValue="$emit('update:activeSort', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORY_META } from '@/ui/composables/card_filter_sort'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import AppSelect from '@/ui/components/common/AppSelect.vue'

const props = defineProps<{
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

const sortOptions = computed(() => [
  { value: 'default', label: 'Default' },
  { value: 'name', label: 'Name A → Z' },
  ...props.affectedMetrics.map(metric => ({
    value: `boost_${metric}`,
    label: `Best for: ${metricLabel(metric)}`
  }))
])
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

/* Mobile: stack filter + sort vertically */
@media (max-width: 480px) {
  .satchel-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-group {
    margin-left: 0;
  }

  .pill-label {
    display: none;
  }
}
</style>
