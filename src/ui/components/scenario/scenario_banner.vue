<template>
  <article
    class="scenario-board"
    :class="{ 'has-artwork': heroUrl }"
    :aria-label="`Scenario: ${title}`"
  >
    <div class="scenario-board__ring">

      <!-- Corner L-bracket mounts -->
      <span class="sb-bracket sb-bracket--tl" aria-hidden="true" />
      <span class="sb-bracket sb-bracket--tr" aria-hidden="true" />
      <span class="sb-bracket sb-bracket--bl" aria-hidden="true" />
      <span class="sb-bracket sb-bracket--br" aria-hidden="true" />

      <!-- Split-plate header: [mission crest + title] [bronze pillar] [turn counter] -->
      <div class="scenario-board__header">

        <!-- Left: mission crest SVG + scenario title zone -->
        <div class="header-mission">
          <!-- Mission crest: architectural targeting reticle / compass bearing marker -->
          <svg
            class="mission-crest"
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <!-- Outer octagonal frame (echoes component clip-path shape) -->
            <polygon
              points="13,2 27,2 38,13 38,27 27,38 13,38 2,27 2,13"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              opacity="0.70"
            />
            <!-- Inscribed diamond — cardinal compass indicator -->
            <path
              d="M20,8 L32,20 L20,32 L8,20 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="0.9"
              opacity="0.40"
            />
            <!-- Crosshair axes — coordinate reference lines -->
            <line x1="20" y1="2"  x2="20" y2="14" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
            <line x1="20" y1="26" x2="20" y2="38" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
            <line x1="2"  y1="20" x2="14" y2="20" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
            <line x1="26" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
            <!-- Cardinal tick marks — thick, short, at octagon boundary -->
            <line x1="20" y1="2"  x2="20" y2="6"  stroke="currentColor" stroke-width="2.2" opacity="0.90" stroke-linecap="round" />
            <line x1="20" y1="34" x2="20" y2="38" stroke="currentColor" stroke-width="2.2" opacity="0.90" stroke-linecap="round" />
            <line x1="2"  y1="20" x2="6"  y2="20" stroke="currentColor" stroke-width="2.2" opacity="0.90" stroke-linecap="round" />
            <line x1="34" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="2.2" opacity="0.90" stroke-linecap="round" />
            <!-- Center targeting ring -->
            <circle cx="20" cy="20" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.88" />
            <!-- Center lock-point dot -->
            <circle cx="20" cy="20" r="2.2" fill="currentColor" opacity="0.96" />
          </svg>

          <div class="mission-text">
            <span class="mission-eyebrow">Scenario</span>
            <h1 class="mission-title">{{ title }}</h1>
          </div>
        </div>

        <!-- Bronze vertical pillar column — structural divider between zones -->
        <div class="header-pillar" aria-hidden="true" />

        <!-- Right: mechanical turn counter -->
        <div class="header-turns">
          <span class="turns-label">Turn</span>
          <span class="turns-current">{{ paddedTurn }}</span>
          <div class="turns-denom">
            <span class="turns-of">of</span>
            <span class="turns-total">{{ maxTurns }}</span>
          </div>
        </div>

      </div>

      <!-- Main inset panel -->
      <div class="scenario-board__inset">

        <!-- Optional hero artwork strip (collapses when heroUrl absent) -->
        <div v-if="heroUrl" class="inset-artwork" aria-hidden="true">
          <img :src="heroUrl" alt="" class="inset-artwork__img" />
          <div class="inset-artwork__vignette" />
        </div>

        <div class="scenario-board__body">

          <!-- Campaign progress ribbon — amber fill bar, decorative temporal marker -->
          <div class="mission-ribbon" aria-hidden="true">
            <div
              class="mission-ribbon__fill"
              :style="{ width: `${turnProgress}%` }"
            />
          </div>

          <p class="mission-summary">{{ shortDescription }}</p>

          <template v-if="description">
            <button
              class="expand-btn"
              type="button"
              :aria-expanded="isExpanded"
              @click="isExpanded = !isExpanded"
            >
              <span class="expand-btn__chevron" :class="{ 'is-open': isExpanded }">▸</span>
              {{ isExpanded ? 'Hide briefing' : 'Full briefing' }}
            </button>
            <p v-if="isExpanded" class="mission-description">{{ description }}</p>
          </template>

        </div>
      </div>

    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  title: string
  shortDescription: string
  description?: string
  currentTurn: number
  maxTurns: number
  /** Optional hero illustration URL. Renders as a fixed-height bleed at top of inset. */
  heroUrl?: string
}>()

const isExpanded = ref(false)

const paddedTurn = computed(() => String(props.currentTurn).padStart(2, '0'))

const turnProgress = computed(() =>
  props.maxTurns > 0
    ? Math.min(100, Math.round((props.currentTurn / props.maxTurns) * 100))
    : 0
)
</script>

<style scoped>
/* ── Outer shell ─────────────────────────────────────────────── */
.scenario-board {
  display: block;
  border: 1px solid var(--dng-shell-border);
  padding: var(--dng-shell-gap);
  background: var(--dng-shell-bg);
  clip-path: polygon(
    var(--dng-chamfer)                       0%,
    calc(100% - var(--dng-chamfer))          0%,
    100%                  var(--dng-chamfer),
    100%     calc(100% - var(--dng-chamfer)),
    calc(100% - var(--dng-chamfer))         100%,
    var(--dng-chamfer)                      100%,
    0%       calc(100% - var(--dng-chamfer)),
    0%                    var(--dng-chamfer)
  );
  filter:
    drop-shadow(0 16px 52px rgba(0, 0, 0, 0.90))
    drop-shadow(0  5px 18px rgba(0, 0, 0, 0.68))
    drop-shadow(0  1px  4px rgba(0, 0, 0, 0.48));
}

/* ── Bronze ring ─────────────────────────────────────────────── */
.scenario-board__ring {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--dng-ring-gap);
  background:
    linear-gradient(
      to right,
      rgba(200, 152, 30, 0.18)  0%,
      transparent                50%,
      rgba(0, 0, 0, 0.18)       100%
    ),
    linear-gradient(
      to bottom,
      var(--dng-bronze-hi)    0%,
      var(--dng-bronze-mid)  11%,
      var(--dng-bronze-deep) 28%,
      var(--dng-bronze-low)  50%,
      var(--dng-bronze-deep) 72%,
      var(--dng-bronze-mid)  89%,
      var(--dng-bronze-hi)  100%
    );
  padding: var(--dng-ring-padding);
  border: 1px solid var(--dng-frame-outer);
  box-shadow:
    inset 0  2px 0 var(--dng-ring-bevel-top),
    inset 0 -2px 0 rgba(0, 0, 0, 0.55),
    inset  1px 0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.32);
}

/* ── Corner L-bracket mounts ─────────────────────────────────── */
.sb-bracket {
  position: absolute;
  width: var(--dng-bracket-size);
  height: var(--dng-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.sb-bracket::before,
.sb-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket);
}

.sb-bracket::before { height: var(--dng-bracket-weight); width: var(--dng-bracket-size); }
.sb-bracket::after  { width:  var(--dng-bracket-weight); height: var(--dng-bracket-size); }

.sb-bracket--tl { top: var(--dng-bracket-inset); left: var(--dng-bracket-inset);   }
.sb-bracket--tl::before { top: 0; left: 0; }
.sb-bracket--tl::after  { top: 0; left: 0; }

.sb-bracket--tr { top: var(--dng-bracket-inset); right: var(--dng-bracket-inset);  }
.sb-bracket--tr::before { top: 0; right: 0; }
.sb-bracket--tr::after  { top: 0; right: 0; }

.sb-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.sb-bracket--bl::before { bottom: 0; left: 0; }
.sb-bracket--bl::after  { bottom: 0; left: 0; }

.sb-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.sb-bracket--br::before { bottom: 0; right: 0; }
.sb-bracket--br::after  { bottom: 0; right: 0; }

/* ── Split-plate header ──────────────────────────────────────── */
/* Full-bleed: [header-mission (flex:1)] [header-pillar (10px)] [header-turns (88px)] */
.scenario-board__header {
  display: flex;
  align-items: stretch;
  width: calc(100% + 2 * var(--dng-ring-padding));
  margin-left: calc(-1 * var(--dng-ring-padding));
  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-mid)  20%,
    var(--dng-plate-bg-base) 100%
  );
  border-top:    1px solid var(--dng-plate-top);
  border-left:   2px solid var(--dng-plate-left);
  border-right:  2px solid var(--dng-plate-right);
  border-bottom: 1px solid var(--dng-plate-bottom);
  box-shadow:
    inset 0 1px 8px rgba(0, 0, 0, 0.65),
    0 1px 0 var(--dng-plate-shimmer);
}

.header-mission {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 10px calc(var(--dng-ring-padding) + 4px) 10px calc(var(--dng-ring-padding) + 12px);
  min-width: 0;
  overflow: hidden;
}

/* Mission crest glyph — unique to this component, renders in --dng-title-gold */
.mission-crest {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  color: var(--dng-title-gold);
  opacity: 0.82;
}

.mission-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mission-eyebrow {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--dng-subtitle-warm);
  line-height: 1;
}

.mission-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  line-height: var(--leading-tight);
  white-space: normal;
}

/* Bronze vertical pillar — standalone structural column, full ring gradient vertically */
.header-pillar {
  flex-shrink: 0;
  width: 10px;
  align-self: stretch;
  background: linear-gradient(
    to bottom,
    var(--dng-bronze-hi)    0%,
    var(--dng-bronze-mid)  11%,
    var(--dng-bronze-deep) 28%,
    var(--dng-bronze-low)  50%,
    var(--dng-bronze-deep) 72%,
    var(--dng-bronze-mid)  89%,
    var(--dng-bronze-hi)  100%
  );
  box-shadow:
    inset  1px 0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.58);
  margin-top:    -1px;
  margin-bottom: -1px;
}

.header-turns {
  flex-shrink: 0;
  width: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  gap: 1px;
}

.turns-label {
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--dng-subtitle-warm);
  line-height: 1;
}

.turns-current {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--dng-title-gold);
  line-height: 1;
  letter-spacing: 0.05em;
}

.turns-denom {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.turns-of {
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  color: var(--dng-subtitle-warm);
  font-style: italic;
}

.turns-total {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  color: var(--dng-subtitle-warm);
  letter-spacing: 0.03em;
}

/* ── Inset — recessed teal-dark content surface ──────────────── */
.scenario-board__inset {
  position: relative;
  background:
    radial-gradient(
      ellipse 85% 45% at 50% 0%,
      var(--dng-inset-bloom) 0%,
      transparent            80%
    ),
    linear-gradient(
      to bottom,
      var(--dng-panel-top)     0%,
      var(--dng-panel-surface) 28%,
      var(--dng-panel-bottom) 100%
    );
  border: 1px solid var(--dng-panel-border);
  overflow: hidden;
  box-shadow:
    inset 0 3px 20px rgba(0, 0, 0, 0.78),
    inset 0 0   0  1px rgba(0, 0, 0, 0.20),
    inset 0 1px 0 var(--dng-inset-shimmer);
  clip-path: polygon(
    var(--dng-inner-chamfer)              0%,
    calc(100% - var(--dng-inner-chamfer)) 0%,
    100%  var(--dng-inner-chamfer),
    100%  100%,
    0%    100%,
    0%    var(--dng-inner-chamfer)
  );
}

/* Shadow wedges at chamfered corners */
.scenario-board__inset::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(0, 0, 0, 0.62) 0%, transparent 100%),
    linear-gradient(225deg, rgba(0, 0, 0, 0.62) 0%, transparent 100%);
  background-size: 44px 44px, 44px 44px;
  background-position: 0 0, 100% 0;
  background-repeat: no-repeat;
  z-index: 1;
}

/* ── Hero artwork strip ──────────────────────────────────────── */
.inset-artwork {
  position: relative;
  height: 110px;
  overflow: hidden;
  flex-shrink: 0;
}

.inset-artwork__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  display: block;
  opacity: 0.72;
}

.inset-artwork__vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent              50%,
    var(--dng-panel-surface) 100%
  );
  z-index: 1;
}

/* ── Body content ────────────────────────────────────────────── */
.scenario-board__body {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg) var(--space-lg);
}

/* Campaign progress ribbon — 3px amber temporal marker */
.mission-ribbon {
  height: 3px;
  background: rgba(0, 0, 0, 0.42);
  border-radius: 1px;
  overflow: hidden;
  margin-bottom: var(--space-xs);
}

.mission-ribbon__fill {
  height: 100%;
  background: linear-gradient(
    to right,
    rgba(168, 120, 28, 0.65)  0%,
    rgba(212, 184, 96, 0.90) 100%
  );
  border-radius: 1px;
  transition: width 0.5s ease-out;
}

.mission-summary {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  font-style: italic;
}

.expand-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--dng-subtitle-warm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  align-self: flex-start;
  transition: color var(--transition-fast);
}

.expand-btn:hover { color: var(--dng-title-gold); }

.expand-btn:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

.expand-btn__chevron {
  display: inline-block;
  font-style: normal;
  transition: transform var(--transition-fast);
}

.expand-btn__chevron.is-open { transform: rotate(90deg); }

.mission-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  padding-left: var(--space-md);
  border-left: 2px solid var(--dng-divider);
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 600px) {
  .mission-crest {
    width: 26px;
    height: 26px;
  }

  .mission-title {
    font-size: var(--text-xs);
  }

  .header-turns {
    width: 72px;
    padding: 8px 10px;
  }

  .turns-current {
    font-size: var(--text-xl);
  }
}
</style>
