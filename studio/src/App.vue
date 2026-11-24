<template>
  <a class="skip-link" href="#main">Skip to the content</a>
  <StudioHeader :textSize="textSize" @update:textSize="setTextSize" />
  <StartView />
</template>

<script setup lang="ts">
import { ref } from 'vue'

import StudioHeader from '@studio/components/studio_header.vue'
import StartView from '@studio/views/start_view.vue'
import { applyTextSize, readTextSize, writeTextSize, type TextSize } from '@studio/preferences/text_size'

const textSize = ref<TextSize>(readTextSize())
applyTextSize(textSize.value)

function setTextSize(size: TextSize) {
  textSize.value = size
  applyTextSize(size)
  writeTextSize(size)
}
</script>

<style>
#app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
</style>
