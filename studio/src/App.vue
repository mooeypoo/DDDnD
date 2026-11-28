<template>
  <a class="skip-link" href="#main">Skip to the content</a>
  <StudioHeader :textSize="textSize" @update:textSize="setTextSize" />
  <!-- The header stays put; below it, the start screen scrolls as a page and the workspace's columns scroll on their own -->
  <div class="route">
    <WorkspaceView
      v-if="(route.kind === 'draft' || route.kind === 'guided') && studio.current"
      :guided="route.kind === 'guided'"
      @leave="go('#/')"
      @leaveRound="go(`#/draft/${route.draftId}`)"
      @resumeRound="go(`#/guided/${route.draftId}`)"
    />
    <p v-else-if="(route.kind === 'draft' || route.kind === 'guided') && route.missing" class="missing" role="alert">
      That draft isn't in this browser. <a href="#/">See your drafts</a>.
    </p>
    <NewPackView v-else-if="route.kind === 'new'" @openDraft="(id) => go(`#/draft/${id}`)" @back="go('#/')" />
    <NewPackView v-else-if="route.kind === 'guided-start'" guided @openDraft="(id) => go(`#/guided/${id}`)" @newTopic="go('#/new-topic')" @back="go('#/')" />
    <NewTopicView v-else-if="route.kind === 'new-topic'" @openDraft="(id, guided) => go(guided ? `#/guided/${id}` : `#/draft/${id}`)" @back="go('#/')" />
    <StartView v-else-if="route.kind === 'start'" @openDraft="(id) => go(`#/draft/${id}`)" @newPack="go('#/new')" @newTopic="go('#/new-topic')" @guidedRound="go('#/guided')" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import StudioHeader from '@studio/components/studio_header.vue'
import NewPackView from '@studio/views/new_pack_view.vue'
import NewTopicView from '@studio/views/new_topic_view.vue'
import StartView from '@studio/views/start_view.vue'
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
 * Where the Studio is, so a reload stays put: the start screen, choosing a
 * scenario (`#/new`), starting a topic (`#/new-topic`), one draft
 * (`#/draft/<id>`), or the guided round (`#/guided` to choose its scenario,
 * `#/guided/<id>` for its draft).
 */
const route = reactive<{ kind: 'start' | 'new' | 'new-topic' | 'guided-start' | 'draft' | 'guided'; missing: boolean; draftId: string }>({ kind: 'start', missing: false, draftId: '' })

const STARTS: Record<string, 'new' | 'new-topic' | 'guided-start'> = { '#/new': 'new', '#/new-topic': 'new-topic', '#/guided': 'guided-start' }

async function follow() {
  const match = window.location.hash.match(/^#\/(draft|guided)\/([\w-]+)$/)
  if (match) {
    route.kind = match[1] as 'draft' | 'guided'
    route.draftId = match[2]
    route.missing = !(await openDraft(match[2]))
  } else if (STARTS[window.location.hash]) {
    await closeDraft()
    route.kind = STARTS[window.location.hash]
    route.missing = false
  } else {
    await closeDraft()
    route.kind = 'start'
    route.missing = false
  }
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
