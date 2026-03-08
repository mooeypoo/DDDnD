<template>
  <svg 
    class="logo-sigil"
    :class="sizeClass"
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 200 200"
    aria-hidden="true"
  >
    <!-- Outer castle silhouette -->
    <path class="outline" d="M 60 55 L 60 45 L 68 45 L 68 55 L 80 55 L 80 35 L 88 35 L 88 45 L 100 45 L 112 45 L 112 35 L 120 35 L 120 55 L 132 55 L 132 45 L 140 45 L 140 55 L 140 165 L 60 165 L 60 55 Z"/>
    
    <!-- Central tower battlements -->
    <line class="outline" x1="80" y1="35" x2="80" y2="55"/>
    <line class="outline" x1="120" y1="35" x2="120" y2="55"/>
    
    <!-- Core domain (central keep chamber) -->
    <rect class="outline" x="85" y="65" width="30" height="35"/>
    <circle class="node" cx="100" cy="82.5" r="2.5"/>
    
    <!-- Left bounded context partition -->
    <rect class="detail" x="65" y="90" width="18" height="25"/>
    <line class="detail" x1="74" y1="90" x2="74" y2="115"/>
    <circle class="node" cx="74" cy="102.5" r="2"/>
    
    <!-- Right bounded context partition -->
    <rect class="detail" x="117" y="90" width="18" height="25"/>
    <line class="detail" x1="126" y1="90" x2="126" y2="115"/>
    <circle class="node" cx="126" cy="102.5" r="2"/>
    
    <!-- Lower tier domains -->
    <rect class="detail" x="65" y="120" width="18" height="20"/>
    <rect class="detail" x="91" y="120" width="18" height="20"/>
    <rect class="detail" x="117" y="120" width="18" height="20"/>
    
    <!-- Foundation layer -->
    <rect class="detail" x="65" y="145" width="70" height="15"/>
    <line class="detail" x1="83" y1="145" x2="83" y2="160"/>
    <line class="detail" x1="100" y1="145" x2="100" y2="160"/>
    <line class="detail" x1="117" y1="145" x2="117" y2="160"/>
    
    <!-- Integration connectors -->
    <line class="detail" x1="85" y1="82" x2="83" y2="102"/>
    <line class="detail" x1="115" y1="82" x2="117" y2="102"/>
    <line class="detail" x1="74" y1="115" x2="74" y2="120"/>
    <line class="detail" x1="100" y1="100" x2="100" y2="120"/>
    <line class="detail" x1="126" y1="115" x2="126" y2="120"/>
    
    <!-- Subtle arcane circle accent -->
    <circle class="detail" cx="100" cy="110" r="45" opacity="0.3"/>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const sizeClass = computed(() => `size-${props.size}`)
</script>

<style scoped>
.logo-sigil {
  display: block;
  color: var(--text-accent);
}

.logo-sigil.size-small {
  width: 42px;
  height: 42px;
}

.logo-sigil.size-medium {
  width: 64px;
  height: 64px;
}

.logo-sigil.size-large {
  width: 96px;
  height: 96px;
}

/* SVG element styles */
.logo-sigil :deep(.outline) {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.logo-sigil :deep(.detail) {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.logo-sigil :deep(.node) {
  fill: currentColor;
}
</style>
