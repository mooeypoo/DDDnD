<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Bound book spine -->
    <path
      d="M5 3.2 H15.2 C16.1 3.2 16.7 3.8 16.7 4.6 V16.2 C16.7 17 16.1 17.6 15.2 17.6 H5"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linejoin="round"
    />
    <!-- Spine board -->
    <path
      d="M5 3.2 C3.9 3.2 3.3 4 3.3 5.1 V15.8 C3.3 16.9 3.9 17.6 5 17.6"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
    />
    <!-- Cover clasp -->
    <circle cx="12.4" cy="10.4" r="2.15" stroke="currentColor" stroke-width="1.1" />
    <circle cx="12.4" cy="10.4" r="0.7" fill="currentColor" />
    <!-- Page edge -->
    <path d="M6.4 5.1 H14.6" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.7" />
    <path d="M6.4 15.6 H14.4" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.45" />
  </svg>
</template>

<script setup lang="ts">
/**
 * Bound grimoire icon for the inspect-only remaining deck.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 18 })
</script>
