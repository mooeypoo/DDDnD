<template>
  <header class="studio-header">
    <div class="brand">
      <ForgeMark :size="34" />
      <div class="brand-text">
        <span class="brand-name">DDDnD Pack Studio</span>
        <span class="brand-subtitle">The Forge</span>
      </div>
    </div>

    <div class="header-tools">
      <div class="text-size" role="group" aria-label="Text size">
        <span class="text-size-label" aria-hidden="true">Text</span>
        <button
          v-for="option in options"
          :key="option.size"
          type="button"
          class="text-size-option"
          :class="`option-${option.size}`"
          :aria-pressed="textSize === option.size"
          :aria-label="option.label"
          @click="$emit('update:textSize', option.size)"
        >A</button>
      </div>
      <nav class="header-nav" aria-label="Studio">
        <a href="https://mooeypoo.github.io/DDDnD/guide/content-authoring" target="_blank" rel="noopener noreferrer">Author guide</a>
        <a href="https://dddnd.app" target="_blank" rel="noopener noreferrer">Open DDDnD</a>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import ForgeMark from '@studio/components/forge_mark.vue'
import type { TextSize } from '@studio/preferences/text_size'

defineProps<{ textSize: TextSize }>()
defineEmits<{ 'update:textSize': [size: TextSize] }>()

const options: Array<{ size: TextSize; label: string }> = [
  { size: 'standard', label: 'Standard text size' },
  { size: 'large', label: 'Large text size' },
  { size: 'largest', label: 'Largest text size' },
]
</script>

<style scoped>
.studio-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 2.5rem;
  border-bottom: 1px solid var(--forge-hairline);
  background: var(--forge-header);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.brand-name {
  font-family: var(--forge-font-heading);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
  color: var(--forge-text-bright);
}

.brand-subtitle {
  font-family: var(--forge-font-heading);
  font-size: 0.75rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--forge-gold);
}

.header-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
}

.text-size {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem;
  border-radius: 999px;
  border: 1px solid var(--forge-hairline-strong);
}

.text-size-label {
  padding: 0 0.5rem;
  font-size: 0.75rem;
  color: var(--forge-text-secondary);
}

.text-size-option {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--forge-text);
  font-family: var(--forge-font-body);
  cursor: pointer;
}

.option-standard { font-size: 0.8125rem; }
.option-large { font-size: 1rem; }
.option-largest { font-size: 1.1875rem; }

.text-size-option[aria-pressed='true'] {
  background: var(--forge-gold);
  color: var(--forge-ember-ink);
  font-weight: 600;
}

.header-nav {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
}

.header-nav a {
  text-decoration: none;
}
</style>
