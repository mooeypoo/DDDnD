<template>
  <section class="scenario-detail">
    <p v-if="loading" class="muted">Loading scenario details...</p>
    <p v-else-if="error" class="muted">Failed to load scenario details: {{ error }}</p>
    <p v-else-if="!scenario" class="muted">Scenario not found: {{ scenarioId }}</p>
    <template v-else>
      <header class="scenario-detail__header">
        <p class="eyebrow">
          <span v-if="scenario.is_tutorial">Tutorial</span>
          <span v-else>Adventure</span>
          · v{{ scenario.version }}
          <span v-if="scenario.difficulty"> · {{ scenario.difficulty.label }}</span>
        </p>
        <h1>{{ scenario.name }}</h1>
        <p class="id">{{ scenario.id }}</p>
        <p class="desc">{{ scenario.description }}</p>
      </header>

      <div class="metrics-grid">
        <article class="metric-card">
          <h3>Audit status</h3>
          <p v-if="scenario.is_tutorial" class="metric-value">Tutorials are not gated</p>
          <AuditStatusBadge v-else :status="auditSummary?.overall_status ?? 'info'" />
        </article>
        <article class="metric-card">
          <h3>Win rate</h3>
          <p class="metric-value">{{ winRateLabel }}</p>
        </article>
        <article class="metric-card">
          <h3>Turns</h3>
          <p class="metric-value">{{ scenario.max_turns ?? 'n/a' }} authored · avg {{ avgTurnsLabel }}</p>
        </article>
        <article class="metric-card">
          <h3>Findings</h3>
          <p class="metric-value">
            Critical {{ auditSummary?.critical_count ?? 0 }} · Warning {{ auditSummary?.warning_count ?? 0 }} · Info
            {{ auditSummary?.info_count ?? 0 }}
          </p>
        </article>
      </div>

      <section v-if="startingScoreRows.length > 0" class="detail-block">
        <h2>Starting vials</h2>
        <table class="delta-table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Start</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in startingScoreRows" :key="row.id">
              <td>{{ row.name }}</td>
              <td>{{ row.value }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="detail-block">
        <h2>Council ({{ stakeholderLinks.length }})</h2>
        <ul>
          <li v-for="stakeholder in stakeholderLinks" :key="stakeholder.id">
            <a :href="stakeholder.href">{{ stakeholder.name }}</a>
          </li>
        </ul>
      </section>

      <section class="detail-block">
        <h2>Cards ({{ cardLinks.length }})</h2>
        <ul class="card-list">
          <li v-for="card in cardLinks" :key="card.id">
            <a :href="card.href">{{ card.name }}</a>
          </li>
        </ul>
      </section>

      <section class="detail-block">
        <h2>Events ({{ eventLinks.length }})</h2>
        <ul>
          <li v-for="event in eventLinks" :key="event.id">
            <a :href="event.href">{{ event.name }}</a>
          </li>
        </ul>
      </section>

      <section v-if="retiredHistory" class="detail-block">
        <h2>Earlier file</h2>
        <p class="history-note">
          v{{ retiredHistory.version }} remains on disk. Exact-run of that version is not a support target.
        </p>
        <details>
          <summary>Show retired {{ retiredHistory.id }}-v{{ retiredHistory.version }}</summary>
          <pre>{{ retiredJson }}</pre>
        </details>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type VersionRef = { id: string; version: number }

type Scenario = {
  id: string
  name: string
  version: number
  description: string
  is_tutorial?: boolean
  max_turns?: number
  starting_scores?: Record<string, number>
  difficulty?: { id: string; label: string } | null
  stakeholder_refs?: VersionRef[]
  card_refs?: VersionRef[]
  event_refs?: VersionRef[]
}

type NamedContent = { id: string; name: string; short_name?: string }
type LinkedContent = { id: string; name: string; href: string }

type AuditScenarioReport = {
  scenario_version?: number
  simulation?: {
    aggregate?: {
      win_rate?: number
      average_turns_completed?: number
    }
  }
  audit?: {
    summary?: {
      overall_status?: string
      critical_count?: number
      warning_count?: number
      info_count?: number
    }
  }
}

const props = defineProps<{
  scenarioId: string
}>()

const loading = ref(true)
const error = ref<string | null>(null)
const scenario = ref<Scenario | null>(null)
const retiredHistory = ref<Scenario | null>(null)
const cards = ref<NamedContent[]>([])
const stakeholders = ref<NamedContent[]>([])
const events = ref<NamedContent[]>([])
const scores = ref<NamedContent[]>([])
const scenarioAudit = ref<AuditScenarioReport | null>(null)

const cardById = computed(() => new Map(cards.value.map((item) => [item.id, item])))
const stakeholderById = computed(() => new Map(stakeholders.value.map((item) => [item.id, item])))
const eventById = computed(() => new Map(events.value.map((item) => [item.id, item])))
const scoreById = computed(() => new Map(scores.value.map((item) => [item.id, item])))

const auditSummary = computed(() => scenarioAudit.value?.audit?.summary)

const winRateLabel = computed(() => {
  if (scenario.value?.is_tutorial) {
    return 'n/a'
  }
  const winRate = scenarioAudit.value?.simulation?.aggregate?.win_rate
  if (typeof winRate !== 'number') {
    return 'n/a'
  }
  return `${(winRate * 100).toFixed(1)}%`
})

const avgTurnsLabel = computed(() => {
  const avgTurns = scenarioAudit.value?.simulation?.aggregate?.average_turns_completed
  if (typeof avgTurns !== 'number') {
    return 'n/a'
  }
  return avgTurns.toFixed(1)
})

const startingScoreRows = computed(() => {
  const starting = scenario.value?.starting_scores ?? {}
  return Object.entries(starting).map(([id, value]) => {
    const score = scoreById.value.get(id)
    const name = score?.short_name ? `${score.name} (${score.short_name})` : score?.name ?? id
    return { id, name, value }
  })
})

const retiredJson = computed(() => JSON.stringify(retiredHistory.value, null, 2))

function resolveLinks(
  refs: VersionRef[] | undefined,
  contentById: Map<string, NamedContent>,
  hrefPrefix: string
): LinkedContent[] {
  if (!refs || refs.length === 0) {
    return []
  }

  return refs
    .map((ref) => {
      const content = contentById.get(ref.id)
      return {
        id: ref.id,
        name: content?.name ?? ref.id,
        href: `${hrefPrefix}/${ref.id}`,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

const stakeholderLinks = computed(() =>
  resolveLinks(scenario.value?.stakeholder_refs, stakeholderById.value, withBase('/dashboard/stakeholders'))
)
const cardLinks = computed(() => resolveLinks(scenario.value?.card_refs, cardById.value, withBase('/dashboard/cards')))
const eventLinks = computed(() => resolveLinks(scenario.value?.event_refs, eventById.value, withBase('/dashboard/events')))

onMounted(async () => {
  try {
    const [catalogResponse, auditResponse] = await Promise.all([
      fetch(withBase('/data/content-catalog.json')),
      fetch(withBase('/data/audit-report.json')),
    ])

    if (!catalogResponse.ok) {
      throw new Error(`content-catalog.json HTTP ${catalogResponse.status}`)
    }

    const catalogPayload = await catalogResponse.json()
    cards.value = catalogPayload.cards ?? []
    stakeholders.value = catalogPayload.stakeholders ?? []
    events.value = catalogPayload.events ?? []
    scores.value = catalogPayload.scores ?? []

    scenario.value = (catalogPayload.scenarios ?? []).find((item: Scenario) => item.id === props.scenarioId) ?? null
    retiredHistory.value =
      (catalogPayload.scenario_history ?? []).find((item: Scenario) => item.id === props.scenarioId) ?? null

    if (auditResponse.ok) {
      const auditPayload = await auditResponse.json()
      scenarioAudit.value = (auditPayload.scenarios ?? {})[props.scenarioId] ?? null
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.scenario-detail {
  display: grid;
  gap: var(--space-5);
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.scenario-detail__header h1 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.2;
}

.id {
  margin: var(--space-2) 0 0;
  color: var(--text-secondary);
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
}

.desc {
  margin: var(--space-3) 0 0;
  color: var(--text-primary);
  font-size: 1.05rem;
  line-height: 1.65;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}

.metric-card {
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  padding: var(--space-4);
}

.metric-card h3 {
  margin: 0 0 var(--space-2);
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.metric-value {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-bright);
  font-weight: var(--font-semibold);
  line-height: 1.4;
}

.detail-block h2 {
  margin: 0 0 var(--space-2);
}

.detail-block ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 1rem;
  line-height: 1.6;
}

.card-list {
  columns: 2;
  column-gap: 1.5rem;
}

@media (max-width: 768px) {
  .card-list {
    columns: 1;
  }
}

.delta-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1rem;
}

.delta-table th,
.delta-table td {
  text-align: left;
  padding: 0.5rem 0.45rem;
  border-bottom: 1px solid var(--border-card);
}

.history-note {
  margin: 0 0 var(--space-3);
  color: var(--text-secondary);
}

pre {
  margin: var(--space-3) 0 0;
  overflow: auto;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-card);
  background: var(--surface-panel);
}

.muted {
  color: var(--text-secondary);
}
</style>
