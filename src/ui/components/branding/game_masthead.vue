<template>
  <!--
    GameMasthead — top navigation bar in dungeon design vocabulary.

    Visual anatomy (left → right):
      • GameLogo (size="small")
      • Thin vertical bronze divider line
      • Nav AppButtons: Rules / About / Dungeon Master / Reset Run

    Bottom edge treatment:
      • 2px bronze gradient seam (::after pseudo-element)

    Corner ornaments:
      • L-bracket spans at bottom-left and bottom-right
        (matching the dungeon card bracket vocabulary)

    Reset confirmation uses SurfaceModalPanel (not an inline overlay).
    Emits Vue 'reset-run' event directly — NOT via window.dispatchEvent.
  -->
  <header class="game-masthead">
    <!-- BL / BR corner bracket ornaments (bottom edge only) -->
    <span class="masthead-bracket masthead-bracket--bl" aria-hidden="true"/>
    <span class="masthead-bracket masthead-bracket--br" aria-hidden="true"/>

    <div class="masthead-left">
      <GameLogo size="small"/>
    </div>

    <!-- Vertical bronze divider between logo and nav -->
    <span class="masthead-divider" aria-hidden="true"/>

    <nav class="masthead-nav" aria-label="Game navigation">
      <AppButton
        variant="subtle"
        aria-label="Show game rules"
        @click="$emit('show-rules')"
      >
        <span class="nav-label">Rules</span>
      </AppButton>

      <AppButton
        variant="subtle"
        aria-label="About this game"
        @click="$emit('show-about')"
      >
        <span class="nav-label">About</span>
      </AppButton>

      <AppButton
        variant="subtle"
        aria-label="Dungeon Master social links"
        @click="$emit('show-dungeon-master')"
      >
        <span class="nav-label">Dungeon&nbsp;Master</span>
      </AppButton>

      <AppButton
        variant="warning"
        aria-label="Reset and start a new run"
        @click="handleResetClick"
      >
        <span class="nav-label">Reset&nbsp;Run</span>
      </AppButton>
    </nav>

    <!-- Reset confirmation modal -->
    <SurfaceModalPanel
      :is-open="showResetConfirmation"
      title="Reset Current Run?"
      subtitle="Your progress will be lost and you'll return to scenario selection."
      size="sm"
      @close="cancelReset"
    >
      <template #footer>
        <AppButton variant="subtle" @click="cancelReset">Cancel</AppButton>
        <AppButton variant="warning" @click="confirmReset">Reset Run</AppButton>
      </template>
    </SurfaceModalPanel>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GameLogo from './game_logo.vue'
import AppButton from '@/ui/components/common/AppButton.vue'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'

const emit = defineEmits<{
  'show-rules':         []
  'show-about':         []
  'show-dungeon-master': []
  'reset-run':          []
}>()

const showResetConfirmation = ref(false)

function handleResetClick() {
  showResetConfirmation.value = true
}

function cancelReset() {
  showResetConfirmation.value = false
}

function confirmReset() {
  showResetConfirmation.value = false
  emit('reset-run')
}
</script>

<style scoped>
/* ─────────────────────────────────────────────────────────────
   Masthead bar
   Background: dark charcoal shell → warm gradient toward bottom.
   Bottom edge: 2px bronze seam via ::after.
───────────────────────────────────────────────────────────── */
.game-masthead {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(
    to bottom,
    #130d06 0%,
    var(--dng-shell-bg, #0d0904) 50%,
    #0b0802 100%
  );
  min-height: 60px;
}

/* Bottom bronze gradient seam */
.game-masthead::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--dng-bronze-hi, #c89824) 15%,
    var(--dng-bronze-mid, #a07018) 40%,
    var(--dng-bronze-hi, #c89824) 60%,
    var(--dng-bronze-mid, #a07018) 85%,
    transparent 100%
  );
  pointer-events: none;
}

/* ─────────────────────────────────────────────────────────────
   Corner bracket ornaments (bottom-left / bottom-right)
   CSS L-brackets matching dungeon card corner language.
   bracket-size ≈ 10px, bracket-weight = 2px
───────────────────────────────────────────────────────────── */
.masthead-bracket {
  position: absolute;
  bottom: 8px;
  width: 10px;
  height: 10px;
  pointer-events: none;
}

.masthead-bracket::before,
.masthead-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket, rgba(196, 148, 34, 0.82));
}

/* Horizontal arm */
.masthead-bracket::before {
  bottom: 0;
  height: 2px;
  width: 100%;
}

/* Vertical arm */
.masthead-bracket::after {
  bottom: 0;
  width: 2px;
  height: 100%;
}

.masthead-bracket--bl {
  left: var(--space-lg);
}
.masthead-bracket--bl::after { left: 0; }
.masthead-bracket--bl::before { left: 0; }

.masthead-bracket--br {
  right: var(--space-lg);
}
.masthead-bracket--br::after { right: 0; left: auto; }
.masthead-bracket--br::before { right: 0; left: auto; }

/* ─────────────────────────────────────────────────────────────
   Logo section
───────────────────────────────────────────────────────────── */
.masthead-left {
  flex: 0 0 auto;
}

/* ─────────────────────────────────────────────────────────────
   Vertical divider between logo and nav
───────────────────────────────────────────────────────────── */
.masthead-divider {
  display: block;
  width: 1px;
  align-self: stretch;
  margin: 4px var(--space-md);
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--dng-bronze-hi, #c89824) 20%,
    var(--dng-bronze-mid, #a07018) 55%,
    var(--dng-bronze-hi, #c89824) 80%,
    transparent 100%
  );
  flex-shrink: 0;
}

/* ─────────────────────────────────────────────────────────────
   Nav buttons
───────────────────────────────────────────────────────────── */
.masthead-nav {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
}

/* ── Mobile: hide labels, keep buttons ── */
@media (max-width: 768px) {
  .game-masthead {
    padding: var(--space-xs) var(--space-md);
  }

  .masthead-nav {
    gap: var(--space-xs);
  }

  .nav-label {
    display: none;
  }
}
</style>
