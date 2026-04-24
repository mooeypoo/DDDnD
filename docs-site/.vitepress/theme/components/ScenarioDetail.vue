<template>
  <section class="scenario-detail">
    <p v-if="loading" class="muted">Loading scenario details...</p>
    <p v-else-if="error" class="muted">Failed to load scenario details: {{ error }}</p>
    <p v-else-if="!scenario" class="muted">Scenario not found: {{ scenarioId }}</p>
    <template v-else>
      <header class="scenario-detail__header">
        <h1>{{ scenario.name }}</h1>
        <p class="id">{{ scenario.id }}</p>
        <p class="desc">{{ scenario.description }}</p>
      </header>

      <div class="metrics-grid">
        <article class="metric-card">
          <h3>Audit Status</h3>
          <AuditStatusBadge :status="auditSummary?.overall_status ?? 'info'" />
        </article>
        <article class="metric-card">
          <h3>Win Rate</h3>
          <p class="metric-value">{{ winRateLabel }}</p>
        </article>
        <article class="metric-card">
          <h3>Avg Turns</h3>
          <p class="metric-value">{{ avgTurnsLabel }}</p>
        </article>
        <article class="metric-card">
          <h3>Findings</h3>
          <p class="metric-value">
            Critical {{ auditSummary?.critical_count ?? 0 }} · Warning {{ auditSummary?.warning_count ?? 0 }} · Info {{ auditSummary?.info_count ?? 0 }}
          </p>
        </article>
      </div>

      <section class="detail-block">
        <h2>Stakeholders ({{ stakeholderLinks.length }})</h2>
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
  description: string
  stakeholder_refs?: VersionRef[]
  card_refs?: VersionRef[]
  event_refs?: VersionRef[]
}

type NamedContent = { id: string; name: string }
type LinkedContent = { id: string; name: string; href: string }

type AuditScenarioReport = {
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
const cards = ref<NamedContent[]>([])
const stakeholders = ref<NamedContent[]>([])
const events = ref<NamedContent[]>([])
const scenarioAudit = ref<AuditScenarioReport | null>(null)

const cardById = computed(() => new Map(cards.value.map((item) => [item.id, item])))
const stakeholderById = computed(() => new Map(stakeholders.value.map((item) => [item.id, item])))
const eventById = computed(() => new Map(events.value.map((item) => [item.id, item])))

const auditSummary = computed(() => scenarioAudit.value?.audit?.summary)

const winRateLabel = computed(() => {
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
    if (!auditResponse.ok) {
      throw new Error(`audit-report.json HTTP ${auditResponse.status}`)
    }

    const catalogPayload = await catalogResponse.json()
    const auditPayload = await auditResponse.json()

    cards.value = catalogPayload.cards ?? []
    stakeholders.value = catalogPayload.stakeholders ?? []
    events.value = catalogPayload.events ?? []

    scenario.value = (catalogPayload.scenarios ?? []).find((item: Scenario) => item.id === props.scenarioId) ?? null
    scenarioAudit.value = (auditPayload.scenarios ?? {})[props.scenarioId] ?? null
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

.scenario-detail__header h1 {
  margin: 0;
}

.id {
  margin: var(--space-2) 0 0;
  color: var(--text-secondary);
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
}

.desc {
  margin: var(--space-3) 0 0;
  color: var(--text-primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
}

.metric-card {
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  padding: var(--space-3);
}

.metric-card h3 {
  margin: 0 0 var(--space-2);
  font-size: 0.86rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.metric-value {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-bright);
  font-weight: var(--font-semibold);
}

.detail-block h2 {
  margin: 0 0 var(--space-2);
}

.detail-block ul {
  margin: 0;
  padding-left: 1rem;
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

.muted {
  color: var(--text-secondary);
}
</style>
