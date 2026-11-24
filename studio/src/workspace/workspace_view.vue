<template>
  <div v-if="draft" class="workspace">
    <div class="workspace-bar">
      <button type="button" class="button button-quiet" @click="$emit('leave')">‹ All drafts</button>
      <span class="bar-name">{{ draft.name || 'Untitled pack' }}</span>
      <span class="kind-pill" :class="draft.kind === 'retelling' ? 'pill-setting' : 'pill-topic'">
        {{ draft.kind === 'retelling' ? 'Retelling' : 'New topic' }}
      </span>
      <span class="bar-save" role="status" aria-live="polite">{{ saveText }}</span>
      <button
        type="button"
        class="button button-primary"
        :disabled="!canExport || exporting"
        :aria-describedby="canExport ? undefined : 'export-why'"
        @click="exportPack"
      >{{ exporting ? 'Exporting…' : 'Export pack file' }}</button>
      <span v-if="!canExport" id="export-why" class="visually-hidden">Fix the problems listed under Checks first.</span>
    </div>

    <div class="workspace-body">
      <nav class="contents" aria-label="Pack contents">
        <button type="button" class="contents-item" :aria-current="isSelected('details') ? 'page' : undefined" @click="select({ kind: 'details' })">
          Pack details
        </button>
        <span class="contents-group">Scenarios</span>
        <button
          v-for="scenario in scenarios"
          :key="scenario.id"
          type="button"
          class="contents-item contents-sub"
          :aria-current="isSelected('scenario', scenario.id) ? 'page' : undefined"
          @click="select({ kind: 'scenario', id: scenario.id })"
        >{{ scenario.name || 'Untitled scenario' }}</button>
        <template v-for="group in listGroups" :key="group.section">
          <button
            type="button"
            class="contents-item"
            :aria-current="isSelected('list', group.section) ? 'page' : undefined"
            @click="select({ kind: 'list', id: group.section })"
          >
            <span>{{ group.title }}</span><span class="count">{{ group.ids.length }}</span>
          </button>
        </template>
      </nav>

      <main id="main" class="editor-area" tabindex="-1">
        <PackDetailsEditor v-if="selection.kind === 'details'" :draft="draft" @change="updateDraft" />
        <ScenarioEditor
          v-else-if="selection.kind === 'scenario' && selectedScenario"
          :scenario="selectedScenario"
          :scoreNames="names.scores"
          @change="(scenario) => updateDraft(putContent(draft!, 'scenarios', scenario))"
        />
        <section v-else-if="selection.kind === 'list' && selectedGroup" class="list-view" :aria-labelledby="`list-${selectedGroup.section}`">
          <span class="editor-kicker">In your scenario</span>
          <h1 :id="`list-${selectedGroup.section}`" class="editor-title">{{ selectedGroup.title }}</h1>
          <p class="list-note">
            These come from the game, so your scenario plays like the original. Editing them, or making your own versions,
            arrives in the next release.
          </p>
          <ul class="name-list">
            <li v-for="id in selectedGroup.ids" :key="id">{{ selectedGroup.names[id] ?? id }}</li>
          </ul>
        </section>
      </main>

      <div class="rail">
        <ChecksPanel :state="studio.check.state" :issues="studio.check.issues" @goTo="goTo" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'

import { putContent } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import { loadFirstParty } from '@studio/content/first_party'
import { exportCurrentDraft, studio, updateDraft } from '@studio/state/studio_state'
import ChecksPanel from '@studio/workspace/checks_panel.vue'
import PackDetailsEditor from '@studio/workspace/pack_details_editor.vue'
import ScenarioEditor from '@studio/workspace/scenario_editor.vue'

defineEmits<{ leave: [] }>()

type Selection = { kind: 'details' } | { kind: 'scenario'; id: string } | { kind: 'list'; id: ListSection }
type ListSection = 'stakeholders' | 'cards' | 'events'

const draft = computed(() => studio.current?.draft ?? null)
const scenarios = computed(() => Object.values(draft.value?.content.scenarios ?? {}))
const selection = ref<Selection>(scenarios.value[0] ? { kind: 'scenario', id: scenarios.value[0].id } : { kind: 'details' })
const selectedScenario = computed(() => (selection.value.kind === 'scenario' ? draft.value?.content.scenarios[selection.value.id] : undefined))

function select(next: Selection) {
  selection.value = next
}

/** "Go to it" from the Checks rail: open the editor, then move focus into it. */
async function goTo(target: Selection) {
  select(target)
  await nextTick()
  document.querySelector<HTMLElement>('.editor-area input, .editor-area textarea')?.focus()
}

function isSelected(kind: Selection['kind'], id?: string) {
  return selection.value.kind === kind && (id === undefined || ('id' in selection.value && selection.value.id === id))
}

/** Display names for what the scenarios reference: the draft's own content first, then the game's. */
const names = reactive<Record<'scores' | ListSection, Record<string, string>>>({ scores: {}, stakeholders: {}, cards: {}, events: {} })

async function resolveNames() {
  const current = draft.value
  if (!current) return
  const { base } = await loadFirstParty()
  const refsOf = (field: 'score_refs' | 'stakeholder_refs' | 'card_refs' | 'event_refs') =>
    scenarios.value.flatMap((scenario) => scenario[field])
  const jobs: Array<[keyof typeof names, VersionRef[], (ref: VersionRef) => Promise<{ name: string }>, Record<string, { name: string }>]> = [
    ['scores', refsOf('score_refs'), (ref) => base.loadScore(ref), current.content.scores],
    ['stakeholders', refsOf('stakeholder_refs'), (ref) => base.loadStakeholder(ref), current.content.stakeholders],
    ['cards', refsOf('card_refs'), (ref) => base.loadCard(ref), current.content.cards],
    ['events', refsOf('event_refs'), (ref) => base.loadEvent(ref), current.content.events],
  ]
  for (const [key, refs, load, own] of jobs) {
    const resolved: Record<string, string> = {}
    await Promise.all(refs.map(async (ref) => {
      const entity = own[ref.id] ?? (await load(ref).catch(() => null))
      if (entity) resolved[ref.id] = entity.name
    }))
    names[key] = resolved
  }
}

watch(() => scenarios.value.map((scenario) => [scenario.score_refs, scenario.stakeholder_refs, scenario.card_refs, scenario.event_refs]), () => void resolveNames(), { immediate: true, deep: true })

const listGroups = computed(() => {
  const ids = (field: 'stakeholder_refs' | 'card_refs' | 'event_refs') => [...new Set(scenarios.value.flatMap((scenario) => scenario[field].map((ref) => ref.id)))]
  return [
    { section: 'stakeholders' as const, title: 'Council', ids: ids('stakeholder_refs'), names: names.stakeholders },
    { section: 'cards' as const, title: 'Cards', ids: ids('card_refs'), names: names.cards },
    { section: 'events' as const, title: 'Events', ids: ids('event_refs'), names: names.events },
  ]
})
const selectedGroup = computed(() => {
  const current = selection.value
  return current.kind === 'list' ? listGroups.value.find((group) => group.section === current.id) : undefined
})

const saveText = computed(() => {
  if (!studio.persistent) return 'Not kept: export to save'
  return { saved: 'Saved in this browser', saving: 'Saving…', unsaved: 'Saving…', failed: "Couldn't save" }[studio.save]
})

const canExport = computed(() => studio.check.state === 'done' && studio.check.issues.length === 0)
const exporting = ref(false)

async function exportPack() {
  exporting.value = true
  try {
    await exportCurrentDraft()
  } finally {
    exporting.value = false
  }
}

</script>

<style scoped>
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.workspace-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

.bar-name {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.bar-save {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.kind-pill {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.pill-setting { color: var(--forge-gold); }
.pill-topic { color: var(--forge-teal); }

.workspace-body {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  min-height: 0;
}

.contents {
  flex: 1 1 15rem;
  max-width: 17rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.125rem 0.875rem;
  border-right: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

.contents-group {
  margin: 0.75rem 0.75rem 0.25rem;
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.contents-item {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--forge-text);
  font-family: var(--forge-font-body);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
}

.contents-sub {
  padding-left: 1.25rem;
}

.contents-item[aria-current='page'] {
  background: rgba(212, 184, 96, 0.12);
  color: var(--forge-text-bright);
  font-weight: 600;
}

.count {
  color: var(--forge-text-secondary);
}

.editor-area {
  flex: 999 1 32rem;
  min-width: 0;
  padding: 1.75rem 2.25rem 2.5rem;
}

.editor-area:focus {
  outline: none;
}

.rail {
  flex: 1 1 18rem;
  max-width: 21rem;
  padding: 1.5rem 1.375rem;
  border-left: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

@media (max-width: 1100px) {
  .rail {
    max-width: none;
    border-left: none;
    border-top: 1px solid var(--forge-hairline);
  }
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.editor-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--forge-gold);
}

.list-note {
  margin: 0;
  max-width: 40rem;
  color: var(--forge-text-secondary);
}

.name-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 0.5rem;
}

.name-list li {
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  background: var(--forge-panel);
  border: 1px solid var(--forge-hairline);
  color: var(--forge-text-bright);
}
</style>
