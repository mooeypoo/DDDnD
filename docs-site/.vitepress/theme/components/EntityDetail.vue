<template>
  <section class="entity-detail">
    <p v-if="loading" class="muted">Loading {{ entityLabel }} details...</p>
    <p v-else-if="error" class="muted">Failed to load {{ entityLabel }} details: {{ error }}</p>
    <p v-else-if="!entity" class="muted">{{ titleCaseEntityType }} not found: {{ entityId }}</p>
    <template v-else>
      <header class="entity-detail__header">
        <p class="eyebrow">{{ titleCaseEntityType }} in play · v{{ entity.version }}</p>
        <h1>{{ entity.name || entity.id }}</h1>
        <p class="id">{{ entity.id }}</p>
        <p v-if="entity.description" class="desc">{{ entity.description }}</p>
        <p v-else-if="entity.flavor_text" class="desc">{{ entity.flavor_text }}</p>
      </header>

      <section class="detail-block">
        <template v-if="entityType === 'card'">
          <div class="facts-grid">
            <p><strong>Usage limit:</strong> {{ cardEntity?.usage_limit ?? 'n/a' }}</p>
            <p><strong>Cooldown:</strong> {{ cardEntity?.cooldown_turns ?? 0 }} turns</p>
          </div>

          <div v-if="(cardEntity?.style_tags?.length ?? 0) > 0" class="detail-subsection">
            <h3>Style tags</h3>
            <ul class="chip-list">
              <li v-for="tag in cardEntity?.style_tags ?? []" :key="tag">{{ tag }}</li>
            </ul>
          </div>

          <div v-if="(cardEntity?.score_changes?.length ?? 0) > 0" class="detail-subsection">
            <h3>Score changes</h3>
            <DeltaTable :rows="scoreRows(cardEntity?.score_changes)" />
          </div>

          <div v-if="(cardEntity?.stakeholder_changes?.length ?? 0) > 0" class="detail-subsection">
            <h3>Stakeholder changes</h3>
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
                    <a :href="withBase(`/dashboard/stakeholders/${change.stakeholder_id}`)">{{
                      stakeholderName(change.stakeholder_id)
                    }}</a>
                  </td>
                  <td :class="deltaClass(change.delta)">{{ signedDelta(change.delta) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="(cardEntity?.delayed_effect_refs?.length ?? 0) > 0" class="detail-subsection">
            <h3>Aftershocks</h3>
            <ul>
              <li v-for="effect in cardEntity?.delayed_effect_refs ?? []" :key="effect.id">
                <a :href="withBase(`/dashboard/delayed-effects/${effect.id}`)">{{ delayedName(effect.id) }}</a>
                (v{{ effect.version }})
              </li>
            </ul>
          </div>
        </template>

        <template v-else-if="entityType === 'stakeholder'">
          <div class="facts-grid">
            <p><strong>Reaction rules:</strong> {{ stakeholderEntity?.reaction_rule_refs?.length ?? 0 }}</p>
          </div>
          <div v-if="(stakeholderEntity?.reaction_rule_refs?.length ?? 0) > 0" class="detail-subsection">
            <h3>Reaction rules</h3>
            <ul>
              <li v-for="rule in stakeholderEntity?.reaction_rule_refs ?? []" :key="rule.id">
                {{ humanizeId(rule.id) }} (v{{ rule.version }})
              </li>
            </ul>
          </div>
        </template>

        <template v-else-if="entityType === 'delayed_effect'">
          <div class="facts-grid">
            <p>
              <strong>Turns until resolution:</strong>
              {{ delayedEntity?.turns_until_resolution ?? 'n/a' }}
            </p>
          </div>
          <div v-if="(delayedEntity?.score_changes?.length ?? 0) > 0" class="detail-subsection">
            <h3>Score changes</h3>
            <DeltaTable :rows="scoreRows(delayedEntity?.score_changes)" />
          </div>
        </template>

        <template v-else>
          <div class="facts-grid">
            <p><strong>Occurrence weight:</strong> {{ eventEntity?.occurrence_weight ?? 'n/a' }}</p>
          </div>
          <div v-if="(eventEntity?.score_changes?.length ?? 0) > 0" class="detail-subsection">
            <h3>Score changes</h3>
            <DeltaTable :rows="scoreRows(eventEntity?.score_changes)" />
          </div>
          <div v-if="(eventEntity?.delayed_effect_refs?.length ?? 0) > 0" class="detail-subsection">
            <h3>Aftershocks</h3>
            <ul>
              <li v-for="effect in eventEntity?.delayed_effect_refs ?? []" :key="effect.id">
                <a :href="withBase(`/dashboard/delayed-effects/${effect.id}`)">{{ delayedName(effect.id) }}</a>
                (v{{ effect.version }})
              </li>
            </ul>
          </div>
        </template>
      </section>

      <section v-if="relatedScenarios.length > 0" class="detail-block">
        <h2>Used in ({{ relatedScenarios.length }})</h2>
        <ul>
          <li v-for="scenario in relatedScenarios" :key="scenario.id">
            <a :href="withBase(`/dashboard/scenarios/${scenario.id}`)">{{ scenario.name }}</a>
            <span v-if="scenario.is_tutorial" class="inline-mark">tutorial</span>
          </li>
        </ul>
      </section>

      <section v-if="history.length > 0" class="detail-block history">
        <h2>Earlier files</h2>
        <p class="history-note">
          Retired versions stay on disk. They are not what the current adventures load.
        </p>
        <details>
          <summary>Show {{ history.length }} earlier version{{ history.length === 1 ? '' : 's' }}</summary>
          <pre>{{ historyJson }}</pre>
        </details>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type EntityType = 'card' | 'stakeholder' | 'event' | 'delayed_effect'
type VersionRef = { id: string; version: number }
type ScoreDelta = { score_id: string; delta: number }
type StakeholderDelta = { stakeholder_id: string; delta: number }

type Entity = {
  id: string
  version?: number
  name?: string
  description?: string
  flavor_text?: string
}

type CardEntity = Entity & {
  usage_limit?: number
  cooldown_turns?: number
  style_tags?: string[]
  score_changes?: ScoreDelta[]
  stakeholder_changes?: StakeholderDelta[]
  delayed_effect_refs?: VersionRef[]
}

type StakeholderEntity = Entity & {
  reaction_rule_refs?: VersionRef[]
}

type EventEntity = Entity & {
  occurrence_weight?: number
  score_changes?: ScoreDelta[]
  delayed_effect_refs?: VersionRef[]
}

type DelayedEntity = Entity & {
  turns_until_resolution?: number
  score_changes?: ScoreDelta[]
}

type Scenario = {
  id: string
  name: string
  is_tutorial?: boolean
  card_refs?: VersionRef[]
  stakeholder_refs?: VersionRef[]
  event_refs?: VersionRef[]
}

const DeltaTable = defineComponent({
  name: 'DeltaTable',
  props: {
    rows: { type: Array as () => Array<{ id: string; name: string; delta: number }>, required: true },
  },
  setup(props) {
    return () =>
      h('table', { class: 'delta-table' }, [
        h('thead', [h('tr', [h('th', 'Score'), h('th', 'Delta')])]),
        h(
          'tbody',
          props.rows.map((row) =>
            h('tr', { key: row.id }, [
              h('td', row.name),
              h('td', { class: row.delta > 0 ? 'delta-positive' : row.delta < 0 ? 'delta-negative' : '' }, signedDelta(row.delta)),
            ])
          )
        ),
      ])
  },
})

const props = defineProps<{
  entityType: EntityType
  entityId: string
}>()

const loading = ref(true)
const error = ref<string | null>(null)
const entity = ref<Entity | null>(null)
const history = ref<Entity[]>([])
const scenarios = ref<Scenario[]>([])
const scores = ref<Array<{ id: string; name?: string; short_name?: string }>>([])
const payloadStakeholders = ref<Array<{ id: string; name?: string }>>([])
const delayedEffects = ref<Array<{ id: string; name?: string }>>([])

const entityType = computed(() => props.entityType)
const entityId = computed(() => props.entityId)

const titleCaseEntityType = computed(() => {
  if (props.entityType === 'card') return 'Card'
  if (props.entityType === 'stakeholder') return 'Stakeholder'
  if (props.entityType === 'delayed_effect') return 'Aftershock'
  return 'Event'
})

const entityLabel = computed(() => titleCaseEntityType.value.toLowerCase())

const relatedScenarios = computed(() => {
  if (!entity.value) {
    return []
  }

  if (props.entityType === 'delayed_effect') {
    return scenarios.value
      .filter((scenario) => {
        const cardIds = new Set((scenario.card_refs ?? []).map((ref) => ref.id))
        const eventIds = new Set((scenario.event_refs ?? []).map((ref) => ref.id))
        return (
          relatedFromMaps.value.cards.some((id) => cardIds.has(id)) ||
          relatedFromMaps.value.events.some((id) => eventIds.has(id))
        )
      })
      .sort((a, b) => a.id.localeCompare(b.id))
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

const relatedFromMaps = ref<{ cards: string[]; events: string[] }>({ cards: [], events: [] })

const cardEntity = computed(() => (props.entityType === 'card' ? (entity.value as CardEntity | null) : null))
const stakeholderEntity = computed(() =>
  props.entityType === 'stakeholder' ? (entity.value as StakeholderEntity | null) : null
)
const eventEntity = computed(() => (props.entityType === 'event' ? (entity.value as EventEntity | null) : null))
const delayedEntity = computed(() =>
  props.entityType === 'delayed_effect' ? (entity.value as DelayedEntity | null) : null
)

const historyJson = computed(() => JSON.stringify(history.value, null, 2))
const stakeholderById = computed(() => new Map(payloadStakeholders.value.map((item) => [item.id, item] as const)))
const delayedById = computed(() => new Map(delayedEffects.value.map((item) => [item.id, item] as const)))
const scoreById = computed(() => new Map(scores.value.map((item) => [item.id, item] as const)))

function signedDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta)
}

function deltaClass(delta: number): string {
  if (delta > 0) return 'delta-positive'
  if (delta < 0) return 'delta-negative'
  return ''
}

function humanizeId(id: string): string {
  return id
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function scoreName(id: string): string {
  const score = scoreById.value.get(id)
  if (!score) {
    return humanizeId(id)
  }
  return score.short_name ? `${score.name ?? humanizeId(id)} (${score.short_name})` : score.name ?? humanizeId(id)
}

function scoreRows(changes: ScoreDelta[] | undefined) {
  return (changes ?? []).map((change) => ({
    id: change.score_id,
    name: scoreName(change.score_id),
    delta: change.delta,
  }))
}

function stakeholderName(id: string): string {
  return stakeholderById.value.get(id)?.name ?? humanizeId(id)
}

function delayedName(id: string): string {
  return delayedById.value.get(id)?.name ?? humanizeId(id)
}

function collectionKey(type: EntityType): string {
  if (type === 'card') return 'cards'
  if (type === 'stakeholder') return 'stakeholders'
  if (type === 'delayed_effect') return 'delayed_effects'
  return 'events'
}

function historyKey(type: EntityType): string | null {
  if (type === 'card') return 'card_history'
  if (type === 'event') return 'event_history'
  if (type === 'delayed_effect') return 'delayed_effect_history'
  return null
}

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/content-catalog.json'))
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json()
    scenarios.value = payload.scenarios ?? []
    payloadStakeholders.value = payload.stakeholders ?? []
    delayedEffects.value = payload.delayed_effects ?? []
    scores.value = payload.scores ?? []

    const collection = payload[collectionKey(props.entityType)] ?? []
    entity.value = collection.find((item: Entity) => item.id === props.entityId) ?? null

    const archived = historyKey(props.entityType)
    history.value = archived
      ? (payload[archived] ?? []).filter((item: Entity) => item.id === props.entityId)
      : []

    if (props.entityType === 'delayed_effect') {
      const cardsUsing = (payload.cards ?? [])
        .filter((card: CardEntity) => (card.delayed_effect_refs ?? []).some((ref) => ref.id === props.entityId))
        .map((card: CardEntity) => card.id)
      const eventsUsing = (payload.events ?? [])
        .filter((event: EventEntity) => (event.delayed_effect_refs ?? []).some((ref) => ref.id === props.entityId))
        .map((event: EventEntity) => event.id)
      relatedFromMaps.value = { cards: cardsUsing, events: eventsUsing }
    }
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

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.entity-detail__header h1 {
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

.detail-block h2,
.detail-subsection h3 {
  margin: 0 0 var(--space-2);
}

.detail-subsection {
  margin-top: var(--space-4);
}

.detail-block ul {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 1rem;
  line-height: 1.6;
}

.facts-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  font-size: 1rem;
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
  padding: 0.25rem 0.65rem;
  background: var(--surface-card);
  font-size: 0.9rem;
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

.delta-positive {
  color: var(--effect-positive);
}

.delta-negative {
  color: var(--effect-negative);
}

.inline-mark {
  margin-left: 0.4rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
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

summary {
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1rem;
}

.muted {
  color: var(--text-secondary);
}
</style>
