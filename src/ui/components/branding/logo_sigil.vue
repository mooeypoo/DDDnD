<template>
  <!--
    LogoSigil — dungeon badge mark for DDDnD.

    Visual layers (outer → inner):
      1. Shell octagon    — dark charcoal   (#0d0904), chamfer=13
      2. Bronze ring      — cast-metal gradient, 2px inside shell
      3. Content octagon  — deep teal surface, 10px inside bronze
      4. Castle domain diagram — engraved gold mark on teal
           • Tower outline: 3 battlements (DDD silhouette)
           • Domain tiers: core keep / bounded contexts / foundation
           • Connecting lines and domain nodes
           • Radial arcane ring accent
      5. L-bracket ornaments — 4 corner mounts on the bronze ring

    ViewBox: 0 0 100 100 — sizing via .size-* CSS class.
    Gradient IDs prefixed "sigil-" to avoid DOM collisions when multiple
    instances are rendered.  Identical definitions across instances are
    benign — browsers use the first definition found.
  -->
  <svg
    class="logo-sigil"
    :class="sizeClass"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <!-- Bronze ring: top-lit vertical gradient -->
      <linearGradient id="sigil-bronze-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#c89824"/>
        <stop offset="50%"  stop-color="#a07018"/>
        <stop offset="100%" stop-color="#c89824"/>
      </linearGradient>
      <!-- Content area: teal-dark depth gradient -->
      <linearGradient id="sigil-content-bg" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0%"   stop-color="#0e2232"/>
        <stop offset="35%"  stop-color="#0b1c24"/>
        <stop offset="100%" stop-color="#08171e"/>
      </linearGradient>
    </defs>

    <!-- ── 1. Shell octagon (dark charcoal, chamfer=13) ── -->
    <path d="M13,0 H87 L100,13 V87 L87,100 H13 L0,87 V13 Z" fill="#0d0904"/>

    <!-- ── 2. Bronze ring (2px gutter from shell edge) ── -->
    <path d="M15,2 H85 L98,15 V85 L85,98 H15 L2,85 V15 Z" fill="url(#sigil-bronze-v)"/>

    <!-- ── 3. Content octagon (10px ring width, deep teal) ── -->
    <path d="M25,12 H75 L88,25 V75 L75,88 H25 L12,75 V25 Z" fill="url(#sigil-content-bg)"/>

    <!-- ── 4. Castle domain mark — gold engraving on teal ── -->
    <g stroke="#d4b860" fill="none">
      <!--
        Tower silhouette: outer walls x=28–72 (44px wide).
        Battlements (merlons) at y=24–32; wall body y=32–78.
        3 merlons (8px each), 2 gaps (6px each), 4px margins each side.
      -->
      <path
        d="M28,78 V32 H32 V24 H40 V32 H46 V24 H54 V32 H60 V24 H68 V32 H72 V78 Z"
        stroke-width="1.8"
        stroke-linejoin="miter"
        stroke-linecap="square"
        opacity="0.92"
      />

      <!-- Domain tier divider lines (full tower width) -->
      <line x1="28" y1="47" x2="72" y2="47" stroke-width="0.9" opacity="0.50"/>
      <line x1="28" y1="61" x2="72" y2="61" stroke-width="0.9" opacity="0.50"/>

      <!-- Tier 1: core domain keep (y=34–46) -->
      <rect x="36" y="34" width="28" height="12" stroke-width="1.0" opacity="0.68"/>

      <!-- Tier 2: bounded context boxes (y=49–59) -->
      <rect x="30" y="49" width="13" height="10" stroke-width="1.0" opacity="0.63"/>
      <rect x="57" y="49" width="13" height="10" stroke-width="1.0" opacity="0.63"/>

      <!-- Tier 3: foundation bar with partition lines (y=62–74) -->
      <rect x="30" y="62" width="40" height="12" stroke-width="1.0" opacity="0.63"/>
      <line x1="43" y1="62" x2="43" y2="74" stroke-width="0.8" opacity="0.42"/>
      <line x1="57" y1="62" x2="57" y2="74" stroke-width="0.8" opacity="0.42"/>

      <!-- Connector lines: core → bounded contexts → foundation -->
      <line x1="50" y1="46" x2="36.5" y2="52" stroke-width="0.8" opacity="0.38"/>
      <line x1="50" y1="46" x2="63.5" y2="52" stroke-width="0.8" opacity="0.38"/>
      <line x1="36.5" y1="59" x2="36.5" y2="62" stroke-width="0.8" opacity="0.38"/>
      <line x1="63.5" y1="59" x2="63.5" y2="62" stroke-width="0.8" opacity="0.38"/>

      <!-- Arcane ring accent -->
      <circle cx="50" cy="55" r="22" stroke-width="0.8" opacity="0.13"/>
    </g>

    <!-- Domain nodes (gold-filled dots) -->
    <g fill="#d4b860">
      <circle cx="50"   cy="40"  r="2.0"/>  <!-- core keep -->
      <circle cx="36.5" cy="54"  r="1.5"/>  <!-- left BC -->
      <circle cx="63.5" cy="54"  r="1.5"/>  <!-- right BC -->
      <circle cx="36"   cy="68"  r="1.1"/>  <!-- foundation left -->
      <circle cx="50"   cy="68"  r="1.1"/>  <!-- foundation center -->
      <circle cx="64"   cy="68"  r="1.1"/>  <!-- foundation right -->
    </g>

    <!-- ── 5. L-bracket ornaments on bronze ring face ── -->
    <!--
      Elbow sits just inside the content octagon at each corner;
      arms extend ~9px into the bronze ring area, creating a
      "mounting clip" effect (matches dungeon card bracket language).
      TL elbow (22,22): x+y=44>37 ✓ inside content
      TR elbow (78,22): arm tips verified into ring area ✓
      BL/BR: geometry confirmed via chamfer line equations.
    -->
    <g stroke="#c89824" stroke-width="2" fill="none" stroke-linecap="butt">
      <path d="M13,22 H22 V13"/>   <!-- top-left  -->
      <path d="M87,22 H78 V13"/>   <!-- top-right -->
      <path d="M13,78 H22 V87"/>   <!-- btm-left  -->
      <path d="M87,78 H78 V87"/>   <!-- btm-right -->
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ size?: 'small' | 'medium' | 'large' }>(),
  { size: 'medium' }
)

const sizeClass = computed(() => `size-${props.size}`)
</script>

<style scoped>
.logo-sigil {
  display: block;
  flex-shrink: 0;
}

.logo-sigil.size-small  { width: 42px; height: 42px; }
.logo-sigil.size-medium { width: 64px; height: 64px; }
.logo-sigil.size-large  { width: 96px; height: 96px; }
</style>
