<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Sword blades crossing diagonally -->
    <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="17" y1="3" x2="3" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Cross-guards (horizontal bars near hilts) -->
    <line x1="3" y1="5" x2="5" y2="3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="15" y1="3" x2="17" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="3" y1="15" x2="5" y2="17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="15" y1="17" x2="17" y2="15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <!-- Center diamond where blades cross -->
    <rect x="8.5" y="8.5" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>
