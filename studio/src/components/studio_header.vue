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
      <DisplayMenu :textSize="textSize" @update:textSize="$emit('update:textSize', $event)" />
      <nav class="header-nav" aria-label="Studio">
        <a href="https://mooeypoo.github.io/DDDnD/guide/content-authoring" target="_blank" rel="noopener noreferrer">Author guide</a>
        <a href="https://dddnd.app" target="_blank" rel="noopener noreferrer">Open DDDnD</a>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import DisplayMenu from '@studio/components/display_menu.vue'
import ForgeMark from '@studio/components/forge_mark.vue'
import type { TextSize } from '@studio/preferences/text_size'

defineProps<{ textSize: TextSize }>()
defineEmits<{ 'update:textSize': [size: TextSize] }>()
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

.header-nav {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
}

.header-nav a {
  text-decoration: none;
}
</style>
