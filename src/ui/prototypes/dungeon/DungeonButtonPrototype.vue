<template>
  <!--
    DungeonButtonPrototype — interactive action button in the dungeon-console family.

    Structural layers (outer → inner):

      1. dungeon-btn (the <button> element itself)
                              outer shell — chamfered clip-path octagon,
                              dark shell background, ambient drop-shadow.
                              Directly analogous to the outer shell of
                              DungeonFramePrototype and DungeonModalPrototype.

      2. dungeon-btn__ring    bronze ring — same cast-metal gradient as the frame
                              and modal rings. Padding produces the visible bronze
                              thickness on all four sides. Box-shadow carries the
                              directional face bevel (top-bright, bottom-shadow).
                              Bottom brackets anchor here.

      3. dungeon-btn-bracket × 4
                              L-bracket corner ornaments — scaled down from the
                              frame's 16px/3px to 10px/2px for button proportions.
                              Same construction and positioning logic as the frame.

      4. dungeon-btn__face    dark plate — the primary label surface. Directly
                              analogous to the nameplate in DungeonFramePrototype
                              and the header cap / action plate in DungeonModalPrototype.
                              Same plate gradient + directional bevel borders.
                              All variant state differences are expressed here.

      5. dungeon-btn__label   text span — sits on the dark plate. Typography
                              mirrors the frame nameplate title conventions.

    Structural relationship to the frame family:
      · The outer shell clip-path and drop-shadow strategy are identical to the
        frame and modal. The chamfer is 5px (vs 8px frame, 10px modal) to suit
        button proportions.
      · The bronze ring gradient is the same. Padding is asymmetric (7px vertical,
        14px horizontal) vs the frame's uniform 12px — buttons are wider than tall.
      · The face plate reuses the plate gradient + directional bevel border strategy
        from the nameplate (frame) and action plate (modal) exactly. Variant
        differences follow the same token-override pattern as the frame's aged/accent
        variant blocks.
      · There is no inset/teal zone on the button. The single-zone structure
        (ring → face) is the minimal dungeon-console clickable unit. The frame's
        two-zone structure (ring → nameplate bridge → inset) would be disproportionate
        at button scale.
  -->
  <button
    class="dungeon-btn"
    :class="`variant-${variant}`"
    :disabled="variant === 'disabled'"
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
     * disabled  — unavailable state. Flat, low-opacity, no interaction.
     */
    variant?: 'primary' | 'secondary' | 'subtle' | 'warning' | 'disabled'
  }>(),
  { variant: 'primary' }
)
</script>

<style scoped>
/*
  Base --dng-* tokens are defined in ./dungeon-design-tokens.css.
  That file is loaded globally via .storybook/preview.ts (Storybook)
  and will be loaded via main.ts when app integration begins.
  Do NOT @import it here — an @import inside <style scoped> causes
  the imported rules to be injected as a separate global stylesheet
  after the scoped rules, which flattens the variant overrides.

  System tokens reused from production:
    --font-heading, --font-body
    --text-xs, --text-sm, --tracking-wide, --tracking-wider
    --font-semibold, --leading-none
*/


/* ─────────────────────────────────────────────────────────────
   PRIMARY VARIANT — affirm / proceed / main action

   Signal strategy:
   · Bronze ring is unchanged — still a full-weight bronze frame.
   · Teal signal lives at the plate bevel edges and bracket mounts.
   · Plate bevel: top/bottom shift to teal (resonance border).
   · Shimmer below plate: teal bleeds into any visible bronze gap.
   · Bracket mounts shift to teal — four corner points glow.
   Same strategy as the frame/modal accent variant, but isolated
   to the face plate layer rather than dividers + panel boundary.
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

   Signal strategy:
   · Standard warm plate borders (base tokens, no override).
   · Label uses --dng-subtitle-warm (warmer, lower contrast than
     --dng-title-gold) to read as secondary priority.
   · Bronze ring is unchanged — identical material to primary.
   The only structural difference from primary is the plate bevel
   signal (warm vs teal) and the slightly quieter label tone.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn.variant-secondary {
  --dng-btn-label-color: var(--dng-title-gold);
}


/* ─────────────────────────────────────────────────────────────
   SUBTLE VARIANT — lowest-priority / tertiary action

   Signal strategy:
   · Flatten the bronze ring: darker gradient stops, weaker bevel
     face highlights. Ring reads as less reflective — physically
     dimmer without changing shape.
   · Plate borders are near-invisible: this face looks recessed
     rather than raised.
   · Label shifts to --dng-subtitle-warm (muted ochre).
   · Bracket opacity drops to ~52% — barely catching light.
   Same approach as the aged variant on frame/modal but tuned
   for the button scale where every detail is proportionally larger.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn.variant-subtle {
  /* Flatter, darker ring bronze */
  --dng-bronze-hi:    #967014;
  --dng-bronze-mid:   #7a5810;
  --dng-bronze-deep:  #5a400a;
  --dng-bronze-low:   #4c3608;

  /* Near-flat ring face — almost no directional highlight */
  --dng-ring-bevel-top:  rgba(120, 88, 16, 0.22);
  --dng-ring-bevel-left: rgba(100, 74, 12, 0.12);

  /* Near-invisible plate borders — face reads as flush with ring */
  --dng-plate-top:     rgba(90, 64, 10, 0.26);
  --dng-plate-left:    rgba(78, 56,  8, 0.20);
  --dng-plate-right:   rgba( 0,  0,  0, 0.24);
  --dng-plate-bottom:  rgba(68, 48,  8, 0.38);
  --dng-plate-shimmer: rgba(56, 40,  6, 0.08);

  /* Muted label and bracket */
  --dng-btn-label-color: var(--dng-subtitle-warm);
  --dng-bracket:         rgba(148, 112, 22, 0.52);
}


/* ─────────────────────────────────────────────────────────────
   WARNING VARIANT — caution / destructive action

   Signal strategy:
   · Bronze ring is unchanged — still a bronze frame.
   · Amber/orange signal lives at the plate bevel edges only.
   · Plate borders: all four use --dng-warning-* tokens (amber
     shifted from the normal bronze-gold tone toward orange).
   · Label: --dng-warning-label (warm amber, distinct from gold).
   · Bracket: --dng-warning-bracket (bright amber mounts).
   The amber signal occupies the same structural layer (plate bevel)
   as teal does in primary — not the ring itself.
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
   DISABLED VARIANT — unavailable / inactive state

   Signal strategy:
   · Reduce overall opacity to 0.42 — the button reads as
     physically inert, not just dimmed.
   · Flatten the bronze: same token overrides as subtle but taken
     further. The ring barely reads as metal.
   · Plate borders near-invisible.
   · Cursor: default — not-allowed (HTML disabled does this
     natively; this reinforces across pointer types).
   · No hover / active state — pointer-events: none.
   ───────────────────────────────────────────────────────────── */
.dungeon-btn.variant-disabled,
.dungeon-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  pointer-events: none;

  --dng-bronze-hi:    #846010;
  --dng-bronze-mid:   #6a4c0c;
  --dng-bronze-deep:  #4e3808;
  --dng-bronze-low:   #3e2c06;
  --dng-ring-bevel-top:  rgba(100, 72, 12, 0.16);
  --dng-ring-bevel-left: rgba(80, 58, 8, 0.08);

  --dng-plate-top:     rgba(70, 50, 8, 0.22);
  --dng-plate-left:    rgba(60, 44, 6, 0.18);
  --dng-plate-right:   rgba(0, 0, 0, 0.20);
  --dng-plate-bottom:  rgba(52, 36, 6, 0.30);
  --dng-plate-shimmer: rgba(40, 28, 4, 0.06);

  --dng-btn-label-color: var(--dng-subtitle-warm);
  --dng-bracket:         rgba(100, 76, 14, 0.38);
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL — the <button> element is the shell

   The clip-path octagon immediately breaks the rectangular
   browser-button silhouette. --dng-btn-chamfer (5px) is smaller
   than the frame's (8px) and modal's (10px) to suit button scale.

   filter: drop-shadow follows the clip-path shape — the ambient
   depth cast is also an octagon, matching the frame and modal.

   Browser button reset: appearance, padding, font — all reset
   so the visual layers fully override the native button look.
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

  /* Dark shell gap — padding creates the visible dark strip */
  padding: var(--dng-shell-gap);   /* 3px */
  background: var(--dng-shell-bg);
  border: 1px solid var(--dng-shell-border);

  /* Chamfered corners — 5px cut at each corner */
  clip-path: polygon(
    var(--dng-btn-chamfer)                    0%,
    calc(100% - var(--dng-btn-chamfer))        0%,
    100%                                       var(--dng-btn-chamfer),
    100%                                       calc(100% - var(--dng-btn-chamfer)),
    calc(100% - var(--dng-btn-chamfer))        100%,
    var(--dng-btn-chamfer)                    100%,
    0%                                         calc(100% - var(--dng-btn-chamfer)),
    0%                                         var(--dng-btn-chamfer)
  );

  /* Ambient depth follows the chamfer silhouette */
  filter:
    drop-shadow(0 6px 16px rgba(0, 0, 0, 0.78))
    drop-shadow(0 2px  5px rgba(0, 0, 0, 0.60))
    drop-shadow(0 1px  2px rgba(0, 0, 0, 0.45));

  /* State transitions */
  transition:
    filter 120ms ease-out,
    transform 80ms ease-out;
}

/* ─── HOVER (enabled only) ────────────────────────────────── */
.dungeon-btn:not(:disabled):not(.variant-disabled):hover {
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
.dungeon-btn:not(:disabled):not(.variant-disabled):active {
  transform: translateY(1px);
  filter:
    drop-shadow(0 3px  8px rgba(0, 0, 0, 0.70))
    drop-shadow(0 1px  2px rgba(0, 0, 0, 0.52));
}

/* ─── FOCUS-VISIBLE — teal glow (follows clip-path via filter) ── */
.dungeon-btn:not(:disabled):not(.variant-disabled):focus-visible {
  filter:
    drop-shadow(0 6px 16px rgba(0, 0, 0, 0.78))
    drop-shadow(0 2px  5px rgba(0, 0, 0, 0.60))
    drop-shadow(0 0    0  3px rgba(38, 210, 185, 0.70));
}


/* ─────────────────────────────────────────────────────────────
   BRONZE RING — cast-metal frame surface

   Identical gradient strategy to the frame and modal rings.
   Padding is asymmetric: 7px vertical, 14px horizontal — buttons
   are wider than tall, so the horizontal bronze band reads thicker
   while the vertical band remains proportionate to button height.

   gap: 0 — there is only one child (the face plate); no bronze
   seam bridge is needed here unlike the frame (nameplate → inset).

   box-shadow carries the directional face bevel only.
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
   CORNER L-BRACKETS — structural mount points at button scale

   10×10 anchors, 4px from each ring edge (within the vertical
   padding zone on the top/bottom edges and horizontal zone on
   left/right). ::before = horizontal arm, ::after = vertical arm,
   2px thick (vs 3px on the frame — scaled down for button proportions).

   Same construction as DungeonFramePrototype and DungeonModalPrototype
   brackets exactly — only the size and weight tokens differ.
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

   Directly analogous to the nameplate in DungeonFramePrototype
   and the action plate in DungeonModalPrototype. Uses the same
   plate gradient + directional bevel border construction.

   The plate reads as a dark engraved surface set into the
   bronze, not a floating label on top of it. The variant border
   overrides (teal, amber) express the state signal at the
   interface between plate and ring — the same structural seam
   where the frame expresses its accent/aged state.

   padding: 7px 16px — vertical matches ring-v for a compact face;
   horizontal adds extra breathing room for button labels.

   No width: 100% — the face sizes to its content + padding,
   letting the ring padding be visible on all four sides.
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
