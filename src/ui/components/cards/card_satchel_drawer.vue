<template>
  <div class="satchel-drawer">
    <!-- Backdrop overlay — click anywhere to close -->
    <Transition name="drawer-backdrop">
      <div v-if="isOpen" class="drawer-backdrop" @click="close"></div>
    </Transition>

    <!-- Drawer panel: always rendered, slid off-screen when closed -->
    <div class="drawer-panel" :class="{ open: isOpen }">
      <!-- Handle bar: always visible at bottom -->
      <button
        class="drawer-handle"
        type="button"
        :aria-expanded="isOpen"
        aria-controls="satchel-content"
        @click="toggle"
      >
        <div class="handle-grip" aria-hidden="true"></div>
        <div class="handle-content">
          <span class="handle-icon">🎒</span>
          <span class="handle-label">Action Satchel</span>
          <span class="handle-count" v-if="totalCards > 0">{{ totalCards }}</span>
          <span class="handle-hint" v-if="!isOpen && playableCards > 0">{{ playableCards }} playable — tap to open</span>
          <span class="handle-hint" v-if="isOpen">tap to close</span>
        </div>
        <span class="handle-chevron" :class="{ flipped: isOpen }">▲</span>
      </button>

      <!-- Drawer body: scrollable content area -->
      <div id="satchel-content" class="drawer-body" role="region" aria-label="Action cards">
        <div class="drawer-inner">
          <p class="drawer-hint">Review your available scrolls of architecture and choose your next move.</p>

          <div class="cards-grid">
            <slot></slot>
          </div>

          <p v-if="totalCards === 0" class="drawer-empty">
            No action cards are currently available.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  totalCards: number
  playableCards: number
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

function toggle() {
  emit('update:isOpen', !props.isOpen)
}

function close() {
  emit('update:isOpen', false)
}
</script>

<style scoped>
/*
  Drawer uses transform: translateY() for the slide animation.
  The panel is always full-height; when closed it's pushed down
  so only the handle peeks above the viewport bottom.
  This keeps a fixed layout so overflow-y scroll always works.
*/

.satchel-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-drawer);
  pointer-events: none;
}

/* Backdrop */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: var(--surface-overlay);
  z-index: var(--z-drawer);
  pointer-events: auto;
}

/* The sliding panel */
.drawer-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: calc(var(--z-drawer) + 1);
  pointer-events: auto;

  display: flex;
  flex-direction: column;
  height: var(--drawer-max-height);

  /* Closed: push down so only the handle is visible */
  transform: translateY(calc(100% - var(--drawer-handle-height)));
  transition: transform var(--duration-slow) var(--ease-standard);
}

.drawer-panel.open {
  transform: translateY(0);
}

/* Handle */
.drawer-handle {
  appearance: none;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(180deg, rgba(40, 50, 80, 0.97) 0%, rgba(22, 30, 52, 0.97) 100%);
  border: none;
  border-top: 1px solid rgba(169, 137, 250, 0.35);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  cursor: pointer;
  font-family: inherit;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  flex-shrink: 0;
  min-height: var(--drawer-handle-height);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.drawer-handle:hover {
  background: linear-gradient(180deg, rgba(50, 62, 95, 0.97) 0%, rgba(28, 38, 64, 0.97) 100%);
  border-top-color: rgba(169, 137, 250, 0.5);
}

.handle-grip {
  display: none;
}

@media (max-width: 768px) {
  .handle-grip {
    display: block;
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--border-panel);
  }

  .drawer-handle {
    padding-top: var(--space-md);
  }
}

.handle-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
}

.handle-icon {
  font-size: var(--text-xl);
}

.handle-label {
  color: var(--text-bright);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.handle-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--border-accent);
  color: var(--text-bright);
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  min-width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  padding: 0 6px;
}

.handle-hint {
  color: var(--text-muted);
  font-size: var(--text-xs);
  margin-left: auto;
}

.handle-chevron {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  transition: transform var(--duration-base) var(--ease-standard);
}

.handle-chevron.flipped {
  transform: rotate(180deg);
}

/* Drawer body — always in DOM, scrollable */
.drawer-body {
  background: var(--drawer-bg);
  border-top: 1px solid var(--border-subtle);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.drawer-inner {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.drawer-hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-style: italic;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-lg);
}

@media (max-width: 480px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}

.drawer-empty {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: center;
  padding: var(--space-xl) 0;
}

/* Backdrop transitions */
.drawer-backdrop-enter-active {
  transition: opacity var(--duration-base) var(--ease-decelerate);
}
.drawer-backdrop-leave-active {
  transition: opacity var(--duration-fast) var(--ease-accelerate);
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}
</style>
