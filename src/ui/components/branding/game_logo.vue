<template>
  <div class="dungeon-logo" :class="sizeClass">
    <LogoSigil :size="sigilSize" />

    <!-- Thin bronze vertical divider -->
    <span class="dungeon-logo__divider" aria-hidden="true" />

    <!-- Text lock-up -->
    <div class="dungeon-logo__text">
      <div class="dungeon-logo__title">DDDnD</div>
      <div class="dungeon-logo__subtitle">Domain-Driven Design n' Dragons</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LogoSigil from './logo_sigil.vue'

const props = withDefaults(
  defineProps<{ size?: 'small' | 'medium' | 'large' }>(),
  { size: 'medium' }
)

const sizeClass  = computed(() => `size-${props.size}`)
const sigilSize  = computed(() => props.size)
</script>

<style scoped>
/* ── Base layout ── */
.dungeon-logo {
  display: inline-flex;
  align-items: center;
}

/* ── Bronze vertical divider ── */
.dungeon-logo__divider {
  display: block;
  width: 1px;
  align-self: stretch;
  margin: 4px var(--space-md);
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--dng-bronze-hi) 20%,
    var(--dng-bronze-mid) 55%,
    var(--dng-bronze-hi) 80%,
    transparent 100%
  );
  flex-shrink: 0;
}

/* ── Text stack ── */
.dungeon-logo__text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dungeon-logo__title {
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  color: var(--dng-title-gold, #d4b860);
  letter-spacing: var(--tracking-widest);
  line-height: var(--leading-none);
  text-transform: uppercase;
}

.dungeon-logo__subtitle {
  font-family: var(--font-body);
  font-weight: var(--font-normal);
  color: var(--dng-subtitle-warm, #7a6c44);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-wide);
}

/* ── Size variants ── */
.dungeon-logo.size-small .dungeon-logo__title    { font-size: var(--text-base); }
.dungeon-logo.size-small .dungeon-logo__subtitle { font-size: var(--text-2xs); }
.dungeon-logo.size-small .dungeon-logo__divider  { margin: 4px var(--space-sm); }

.dungeon-logo.size-medium .dungeon-logo__title    { font-size: var(--text-2xl); }
.dungeon-logo.size-medium .dungeon-logo__subtitle { font-size: var(--text-xs); }

.dungeon-logo.size-large .dungeon-logo__title    { font-size: var(--text-4xl); }
.dungeon-logo.size-large .dungeon-logo__subtitle { font-size: var(--text-sm); }

/* ── Mobile ── */
@media (max-width: 640px) {
  .dungeon-logo.size-medium .dungeon-logo__title    { font-size: var(--text-xl); }
  .dungeon-logo.size-medium .dungeon-logo__subtitle { font-size: var(--text-2xs); }

  .dungeon-logo.size-large .dungeon-logo__title    { font-size: var(--text-3xl); }
  .dungeon-logo.size-large .dungeon-logo__subtitle { font-size: var(--text-xs); }
}
</style>
