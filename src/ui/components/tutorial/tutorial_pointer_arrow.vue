<template>
  <Transition name="arrow-fade">
    <div v-if="show" class="tutorial-arrow" aria-hidden="true">
      <!--
        Downward-pointing chevron arrow that glows above the satchel toggle button.
        Fixed to the bottom-right of the viewport, vertically above the satchel icon.
      -->
      <svg
        class="arrow-svg"
        width="48"
        height="56"
        viewBox="0 0 48 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <!-- Soft inner glow -->
          <filter id="tap-glow-inner" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <!-- Diffuse outer halo -->
          <filter id="tap-glow-outer" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Outer halo layer (diffuse glow) -->
        <path
          d="M15 6 H33 V30 H44 L24 50 L4 30 H15 Z"
          fill="rgba(200, 155, 20, 0.22)"
          filter="url(#tap-glow-outer)"
        />

        <!-- Mid glow layer -->
        <path
          d="M15 6 H33 V30 H44 L24 50 L4 30 H15 Z"
          fill="rgba(210, 170, 40, 0.45)"
          filter="url(#tap-glow-inner)"
        />

        <!-- Arrow body -->
        <path
          d="M15 6 H33 V30 H44 L24 50 L4 30 H15 Z"
          fill="rgba(190, 140, 20, 0.88)"
          stroke="rgba(255, 215, 80, 0.95)"
          stroke-width="1.5"
          stroke-linejoin="round"
        />

        <!-- Highlight sheen on the top of the arrowhead cone -->
        <path
          d="M4 30 H44 L24 34 Z"
          fill="rgba(255, 240, 140, 0.18)"
        />
      </svg>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
}>()
</script>

<style scoped>
.tutorial-arrow {
  position: fixed;
  /* Horizontally centered over the satchel toggle (96px wide, right: 24px) */
  right: 20px;
  /* Above the satchel: handle-height + bottom offset + satchel height + gap */
  bottom: calc(var(--drawer-handle-height, 48px) + 16px + 96px + 6px);
  z-index: calc(var(--z-drawer, 300) + 8);
  pointer-events: none;

  animation: arrow-bob 1.3s ease-in-out infinite;
}

.arrow-svg {
  display: block;
  /* Extra pulse on the SVG element for layered effect */
  animation: arrow-pulse 1.3s ease-in-out infinite;
}

@keyframes arrow-bob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(10px); }
}

@keyframes arrow-pulse {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px rgba(210, 170, 40, 0.6)); }
  50%       { opacity: 0.85; filter: drop-shadow(0 0 14px rgba(255, 215, 80, 0.9)); }
}

/* Entrance / exit transitions */
.arrow-fade-enter-active {
  transition: opacity 0.35s var(--ease-decelerate, ease), transform 0.35s var(--ease-decelerate, ease);
}
.arrow-fade-leave-active {
  transition: opacity 0.2s var(--ease-accelerate, ease), transform 0.2s var(--ease-accelerate, ease);
}
.arrow-fade-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.arrow-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Scale down on mobile to match the smaller satchel button */
@media (max-width: 768px) {
  .tutorial-arrow {
    right: 14px;
    bottom: calc(var(--drawer-handle-height, 48px) + 16px + 72px + 6px);
  }

  .arrow-svg {
    width: 36px;
    height: 42px;
  }
}
</style>
