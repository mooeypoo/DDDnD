<template>
  <header class="studio-header">
    <!-- The brand goes home: the welcome page (M4.27) -->
    <a class="brand" href="#/" aria-label="DDDnD Pack Studio, The Forge: welcome">
      <ForgeMark :size="34" />
      <span class="brand-text">
        <span class="brand-name">DDDnD Pack Studio</span>
        <span class="brand-subtitle">The Forge</span>
      </span>
    </a>

    <div class="header-tools">
      <DisplayMenu :textSize="textSize" @update:textSize="$emit('update:textSize', $event)" />
      <nav class="header-nav" aria-label="Studio">
        <a href="#/packs">Your packs</a>
        <a :href="LINKS.studioGuide" target="_blank" rel="noopener noreferrer">Guide<span class="visually-hidden"> (opens in a new tab)</span></a>
        <a :href="LINKS.game" target="_blank" rel="noopener noreferrer">Play DDDnD<span class="visually-hidden"> (opens in a new tab)</span></a>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import DisplayMenu from '@studio/components/display_menu.vue'
import ForgeMark from '@studio/components/forge_mark.vue'
import { LINKS } from '@studio/content/links'
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
  text-decoration: none;
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
