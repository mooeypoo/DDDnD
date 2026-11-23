<template>
  <!-- The Forge's mark: an anvil with sparks (docs/PACK_STUDIO.md, D19) -->
  <svg
    class="forge-mark"
    :width="size"
    :height="size"
    viewBox="0 0 34 34"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M9 14h20v4h-7l-1 5 5 3v3H8v-3l5-3-1-5h-2c-3 0-6-1.5-7-3 2-.5 4-1 6-1z" />
    <path d="M19 9V5" />
    <path d="M14 10l-2-3" />
    <path d="M24 10l2-3" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 32 })
</script>

<style scoped>
.forge-mark {
  flex: none;
  color: var(--forge-gold);
}
</style>
