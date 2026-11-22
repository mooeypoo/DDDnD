<template>
  <div class="community-bazaar bazaar-theme">
    <div class="bazaar-glow" aria-hidden="true" />
    <div class="bazaar-awning" aria-hidden="true" />

    <CommunityPacksDialog
      :isOpen="isAddOpen"
      :initialUrl="packLinkFromQuery"
      inBazaar
      @close="isAddOpen = false"
      @imported="justImported = $event"
    />

    <header class="bazaar-mast">
      <GameLogo size="small" />
      <nav class="bazaar-nav" aria-label="Leave the bazaar">
        <RouterLink class="bazaar-link" to="/play">‹ Council lobby</RouterLink>
      </nav>
    </header>

    <section class="bazaar-intro">
      <p class="bazaar-kicker">Community packs · not reviewed by DDDnD</p>
      <h1 class="bazaar-title">The Community Bazaar</h1>
      <p class="bazaar-lede">
        Adventures made by other people. Each pack is its own world, with its own scenarios.
        Packs can't run code or reach your device; the worst a pack can do is show you text you didn't expect.
      </p>
    </section>

    <section class="bazaar-notes" aria-label="About the packs here">
      <p class="bazaar-note storage-note">
        <strong>Kept in this browser only.</strong>
        <template v-if="flow.persistent.value">
          Packs you import stay in this browser on this device. There are no accounts and DDDnD keeps nothing about
          you, so they won't follow you to another browser or device, and clearing this site's data removes them.
        </template>
        <template v-else>
          This browser isn't letting DDDnD keep anything, so packs you import last only until you close the page.
          There are no accounts and DDDnD keeps nothing about you.
        </template>
        Keep the links to packs you like somewhere of your own.
      </p>
      <p v-if="justImported" class="bazaar-note imported-note" role="status">
        Imported “{{ justImported.name }}”.
        <RouterLink class="note-action" :to="packTableRoute(justImported.key)">Open it to play</RouterLink>
        <template v-if="!justImported.kept"> This browser couldn't keep it, so it lasts until you close the page.</template>
      </p>
      <p v-if="missingPackLink" class="bazaar-note" role="status">
        That pack isn't imported in this browser. Ask whoever shared it for the pack's link, then import it here.
      </p>
      <p v-if="flow.savedRunNotice.value" class="bazaar-note saved-run-note" role="status">
        {{ flow.savedRunNotice.value.message }}
        <button type="button" class="note-action" @click="isAddOpen = true">Import a pack</button>
      </p>
      <ul v-if="flow.restoreIssues.value.length > 0" class="bazaar-note restore-issues">
        <li v-for="issue in flow.restoreIssues.value" :key="issue.name">
          “{{ issue.name }}” couldn't be restored and was left out: {{ issue.reason }}
        </li>
      </ul>
    </section>

    <section class="stalls" aria-label="Imported packs">
      <article v-for="stall in stalls" :key="stall.key" class="stall" :class="{ 'is-new': stall.key === justImported?.key }">
        <div class="stall-edge" aria-hidden="true" />
        <p class="stall-ribbon">External · not reviewed</p>
        <h2 class="stall-name">{{ stall.title }} <span class="stall-version">v{{ stall.version }}</span></h2>
        <p class="stall-publisher">Published by {{ stall.publisher }}</p>
        <p class="stall-counts">{{ stall.counts }}</p>
        <p class="stall-description">{{ stall.description }}</p>

        <div v-if="pendingRemoval === stall.key" class="stall-confirm" role="group" :aria-label="`Remove ${stall.title}?`">
          <p class="stall-confirm-copy">
            Remove “{{ stall.title }}”? A saved run from this pack can't be continued until you import it again.
          </p>
          <div class="stall-actions">
            <button type="button" class="stall-btn" @click="pendingRemoval = null">Keep it</button>
            <button type="button" class="stall-btn danger" @click="remove(stall.key)">Remove</button>
          </div>
        </div>
        <div v-else class="stall-actions">
          <button type="button" class="stall-btn" @click="pendingRemoval = stall.key">Remove</button>
          <RouterLink class="stall-btn primary" :to="packTableRoute(stall.key)">Open</RouterLink>
        </div>
      </article>

    </section>

    <p v-if="stalls.length === 0" class="bazaar-empty">
      No packs here yet. Try the demo,
      <button type="button" class="note-action" @click="openDemo">The Gilded Ledger</button>,
      to see how it works.
    </p>

    <section class="import-slot" aria-label="Import a pack">
      <button type="button" class="import-btn" @click="isAddOpen = true">
        <span class="import-plus" aria-hidden="true">+</span> Import a pack
      </button>
      <p class="import-help">
        From a GitHub link the pack's author gave you, or a <code>.dddnd-pack.json</code> file.
        You'll see what's in it, and where it comes from, before anything is imported.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * The Community Bazaar (journal M2.11): every community pack imported in this
 * browser, one stall per pack. Opening a stall goes to that pack's own table.
 * Gated by the ADR 0009 flag at the route.
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import GameLogo from '@/ui/components/branding/game_logo.vue'
import CommunityPacksDialog from '@/ui/components/community/community_packs_dialog.vue'
import { packTableRoute } from '@/ui/community/community_routes'
import { useCommunityPacks, type ImportedPack } from '@/ui/composables/use_community_packs'
import { useGameStore } from '@/ui/stores/game_store'

const DEMO_PACK_URL = 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json'

const route = useRoute()
const gameStore = useGameStore()
const flow = useCommunityPacks()

/**
 * A `?pack=<manifest URL>` link opens the add dialog with the link filled in.
 * It never loads by itself: fetching tells the host the player's IP address.
 */
const packLinkFromQuery = ref(typeof route.query.pack === 'string' ? route.query.pack : undefined)
const isAddOpen = ref(Boolean(packLinkFromQuery.value))
const missingPackLink = route.query.missing === '1'
const pendingRemoval = ref<string | null>(null)
/** The pack imported just now: named in a note and highlighted among the stalls. */
const justImported = ref<ImportedPack | null>(null)

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

const stalls = computed(() => flow.loadedPacks.value.map(({ key, review }) => {
  const manifest = gameStore.find_community_pack(key)?.manifest
  const parts = [
    plural(manifest?.scenarios.length ?? 0, 'adventure', 'adventures'),
    ...(manifest?.tutorials.length ? [plural(manifest.tutorials.length, 'tutorial', 'tutorials')] : []),
  ]
  return {
    key,
    title: review.title,
    version: review.version,
    publisher: review.publisher.label,
    description: review.description,
    counts: parts.join(' · '),
  }
}))

function openDemo() {
  packLinkFromQuery.value = DEMO_PACK_URL
  isAddOpen.value = true
}

async function remove(packKey: string) {
  pendingRemoval.value = null
  if (justImported.value?.key === packKey) justImported.value = null
  await flow.remove(packKey)
}

onMounted(async () => {
  await gameStore.load_content_packs()
  await gameStore.refresh_saved_run_pack_notice()
})
</script>

<style scoped>
.community-bazaar {
  position: relative;
  min-height: 100dvh;
  padding: 1.4rem 1rem 4rem;
  background: var(--bazaar-bg);
  color: var(--bazaar-ink);
  overflow-x: hidden;
}

.bazaar-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 8%, var(--bazaar-glow), transparent 50%),
    radial-gradient(ellipse at 50% 100%, var(--bazaar-glow-low), transparent 45%);
}

/* A thin valance: the room's only awning. */
.bazaar-awning {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: repeating-linear-gradient(90deg, var(--bazaar-stripe-a) 0 18px, var(--bazaar-stripe-b) 18px 36px);
  -webkit-mask: radial-gradient(circle 5px at 9px 5px, #000 98%, transparent) 0 0 / 18px 10px repeat-x, linear-gradient(#000, #000) 0 0 / 100% 5px no-repeat;
  mask: radial-gradient(circle 5px at 9px 5px, #000 98%, transparent) 0 0 / 18px 10px repeat-x, linear-gradient(#000, #000) 0 0 / 100% 5px no-repeat;
}

.bazaar-mast,
.bazaar-intro,
.bazaar-notes,
.stalls,
.bazaar-empty {
  position: relative;
  z-index: 1;
  max-width: 68rem;
  margin-left: auto;
  margin-right: auto;
}

.bazaar-mast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.bazaar-link {
  color: var(--bazaar-accent);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
}

.bazaar-link:hover,
.bazaar-link:focus-visible {
  text-decoration: underline;
}

.bazaar-intro {
  margin-top: 1.6rem;
  text-align: center;
}

.bazaar-kicker,
.stall-ribbon {
  margin: 0;
  font-size: var(--text-kicker);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--bazaar-accent);
}

.bazaar-title {
  margin: 0.3rem 0 0;
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 3.4vw, 2.2rem);
  color: var(--bazaar-ink);
}

.bazaar-lede {
  max-width: 42rem;
  margin: 0.6rem auto 0;
  font-size: var(--text-base);
  line-height: 1.55;
  color: var(--bazaar-muted);
}

.bazaar-notes {
  display: grid;
  gap: 0.5rem;
  max-width: 46rem;
  margin-top: 1.2rem;
}

.bazaar-note {
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--bazaar-accent-soft);
  background: var(--bazaar-panel);
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--bazaar-muted);
}

.bazaar-note strong {
  color: var(--bazaar-ink);
}

.restore-issues {
  padding-left: 1.8rem;
}

.note-action {
  appearance: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--bazaar-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

/* Centered, also with a single pack: fixed-width columns, centered as a group. */
.stalls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 21rem));
  justify-content: center;
  gap: 1.4rem;
  margin-top: 1.8rem;
}

.stall {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.35rem 1rem 1rem;
  border: 1px dashed var(--bazaar-stitch);
  border-radius: 12px;
  background: var(--bazaar-panel);
  overflow: hidden;
}

/* A flat striped edge, echoing the valance without another awning. */
.stall-edge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: repeating-linear-gradient(90deg, var(--bazaar-stripe-a) 0 12px, var(--bazaar-stripe-b) 12px 24px);
}

.stall-name {
  margin: 0.1rem 0 0;
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--bazaar-ink);
}

.stall-version {
  font-size: var(--text-sm);
  color: var(--bazaar-muted);
}

.stall-publisher,
.stall-counts,
.stall-description,
.stall-confirm-copy {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.45;
  color: var(--bazaar-muted);
}

.stall-counts {
  color: var(--bazaar-ink);
}

.stall-description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stall-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.6rem;
}

.stall-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  border: 1px solid var(--bazaar-accent-soft);
  background: transparent;
  color: var(--bazaar-muted);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
}

.stall-btn.primary {
  border-color: var(--bazaar-accent);
  background: var(--bazaar-accent-soft);
  color: var(--bazaar-ink);
}

.stall-btn.danger {
  border-color: var(--effect-negative-border);
  color: var(--effect-negative);
}

.stall-btn:focus-visible,
.note-action:focus-visible,
.bazaar-link:focus-visible {
  outline: 2px solid var(--bazaar-accent);
  outline-offset: 2px;
}

.stall.is-new {
  border-style: solid;
  border-color: var(--bazaar-accent);
  box-shadow: 0 0 0 3px var(--bazaar-accent-soft);
}

/* Importing is an action, not a pack: no card, no stripes, so it never looks like a stall. */
.import-slot {
  position: relative;
  z-index: 1;
  max-width: 34rem;
  margin: 2rem auto 0;
  text-align: center;
}

.import-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  border: 1px solid var(--bazaar-accent);
  background: var(--bazaar-accent-soft);
  color: var(--bazaar-ink);
  font-family: var(--font-heading);
  font-size: var(--text-base);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

.import-btn:hover {
  background: rgba(108, 199, 187, 0.24);
}

.import-btn:focus-visible {
  outline: 2px solid var(--bazaar-accent);
  outline-offset: 3px;
}

.import-plus {
  font-size: 1.2em;
  line-height: 1;
  color: var(--bazaar-accent);
}

.import-help {
  margin: 0.6rem 0 0;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--bazaar-muted);
}

.bazaar-empty {
  margin-top: 1.2rem;
  text-align: center;
  font-size: var(--text-base);
  color: var(--bazaar-muted);
}
</style>
