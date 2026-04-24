<template>
  <section>
    <p v-if="loading" class="muted">Loading catalog...</p>
    <p v-else-if="error" class="muted">Failed to load catalog: {{ error }}</p>
    <template v-else>
      <div class="catalog-grid">
        <article v-for="scenario in scenarios" :key="scenario.id" class="catalog-card">
          <header class="catalog-card__header">
            <h4>{{ scenario.name }}</h4>
            <span class="id">{{ scenario.id }}</span>
          </header>

          <p class="desc">{{ scenario.short_description || scenario.description }}</p>

          <div class="group">
            <h5>Cards ({{ scenarioCards(scenario.id).length }})</h5>
            <ul>
              <li v-for="card in scenarioCards(scenario.id).slice(0, 8)" :key="card.id">{{ card.name }}</li>
            </ul>
            <p v-if="scenarioCards(scenario.id).length > 8" class="muted small">
              + {{ scenarioCards(scenario.id).length - 8 }} more
            </p>
          </div>

          <div class="group">
            <h5>Stakeholders</h5>
            <ul>
              <li v-for="stakeholder in scenarioStakeholders(scenario.id)" :key="stakeholder.id">{{ stakeholder.name }}</li>
            </ul>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

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

onMounted(async () => {
  try {
    const response = await fetch('/data/content-catalog.json')
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
