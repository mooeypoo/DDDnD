<template>
  <section>
    <p v-if="loading" class="muted">Loading findings...</p>
    <p v-else-if="error" class="muted">Failed to load findings: {{ error }}</p>
    <template v-else>
      <div class="filters">
        <input v-model="query" type="search" placeholder="Search title, id, description" />
        <select v-model="severity">
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select v-model="category">
          <option value="all">All categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <p class="count">Showing {{ filtered.length }} findings</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Severity</th>
              <th>Category</th>
              <th>Finding</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filtered" :key="item.scenario + ':' + item.id">
              <td>{{ item.scenario }}</td>
              <td><AuditStatusBadge :status="item.severity" /></td>
              <td>{{ item.category }}</td>
              <td>
                <strong>{{ item.title }}</strong>
                <p class="desc">{{ item.description }}</p>
                <p class="meta">ID: {{ item.id }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type Finding = {
  id: string
  severity: string
  category: string
  title: string
  description: string
}

type FlatFinding = Finding & {
  scenario: string
}

const loading = ref(true)
const error = ref<string | null>(null)
const allFindings = ref<FlatFinding[]>([])

const query = ref('')
const severity = ref('all')
const category = ref('all')

const categories = computed(() => {
  const unique = new Set(allFindings.value.map((f) => f.category))
  return Array.from(unique).sort()
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return allFindings.value.filter((finding) => {
    if (severity.value !== 'all' && finding.severity !== severity.value) {
      return false
    }
    if (category.value !== 'all' && finding.category !== category.value) {
      return false
    }
    if (!q) {
      return true
    }
    return (
      finding.title.toLowerCase().includes(q) ||
      finding.id.toLowerCase().includes(q) ||
      finding.description.toLowerCase().includes(q) ||
      finding.scenario.toLowerCase().includes(q)
    )
  })
})

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/audit-report.json'))
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    const flat: FlatFinding[] = []

    for (const scenario of Object.values(payload.scenarios ?? {}) as any[]) {
      const scenarioId = scenario.scenario_id
      for (const finding of scenario.audit?.findings ?? []) {
        flat.push({
          scenario: scenarioId,
          id: finding.id,
          severity: finding.severity,
          category: finding.category,
          title: finding.title,
          description: finding.description,
        })
      }
    }

    allFindings.value = flat.sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
      const aS = severityOrder[a.severity] ?? 3
      const bS = severityOrder[b.severity] ?? 3
      if (aS !== bS) {
        return aS - bS
      }
      return a.scenario.localeCompare(b.scenario)
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 0.6rem;
}

.filters input,
.filters select {
  background: var(--surface-card);
  color: var(--text-primary);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-md);
  padding: 0.45rem 0.55rem;
}

.count {
  margin: 0.8rem 0;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid var(--border-subtle);
  text-align: left;
  vertical-align: top;
  padding: 0.65rem 0.5rem;
}

th {
  color: var(--text-bright);
  font-size: 0.82rem;
}

td {
  color: var(--text-primary);
  font-size: 0.86rem;
}

.desc,
.meta {
  margin: 0.35rem 0 0;
}

.meta {
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.muted {
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
