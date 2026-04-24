<template>
  <section class="entity-detail">
    <p v-if="loading" class="muted">Loading {{ entityType }} details...</p>
    <p v-else-if="error" class="muted">Failed to load {{ entityType }} details: {{ error }}</p>
    <p v-else-if="!entity" class="muted">{{ titleCaseEntityType }} not found: {{ entityId }}</p>
    <template v-else>
      <header class="entity-detail__header">
        <h1>{{ entity.name || entity.id }}</h1>
        <p class="id">{{ entity.id }}</p>
        <p v-if="entity.description" class="desc">{{ entity.description }}</p>
        <p v-else-if="entity.flavor_text" class="desc">{{ entity.flavor_text }}</p>
      </header>

      <section class="detail-block">
        <h2>{{ titleCaseEntityType }} Details</h2>

        <template v-if="entityType === 'card'">
          <div class="facts-grid">
            <p><strong>Version:</strong> {{ cardEntity?.version ?? 'n/a' }}</p>
            <p><strong>Usage Limit:</strong> {{ cardEntity?.usage_limit ?? 'n/a' }}</p>
            <p><strong>Cooldown Turns:</strong> {{ cardEntity?.cooldown_turns ?? 0 }}</p>
          </div>

          <div class="detail-subsection" v-if="(cardEntity?.style_tags?.length ?? 0) > 0">
            <h3>Style Tags</h3>
            <ul class="chip-list">
              <li v-for="tag in cardEntity?.style_tags ?? []" :key="tag">{{ tag }}</li>
            </ul>
          </div>

          <div class="detail-subsection" v-if="(cardEntity?.score_changes?.length ?? 0) > 0">
            <h3>Score Changes</h3>
            <table class="delta-table">
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="change in cardEntity?.score_changes ?? []" :key="change.score_id">
                  <td>{{ humanizeId(change.score_id) }}</td>
                  <td :class="deltaClass(change.delta)">{{ signedDelta(change.delta) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="detail-subsection" v-if="(cardEntity?.stakeholder_changes?.length ?? 0) > 0">
            <h3>Stakeholder Changes</h3>
            <table class="delta-table">
              <thead>
                <tr>
                  <th>Stakeholder</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="change in cardEntity?.stakeholder_changes ?? []" :key="change.stakeholder_id">
                  <td>
                    <a :href="`/dashboard/stakeholders/${change.stakeholder_id}`">{{ stakeholderName(change.stakeholder_id) }}</a>
                  </td>
                  <td :class="deltaClass(change.delta)">{{ signedDelta(change.delta) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="detail-subsection" v-if="(cardEntity?.delayed_effect_refs?.length ?? 0) > 0">
            <h3>Delayed Effects</h3>
            <ul>
              <li v-for="effect in cardEntity?.delayed_effect_refs ?? []" :key="effect.id">
                {{ humanizeId(effect.id) }} (v{{ effect.version }})
              </li>
            </ul>
          </div>
        </template>

        <template v-else-if="entityType === 'stakeholder'">
          <div class="facts-grid">
            <p><strong>Version:</strong> {{ stakeholderEntity?.version ?? 'n/a' }}</p>
            <p><strong>Reaction Rules:</strong> {{ stakeholderEntity?.reaction_rule_refs?.length ?? 0 }}</p>
          </div>

          <div class="detail-subsection" v-if="(stakeholderEntity?.reaction_rule_refs?.length ?? 0) > 0">
            <h3>Reaction Rules</h3>
            <ul>
              <li v-for="rule in stakeholderEntity?.reaction_rule_refs ?? []" :key="rule.id">
                {{ humanizeId(rule.id) }} (v{{ rule.version }})
              </li>
            </ul>
          </div>
        </template>

        <template v-else>
          <div class="facts-grid">
            <p><strong>Version:</strong> {{ eventEntity?.version ?? 'n/a' }}</p>
            <p><strong>Occurrence Weight:</strong> {{ eventEntity?.occurrence_weight ?? 'n/a' }}</p>
          </div>

          <div class="detail-subsection" v-if="(eventEntity?.score_changes?.length ?? 0) > 0">
            <h3>Score Changes</h3>
            <table class="delta-table">
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="change in eventEntity?.score_changes ?? []" :key="change.score_id">
                  <td>{{ humanizeId(change.score_id) }}</td>
                  <td :class="deltaClass(change.delta)">{{ signedDelta(change.delta) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="detail-subsection" v-if="(eventEntity?.delayed_effect_refs?.length ?? 0) > 0">
            <h3>Delayed Effects</h3>
            <ul>
              <li v-for="effect in eventEntity?.delayed_effect_refs ?? []" :key="effect.id">
                {{ humanizeId(effect.id) }} (v{{ effect.version }})
              </li>
            </ul>
          </div>
        </template>
      </section>

      <section class="detail-block" v-if="relatedScenarios.length > 0">
        <h2>Used In Scenarios ({{ relatedScenarios.length }})</h2>
        <ul>
          <li v-for="scenario in relatedScenarios" :key="scenario.id">
            <a :href="`/dashboard/scenarios/${scenario.id}`">{{ scenario.name }}</a>
          </li>
        </ul>
      </section>

      <section class="detail-block">
        <h2>Raw JSON</h2>
        <details>
          <summary>Show raw JSON</summary>
          <pre>{{ entityJson }}</pre>
        </details>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type EntityType = 'card' | 'stakeholder' | 'event'
type VersionRef = { id: string; version: number }
type ScoreDelta = { score_id: string; delta: number }
type StakeholderDelta = { stakeholder_id: string; delta: number }

type Entity = {
  id: string
  name?: string
  description?: string
  flavor_text?: string
}

type CardEntity = Entity & {
  version?: number
  usage_limit?: number
  cooldown_turns?: number
  style_tags?: string[]
  score_changes?: ScoreDelta[]
  stakeholder_changes?: StakeholderDelta[]
  delayed_effect_refs?: VersionRef[]
}

type StakeholderEntity = Entity & {
  version?: number
  reaction_rule_refs?: VersionRef[]
}

type EventEntity = Entity & {
  version?: number
  occurrence_weight?: number
  score_changes?: ScoreDelta[]
  delayed_effect_refs?: VersionRef[]
}

type Scenario = {
  id: string
  name: string
  card_refs?: VersionRef[]
  stakeholder_refs?: VersionRef[]
  event_refs?: VersionRef[]
}

const props = defineProps<{
  entityType: EntityType
  entityId: string
}>()

const loading = ref(true)
const error = ref<string | null>(null)
const entity = ref<Entity | null>(null)
const scenarios = ref<Scenario[]>([])

const entityType = computed(() => props.entityType)
const entityId = computed(() => props.entityId)

const titleCaseEntityType = computed(() => {
  if (props.entityType === 'card') {
    return 'Card'
  }
  if (props.entityType === 'stakeholder') {
    return 'Stakeholder'
  }
  return 'Event'
})

const relatedScenarios = computed(() => {
  if (!entity.value) {
    return []
  }

  const refKey =
    props.entityType === 'card'
      ? 'card_refs'
      : props.entityType === 'stakeholder'
        ? 'stakeholder_refs'
        : 'event_refs'

  return scenarios.value
    .filter((scenario) => (scenario[refKey] ?? []).some((ref) => ref.id === entity.value?.id))
    .sort((a, b) => a.id.localeCompare(b.id))
})

const entityJson = computed(() => JSON.stringify(entity.value, null, 2))
const stakeholderById = computed(() => new Map((payloadStakeholders.value ?? []).map((item) => [item.id, item] as const)))

const cardEntity = computed(() => (props.entityType === 'card' ? (entity.value as CardEntity | null) : null))
const stakeholderEntity = computed(() =>
  props.entityType === 'stakeholder' ? (entity.value as StakeholderEntity | null) : null
)
const eventEntity = computed(() => (props.entityType === 'event' ? (entity.value as EventEntity | null) : null))

const payloadStakeholders = ref<Array<{ id: string; name?: string }>>([])

function signedDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta)
}

function deltaClass(delta: number): string {
  if (delta > 0) {
    return 'delta-positive'
  }
  if (delta < 0) {
    return 'delta-negative'
  }
  return ''
}

function humanizeId(id: string): string {
  return id
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function stakeholderName(id: string): string {
  return stakeholderById.value.get(id)?.name ?? humanizeId(id)
}

onMounted(async () => {
  try {
    const response = await fetch('/data/content-catalog.json')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json()
    scenarios.value = payload.scenarios ?? []
    payloadStakeholders.value = payload.stakeholders ?? []

    const collectionKey =
      props.entityType === 'card'
        ? 'cards'
        : props.entityType === 'stakeholder'
          ? 'stakeholders'
          : 'events'

    const collection = payload[collectionKey] ?? []
    entity.value = collection.find((item: Entity) => item.id === props.entityId) ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.entity-detail {
  display: grid;
  gap: var(--space-5);
}

.entity-detail__header h1 {
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

.detail-block h2 {
  margin: 0 0 var(--space-2);
}

.detail-subsection {
  margin-top: var(--space-3);
}

.detail-subsection h3 {
  margin: 0 0 var(--space-2);
  font-size: 0.92rem;
  color: var(--text-secondary);
}

.detail-block ul {
  margin: 0;
  padding-left: 1rem;
}

.facts-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
}

.facts-grid p {
  margin: 0;
}

.chip-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chip-list li {
  border: 1px solid var(--border-card);
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  background: var(--surface-card);
  font-size: 0.8rem;
}

.delta-table {
  width: 100%;
  border-collapse: collapse;
}

.delta-table th,
.delta-table td {
  text-align: left;
  padding: 0.35rem 0.4rem;
  border-bottom: 1px solid var(--border-card);
}

.delta-positive {
  color: var(--effect-positive);
}

.delta-negative {
  color: var(--effect-negative);
}

pre {
  margin: var(--space-3) 0 0;
  overflow: auto;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-card);
  background: var(--surface-panel);
}

summary {
  cursor: pointer;
  color: var(--text-secondary);
}

.muted {
  color: var(--text-secondary);
}
</style>
