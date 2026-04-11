<script setup lang="ts">
/**
 * DungeonActionCardPrototype — the "hand card" in the dungeon-console family.
 *
 * Structural position in the dungeon family
 * ──────────────────────────────────────────
 * ActionCard inherits the DungeonCard shell vocabulary (same 6px chamfer,
 * same flat 3-stop ring, same bottom-only brackets) and extends it with
 * a category-coded identity system and an Action Sigil SVG. It is the most
 * data-dense member of the dungeon family: gameplay metrics, availability state,
 * and interactive footer buttons all live inside its inset. Compare:
 *
 *   AppFrame              — architectural panel, all-four brackets, full nameplate plate
 *   DungeonCard           — token/item, bottom brackets, label header on ring, generic
 *   DungeonActionCard     — specific gameplay card, *category-coded* ring bloom/brackets,
 *                           Action Sigil SVG, effect chips, footer action pair
 *   ScenarioBanner        — broadcast panel, wide split-plate header, navigation crest SVG
 *   EventCard             — severity-coded alert, uses AppCard (AppFrame shell)
 *
 * What makes ActionCard distinct from EventCard
 * ──────────────────────────────────────────────
 * EventCard wraps AppCard (the full AppFrame shell with nameplate + inset). It is
 * a notification surface — the DM delivers information to the player. ActionCard is
 * a physical card the player *holds and plays*. Structural differences:
 *
 *   EventCard:  AppFrame shell (all 4 brackets, thick nameplate plate, full bevel ring)
 *   ActionCard: DungeonCard shell (bottom 2 brackets, flat ring, no separate nameplate)
 *
 *   EventCard:  severity conveys IMPACT MAGNITUDE (low/medium/high/critical)
 *   ActionCard: category conveys DOMAIN IDENTITY (refactor/team/process/infra/fix)
 *
 *   EventCard:  no footer buttons (pure information display)
 *   ActionCard: footer action pair (Inspect ghost + Play category-solid)
 *
 *   EventCard:  AppBadge in header-actions slot (severity badge top-right)
 *   ActionCard: Action Sigil SVG in header (category glyph top-left)
 *
 * What makes ActionCard distinct from ScenarioBanner
 * ────────────────────────────────────────────────────
 *   ScenarioBanner: wide/horizontal (broadcast panel), split-plate header,
 *                   all 4 brackets, 7-stop bevel ring, Navigation Crest SVG
 *                   (octagonal targeting reticle — "bearing locked")
 *   ActionCard:     portrait/vertical (hand card), flat ring, 2 bottom brackets,
 *                   Action Sigil SVG (radial outward-broadcast symbol — "action ready")
 *
 * The SVG glyphs are intentionally contrasting in both geometry and semantics:
 *
 *   Navigation Crest (ScenarioBanner):
 *     Octagonal outer ring → inscribed diamond → crosshair axes → thick inward
 *     cardinal ticks → center tracking ring → center dot.
 *     Geometry: octagonal / square / rectilinear / INWARD / targeting.
 *     Read: position locked, bearing acquired — "I know where we are."
 *
 *   Action Sigil (ActionCard):
 *     Circular outer ring → four outward-pointing chevrons (◁▷▽△) → inscribed
 *     diamond → center dot.
 *     Geometry: circular / radial / curved / OUTWARD / broadcasting.
 *     Read: effect radiating outward — "this card acts on the system."
 *
 *   The chevrons are V-shapes with their point aimed AWAY from the center —
 *   they are vectors beginning at center and expanding outward, like force emanating.
 *   The mission crest ticks are thick strokes AT the octagon boundary, pointing inward
 *   toward the center — they gather/lock.
 *
 * Category identity system
 * ──────────────────────────────────────────
 * Each of the 5 card categories sets a CSS variable override block on the
 * .dungeon-ac root that patches the seven accent-area tokens shared by the
 * DungeonCard variant system:
 *
 *   --ac-category-accent    — the category's primary hue (used for sigil color,
 *                             Play button, tag borders, effect chip highlights)
 *   --dng-divider           — header bottom border and footer top border color
 *   --dng-inset-bloom       — radial tint at the top of the inset (most visible)
 *   --dng-inset-shimmer     — top-edge shimmer line of the inset
 *   --dng-bracket           — bottom bracket mount color
 *   --dng-panel-border      — inset outer border color
 *   --dng-panel-footer      — footer band background tint
 *   --dng-footer-muted      — inspect button text color
 *
 * The bronze ring gradient (7 gradient stops), ring padding, shell geometry, and
 * shell drop-shadow are UNCHANGED across all categories — the card stays in the
 * bronze dungeon family regardless of category. Category signal lives at the
 * inset interface layers, not the structural material.
 *
 *   refactor     — emerald green   (#34d399)  — restoration, quality gains
 *   infrastructure— cobalt blue    (#60a5fa)  — system investments, scale
 *   team         — amber gold      (#fbbf24)  — people, collaboration, morale
 *   process      — arcane purple   (#a989fa)  — workflow, governance, ritual
 *   fix          — urgent orange   (#fb923c)  — emergency action, hotfix, patch
 *   default      — slate blue-gray            — uncategorized / fallback
 *
 * Tutorial visual states
 * ──────────────────────────────────────────
 * tutorial-locked:      opacity 0.4 + grayscale — this card is not playable now
 * tutorial-highlighted: category-colored glow pulse (not hardcoded crimson like
 *                        the legacy design) — the player should play THIS card
 *
 * The tutorial-highlighted animation uses `--ac-category-accent` for the glow,
 * ensuring the call-out ring matches the card's domain color rather than the
 * app's primary red. A refactor card glows green; an emergency fix glows orange.
 *
 * Structural layers (outer → inner):
 *
 *   1. .dungeon-ac  (outer shell)
 *                 6px chamfer (vs 8px on Frame / ScenarioBanner).
 *                 Dark warm-charcoal shell. Quiet 2-stop drop-shadow.
 *
 *   2. .dungeon-ac__ring  (flat bronze ring)
 *                 3-stop vertical bronze gradient (vs 7-stop bevel on Frame).
 *                 Flat face — no inset bevel. Card-ring asymmetric padding:
 *                 6px vertical / 10px horizontal.
 *                 Category-tinted by --dng-* variable overrides (not ring change).
 *
 *   3. Bottom-only L-brackets  (.ac-bracket--bl / --br)
 *                 The card rests on two anchors; a panel mounts at all four.
 *
 *   4. .dungeon-ac__header  (title label on ring face)
 *                 No background plate (label ring, not nameplate).
 *                 Three children:
 *                   · .ac-sigil  — Action Sigil SVG (28×28px) in --ac-category-accent
 *                   · .ac-header-text  — category eyebrow text + h3 card title
 *                   · .ac-artwork-thumb  — optional 52×40px artwork (conditional)
 *                 Separated from inset by a single border-bottom in --dng-divider.
 *
 *   5. .dungeon-ac__inset  (recessed teal-dark content surface)
 *                 4px top-corner chamfers (vs 14px on Frame / ScenarioBanner).
 *                 Flat bloom ellipse (60% × 25% vs 85% × 45% on Frame/ScenarioBanner).
 *                 Quieter shadow (2px 10px vs 3px 20px). No ::after wedge shadows.
 *                 Category tint lives here: --dng-inset-bloom + shimmer + border.
 *
 *   6. .dungeon-ac__body  (compact gameplay content)
 *                 Card style tags, flavor text, effect chips (up to 3 + "+N more"),
 *                 compact indicators (aftershock / stakeholder), availability info.
 *                 Tight padding (space-sm), minimum body height for grid alignment.
 *
 *   7. .dungeon-ac__footer  (action pair footer band)
 *                 Thin footer tint matching card category. Two buttons:
 *                   · Inspect (ghost): ring-hover, opens detail modal
 *                   · Play   (solid):  category-accent fill, primary CTA
 *                 Both use small chamfered clip-path (4px top-corners) — mini versions
 *                 of the outer shell silhouette. The clip signals they are native
 *                 children of the dungeon family.
 *
 * Token surface consumed
 * ──────────────────────────────────────────
 * Dungeon family:  --dng-bronze-*, --dng-frame-outer, --dng-shell-*, --dng-bracket,
 *                  --dng-bracket-size, --dng-bracket-weight, --dng-bracket-inset,
 *                  --dng-ring-gap, --dng-divider, --dng-inset-bloom/shimmer,
 *                  --dng-panel-surface/top/bottom/border/footer, --dng-footer-muted
 * Component-local: --ac-category-accent (set per category variant block)
 * Production:      --text-*, --space-*, --font-*, --leading-*, --tracking-*,
 *                  --effect-positive-*, --effect-negative-*, --effect-warning-*,
 *                  --effect-neutral-*, --transition-fast, --border-focus
 */
withDefaults(defineProps<{
  /** Card game object. */
  title?: string
  /** Category label shown above the title in the header eyebrow. */
  categoryLabel?: string
  /**
   * One of the 5 gameplay categories. Drives the category-accent color system.
   * In production: derived from card.style_tags via resolveCategory().
   */
  category?: 'refactor' | 'infrastructure' | 'team' | 'process' | 'fix' | 'default'
  /** Card is disabled/unavailable. */
  isDisabled?: boolean
  /** Tutorial: this card cannot be played now. */
  isTutorialLocked?: boolean
  /** Tutorial: this is the card the player should play next. */
  isTutorialHighlighted?: boolean
}>(), {
  category: 'default',
  isDisabled: false,
})
</script>

<template>
  <article
    class="dungeon-ac"
    :class="[`category-${category}`, { 'is-disabled': isDisabled, 'tutorial-locked': isTutorialLocked, 'tutorial-highlighted': isTutorialHighlighted }]"
    tabindex="0"
  >

    <!-- Tutorial lock overlay — centered, above ring content -->
    <div v-if="isTutorialLocked" class="tutorial-lock-overlay" aria-hidden="true">
      <span>🔒</span>
    </div>

    <!-- Tutorial highlight badge — floating tag in top-right zone -->
    <div v-if="isTutorialHighlighted" class="tutorial-play-badge">
      <span>👆</span> Play This Card!
    </div>

    <div class="dungeon-ac__ring">

      <!-- Bottom-only L-bracket mounts — card rests, does not anchor -->
      <span class="ac-bracket ac-bracket--bl" aria-hidden="true" />
      <span class="ac-bracket ac-bracket--br" aria-hidden="true" />

      <!-- ── Header: action sigil + category eyebrow + card title ────────── -->
      <!--
        The header sits directly on the bronze ring face — NO background plate.
        Only a bottom border separates it from the inset.
        Three children: [sigil (28px)] [text stack (fill)] [artwork thumb (optional)]
      -->
      <header class="dungeon-ac__header">

        <!--
          ACTION SIGIL — radial outward-broadcast glyph.

          Design rationale:
            A circle (continuous, unified system) with four outward-pointing chevrons
            at the cardinal directions. The chevrons are V-shapes with their open-end
            TOWARD the center and point AWAY — vectors broadcasting outward, suggesting
            the card's effect propagating into the system.

            An inscribed diamond (rotated square) maps the domain space inside the ring.
            A center dot marks the action origin.

            Contrast with Navigation Crest (ScenarioBanner):
              · Crest uses an OCTAGONAL outer frame (not circular)
              · Crest uses thick INWARD tick marks at boundary (targeting, locking)
              · Crest uses radiating CROSSHAIR AXES (coordinate reference lines)
            The sigil's circular geometry + outward chevrons reads as BROADCAST vs TARGETING.

          Renders in: color (currentColor → scoped to --ac-category-accent on .ac-sigil).
          Size: 28×28px. The viewBox is 40×40 for consistent point geometry.
        -->
        <svg
          class="ac-sigil"
          viewBox="0 0 40 40"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <!-- Outer circle — the action radius / containment ring -->
          <circle
            cx="20" cy="20" r="17"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            opacity="0.64"
          />
          <!-- North chevron — point aims upward (N), open end faces center -->
          <line x1="17" y1="15" x2="20" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <line x1="20" y1="10" x2="23" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <!-- South chevron — point aims downward (S) -->
          <line x1="17" y1="25" x2="20" y2="30" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <line x1="20" y1="30" x2="23" y2="25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <!-- West chevron — point aims leftward (W) -->
          <line x1="15" y1="17" x2="10" y2="20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <line x1="10" y1="20" x2="15" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <!-- East chevron — point aims rightward (E) -->
          <line x1="25" y1="17" x2="30" y2="20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <line x1="30" y1="20" x2="25" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.88" />
          <!-- Inscribed domain diamond — the field this action acts upon -->
          <path
            d="M20,15 L25,20 L20,25 L15,20 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="0.9"
            opacity="0.42"
          />
          <!-- Center action origin dot -->
          <circle cx="20" cy="20" r="2.2" fill="currentColor" opacity="0.95" />
        </svg>

        <div class="ac-header-text">
          <span v-if="categoryLabel" class="ac-eyebrow">{{ categoryLabel }}</span>
          <h3 class="ac-title">{{ title ?? 'Card Title' }}</h3>
        </div>

        <!-- Artwork thumbnail — optional, shown when illustration_url is provided -->
        <div class="ac-artwork-thumb" aria-hidden="true">
          <div class="ac-artwork-placeholder" />
        </div>
      </header>

      <!-- ── Main inset content well ──────────────────────────────────────── -->
      <div class="dungeon-ac__inset">

        <div class="dungeon-ac__body">
          <!-- Category style tags -->
          <div class="ac-tags">
            <span class="ac-tag">Tag 1</span>
            <span class="ac-tag">Tag 2</span>
          </div>

          <!-- Flavor or description text — italic prose, compact -->
          <p class="ac-flavor">
            Demonstrates an action card flavor text that fits within roughly 120 characters
            and reads as italic dungeon prose.
          </p>

          <!-- Effect chips — up to 3 visible, rest in tooltip -->
          <div class="ac-effects">
            <span class="ac-chip positive">
              <span class="ac-chip__icon metric-domain-clarity">🧭</span>
              Domain Clarity
              <span class="ac-chip__delta">+8</span>
            </span>
            <span class="ac-chip negative">
              <span class="ac-chip__icon metric-budget">💰</span>
              Budget
              <span class="ac-chip__delta">−3</span>
            </span>
            <button type="button" class="ac-chip more">+1 more</button>
          </div>

          <!-- Compact indicators: aftershocks and stakeholder changes -->
          <div class="ac-indicators">
            <span class="ac-indicator indicator-aftershock">
              <span>⚡</span> 1 Aftershock
            </span>
            <span class="ac-indicator indicator-stakeholders">
              <span>👥</span> 2 Stakeholders
            </span>
          </div>

          <!-- Availability status -->
          <div class="ac-availability">
            <span class="ac-avail-badge">Cooldown: 2 turns</span>
            <p class="ac-avail-status">Unavailable: on cooldown for 2 turns</p>
          </div>
        </div>

        <!-- ── Footer action pair ───────────────────────────────────────────── -->
        <!--
          Two-button band at the bottom of the inset. The footer background
          is tinted by --dng-panel-footer which is overridden per category.

          Inspect (ghost):  reads detail modal, never disabled by play state.
          Play (solid):     primary CTA, clips at top-corners for dungeon feel,
                            color from --ac-category-accent.

          Both buttons use inline clip-path: polygon(4px 0%, ...) — a miniature
          version of the outer shell silhouette. This is intentional "family
          membership" signaling: the buttons echo the card's own shape.
        -->
        <footer class="dungeon-ac__footer">
          <button type="button" class="ac-btn ac-btn--inspect">
            Inspect
          </button>
          <button type="button" class="ac-btn ac-btn--play">
            Play
          </button>
        </footer>

      </div><!-- /dungeon-ac__inset -->
    </div><!-- /dungeon-ac__ring -->
  </article>
</template>

<style scoped>
/*
  Token imports note — DO NOT @import dungeon-design-tokens.css here.
  All --dng-* tokens surface globally via design-system.css → App.vue.
  Scoped @imports inject a second stylesheet copy that breaks variant
  CSS-variable overrides (the category class overrides would re-scope
  to all instances, not just the card they're on).
*/


/* ─────────────────────────────────────────────────────────────
   COMPONENT-LOCAL GEOMETRY TOKENS
   Defined on the root element so category variant blocks can patch
   only the tokens they care about (accent areas), not these.
   ───────────────────────────────────────────────────────────── */
.dungeon-ac {
  --dng-card-chamfer:       6px;
  --dng-card-shell-gap:     2px;
  --dng-card-ring-v:        6px;
  --dng-card-ring-h:        10px;
  --dng-card-inset-chamfer: 4px;
  --dng-card-body-padding:  var(--space-sm);

  /* Title text on bronze ring face — needs dark values (not --dng-title-gold
     which is calibrated for dark charcoal surfaces — here it sits on bronze) */
  --dng-title-gold:    #1e1306;
  --dng-subtitle-warm: #3a2a0a;

  /* Default category accent — slate fallback before category class is applied */
  --ac-category-accent: var(--text-secondary);
}


/* ─────────────────────────────────────────────────────────────
   CATEGORY IDENTITY VARIANTS
   Each block patches exactly the 8 accent-area tokens.
   The bronze ring gradient, shell geometry, and drop-shadow are
   NEVER overridden — the card stays materially bronze regardless.
   ───────────────────────────────────────────────────────────── */

/* REFACTOR — emerald green — restoration, quality, maintenance */
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

/* INFRASTRUCTURE — cobalt blue — architecture, systemic investment, scale */
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

/* TEAM — amber gold — people, collaboration, morale, cultural actions */
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

/* PROCESS — arcane purple — workflow, governance, ceremony, ritual */
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

/* FIX — urgent orange — emergency actions, hotfixes, patches, incidents */
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

/* DEFAULT — slate blue-gray — unknowns, fallbacks, tutorial cards */
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


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL
   6px chamfer (vs 8px on Frame / ScenarioBanner). Quiet 2-stop
   drop-shadow — the card sits in a hand, the panel commands the wall.
   ───────────────────────────────────────────────────────────── */
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
  transition:
    filter          var(--transition-fast),
    outline-offset  var(--transition-fast);
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


/* ─────────────────────────────────────────────────────────────
   TUTORIAL STATES
   ───────────────────────────────────────────────────────────── */
.dungeon-ac.tutorial-locked {
  opacity: 0.40;
  filter: grayscale(0.50);
  pointer-events: none;
  cursor: default;
}

.dungeon-ac.tutorial-highlighted {
  outline: 2px solid var(--ac-category-accent);
  outline-offset: 3px;
  filter:
    drop-shadow(0 0 10px color-mix(in srgb, var(--ac-category-accent) 40%, transparent))
    drop-shadow(0 0 28px color-mix(in srgb, var(--ac-category-accent) 14%, transparent));
  animation: ac-tutorial-pulse 2s ease-in-out infinite;
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

.tutorial-lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  pointer-events: none;
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

@keyframes badge-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}


/* ─────────────────────────────────────────────────────────────
   RING — flat 3-stop bronze hint

   3-stop gradient (vs 7-stop symmetric bevel on Frame).
   No inset bevel box-shadow — flat face, not sculpted.
   Asymmetric padding: 6px vertical, 10px horizontal.
   Category tinting happens only at the inset interface tokens,
   not in this ring gradient.
   ───────────────────────────────────────────────────────────── */
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


/* ─────────────────────────────────────────────────────────────
   BOTTOM-ONLY L-BRACKET MOUNTS
   bl/br only. Card rests; Frame and ScenarioBanner anchor all four.
   ───────────────────────────────────────────────────────────── */
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


/* ─────────────────────────────────────────────────────────────
   HEADER — action sigil + title label on ring face

   Three-child flex row: [sigil 28px] [text stack fill] [thumb optional].
   Only structural mark: single border-bottom in --dng-divider.
   No background plate — title text sits on the bronze ring directly.
   ───────────────────────────────────────────────────────────── */
.dungeon-ac__header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--dng-divider);
}

/* Action Sigil — 28px, category color via color: property */
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

/* Optional artwork thumbnail — 52×40px, chamfered corners */
.ac-artwork-thumb {
  flex-shrink: 0;
  width: 48px;
  height: 36px;
  overflow: hidden;
  background: var(--dng-panel-surface);
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

.ac-artwork-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--dng-panel-top) 0%, var(--dng-panel-bottom) 100%);
  opacity: 0.72;
}


/* ─────────────────────────────────────────────────────────────
   INSET — recessed category-tinted content well

   4px top-corner chamfers (vs 14px on Frame/ScenarioBanner).
   Small bloom ellipse: 60% × 25% (vs 85% × 45% on Frame).
   Quiet shadow: 2px 10px (vs 3px 20px on Frame). No ::after wedges.
   Category tint: --dng-inset-bloom + shimmer + border.
   ───────────────────────────────────────────────────────────── */
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


/* ─────────────────────────────────────────────────────────────
   BODY — compact gameplay content
   ───────────────────────────────────────────────────────────── */
.dungeon-ac__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--dng-card-body-padding);
}

/* Style tags — category-tinted label pills */
.ac-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.ac-tag {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--ac-category-accent);
  background: color-mix(in srgb, var(--ac-category-accent) 12%, var(--dng-panel-surface));
  border: 1px solid color-mix(in srgb, var(--ac-category-accent) 28%, transparent);
  border-radius: 2px;
  padding: 1px var(--space-sm);
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

/* Flavor text — italic, secondary, compact */
.ac-flavor {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  font-style: italic;
}

/* Effect chips row */
.ac-effects {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.ac-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 2px var(--space-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  background: color-mix(in srgb, var(--dng-panel-surface) 80%, transparent);
  border: 1px solid rgba(180, 148, 48, 0.20);
  /* Chamfered chips echo the card shape at micro scale */
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

.ac-chip.positive {
  border-color: var(--effect-positive-border);
  background: var(--effect-positive-bg);
  color: var(--effect-positive);
}

.ac-chip.negative {
  border-color: var(--effect-negative-border);
  background: var(--effect-negative-bg);
  color: var(--effect-negative);
}

.ac-chip.more {
  color: var(--dng-footer-muted);
  border-color: rgba(120, 100, 48, 0.22);
  cursor: pointer;
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 2px var(--space-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--dng-footer-muted);
  background: color-mix(in srgb, var(--dng-panel-surface) 80%, transparent);
  border: 1px solid rgba(120, 100, 48, 0.22);
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.ac-chip.more:hover { color: var(--ac-category-accent); border-color: var(--ac-category-accent); }
.ac-chip.more:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }

.ac-chip__delta {
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
  margin-left: 1px;
}

.ac-chip__icon { display: inline-flex; }

/* Compact indicator badges */
.ac-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.ac-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 2px var(--space-sm);
  border: 1px solid transparent;
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

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

/* Availability section */
.ac-availability {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.ac-avail-badge {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 2px var(--space-sm);
  background: var(--dng-panel-top);
  border: 1px solid rgba(180, 140, 40, 0.20);
  color: var(--text-secondary);
  clip-path: polygon(3px 0%, calc(100% - 3px) 0%, 100% 3px, 100% 100%, 0% 100%, 0% 3px);
}

.ac-avail-status {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-xs);
}

/* Metric color classes — production parity */
.metric-maintainability    { color: var(--metric-maintainability);     }
.metric-domain-clarity     { color: var(--metric-domain-clarity);      }
.metric-delivery-confidence { color: var(--metric-delivery-confidence); }
.metric-developer-morale   { color: var(--metric-developer-morale);    }
.metric-user-trust         { color: var(--metric-user-trust);          }
.metric-budget             { color: var(--metric-budget);              }
.metric-generic            { color: var(--text-secondary);             }


/* ─────────────────────────────────────────────────────────────
   FOOTER — action pair band

   Two-button pair: Inspect (ghost) + Play (category-solid).
   Both buttons use a 4px top-corner chamfer clip-path — a micro
   echo of the outer shell silhouette. This is intentional family
   membership signaling. Note: clip-path on buttons removes the
   native focus ring, so :focus-visible outline must be re-applied.

   Background: --dng-panel-footer (category-tinted per variant).
   Inspect color: --dng-footer-muted (category-tinted per variant).
   Play bg: color-mix blend of category accent into footer tint.
   ───────────────────────────────────────────────────────────── */
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
  /* re-apply focus ring since clip-path removes it */
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.ac-btn:focus-visible {
  outline-color: var(--border-focus);
}

.ac-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Inspect: ghost/dim — secondary action */
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

/* Play: category-accent fill — primary CTA */
.ac-btn--play {
  background: color-mix(in srgb, var(--ac-category-accent) 16%, var(--dng-panel-footer));
  color: var(--ac-category-accent);
  border-color: color-mix(in srgb, var(--ac-category-accent) 55%, transparent);
  font-weight: var(--font-bold);
}

.ac-btn--play:hover:not(:disabled) {
  background: color-mix(in srgb, var(--ac-category-accent) 26%, var(--dng-panel-footer));
  border-color: color-mix(in srgb, var(--ac-category-accent) 75%, transparent);
}
</style>
