<template>
  <main id="main" class="start-view" tabindex="-1">
    <p v-if="!studio.persistent" class="note note-warning" role="status">
      <strong>This browser isn't letting the Studio keep anything,</strong> so drafts last only until you close the page.
      Export your pack to keep a copy.
    </p>

    <!-- Your packs first (the UI/UX audit, slice 4): most visits are to keep working on one -->
    <section class="packs" aria-labelledby="packs-title">
      <div class="packs-head">
        <div class="packs-title-block">
          <h1 id="packs-title" class="intro-title">Your packs</h1>
          <p class="packs-lede">Kept in this browser only. Export a pack to keep a copy of your own.</p>
        </div>
        <div class="packs-actions">
          <input ref="fileInput" type="file" class="visually-hidden" tabindex="-1" aria-hidden="true" accept=".json,.zip,application/json,application/zip" @change="importFile" />
          <button type="button" class="button button-quiet" :disabled="importing" @click="fileInput?.click()">{{ importing ? 'Importing…' : 'Import a pack' }}</button>
          <button type="button" class="button button-primary" @click="$emit('newPack')">+ New pack</button>
        </div>
      </div>

      <div v-if="importFailure" class="note note-warning" role="alert">
        <strong>{{ importFailure.name }} couldn't be imported.</strong>
        <ul class="import-problems">
          <li v-for="(problem, index) in importFailure.problems" :key="index">{{ problem }}</li>
        </ul>
      </div>

      <p v-if="!studio.ready" class="loading" role="status">Loading your packs…</p>
      <div v-else-if="studio.drafts.length === 0" class="empty-packs">
        <p><strong>No packs yet.</strong> New here? The guided round builds your first one with you, about your own organization. Or start from one of the game's scenarios, or import a pack file or zip to keep editing it.</p>
      </div>
      <ul v-else class="pack-tiles">
        <li v-for="entry in studio.drafts" :key="entry.draft_id" class="pack-tile">
          <template v-if="pendingRemoval === entry.draft_id">
            <p class="tile-confirm">Delete “{{ entry.draft.name }}”? This can't be undone.</p>
            <span class="tile-actions">
              <button type="button" class="button button-quiet" @click="pendingRemoval = null">Keep it</button>
              <button type="button" class="button button-danger" @click="confirmRemove(entry.draft_id)">Delete</button>
            </span>
          </template>
          <template v-else>
            <span class="kind-pill" :class="entry.draft.kind === 'retelling' ? 'pill-setting' : 'pill-topic'">{{ entry.draft.kind === 'retelling' ? 'Retelling' : 'New topic' }}</span>
            <button type="button" class="tile-open" @click="$emit('openDraft', entry.draft_id)">
              <span class="tile-name">{{ entry.draft.name || 'Untitled pack' }}</span>
            </button>
            <span class="tile-line">{{ ownWords(entry.draft) }}</span>
            <span v-if="shared.get(entry.draft_id)" class="tile-shared" role="note">{{ sharedWords(entry.draft.name, shared.get(entry.draft_id)!) }}</span>
            <span class="tile-foot">
              <span :class="{ 'tile-changed': release(entry.draft).state === 'changed' }">{{ releaseWords(entry.draft) }}</span>
              <span>Edited {{ formatWhen(entry.updated_at) }}</span>
            </span>
            <span class="tile-actions">
              <button type="button" class="button button-quiet" @click="$emit('openDraft', entry.draft_id)">Open</button>
              <button type="button" class="button button-quiet" :aria-label="`Delete ${entry.draft.name}`" @click="pendingRemoval = entry.draft_id">Delete</button>
            </span>
          </template>
        </li>
      </ul>
    </section>

    <section class="start-new" aria-labelledby="new-title">
      <h2 id="new-title" class="section-label">Start something new</h2>
      <div class="new-tiles">
        <!-- The guided round (§5, D20): ember, like its header, since it's the way in for a first pack -->
        <button type="button" class="new-tile new-guided" @click="$emit('guidedRound')">
          <span class="kind-pill pill-guided">Guided round</span>
          <span class="new-title">Build your first pack, step by step</span>
          <span class="new-text">About fifteen minutes: your system, your people and the moves your team argues about, with an example beside every step. Then play it.</span>
          <span class="new-go">Start the guided round ›</span>
        </button>
        <button type="button" class="new-tile" @click="$emit('newPack')">
          <span class="kind-pill pill-setting">Same game, new setting</span>
          <span class="new-title">Retell a DDDnD scenario</span>
          <span class="new-text">Copy one of the game's adventures, with its council, cards and events, and make it about your team.</span>
          <span class="new-go">Choose a scenario ›</span>
        </button>
        <button type="button" class="new-tile" @click="$emit('newTopic')">
          <span class="kind-pill pill-topic">A different topic</span>
          <span class="new-title">Teach another subject</span>
          <span class="new-text">Your own scores, council, cards and endings, about incident response, security, or whatever you teach.</span>
          <span class="new-go">Start a topic ›</span>
        </button>
      </div>
    </section>
  </main>

  <footer class="start-footer">
    <span>Made for a laptop or desktop screen. Tablets work; on a phone you can look around, not edit.</span>
    <span>Packs are text and numbers only: no code, no images.</span>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { packCounts, releaseState, sharedPackIds, type DraftPack } from '@/domains/authoring'
import { importPack, removeDraft, studio } from '@studio/state/studio_state'

const emit = defineEmits<{ openDraft: [draftId: string]; newPack: []; newTopic: []; guidedRound: [] }>()

const pendingRemoval = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importFailure = ref<{ name: string; problems: string[] } | null>(null)

/** Drafts that would export as the same pack (the domain's sharedPackIds). */
const shared = computed(() => sharedPackIds(studio.drafts))

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

async function confirmRemove(draftId: string) {
  pendingRemoval.value = null
  await removeDraft(draftId)
}

const release = (draft: DraftPack) => releaseState(draft)

/** Where it stands as a release, in words (the domain's releaseState). */
function releaseWords(draft: DraftPack): string {
  const state = releaseState(draft)
  if (state.state === 'never') return 'Not exported yet'
  if (state.state === 'unchanged') return `${state.imported ? 'Imported' : 'Exported'} as ${state.version}`
  return `Changed since ${state.version}${state.imported ? ' (imported)' : ''}`
}

/** Drafts that would export as one pack: another copy of the same, or another pack that took its id. */
function sharedWords(name: string, others: string[]): string {
  const fix = 'Exporting both would make one replace the other for players; change the prefix in Pack details to keep both.'
  if (others.every((other) => other === name)) return `Another copy of this pack is in your packs. ${fix}`
  return `Exports under the same pack id as ${others.map((other) => `“${other}”`).join(', ')}. ${fix}`
}

/** How much is the author's own (the domain's packCounts). */
function ownWords(draft: DraftPack): string {
  const counts = packCounts(draft)
  const parts = [
    counts.own_cards && `${counts.own_cards} ${counts.own_cards === 1 ? 'card' : 'cards'}`,
    counts.own_events && `${counts.own_events} ${counts.own_events === 1 ? 'event' : 'events'}`,
    counts.own_members && `${counts.own_members} ${counts.own_members === 1 ? 'member' : 'members'}`,
  ].filter(Boolean) as string[]
  if (parts.length === 0) return 'Nothing of your own yet: the game\'s scenario as it is.'
  return `${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]} of your own.`
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style scoped>
.start-view {
  flex: 1;
  width: 100%;
  max-width: 75rem;
  margin: 0 auto;
  padding: 2.5rem 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.start-view:focus {
  outline: none;
}

.packs {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.packs-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.packs-title-block {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.intro-title {
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--forge-gold);
}

.packs-lede {
  margin: 0;
  color: var(--forge-text-secondary);
}

.packs-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.import-problems {
  margin: 0.375rem 0 0;
  padding-left: 1.125rem;
}

.empty-packs {
  padding: 1.25rem 1.5rem;
  border-radius: var(--forge-radius);
  border: 1px dashed var(--forge-hairline-strong);
}

.empty-packs p {
  margin: 0;
}

.pack-tiles {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
  gap: 1rem;
}

.pack-tile {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1.125rem 1.25rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.tile-open {
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.tile-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--forge-text-bright);
  overflow-wrap: anywhere;
}

.tile-open:hover .tile-name {
  text-decoration: underline;
}

.tile-line {
  font-size: 0.9375rem;
}

.tile-shared {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(251, 191, 36, 0.45);
  font-size: 0.875rem;
}

.tile-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(160, 112, 24, 0.2);
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}

.tile-changed {
  color: var(--forge-warning);
}

.tile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tile-confirm {
  margin: 0;
  color: var(--forge-text-bright);
}

.kind-pill {
  align-self: flex-start;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.pill-setting { color: var(--forge-gold); }
.pill-topic { color: var(--forge-teal); }

.start-new {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-label {
  font-family: var(--forge-font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.new-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
  gap: 1rem;
}

.new-tile {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1.25rem 1.375rem;
  border-radius: var(--forge-radius);
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-panel);
  color: var(--forge-text);
  font: inherit;
  text-align: left;
}

button.new-tile {
  cursor: pointer;
}

.new-guided {
  border-color: var(--forge-ember);
  background: var(--forge-ember-ground);
}

.pill-guided {
  align-self: flex-start;
  background: var(--forge-ember);
  color: var(--forge-ember-ink);
}

.new-later {
  border-style: dashed;
}

.new-title {
  font-family: var(--forge-font-heading);
  font-size: 1.25rem;
  color: var(--forge-text-bright);
}

.new-go {
  font-weight: 600;
  color: var(--forge-gold);
}

.note,
.loading {
  margin: 0;
  font-size: 0.9375rem;
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
