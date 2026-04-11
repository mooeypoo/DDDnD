<template>
  <button
    class="satchel-toggle"
    type="button"
    aria-label="Open action satchel"
    :aria-expanded="false"
    @click="emit('open')"
  >
    <span v-if="totalCards > 0" class="satchel-badge">{{ totalCards }}</span>
    <span v-if="playableCards > 0" class="satchel-playable-hint" aria-hidden="true">
      {{ playableCards }} playable
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  totalCards: number
  playableCards: number
}>()

const emit = defineEmits<{
  open: []
}>()
</script>

<style scoped>
.satchel-toggle {
  position: fixed;
  right: 24px;
  bottom: calc(var(--drawer-handle-height) + 16px);
  z-index: calc(var(--z-drawer) + 2);

  width: 96px;
  height: 96px;

  appearance: none;
  border: none;
  background-color: transparent;
  background-image: url('@/assets/presentation/ui-surfaces/satchel-closed.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center bottom;

  cursor: pointer;
  padding: 0;

  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.65));
  transition: filter var(--transition-fast, 120ms ease), transform var(--transition-fast, 120ms ease);
}

.satchel-toggle:hover {
  background-image: url('@/assets/presentation/ui-surfaces/satchel-closed-hover.png');
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.75));
  transform: translateY(-2px);
}

.satchel-toggle:active {
  transform: translateY(0);
}

/* Card count badge */
.satchel-badge {
  position: absolute;
  top: 6px;
  right: 4px;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  border-radius: var(--radius-full, 9999px);
  background: var(--dng-bronze-mid, #b8860b);
  color: var(--dng-shell-bg, #0e1117);
  font-size: var(--text-2xs, 10px);
  font-weight: var(--font-bold, 700);
  font-family: var(--font-mono, monospace);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

/* Playable hint label */
.satchel-playable-hint {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: rgba(9, 11, 20, 0.88);
  border: 1px solid var(--dng-bronze-mid, #b8860b);
  border-radius: var(--radius-sm, 4px);
  color: var(--dng-title-gold, #c8981e);
  font-size: var(--text-2xs, 10px);
  font-weight: var(--font-semibold, 600);
  letter-spacing: var(--tracking-wide, 0.05em);
  text-transform: uppercase;
  white-space: nowrap;
  padding: 3px 7px;
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity var(--transition-fast, 120ms ease), transform var(--transition-fast, 120ms ease);
}

.satchel-toggle:hover .satchel-playable-hint {
  opacity: 1;
  transform: translateY(0);
}

/* Scale down on mobile — still visible above the handle */
@media (max-width: 768px) {
  .satchel-toggle {
    width: 72px;
    height: 72px;
    right: 16px;
  }
}
</style>
