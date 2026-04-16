<template>
  <article
    class="dungeon-ac"
    :class="[`category-${categoryId}`, { 'is-disabled': isCardDisabled, 'tutorial-locked': isTutorialLocked, 'tutorial-highlighted': isTutorialHighlighted }]"
  >

    <!-- Tutorial lock overlay — centered above ring content -->
    <div v-if="isTutorialLocked" class="tutorial-lock-overlay" aria-hidden="true">
      <span class="tutorial-lock-icon">🔒</span>
    </div>

    <!-- Tutorial highlight badge — floating tag in top-right zone -->
    <div v-if="isTutorialHighlighted" class="tutorial-play-badge" aria-label="Tutorial: play this card">
      <span class="tutorial-play-icon">👆</span> Play This Card!
    </div>

    <div class="dungeon-ac__ring">

      <!-- Bottom-only L-bracket mounts — card rests, does not anchor -->
      <span class="ac-bracket ac-bracket--bl" aria-hidden="true" />
      <span class="ac-bracket ac-bracket--br" aria-hidden="true" />

      <!-- Header: action sigil + category eyebrow + card title + optional artwork -->
      <header class="dungeon-ac__header">

        <!-- Action Sigil: radial outward-broadcast glyph, unique to ActionCard -->
        <svg
          class="ac-sigil"
          viewBox="0 0 40 40"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.64" />
          <!-- North chevron -->
          <line x1="17" y1="15" x2="20" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <line x1="20" y1="10" x2="23" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <!-- South chevron -->
          <line x1="17" y1="25" x2="20" y2="30" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <line x1="20" y1="30" x2="23" y2="25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <!-- West chevron -->
          <line x1="15" y1="17" x2="10" y2="20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <line x1="10" y1="20" x2="15" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <!-- East chevron -->
          <line x1="25" y1="17" x2="30" y2="20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <line x1="30" y1="20" x2="25" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <!-- Inscribed domain diamond -->
          <path d="M20,15 L25,20 L20,25 L15,20 Z" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.42" />
          <!-- Center action origin dot -->
          <circle cx="20" cy="20" r="2.2" fill="currentColor" opacity="0.95" />
        </svg>

        <div class="ac-header-text">
          <span class="ac-eyebrow">{{ categoryLabel }}</span>
          <h3 class="ac-title">{{ card.name }}</h3>
        </div>

        <!-- Optional artwork thumbnail -->
        <div v-if="artwork?.illustration_url" class="card-artwork-thumb" aria-hidden="true">
          <img :src="artwork.illustration_url" :alt="artwork.alt ?? ''" />
        </div>
      </header>

      <!-- Main inset content well -->
      <div class="dungeon-ac__inset">
        <div class="dungeon-ac__body">

          <!-- Style tags -->
          <div v-if="card.style_tags?.length" class="card-tags">
            <span v-for="tag in card.style_tags" :key="tag" class="card-tag">{{ tag }}</span>
          </div>

          <p class="card-description">{{ summaryText }}</p>

          <!-- Primary Effects -->
          <div class="primary-effects" v-if="card.score_changes.length">
            <span
              v-for="(change, idx) in primaryEffects"
              :key="`${change.score_id}-${change.delta}`"
              class="effect-chip"
              :class="[
                change.delta > 0 ? 'positive' : 'negative',
                { 'chip-modified': showAdjusted && adjustedPrimaryEffects[idx]?.is_modified }
              ]"
            >
              <span class="metric-icon" :class="metricPresentation(change.score_id).colorClass">
                {{ metricPresentation(change.score_id).icon }}
              </span>
              {{ metricPresentation(change.score_id).label }}
              <template v-if="showAdjusted && adjustedPrimaryEffects[idx]?.is_modified">
                <span class="chip-delta">{{ adjustedPrimaryEffects[idx].adjusted_delta > 0 ? '+' : '' }}{{ adjustedPrimaryEffects[idx].adjusted_delta }}</span>
                <span class="chip-base-delta">{{ change.delta > 0 ? '+' : '' }}{{ change.delta }}</span>
              </template>
              <template v-else>
                <span class="chip-delta">{{ change.delta > 0 ? '+' : '' }}{{ change.delta }}</span>
              </template>
            </span>
            <span v-if="remainingEffects > 0" class="more-effects-wrapper">
              <button
                ref="moreChipRef"
                type="button"
                class="effect-chip more-effects"
                :aria-label="`${remainingEffects} more effect${remainingEffects > 1 ? 's' : ''} — click to inspect`"
                @click.stop="$emit('showDetails')"
                @mouseenter="openPreview"
                @mouseleave="closePreview"
                @focus="openPreview"
                @blur="closePreview"
              >
                +{{ remainingEffects }} more
              </button>
              <Teleport to="body">
                <Transition name="tooltip">
                  <div
                    v-if="showMorePreview"
                    class="more-effects-tooltip"
                    role="tooltip"
                    :style="{ top: tooltipPos.top + 'px', left: tooltipPos.left + 'px' }"
                    @mouseenter="showMorePreview = true"
                    @mouseleave="closePreview"
                  >
                    <span class="tooltip-title">Hidden Effects</span>
                    <ul class="tooltip-effect-list">
                      <li v-for="change in hiddenEffects" :key="`hidden-${change.score_id}-${change.delta}`" class="tooltip-effect-item">
                        <span class="metric-icon" :class="metricPresentation(change.score_id).colorClass">
                          {{ metricPresentation(change.score_id).icon }}
                        </span>
                        <span class="tooltip-effect-label">{{ metricPresentation(change.score_id).label }}</span>
                        <span class="tooltip-effect-delta" :class="change.delta > 0 ? 'positive' : 'negative'">
                          {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </Transition>
              </Teleport>
            </span>
          </div>

          <!-- Compact indicators: aftershocks · stakeholders -->
          <div class="card-indicators" v-if="hasIndicators">
            <span v-if="card.delayed_effect_refs.length" class="indicator-badge indicator-aftershock">
              <span class="indicator-icon">⚡</span>
              {{ card.delayed_effect_refs.length }} Aftershock{{ card.delayed_effect_refs.length > 1 ? 's' : '' }}
            </span>
            <span v-if="card.stakeholder_changes?.length" class="indicator-badge indicator-stakeholders">
              <span class="indicator-icon">👥</span>
              {{ card.stakeholder_changes.length }} Stakeholder{{ card.stakeholder_changes.length > 1 ? 's' : '' }}
            </span>
          </div>

          <div v-if="availability" class="availability-section">
            <div class="availability-badges">
              <span v-if="isOneTimeCard" class="indicator-badge indicator-availability">One-time</span>
              <span v-if="hasCooldown" class="indicator-badge indicator-availability">
                Cooldown: {{ availability.cooldown_turns }} turn{{ availability.cooldown_turns === 1 ? '' : 's' }}
              </span>
              <span
                v-if="availability.usage_limit !== null && availability.usage_limit > 1"
                class="indicator-badge indicator-availability"
              >
                Uses: {{ availability.uses_remaining ?? 0 }}/{{ availability.usage_limit }}
              </span>
            </div>
            <p v-if="availabilityStatusText" class="availability-status">{{ availabilityStatusText }}</p>
          </div>

        </div>

        <!-- Footer action pair -->
        <footer class="dungeon-ac__footer">
          <button
            class="ac-btn ac-btn--inspect"
            type="button"
            :disabled="isDisabled"
            @click="$emit('showDetails')"
            aria-label="Inspect action card details"
          >
            Inspect
          </button>
          <button
            class="ac-btn ac-btn--play"
            type="button"
            :disabled="isCardDisabled"
            :title="playButtonHint"
            :aria-label="playButtonHint"
            @click="$emit('play', card.id)"
          >
            {{ primaryButtonLabel }}
          </button>
        </footer>

      </div><!-- /dungeon-ac__inset -->
    </div><!-- /dungeon-ac__ring -->
  </article>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { Card } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import type { ArtworkMeta } from '@/ui/types/artwork'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { getAdjustedScoreChanges, hasActiveCoupling } from '@/ui/composables/system_coupling'
import { useCategoryPresentation } from '@/ui/composables/category_presentation'

const props = defineProps<{
  card: Card
  isDisabled?: boolean
  /** Tutorial: this card cannot be played (another card is required) */
  isTutorialLocked?: boolean
  /** Tutorial: this is the card the player should play */
  isTutorialHighlighted?: boolean
  availability?: TurnBriefingActionSummary
  /** Current game scores — used to show adjusted effects under coupling rules. */
  scores?: Record<string, number>
  /** Optional artwork metadata. Renders a thumbnail in the card header when illustration_url is present. */
  artwork?: ArtworkMeta
}>()

defineEmits<{
  play: [cardId: string]
  showDetails: []
}>()

/**
 * Category presentation — resolved from style_tags via shared composable.
 */
const { categoryId, categoryLabel } = useCategoryPresentation(computed(() => props.card.style_tags ?? []))

const primaryEffects = computed(() => props.card.score_changes.slice(0, 3))
const hiddenEffects = computed(() => props.card.score_changes.slice(3))
const remainingEffects = computed(() => hiddenEffects.value.length)

const showMorePreview = ref(false)
const moreChipRef = ref<HTMLElement | null>(null)
const tooltipPos = ref({ top: 0, left: 0 })

function updateTooltipPosition() {
  if (!moreChipRef.value) return
  const rect = moreChipRef.value.getBoundingClientRect()
  tooltipPos.value = {
    top: rect.top,
    left: rect.left + rect.width / 2
  }
}

function openPreview() {
  updateTooltipPosition()
  showMorePreview.value = true
  // Re-position after render in case layout shifted
  nextTick(updateTooltipPosition)
}

function closePreview() {
  showMorePreview.value = false
}

const adjustedPrimaryEffects = computed(() => {
  if (!props.scores || !hasActiveCoupling(props.scores)) return []
  return getAdjustedScoreChanges(primaryEffects.value, props.scores)
})

const showAdjusted = computed(() =>
  adjustedPrimaryEffects.value.some(e => e.is_modified)
)
const hasIndicators = computed(() =>
  props.card.delayed_effect_refs.length > 0 || (props.card.stakeholder_changes?.length ?? 0) > 0
)
const availability = computed(() => props.availability)
const isOneTimeCard = computed(() => availability.value?.usage_limit === 1)
const hasCooldown = computed(() => (availability.value?.cooldown_turns ?? 0) > 0)
const isCardDisabled = computed(() => props.isDisabled || props.isTutorialLocked || (availability.value ? !availability.value.is_playable : false))
const playButtonHint = computed(() => {
  if (props.isDisabled) {
    return 'Turn is resolving.'
  }

  if (!availability.value || availability.value.is_playable) {
    return `Play ${props.card.name}`
  }

  if (availability.value.unavailable_reason === 'usage_limit_reached') {
    return 'Unavailable: usage limit reached for this run.'
  }

  if (availability.value.unavailable_reason === 'cooldown_active') {
    const turns = availability.value.turns_until_available
    return `Unavailable: on cooldown for ${turns} more turn${turns === 1 ? '' : 's'}.`
  }

  return 'Unavailable: requirements are not currently met.'
})
const primaryButtonLabel = computed(() => {
  if (props.isDisabled) {
    return 'Resolving…'
  }

  if (!availability.value || availability.value.is_playable) {
    return 'Play'
  }

  if (availability.value.unavailable_reason === 'usage_limit_reached') {
    return 'Used Up'
  }

  if (availability.value.unavailable_reason === 'cooldown_active') {
    return 'On Cooldown'
  }

  return 'Unavailable'
})
const availabilityStatusText = computed(() => {
  if (!availability.value || availability.value.is_playable) {
    if (availability.value?.usage_limit !== null && availability.value?.usage_limit !== undefined) {
      return `Uses remaining: ${availability.value.uses_remaining ?? 0}`
    }

    return ''
  }

  if (availability.value.unavailable_reason === 'usage_limit_reached') {
    return 'Unavailable: used up for this run.'
  }

  if (availability.value.unavailable_reason === 'cooldown_active') {
    const turns = availability.value.turns_until_available
    return `Unavailable: on cooldown for ${turns} turn${turns === 1 ? '' : 's'}`
  }

  return 'Unavailable: requirements not met'
})
const summaryText = computed(() => {
  const compact = props.card.flavor_text?.trim() || props.card.description
  if (compact.length <= 120) {
    return compact
  }

  return `${compact.slice(0, 117).trimEnd()}...`
})

function metricPresentation(scoreId: string) {
  return getMetricPresentation(scoreId)
}
</script>

<style scoped>
/* ── Component-local geometry tokens ────────────────────────── */
.dungeon-ac {
  --dng-card-chamfer:       6px;
  --dng-card-shell-gap:     2px;
  --dng-card-ring-v:        6px;
  --dng-card-ring-h:        10px;
  --dng-card-inset-chamfer: 4px;
  --dng-card-body-padding:  var(--space-sm);

  /* Title/subtitle on bronze ring face — dark contrast values (not for dark surfaces) */
  --dng-title-gold:    #1e1306;
  --dng-subtitle-warm: #3a2a0a;

  /* Default category accent — neutral slate before category class applied */
  --ac-category-accent: var(--text-secondary);
}


/* ── Category identity variants ─────────────────────────────── */
/* Each patches the 8 accent-area tokens only. Bronze ring is unchanged. */

.dungeon-ac.category-refactor {
  --ac-category-accent: var(--category-refactor);
  --dng-divider:        rgba(52, 211, 153, 0.42);
  --dng-inset-bloom:    rgba(12, 95, 60, 0.44);
  --dng-inset-shimmer:  rgba(52, 211, 153, 0.24);
  --dng-bracket:        rgba(52, 211, 153, 0.72);
  --dng-panel-border:   rgba(22, 163, 80, 0.38);
  --dng-panel-footer:   #07160c;
  --dng-footer-muted:   #268a52;
}

.dungeon-ac.category-infrastructure {
  --ac-category-accent: var(--category-infrastructure);
  --dng-divider:        rgba(96, 165, 250, 0.42);
  --dng-inset-bloom:    rgba(20, 60, 140, 0.44);
  --dng-inset-shimmer:  rgba(96, 165, 250, 0.24);
  --dng-bracket:        rgba(96, 165, 250, 0.72);
  --dng-panel-border:   rgba(50, 130, 220, 0.38);
  --dng-panel-footer:   #050a18;
  --dng-footer-muted:   #3669b0;
}

.dungeon-ac.category-team {
  --ac-category-accent: var(--category-team);
  --dng-divider:        rgba(251, 191, 36, 0.42);
  --dng-inset-bloom:    rgba(160, 100, 8, 0.44);
  --dng-inset-shimmer:  rgba(251, 191, 36, 0.24);
  --dng-bracket:        rgba(251, 191, 36, 0.72);
  --dng-panel-border:   rgba(200, 150, 20, 0.38);
  --dng-panel-footer:   #180e02;
  --dng-footer-muted:   #9e7a18;
}

.dungeon-ac.category-process {
  --ac-category-accent: var(--category-process);
  --dng-divider:        rgba(169, 137, 250, 0.42);
  --dng-inset-bloom:    rgba(70, 40, 185, 0.44);
  --dng-inset-shimmer:  rgba(169, 137, 250, 0.24);
  --dng-bracket:        rgba(169, 137, 250, 0.72);
  --dng-panel-border:   rgba(120, 90, 210, 0.38);
  --dng-panel-footer:   #0c0815;
  --dng-footer-muted:   #6e4faa;
}

.dungeon-ac.category-fix {
  --ac-category-accent: var(--category-fix);
  --dng-divider:        rgba(251, 146, 60, 0.52);
  --dng-inset-bloom:    rgba(180, 70, 10, 0.44);
  --dng-inset-shimmer:  rgba(251, 146, 60, 0.26);
  --dng-bracket:        rgba(251, 146, 60, 0.80);
  --dng-panel-border:   rgba(200, 100, 20, 0.38);
  --dng-panel-footer:   #160801;
  --dng-footer-muted:   #b8621a;
}

.dungeon-ac.category-default {
  --ac-category-accent: var(--text-secondary);
  --dng-divider:        rgba(120, 135, 155, 0.28);
  --dng-inset-bloom:    rgba(20, 30, 45, 0.20);
  --dng-inset-shimmer:  rgba(180, 195, 215, 0.12);
  --dng-bracket:        rgba(140, 155, 170, 0.45);
  --dng-panel-border:   rgba(90, 110, 130, 0.28);
  --dng-panel-footer:   #090c0f;
  --dng-footer-muted:   #525a66;
}


/* ── Outer shell ─────────────────────────────────────────────── */
.dungeon-ac {
  display: block;
  border: 1px solid var(--dng-shell-border);
  padding: var(--dng-card-shell-gap);
  background: var(--dng-shell-bg);
  position: relative;
  clip-path: polygon(
    var(--dng-card-chamfer)                      0%,
    calc(100% - var(--dng-card-chamfer))         0%,
    100%  var(--dng-card-chamfer),
    100%  calc(100% - var(--dng-card-chamfer)),
    calc(100% - var(--dng-card-chamfer))         100%,
    var(--dng-card-chamfer)                      100%,
    0%    calc(100% - var(--dng-card-chamfer)),
    0%    var(--dng-card-chamfer)
  );
  filter:
    drop-shadow(0 5px 16px rgba(0, 0, 0, 0.76))
    drop-shadow(0 2px  5px rgba(0, 0, 0, 0.52));
  cursor: pointer;
  transition: filter var(--transition-fast);
}

.dungeon-ac:hover:not(.is-disabled) {
  filter:
    drop-shadow(0 8px 24px rgba(0, 0, 0, 0.88))
    drop-shadow(0 3px  8px rgba(0, 0, 0, 0.65));
}

.dungeon-ac:focus-visible {
  outline: 2px solid var(--ac-category-accent);
  outline-offset: 3px;
}

.dungeon-ac.is-disabled { opacity: 0.65; cursor: default; }


/* ── Tutorial states ─────────────────────────────────────────── */
.dungeon-ac.tutorial-locked {
  opacity: 0.40;
  filter: grayscale(0.50);
  pointer-events: none;
  cursor: default;
}

.dungeon-ac.tutorial-highlighted {
  outline: 2px solid var(--ac-category-accent);
  outline-offset: 3px;
  /* fallback glow — color-mix enhanced version in @supports block below */
  filter: drop-shadow(0 0 10px rgba(180, 140, 48, 0.40));
  animation: ac-tutorial-pulse 2s ease-in-out infinite;
}

/* fallback keyframes (rgba-only) — color-mix version overridden in @supports below */
@keyframes ac-tutorial-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(180, 140, 48, 0.40)) drop-shadow(0 0 28px rgba(180, 140, 48, 0.14));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(180, 140, 48, 0.60)) drop-shadow(0 0 44px rgba(180, 140, 48, 0.22));
  }
}

.tutorial-lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  pointer-events: none;
}

.tutorial-lock-icon {
  font-size: 2rem;
  opacity: 0.55;
}

.tutorial-play-badge {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  background: var(--ac-category-accent);
  color: var(--dng-shell-bg);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  padding: 3px var(--space-sm);
  z-index: 5;
  white-space: nowrap;
  animation: badge-bounce 1.5s ease-in-out infinite;
  clip-path: polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% 100%, 0% 100%, 0% 4px);
}

.tutorial-play-icon { margin-right: 2px; }

@keyframes badge-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}


/* ── Flat bronze ring ────────────────────────────────────────── */
.dungeon-ac__ring {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--dng-ring-gap);
  background: linear-gradient(
    to bottom,
    var(--dng-bronze-hi)    0%,
    var(--dng-bronze-mid)  45%,
    var(--dng-bronze-deep) 100%
  );
  padding: var(--dng-card-ring-v) var(--dng-card-ring-h);
  border: 1px solid var(--dng-frame-outer);
}


/* ── Bottom-only L-brackets ──────────────────────────────────── */
.ac-bracket {
  position: absolute;
  width: var(--dng-bracket-size);
  height: var(--dng-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.ac-bracket::before,
.ac-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket);
}

.ac-bracket::before { height: var(--dng-bracket-weight); width: var(--dng-bracket-size); }
.ac-bracket::after  { width:  var(--dng-bracket-weight); height: var(--dng-bracket-size); }

.ac-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.ac-bracket--bl::before { bottom: 0; left: 0; }
.ac-bracket--bl::after  { bottom: 0; left: 0; }

.ac-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.ac-bracket--br::before { bottom: 0; right: 0; }
.ac-bracket--br::after  { bottom: 0; right: 0; }


/* ── Header: sigil + title on ring face ──────────────────────── */
.dungeon-ac__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--dng-divider);
}

/* Action sigil — 28px, right-to-left: category color via color: */
.ac-sigil {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--ac-category-accent);
  opacity: 0.84;
}

.ac-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.ac-eyebrow {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--dng-subtitle-warm);
  line-height: 1;
}

/* h3 card title — deep warm-black on bronze, heading family */
.ac-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Optional artwork thumbnail */
.card-artwork-thumb {
  flex-shrink: 0;
  width: 52px;
  height: 38px;
  overflow: hidden;
  background: var(--dng-panel-surface);
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

.card-artwork-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0.82;
}


/* ── Inset — recessed category-tinted content well ───────────── */
.dungeon-ac__inset {
  background:
    radial-gradient(
      ellipse 60% 25% at 50% 0%,
      var(--dng-inset-bloom) 0%,
      transparent            100%
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
    inset 0 2px 10px rgba(0, 0, 0, 0.62),
    inset 0 0   0  1px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 var(--dng-inset-shimmer);
  clip-path: polygon(
    var(--dng-card-inset-chamfer)                0%,
    calc(100% - var(--dng-card-inset-chamfer))   0%,
    100%   var(--dng-card-inset-chamfer),
    100%   100%,
    0%     100%,
    0%     var(--dng-card-inset-chamfer)
  );
  display: flex;
  flex-direction: column;
}


/* ── Body — compact gameplay content ─────────────────────────── */
.dungeon-ac__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--dng-card-body-padding);
}

/* Style tags — chamfered, category-accent tinted */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.card-tag {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--ac-category-accent);
  background: var(--dng-panel-surface);  /* fallback — color-mix version in @supports below */
  border: 1px solid rgba(180, 148, 48, 0.20);  /* fallback */
  padding: 1px var(--space-sm);
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

/* Flavor/description text */
.card-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  font-style: italic;
}

/* Effect chips row — kept as-is for game readability continuity */
.primary-effects {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.effect-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 2px var(--space-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  background: var(--dng-panel-surface);  /* fallback — color-mix version in @supports below */
  border: 1px solid rgba(180, 148, 48, 0.20);
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

.effect-chip.positive {
  border-color: var(--effect-positive-border);
  background: var(--effect-positive-bg);
  color: var(--effect-positive);
}

.effect-chip.negative {
  border-color: var(--effect-negative-border);
  background: var(--effect-negative-bg);
  color: var(--effect-negative);
}

.chip-delta {
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
}

.chip-modified {
  border-color: rgba(255, 100, 50, 0.30);
  background: rgba(255, 100, 50, 0.06);
}

.chip-base-delta {
  font-size: var(--text-2xs);
  color: var(--text-muted);
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
}

.more-effects-wrapper { position: relative; display: inline-flex; }

.effect-chip.more-effects {
  color: var(--dng-footer-muted);
  border-color: rgba(120, 100, 48, 0.22);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.effect-chip.more-effects:hover,
.effect-chip.more-effects:focus-visible {
  color: var(--ac-category-accent);
  border-color: var(--ac-category-accent);
  outline: none;
}

.metric-icon { display: inline-flex; }

.metric-maintainability    { color: var(--metric-maintainability);      }
.metric-domain-clarity     { color: var(--metric-domain-clarity);       }
.metric-delivery-confidence{ color: var(--metric-delivery-confidence);  }
.metric-developer-morale   { color: var(--metric-developer-morale);     }
.metric-user-trust         { color: var(--metric-user-trust);           }
.metric-budget             { color: var(--metric-budget);               }
.metric-generic            { color: var(--text-secondary);              }

/* Compact indicator badges */
.card-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.indicator-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 2px var(--space-sm);
  border: 1px solid transparent;
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

.indicator-icon { font-size: var(--text-base); line-height: 1; }

.indicator-aftershock {
  background: var(--effect-warning-bg);
  border-color: var(--effect-warning-border);
  color: var(--effect-warning);
}

.indicator-stakeholders {
  background: var(--effect-neutral-bg);
  border-color: var(--effect-neutral-border);
  color: var(--effect-neutral);
}

.indicator-availability {
  background: var(--dng-panel-top);
  border-color: rgba(180, 140, 40, 0.20);
  color: var(--text-secondary);
}

.availability-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.availability-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.availability-status {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}


/* ── Footer — action pair band ───────────────────────────────── */
.dungeon-ac__footer {
  display: flex;
  gap: var(--space-xs);
  padding: 5px var(--dng-card-body-padding);
  background: var(--dng-panel-footer);
  border-top: 1px solid var(--dng-divider);
}

.ac-btn {
  flex: 1;
  padding: var(--space-xs) var(--space-sm);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  border: 1px solid;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  clip-path: polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% 100%, 0% 100%, 0% 4px);
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.ac-btn:focus-visible { outline-color: var(--border-focus); }
.ac-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* Inspect — ghost/dim secondary action */
.ac-btn--inspect {
  background: transparent;
  color: var(--dng-footer-muted);
  border-color: rgba(120, 100, 48, 0.28);
  flex: 0 0 auto;
  padding-left: var(--space-md);
  padding-right: var(--space-md);
}

.ac-btn--inspect:hover:not(:disabled) {
  background: rgba(200, 160, 40, 0.08);
  border-color: rgba(180, 140, 40, 0.42);
  color: var(--dng-subtitle-warm);
}

/* Play — category-accent fill primary CTA */
.ac-btn--play {
  background: var(--dng-panel-footer);  /* fallback — color-mix version in @supports below */
  color: var(--ac-category-accent);
  border-color: rgba(180, 148, 48, 0.45);  /* fallback */
  font-weight: var(--font-bold);
}

.ac-btn--play:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);  /* fallback */
  border-color: rgba(180, 148, 48, 0.65);  /* fallback */
}

/* ─────────────────────────────────────────────────────────────
   @supports guard for color-mix() — progressive enhancement.
   Browsers without CSS Color Level 5 use the fallback rgba()
   values defined in the rules above.
   ───────────────────────────────────────────────────────────── */
@supports (background: color-mix(in srgb, red 50%, blue)) {
  .dungeon-ac.tutorial-highlighted {
    filter:
      drop-shadow(0 0 10px color-mix(in srgb, var(--ac-category-accent) 40%, transparent))
      drop-shadow(0 0 28px color-mix(in srgb, var(--ac-category-accent) 14%, transparent));
  }

  @keyframes ac-tutorial-pulse {
    0%, 100% {
      filter:
        drop-shadow(0 0 10px color-mix(in srgb, var(--ac-category-accent) 40%, transparent))
        drop-shadow(0 0 28px color-mix(in srgb, var(--ac-category-accent) 14%, transparent));
    }
    50% {
      filter:
        drop-shadow(0 0 16px color-mix(in srgb, var(--ac-category-accent) 60%, transparent))
        drop-shadow(0 0 44px color-mix(in srgb, var(--ac-category-accent) 22%, transparent));
    }
  }

  .card-tag {
    background: color-mix(in srgb, var(--ac-category-accent) 12%, var(--dng-panel-surface));
    border: 1px solid color-mix(in srgb, var(--ac-category-accent) 28%, transparent);
  }

  .effect-chip {
    background: color-mix(in srgb, var(--dng-panel-surface) 80%, transparent);
  }

  .ac-btn--play {
    background: color-mix(in srgb, var(--ac-category-accent) 16%, var(--dng-panel-footer));
    border-color: color-mix(in srgb, var(--ac-category-accent) 55%, transparent);
  }

  .ac-btn--play:hover:not(:disabled) {
    background: color-mix(in srgb, var(--ac-category-accent) 26%, var(--dng-panel-footer));
    border-color: color-mix(in srgb, var(--ac-category-accent) 75%, transparent);
  }
}

/* ── Mobile: compact card layout inside narrow drawer ────────── */
@media (max-width: 480px) {
  .dungeon-ac {
    --dng-card-ring-h: 6px;
    --dng-card-body-padding: var(--space-xs);
  }

  /* Hide artwork thumbnail — not useful at narrow widths */
  .card-artwork-thumb {
    display: none;
  }

  /* Tighter title — allow wrapping instead of cutting off */
  .ac-title {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  /* Effect chips: allow full wrap, keep text readable */
  .effect-chip {
    font-size: var(--text-2xs);
    padding: 2px var(--space-xs);
  }

  /* Footer buttons: stack if very tight */
  .dungeon-ac__footer {
    gap: var(--space-xs);
  }

  .ac-btn--inspect {
    padding-left: var(--space-sm);
    padding-right: var(--space-sm);
  }
}
</style>

<!-- Non-scoped styles for the teleported tooltip (rendered at <body> level) -->
<style>
.more-effects-tooltip {
  position: fixed;
  transform: translateX(-50%) translateY(-100%) translateY(-8px);
  z-index: 9999;
  min-width: 180px;
  max-width: 260px;
  padding: var(--space-sm) var(--space-md);
  background: var(--dng-panel-surface, var(--surface-card));
  border: 1px solid var(--dng-panel-border, var(--border-card));
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.80),
    inset 0 1px 0 rgba(200, 158, 40, 0.12);
  pointer-events: auto;
  /* Chamfered corners matching card family */
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% 100%, 0% 100%, 0% 5px);
}

.more-effects-tooltip .tooltip-title {
  display: block;
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
  margin-bottom: var(--space-xs);
}

.more-effects-tooltip .tooltip-effect-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.more-effects-tooltip .tooltip-effect-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-primary);
}

.more-effects-tooltip .tooltip-effect-label { flex: 1; }

.more-effects-tooltip .tooltip-effect-delta {
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
}

.more-effects-tooltip .tooltip-effect-delta.positive { color: var(--effect-positive); }
.more-effects-tooltip .tooltip-effect-delta.negative { color: var(--effect-negative); }
</style>
