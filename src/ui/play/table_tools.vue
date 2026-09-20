<template>
  <div class="table-tools">
    <span data-refill-origin class="refill-origin" aria-hidden="true" />
    <button
      v-if="deckCount > 0"
      class="tool-plaque"
      type="button"
      data-look-grimoire
      @click="$emit('openGrimoire')"
    >
      <span class="tool-kicker">Look, don't play</span>
      <span class="tool-title">
        <IconGrimoire :size="16" />
        Grimoire · {{ deckCount }}
      </span>
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
import IconGrimoire from '@/ui/components/icons/IconGrimoire.vue'

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
  position: relative;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0 0.4rem;
}

.refill-origin {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  width: 2.4rem;
  height: 2.4rem;
  pointer-events: none;
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
  font-size: var(--text-kicker);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.tool-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-heading);
  font-size: var(--text-base);
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
    font-size: var(--text-base);
  }
}
</style>
