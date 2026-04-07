<template>
  <!--
    DungeonProgressPrototype — horizontal value meter in the dungeon-console family.

    Structural layers (outer → inner):

      1. dungeon-progress (outer shell div)
                              Standard octagonal clip-path + dark shell + ambient
                              drop-shadow. Identical structural strategy to
                              DungeonFramePrototype. Uses --dng-chamfer (8px).
                              role="meter" with aria-valuenow/min/max for
                              accessibility labeling.

      2. dungeon-progress__ring   Cast-bronze ring — same gradient + directional bevel
                              box-shadow as all family rings. Standard ring padding
                              (--dng-ring-padding: 12px) matches DungeonFramePrototype,
                              giving the meter a panel-weight presence.
                              Four L-bracket mounts at ring corners, 16px/3px/6px
                              geometry inherited from DungeonFramePrototype.

      3. dungeon-progress__nameplate   (conditional — only rendered when `label` prop is present)
                              Full-bleed header plate spanning the ring interior
                              edge-to-edge. Same wall-to-wall structure, background
                              gradient, and directional bevel border strategy as
                              DungeonFramePrototype's nameplate. The ring gap
                              (--dng-ring-gap: 8px) between nameplate and inset
                              is the visible bronze seam bridge between zones.

      4. dungeon-progress__inset   Recessed teal-dark content surface — same radial
                              top-bloom + linear depth gradient as DungeonFramePrototype's
                              inset. Top-corner chamfer (--dng-inner-chamfer: 14px)
                              reveals bronze ring material at the aperture slopes.
                              Inset box-shadow stack creates the sunken-panel depth read.

      5. dungeon-progress__track   Flat dark groove inside the inset. Background is
                              --dng-panel-footer — the deepest panel tone, darker than the
                              inset surface so the track reads as a physical channel
                              carved into the interior. Fixed height: --dng-progress-track-h
                              (20px). overflow: hidden constrains the fill bar exactly.
                              Directional box-shadow (inset top-heavy) gives the channel
                              a concave carved-in read.

      6. dungeon-progress__fill   The fill bar. Width driven by `value` prop (0–100),
                              clamped in script. Color driven by --dng-progress-fill —
                              overridden per variant class. Transition: 300ms ease-out
                              on width for smooth live updates.
                              ::after pseudo produces a 3px bright shimmer at the
                              leading (right) edge — the moving light source as the
                              meter fills. Hidden when value is 0 (.is-empty class).

      7. dungeon-progress__readout   Footer band inside the inset. Same style and
                              background as DungeonFramePrototype's __footer zone.
                              Shows label text on the left (--dng-footer-muted),
                              value% on the right (--dng-title-gold numeric readout).

    Structural relationship to the family:
      · Outer shell and ring are unchanged from DungeonFramePrototype.
      · Nameplate (when shown) is the same full-bleed wall-to-wall header,
        including the negative-margin bleed strategy and identical border tokens.
      · Inset background, chamfer, and box-shadow stack are identical to the frame inset;
        only the interior content differs (track bar vs body slot content).
      · Variant states use the same CSS-variable-override pattern as all dungeon
        components: each variant class overrides --dng-progress-fill only.
        No structural shape changes across variants.

    New tokens used (§14 of dungeon-design-tokens.css):
      --dng-progress-track-h:       20px                        track bar total height
      --dng-progress-fill:          rgba(38,196,176,0.88)       composite fill — default teal
      --dng-progress-fill-success:  rgba(45,220,130,0.88)       fill override — success/green
      --dng-progress-fill-warning:  rgba(200,148,30,0.88)       fill override — warning/amber
      --dng-progress-fill-alert:    rgba(232,96,96,0.88)        fill override — alert/crimson
  -->
  <div
    class="dungeon-progress"
    :class="`variant-${variant}`"
    role="meter"
    :aria-valuenow="value"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label ?? `${value}%`"
  >
    <div class="dungeon-progress__ring">
      <span class="dungeon-progress-bracket dungeon-progress-bracket--tl" aria-hidden="true" />
      <span class="dungeon-progress-bracket dungeon-progress-bracket--tr" aria-hidden="true" />
      <span class="dungeon-progress-bracket dungeon-progress-bracket--bl" aria-hidden="true" />
      <span class="dungeon-progress-bracket dungeon-progress-bracket--br" aria-hidden="true" />

      <div v-if="label" class="dungeon-progress__nameplate">
        <span class="dungeon-progress__nameplate-label">{{ label }}</span>
      </div>

      <div class="dungeon-progress__inset">
        <div class="dungeon-progress__track">
          <div
            class="dungeon-progress__fill"
            :class="{ 'is-empty': value <= 0 }"
            :style="{ width: `${Math.max(0, Math.min(100, value))}%` }"
          />
        </div>
        <div class="dungeon-progress__readout">
          <span class="dungeon-progress__readout-label">{{ label ?? 'Progress' }}</span>
          <span class="dungeon-progress__readout-value">{{ value }}%</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Current meter value. Clamped to 0–100. */
    value: number
    /** Optional label text shown in the nameplate header and footer readout. */
    label?: string
    /**
     * default  — teal fill (neutral meter reading)
     * success  — green fill (goal met / capacity healthy)
     * warning  — amber fill (approaching limit / caution zone)
     * alert    — crimson fill (critical state / over-threshold)
     */
    variant?: 'default' | 'success' | 'warning' | 'alert'
  }>(),
  { variant: 'default' }
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
    --font-semibold, --leading-tight
    --space-sm, --space-md
*/


/* ─────────────────────────────────────────────────────────────
   SUCCESS VARIANT — green fill, goal-met read

   Only --dng-progress-fill is overridden.
   Ring, nameplate, inset, and track are unchanged.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress.variant-success {
  --dng-progress-fill: var(--dng-progress-fill-success);
}


/* ─────────────────────────────────────────────────────────────
   WARNING VARIANT — amber fill, caution read

   --dng-progress-fill shifts to amber.
   Nameplate bevel also shifts to amber (--dng-warning-plate-*)
   so the header plate reads as a warning signal when label is shown.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress.variant-warning {
  --dng-progress-fill: var(--dng-progress-fill-warning);
  --dng-plate-top:     var(--dng-warning-plate-top);
  --dng-plate-left:    var(--dng-warning-plate-left);
  --dng-plate-right:   var(--dng-warning-plate-right);
  --dng-plate-bottom:  var(--dng-warning-plate-bottom);
  --dng-plate-shimmer: var(--dng-warning-shimmer);
}


/* ─────────────────────────────────────────────────────────────
   ALERT VARIANT — crimson fill, critical read

   Only --dng-progress-fill is overridden.
   Ring, nameplate, inset, and track are unchanged.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress.variant-alert {
  --dng-progress-fill: var(--dng-progress-fill-alert);
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL — the architectural outer skin

   Identical to DungeonFramePrototype .dungeon-frame:
   · --dng-chamfer (8px) octagonal clip-path
   · --dng-shell-gap (3px) dark strip between shell and ring
   · drop-shadow follows the clip-path octagonal silhouette
   ───────────────────────────────────────────────────────────── */
.dungeon-progress {
  display: block;
  border: 1px solid var(--dng-shell-border);
  padding: var(--dng-shell-gap);
  background: var(--dng-shell-bg);

  clip-path: polygon(
    var(--dng-chamfer)                    0%,
    calc(100% - var(--dng-chamfer))        0%,
    100%                                   var(--dng-chamfer),
    100%                                   calc(100% - var(--dng-chamfer)),
    calc(100% - var(--dng-chamfer))        100%,
    var(--dng-chamfer)                    100%,
    0%                                     calc(100% - var(--dng-chamfer)),
    0%                                     var(--dng-chamfer)
  );

  filter:
    drop-shadow(0 20px 64px rgba(0, 0, 0, 0.90))
    drop-shadow(0  5px 20px rgba(0, 0, 0, 0.70))
    drop-shadow(0  2px  4px rgba(0, 0, 0, 0.52));
}


/* ─────────────────────────────────────────────────────────────
   RING — cast-bronze frame surface

   Identical to DungeonFramePrototype .dungeon-frame__ring.
   Standard --dng-ring-padding (12px) gives a panel-weight bronze
   band on all four sides. gap: --dng-ring-gap (8px) produces the
   visible bronze seam bridge between nameplate and inset when
   the nameplate is rendered; otherwise not visible.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress__ring {
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
    inset 1px  0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.32);
}


/* ─────────────────────────────────────────────────────────────
   CORNER L-BRACKETS — structural mount points

   Same 16px/3px/6px geometry as DungeonFramePrototype brackets.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress-bracket {
  position: absolute;
  width: var(--dng-bracket-size);
  height: var(--dng-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.dungeon-progress-bracket::before,
.dungeon-progress-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket);
}

.dungeon-progress-bracket::before { height: var(--dng-bracket-weight); width: var(--dng-bracket-size); }
.dungeon-progress-bracket::after  { width:  var(--dng-bracket-weight); height: var(--dng-bracket-size); }

.dungeon-progress-bracket--tl { top: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.dungeon-progress-bracket--tl::before { top: 0; left: 0; }
.dungeon-progress-bracket--tl::after  { top: 0; left: 0; }

.dungeon-progress-bracket--tr { top: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.dungeon-progress-bracket--tr::before { top: 0; right: 0; }
.dungeon-progress-bracket--tr::after  { top: 0; right: 0; }

.dungeon-progress-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.dungeon-progress-bracket--bl::before { bottom: 0; left: 0; }
.dungeon-progress-bracket--bl::after  { bottom: 0; left: 0; }

.dungeon-progress-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.dungeon-progress-bracket--br::before { bottom: 0; right: 0; }
.dungeon-progress-bracket--br::after  { bottom: 0; right: 0; }


/* ─────────────────────────────────────────────────────────────
   NAMEPLATE — full-width header strip (conditional: shown when label is set)

   Identical construction to DungeonFramePrototype .dungeon-frame__nameplate:
   · Negative horizontal margin bleeds the plate to ring inner edges.
   · Padding restores text clearance.
   · Plate gradient top-to-bottom: bg-hi → bg-mid → bg-base.
   · Directional bevel borders match the ring's top-lit light source.
   · Shimmer bleeds downward into the ring-gap bronze seam below.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress__nameplate {
  display: flex;
  align-items: center;

  width: calc(100% + 2 * var(--dng-ring-padding));
  margin-left: calc(-1 * var(--dng-ring-padding));
  padding: 9px calc(var(--dng-ring-padding) + 12px);

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
    inset 0 1px 6px rgba(0, 0, 0, 0.60),
    0 1px 0 var(--dng-plate-shimmer);
}

.dungeon-progress__nameplate-label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  line-height: var(--leading-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* ─────────────────────────────────────────────────────────────
   INSET — recessed teal-dark interior surface

   Same two-layer gradient + chamfer aperture + box-shadow stack
   as DungeonFramePrototype .dungeon-frame__inset. The interior
   contains the track bar and readout footer rather than free-form
   body/slot content, but the structural surface treatment is shared.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress__inset {
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
    inset 0 0    0  1px rgba(0, 0, 0, 0.20),
    inset 0 1px  0 var(--dng-inset-shimmer);

  clip-path: polygon(
    var(--dng-inner-chamfer)               0%,
    calc(100% - var(--dng-inner-chamfer))  0%,
    100%  var(--dng-inner-chamfer),
    100%  100%,
    0%    100%,
    0%    var(--dng-inner-chamfer)
  );
}

/* Shadow wedges cast by the chamfered corner walls into the content well */
.dungeon-progress__inset::after {
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
}


/* ─────────────────────────────────────────────────────────────
   TRACK CONTAINER — the meter channel

   A flat dark groove inset into the teal panel surface.
   --dng-panel-footer is the darkest panel tone — darker than
   --dng-panel-surface — so the channel reads as physically carved
   below the inset floor level. The top-heavy inset box-shadow
   reinforces the concave carved-in read.

   padding: (space-md) on all sides before reducing to track-only:
   The track sits inside the inset body with standard inset padding
   on the sides; the groove itself spans the full interior minus padding.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress__track {
  position: relative;
  height: var(--dng-progress-track-h);
  background: var(--dng-panel-footer);
  margin: var(--space-md) var(--space-md) 0;
  border: 1px solid var(--dng-panel-border);
  overflow: hidden;
  box-shadow:
    inset 0 3px 8px rgba(0, 0, 0, 0.72),
    inset 0 1px 3px rgba(0, 0, 0, 0.50);
}


/* ─────────────────────────────────────────────────────────────
   FILL BAR — the progress indicator

   Fills from left edge to `value`% of track width.
   Color: --dng-progress-fill (default teal; overridden by variant).
   Transition: 300ms ease-out for smooth animation on value changes.

   ::after — leading-edge shimmer:
     A 3px bright stripe at the right edge of the fill bar.
     Simulates the leading light source as the meter advances.
     box-shadow adds a soft outer glow matching the fill color.
     Hidden via .is-empty class when value === 0.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress__fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--dng-progress-fill);
  transition: width 300ms ease-out;
}

.dungeon-progress__fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  background: rgba(255, 255, 255, 0.36);
  box-shadow: 0 0 6px 1px var(--dng-progress-fill);
}

.dungeon-progress__fill.is-empty::after {
  display: none;
}


/* ─────────────────────────────────────────────────────────────
   READOUT FOOTER — label + numeric readout

   Same style as DungeonFramePrototype .dungeon-frame__footer:
   --dng-panel-footer background, --dng-divider top border,
   --dng-footer-muted label text.
   The value% is colored with --dng-title-gold to stand out as
   the primary data point, while the label remains muted.
   ───────────────────────────────────────────────────────────── */
.dungeon-progress__readout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--dng-divider);
  background: var(--dng-panel-footer);
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.28);
}

.dungeon-progress__readout-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--dng-footer-muted);
  letter-spacing: var(--tracking-wide);
}

.dungeon-progress__readout-value {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wider);
  font-variant-numeric: tabular-nums;
}
</style>
