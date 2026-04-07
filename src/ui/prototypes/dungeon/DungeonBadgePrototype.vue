<template>
  <!--
    DungeonBadgePrototype — compact semantic interface marker in the dungeon-console family.

    Structural layers (outer → inner):

      1. dungeon-badge          outer shell — circular via border-radius 50%.
                                Dark shell background, shell border, ambient drop-shadow.
                                Analogous to the outer shell of the frame/modal/button
                                but scaled to badge proportions and circular in silhouette.

                                Design note: badges use a circular form rather than the
                                chamfered octagon used by the frame, modal, and button.
                                At 24–36px total diameter the chamfer clip-path would
                                collapse to an indistinct micro-polygon. The circular form
                                maintains family material vocabulary (bronze ring, dark
                                shell, plate depth, bevel shadows) at indicator scale.

      2. dungeon-badge__ring    bronze ring — same cast-metal gradient as the frame,
                                modal, and button rings. Uniform padding on all sides
                                (vs. the button's wider horizontal padding — badges are
                                square, not wide). Box-shadow carries the directional
                                face bevel (top-bright, bottom-shadow).

                                No corner brackets — at badge scale the bracket ornament
                                would be smaller than 1–2px and unreadable. The bronze
                                ring circle itself anchors the form.

      3. dungeon-badge__face    dark plate surface — the primary semantic signal layer.
                                Same plate gradient + directional bevel border strategy
                                as the nameplate (frame), action plate (modal), and face
                                (button). Semantic variant overrides change the bevel
                                border colors via the same token-override pattern used
                                across the entire family.

      4. dungeon-badge__glyph   centered semantic SVG icon — inline 10×10 viewBox glyph.
                                color is driven by currentColor, which is set to
                                --dng-badge-glyph-color per variant.

    Sizes:
      sm (24px): ring 3px, glyph 10px — minimum legible indicator.
      md (36px): ring 4px, glyph 15px — standard interface marker.

    Semantic variants (all identical structure):
      info    — teal plate bevel + teal i-glyph       (informational)
      success — green plate bevel + green ✓-glyph     (positive / resolved)
      warning — amber plate bevel + amber !-glyph     (caution / pending)
      alert   — red plate bevel + red ✕-glyph         (critical / error)
      locked  — flat dim ring + muted lock-glyph      (locked / unavailable)
      help    — purple plate bevel + purple ?-glyph   (guidance / help)

    Structural relationship to the broader family:
      · Bronze ring gradient tokens: identical to frame, modal, button.
      · Shell gap (3px dark strip): identical to frame/modal.
      · Plate gradient + bevel border token overrides: same strategy as button.
      · No inset surface — badge is single-zone (ring → face) like the button.
      · Drop-shadow on filter (not box-shadow): consistent family approach.
  -->
  <span
    class="dungeon-badge"
    :class="[`variant-${variant}`, `size-${size}`]"
    role="img"
    :aria-label="label || variant"
  >
    <span class="dungeon-badge__ring">
      <span class="dungeon-badge__face">
        <svg
          class="dungeon-badge__glyph"
          viewBox="0 0 10 10"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Info: dot + vertical bar -->
          <template v-if="variant === 'info'">
            <circle cx="5" cy="2.3" r="0.9" fill="currentColor" />
            <rect x="4.3" y="3.9" width="1.4" height="4.7" rx="0.64" fill="currentColor" />
          </template>

          <!-- Success: checkmark -->
          <template v-else-if="variant === 'success'">
            <path
              d="M1.8 5.5 L4.0 7.8 L8.2 2.4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.45"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </template>

          <!-- Warning: exclamation mark -->
          <template v-else-if="variant === 'warning'">
            <rect x="4.3" y="1.6" width="1.4" height="4.9" rx="0.64" fill="currentColor" />
            <circle cx="5" cy="8.4" r="0.9" fill="currentColor" />
          </template>

          <!-- Alert: × mark -->
          <template v-else-if="variant === 'alert'">
            <path
              d="M2.3 2.3 L7.7 7.7 M7.7 2.3 L2.3 7.7"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </template>

          <!-- Locked: padlock (arch + body) -->
          <template v-else-if="variant === 'locked'">
            <path
              d="M3.1 5.1 V3.7 A1.9 1.9 0 0 1 6.9 3.7 V5.1"
              fill="none"
              stroke="currentColor"
              stroke-width="1.1"
              stroke-linecap="round"
            />
            <rect x="2.1" y="4.7" width="5.8" height="4.5" rx="0.9" fill="currentColor" />
          </template>

          <!-- Help: question mark (arc hook + dot) -->
          <template v-else-if="variant === 'help'">
            <path
              d="M3.3 3.8 A1.8 1.8 0 0 1 6.7 3.8 C6.8 5.0 5.2 5.3 5.0 6.6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
            <circle cx="5" cy="8.4" r="0.85" fill="currentColor" />
          </template>
        </svg>
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /**
     * Semantic variant — drives plate bevel color and glyph.
     * info    — teal, ℹ        informational indicator
     * success — green, ✓       positive / resolved state
     * warning — amber, !       caution / pending state
     * alert   — red, ✕         critical / error / danger state
     * locked  — dim bronze, 🔒 locked / unavailable state
     * help    — purple, ?      guidance / help indicator
     */
    variant?: 'info' | 'success' | 'warning' | 'alert' | 'locked' | 'help'
    /**
     * Size.
     * sm — 24px outer diameter, 10px glyph. Minimum legible marker.
     * md — 36px outer diameter, 15px glyph. Standard indicator.
     */
    size?: 'sm' | 'md'
    /** Accessible label. Defaults to the variant name if not provided. */
    label?: string
  }>(),
  { variant: 'info', size: 'md' }
)
</script>

<style scoped>
/*
  Base --dng-* tokens are defined in ./dungeon-design-tokens.css.
  That file is loaded globally via .storybook/preview.ts (Storybook)
  and will be loaded via main.ts when app integration begins.
  Do NOT @import it here — an @import inside <style scoped> injects
  the rules as a separate global stylesheet after the scoped rules,
  which flattens variant token overrides.
*/


/* ─────────────────────────────────────────────────────────────
   INFO VARIANT — teal informational indicator

   Signal strategy:
   · Bronze ring unchanged — still a full-weight bronze frame.
   · Teal signal lives at the plate bevel edges (top/bottom most
     visible as the semantic accent ring around the face circle).
   · Plate bevel mirrors the primary button and accent frame variants
     exactly — same rgba values, same structural layer.
   · Glyph color: --dng-info-glyph (#26d4bc teal).
   ───────────────────────────────────────────────────────────── */
.dungeon-badge.variant-info {
  --dng-plate-top:          rgba(25, 180, 155, 0.48);
  --dng-plate-left:         rgba(20, 150, 128, 0.36);
  --dng-plate-right:        rgba( 0,   0,   0, 0.38);
  --dng-plate-bottom:       rgba(22, 175, 150, 0.64);
  --dng-plate-shimmer:      rgba(22, 190, 162, 0.34);
  --dng-badge-glyph-color:  var(--dng-info-glyph);
}


/* ─────────────────────────────────────────────────────────────
   SUCCESS VARIANT — green positive/resolved indicator

   Signal strategy:
   · Same structural layer strategy as info/warning: plate bevel
     shifts to green, ring stays bronze.
   · Green is clearly distinct from the family's teal at a glance —
     different hue position, not a teal variant.
   · Glyph: checkmark in --dng-success-glyph (#2ddc82 green).
   ───────────────────────────────────────────────────────────── */
.dungeon-badge.variant-success {
  --dng-plate-top:          var(--dng-success-plate-top);
  --dng-plate-left:         var(--dng-success-plate-left);
  --dng-plate-right:        var(--dng-success-plate-right);
  --dng-plate-bottom:       var(--dng-success-plate-bottom);
  --dng-plate-shimmer:      var(--dng-success-shimmer);
  --dng-badge-glyph-color:  var(--dng-success-glyph);
}


/* ─────────────────────────────────────────────────────────────
   WARNING VARIANT — amber caution/pending indicator

   Signal strategy:
   · Reuses the existing --dng-warning-* token family from section 10
     of the token file (same tokens as the button warning variant).
   · Amber shifted from gold toward orange — reads as caution.
   · Glyph: exclamation in --dng-warning-label (#d49830 warm amber).
   ───────────────────────────────────────────────────────────── */
.dungeon-badge.variant-warning {
  --dng-plate-top:          var(--dng-warning-plate-top);
  --dng-plate-left:         var(--dng-warning-plate-left);
  --dng-plate-right:        var(--dng-warning-plate-right);
  --dng-plate-bottom:       var(--dng-warning-plate-bottom);
  --dng-plate-shimmer:      var(--dng-warning-shimmer);
  --dng-badge-glyph-color:  var(--dng-warning-label);
}


/* ─────────────────────────────────────────────────────────────
   ALERT VARIANT — red/crimson critical/error indicator

   Signal strategy:
   · Plate bevel shifts to crimson — the sharpest semantic contrast
     in the family. Distinct from warning amber both in hue and
     urgency register.
   · The bronze ring face remains warm-lit — same top-bright bevel.
     Only the face plate interior boundary reads as crimson.
   · Glyph: × in --dng-alert-glyph (#e86060 bright red).
   ───────────────────────────────────────────────────────────── */
.dungeon-badge.variant-alert {
  --dng-plate-top:          var(--dng-alert-plate-top);
  --dng-plate-left:         var(--dng-alert-plate-left);
  --dng-plate-right:        var(--dng-alert-plate-right);
  --dng-plate-bottom:       var(--dng-alert-plate-bottom);
  --dng-plate-shimmer:      var(--dng-alert-shimmer);
  --dng-badge-glyph-color:  var(--dng-alert-glyph);
}


/* ─────────────────────────────────────────────────────────────
   LOCKED VARIANT — flat dim ring, locked/unavailable state

   Signal strategy:
   · Mirrors the subtle/disabled dimming strategy from the button.
     Bronze ring is flattened (darker gradient stops, weaker bevel
     face highlights) — reads as physically inert, less reflective.
   · Plate bevel is near-invisible — face reads flush with ring.
   · Glyph: padlock in --dng-subtitle-warm (muted ochre).
   · No semantic color — the absence of accent is the signal.
   ───────────────────────────────────────────────────────────── */
.dungeon-badge.variant-locked {
  /* Darker, flatter bronze ring */
  --dng-bronze-hi:          #967014;
  --dng-bronze-mid:         #7a5810;
  --dng-bronze-deep:        #5a400a;
  --dng-bronze-low:         #4c3608;
  --dng-ring-bevel-top:     rgba(120, 88, 16, 0.22);
  --dng-ring-bevel-left:    rgba(100, 74, 12, 0.12);

  /* Near-invisible plate bevel — face reads flush */
  --dng-plate-top:          rgba(90, 64, 10, 0.26);
  --dng-plate-left:         rgba(78, 56,  8, 0.20);
  --dng-plate-right:        rgba( 0,  0,  0, 0.24);
  --dng-plate-bottom:       rgba(68, 48,  8, 0.38);
  --dng-plate-shimmer:      rgba(56, 40,  6, 0.08);

  --dng-badge-glyph-color:  var(--dng-subtitle-warm);
}


/* ─────────────────────────────────────────────────────────────
   HELP VARIANT — purple guidance/arcane indicator

   Signal strategy:
   · Purple is the most "arcane" register in the family palette —
     distinct from the operational teal/green/amber/red set.
   · Same plate bevel override pattern as the other semantic variants.
   · Glyph: question mark in --dng-help-glyph (#c480f4 soft purple).
   ───────────────────────────────────────────────────────────── */
.dungeon-badge.variant-help {
  --dng-plate-top:          var(--dng-help-plate-top);
  --dng-plate-left:         var(--dng-help-plate-left);
  --dng-plate-right:        var(--dng-help-plate-right);
  --dng-plate-bottom:       var(--dng-help-plate-bottom);
  --dng-plate-shimmer:      var(--dng-help-shimmer);
  --dng-badge-glyph-color:  var(--dng-help-glyph);
}


/* ─────────────────────────────────────────────────────────────
   SIZE — sm / md

   Sets the three local geometry tokens consumed by the structure
   rules below. All dimensional variation flows through these three
   tokens — no structural rules need to be duplicated per size.
   ───────────────────────────────────────────────────────────── */
.dungeon-badge.size-sm {
  --dng-badge-size:         var(--dng-badge-size-sm,          24px);
  --dng-badge-ring-padding: var(--dng-badge-ring-padding-sm,   3px);
  --dng-badge-glyph-size:   var(--dng-badge-glyph-size-sm,    10px);
}

.dungeon-badge.size-md {
  --dng-badge-size:         var(--dng-badge-size-md,          36px);
  --dng-badge-ring-padding: var(--dng-badge-ring-padding-md,   4px);
  --dng-badge-glyph-size:   var(--dng-badge-glyph-size-md,    15px);
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL — the circular outermost skin

   First visible layer: a near-black border + 3px dark gap (shell-gap)
   between it and the bronze ring. The gap shows through as
   --dng-shell-bg — the same dark strip visible on all family members.

   border-radius: 50% makes this fully circular at any size. Unlike
   the frame/modal/button which use clip-path polygon for the chamfer
   octagon, the badge uses border-radius. Both strategies rely on
   filter: drop-shadow to follow the shape of the clipped/rounded
   boundary — badges use a circular ambient cast.
   ───────────────────────────────────────────────────────────── */
.dungeon-badge {
  display: inline-flex;
  align-items: stretch;
  width: var(--dng-badge-size);
  height: var(--dng-badge-size);
  padding: var(--dng-shell-gap);
  background: var(--dng-shell-bg);
  border: 1px solid var(--dng-shell-border);
  border-radius: 50%;
  flex-shrink: 0;

  /* Ambient depth cast follows the circular silhouette */
  filter:
    drop-shadow(0 4px 10px rgba(0, 0, 0, 0.80))
    drop-shadow(0 2px  4px rgba(0, 0, 0, 0.60))
    drop-shadow(0 1px  2px rgba(0, 0, 0, 0.44));
}


/* ─────────────────────────────────────────────────────────────
   RING — cast bronze frame material

   The bronze ring sits inside the 3px dark shell gap.
   The gap → bronze → face transition is the key two-layer read.

   background: same two-layer bronze gradient as frame/modal/button:
     · horizontal tint overlay: left slightly brighter, right darker
     · vertical bevel: top-bright → deep-mid → top-bright

   padding: var(--dng-badge-ring-padding) (3–4px depending on size)
   creates the visible bronze width on all sides uniformly.

   border: 1px solid --dng-frame-outer (near-black warm) on the
   ring interior — the same boundary line as the frame/modal.

   box-shadow inset: face bevel at badge scale (1px, vs frame's 2px).
   ───────────────────────────────────────────────────────────── */
.dungeon-badge__ring {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--dng-badge-ring-padding);
  border-radius: 50%;
  border: 1px solid var(--dng-frame-outer);

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

  box-shadow:
    inset 0  1px 0 var(--dng-ring-bevel-top),     /* top face highlight */
    inset 0 -1px 0 rgba(0, 0, 0, 0.55),           /* bottom face shadow */
    inset  1px 0 0 var(--dng-ring-bevel-left),    /* left face highlight */
    inset -1px 0 0 rgba(0, 0, 0, 0.32);           /* right face shadow */
}


/* ─────────────────────────────────────────────────────────────
   FACE — dark plate surface, semantic signal layer

   The face plate fills the circular space inside the ring.
   Same dark plate gradient as the nameplate (frame), cap (modal),
   and face (button). Same directional bevel border strategy —
   the plate bevel colors are where semantic variant tokens live.

   On a circular element the four border edges form arcs at each
   cardinal compass point: the top arc catches the semantic tint
   from the top (most prominent), left/right give side relief,
   bottom anchors the base shadow. Together they create a colored
   ring around the face that distinguishes the variant.

   box-shadow:
     inset depth: top-weighted recess suggesting the face is set
     into the bronze ring surface.
     shimmer line: 1px glow below the face bleeds into the ring gap,
     reinforcing the semantic color at the ring/face boundary.
   ───────────────────────────────────────────────────────────── */
.dungeon-badge__face {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;

  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-mid)  20%,
    var(--dng-plate-bg-base) 100%
  );

  border-top:    1px solid var(--dng-plate-top);
  border-left:   1px solid var(--dng-plate-left);
  border-right:  1px solid var(--dng-plate-right);
  border-bottom: 1px solid var(--dng-plate-bottom);

  box-shadow:
    inset 0 1px 5px rgba(0, 0, 0, 0.72),   /* top recess — face set into ring */
    0 1px 0 var(--dng-plate-shimmer);       /* shimmer into bronze ring gap */
}


/* ─────────────────────────────────────────────────────────────
   GLYPH — centered semantic SVG icon

   The glyph is the most legible semantic differentiator at small
   sizes. Color is driven by currentColor, which is set by the
   --dng-badge-glyph-color token on the badge root. Each variant
   sets this token to its semantic accent color.

   Size is set by --dng-badge-glyph-size (10px sm / 15px md).
   The viewBox="0 0 10 10" SVG scales cleanly to any size.
   ───────────────────────────────────────────────────────────── */
.dungeon-badge__glyph {
  display: block;
  width: var(--dng-badge-glyph-size);
  height: var(--dng-badge-glyph-size);
  color: var(--dng-badge-glyph-color, var(--dng-title-gold));
  flex-shrink: 0;
  overflow: visible;
}
</style>
