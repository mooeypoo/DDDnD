<template>
  <!--
    AppButton — interactive action button in the dungeon-console family.

    Promoted from DungeonButtonPrototype. Key change from the prototype:
    disabled state is driven by a dedicated boolean `disabled` prop that sets
    the native HTML disabled attribute, rather than via variant="disabled".
    The visual token overrides are triggered by the native :disabled pseudo-class,
    so hover, focus-visible, and active states are suppressed automatically by
    the browser without needing :not(.variant-disabled) guards.

    Structural layers (outer → inner):
      1. .dungeon-btn (<button>)  outer shell — chamfered clip-path, dark shell, drop-shadow
      2. .dungeon-btn__ring       bronze ring — same cast-metal gradient as AppFrame
      3. .dungeon-btn-bracket × 4 L-bracket corner ornaments at button scale (10px/2px)
      4. .dungeon-btn__face       dark plate — directional bevel borders carry variant signal
      5. .dungeon-btn__label      label text — uppercase, tracked, engraved-gold tone
  -->
  <button
    class="dungeon-btn"
    :class="`variant-${variant}`"
    :disabled="disabled"
    type="button"
  >
    <span class="dungeon-btn__ring">
      <span class="dungeon-btn-bracket dungeon-btn-bracket--tl" aria-hidden="true" />
      <span class="dungeon-btn-bracket dungeon-btn-bracket--tr" aria-hidden="true" />
      <span class="dungeon-btn-bracket dungeon-btn-bracket--bl" aria-hidden="true" />
      <span class="dungeon-btn-bracket dungeon-btn-bracket--br" aria-hidden="true" />

      <span class="dungeon-btn__face">
        <span class="dungeon-btn__label">
          <slot>{{ label }}</slot>
        </span>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    /**
     * primary   — main affirm/proceed action. Teal plate bevel, teal brackets.
     * secondary — supporting/neutral action. Standard warm plate bevel, gold label.
     * subtle    — lowest-priority action. Dimmed ring, muted label.
     * warning   — caution/destructive action. Amber plate bevel, amber label.
     */
    variant?: 'primary' | 'secondary' | 'subtle' | 'warning'
    /**
     * Disables the button. Sets the native HTML disabled attribute and applies
     * the unavailable visual state (flat ring, reduced opacity, no interaction).
     */
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    disabled: false,
  }
)
</script>

<style scoped>
/*
  Base --dng-* tokens come from src/ui/prototypes/dungeon/dungeon-design-tokens.css,
  loaded globally via src/ui/styles/design-system.css → App.vue.
  Do NOT @import it here — see AppFrame.vue for the reason.

  System tokens reused from production:
    --font-heading, --font-body
    --text-sm, --font-semibold, --tracking-wider
    --leading-none (unused but available)
*/


/* ─────────────────────────────────────────────────────────────
   PRIMARY VARIANT — affirm / proceed / main action

   Teal signal lives at the plate bevel edges and bracket mounts.
   Bronze ring is unchanged — still a full-weight bronze frame.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn.variant-primary {
  --dng-plate-top:     rgba(25, 180, 155, 0.48);
  --dng-plate-left:    rgba(20, 150, 128, 0.36);
  --dng-plate-right:   rgba( 0,   0,   0, 0.38);
  --dng-plate-bottom:  rgba(22, 175, 150, 0.64);
  --dng-plate-shimmer: rgba(22, 190, 162, 0.34);
  --dng-bracket:       rgba(38, 212, 188, 0.82);
}


/* ─────────────────────────────────────────────────────────────
   SECONDARY VARIANT — supporting / neutral action

   Standard warm plate borders (base tokens, no override).
   Label uses --dng-title-gold (warm gold, same priority read as
   the frame nameplate title).
   ───────────────────────────────────────────────────────────── */
.dungeon-btn.variant-secondary {
  --dng-btn-label-color: var(--dng-title-gold);
}


/* ─────────────────────────────────────────────────────────────
   SUBTLE VARIANT — lowest-priority / tertiary action

   Flattened bronze ring, near-invisible plate borders, muted label.
   Reads as less reflective metal — physically dimmer.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn.variant-subtle {
  --dng-bronze-hi:    #967014;
  --dng-bronze-mid:   #7a5810;
  --dng-bronze-deep:  #5a400a;
  --dng-bronze-low:   #4c3608;

  --dng-ring-bevel-top:  rgba(120, 88, 16, 0.22);
  --dng-ring-bevel-left: rgba(100, 74, 12, 0.12);

  --dng-plate-top:     rgba(90, 64, 10, 0.26);
  --dng-plate-left:    rgba(78, 56,  8, 0.20);
  --dng-plate-right:   rgba( 0,  0,  0, 0.24);
  --dng-plate-bottom:  rgba(68, 48,  8, 0.38);
  --dng-plate-shimmer: rgba(56, 40,  6, 0.08);

  --dng-btn-label-color: var(--dng-subtitle-warm);
  --dng-bracket:         rgba(148, 112, 22, 0.52);
}


/* ─────────────────────────────────────────────────────────────
   WARNING VARIANT — caution / destructive action

   Amber signal at the plate bevel edges. Bronze ring unchanged.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn.variant-warning {
  --dng-plate-top:     var(--dng-warning-plate-top);
  --dng-plate-left:    var(--dng-warning-plate-left);
  --dng-plate-right:   var(--dng-warning-plate-right);
  --dng-plate-bottom:  var(--dng-warning-plate-bottom);
  --dng-plate-shimmer: var(--dng-warning-shimmer);
  --dng-btn-label-color: var(--dng-warning-label);
  --dng-bracket:       var(--dng-warning-bracket);
}


/* ─────────────────────────────────────────────────────────────
   DISABLED STATE — driven by the native HTML :disabled attribute

   opacity: 0.42 — the button reads as physically inert.
   pointer-events: none — belt-and-suspenders on top of the native
   disabled attribute (prevents hover states in some edge cases).
   Flat bronze ring, near-invisible plate borders.

   The :disabled pseudo-class is set by the browser when the native
   disabled attribute is present, so hover/active/focus-visible
   guards using :not(:disabled) work automatically.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  pointer-events: none;

  --dng-bronze-hi:    #846010;
  --dng-bronze-mid:   #6a4c0c;
  --dng-bronze-deep:  #4e3808;
  --dng-bronze-low:   #3e2c06;
  --dng-ring-bevel-top:  rgba(100, 72, 12, 0.16);
  --dng-ring-bevel-left: rgba( 80, 58,  8, 0.08);

  --dng-plate-top:     rgba(70, 50, 8, 0.22);
  --dng-plate-left:    rgba(60, 44, 6, 0.18);
  --dng-plate-right:   rgba( 0,  0, 0, 0.20);
  --dng-plate-bottom:  rgba(52, 36, 6, 0.30);
  --dng-plate-shimmer: rgba(40, 28, 4, 0.06);

  --dng-btn-label-color: var(--dng-subtitle-warm);
  --dng-bracket:         rgba(100, 76, 14, 0.38);
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL — the <button> element is the shell

   clip-path: 5px chamfer — smaller than AppFrame (8px) to suit
   button proportions. filter: drop-shadow follows the clip-path.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn {
  /* Browser reset */
  appearance: none;
  -webkit-appearance: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  outline: none;
  cursor: pointer;
  background: none;

  /* Shell layout */
  display: inline-flex;
  align-items: stretch;
  min-width: 80px;

  padding: var(--dng-shell-gap);
  background: var(--dng-shell-bg);
  border: 1px solid var(--dng-shell-border);

  clip-path: polygon(
    var(--dng-btn-chamfer)                   0%,
    calc(100% - var(--dng-btn-chamfer))       0%,
    100%                                      var(--dng-btn-chamfer),
    100%                                      calc(100% - var(--dng-btn-chamfer)),
    calc(100% - var(--dng-btn-chamfer))       100%,
    var(--dng-btn-chamfer)                   100%,
    0%                                        calc(100% - var(--dng-btn-chamfer)),
    0%                                        var(--dng-btn-chamfer)
  );

  filter:
    drop-shadow(0 6px 16px rgba(0, 0, 0, 0.78))
    drop-shadow(0 2px  5px rgba(0, 0, 0, 0.60))
    drop-shadow(0 1px  2px rgba(0, 0, 0, 0.45));

  transition:
    filter   120ms ease-out,
    transform 80ms ease-out;
}

/* ─── HOVER (enabled only) ───────────────────────────────── */
.dungeon-btn:not(:disabled):hover {
  filter:
    drop-shadow(0 8px 20px rgba(0, 0, 0, 0.84))
    drop-shadow(0 3px  8px rgba(0, 0, 0, 0.66))
    drop-shadow(0 1px  3px rgba(0, 0, 0, 0.52))
    brightness(1.07);
}

/* ─── HOVER — primary teal glow ──────────────────────────── */
.dungeon-btn.variant-primary:not(:disabled):hover {
  filter:
    drop-shadow(0 8px 20px rgba(0, 0, 0, 0.84))
    drop-shadow(0 0   6px rgba(38, 210, 185, 0.28))
    brightness(1.06);
}

/* ─── HOVER — warning amber glow ────────────────────────── */
.dungeon-btn.variant-warning:not(:disabled):hover {
  filter:
    drop-shadow(0 8px 20px rgba(0, 0, 0, 0.84))
    drop-shadow(0 0   6px rgba(200, 128, 24, 0.34))
    brightness(1.06);
}

/* ─── ACTIVE / PRESSED ───────────────────────────────────── */
.dungeon-btn:not(:disabled):active {
  transform: translateY(1px);
  filter:
    drop-shadow(0 3px  8px rgba(0, 0, 0, 0.70))
    drop-shadow(0 1px  2px rgba(0, 0, 0, 0.52));
}

/* ─── FOCUS-VISIBLE — teal glow (follows clip-path via filter) ── */
.dungeon-btn:not(:disabled):focus-visible {
  filter:
    drop-shadow(0 6px 16px rgba(0, 0, 0, 0.78))
    drop-shadow(0 2px  5px rgba(0, 0, 0, 0.60))
    drop-shadow(0 0    0  3px rgba(38, 210, 185, 0.70));
}


/* ─────────────────────────────────────────────────────────────
   BRONZE RING

   Asymmetric padding: 7px vertical, 14px horizontal —
   buttons are wider than tall.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn__ring {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 1;

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

  padding: var(--dng-btn-ring-v) var(--dng-btn-ring-h);
  border: 1px solid var(--dng-frame-outer);

  box-shadow:
    inset 0  2px 0 var(--dng-ring-bevel-top),
    inset 0 -2px 0 rgba(0, 0, 0, 0.55),
    inset 1px  0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.32);
}


/* ─────────────────────────────────────────────────────────────
   CORNER L-BRACKETS — at button scale (10px / 2px)
   ───────────────────────────────────────────────────────────── */
.dungeon-btn-bracket {
  position: absolute;
  width: var(--dng-btn-bracket-size);
  height: var(--dng-btn-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.dungeon-btn-bracket::before,
.dungeon-btn-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket);
}

.dungeon-btn-bracket::before { height: var(--dng-btn-bracket-weight); width: var(--dng-btn-bracket-size); }
.dungeon-btn-bracket::after  { width: var(--dng-btn-bracket-weight);  height: var(--dng-btn-bracket-size); }

.dungeon-btn-bracket--tl { top: var(--dng-btn-bracket-inset); left: var(--dng-btn-bracket-inset); }
.dungeon-btn-bracket--tl::before { top: 0; left: 0; }
.dungeon-btn-bracket--tl::after  { top: 0; left: 0; }

.dungeon-btn-bracket--tr { top: var(--dng-btn-bracket-inset); right: var(--dng-btn-bracket-inset); }
.dungeon-btn-bracket--tr::before { top: 0; right: 0; }
.dungeon-btn-bracket--tr::after  { top: 0; right: 0; }

.dungeon-btn-bracket--bl { bottom: var(--dng-btn-bracket-inset); left: var(--dng-btn-bracket-inset); }
.dungeon-btn-bracket--bl::before { bottom: 0; left: 0; }
.dungeon-btn-bracket--bl::after  { bottom: 0; left: 0; }

.dungeon-btn-bracket--br { bottom: var(--dng-btn-bracket-inset); right: var(--dng-btn-bracket-inset); }
.dungeon-btn-bracket--br::before { bottom: 0; right: 0; }
.dungeon-btn-bracket--br::after  { bottom: 0; right: 0; }


/* ─────────────────────────────────────────────────────────────
   FACE PLATE — dark label surface on the bronze ring
   ───────────────────────────────────────────────────────────── */
.dungeon-btn__face {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  white-space: nowrap;
  padding: 7px 16px;

  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-mid)  24%,
    var(--dng-plate-bg-base) 100%
  );

  border-top:    1px solid var(--dng-plate-top);
  border-left:   2px solid var(--dng-plate-left);
  border-right:  2px solid var(--dng-plate-right);
  border-bottom: 1px solid var(--dng-plate-bottom);

  box-shadow:
    inset 0 1px 5px rgba(0, 0, 0, 0.62),
    0 1px 0 var(--dng-plate-shimmer);
}


/* ─────────────────────────────────────────────────────────────
   LABEL — text on the dark plate
   ───────────────────────────────────────────────────────────── */
.dungeon-btn__label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--dng-btn-label-color, var(--dng-title-gold));
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  line-height: 1;
  user-select: none;
}
</style>
