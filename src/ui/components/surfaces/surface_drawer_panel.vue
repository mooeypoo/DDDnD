<template>
  <section class="surface-drawer" :class="{ open: isOpen }">
    <button
      class="drawer-handle"
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="drawerId"
      @click="emit('toggle')"
    >
      <span class="handle-title">{{ title }}</span>
      <span class="handle-hint">{{ isOpen ? 'Close' : 'Open' }}</span>
    </button>

    <div class="drawer-body" :id="drawerId" role="region" :aria-label="title">
      <div class="drawer-content">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="drawer-footer">
        <slot name="footer" />
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
  title: string
}>()

const emit = defineEmits<{
  toggle: []
}>()

const drawerId = computed(() => `surface-drawer-${props.title.toLowerCase().replace(/\s+/g, '-')}`)
</script>

<style scoped>
.surface-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-drawer);
  display: flex;
  flex-direction: column;
  max-height: 72vh;
  transform: translateY(calc(100% - var(--drawer-handle-height, 54px)));
  transition: transform var(--duration-slow) var(--ease-standard);
}

.surface-drawer.open {
  transform: translateY(0);
}

.drawer-handle {
  min-height: var(--drawer-handle-height, 54px);
  width: 100%;
  border: 1px solid var(--border-panel);
  border-bottom: none;
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  background: var(--surface-card);
  color: var(--text-bright);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-lg);
  cursor: pointer;
}

.handle-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.handle-hint {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.drawer-body {
  background: var(--surface-panel);
  border: 1px solid var(--border-panel);
  border-top: none;
  overflow: auto;
}

.drawer-content {
  padding: var(--space-lg);
}

.drawer-footer {
  border-top: 1px solid var(--border-subtle);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}
</style>
