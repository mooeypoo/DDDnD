<script setup lang="ts">
/**
 * DungeonEventCardPrototype
 *
 * Structural position in the dungeon family
 * ──────────────────────────────────────────
 * EventCard shares its card-item material vocabulary with ActionCard:
 *   - 6px chamfer shell (same as ActionCard, lighter than Frame's 8px)
 *   - Flat 3-stop bronze ring, bottom-only L-bracket mounts
 *   - Teal-dark inset with 4px top-corner chamfers, radial bloom
 *
 * Key structural differences from ActionCard:
 *
 *   1. Severity accent system instead of category accent.
 *      --ec-severity-accent patches 6 interface tokens per class:
 *        severity-low      → #60a5fa  (blue — informational)
 *        severity-medium   → #fbbf24  (amber — caution)
 *        severity-high     → #fb923c  (orange — warning)
 *        severity-critical → #f87171  (red — critical)
 *
 *   2. Severity Sigil SVG — warning-triangle with inner ! mark.
 *      Contrasts with ActionCard's radial-broadcast sigil:
 *        ActionCard: circular outer ring + 4 outward chevrons → "broadcasting effect"
 *        EventCard:  equilateral triangle + ! mark           → "system alert raised"
 *      Both share: outer containment shape + center dot — same family language.
 *
 *   3. No footer action buttons — events are display-only. The inset
 *      runs to the bottom of the ring with no footer plate.
 *
 *   4. Highlights list — bulleted summary lines replacing ActionCard's
 *      effect chips. Events report facts, not deltas.
 *
 *   5. Severity badge in header eyebrow position (same slot as ActionCard's
 *      category eyebrow), not an external AppBadge component.
 *
 * Tokens: same --dng-* base tokens as DungeonActionCardPrototype.
 *         Severity variants patch --ec-severity-accent only.
 *         The bronze ring is unchanged across all severity levels.
 */
withDefaults(defineProps<{
  severity?: 'low' | 'medium' | 'high' | 'critical'
}>(), {
  severity: 'medium',
})
</script>

<template>
  <!--
    DungeonEventCardPrototype — four severity variants side-by-side.
    Outer wrapper is layout-only; each .dungeon-ec is self-contained.
  -->
  <div class="prototype-grid">

    <!-- ── LOW ──────────────────────────────────────────────────── -->
    <article class="dungeon-ec severity-low">
      <div class="dungeon-ec__ring">
        <span class="ec-bracket ec-bracket--bl" aria-hidden="true" />
        <span class="ec-bracket ec-bracket--br" aria-hidden="true" />

        <header class="dungeon-ec__header">
          <!-- Severity Sigil: equilateral triangle + ! mark + center dot -->
          <svg
            class="ec-sigil"
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <!-- Outer equilateral triangle container -->
            <path
              d="M20,4 L37,33 L3,33 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linejoin="round"
              opacity="0.72"
            />
            <!-- Exclamation stem -->
            <line x1="20" y1="15" x2="20" y2="25" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity="0.90" />
            <!-- Exclamation dot -->
            <circle cx="20" cy="29.5" r="1.5" fill="currentColor" opacity="0.90" />
            <!-- Center origin dot (family language — same as ActionCard) -->
            <circle cx="20" cy="20" r="2.0" fill="currentColor" opacity="0.0" />
          </svg>

          <div class="ec-header-text">
            <span class="ec-eyebrow">Low Severity</span>
            <h3 class="ec-title">Minor Dependency Lag</h3>
          </div>
        </header>

        <div class="dungeon-ec__inset">
          <div class="dungeon-ec__body">
            <p class="ec-description">A third-party library has fallen two minor versions behind. No blocking issues yet, but upgrade path complexity is growing.</p>
            <ul class="ec-highlights">
              <li class="ec-highlight-item">Library: payment-gateway-sdk v2.1.4 → v2.3.0</li>
              <li class="ec-highlight-item">No API breaking changes detected</li>
            </ul>
          </div>
        </div>
      </div>
    </article>

    <!-- ── MEDIUM ────────────────────────────────────────────────── -->
    <article class="dungeon-ec severity-medium">
      <div class="dungeon-ec__ring">
        <span class="ec-bracket ec-bracket--bl" aria-hidden="true" />
        <span class="ec-bracket ec-bracket--br" aria-hidden="true" />

        <header class="dungeon-ec__header">
          <svg class="ec-sigil" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M20,4 L37,33 L3,33 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" opacity="0.72" />
            <line x1="20" y1="15" x2="20" y2="25" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity="0.90" />
            <circle cx="20" cy="29.5" r="1.5" fill="currentColor" opacity="0.90" />
          </svg>

          <div class="ec-header-text">
            <span class="ec-eyebrow">Medium Severity</span>
            <h3 class="ec-title">Deployment Queue Backed Up</h3>
          </div>
        </header>

        <div class="dungeon-ec__inset">
          <div class="dungeon-ec__body">
            <p class="ec-description">CI pipeline throughput has dropped 40% after a misconfigured parallelism setting. Release cadence will slow if unaddressed.</p>
            <ul class="ec-highlights">
              <li class="ec-highlight-item">Queue depth: 14 pending builds</li>
              <li class="ec-highlight-item">Average wait: +22 min vs. baseline</li>
              <li class="ec-highlight-item">Affects: 3 active teams</li>
            </ul>
          </div>
        </div>
      </div>
    </article>

    <!-- ── HIGH ──────────────────────────────────────────────────── -->
    <article class="dungeon-ec severity-high">
      <div class="dungeon-ec__ring">
        <span class="ec-bracket ec-bracket--bl" aria-hidden="true" />
        <span class="ec-bracket ec-bracket--br" aria-hidden="true" />

        <header class="dungeon-ec__header">
          <svg class="ec-sigil" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M20,4 L37,33 L3,33 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" opacity="0.72" />
            <line x1="20" y1="15" x2="20" y2="25" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity="0.90" />
            <circle cx="20" cy="29.5" r="1.5" fill="currentColor" opacity="0.90" />
          </svg>

          <div class="ec-header-text">
            <span class="ec-eyebrow">High Severity</span>
            <h3 class="ec-title">Data Pipeline Failure</h3>
          </div>
        </header>

        <div class="dungeon-ec__inset">
          <div class="dungeon-ec__body">
            <p class="ec-description">The nightly data ingestion job has failed for two consecutive runs. Analytics dashboards are serving stale data.</p>
            <ul class="ec-highlights">
              <li class="ec-highlight-item">Last successful run: 47 hours ago</li>
              <li class="ec-highlight-item">Affected reports: 8 dashboards</li>
              <li class="ec-highlight-item">Stakeholder impact: VP Product notified</li>
            </ul>
          </div>
        </div>
      </div>
    </article>

    <!-- ── CRITICAL ───────────────────────────────────────────────── -->
    <article class="dungeon-ec severity-critical">
      <div class="dungeon-ec__ring">
        <span class="ec-bracket ec-bracket--bl" aria-hidden="true" />
        <span class="ec-bracket ec-bracket--br" aria-hidden="true" />

        <header class="dungeon-ec__header">
          <svg class="ec-sigil" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M20,4 L37,33 L3,33 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" opacity="0.72" />
            <line x1="20" y1="15" x2="20" y2="25" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity="0.90" />
            <circle cx="20" cy="29.5" r="1.5" fill="currentColor" opacity="0.90" />
          </svg>

          <div class="ec-header-text">
            <span class="ec-eyebrow">Critical Severity</span>
            <h3 class="ec-title">Production Outage Detected</h3>
          </div>
        </header>

        <div class="dungeon-ec__inset">
          <div class="dungeon-ec__body">
            <p class="ec-description">The primary checkout service is returning 503s for 60% of users. Revenue impact is active. Incident bridge open.</p>
            <ul class="ec-highlights">
              <li class="ec-highlight-item">Error rate: 59.4% of checkout requests</li>
              <li class="ec-highlight-item">P1 incident declared at 14:32</li>
              <li class="ec-highlight-item">On-call: lead_engineer, infra_team</li>
              <li class="ec-highlight-item">User trust impact: –12 projected</li>
            </ul>
          </div>
        </div>
      </div>
    </article>

  </div>
</template>

<style scoped>
/*
  Base --dng-* tokens are defined in dungeon-design-tokens.css.
  That file is loaded globally. Do NOT @import it here.
*/

/* ─────────────────────────────────────────────────────────────
   PROTOTYPE LAYOUT
   ───────────────────────────────────────────────────────────── */
.prototype-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-lg);
  padding: var(--space-lg);
}

/* ─────────────────────────────────────────────────────────────
   SEVERITY ACCENT SYSTEM

   --ec-severity-accent drives all colored interface areas.
   The bronze ring gradient is NOT patched — severity lives at
   the interface layers only (header divider, inset bloom/shimmer,
   bracket color, inset border, eyebrow text).
   ───────────────────────────────────────────────────────────── */
.dungeon-ec {
  --ec-severity-accent: var(--text-secondary);  /* default fallback */

  /* Interface tokens derived from accent — match ActionCard's ac-* pattern */
  --ec-divider:        color-mix(in srgb, var(--ec-severity-accent) 30%, var(--dng-divider));
  --ec-inset-bloom:    color-mix(in srgb, var(--ec-severity-accent) 14%, var(--dng-inset-bloom));
  --ec-bracket:        color-mix(in srgb, var(--ec-severity-accent) 60%, var(--dng-bracket));
  --ec-panel-border:   color-mix(in srgb, var(--ec-severity-accent) 22%, var(--dng-panel-border));
}

.dungeon-ec.severity-low      { --ec-severity-accent: #60a5fa; }  /* blue  — informational */
.dungeon-ec.severity-medium   { --ec-severity-accent: #fbbf24; }  /* amber — caution       */
.dungeon-ec.severity-high     { --ec-severity-accent: #fb923c; }  /* orange — warning      */
.dungeon-ec.severity-critical { --ec-severity-accent: #f87171; }  /* red   — critical      */

/* ─────────────────────────────────────────────────────────────
   OUTER SHELL — same geometry as ActionCard (.dungeon-ac)
   6px chamfer, lighter drop-shadow than Frame
   ───────────────────────────────────────────────────────────── */
.dungeon-ec {
  /* Global --dng-title-gold is tuned for dark charcoal surfaces — override
     here so title text reads dark on the bronze ring face, not gold-on-gold. */
  --dng-title-gold:    #1e1306;  /* deep warm-black — high contrast on bronze */
  --dng-subtitle-warm: #3a2a0a;  /* dark brown — eyebrow/label on bronze */

  --dng-card-chamfer:       6px;
  --dng-card-shell-gap:     2px;
  --dng-card-ring-v:        6px;
  --dng-card-ring-h:        10px;
  --dng-card-inset-chamfer: 4px;
  --dng-card-body-padding:  var(--space-sm);

  position: relative;
  display: block;
  background: var(--dng-shell-bg);
  border: 1px solid var(--dng-shell-border);

  clip-path: polygon(
    var(--dng-card-chamfer)                     0%,
    calc(100% - var(--dng-card-chamfer))         0%,
    100%                                         var(--dng-card-chamfer),
    100%                                         calc(100% - var(--dng-card-chamfer)),
    calc(100% - var(--dng-card-chamfer))         100%,
    var(--dng-card-chamfer)                     100%,
    0%                                           calc(100% - var(--dng-card-chamfer)),
    0%                                           var(--dng-card-chamfer)
  );

  filter:
    drop-shadow(0 8px 24px rgba(0, 0, 0, 0.72))
    drop-shadow(0 2px  6px rgba(0, 0, 0, 0.52));
}

/* ─────────────────────────────────────────────────────────────
   RING — flat-faced cast bronze

   3-stop hint gradient (vs 7-stop bevel on Frame).
   Asymmetric padding: ring-v top/bottom, ring-h left/right.
   Bottom-only brackets; no top bracket anchors.
   ───────────────────────────────────────────────────────────── */
.dungeon-ec__ring {
  position: relative;
  background: linear-gradient(
    to bottom,
    var(--dng-bronze-hi)   0%,
    var(--dng-bronze-mid) 50%,
    var(--dng-bronze-hi) 100%
  );
  padding:
    var(--dng-card-ring-v)
    var(--dng-card-ring-h)
    var(--dng-card-ring-v);

  display: flex;
  flex-direction: column;
  gap: var(--dng-ring-gap);
}

/* ─────────────────────────────────────────────────────────────
   CORNER BRACKETS — bottom-only

   The card rests; it does not anchor. Top corners are bare.
   Color blended from ring bronze toward severity accent.
   ───────────────────────────────────────────────────────────── */
.ec-bracket {
  position: absolute;
  width: var(--dng-bracket-size);
  height: var(--dng-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.ec-bracket::before,
.ec-bracket::after {
  content: '';
  position: absolute;
  background: var(--ec-bracket);
}

.ec-bracket::before { height: var(--dng-bracket-weight); width: var(--dng-bracket-size); }
.ec-bracket::after  { width: var(--dng-bracket-weight);  height: var(--dng-bracket-size); }

.ec-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.ec-bracket--bl::before { bottom: 0; left: 0; }
.ec-bracket--bl::after  { bottom: 0; left: 0; }

.ec-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.ec-bracket--br::before { bottom: 0; right: 0; }
.ec-bracket--br::after  { bottom: 0; right: 0; }

/* ─────────────────────────────────────────────────────────────
   HEADER — label on bronze ring face (same pattern as ActionCard)

   No background plate. Bottom border is the only structural line.
   Sigil (28×28px) + eyebrow + title, left-to-right.
   ───────────────────────────────────────────────────────────── */
.dungeon-ec__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ec-divider);
}

.ec-sigil {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: var(--ec-severity-accent);
  margin-top: 2px;
}

.ec-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ec-eyebrow {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--ec-severity-accent);
  line-height: 1;
  opacity: 0.85;
}

.ec-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}

/* ─────────────────────────────────────────────────────────────
   INSET — recessed teal-dark content surface

   4px top-corner chamfers (smaller than Frame's 14px).
   Severity accent bleeds into the radial top bloom.
   No ::after shadow wedges (those are a Frame signature).
   ───────────────────────────────────────────────────────────── */
.dungeon-ec__inset {
  position: relative;
  background:
    radial-gradient(
      ellipse 60% 25% at 50% 0%,
      var(--ec-inset-bloom) 0%,
      transparent 80%
    ),
    linear-gradient(
      to bottom,
      var(--dng-panel-top)     0%,
      var(--dng-panel-surface) 28%,
      var(--dng-panel-bottom) 100%
    );
  border: 1px solid var(--ec-panel-border);

  clip-path: polygon(
    var(--dng-card-inset-chamfer)                 0%,
    calc(100% - var(--dng-card-inset-chamfer))    0%,
    100%  var(--dng-card-inset-chamfer),
    100%  100%,
    0%    100%,
    0%    var(--dng-card-inset-chamfer)
  );

  box-shadow:
    inset 0 2px 12px rgba(0, 0, 0, 0.68),
    inset 0 0   0  1px rgba(0, 0, 0, 0.18);
}

/* ─────────────────────────────────────────────────────────────
   BODY — content region inside the inset
   ───────────────────────────────────────────────────────────── */
.dungeon-ec__body {
  padding: var(--dng-card-body-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ec-description {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

/* ─────────────────────────────────────────────────────────────
   HIGHLIGHTS LIST — summary bullet facts (no deltas)
   ───────────────────────────────────────────────────────────── */
.ec-highlights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ec-highlight-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: 4px var(--space-sm);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  background: rgba(0, 0, 0, 0.18);
  border-left: 2px solid var(--ec-divider);
}
</style>
