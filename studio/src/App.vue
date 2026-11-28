<template>
  <a class="skip-link" href="#main">Skip to the content</a>
  <StudioHeader :textSize="textSize" @update:textSize="setTextSize" />
  <!-- The header stays put; below it, the start screen scrolls as a page and the workspace's columns scroll on their own -->
  <div class="route">
    <WorkspaceView
      v-if="(route.kind === 'draft' || route.kind === 'guided') && studio.current"
      :guided="route.kind === 'guided'"
      @leave="go('#/packs')"
      @leaveRound="go(`#/draft/${route.draftId}`)"
      @resumeRound="go(`#/guided/${route.draftId}`)"
    />
    <p v-else-if="(route.kind === 'draft' || route.kind === 'guided') && route.missing" class="missing" role="alert">
      That draft isn't in this browser. <a href="#/packs">See your packs</a>.
    </p>
    <!-- The front door (the first-screen audit, M4.27–M4.28): welcome, create, and your packs -->
    <CreateView v-else-if="route.kind === 'create'" :key="route.preset" v-bind="CREATE_PRESETS[route.preset]" @openDraft="openDraftAt" />
    <PacksView v-else-if="route.kind === 'packs'" @openDraft="(id) => go(`#/draft/${id}`)" @create="go('#/new')" />
    <WelcomeView v-else-if="route.kind === 'welcome'" @openDraft="openDraftAt" @create="go('#/new')" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import type { DraftKind } from '@/domains/authoring'
import StudioHeader from '@studio/components/studio_header.vue'
import CreateView from '@studio/views/create_view.vue'
import PacksView from '@studio/views/packs_view.vue'
import WelcomeView from '@studio/views/welcome_view.vue'
import WorkspaceView from '@studio/workspace/workspace_view.vue'
import { applyTextSize, readTextSize, writeTextSize, type TextSize } from '@studio/preferences/text_size'
import { closeDraft, initStudio, openDraft, studio } from '@studio/state/studio_state'

const textSize = ref<TextSize>(readTextSize())
applyTextSize(textSize.value)

function setTextSize(size: TextSize) {
  textSize.value = size
  applyTextSize(size)
  writeTextSize(size)
}

/**
 * Where the Studio is, so a reload stays put: the welcome page (`#/`), your
 * packs (`#/packs`), creating one (`#/new`), one draft (`#/draft/<id>`), or
 * its guided round (`#/guided/<id>`). The addresses the old start screen
 * used (`#/new-topic`, `#/guided`) open the create screen with their answers
 * chosen, so a bookmark still lands somewhere sensible.
 */
type Preset = 'none' | 'topic' | 'guided'
const route = reactive<{ kind: 'welcome' | 'packs' | 'create' | 'draft' | 'guided'; preset: Preset; missing: boolean; draftId: string }>({ kind: 'welcome', preset: 'none', missing: false, draftId: '' })

const PAGES: Record<string, { kind: 'packs' | 'create'; preset: Preset }> = {
  '#/packs': { kind: 'packs', preset: 'none' },
  '#/new': { kind: 'create', preset: 'none' },
  '#/new-topic': { kind: 'create', preset: 'topic' },
  '#/guided': { kind: 'create', preset: 'guided' },
}
const CREATE_PRESETS: Record<Preset, { about?: DraftKind; how?: 'guided' }> = { none: {}, topic: { about: 'new_topic' }, guided: { how: 'guided' } }

/** A pack just made or picked up: its guided round when it's in one, else the workspace. */
function openDraftAt(id: string, guided: boolean) {
  go(guided ? `#/guided/${id}` : `#/draft/${id}`)
}

async function follow() {
  const match = window.location.hash.match(/^#\/(draft|guided)\/([\w-]+)$/)
  if (match) {
    route.kind = match[1] as 'draft' | 'guided'
    route.draftId = match[2]
    route.missing = !(await openDraft(match[2]))
  } else if (PAGES[window.location.hash]) {
    await closeDraft()
    route.kind = PAGES[window.location.hash].kind
    route.preset = PAGES[window.location.hash].preset
    route.missing = false
  } else {
    await closeDraft()
    route.kind = 'welcome'
    route.missing = false
  }
  // The new page's main, once it's drawn: focusing first would land on the old one, and then nowhere
  await nextTick()
  document.getElementById('main')?.focus()
}

function go(hash: string) {
  if (window.location.hash === hash) void follow()
  else window.location.hash = hash
}

onMounted(async () => {
  await initStudio()
  window.addEventListener('hashchange', follow)
  await follow()
})
onBeforeUnmount(() => window.removeEventListener('hashchange', follow))
</script>

<style>
#app {
  height: 100dvh;
  display: flex;
  flex-direction: column;
}

.route {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.missing {
  margin: 3rem auto;
  padding: 0 1.5rem;
}
</style>
