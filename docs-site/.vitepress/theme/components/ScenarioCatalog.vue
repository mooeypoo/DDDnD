<template>
  <section>
    <p v-if="loading" class="muted">Loading catalog...</p>
    <p v-else-if="error" class="muted">Failed to load catalog: {{ error }}</p>
    <template v-else>
      <div class="catalog-grid">
        <article v-for="scenario in scenarios" :key="scenario.id" class="catalog-card">
          <header class="catalog-card__header">
            <h4>
              <a :href="scenarioLink(scenario.id)">{{ scenario.name }}</a>
            </h4>
            <span class="id">{{ scenario.id }}</span>
          </header>

          <p class="desc">{{ scenario.short_description || scenario.description }}</p>

          <div class="meta-grid">
            <p>
              <strong>Cards:</strong>
              {{ scenarioCards(scenario.id).length }}
            </p>
            <p>
              <strong>Stakeholders:</strong>
              {{ scenarioStakeholders(scenario.id).length }}
            </p>
          </div>

          <div class="catalog-card__actions">
            <a :href="scenarioLink(scenario.id)">View full scenario details</a>
          </div>
        </article>
      </div>
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
  short_description?: string
}

type Card = { id: string; name: string }
type Stakeholder = { id: string; name: string }

const loading = ref(true)
const error = ref<string | null>(null)

const scenarios = ref<Scenario[]>([])
const cards = ref<Card[]>([])
const stakeholders = ref<Stakeholder[]>([])

const scenarioMaps = ref<{
  cards: Record<string, VersionRef[]>
  stakeholders: Record<string, VersionRef[]>
}>({ cards: {}, stakeholders: {} })

const cardById = computed(() => {
  const map = new Map<string, Card>()
  for (const card of cards.value) {
    map.set(card.id, card)
  }
  return map
})

const stakeholderById = computed(() => {
  const map = new Map<string, Stakeholder>()
  for (const stakeholder of stakeholders.value) {
    map.set(stakeholder.id, stakeholder)
  }
  return map
})

function scenarioCards(scenarioId: string): Card[] {
  const refs = scenarioMaps.value.cards[scenarioId] ?? []
  return refs
    .map((ref) => cardById.value.get(ref.id))
    .filter((value): value is Card => Boolean(value))
}

function scenarioStakeholders(scenarioId: string): Stakeholder[] {
  const refs = scenarioMaps.value.stakeholders[scenarioId] ?? []
  return refs
    .map((ref) => stakeholderById.value.get(ref.id))
    .filter((value): value is Stakeholder => Boolean(value))
}

function scenarioLink(scenarioId: string): string {
  return withBase(`/dashboard/scenarios/${scenarioId}`)
}

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/content-catalog.json'))
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json()
    scenarios.value = (payload.scenarios ?? []).sort((a: Scenario, b: Scenario) => a.id.localeCompare(b.id))
    cards.value = payload.cards ?? []
    stakeholders.value = payload.stakeholders ?? []
    scenarioMaps.value = payload.scenario_maps ?? { cards: {}, stakeholders: {} }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.catalog-card {
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  padding: var(--space-4);
  display: grid;
  gap: var(--space-3);
}

.catalog-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.8rem;
}

.catalog-card__header h4 {
  margin: 0;
}

.catalog-card__header h4 a {
  color: inherit;
  text-decoration: none;
}

.catalog-card__header h4 a:hover {
  text-decoration: underline;
}

.id {
  color: var(--text-secondary);
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
}

.desc {
  margin: 0;
  color: var(--text-primary);
}

.group h5 {
  margin: 0 0 0.4rem;
  color: var(--text-bright);
  font-size: 0.86rem;
}

.meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
}

.meta-grid p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.86rem;
}

.catalog-card__actions a {
  color: var(--vp-c-brand-1);
  font-weight: var(--font-semibold);
}

.group ul {
  margin: 0;
  padding-left: 1rem;
}

.group li {
  color: var(--text-primary);
  line-height: 1.3;
}

.small {
  font-size: 0.78rem;
}

.muted {
  color: var(--text-secondary);
}
</style>
