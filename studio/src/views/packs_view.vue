<template>
  <main id="main" class="packs-view" tabindex="-1">
    <p v-if="!studio.persistent" class="note note-warning" role="status">
      <strong>This browser isn't letting the Studio keep anything,</strong> so drafts last only until you close the page.
      Export your pack to keep a copy.
    </p>

    <!-- Your packs (#/packs, M4.27): every draft in this browser. The welcome page shows the latest few -->
    <section class="packs" aria-labelledby="packs-title">
      <div class="packs-head">
        <div class="packs-title-block">
          <h1 id="packs-title" class="intro-title">Your packs</h1>
          <p class="packs-lede">Kept in this browser only. Export a pack to keep a copy of your own.</p>
        </div>
        <div class="packs-actions">
          <ImportButton @imported="(id) => $emit('openDraft', id)" />
          <button type="button" class="button button-primary" @click="$emit('create')">Create a pack</button>
        </div>
      </div>

      <p v-if="!studio.ready" class="loading" role="status">Loading your packs…</p>
      <div v-else-if="studio.drafts.length === 0" class="empty-packs">
        <p><strong>No packs yet.</strong> Create one (the guided round builds your first with you, step by step), or import a pack file or zip to keep editing it.</p>
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
            <KindPill :kind="entry.draft.kind" />
            <button type="button" class="tile-open" @click="$emit('openDraft', entry.draft_id)">
              <span class="tile-name">{{ entry.draft.name || 'Untitled pack' }}</span>
            </button>
            <span class="tile-line">{{ describeOwnContent(entry.draft) }}</span>
            <span v-if="roundPlace(entry.draft)" class="tile-line tile-round">Guided round: step {{ roundPlace(entry.draft)!.step }} of {{ roundPlace(entry.draft)!.of }}</span>
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

  </main>

</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { describeOwnContent, releaseState, roundPlace, sharedPackIds, type DraftPack } from '@/domains/authoring'
import ImportButton from '@studio/components/import_button.vue'
import KindPill from '@studio/components/kind_pill.vue'
import { removeDraft, studio } from '@studio/state/studio_state'

defineEmits<{ openDraft: [draftId: string]; create: [] }>()

const pendingRemoval = ref<string | null>(null)

/** Drafts that would export as the same pack (the domain's sharedPackIds). */
const shared = computed(() => sharedPackIds(studio.drafts))

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

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style scoped>
.packs-view {
  flex: 1;
  width: 100%;
  max-width: 75rem;
  margin: 0 auto;
  padding: 2.5rem 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.packs-view:focus {
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

</style>
