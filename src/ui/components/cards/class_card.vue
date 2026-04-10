<template>
  <!--
    ClassCard — dungeon-vocabulary selection tile for player classes.

    Visual layers (outer → inner):
      Shell (chamfer=8px) →
      Bronze ring (4-stop gradient, directional bevel, 4 L-brackets) →
      Accent stripe (class-specific color band at top of ring face) →
      Portrait slot (ClassPortrait, class accent glow) →
      Inset (teal-dark panel, class-accented bloom) →
        Body: class name / description / flavor text
        Footer: action label + selected checkmark

    The whole card IS the interactive element (button root) — no nested buttons.
    Emits `select` on click.
    Selected state: gold glow filter, brighter ring/brackets, gold action label.
  -->
  <button
    class="dungeon-cc"
    :class="{ 'is-selected': isSelected }"
    type="button"
    :style="{
      '--cc-accent': accentColor,
      '--cc-accent-dim': `color-mix(in srgb, ${accentColor} 35%, transparent)`,
      '--cc-accent-mid': `color-mix(in srgb, ${accentColor} 60%, #0d0904)`,
    }"
    @click="emit('select')"
  >
    <div class="dungeon-cc__ring">

      <!-- ── 4 corner L-bracket ornaments ── -->
      <span class="cc-bracket cc-bracket--tl" aria-hidden="true" />
      <span class="cc-bracket cc-bracket--tr" aria-hidden="true" />
      <span class="cc-bracket cc-bracket--bl" aria-hidden="true" />
      <span class="cc-bracket cc-bracket--br" aria-hidden="true" />

      <!-- ── Accent band: thin class-color stripe on ring face ── -->
      <div class="dungeon-cc__accent-stripe" aria-hidden="true" />

      <!-- ── Portrait slot ── -->
      <div class="dungeon-cc__portrait-slot">
        <ClassPortrait
          :classId="playerClass.id"
          :className="playerClass.name"
          size="lg"
        />
      </div>

      <!-- ── Inset panel ── -->
      <div class="dungeon-cc__inset">
        <div class="dungeon-cc__body">

          <h3 class="cc-name">{{ playerClass.name }}</h3>

          <p class="cc-description">{{ playerClass.description }}</p>

          <p v-if="playerClass.flavor_text" class="cc-flavor">
            "{{ playerClass.flavor_text }}"
          </p>

        </div>

        <footer class="dungeon-cc__footer">
          <span class="cc-action-label">{{ actionLabel }}</span>

          <svg
            v-if="isSelected"
            class="cc-check-icon"
            viewBox="0 0 16 16"
            aria-label="selected"
          >
            <path
              d="M2,8 L6,12 L14,4"
              stroke="currentColor" fill="none" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            />
          </svg>
        </footer>
      </div>

    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerClass } from '@/domains/content/model'
import { getClassAccentColor } from '@/ui/composables/class_artwork'
import ClassPortrait from '@/ui/components/common/class_portrait.vue'

const props = withDefaults(
  defineProps<{
    playerClass: PlayerClass
    isSelected?: boolean
  }>(),
  { isSelected: false }
)

const emit = defineEmits<{
  select: []
}>()

const accentColor = computed(() => getClassAccentColor(props.playerClass.id))

const actionLabel = computed(() =>
  props.isSelected ? '✓ Class Selected' : 'Choose Class →'
)
</script>

<style scoped>
/*
  Component-local geometry tokens.
  Bronze ring material comes from global --dng-* tokens.
  The class-specific accent color is injected via CSS custom property
  on the root element: --cc-accent (bright), --cc-accent-dim (transparent),
  --cc-accent-mid (darkened, for inset bloom).
*/
.dungeon-cc {
  --cc-chamfer:         8px;
  --cc-shell-gap:       3px;
  --cc-ring-v:          10px;
  --cc-ring-h:          12px;
  --cc-inset-chamfer:   6px;
  --cc-bracket-size:    14px;
  --cc-bracket-weight:  2px;
  --cc-bracket-inset:   5px;
  --cc-stripe-height:   3px;

  /* Header text on bronze face */
  --cc-header-label: #2a1c06;
  --cc-header-sub:   #4a3212;

  /* Footer action color (inactive state) */
  --cc-footer-label: var(--dng-subtitle-warm, #7a6c44);
}

/* ── Outer shell ── */
.dungeon-cc {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 100%;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);

  border: 1px solid var(--dng-shell-border, #080502);
  padding: var(--cc-shell-gap);
  background: var(--dng-shell-bg, #0d0904);

  clip-path: polygon(
    var(--cc-chamfer)                      0%,
    calc(100% - var(--cc-chamfer))         0%,
    100%  var(--cc-chamfer),
    100%  calc(100% - var(--cc-chamfer)),
    calc(100% - var(--cc-chamfer))         100%,
    var(--cc-chamfer)                      100%,
    0%    calc(100% - var(--cc-chamfer)),
    0%    var(--cc-chamfer)
  );

  filter:
    drop-shadow(0 4px 14px rgba(0, 0, 0, 0.70))
    drop-shadow(0 2px  5px rgba(0, 0, 0, 0.46));

  transition: filter 0.18s ease;
}

.dungeon-cc:hover {
  filter:
    drop-shadow(0 6px 20px rgba(0, 0, 0, 0.85))
    drop-shadow(0 0  12px var(--cc-accent-dim));
}

.dungeon-cc:focus-visible {
  outline: 2px solid var(--border-focus, rgba(38, 212, 185, 0.70));
  outline-offset: 3px;
}

.dungeon-cc.is-selected {
  filter:
    drop-shadow(0 6px 20px rgba(0, 0, 0, 0.85))
    drop-shadow(0 0  22px var(--cc-accent-dim));
}

/* ── Bronze ring ── */
.dungeon-cc__ring {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(
    to bottom,
    var(--dng-bronze-hi,   #c89824)   0%,
    var(--dng-bronze-mid,  #a07018)  40%,
    var(--dng-bronze-deep, #7a5510)  70%,
    var(--dng-bronze-low,  #6a4808) 100%
  );
  padding: var(--cc-ring-v) var(--cc-ring-h);
  border: 1px solid var(--dng-frame-outer, #160f02);
  box-shadow:
    inset 0 1px 0 var(--dng-ring-bevel-top,  rgba(200, 158, 48, 0.55)),
    inset 1px 0 0 var(--dng-ring-bevel-left, rgba(188, 144, 32, 0.30));
}

.dungeon-cc.is-selected .dungeon-cc__ring {
  box-shadow:
    inset 0 1px 0 rgba(220, 172, 60, 0.78),
    inset 1px 0 0 rgba(200, 155, 44, 0.48);
}

/* ── 4-corner L-bracket ornaments ── */
.cc-bracket {
  position: absolute;
  width: var(--cc-bracket-size);
  height: var(--cc-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.cc-bracket::before,
.cc-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket, rgba(196, 148, 34, 0.82));
}

.cc-bracket::before {
  height: var(--cc-bracket-weight);
  width:  var(--cc-bracket-size);
}
.cc-bracket::after {
  width:  var(--cc-bracket-weight);
  height: var(--cc-bracket-size);
}

.dungeon-cc.is-selected .cc-bracket::before,
.dungeon-cc.is-selected .cc-bracket::after {
  background: rgba(220, 172, 60, 0.96);
}

.cc-bracket--tl { top: var(--cc-bracket-inset); left: var(--cc-bracket-inset); }
.cc-bracket--tl::before { top: 0; left: 0; }
.cc-bracket--tl::after  { top: 0; left: 0; }

.cc-bracket--tr { top: var(--cc-bracket-inset); right: var(--cc-bracket-inset); }
.cc-bracket--tr::before { top: 0; right: 0; }
.cc-bracket--tr::after  { top: 0; right: 0; }

.cc-bracket--bl { bottom: var(--cc-bracket-inset); left: var(--cc-bracket-inset); }
.cc-bracket--bl::before { bottom: 0; left: 0; }
.cc-bracket--bl::after  { bottom: 0; left: 0; }

.cc-bracket--br { bottom: var(--cc-bracket-inset); right: var(--cc-bracket-inset); }
.cc-bracket--br::before { bottom: 0; right: 0; }
.cc-bracket--br::after  { bottom: 0; right: 0; }

/* ── Accent stripe: thin class-color line at top of ring face ── */
.dungeon-cc__accent-stripe {
  width: 100%;
  height: var(--cc-stripe-height);
  background: var(--cc-accent);
  box-shadow: 0 0 8px var(--cc-accent-dim);
  margin-bottom: var(--space-md, 12px);
  border-radius: 1px;
  opacity: 0.78;
}

/* ── Portrait slot ── */
.dungeon-cc__portrait-slot {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-md, 12px);
  transition: transform 0.18s ease;
}

.dungeon-cc:hover .dungeon-cc__portrait-slot {
  transform: scale(1.06);
}

/* ── Inset panel ── */
.dungeon-cc__inset {
  width: 100%;
  background:
    radial-gradient(
      ellipse 60% 30% at 50% 0%,
      var(--cc-accent-dim) 0%,
      transparent       100%
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
    var(--cc-inset-chamfer)                      0%,
    calc(100% - var(--cc-inset-chamfer))         0%,
    100%  var(--cc-inset-chamfer),
    100%  calc(100% - var(--cc-inset-chamfer)),
    calc(100% - var(--cc-inset-chamfer))         100%,
    var(--cc-inset-chamfer)                      100%,
    0%    calc(100% - var(--cc-inset-chamfer)),
    0%    var(--cc-inset-chamfer)
  );
  box-shadow: inset 0 1px 0 var(--cc-accent-dim);
}

/* ── Body content ── */
.dungeon-cc__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm, 8px);
  padding: var(--space-md, 12px) var(--space-md, 12px) var(--space-sm, 8px);
  text-align: center;
}

.cc-name {
  margin: 0;
  font-family: var(--font-heading, 'Cinzel', serif);
  font-size: var(--text-base, 1rem);
  font-weight: var(--font-semibold, 600);
  color: var(--cc-accent);
  letter-spacing: var(--tracking-wide, 0.04em);
  line-height: var(--leading-tight, 1.2);
}

.cc-description {
  margin: 0;
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #7a6e54);
  line-height: var(--leading-snug, 1.35);
}

.cc-flavor {
  margin: 0;
  font-size: var(--text-xs, 0.75rem);
  font-style: italic;
  color: var(--dng-footer-muted, #5c7078);
  line-height: var(--leading-snug, 1.35);
}

/* ── Footer ── */
.dungeon-cc__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm, 8px);
  padding: var(--space-sm, 8px) var(--space-md, 12px);
  background: var(--dng-panel-footer, #091620);
  border-top: 1px solid var(--dng-divider, rgba(168, 120, 32, 0.35));
}

.cc-action-label {
  font-family: var(--font-body);
  font-size: var(--text-xs, 0.75rem);
  font-weight: var(--font-semibold, 600);
  letter-spacing: var(--tracking-wider, 0.08em);
  text-transform: uppercase;
  color: var(--cc-footer-label);
  transition: color 0.15s ease;
}

.dungeon-cc:hover .cc-action-label {
  color: var(--cc-accent);
}

.dungeon-cc.is-selected .cc-action-label {
  color: var(--cc-accent);
}

.cc-check-icon {
  width: 16px;
  height: 16px;
  color: var(--cc-accent);
  flex-shrink: 0;
}
</style>
