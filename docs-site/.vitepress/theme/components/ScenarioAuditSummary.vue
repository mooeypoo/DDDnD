<template>
  <section>
    <p v-if="loading" class="muted">Loading audit report...</p>
    <p v-else-if="error" class="muted">Failed to load audit report: {{ error }}</p>
    <template v-else>
      <div class="summary-grid">
        <article v-for="scenario in scenarios" :key="scenario.scenario_id" class="summary-card">
          <header class="summary-card__header">
            <h4>{{ scenario.scenario_id }}</h4>
            <AuditStatusBadge :status="scenario.audit.summary.overall_status" />
          </header>
          <div class="summary-card__metrics">
            <MetricBar label="Win Rate" :value="scenario.simulation.aggregate.win_rate * 100" :max="100" suffix="%" />
          </div>
          <p class="summary-card__counts">
            Critical {{ scenario.audit.summary.critical_count }}
            · Warning {{ scenario.audit.summary.warning_count }}
            · Info {{ scenario.audit.summary.info_count }}
          </p>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type ScenarioReport = {
  scenario_id: string
  simulation: {
    aggregate: {
      win_rate: number
    }
  }
  audit: {
    summary: {
      overall_status: string
      critical_count: number
      warning_count: number
      info_count: number
    }
  }
}

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<Record<string, ScenarioReport>>({})

const scenarios = computed(() =>
  Object.values(data.value).sort((a, b) => a.scenario_id.localeCompare(b.scenario_id))
)

onMounted(async () => {
  try {
    const response = await fetch('/data/audit-report.json')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    data.value = payload.scenarios ?? {}
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.summary-card {
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  padding: var(--space-4);
}

.summary-card__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
}

.summary-card__header h4 {
  margin: 0;
  font-size: 0.95rem;
}

.summary-card__metrics {
  margin-top: var(--space-3);
}

.summary-card__counts {
  margin: var(--space-3) 0 0;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.muted {
  color: var(--text-secondary);
}
</style>
