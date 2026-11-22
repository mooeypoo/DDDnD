<template>
  <div class="community-bazaar" :class="bazaarLookClass(look)">
    <div class="bazaar-glow" aria-hidden="true" />
    <div class="bazaar-awning" aria-hidden="true" />

    <CommunityPacksDialog
      :isOpen="isAddOpen"
      :initialUrl="packLinkFromQuery"
      inBazaar
      @close="isAddOpen = false"
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
          Packs you add stay in this browser on this device. There are no accounts and DDDnD keeps nothing about
          you, so they won't follow you to another browser or device, and clearing this site's data removes them.
        </template>
        <template v-else>
          This browser isn't letting DDDnD keep anything, so packs you add last only until you close the page.
          There are no accounts and DDDnD keeps nothing about you.
        </template>
        Keep the links to packs you like somewhere of your own.
      </p>
      <p v-if="missingPackLink" class="bazaar-note" role="status">
        That pack isn't added in this browser. Ask whoever shared it for the pack's link, then add it here.
      </p>
      <p v-if="flow.savedRunNotice.value" class="bazaar-note saved-run-note" role="status">
        {{ flow.savedRunNotice.value.message }}
        <button type="button" class="note-action" @click="isAddOpen = true">Add a pack</button>
      </p>
      <ul v-if="flow.restoreIssues.value.length > 0" class="bazaar-note restore-issues">
        <li v-for="issue in flow.restoreIssues.value" :key="issue.name">
          “{{ issue.name }}” couldn't be restored and was left out: {{ issue.reason }}
        </li>
      </ul>
    </section>

    <section class="stalls" aria-label="Added packs">
      <article v-for="stall in stalls" :key="stall.key" class="stall">
        <div class="stall-awning" aria-hidden="true" />
        <p class="stall-ribbon">External · not reviewed</p>
        <h2 class="stall-name">{{ stall.title }} <span class="stall-version">v{{ stall.version }}</span></h2>
        <p class="stall-publisher">Published by {{ stall.publisher }}</p>
        <p class="stall-counts">{{ stall.counts }}</p>
        <p class="stall-description">{{ stall.description }}</p>

        <div v-if="pendingRemoval === stall.key" class="stall-confirm" role="group" :aria-label="`Remove ${stall.title}?`">
          <p class="stall-confirm-copy">
            Remove “{{ stall.title }}”? A saved run from this pack can't be continued until you add it back.
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

      <article class="stall add-stall">
        <div class="stall-awning" aria-hidden="true" />
        <h2 class="stall-name">Add a pack</h2>
        <p class="stall-description">
          From a GitHub link the pack's author gave you, or from a <code>.dddnd-pack.json</code> file.
          You'll see what's in it, and where it comes from, before anything is added.
        </p>
        <div class="stall-actions">
          <button type="button" class="stall-btn primary" @click="isAddOpen = true">Add a pack</button>
        </div>
      </article>
    </section>

    <p v-if="stalls.length === 0" class="bazaar-empty">
      No packs here yet. Try the demo,
      <button type="button" class="note-action" @click="openDemo">The Gilded Ledger</button>,
      to see how it works.
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * The Community Bazaar (journal M2.11): every community pack added in this
 * browser, one stall per pack. Opening a stall goes to that pack's own table.
 * Gated by the ADR 0009 flag at the route.
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import GameLogo from '@/ui/components/branding/game_logo.vue'
import CommunityPacksDialog from '@/ui/components/community/community_packs_dialog.vue'
import { bazaarLookClass, bazaarLookFromQuery } from '@/ui/community/bazaar_look'
import { packTableRoute } from '@/ui/community/community_routes'
import { useCommunityPacks } from '@/ui/composables/use_community_packs'
import { useGameStore } from '@/ui/stores/game_store'

const DEMO_PACK_URL = 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json'

const route = useRoute()
const gameStore = useGameStore()
const flow = useCommunityPacks()

const look = computed(() => bazaarLookFromQuery(route.query.look))
/**
 * A `?pack=<manifest URL>` link opens the add dialog with the link filled in.
 * It never loads by itself: fetching tells the host the player's IP address.
 */
const packLinkFromQuery = ref(typeof route.query.pack === 'string' ? route.query.pack : undefined)
const isAddOpen = ref(Boolean(packLinkFromQuery.value))
const missingPackLink = route.query.missing === '1'
const pendingRemoval = ref<string | null>(null)

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
  padding: 2rem 1rem 4rem;
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

.bazaar-awning,
.stall-awning {
  background: repeating-linear-gradient(90deg, var(--bazaar-stripe-a) 0 28px, var(--bazaar-stripe-b) 28px 56px);
  -webkit-mask: radial-gradient(circle 14px at 14px 12px, #000 98%, transparent) 0 0 / 28px 26px repeat-x, linear-gradient(#000, #000) 0 0 / 100% 12px no-repeat;
  mask: radial-gradient(circle 14px at 14px 12px, #000 98%, transparent) 0 0 / 28px 26px repeat-x, linear-gradient(#000, #000) 0 0 / 100% 12px no-repeat;
}

.bazaar-awning {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 26px;
  opacity: 0.9;
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
  font-size: clamp(1.7rem, 4vw, 2.6rem);
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

.stalls {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
  gap: 1.4rem;
  margin-top: 1.8rem;
}

.stall {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 2.1rem 1rem 1rem;
  border: 2px dashed var(--bazaar-stitch);
  border-radius: 12px;
  background: var(--bazaar-panel);
  overflow: hidden;
}

.stall-awning {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 26px;
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

.add-stall {
  border-style: dotted;
}

.bazaar-empty {
  margin-top: 1.2rem;
  text-align: center;
  font-size: var(--text-base);
  color: var(--bazaar-muted);
}
</style>
