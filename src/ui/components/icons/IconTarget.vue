<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Outer ring -->
    <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
    <!-- Middle ring -->
    <circle cx="10" cy="10" r="5" stroke="currentColor" stroke-width="1.2" opacity="0.75"/>
    <!-- Bullseye dot -->
    <circle cx="10" cy="10" r="2" fill="currentColor"/>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>
