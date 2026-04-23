<template>
  <!--
    CardDetailsModal — dungeon-family inspection panel for ActionCard.

    Uses SurfaceModalPanel as the structural shell (cap + ring + inset + actions).
    The card-specific content lives inside the default slot; action buttons in #footer.
    Category accent is threaded as a CSS custom property on the content root so all
    section headings, badges and the Play button react without shell-level coupling.
  -->
  <SurfaceModalPanel
    :is-open="isOpen"
    :title="card.name"
    @close="emit('close')"
  >
    <!-- ── Body content (teal inset) ───────────────────────────────────── -->
    <div class="cdm-body" :style="{ '--cdm-accent': categoryAccentColor }">

      <!-- Category badge row -->
      <div class="cdm-preamble">
        <span class="cdm-badge">
          <!-- Sigil: small diamond with center dot — broadcast mark at inspection scale -->
          <svg class="cdm-badge__sigil" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
            <polygon points="6,0.8 11.2,6 6,11.2 0.8,6" />
            <circle cx="6" cy="6" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          {{ categoryLabel }}
        </span>
      </div>

      <!-- Artwork strip — gradient ambient region; receives AI illustrations when present -->
      <div class="cdm-artwork" aria-hidden="true">
        <img
          v-if="artwork?.illustration_url"
          :src="artwork.illustration_url"
          :alt="artwork.alt ?? ''"
          class="cdm-artwork__img"
        />
      </div>

      <!-- Description prose -->
      <p class="cdm-description">{{ card.description }}</p>

      <!-- Bronze rule — visual seam between lore and mechanical data -->
      <div class="cdm-rule" aria-hidden="true" />

      <!-- Immediate effects -->
      <div v-if="card.score_changes.length > 0" class="cdm-section">
        <h3 class="cdm-section__title">Immediate Effects</h3>
        <ul class="cdm-delta-list">
          <li
            v-for="(effect, index) in card.score_changes"
            :key="index"
            class="cdm-delta-item"
          >
            <span class="cdm-delta-item__icon" :class="`metric-${effect.score_id.replace(/_/g, '-')}`">
              {{ getMetricIcon(effect.score_id) }}
            </span>
            <span class="cdm-delta-item__label">{{ getMetricLabel(effect.score_id) }}</span>
            <span class="cdm-delta-item__value" :class="effect.delta > 0 ? 'is-positive' : 'is-negative'">
              {{ effect.delta > 0 ? '+' : '' }}{{ effect.delta }}
            </span>
            <span v-if="getScoreAdjustment(effect.score_id)" class="cdm-score-adjustment">
              start:
              <span class="cdm-score-adjustment__old">{{ Math.round(getScoreAdjustment(effect.score_id)!.base) }}</span>
              <span class="cdm-score-adjustment__new">{{ Math.round(getScoreAdjustment(effect.score_id)!.adjusted) }}</span>
              <span class="cdm-score-adjustment__note">{{ getScoreAdjustment(effect.score_id)!.modifierName }}</span>
            </span>
          </li>
        </ul>
      </div>

      <!-- Coupling-adjusted effects -->
      <div v-if="hasAnyModifiedEffect" class="cdm-section cdm-section--coupling">
        <h3 class="cdm-section__title">
          <span aria-hidden="true">⚠</span> Adjusted Effects
        </h3>
        <p class="cdm-coupling-note">System coupling is reducing some gains.</p>
        <ul class="cdm-delta-list">
          <li
            v-for="(adj, index) in adjustedEffects"
            :key="'adj-' + index"
            class="cdm-delta-item"
            :class="{ 'is-modified': adj.is_modified }"
          >
            <span class="cdm-delta-item__icon" :class="`metric-${adj.score_id.replace(/_/g, '-')}`">
              {{ getMetricIcon(adj.score_id) }}
            </span>
            <span class="cdm-delta-item__label">{{ getMetricLabel(adj.score_id) }}</span>
            <span class="cdm-delta-item__value" :class="adj.adjusted_delta > 0 ? 'is-positive' : 'is-negative'">
              {{ adj.adjusted_delta > 0 ? '+' : '' }}{{ adj.adjusted_delta }}
            </span>
            <span v-if="adj.is_modified" class="cdm-modifier-badge">
              was {{ adj.base_delta > 0 ? '+' : '' }}{{ adj.base_delta }}
            </span>
          </li>
        </ul>
        <p class="cdm-coupling-reason">{{ couplingReasonText }}</p>
      </div>

      <!-- Architectural aftershocks -->
      <div
        v-if="card.delayed_effect_refs && card.delayed_effect_refs.length > 0"
        class="cdm-section"
      >
        <h3 class="cdm-section__title">
          <span aria-hidden="true">⚡</span> Architectural Aftershocks
        </h3>
        <div class="cdm-aftershock-notice">
          <p class="cdm-aftershock-text">
            This action triggers
            <strong>{{ card.delayed_effect_refs.length }} aftershock{{ card.delayed_effect_refs.length > 1 ? 's' : '' }}</strong>
            that will activate in future turns.
          </p>
        </div>
      </div>

      <!-- Stakeholder reactions -->
      <div
        v-if="card.stakeholder_changes && card.stakeholder_changes.length > 0"
        class="cdm-section"
      >
        <h3 class="cdm-section__title">Stakeholder Reactions</h3>
        <ul class="cdm-delta-list">
          <li
            v-for="(change, index) in card.stakeholder_changes"
            :key="index"
            class="cdm-delta-item"
          >
            <span class="cdm-delta-item__label">{{ formatStakeholderName(change.stakeholder_id) }}</span>
            <span class="cdm-delta-item__value" :class="change.delta > 0 ? 'is-positive' : 'is-negative'">
              {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Availability -->
      <div
        v-if="availabilityDetails.length > 0 || availabilityStatusText"
        class="cdm-section"
      >
        <h3 class="cdm-section__title">Availability</h3>
        <ul v-if="availabilityDetails.length > 0" class="cdm-availability-list">
          <li v-for="detail in availabilityDetails" :key="detail" class="cdm-availability-item">
            {{ detail }}
          </li>
        </ul>
        <p v-if="availabilityStatusText" class="cdm-availability-status">{{ availabilityStatusText }}</p>
      </div>

    </div>

    <!-- ── Action plate footer ─────────────────────────────────────────── -->
    <template #footer>
      <div class="cdm-actions" :style="{ '--cdm-accent': categoryAccentColor }">
        <button
          class="cdm-btn cdm-btn--dismiss"
          type="button"
          @click="emit('close')"
        >
          Close
        </button>
        <button
          class="cdm-btn cdm-btn--play"
          type="button"
          :disabled="isPlayDisabled"
          @click="handlePlay"
        >
          {{ primaryButtonText }}
        </button>
      </div>
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
/**
 * Detailed action-card modal for inspection and play confirmation.
 *
 * Uses simulation-derived availability/effects and does not compute rules.
 */
import { computed } from 'vue'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import type { Card } from '@/domains/content/model/content_types';
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import { getMetricPresentation } from '@/ui/composables/metric_presentation';
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation';
import { getAdjustedScoreChanges, getCollapseWarnings } from '@/ui/composables/system_coupling'
import { useCategoryPresentation } from '@/ui/composables/category_presentation'
import type { ArtworkMeta } from '@/ui/types/artwork'

interface Props {
  isOpen: boolean;
  card: Card;
  isDisabled?: boolean;
  /** Tutorial: this card is locked (another card is required) */
  isTutorialLocked?: boolean;
  availability?: TurnBriefingActionSummary;
  stakeholderNames?: Record<string, string>;
  /** Current game scores — used to compute adjusted card effects under coupling rules. */
  scores?: Record<string, number>;
  scoreAdjustments?: Record<string, { base: number; adjusted: number; modifierName: string }>;
  /** Optional artwork for the modal illustration frame. Renders an image when illustration_url is present. */
  artwork?: ArtworkMeta
}

interface Emits {
  (e: 'close'): void;
  (e: 'play', cardId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  isDisabled: false,
  stakeholderNames: () => ({}),
});

const emit = defineEmits<Emits>();

// ── Category accent system ────────────────────────────────────────────────────

const { categoryLabel, categoryAccentColor } = useCategoryPresentation(
  computed(() => props.card.style_tags ?? [])
)

const isPlayDisabled = computed(() => props.isDisabled || props.isTutorialLocked || (props.availability ? !props.availability.is_playable : false))
const primaryButtonText = computed(() => {
  if (props.isDisabled) {
    return 'Resolving…'
  }

  if (props.isTutorialLocked) {
    return '🔒 Locked'
  }

  if (!props.availability || props.availability.is_playable) {
    return 'Play This Action'
  }

  if (props.availability.unavailable_reason === 'usage_limit_reached') {
    return 'Used Up'
  }

  if (props.availability.unavailable_reason === 'cooldown_active') {
    return 'On Cooldown'
  }

  return 'Unavailable'
})

const availabilityDetails = computed(() => {
  const details: string[] = []

  if (props.card.usage_limit === 1) {
    details.push('One-time intervention (usable once per run).')
  } else if (props.card.usage_limit !== undefined && props.card.usage_limit !== null) {
    details.push(`Usage limit: ${props.card.usage_limit}.`)
  }

  if ((props.card.cooldown_turns ?? 0) > 0) {
    const turns = props.card.cooldown_turns ?? 0
    details.push(`Cooldown: ${turns} turn${turns === 1 ? '' : 's'} after each use.`)
  }

  if (props.availability?.usage_limit !== null && props.availability?.usage_limit !== undefined) {
    details.push(
      `Uses remaining: ${props.availability.uses_remaining ?? 0}/${props.availability.usage_limit}.`
    )
  }

  return details
})

const availabilityStatusText = computed(() => {
  if (!props.availability || props.availability.is_playable) {
    return ''
  }

  if (props.availability.unavailable_reason === 'usage_limit_reached') {
    return 'Unavailable: this action has already been fully used this run.'
  }

  if (props.availability.unavailable_reason === 'cooldown_active') {
    const turns = props.availability.turns_until_available
    return `Unavailable: on cooldown for ${turns} more turn${turns === 1 ? '' : 's'}.`
  }

  return 'Unavailable: requirements are not currently met.'
})

function getMetricIcon(scoreId: string): string {
  return getMetricPresentation(scoreId).icon;
}

function getMetricLabel(scoreId: string): string {
  return getMetricPresentation(scoreId).label;
}

function formatStakeholderName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, props.stakeholderNames);
}

function getScoreAdjustment(scoreId: string) {
  const adjustment = props.scoreAdjustments?.[scoreId]
  if (!adjustment) {
    return null
  }

  return adjustment.base === adjustment.adjusted ? null : adjustment
}

function handlePlay(): void {
  emit('play', props.card.id);
  emit('close');
}

// -- Coupling adjustment display --

const adjustedEffects = computed(() => {
  if (!props.scores) return []
  return getAdjustedScoreChanges(props.card.score_changes, props.scores)
})

const hasAnyModifiedEffect = computed(() =>
  adjustedEffects.value.some(e => e.is_modified)
)

const activeWarnings = computed(() => {
  if (!props.scores) return []
  return getCollapseWarnings(props.scores)
})

const couplingReasonText = computed(() =>
  activeWarnings.value.map(w => w.description).join(' ')
)
</script>

<style scoped>
/*
  All dungeon shell tokens (--dng-*) come from dungeon-design-tokens.css, loaded
  globally via src/ui/styles/design-system.css. Do NOT @import here.

  --cdm-accent is threaded as an inline style prop from categoryAccentColor.
  It defaults to --text-secondary and is overridden per card category.
*/

/* ─────────────────────────────────────────────────────────────
   BODY — scrollable content region inside the teal inset
   SurfaceModalPanel already provides dungeon-modal__body padding;
   this adds flex column layout and section spacing.
   ───────────────────────────────────────────────────────────── */
.cdm-body {
  --cdm-accent: var(--text-secondary);   /* fallback; overridden inline per card */
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  overflow-y: auto;
  max-height: 60vh;
}

/* ─────────────────────────────────────────────────────────────
   CATEGORY BADGE — eyebrow pill above description
   ───────────────────────────────────────────────────────────── */
.cdm-preamble {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.cdm-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px var(--space-sm);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--cdm-accent);
  background: var(--dng-panel-surface);  /* fallback — color-mix version in @supports below */
  border: 1px solid rgba(180, 140, 48, 0.28);  /* fallback */

  clip-path: polygon(
    4px 0%, calc(100% - 4px) 0%, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 0% calc(100% - 4px), 0% 4px
  );
}

.cdm-badge__sigil {
  flex-shrink: 0;
  color: var(--cdm-accent);
  opacity: 0.85;
}

/* ─────────────────────────────────────────────────────────────
   ARTWORK STRIP — ambient gradient region; renders illustration when present.
   Displayed as the full-width top strip of the body region.
   Empty state: compact 60px gradient placeholder (no text, stable layout).
   ───────────────────────────────────────────────────────────── */
.cdm-artwork {
  width: 100%;
  min-height: 60px;
  max-height: 180px;
  background:
    /* fallback: plain panel gradient — color-mix ambient bloom in @supports block below */
    linear-gradient(
      180deg,
      var(--dng-panel-top) 0%,
      var(--dng-panel-bottom) 100%
    );
  border: 1px solid var(--dng-panel-border);  /* fallback */
  position: relative;
  overflow: hidden;
  flex-shrink: 0;

  clip-path: polygon(
    4px 0%, calc(100% - 4px) 0%, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 0% calc(100% - 4px), 0% 4px
  );
}

/* If no image, artwork strip stays at its min-height — stable ambient block */
.cdm-artwork:not(:has(img)) {
  min-height: 60px;
  max-height: 60px;
}

.cdm-artwork__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ─────────────────────────────────────────────────────────────
   DESCRIPTION
   ───────────────────────────────────────────────────────────── */
.cdm-description {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

/* ─────────────────────────────────────────────────────────────
   BRONZE RULE — seam between lore prose and mechanical sections
   ───────────────────────────────────────────────────────────── */
.cdm-rule {
  flex-shrink: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--dng-divider) 20%,
    var(--dng-divider) 50%,  /* fallback — color-mix accent peak in @supports below */
    var(--dng-divider) 80%,
    transparent 100%
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTIONS — labeled data groupings
   ───────────────────────────────────────────────────────────── */
.cdm-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.cdm-section__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: var(--space-xs);

  /* Category-accent left edge mark — signals section belongs to this card's domain */
  padding-left: var(--space-sm);
  border-left: 2px solid var(--cdm-accent);
}

/* Coupling section: warning tinting */
.cdm-section--coupling {
  border: 1px solid rgba(255, 100, 50, 0.22);
  padding: var(--space-md);
  background: rgba(255, 100, 50, 0.03);

  clip-path: polygon(
    4px 0%, calc(100% - 4px) 0%, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 0% calc(100% - 4px), 0% 4px
  );
}

.cdm-coupling-note {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--score-critical);
  font-weight: var(--font-semibold);
}

.cdm-coupling-reason {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
  line-height: 1.4;
}

/* ─────────────────────────────────────────────────────────────
   DELTA LIST — effect/stakeholder rows with icon, label, value
   ───────────────────────────────────────────────────────────── */
.cdm-delta-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cdm-delta-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 6px var(--space-md);
  background: var(--dng-panel-surface);
  border: 1px solid var(--dng-panel-border);

  clip-path: polygon(
    4px 0%, calc(100% - 4px) 0%, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 0% calc(100% - 4px), 0% 4px
  );
}

.cdm-delta-item.is-modified {
  border-color: rgba(255, 100, 50, 0.28);
  background: rgba(255, 100, 50, 0.05);
}

.cdm-delta-item__icon {
  font-size: var(--text-base);
  line-height: 1;
  flex-shrink: 0;
}

.cdm-delta-item__label {
  flex: 1;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cdm-delta-item__value {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.cdm-delta-item__value.is-positive { color: var(--effect-positive); }
.cdm-delta-item__value.is-negative { color: var(--effect-negative); }

.cdm-modifier-badge {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.cdm-score-adjustment {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.cdm-score-adjustment__old {
  text-decoration: line-through;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.cdm-score-adjustment__new {
  color: var(--dng-title-gold);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-semibold);
}

.cdm-score-adjustment__note {
  color: var(--dng-footer-muted);
}

/* ─────────────────────────────────────────────────────────────
   AFTERSHOCK NOTICE
   ───────────────────────────────────────────────────────────── */
.cdm-aftershock-notice {
  padding: var(--space-sm) var(--space-md);
  background: var(--effect-warning-bg);
  border: 1px solid var(--effect-warning-border);

  clip-path: polygon(
    4px 0%, calc(100% - 4px) 0%, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 0% calc(100% - 4px), 0% 4px
  );
}

.cdm-aftershock-text {
  margin: 0;
  color: var(--effect-warning);
  font-size: var(--text-sm);
}

.cdm-aftershock-text strong {
  font-weight: var(--font-bold);
}

/* ─────────────────────────────────────────────────────────────
   AVAILABILITY
   ───────────────────────────────────────────────────────────── */
.cdm-availability-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.cdm-availability-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.cdm-availability-item::before {
  content: '—';
  color: var(--cdm-accent);
  flex-shrink: 0;
  font-size: var(--text-xs);
}

.cdm-availability-status {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  font-style: italic;
}

/* ─────────────────────────────────────────────────────────────
   METRIC COLOR CLASSES
   ───────────────────────────────────────────────────────────── */
.metric-domain-clarity      { color: var(--metric-domain-clarity);      }
.metric-maintainability     { color: var(--metric-maintainability);     }
.metric-delivery-confidence { color: var(--metric-delivery-confidence); }
.metric-developer-morale    { color: var(--metric-developer-morale);    }
.metric-user-trust          { color: var(--metric-user-trust);          }
.metric-budget              { color: var(--metric-budget);              }

/* ─────────────────────────────────────────────────────────────
   ACTION PLATE BUTTONS
   Rendered in SurfaceModalPanel's #footer slot (dark plate zone).
   ───────────────────────────────────────────────────────────── */
.cdm-actions {
  --cdm-accent: var(--text-secondary);   /* fallback; overridden inline per card */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  width: 100%;
}

.cdm-btn {
  padding: 7px var(--space-lg);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);

  clip-path: polygon(
    4px 0%, calc(100% - 4px) 0%, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 0% calc(100% - 4px), 0% 4px
  );
}

.cdm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Close — ghost pill, reads as secondary against the dark plate */
.cdm-btn--dismiss {
  color: var(--dng-subtitle-warm);
  background: transparent;
  border-color: var(--dng-plate-bottom);
}

.cdm-btn--dismiss:hover:not(:disabled) {
  color: var(--dng-title-gold);
  border-color: var(--dng-divider);
}

/* Play — category-accent fill; solid CTA */
.cdm-btn--play {
  color: var(--dng-shell-bg);
  background: var(--cdm-accent);
  border-color: var(--cdm-accent);
  font-weight: var(--font-bold);
}

.cdm-btn--play:hover:not(:disabled) {
  background: var(--cdm-accent);  /* fallback */
  border-color: var(--cdm-accent);  /* fallback */
  /* filter glow added in @supports block below */
}

.cdm-btn--play:disabled {
  background: var(--dng-panel-surface);  /* fallback */
  border-color: rgba(180, 140, 48, 0.20);  /* fallback */
  color: var(--dng-footer-muted);  /* fallback */
}

/* ─────────────────────────────────────────────────────────────
   @supports guard for color-mix() — progressive enhancement.
   Browsers without CSS Color Level 5 use the rgba()/var()
   fallback values defined in the rules above.
   ───────────────────────────────────────────────────────────── */
@supports (background: color-mix(in srgb, red 50%, blue)) {
  .cdm-badge {
    background: color-mix(in srgb, var(--cdm-accent) 10%, var(--dng-panel-surface));
    border: 1px solid color-mix(in srgb, var(--cdm-accent) 28%, transparent);
  }

  .cdm-artwork {
    background:
      radial-gradient(
        ellipse 70% 80% at 50% 10%,
        color-mix(in srgb, var(--cdm-accent) 8%, transparent) 0%,
        transparent 100%
      ),
      linear-gradient(
        180deg,
        var(--dng-panel-top) 0%,
        var(--dng-panel-bottom) 100%
      );
    border: 1px solid color-mix(in srgb, var(--cdm-accent) 14%, var(--dng-panel-border));
  }

  .cdm-rule {
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--dng-divider) 20%,
      color-mix(in srgb, var(--cdm-accent) 22%, var(--dng-divider)) 50%,
      var(--dng-divider) 80%,
      transparent 100%
    );
  }

  .cdm-btn--play:hover:not(:disabled) {
    background: color-mix(in srgb, var(--cdm-accent) 80%, white);
    border-color: color-mix(in srgb, var(--cdm-accent) 80%, white);
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--cdm-accent) 55%, transparent));
  }

  .cdm-btn--play:disabled {
    background: color-mix(in srgb, var(--cdm-accent) 40%, var(--dng-panel-surface));
    border-color: color-mix(in srgb, var(--cdm-accent) 28%, transparent);
    color: color-mix(in srgb, var(--cdm-accent) 55%, transparent);
  }
}

/* ─────────────────────────────────────────────────────────────
   RESPONSIVE — narrow viewports (≤ 640px)
   ───────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  /* Allow more vertical space on small screens */
  .cdm-body {
    max-height: 70vh;
  }

  /* Stack action buttons vertically, full-width */
  .cdm-actions {
    flex-direction: column;
    width: 100%;
  }

  .cdm-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
