<template>
  <section>
    <p v-if="loading" class="muted">Loading {{ title.toLowerCase() }}...</p>
    <p v-else-if="error" class="muted">Failed to load {{ title.toLowerCase() }}: {{ error }}</p>
    <template v-else>
      <div class="catalog-grid">
        <article v-for="entity in entities" :key="entity.id" class="catalog-card">
          <header class="catalog-card__header">
            <h4>
              <a :href="entityLink(entity.id)">{{ entity.name || entity.id }}</a>
            </h4>
            <div class="marks">
              <span v-if="isTutorialEntity(entity.id)" class="mark mark--tutorial">Tutorial</span>
              <span class="mark">v{{ entity.version }}</span>
            </div>
          </header>

          <p v-if="entity.description" class="desc">{{ entity.description }}</p>
          <p v-else-if="entity.flavor_text" class="desc">{{ entity.flavor_text }}</p>

          <div class="catalog-card__actions">
            <a :href="entityLink(entity.id)">View {{ entityLabel }} details</a>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type EntityType = 'card' | 'stakeholder' | 'event' | 'delayed_effect'

type Entity = {
  id: string
  version?: number
  name?: string
  description?: string
  flavor_text?: string
}

const props = defineProps<{
  entityType: EntityType
}>()

const loading = ref(true)
const error = ref<string | null>(null)
const entities = ref<Entity[]>([])

const typeConfig = computed(() => {
  if (props.entityType === 'card') {
    return { title: 'Cards', key: 'cards', basePath: '/dashboard/cards', entityLabel: 'card' }
  }
  if (props.entityType === 'stakeholder') {
    return {
      title: 'Stakeholders',
      key: 'stakeholders',
      basePath: '/dashboard/stakeholders',
      entityLabel: 'stakeholder',
    }
  }
  if (props.entityType === 'delayed_effect') {
    return {
      title: 'Aftershocks',
      key: 'delayed_effects',
      basePath: '/dashboard/delayed-effects',
      entityLabel: 'aftershock',
    }
  }
  return { title: 'Events', key: 'events', basePath: '/dashboard/events', entityLabel: 'event' }
})

const title = computed(() => typeConfig.value.title)
const entityLabel = computed(() => typeConfig.value.entityLabel)

function entityLink(id: string): string {
  return withBase(`${typeConfig.value.basePath}/${id}`)
}

function isTutorialEntity(id: string): boolean {
  return id.startsWith('tutorial_')
}

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/content-catalog.json'))
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json()
    entities.value = (payload[typeConfig.value.key] ?? []).sort((a: Entity, b: Entity) => a.id.localeCompare(b.id))
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

.mark--tutorial {
  color: var(--docs-heading-color);
  border-color: rgba(199, 173, 113, 0.45);
}

.desc {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.6;
}

.catalog-card__actions a {
  color: var(--vp-c-brand-1);
  font-weight: var(--font-semibold);
}

.muted {
  color: var(--text-secondary);
}
</style>
