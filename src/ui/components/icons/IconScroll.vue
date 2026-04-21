<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Rolled scroll — top and bottom cylinder lips -->
    <rect x="3" y="4" width="14" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <!-- Top roll lip -->
    <ellipse cx="10" cy="4" rx="7" ry="1.8" stroke="currentColor" stroke-width="1.3" fill="none"/>
    <!-- Bottom roll lip -->
    <ellipse cx="10" cy="16" rx="7" ry="1.8" stroke="currentColor" stroke-width="1.3" fill="none"/>
    <!-- Text lines on scroll body -->
    <line x1="6" y1="8.5" x2="14" y2="8.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.7"/>
    <line x1="6" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.7"/>
    <line x1="6" y1="13.5" x2="11" y2="13.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  </svg>
</template>

<script setup lang="ts">
/**
 * Scroll icon primitive for briefing/tutorial and lore-style labels.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>
