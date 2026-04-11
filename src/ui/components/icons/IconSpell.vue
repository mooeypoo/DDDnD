<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Outer arcane ring -->
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="0.8" fill="none" opacity="0.45" />
    <!-- Inner binding circle -->
    <circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1" fill="none" />
    <!-- Cardinal rune spokes -->
    <line x1="10" y1="1.5" x2="10" y2="6" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
    <line x1="18.5" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
    <line x1="10" y1="18.5" x2="10" y2="14" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
    <line x1="1.5" y1="10" x2="6" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
    <!-- Diagonal sigil marks -->
    <line x1="3.1" y1="3.1" x2="5.2" y2="5.2" stroke="currentColor" stroke-width="0.8" opacity="0.65" stroke-linecap="round" />
    <line x1="16.9" y1="3.1" x2="14.8" y2="5.2" stroke="currentColor" stroke-width="0.8" opacity="0.65" stroke-linecap="round" />
    <line x1="3.1" y1="16.9" x2="5.2" y2="14.8" stroke="currentColor" stroke-width="0.8" opacity="0.65" stroke-linecap="round" />
    <line x1="16.9" y1="16.9" x2="14.8" y2="14.8" stroke="currentColor" stroke-width="0.8" opacity="0.65" stroke-linecap="round" />
    <!-- Center node -->
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>
