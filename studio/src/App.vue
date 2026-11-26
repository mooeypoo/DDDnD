<template>
  <a class="skip-link" href="#main">Skip to the content</a>
  <StudioHeader :textSize="textSize" @update:textSize="setTextSize" />
  <!-- The header stays put; below it, the start screen scrolls as a page and the workspace's columns scroll on their own -->
  <div class="route">
    <WorkspaceView v-if="route.kind === 'draft' && studio.current" @leave="go('#/')" />
    <p v-else-if="route.kind === 'draft' && route.missing" class="missing" role="alert">
      That draft isn't in this browser. <a href="#/">See your drafts</a>.
    </p>
    <NewPackView v-else-if="route.kind === 'new'" @openDraft="(id) => go(`#/draft/${id}`)" @back="go('#/')" />
    <NewTopicView v-else-if="route.kind === 'new-topic'" @openDraft="(id) => go(`#/draft/${id}`)" @back="go('#/')" />
    <StartView v-else-if="route.kind === 'start'" @openDraft="(id) => go(`#/draft/${id}`)" @newPack="go('#/new')" @newTopic="go('#/new-topic')" />
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

/** Where the Studio is: the start screen, choosing a scenario (`#/new`), or one draft (`#/draft/<id>`), so a reload stays put. */
const route = reactive<{ kind: 'start' | 'new' | 'new-topic' | 'draft'; missing: boolean }>({ kind: 'start', missing: false })

async function follow() {
  const match = window.location.hash.match(/^#\/draft\/([\w-]+)$/)
  if (match) {
    route.kind = 'draft'
    route.missing = !(await openDraft(match[1]))
  } else if (window.location.hash === '#/new' || window.location.hash === '#/new-topic') {
    await closeDraft()
    route.kind = window.location.hash === '#/new' ? 'new' : 'new-topic'
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
