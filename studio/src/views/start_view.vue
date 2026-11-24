<template>
  <main id="main" class="start-view" tabindex="-1">
    <section class="intro">
      <h1 class="intro-title">Forge a pack</h1>
      <p class="intro-lede">
        Make your own DDDnD adventures, with no code and no files to write by hand.
        Retell the game for your organization, or teach a different topic altogether.
      </p>
    </section>

    <p v-if="!studio.persistent" class="note note-warning" role="status">
      <strong>This browser isn't letting the Studio keep anything,</strong> so drafts last only until you close the page.
      Export your pack to keep a copy.
    </p>

    <div class="columns">
      <section class="start-column" aria-labelledby="retell-title">
        <span class="kind-pill pill-setting">Same game, new setting</span>
        <h2 id="retell-title" class="column-title">Retell DDDnD for your organization</h2>
        <p class="column-lede">
          Copy one of the game's own adventures, with its council, cards and events, then make it yours.
          The original stays as it is.
        </p>

        <p v-if="scenarioError" class="note note-warning" role="alert">
          The game's scenarios couldn't be loaded: {{ scenarioError }}
        </p>
        <p v-else-if="!scenarios" class="loading" role="status">Loading the game's scenarios…</p>
        <ul v-else class="scenario-list" aria-label="DDDnD scenarios">
          <li v-for="scenario in scenarios" :key="scenario.ref.id" class="scenario-row">
            <span class="scenario-text">
              <span class="scenario-name">{{ scenario.name }}</span>
              <span class="scenario-summary">{{ scenario.summary }}</span>
            </span>
            <button
              type="button"
              class="button button-quiet"
              :disabled="starting !== null"
              :aria-label="`Copy and adapt ${scenario.name}`"
              @click="start(scenario)"
            >{{ starting === scenario.ref.id ? 'Copying…' : 'Copy and adapt' }}</button>
          </li>
        </ul>

        <div class="topic-later">
          <span class="kind-pill pill-topic">A different topic</span>
          <p>
            <strong>Teaching a different topic</strong> (your own scores, council and endings) arrives in a later release.
            The <a href="https://github.com/mooeypoo/DDDnD-packs/tree/main/packs/sre_on_call" target="_blank" rel="noopener noreferrer">SRE pack</a>
            shows what one looks like.
          </p>
        </div>
      </section>

      <section class="start-column drafts-column" aria-labelledby="drafts-title">
        <h2 id="drafts-title" class="section-label">Your drafts</h2>
        <p v-if="!studio.ready" class="loading" role="status">Loading your drafts…</p>
        <p v-else-if="studio.drafts.length === 0" class="empty">No drafts yet. Start one from a scenario, or import a pack.</p>
        <ul v-else class="draft-list">
          <li v-for="entry in studio.drafts" :key="entry.draft_id" class="draft-row">
            <template v-if="pendingRemoval === entry.draft_id">
              <span class="draft-confirm">Delete “{{ entry.draft.name }}”? This can't be undone.</span>
              <span class="draft-actions">
                <button type="button" class="button button-quiet" @click="pendingRemoval = null">Keep it</button>
                <button type="button" class="button button-danger" @click="confirmRemove(entry.draft_id)">Delete</button>
              </span>
            </template>
            <template v-else>
              <span class="draft-text">
                <span class="draft-name">{{ entry.draft.name }}</span>
                <span class="draft-meta">{{ kindLabel(entry.draft.kind) }} · version {{ entry.draft.version }} · edited {{ formatWhen(entry.updated_at) }}</span>
              </span>
              <span class="draft-actions">
                <button type="button" class="button button-quiet" :aria-label="`Delete ${entry.draft.name}`" @click="pendingRemoval = entry.draft_id">Delete</button>
                <button type="button" class="button button-primary" @click="$emit('openDraft', entry.draft_id)">Open</button>
              </span>
            </template>
          </li>
        </ul>
        <p class="note"><strong>Kept in this browser only.</strong> Export your pack to keep a copy of your own.</p>

        <section class="import" aria-labelledby="import-title">
          <h3 id="import-title" class="import-title">Keep editing a pack</h3>
          <p class="import-lede">Import a pack file (<code>.dddnd-pack.json</code>) or a zip of a pack's folder, such as one the Studio exported.</p>
          <input ref="fileInput" type="file" class="visually-hidden" tabindex="-1" aria-hidden="true" accept=".json,.zip,application/json,application/zip" @change="importFile" />
          <button type="button" class="button button-quiet import-button" :disabled="importing" @click="fileInput?.click()">
            {{ importing ? 'Importing…' : 'Import a pack' }}
          </button>
          <div v-if="importFailure" class="note note-warning" role="alert">
            <strong>{{ importFailure.name }} couldn't be imported.</strong>
            <ul class="import-problems">
              <li v-for="(problem, index) in importFailure.problems" :key="index">{{ problem }}</li>
            </ul>
          </div>
        </section>
      </section>
    </div>
  </main>

  <footer class="start-footer">
    <span>Made for a laptop or desktop screen. Tablets work; on a phone you can look around, not edit.</span>
    <span>Packs are text and numbers only: no code, no images.</span>
  </footer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { DraftKind } from '@/domains/authoring'
import { listBaseScenarios, type BaseScenarioChoice } from '@studio/content/first_party'
import { importPack, removeDraft, startFromBaseScenario, studio } from '@studio/state/studio_state'

const emit = defineEmits<{ openDraft: [draftId: string] }>()

const scenarios = ref<BaseScenarioChoice[] | null>(null)
const scenarioError = ref<string | null>(null)
const starting = ref<string | null>(null)
const pendingRemoval = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importFailure = ref<{ name: string; problems: string[] } | null>(null)

/** "Import a pack" (M4.8): opens it as a new draft, or says every reason it can't. */
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importing.value = true
  importFailure.value = null
  try {
    const result = await importPack(file)
    if (result.ok) emit('openDraft', result.draft_id)
    else importFailure.value = { name: file.name, problems: result.problems }
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  try {
    scenarios.value = await listBaseScenarios()
  } catch (error) {
    scenarioError.value = (error as Error).message
  }
})

async function start(choice: BaseScenarioChoice) {
  starting.value = choice.ref.id
  try {
    emit('openDraft', await startFromBaseScenario(choice))
  } finally {
    starting.value = null
  }
}

async function confirmRemove(draftId: string) {
  pendingRemoval.value = null
  await removeDraft(draftId)
}

function kindLabel(kind: DraftKind): string {
  return kind === 'retelling' ? 'Retelling' : 'New topic'
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style scoped>
.import {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--forge-hairline);
}

.import-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.import-lede {
  margin: 0;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.import-problems {
  margin: 0.375rem 0 0;
  padding-left: 1.125rem;
}

.start-view {
  flex: 1;
  width: 100%;
  max-width: 75rem;
  margin: 0 auto;
  padding: 2.75rem 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.start-view:focus {
  outline: none;
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-width: 47.5rem;
}

.intro-title {
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--forge-gold);
}

.intro-lede {
  margin: 0;
  font-size: 1.0625rem;
}

.columns {
  display: flex;
  flex-wrap: wrap;
  gap: 1.75rem;
  align-items: flex-start;
}

.start-column {
  flex: 999 1 34rem;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.625rem 1.75rem;
  border-radius: var(--forge-radius);
  background: var(--forge-panel);
  border: 1px solid var(--forge-hairline);
}

.drafts-column {
  flex: 1 1 20rem;
}

.column-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.column-lede {
  margin: 0;
}

.kind-pill {
  align-self: flex-start;
  padding: 0.2rem 0.625rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.pill-setting { color: var(--forge-gold); }
.pill-topic { color: var(--forge-teal); }

.section-label {
  font-family: var(--forge-font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.scenario-list,
.draft-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-ground);
}

.scenario-row,
.draft-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid rgba(160, 112, 24, 0.2);
}

.scenario-row:last-child,
.draft-row:last-child {
  border-bottom: none;
}

.scenario-text,
.draft-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1 1 14rem;
}

.scenario-name,
.draft-name {
  color: var(--forge-text-bright);
  font-weight: 500;
}

.scenario-summary,
.draft-meta {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.draft-actions {
  display: flex;
  gap: 0.5rem;
}

.draft-confirm {
  flex: 1 1 14rem;
  color: var(--forge-text-bright);
}

.topic-later {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--forge-hairline);
}

.topic-later p,
.note,
.empty,
.loading {
  margin: 0;
  font-size: 0.9375rem;
}

.note {
  color: var(--forge-text-secondary);
}

.note strong {
  color: var(--forge-text);
}

.note-warning {
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid rgba(251, 191, 36, 0.45);
  color: var(--forge-text);
}

.start-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 2.5rem;
  border-top: 1px solid var(--forge-hairline);
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}
</style>
