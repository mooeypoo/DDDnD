<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="Import a pack"
    subtitle="Scenarios made by people outside DDDnD"
    size="lg"
    close-label="Close import a pack"
    @close="close"
  >
    <div class="community-packs">
      <!-- Review: the consent screen -->
      <section v-if="flow.phase.value === 'review' && flow.review.value" class="pack-review" aria-labelledby="pack-review-title">
        <p class="unreviewed-note">
          <strong>From a source DDDnD hasn't reviewed: {{ flow.review.value.publisher.label }}.</strong>
          Packs can't run code or reach your device: they only change the game's text and numbers, and the game
          has checked that this one is valid. The worst a pack can do is show you text you didn't expect.
        </p>

        <h3 id="pack-review-title" class="pack-title">
          {{ flow.review.value.title }} <span class="pack-version">v{{ flow.review.value.version }}</span>
        </h3>
        <p class="pack-description">{{ flow.review.value.description }}</p>

        <dl class="pack-facts">
          <dt>Published by</dt>
          <dd>
            <span class="publisher" :class="{ unverified: !flow.review.value.publisher.verified }">{{ flow.review.value.publisher.label }}</span>
            <span class="origin-note">{{ flow.review.value.publisher.verified ? 'The account it was loaded from. ' : '' }}Names below are written by the pack itself.</span>
          </dd>

          <dt>Credits</dt>
          <dd>
            <template v-for="(author, index) in flow.review.value.authors" :key="author.name + index">
              <span v-if="index > 0">, </span>
              <a v-if="author.link" :href="author.link.url" target="_blank" rel="noopener noreferrer" :title="externalLinkTitle(author.link.host)">{{ author.name }}</a>
              <span v-else>{{ author.name }}</span>
              <span v-if="author.link" class="link-host">({{ author.link.host }})</span>
            </template>
          </dd>

          <dt>What it is</dt>
          <dd>{{ flow.review.value.kindLabel }}</dd>

          <dt>License</dt>
          <dd>{{ flow.review.value.license }}</dd>

          <dt>Where it comes from</dt>
          <dd>
            <span class="origin-label" :class="`tone-${flow.review.value.origin.tone}`">{{ flow.review.value.origin.label }}</span>
            <code class="origin-detail">{{ flow.review.value.origin.detail }}</code>
            <span class="origin-note">{{ flow.review.value.origin.note }}</span>
          </dd>

          <template v-if="flow.review.value.homepage">
            <dt>Homepage</dt>
            <dd>
              <a :href="flow.review.value.homepage.url" target="_blank" rel="noopener noreferrer" :title="externalLinkTitle(flow.review.value.homepage.host)">{{ flow.review.value.homepage.host }}</a>
            </dd>
          </template>

          <dt>Fingerprint</dt>
          <dd><code>{{ flow.review.value.fingerprint }}</code></dd>
        </dl>
        <p v-if="flow.review.value.homepage || flow.review.value.authors.some((author) => author.link)" class="external-links-note">
          The links above come from the pack and lead to sites DDDnD doesn't know. Use caution.
        </p>

        <h4 class="section-kicker">Adds {{ flow.review.value.counts.scenarios === 1 ? 'one scenario' : `${flow.review.value.counts.scenarios} scenarios` }}</h4>
        <ul class="pack-scenarios">
          <li v-for="scenario in flow.review.value.scenarios" :key="scenario.name">
            <strong>{{ scenario.name }}</strong> · {{ scenario.turns }} turns
            <span class="scenario-summary">{{ scenario.summary }}</span>
          </li>
        </ul>

        <p
          v-for="(note, index) in flow.relations.value"
          :key="index"
          class="replace-note"
          :class="`tone-${note.tone}`"
        >{{ note.message }}</p>
        <p v-if="flow.review.value.privacyNote" class="privacy-note">{{ flow.review.value.privacyNote }}</p>
        <p class="session-note">
          {{ flow.persistent.value
            ? 'Kept in this browser until you remove it.'
            : 'This browser can\'t keep packs, so it lasts until you close the page.' }}
        </p>
      </section>

      <!-- Problems -->
      <section v-else-if="flow.phase.value === 'error'" class="pack-error" role="alert">
        <h3 class="pack-title">{{ flow.errorTitle.value }}</h3>
        <ul class="issue-list">
          <li v-for="(issue, index) in flow.issues.value" :key="index">
            <code>{{ issue.file }}</code> {{ issue.message }}
          </li>
        </ul>
        <p v-if="flow.hiddenIssueCount.value > 0" class="hidden-issues">
          …and {{ flow.hiddenIssueCount.value }} more. The pack's author can see them all with DDDnD's pack validator.
        </p>
      </section>

      <!-- Load a pack, and the list of added packs -->
      <section v-else class="pack-load">
        <p v-if="flow.savedRunNotice.value && !inBazaar" class="saved-run-note" role="status">
          {{ flow.savedRunNotice.value.message }}
        </p>
        <ul v-if="flow.restoreIssues.value.length > 0" class="issue-list restore-issues">
          <li v-for="issue in flow.restoreIssues.value" :key="issue.name">
            “{{ issue.name }}” couldn't be restored and was left out: {{ issue.reason }}
          </li>
        </ul>
        <p v-if="flow.lastAdded.value" class="added-note" role="status">
          Imported “{{ flow.lastAdded.value }}”. It's in the bazaar now.
          <template v-if="!flow.lastAddedKept.value"> It couldn't be saved on this device, so it lasts until you close the page.</template>
        </p>

        <form class="load-form" @submit.prevent="loadUrl">
          <label for="community-pack-url" class="field-label">Pack link</label>
          <p class="field-help">A GitHub link to a pack's <code>manifest.json</code>, from the pack's author.</p>
          <div class="load-row">
            <input
              id="community-pack-url"
              v-model="urlDraft"
              class="url-input"
              type="url"
              inputmode="url"
              autocomplete="off"
              spellcheck="false"
              placeholder="https://raw.githubusercontent.com/…/manifest.json"
              :disabled="busy"
            />
            <AppButton variant="primary" :disabled="busy || !urlDraft.trim()" @click="loadUrl">
              {{ flow.phase.value === 'loading' ? 'Checking…' : 'Load from GitHub' }}
            </AppButton>
          </div>
          <p class="field-help">Loading downloads the pack from GitHub and checks it. Nothing is imported until you confirm.</p>
        </form>

        <div class="file-row">
          <span class="field-label">Or a pack file</span>
          <label class="file-pick" :class="{ disabled: busy }">
            <input
              class="file-input"
              type="file"
              accept=".json,application/json"
              :disabled="busy"
              @change="loadFile"
            />
            Choose a .dddnd-pack.json file
          </label>
        </div>

        <div v-if="flow.loadedPacks.value.length > 0 && !inBazaar" class="loaded">
          <h4 class="section-kicker">{{ flow.persistent.value ? 'Imported packs' : 'Imported this visit' }}</h4>
          <ul class="loaded-list">
            <li v-for="pack in flow.loadedPacks.value" :key="pack.key">
              <span>
                <strong>{{ pack.review.title }}</strong> v{{ pack.review.version }}
                <span class="link-host">{{ pack.review.publisher.label }}</span>
              </span>
              <AppButton variant="subtle" :disabled="busy" @click="flow.remove(pack.key)">Remove</AppButton>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <template #footer>
      <template v-if="flow.phase.value === 'review'">
        <AppButton variant="secondary" @click="flow.cancel">Don't import</AppButton>
        <AppButton variant="primary" @click="flow.confirm">Import this pack</AppButton>
      </template>
      <template v-else-if="flow.phase.value === 'adding'">
        <AppButton variant="primary" disabled>Importing…</AppButton>
      </template>
      <template v-else-if="flow.phase.value === 'error'">
        <AppButton variant="secondary" @click="flow.cancel">Back</AppButton>
      </template>
      <template v-else>
        <AppButton variant="secondary" @click="close">Done</AppButton>
      </template>
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
/**
 * Community packs dialog (M2.5, gated by ADR 0009).
 *
 * Load a pack from a GitHub link or a file, review what it is and where it
 * comes from, then add it for this visit. All pack text is rendered as text.
 */
import { computed, ref, watch } from 'vue'

import AppButton from '@/ui/components/common/AppButton.vue'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import { useCommunityPacks } from '@/ui/composables/use_community_packs'

const props = defineProps<{
  isOpen: boolean
  /** Prefills the link field (from a `?pack=` link). Never loads by itself. */
  initialUrl?: string
  /** Opened from the bazaar, which lists added packs and saved-run notices itself. */
  inBazaar?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const flow = useCommunityPacks()
const urlDraft = ref(props.initialUrl ?? '')
const busy = computed(() => flow.phase.value === 'loading' || flow.phase.value === 'adding')

watch(() => props.initialUrl, (url) => {
  if (url) urlDraft.value = url
})

// A saved run that needs a pack from GitHub: offer its original link.
watch(() => flow.savedRunNotice.value?.sourceUrl, (url) => {
  if (url && !urlDraft.value) urlDraft.value = url
}, { immediate: true })

function loadUrl() {
  if (!busy.value && urlDraft.value.trim()) {
    void flow.loadFromUrl(urlDraft.value)
  }
}

function loadFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file && !busy.value) {
    void flow.loadFromFile(file)
  }
}

function close() {
  if (flow.phase.value === 'adding') return
  flow.cancel()
  emit('close')
}

/** Every pack-supplied link says where it leads before it is followed. */
function externalLinkTitle(host: string): string {
  return `External link from the pack, to ${host}. DDDnD doesn't know this site.`
}
</script>

<style scoped>
.community-packs {
  color: var(--dng-subtitle-warm);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.pack-title {
  color: var(--dng-title-gold);
  font-size: var(--text-xl);
  margin: 0;
}

.pack-version {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: normal;
}

.pack-description,
.scenario-summary,
.field-help,
.session-note,
.privacy-note {
  line-height: 1.6;
}

.unreviewed-note {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--effect-warning-border);
  background: var(--effect-warning-bg);
  border-radius: 6px;
  font-size: var(--text-sm);
}

.pack-facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-xs) var(--space-md);
  margin: 0;
  font-size: var(--text-sm);
}

.pack-facts dt {
  color: var(--text-secondary);
}

.pack-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.origin-label {
  display: block;
  font-weight: 600;
}

.origin-label.tone-caution {
  color: var(--effect-warning);
}

.origin-detail {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}

.origin-note {
  display: block;
}

.publisher {
  display: block;
  font-weight: 600;
}

.external-links-note {
  margin: var(--space-xs) 0 0;
  font-size: var(--text-xs);
  color: var(--effect-warning);
}

.publisher.unverified {
  color: var(--text-secondary);
}

.replace-note.tone-caution {
  color: var(--effect-warning);
  font-weight: 600;
}

.link-host {
  color: var(--text-secondary);
  font-size: var(--text-xs);
  margin-left: var(--space-1);
}

.section-kicker {
  color: var(--dng-title-gold);
  font-size: var(--text-sm);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: var(--space-sm) 0 0;
}

.pack-scenarios,
.issue-list,
.loaded-list {
  margin: 0;
  padding-left: var(--space-lg);
}

.pack-scenarios li,
.issue-list li {
  margin: var(--space-xs) 0;
}

.scenario-summary {
  display: block;
  font-size: var(--text-sm);
}

.privacy-note,
.session-note,
.hidden-issues {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.issue-list code,
.field-help code {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-right: var(--space-1);
}

.saved-run-note {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--effect-warning-border);
  background: var(--effect-warning-bg);
  border-radius: 6px;
}

.added-note {
  margin: 0;
  color: var(--dng-title-gold);
}

.field-label {
  display: block;
  color: var(--dng-title-gold);
  font-weight: 600;
}

.field-help {
  margin: var(--space-1) 0 var(--space-sm);
  font-size: var(--text-sm);
}

.load-row {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.url-input {
  flex: 1 1 18rem;
  min-width: 0;
  padding: var(--space-sm) var(--space-md);
  border-radius: 6px;
  border: 1px solid var(--border-accent);
  background: rgba(0, 0, 0, 0.35);
  color: var(--text-bright);
  font-size: var(--text-sm);
}

.file-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.file-pick {
  align-self: flex-start;
  cursor: pointer;
  padding: var(--space-sm) var(--space-md);
  border: 1px dashed var(--border-accent);
  border-radius: 6px;
  font-size: var(--text-sm);
}

.file-pick.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.file-pick:focus-within {
  outline: 2px solid var(--text-accent);
  outline-offset: 2px;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.loaded-list {
  list-style: none;
  padding: 0;
}

.loaded-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
