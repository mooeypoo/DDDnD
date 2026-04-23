<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Bag body -->
    <path
      d="M4 9 C4 8 4.5 7.5 5.5 7.5 L14.5 7.5 C15.5 7.5 16 8 16 9 L15 16 C14.8 16.8 14.2 17.5 13 17.5 L7 17.5 C5.8 17.5 5.2 16.8 5 16 Z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <!-- Flap -->
    <path
      d="M5.5 7.5 C5.5 5 6.5 3.5 10 3.5 C13.5 3.5 14.5 5 14.5 7.5"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Strap buckle suggestion -->
    <line x1="8" y1="7.5" x2="12" y2="7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Center clasp -->
    <rect x="9" y="11.5" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.7"/>
  </svg>
</template>

<script setup lang="ts">
/**
 * Satchel icon primitive for card inventory and drawer controls.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>
