<template>
  <!--
    "Import a pack" (M4.8): a pack file or zip becomes a new draft, or the
    author hears every reason it can't. On "Your packs" and on the create
    screen ("Already have a pack file?"), so it's one component.
  -->
  <span class="import">
    <input ref="fileInput" type="file" class="visually-hidden" tabindex="-1" aria-hidden="true" accept=".json,.zip,application/json,application/zip" @change="importFile" />
    <button type="button" :class="link ? 'link-button' : 'button button-quiet'" :disabled="importing" @click="fileInput?.click()">
      <span :class="{ working: importing }">{{ importing ? 'Importing…' : label }}</span>
    </button>
  </span>
  <div v-if="failure" class="note note-warning import-failure" role="alert">
    <strong>{{ failure.name }} couldn't be imported.</strong>
    <ul class="import-problems">
      <li v-for="(problem, index) in failure.problems" :key="index">{{ problem }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { importPack } from '@studio/state/studio_state'

withDefaults(defineProps<{ label?: string; link?: boolean }>(), { label: 'Import a pack', link: false })
const emit = defineEmits<{ imported: [draftId: string] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const failure = ref<{ name: string; problems: string[] } | null>(null)

async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importing.value = true
  failure.value = null
  try {
    const result = await importPack(file)
    if (result.ok) emit('imported', result.draft_id)
    else failure.value = { name: file.name, problems: result.problems }
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.import-failure {
  flex-basis: 100%;
}

.import-problems {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}
</style>
