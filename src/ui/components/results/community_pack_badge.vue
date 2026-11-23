<template>
  <!--
    Marks a run played with a community pack, on the results screen and the
    shared card, so it never passes for a DDDnD scenario (journal M2.12).
    Pack text is plain text only (ADR 0014). No pseudo-elements: the result
    card's image export copies computed styles of real elements only.
  -->
  <div class="community-pack-badge" :class="`size-${size}`" :title="title">
    <span class="badge-pill">Community pack</span>
    <span class="badge-name">{{ name }}</span>
    <span class="badge-publisher">by {{ publisher }}</span>
    <span class="badge-note">Not an official DDDnD scenario</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** The pack's name, as the pack states it. */
  name: string
  /** Who published it, as the UI describes them. */
  publisher: string
  /** `page` on the results screen, `card` on the compact share card. */
  size?: 'page' | 'card'
}>(), { size: 'page' })

const title = 'This scenario comes from a community pack, not from DDDnD'
</script>

<style scoped>
.community-pack-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  max-width: 30rem;
  margin: 0.75rem auto 0;
  padding: 0.6rem 1rem 0.55rem;
  border: 1px solid var(--effect-warning-border, rgba(251, 191, 36, 0.3));
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.02) 100%);
  text-align: center;
  overflow-wrap: anywhere;
}

.badge-pill {
  padding: 0.12rem 0.6rem;
  border-radius: 999px;
  background: var(--effect-warning, #fbbf24);
  color: #1a1206;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1.5;
}

.badge-name {
  margin-top: 0.15rem;
  font-family: var(--font-heading, serif);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.25;
  color: var(--text-bright, #edf0f7);
}

.badge-publisher {
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--text-secondary, #b7bdcc);
}

.badge-note {
  margin-top: 0.1rem;
  font-size: 0.66rem;
  font-style: italic;
  letter-spacing: 0.02em;
  color: var(--effect-warning, #fbbf24);
  opacity: 0.8;
}

/* Compact, for the share card */
.size-card {
  margin: 0 1rem 0.75rem;
  padding: 0.45rem 0.75rem 0.4rem;
  gap: 0.12rem;
}

.size-card .badge-pill {
  font-size: 0.56rem;
}

.size-card .badge-name {
  font-size: 0.92rem;
}

.size-card .badge-publisher {
  font-size: 0.7rem;
}

.size-card .badge-note {
  font-size: 0.6rem;
}
</style>
