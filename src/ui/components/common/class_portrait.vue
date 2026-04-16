<template>
  <div
    class="class-portrait"
    :class="[sizeClass, { 'has-artwork': portraitUrl }]"
    :style="borderStyle"
    role="img"
    :aria-label="alt"
  >
    <img
      v-if="portraitUrl"
      :src="portraitUrl"
      alt=""
      class="portrait-img"
      loading="lazy"
    />
    <span v-else class="portrait-fallback">
      {{ fallbackInitial }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getClassPortraitUrl, getClassAccentColor } from '@/ui/composables/class_artwork'

const props = withDefaults(defineProps<{
  classId?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

const portraitUrl = computed(() => getClassPortraitUrl(props.classId))
const accentColor = computed(() => getClassAccentColor(props.classId))

const sizeClass = computed(() => `portrait-${props.size}`)
const alt = computed(() => props.className ? `${props.className} portrait` : 'Class portrait')

const fallbackInitial = computed(() =>
  props.className ? props.className.charAt(0) : '?'
)

const borderStyle = computed(() => ({
  '--portrait-accent': accentColor.value,
}))
</script>

<style scoped>
.class-portrait {
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(15, 18, 30, 0.9) 0%, rgba(25, 32, 49, 0.9) 100%);
  border: 2px solid var(--portrait-accent, #a989fa);
  box-shadow: 0 0 12px color-mix(in srgb, var(--portrait-accent, #a989fa) 30%, transparent);
  flex-shrink: 0;
}

.portrait-sm {
  width: 36px;
  height: 36px;
}

.portrait-md {
  width: 64px;
  height: 64px;
}

.portrait-lg {
  width: 96px;
  height: 96px;
}

.portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.portrait-fallback {
  font-size: 1.5em;
  font-weight: 800;
  color: var(--portrait-accent, #a989fa);
  opacity: 0.7;
}

.portrait-sm .portrait-fallback {
  font-size: 0.875rem;
}

.portrait-lg .portrait-fallback {
  font-size: 2rem;
}
</style>
