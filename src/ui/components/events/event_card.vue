<template>
  <article class="dungeon-ec" :class="`severity-${severity}`">
    <div class="dungeon-ec__ring">
      <!-- Bottom-only L-bracket mounts — event card rests, does not anchor -->
      <span class="ec-bracket ec-bracket--bl" aria-hidden="true" />
      <span class="ec-bracket ec-bracket--br" aria-hidden="true" />

      <!-- Header: severity sigil + eyebrow + title -->
      <header class="dungeon-ec__header">
        <!-- Severity Sigil: warning-triangle + ! mark -->
        <svg
          class="ec-sigil"
          viewBox="0 0 40 40"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M20,4 L37,33 L3,33 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linejoin="round"
            opacity="0.72"
          />
          <line x1="20" y1="15" x2="20" y2="25" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity="0.90" />
          <circle cx="20" cy="29.5" r="1.5" fill="currentColor" opacity="0.90" />
        </svg>

        <div class="ec-header-text">
          <span class="ec-eyebrow">{{ severityLabel }} Severity</span>
          <h3 class="ec-title">{{ title }}</h3>
        </div>

        <!-- Optional artwork thumbnail -->
        <div v-if="illustrationUrl || $slots.artwork" class="event-artwork-thumb" aria-hidden="true">
          <img v-if="illustrationUrl" :src="illustrationUrl" alt="" />
          <slot v-else name="artwork" />
        </div>
      </header>

      <!-- Main inset content well -->
      <div class="dungeon-ec__inset">
        <div class="dungeon-ec__body">
          <p class="ec-description">{{ description }}</p>

          <ul v-if="highlights.length" class="ec-highlights">
            <li v-for="(highlight, index) in highlights" :key="index" class="ec-highlight-item">
              {{ highlight }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    highlights?: string[]
    /** Optional scene illustration URL. Rendered above the event title when provided. */
    illustrationUrl?: string
  }>(),
  {
    severity: 'medium',
    highlights: () => []
  }
)

const severityLabel = computed(() => {
  const labels: Record<string, string> = {
    low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical'
  }
  return labels[props.severity ?? 'medium'] ?? 'Medium'
})
</script>

<style scoped>
/* ─────────────────────────────────────────────────────────────
   SEVERITY ACCENT SYSTEM
   --ec-severity-accent drives colored interface layers.
   Bronze ring gradient is unchanged across all severity levels.
   ───────────────────────────────────────────────────────────── */
.dungeon-ec {
  --ec-severity-accent: var(--text-secondary);

  --ec-divider:      color-mix(in srgb, var(--ec-severity-accent) 30%, var(--dng-divider));
  --ec-inset-bloom:  color-mix(in srgb, var(--ec-severity-accent) 14%, var(--dng-inset-bloom));
  --ec-bracket:      color-mix(in srgb, var(--ec-severity-accent) 60%, var(--dng-bracket));
  --ec-panel-border: color-mix(in srgb, var(--ec-severity-accent) 22%, var(--dng-panel-border));
}

.dungeon-ec.severity-low      { --ec-severity-accent: #60a5fa; }
.dungeon-ec.severity-medium   { --ec-severity-accent: #fbbf24; }
.dungeon-ec.severity-high     { --ec-severity-accent: #fb923c; }
.dungeon-ec.severity-critical { --ec-severity-accent: #f87171; }

/* ─────────────────────────────────────────────────────────────
   OUTER SHELL
   ───────────────────────────────────────────────────────────── */
.dungeon-ec {
  /* Global --dng-title-gold is tuned for dark charcoal surfaces — override
     here so title text reads dark on the bronze ring face, not gold-on-gold. */
  --dng-title-gold:    #1e1306;  /* deep warm-black — high contrast on bronze */
  --dng-subtitle-warm: #3a2a0a;  /* dark brown — eyebrow/label on bronze */

  --dng-card-chamfer:       6px;
  --dng-card-shell-gap:     2px;
  --dng-card-ring-v:        6px;
  --dng-card-ring-h:        10px;
  --dng-card-inset-chamfer: 4px;
  --dng-card-body-padding:  var(--space-sm);

  position: relative;
  display: block;
  background: var(--dng-shell-bg);
  border: 1px solid var(--dng-shell-border);

  clip-path: polygon(
    var(--dng-card-chamfer)                   0%,
    calc(100% - var(--dng-card-chamfer))       0%,
    100%                                       var(--dng-card-chamfer),
    100%                                       calc(100% - var(--dng-card-chamfer)),
    calc(100% - var(--dng-card-chamfer))       100%,
    var(--dng-card-chamfer)                   100%,
    0%                                         calc(100% - var(--dng-card-chamfer)),
    0%                                         var(--dng-card-chamfer)
  );

  filter:
    drop-shadow(0 8px 24px rgba(0, 0, 0, 0.72))
    drop-shadow(0 2px  6px rgba(0, 0, 0, 0.52));
}

/* ─────────────────────────────────────────────────────────────
   RING — flat 3-stop bronze
   ───────────────────────────────────────────────────────────── */
.dungeon-ec__ring {
  position: relative;
  background: linear-gradient(
    to bottom,
    var(--dng-bronze-hi)  0%,
    var(--dng-bronze-mid) 50%,
    var(--dng-bronze-hi) 100%
  );
  padding:
    var(--dng-card-ring-v)
    var(--dng-card-ring-h)
    var(--dng-card-ring-v);

  display: flex;
  flex-direction: column;
  gap: var(--dng-ring-gap);
}

/* ─────────────────────────────────────────────────────────────
   CORNER BRACKETS — bottom-only
   ───────────────────────────────────────────────────────────── */
.ec-bracket {
  position: absolute;
  width: var(--dng-bracket-size);
  height: var(--dng-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.ec-bracket::before,
.ec-bracket::after {
  content: '';
  position: absolute;
  background: var(--ec-bracket);
}

.ec-bracket::before { height: var(--dng-bracket-weight); width: var(--dng-bracket-size); }
.ec-bracket::after  { width: var(--dng-bracket-weight);  height: var(--dng-bracket-size); }

.ec-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.ec-bracket--bl::before { bottom: 0; left: 0; }
.ec-bracket--bl::after  { bottom: 0; left: 0; }

.ec-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.ec-bracket--br::before { bottom: 0; right: 0; }
.ec-bracket--br::after  { bottom: 0; right: 0; }

/* ─────────────────────────────────────────────────────────────
   HEADER
   ───────────────────────────────────────────────────────────── */
.dungeon-ec__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ec-divider);
}

.ec-sigil {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: var(--ec-severity-accent);
  margin-top: 2px;
}

.ec-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.ec-eyebrow {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--ec-severity-accent);
  line-height: 1;
  opacity: 0.85;
}

.ec-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}

/* Artwork thumbnail — right-side of header row */
.event-artwork-thumb {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--artwork-bg);
  border: 1px solid var(--artwork-border);
  margin-left: auto;
}

.event-artwork-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ─────────────────────────────────────────────────────────────
   INSET
   ───────────────────────────────────────────────────────────── */
.dungeon-ec__inset {
  position: relative;
  background:
    radial-gradient(
      ellipse 60% 25% at 50% 0%,
      var(--ec-inset-bloom) 0%,
      transparent 80%
    ),
    linear-gradient(
      to bottom,
      var(--dng-panel-top)     0%,
      var(--dng-panel-surface) 28%,
      var(--dng-panel-bottom) 100%
    );
  border: 1px solid var(--ec-panel-border);

  clip-path: polygon(
    var(--dng-card-inset-chamfer)              0%,
    calc(100% - var(--dng-card-inset-chamfer)) 0%,
    100%  var(--dng-card-inset-chamfer),
    100%  100%,
    0%    100%,
    0%    var(--dng-card-inset-chamfer)
  );

  box-shadow:
    inset 0 2px 12px rgba(0, 0, 0, 0.68),
    inset 0 0   0  1px rgba(0, 0, 0, 0.18);
}

/* ─────────────────────────────────────────────────────────────
   BODY
   ───────────────────────────────────────────────────────────── */
.dungeon-ec__body {
  padding: var(--dng-card-body-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ec-description {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

/* ─────────────────────────────────────────────────────────────
   HIGHLIGHTS LIST
   ───────────────────────────────────────────────────────────── */
.ec-highlights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ec-highlight-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: 4px var(--space-sm);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  background: rgba(0, 0, 0, 0.18);
  border-left: 2px solid var(--ec-divider);
}
</style>
