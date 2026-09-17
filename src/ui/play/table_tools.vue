<template>
  <div class="table-tools">
    <button
      v-if="canConsult"
      class="tool-plaque"
      type="button"
      :class="{ armed: consultMode }"
      :disabled="disabled"
      @click="$emit('toggleConsult')"
    >
      <span class="tool-kicker">{{ consultMode ? 'Searching' : 'Spend a turn' }}</span>
      <span class="tool-title">{{ consultMode ? 'Cancel search' : 'Consult the Archives' }}</span>
    </button>

    <button
      v-if="deckCount > 0"
      class="tool-plaque tool-grimoire"
      type="button"
      :disabled="disabled"
      @click="$emit('openGrimoire')"
    >
      <span class="tool-kicker">Inspect only</span>
      <span class="tool-title">Grimoire · {{ deckCount }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canConsult: boolean
  consultMode: boolean
  deckCount: number
  disabled?: boolean
}>()

defineEmits<{
  toggleConsult: []
  openGrimoire: []
}>()
</script>

<style scoped>
.table-tools {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0 0.4rem;
}

.tool-plaque {
  appearance: none;
  min-width: 0;
  flex: 1;
  text-align: left;
  padding: 0.45rem 0.7rem 0.5rem;
  border-radius: 4px 12px 4px 12px;
  border: 1px solid rgba(176, 132, 42, 0.45);
  background:
    linear-gradient(180deg, rgba(42, 30, 12, 0.92), rgba(16, 12, 6, 0.92));
  color: var(--text-primary);
  box-shadow: inset 0 1px 0 rgba(232, 196, 96, 0.18);
  cursor: pointer;
}

.tool-plaque:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.tool-plaque.armed {
  border-color: rgba(240, 208, 96, 0.7);
  box-shadow: 0 0 0 1px rgba(240, 208, 96, 0.25);
}

.tool-grimoire {
  border-radius: 12px 4px 12px 4px;
}

.tool-kicker {
  display: block;
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.tool-title {
  display: block;
  font-family: var(--font-heading);
  font-size: 0.82rem;
  color: var(--dng-title-gold);
}

@media (max-width: 720px) {
  .tool-title {
    font-size: 0.72rem;
  }
}
</style>
