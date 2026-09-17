<template>
  <div class="table-tools">
    <button
      v-if="deckCount > 0"
      class="tool-plaque"
      type="button"
      data-look-grimoire
      @click="$emit('openGrimoire')"
    >
      <span class="tool-kicker">Look, don't play</span>
      <span class="tool-title">Grimoire · {{ deckCount }}</span>
    </button>

    <button
      v-if="historyCount > 0"
      class="tool-plaque"
      type="button"
      @click="$emit('openAnnals')"
    >
      <span class="tool-kicker">Inspect only</span>
      <span class="tool-title">Annals · {{ historyCount }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  deckCount: number
  historyCount: number
}>()

defineEmits<{
  openGrimoire: []
  openAnnals: []
}>()
</script>

<style scoped>
.table-tools {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0 0.4rem;
}

.tool-plaque {
  appearance: none;
  min-width: 0;
  text-align: left;
  padding: 0.4rem 0.7rem 0.45rem;
  border-radius: 12px 4px 12px 4px;
  border: 1px solid rgba(176, 132, 42, 0.38);
  background:
    linear-gradient(180deg, rgba(28, 22, 12, 0.88), rgba(12, 10, 6, 0.88));
  color: var(--text-primary);
  box-shadow: inset 0 1px 0 rgba(232, 196, 96, 0.12);
  cursor: pointer;
}

.tool-plaque:hover {
  border-color: rgba(232, 196, 96, 0.55);
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
  .table-tools {
    justify-content: stretch;
  }

  .tool-plaque {
    flex: 1;
  }

  .tool-title {
    font-size: 0.72rem;
  }
}
</style>
