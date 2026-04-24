<template>
  <section>
    <p v-if="loading" class="muted">Loading metrics...</p>
    <p v-else-if="error" class="muted">Failed to load metrics: {{ error }}</p>
    <template v-else>
      <div class="metrics-grid">
        <article v-for="scenario in scenarios" :key="scenario.scenario_id" class="metric-card">
          <header>
            <h4>{{ scenario.scenario_id }}</h4>
          </header>
          <div class="metric-stack">
            <MetricBar label="Win Rate" :value="scenario.simulation.aggregate.win_rate * 100" :max="100" suffix="%" />
            <MetricBar label="Avg Turns" :value="scenario.simulation.aggregate.average_turns_completed" :max="scenario.simulation.total_runs || 20" />
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type ScenarioMetrics = {
  scenario_id: string
  simulation: {
    total_runs: number
    aggregate: {
      win_rate: number
      average_turns_completed: number
    }
  }
}

const loading = ref(true)
const error = ref<string | null>(null)
const scenarioMap = ref<Record<string, ScenarioMetrics>>({})

const scenarios = computed(() => Object.values(scenarioMap.value).sort((a, b) => a.scenario_id.localeCompare(b.scenario_id)))

onMounted(async () => {
  try {
    const response = await fetch('/data/audit-report.json')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    scenarioMap.value = payload.scenarios ?? {}
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}

.metric-card {
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  padding: var(--space-4);
}

.metric-card h4 {
  margin: 0 0 var(--space-3);
}

.metric-stack {
  display: grid;
  gap: var(--space-3);
}

.muted {
  color: var(--text-secondary);
}
</style>
