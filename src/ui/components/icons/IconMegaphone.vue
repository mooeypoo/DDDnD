<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Megaphone body -->
    <path
      d="M3 8v4h3l5 4V4L6 8H3z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <!-- Sound waves -->
    <path d="M14 7.5 C15.5 8.5 15.5 11.5 14 12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M15.5 5.5 C18 7 18 13 15.5 14.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 20 })
</script>
