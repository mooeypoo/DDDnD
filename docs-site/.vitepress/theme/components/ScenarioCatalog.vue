<template>
  <section>
    <p v-if="loading" class="muted">Loading catalog...</p>
    <p v-else-if="error" class="muted">Failed to load catalog: {{ error }}</p>
    <template v-else>
      <h2 class="rail-title">Adventures</h2>
      <div class="catalog-grid">
        <article v-for="scenario in adventures" :key="scenario.id" class="catalog-card">
          <header class="catalog-card__header">
            <h4>
              <a :href="scenarioLink(scenario.id)">{{ scenario.name }}</a>
            </h4>
            <div class="marks">
              <span v-if="scenario.difficulty" class="mark" :class="`mark--${scenario.difficulty.id}`">{{
                scenario.difficulty.label
              }}</span>
              <span class="mark">v{{ scenario.version }}</span>
            </div>
          </header>
          <p class="desc">{{ scenario.short_description || scenario.description }}</p>
          <p class="meta">
            {{ scenarioCards(scenario.id).length }} cards · {{ scenarioStakeholders(scenario.id).length }} seats ·
            {{ scenario.max_turns }} turns
          </p>
          <div class="catalog-card__actions">
            <a :href="scenarioLink(scenario.id)">View adventure details</a>
          </div>
        </article>
      </div>

      <h2 class="rail-title">Tutorials</h2>
      <p class="rail-copy">Guided sits that teach the table. They use their own scores and never mix into the main pack.</p>
      <div class="catalog-grid">
        <article v-for="scenario in tutorials" :key="scenario.id" class="catalog-card">
          <header class="catalog-card__header">
            <h4>
              <a :href="scenarioLink(scenario.id)">{{ scenario.name }}</a>
            </h4>
            <div class="marks">
              <span class="mark mark--tutorial">Tutorial</span>
              <span class="mark">v{{ scenario.version }}</span>
            </div>
          </header>
          <p class="desc">{{ scenario.short_description || scenario.description }}</p>
          <p class="meta">{{ scenario.max_turns }} turns</p>
          <div class="catalog-card__actions">
            <a :href="scenarioLink(scenario.id)">View tutorial details</a>
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
  version: number
  description: string
  short_description?: string
  is_tutorial?: boolean
  max_turns?: number
  difficulty?: { id: string; label: string } | null
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

const adventures = computed(() =>
  scenarios.value
    .filter((scenario) => !scenario.is_tutorial)
    .sort((left, right) => {
      const rank = { easy: 0, normal: 1, hard: 2 }
      const leftRank = left.difficulty ? rank[left.difficulty.id as keyof typeof rank] ?? 3 : 3
      const rightRank = right.difficulty ? rank[right.difficulty.id as keyof typeof rank] ?? 3 : 3
      return leftRank - rightRank || left.id.localeCompare(right.id)
    })
)

const tutorials = computed(() =>
  scenarios.value.filter((scenario) => scenario.is_tutorial).sort((left, right) => left.id.localeCompare(right.id))
)

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
  return (scenarioMaps.value.cards[scenarioId] ?? [])
    .map((ref) => cardById.value.get(ref.id))
    .filter((value): value is Card => Boolean(value))
}

function scenarioStakeholders(scenarioId: string): Stakeholder[] {
  return (scenarioMaps.value.stakeholders[scenarioId] ?? [])
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
    scenarios.value = payload.scenarios ?? []
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
.rail-title {
  margin: var(--space-6) 0 var(--space-3);
  font-size: 1.4rem;
}

.rail-copy {
  margin: 0 0 var(--space-4);
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.catalog-card {
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  padding: var(--space-5);
  display: grid;
  gap: var(--space-3);
}

.catalog-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.catalog-card__header h4 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.35;
}

.catalog-card__header h4 a {
  color: inherit;
  text-decoration: none;
}

.catalog-card__header h4 a:hover {
  text-decoration: underline;
}

.marks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.mark {
  border: 1px solid var(--border-card);
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.mark--easy {
  color: var(--effect-positive);
}

.mark--normal {
  color: var(--effect-warning);
}

.mark--hard {
  color: var(--effect-negative);
}

.mark--tutorial {
  color: var(--docs-heading-color);
}

.desc {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.6;
}

.meta {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.catalog-card__actions a {
  color: var(--vp-c-brand-1);
  font-weight: var(--font-semibold);
}

.muted {
  color: var(--text-secondary);
}
</style>
