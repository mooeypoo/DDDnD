<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Back person silhouette (left) -->
    <circle cx="7.5" cy="6.5" r="2.5" stroke="currentColor" stroke-width="1.4" opacity="0.65"/>
    <path d="M3 17 C3 13.5 5 12 7.5 12 S12 13.5 12 17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.65"/>
    <!-- Front person silhouette (right) -->
    <circle cx="13" cy="6" r="2.8" stroke="currentColor" stroke-width="1.5"/>
    <path d="M7.5 17 C7.5 13 10 11.5 13 11.5 S18.5 13 18.5 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>
