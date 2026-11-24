<template>
  <!--
    Display settings behind one button (docs/PACK_STUDIO.md §10). A
    disclosure with a radio group: arrow keys move between sizes, Escape or a
    click outside closes it and returns focus to the button.
  -->
  <div ref="root" class="display-menu" @keydown.escape.stop="close(true)">
    <button
      ref="toggle"
      type="button"
      class="display-toggle"
      :aria-expanded="open"
      aria-controls="display-settings"
      aria-label="Display settings"
      @click="open ? close(false) : show()"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 19 8 5l5 14" />
        <path d="M4.8 14h6.4" />
        <path d="M14.5 19l3.5-9 3.5 9" />
        <path d="M15.6 16h4.8" />
      </svg>
      <span class="display-toggle-label">Display</span>
    </button>

    <div v-if="open" id="display-settings" ref="panel" class="display-panel">
      <fieldset class="size-group">
        <legend class="size-legend">Text size</legend>
        <label v-for="option in options" :key="option.size" class="size-option">
          <input
            type="radio"
            name="studio-text-size"
            :value="option.size"
            :checked="option.size === textSize"
            @change="$emit('update:textSize', option.size)"
          />
          <span class="size-sample" :class="`sample-${option.size}`" aria-hidden="true">A</span>
          <span>{{ option.label }}</span>
        </label>
      </fieldset>
      <p class="display-hint">Browser zoom works too.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

import type { TextSize } from '@studio/preferences/text_size'

defineProps<{ textSize: TextSize }>()
defineEmits<{ 'update:textSize': [size: TextSize] }>()

const options: Array<{ size: TextSize; label: string }> = [
  { size: 'standard', label: 'Standard' },
  { size: 'large', label: 'Large' },
  { size: 'largest', label: 'Largest' },
]

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)

function onOutside(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) close(false)
}

async function show() {
  open.value = true
  document.addEventListener('pointerdown', onOutside)
  await nextTick()
  panel.value?.querySelector<HTMLInputElement>('input:checked')?.focus()
}

function close(returnFocus: boolean) {
  if (!open.value) return
  open.value = false
  document.removeEventListener('pointerdown', onOutside)
  if (returnFocus) toggle.value?.focus()
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<style scoped>
.display-menu {
  position: relative;
}

.display-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--forge-hairline-strong);
  background: transparent;
  color: var(--forge-gold);
  font-family: var(--forge-font-body);
  font-size: 0.875rem;
  cursor: pointer;
}

.display-toggle[aria-expanded='true'] {
  background: var(--forge-panel);
  color: var(--forge-text-bright);
}

.display-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 20;
  min-width: 13rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-panel);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45);
}

.size-group {
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.size-legend {
  margin-bottom: 0.4rem;
  padding: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.size-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.5rem;
  padding: 0 0.5rem;
  border-radius: 0.5rem;
  color: var(--forge-text);
  cursor: pointer;
}

.size-option:has(input:checked) {
  background: rgba(212, 184, 96, 0.12);
  color: var(--forge-text-bright);
}

.size-option input {
  accent-color: var(--forge-gold);
  margin: 0;
}

.size-sample {
  width: 1.5rem;
  text-align: center;
  color: var(--forge-gold);
}

.sample-standard { font-size: 0.875rem; }
.sample-large { font-size: 1.0625rem; }
.sample-largest { font-size: 1.3125rem; }

.display-hint {
  margin: 0.6rem 0 0;
  font-size: 0.75rem;
  color: var(--forge-text-secondary);
}
</style>
