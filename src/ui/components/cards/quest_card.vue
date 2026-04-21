<template>
  <!--
    QuestCard — dungeon-vocabulary selection tile for quests and tutorials.

    Visual layers (outer → inner):
      Shell (chamfer=8px, dark charcoal) →
      Bronze ring (4-stop gradient, directional bevel, 4 L-bracket ornaments) →
      Header nameplate (sigil + badge eyebrow, dark text on bronze) →
      [bronze seam gap] →
      Inset panel (teal-dark depth surface, chamfered inner corners) →
        Body: title / short summary / description / flavor / stats
        Footer: action label + optional selected check

    Two variants driven by quest.isTutorial:
      • Quest:    Domain Gate sigil, "Official Campaign" badge,
                  teal inset, gold "Select Quest →" action label
      • Tutorial: Compass sigil, "Tutorial N" badge,
                  purple-tinted inset, lavender "Enter Tutorial →" label

    The whole card IS the interactive element (button root) — no nested buttons.
    Emits `select` (quests) or `launch` (tutorials) on click.
    Keyboard-accessible via focus-visible ring and Enter/Space via native button.
  -->
  <button
    class="dungeon-qc"
    :class="{ 'is-selected': isSelected, 'is-tutorial': quest.isTutorial }"
    type="button"
    @click="handleClick"
  >
    <div class="dungeon-qc__ring">

      <!-- ── 4 corner L-bracket mounts ── -->
      <span class="qc-bracket qc-bracket--tl" aria-hidden="true" />
      <span class="qc-bracket qc-bracket--tr" aria-hidden="true" />
      <span class="qc-bracket qc-bracket--bl" aria-hidden="true" />
      <span class="qc-bracket qc-bracket--br" aria-hidden="true" />

      <!-- ── Header: sigil + eyebrow badge on ring face ── -->
      <header class="dungeon-qc__header">

        <!--
          Quest sigil: Domain Gate
          An architectural portal/arch motif — entering a troubled domain.
          Outer arch + inner arch + threshold line + keystone + domain node.
        -->
        <svg
          v-if="!quest.isTutorial"
          class="qc-sigil"
          viewBox="0 0 28 28"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <!-- outer arch + side walls -->
          <path d="M3,25 L3,12 C3,6 8,3 14,3 C20,3 25,6 25,12 L25,25"
                stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/>
          <!-- inner arch (portal opening) -->
          <path d="M7,25 L7,14 C7,9 10,7 14,7 C18,7 21,9 21,14 L21,25"
                stroke="currentColor" fill="none" stroke-width="1.2" stroke-linecap="round"/>
          <!-- ground threshold -->
          <line x1="3"  y1="25" x2="25" y2="25" stroke="currentColor" stroke-width="1.5"/>
          <!-- keystone diamond at arch crown -->
          <path d="M14,3 L16.5,7 L14,9.5 L11.5,7 Z" fill="currentColor" stroke="none"/>
          <!-- domain node at gate interior -->
          <circle cx="14" cy="17" r="2" fill="currentColor"/>
          <!-- lateral passage lines -->
          <line x1="7"  y1="17" x2="12" y2="17" stroke="currentColor" stroke-width="0.9" opacity="0.7"/>
          <line x1="16" y1="17" x2="21" y2="17" stroke="currentColor" stroke-width="0.9" opacity="0.7"/>
        </svg>

        <!--
          Tutorial sigil: Compass
          Guidance motif — outer circle, cardinal ticks, north/south needle, center pin.
        -->
        <svg
          v-else
          class="qc-sigil"
          viewBox="0 0 28 28"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <!-- outer circle -->
          <circle cx="14" cy="14" r="11" stroke="currentColor" fill="none" stroke-width="1.4"/>
          <!-- cardinal ticks -->
          <line x1="14" y1="3"  x2="14" y2="7"  stroke="currentColor" stroke-width="1.4"/>
          <line x1="14" y1="21" x2="14" y2="25" stroke="currentColor" stroke-width="1.4"/>
          <line x1="3"  y1="14" x2="7"  y2="14" stroke="currentColor" stroke-width="1.4"/>
          <line x1="21" y1="14" x2="25" y2="14" stroke="currentColor" stroke-width="1.4"/>
          <!-- N needle (filled) -->
          <path d="M14,7 L16.5,13 L14,12 L11.5,13 Z" fill="currentColor" stroke="none"/>
          <!-- S needle (outline) -->
          <path d="M14,21 L11.5,15 L14,16 L16.5,15 Z"
                fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.6"/>
          <!-- center pin -->
          <circle cx="14" cy="14" r="1.5" fill="currentColor"/>
        </svg>

        <!-- Badge text + turn-count preview -->
        <div class="qc-header-text">
          <span class="qc-eyebrow">{{ badgeText }}</span>
          <span v-if="quest.turnCount" class="qc-turn-preview">{{ quest.turnCount }} Turns</span>
        </div>

      </header>

      <!-- ── Inset: recessed teal-dark content panel ── -->
      <div class="dungeon-qc__inset">

        <div class="dungeon-qc__body">

          <h3 class="qc-title">{{ quest.name }}</h3>

          <p v-if="quest.shortDescription" class="qc-summary">
            {{ quest.shortDescription }}
          </p>

          <p class="qc-description">{{ quest.description }}</p>

          <p v-if="quest.flavorText" class="qc-flavor">
            "{{ quest.flavorText }}"
          </p>

          <!-- Stats row — inline SVG icons (no emoji) -->
          <div v-if="hasStats" class="qc-stats">

            <div v-if="quest.turnCount" class="qc-stat">
              <!-- Hourglass: two converging trapezoids sharing a neck -->
              <svg class="qc-stat-icon" viewBox="0 0 14 14" aria-label="turns">
                <path d="M2,1 H12 L9,7 L12,13 H2 L5,7 Z"
                      fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <line x1="2" y1="1"  x2="12" y2="1"  stroke="currentColor" stroke-width="1.2"/>
                <line x1="2" y1="13" x2="12" y2="13" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              <span>{{ quest.turnCount }} Turns</span>
            </div>

            <div v-if="quest.stakeholderCount" class="qc-stat">
              <!-- Three overlapping circles: stakeholder group -->
              <svg class="qc-stat-icon" viewBox="0 0 18 12" aria-label="stakeholders">
                <circle cx="4"  cy="9" r="2.8" stroke="currentColor" fill="none" stroke-width="1.1"/>
                <circle cx="9"  cy="6" r="2.8" stroke="currentColor" fill="none" stroke-width="1.1"/>
                <circle cx="14" cy="9" r="2.8" stroke="currentColor" fill="none" stroke-width="1.1"/>
              </svg>
              <span>{{ quest.stakeholderCount }} Stakeholders</span>
            </div>

            <div v-if="quest.actionCardCount" class="qc-stat">
              <!-- Card with folded corner -->
              <svg class="qc-stat-icon" viewBox="0 0 12 14" aria-label="action cards">
                <path d="M1,2 H7 L11,5 V12 H1 Z"
                      fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <line x1="7"  y1="2" x2="7"  y2="5" stroke="currentColor" stroke-width="0.9"/>
                <line x1="7"  y1="5" x2="11" y2="5" stroke="currentColor" stroke-width="0.9"/>
              </svg>
              <span>{{ quest.actionCardCount }} Actions</span>
            </div>

          </div>
        </div>

        <!-- Footer: action label + selected check -->
        <footer class="dungeon-qc__footer">
          <span class="qc-action-label">{{ actionLabel }}</span>

          <!-- Selected checkmark icon -->
          <svg
            v-if="isSelected && !quest.isTutorial"
            class="qc-check-icon"
            viewBox="0 0 16 16"
            aria-label="selected"
          >
            <path d="M2,8 L6,12 L14,4"
                  stroke="currentColor" fill="none" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </footer>

      </div><!-- /inset -->
    </div><!-- /ring -->
  </button>
</template>

<script setup lang="ts">
/**
 * Quest selection card used in run setup and tutorial launch flows.
 */
import { computed } from 'vue'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'

const props = withDefaults(
  defineProps<{
    quest: QuestDisplayModel
    isSelected?: boolean
  }>(),
  { isSelected: false }
)

const emit = defineEmits<{
  select: []
  launch: []
}>()

const badgeText = computed(() =>
  props.quest.isTutorial
    ? `Tutorial ${props.quest.tutorialOrder ?? ''}`
    : 'Official Campaign'
)

const actionLabel = computed(() => {
  if (props.quest.isTutorial) return 'Enter Tutorial →'
  return props.isSelected ? '✓ Quest Selected' : 'Select Quest →'
})

const hasStats = computed(() =>
  !!(props.quest.turnCount || props.quest.stakeholderCount || props.quest.actionCardCount)
)

function handleClick() {
  if (props.quest.isTutorial) {
    emit('launch')
  } else {
    emit('select')
  }
}
</script>

<style scoped>
/*
  Component-local geometry tokens — scaled for a wide selection panel
  (larger than action card, smaller than full AppFrame modal).
  Bronze ring material, text, divider, and bracket tokens come from
  the global --dng-* namespace (dungeon-design-tokens.css).
*/
.dungeon-qc {
  --qc-chamfer:         8px;
  --qc-shell-gap:       3px;
  --qc-ring-v:          10px;
  --qc-ring-h:          12px;
  --qc-inset-chamfer:   6px;
  --qc-bracket-size:    14px;
  --qc-bracket-weight:  2px;
  --qc-bracket-inset:   5px;

  /* Header text on the bronze ring face — requires dark values (bronze is mid-light) */
  --qc-header-label: #2a1c06;
  --qc-header-sub:   #4a3212;

  /* Quest default inset: warm teal bloom */
  --qc-inset-bloom:   rgba(18, 62, 84, 0.38);
  --qc-inset-shimmer: rgba(20, 78, 100, 0.26);
  --qc-footer-label:  var(--dng-subtitle-warm, #7a6c44);
}

/* ── Tutorial variant: soft purple-tinted inset ── */
.dungeon-qc.is-tutorial {
  --qc-inset-bloom:   rgba(50, 28, 96, 0.32);
  --qc-inset-shimmer: rgba(100, 76, 196, 0.20);
  --dng-divider:      rgba(169, 137, 250, 0.28);
  --qc-footer-label:  #9880c8;
}

/* ── Outer shell ── */
.dungeon-qc {
  /* Reset browser button defaults */
  all: unset;
  box-sizing: border-box;

  display: block;
  width: 100%;
  cursor: pointer;
  position: relative;
  text-align: left;
  font-family: var(--font-body);

  border: 1px solid var(--dng-shell-border, #080502);
  padding: var(--qc-shell-gap);
  background: var(--dng-shell-bg, #0d0904);

  clip-path: polygon(
    var(--qc-chamfer)                      0%,
    calc(100% - var(--qc-chamfer))         0%,
    100%  var(--qc-chamfer),
    100%  calc(100% - var(--qc-chamfer)),
    calc(100% - var(--qc-chamfer))         100%,
    var(--qc-chamfer)                      100%,
    0%    calc(100% - var(--qc-chamfer)),
    0%    var(--qc-chamfer)
  );

  filter:
    drop-shadow(0 4px 14px rgba(0, 0, 0, 0.70))
    drop-shadow(0 2px  5px rgba(0, 0, 0, 0.46));

  transition: filter 0.18s ease;
}

.dungeon-qc:hover {
  filter:
    drop-shadow(0 6px 20px rgba(0, 0, 0, 0.85))
    drop-shadow(0 3px  8px rgba(0, 0, 0, 0.60));
}

.dungeon-qc:focus-visible {
  outline: 2px solid var(--border-focus, rgba(38, 212, 185, 0.70));
  outline-offset: 3px;
}

.dungeon-qc.is-selected {
  filter:
    drop-shadow(0 6px 20px rgba(0, 0, 0, 0.85))
    drop-shadow(0 0  20px rgba(200, 152, 36, 0.40));
}

/* ── Bronze ring ── */
.dungeon-qc__ring {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--dng-ring-gap, 8px);
  background: linear-gradient(
    to bottom,
    var(--dng-bronze-hi,   #c89824)   0%,
    var(--dng-bronze-mid,  #a07018)  40%,
    var(--dng-bronze-deep, #7a5510)  70%,
    var(--dng-bronze-low,  #6a4808) 100%
  );
  padding: var(--qc-ring-v) var(--qc-ring-h);
  border: 1px solid var(--dng-frame-outer, #160f02);
  box-shadow:
    inset 0 1px 0 var(--dng-ring-bevel-top,  rgba(200, 158, 48, 0.55)),
    inset 1px 0 0 var(--dng-ring-bevel-left, rgba(188, 144, 32, 0.30));
}

.dungeon-qc.is-selected .dungeon-qc__ring {
  box-shadow:
    inset 0 1px 0 rgba(220, 172, 60, 0.78),
    inset 1px 0 0 rgba(200, 155, 44, 0.48);
}

/* ── 4-corner L-bracket ornaments ── */
.qc-bracket {
  position: absolute;
  width: var(--qc-bracket-size);
  height: var(--qc-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.qc-bracket::before,
.qc-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket, rgba(196, 148, 34, 0.82));
}

.qc-bracket::before {
  height: var(--qc-bracket-weight);
  width:  var(--qc-bracket-size);
}
.qc-bracket::after {
  width:  var(--qc-bracket-weight);
  height: var(--qc-bracket-size);
}

.dungeon-qc.is-selected .qc-bracket::before,
.dungeon-qc.is-selected .qc-bracket::after {
  background: rgba(220, 172, 60, 0.96);
}

/* TL */
.qc-bracket--tl { top: var(--qc-bracket-inset); left: var(--qc-bracket-inset); }
.qc-bracket--tl::before { top: 0; left: 0; }
.qc-bracket--tl::after  { top: 0; left: 0; }

/* TR */
.qc-bracket--tr { top: var(--qc-bracket-inset); right: var(--qc-bracket-inset); }
.qc-bracket--tr::before { top: 0; right: 0; }
.qc-bracket--tr::after  { top: 0; right: 0; }

/* BL */
.qc-bracket--bl { bottom: var(--qc-bracket-inset); left: var(--qc-bracket-inset); }
.qc-bracket--bl::before { bottom: 0; left: 0; }
.qc-bracket--bl::after  { bottom: 0; left: 0; }

/* BR */
.qc-bracket--br { bottom: var(--qc-bracket-inset); right: var(--qc-bracket-inset); }
.qc-bracket--br::before { bottom: 0; right: 0; }
.qc-bracket--br::after  { bottom: 0; right: 0; }

/* ── Header: nameplate on ring face ── */
.dungeon-qc__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 8px);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--dng-divider, rgba(168, 120, 32, 0.35));
}

/* Sigil: dark on bronze (matching action card header pattern) */
.qc-sigil {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--qc-header-label);
  opacity: 0.86;
}

.qc-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Category eyebrow — dark warm brown on bronze */
.qc-eyebrow {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-2xs, 0.625rem);
  font-weight: var(--font-semibold, 600);
  letter-spacing: var(--tracking-widest, 0.12em);
  text-transform: uppercase;
  color: var(--qc-header-sub);
  line-height: 1;
}

.qc-turn-preview {
  font-size: var(--text-2xs, 0.625rem);
  color: var(--qc-header-label);
  opacity: 0.55;
  line-height: 1;
}

/* ── Inset: recessed teal content panel ── */
.dungeon-qc__inset {
  background:
    radial-gradient(
      ellipse 70% 32% at 50% 0%,
      var(--qc-inset-bloom)  0%,
      transparent           100%
    ),
    linear-gradient(
      to bottom,
      var(--dng-panel-top,     #0e2232)   0%,
      var(--dng-panel-surface, #0b1c24)  25%,
      var(--dng-panel-bottom,  #08171e) 100%
    );
  border: 1px solid var(--dng-panel-border, rgba(0, 0, 0, 0.85));
  display: flex;
  flex-direction: column;
  clip-path: polygon(
    var(--qc-inset-chamfer)                      0%,
    calc(100% - var(--qc-inset-chamfer))         0%,
    100%  var(--qc-inset-chamfer),
    100%  calc(100% - var(--qc-inset-chamfer)),
    calc(100% - var(--qc-inset-chamfer))         100%,
    var(--qc-inset-chamfer)                      100%,
    0%    calc(100% - var(--qc-inset-chamfer)),
    0%    var(--qc-inset-chamfer)
  );
  box-shadow: inset 0 1px 0 var(--qc-inset-shimmer);
}

/* ── Body content ── */
.dungeon-qc__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm, 8px);
  padding: var(--space-md, 12px) var(--space-md, 12px) var(--space-sm, 8px);
}

/* Quest title — large Cinzel gold on teal dark */
.qc-title {
  margin: 0;
  font-family: var(--font-heading, 'Cinzel', serif);
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-semibold, 600);
  color: var(--dng-title-gold, #d4b860);
  letter-spacing: var(--tracking-wide, 0.04em);
  line-height: var(--leading-tight, 1.2);
}

/* Tutorial title: slightly smaller, soft lavender */
.dungeon-qc.is-tutorial .qc-title {
  font-size: var(--text-base, 1rem);
  color: #c8b8e8;
}

/* Short summary — italic, muted gold ochre, inset side-accent */
.qc-summary {
  margin: 0;
  font-size: var(--text-sm, 0.875rem);
  font-style: italic;
  color: var(--dng-subtitle-warm, #7a6c44);
  line-height: var(--leading-snug, 1.35);
  padding: var(--space-sm, 8px) var(--space-sm, 8px) var(--space-sm, 8px) var(--space-md, 12px);
  background: rgba(0, 0, 0, 0.22);
  border-left: 2px solid var(--dng-divider, rgba(168, 120, 32, 0.35));
}

.qc-description {
  margin: 0;
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #7a6e54);
  line-height: var(--leading-relaxed, 1.65);
}

.qc-flavor {
  margin: 0;
  font-size: var(--text-xs, 0.75rem);
  font-style: italic;
  color: var(--dng-footer-muted, #5c7078);
  line-height: var(--leading-snug, 1.35);
}

/* ── Stats row ── */
.qc-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md, 12px);
  padding-top: var(--space-sm, 8px);
  border-top: 1px solid var(--dng-divider, rgba(168, 120, 32, 0.35));
  margin-top: auto;
}

.qc-stat {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--dng-footer-muted, #5c7078);
  font-size: var(--text-xs, 0.75rem);
  font-weight: var(--font-medium, 500);
}

.qc-stat-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ── Footer: action label ── */
.dungeon-qc__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm, 8px);
  padding: var(--space-sm, 8px) var(--space-md, 12px);
  background: var(--dng-panel-footer, #091620);
  border-top: 1px solid var(--dng-divider, rgba(168, 120, 32, 0.35));
}

.qc-action-label {
  font-family: var(--font-body);
  font-size: var(--text-xs, 0.75rem);
  font-weight: var(--font-semibold, 600);
  letter-spacing: var(--tracking-wider, 0.08em);
  text-transform: uppercase;
  color: var(--qc-footer-label);
  transition: color 0.15s ease;
}

.dungeon-qc:hover .qc-action-label {
  color: var(--dng-title-gold, #d4b860);
}

.dungeon-qc.is-tutorial:hover .qc-action-label {
  color: #c8b8e8;
}

.dungeon-qc.is-selected .qc-action-label {
  color: var(--dng-title-gold, #d4b860);
}

.qc-check-icon {
  width: 16px;
  height: 16px;
  color: var(--dng-title-gold, #d4b860);
  flex-shrink: 0;
}
</style>
