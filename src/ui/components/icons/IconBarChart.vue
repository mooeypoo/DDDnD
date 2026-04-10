<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Three vertical bars (tall, medium, short from left to right) -->
    <rect x="2" y="5" width="4" height="13" rx="1" stroke="currentColor" stroke-width="1.4"/>
    <rect x="8" y="8" width="4" height="10" rx="1" stroke="currentColor" stroke-width="1.4"/>
    <rect x="14" y="11" width="4" height="7" rx="1" stroke="currentColor" stroke-width="1.4"/>
    <!-- Base line -->
    <line x1="1" y1="18.5" x2="19" y2="18.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>
