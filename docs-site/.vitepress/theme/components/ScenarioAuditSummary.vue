<template>
  <section>
    <p v-if="loading" class="muted">Loading audit report...</p>
    <p v-else-if="error" class="muted">Failed to load audit report: {{ error }}</p>
    <template v-else>
      <div class="summary-grid">
        <article v-for="scenario in scenarios" :key="scenario.scenario_id" class="summary-card">
          <header class="summary-card__header">
            <h4>
              <a :href="withBase(`/dashboard/scenarios/${scenario.scenario_id}`)">{{ scenarioName(scenario.scenario_id) }}</a>
            </h4>
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
import { withBase } from 'vitepress'

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
const nameMap = ref<Record<string, string>>({})

const scenarios = computed(() =>
  Object.values(data.value).sort((a, b) => a.scenario_id.localeCompare(b.scenario_id))
)

function scenarioName(id: string): string {
  return nameMap.value[id] ?? id
}

onMounted(async () => {
  try {
    const [auditRes, catalogRes] = await Promise.all([
      fetch(withBase('/data/audit-report.json')),
      fetch(withBase('/data/content-catalog.json')),
    ])
    if (!auditRes.ok) throw new Error(`HTTP ${auditRes.status}`)
    const auditPayload = await auditRes.json()
    data.value = auditPayload.scenarios ?? {}

    if (catalogRes.ok) {
      const catalog = await catalogRes.json()
      const map: Record<string, string> = {}
      for (const s of catalog.scenarios ?? []) {
        map[s.id] = s.name
      }
      nameMap.value = map
    }
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
