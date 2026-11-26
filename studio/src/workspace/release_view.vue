<template>
  <!--
    Export as a release (M4.7): what changed since the last export, the
    version bumps that follow, and the pack version players will see.
  -->
  <section class="editor" aria-labelledby="release-title">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Export</span>
        <h1 id="release-title" class="editor-title">Export your pack</h1>
      </div>
    </div>

    <section class="editor-section" aria-labelledby="release-changes">
      <h2 id="release-changes" class="editor-section-title">{{ plan.since ? `Since version ${plan.since}` : 'First export' }}</h2>

      <p v-if="plan.kind === 'first'">
        This is the first export of “{{ draft.name || 'your pack' }}”. From now on the Studio remembers what you exported,
        so it can tell you what changed next time.
      </p>
      <p v-else-if="plan.kind === 'unchanged'">Nothing has changed since you {{ imported ? 'imported' : 'exported' }} version {{ plan.since }}. You can download it again.</p>

      <template v-else>
        <div v-if="playChanges.length || plan.added.length || plan.removed.length" class="group">
          <h3 class="group-title">Plays differently</h3>
          <ul class="change-list">
            <li v-for="change in playChanges" :key="`${change.section}/${change.id}`" class="change">
              <span class="change-name">{{ change.name || 'Unnamed' }} <span class="change-kind">{{ kindWord(change.section) }}</span></span>
              <span v-if="change.follows" class="change-detail">Something it includes changed, so it moves too: version {{ change.from }} → {{ change.to }}.</span>
              <span v-else class="change-detail">
                {{ fieldList(change.play) }} changed: version {{ change.from }} → {{ change.to }}.<template v-if="change.wording.length"> Also reworded: {{ fieldList(change.wording).toLowerCase() }}.</template>
              </span>
            </li>
            <li v-for="item in plan.added" :key="`added/${item.id}`" class="change">
              <span class="change-name">{{ item.name || 'Unnamed' }} <span class="change-kind">{{ kindWord(item.section) }}</span></span>
              <span class="change-detail">New since {{ plan.since }}.</span>
            </li>
            <li v-for="item in plan.removed" :key="`removed/${item.id}`" class="change">
              <span class="change-name">{{ item.name || 'Unnamed' }} <span class="change-kind">{{ kindWord(item.section) }}</span></span>
              <span class="change-detail">Removed since {{ plan.since }}.</span>
            </li>
          </ul>
        </div>
        <div v-if="plan.license" class="group">
          <h3 class="group-title">License</h3>
          <p class="change-detail">{{ plan.license.from }} → {{ plan.license.to }}. Players who have version {{ plan.since }} keep it under {{ plan.license.from }}.</p>
        </div>
        <div v-if="wordingChanges.length" class="group">
          <h3 class="group-title">Wording only</h3>
          <ul class="change-list">
            <li v-for="change in wordingChanges" :key="`${change.section}/${change.id}`" class="change">
              <span class="change-name">{{ change.name || 'Unnamed' }} <span class="change-kind">{{ kindWord(change.section) }}</span></span>
              <span class="change-detail">{{ fieldList(change.wording) }} changed. It keeps version {{ change.to }}.</span>
            </li>
          </ul>
        </div>
        <div v-if="bumps > 0" class="why" role="note">
          <p><strong>Why new version numbers?</strong> A version names exactly how something plays. Once version {{ firstBump?.from }} of “{{ firstBump?.name }}” has left the Studio, it must always mean that, so a change to how it plays gets the next number. The Studio updates everything in your pack that points to it.</p>
          <p>Changes to wording keep their number.</p>
        </div>
      </template>
    </section>

    <section class="editor-section" aria-labelledby="release-version">
      <h2 id="release-version" class="editor-section-title">Version</h2>
      <label class="field field-short">Pack version players will see
        <input v-model.trim="version" :aria-invalid="problem ? 'true' : undefined" aria-describedby="version-hint" />
      </label>
      <p id="version-hint" class="field-hint" :class="{ 'field-problem': problem }">{{ problem ?? suggestionText }}</p>
      <p v-if="worksWith" class="works-with">
        Made for DDDnD's base game {{ worksWith.from }}. It works in any {{ worksWith.series }} version from {{ worksWith.from }} on.
      </p>
    </section>

    <div class="actions">
      <button type="button" class="button button-primary" :disabled="!canDownload" @click="download('pack_file')">
        {{ exporting === 'pack_file' ? 'Exporting…' : `Download version ${version || '…'}` }}
      </button>
      <button type="button" class="button button-quiet" :disabled="!canDownload" @click="download('zip')">
        {{ exporting === 'zip' ? 'Exporting…' : 'Download as a zip for GitHub' }}
      </button>
      <span v-if="!checksClean" class="field-hint">Fix what the checks list first: the "to fix" button at the top.</span>
    </div>
    <p class="field-hint formats">
      The pack file is what players import in the game's Community bazaar. The zip holds the same pack as a folder, with a README, to publish on GitHub.
    </p>
    <p v-if="state === 'done'" class="done" role="status">Exported version {{ exportedVersion }}{{ exportedFormat === 'zip' ? ' as a zip' : '' }}. The Studio will compare your next export with it.</p>
    <p v-if="state === 'failed'" class="field-problem" role="alert">The game's checks refused this export: see the "to fix" button at the top.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { compatibleBaseGames, fieldWords, gameTarget, planRelease, releaseState, releaseVersionProblem, type DraftPack, type DraftSection } from '@/domains/authoring'
import { loadFirstParty } from '@studio/content/first_party'
import type { ExportFormat } from '@studio/state/studio_state'

const props = defineProps<{ draft: DraftPack; checksClean: boolean }>()
const emit = defineEmits<{ export: [version: string, format: ExportFormat, done: (ok: boolean) => void] }>()

const plan = computed(() => planRelease(props.draft))

// The game this export is for: the base pack the Studio checks against (D25)
const worksWith = ref<{ from: string; series: string } | null>(null)
void loadFirstParty().then(({ packs }) => {
  worksWith.value = compatibleBaseGames(gameTarget(packs))
}).catch(() => {})
/** Whether the last version is the pack the draft was imported from (the domain's releaseState). */
const imported = computed(() => {
  const state = releaseState(props.draft)
  return state.state !== 'never' && state.imported
})
const version = ref(plan.value.suggested)
// A new suggestion (the draft changed) replaces one the author hasn't touched
watch(() => plan.value.suggested, (next, previous) => {
  if (version.value === previous) version.value = next
})

const playChanges = computed(() => plan.value.changed.filter((change) => change.to !== change.from || change.play.length > 0))
const wordingChanges = computed(() => plan.value.changed.filter((change) => change.to === change.from && change.play.length === 0))
const bumps = computed(() => plan.value.changed.filter((change) => change.to !== change.from).length)
const firstBump = computed(() => plan.value.changed.find((change) => change.to !== change.from && !change.follows))
const problem = computed(() => releaseVersionProblem(plan.value, version.value))

const suggestionText = computed(() => {
  const { kind, suggested } = plan.value
  if (kind === 'first') return 'Three numbers. 1.0.0 is a good start.'
  if (kind === 'unchanged') return `The same version as before: nothing changed.`
  if (kind === 'play') return `Suggested: ${suggested}, because something plays differently.`
  if (plan.value.changed.length === 0 && plan.value.license) return `Suggested: ${suggested}, because the license changed.`
  return `Suggested: ${suggested}, because only wording${plan.value.license ? ' and the license' : ''} changed.`
})

const state = ref<'idle' | 'exporting' | 'done' | 'failed'>('idle')
const exportedVersion = ref('')
const exportedFormat = ref<ExportFormat>('pack_file')
const exporting = ref<ExportFormat | null>(null)
const canDownload = computed(() => props.checksClean && !problem.value && state.value !== 'exporting')

const KIND: Partial<Record<DraftSection, string>> = {
  scenarios: 'scenario',
  cards: 'card',
  events: 'event',
  delayed_effects: 'aftershock',
  stakeholders: 'council member',
  stakeholder_reaction_rules: 'reaction',
  scores: 'score',
}
function kindWord(section: DraftSection): string {
  return KIND[section] ?? section.replace(/_/g, ' ')
}

function fieldList(fields: string[]): string {
  const words = [...new Set(fields.map(fieldWords))]
  const listed = words.length <= 1 ? words[0] ?? '' : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
  return listed.charAt(0).toUpperCase() + listed.slice(1)
}

function download(format: ExportFormat) {
  const chosen = version.value
  state.value = 'exporting'
  exporting.value = format
  emit('export', chosen, format, (ok) => {
    state.value = ok ? 'done' : 'failed'
    exporting.value = null
    if (ok) {
      exportedVersion.value = chosen
      exportedFormat.value = format
    }
  })
}
</script>

<style scoped>



.editor-section p {
  margin: 0;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.change-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.change {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  background: var(--forge-ground);
}

.change-name {
  color: var(--forge-text-bright);
}

.change-kind {
  margin-left: 0.375rem;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.change-detail {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.why {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 44rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(108, 199, 187, 0.45);
  background: rgba(108, 199, 187, 0.06);
}

.why strong {
  color: var(--forge-text-bright);
}

.works-with {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.field-short {
  max-width: 14rem;
}

.field-problem {
  color: var(--forge-ember-soft);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.formats {
  margin: 0;
  max-width: 44rem;
}

.done {
  margin: 0;
  color: var(--forge-text-bright);
}
</style>
