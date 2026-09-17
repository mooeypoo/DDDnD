<template>
  <Transition name="arrow-fade">
    <div
      v-if="show"
      class="tutorial-arrow"
      :class="{
        'is-anchored': Boolean(selector) && placed,
        'is-waiting': Boolean(selector) && !placed,
        'target-hand': !selector && target === 'hand',
      }"
      :style="anchorStyle"
      aria-hidden="true"
    >
      <div class="arrow-bob">
        <svg
          class="arrow-svg"
          width="48"
          height="56"
          viewBox="0 0 48 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="tap-glow-inner" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="tap-glow-outer" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path
            d="M15 6 H33 V30 H44 L24 50 L4 30 H15 Z"
            fill="rgba(200, 155, 20, 0.22)"
            filter="url(#tap-glow-outer)"
          />
          <path
            d="M15 6 H33 V30 H44 L24 50 L4 30 H15 Z"
            fill="rgba(210, 170, 40, 0.45)"
            filter="url(#tap-glow-inner)"
          />
          <path
            d="M15 6 H33 V30 H44 L24 50 L4 30 H15 Z"
            fill="rgba(190, 140, 20, 0.88)"
            stroke="rgba(255, 215, 80, 0.95)"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <path
            d="M4 30 H44 L24 34 Z"
            fill="rgba(255, 240, 140, 0.18)"
          />
        </svg>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Tutorial pointer. When `selector` is set, follows that element's box.
 * Without a selector, legacy satchel-stage CSS (bottom-right / hand-center) remains.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  show: boolean
  selector?: string | null
  target?: 'satchel' | 'hand'
}>(), {
  selector: null,
  target: 'satchel',
})

const ARROW_WIDTH = 48
const ARROW_HEIGHT = 56
const GAP = 10

const left = ref(0)
const top = ref(0)
const placed = ref(false)
let frame = 0
let lastScrolledSelector = ''

const anchorStyle = computed(() => {
  if (!props.selector || !placed.value) {
    return undefined
  }

  return {
    left: `${left.value}px`,
    top: `${top.value}px`,
  }
})

function place(): void {
  if (!props.show || !props.selector) {
    placed.value = false
    return
  }

  const target = document.querySelector(props.selector)
  if (!(target instanceof HTMLElement)) {
    placed.value = false
    return
  }

  if (lastScrolledSelector !== props.selector) {
    lastScrolledSelector = props.selector
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'nearest', inline: 'center' })
    }
  }

  const rect = target.getBoundingClientRect()
  if (rect.width < 2 && rect.height < 2) {
    placed.value = false
    return
  }

  const viewportWidth = window.innerWidth
  const minLeft = 8
  const maxLeft = Math.max(minLeft, viewportWidth - ARROW_WIDTH - 8)
  const centered = rect.left + rect.width / 2 - ARROW_WIDTH / 2
  left.value = Math.round(Math.min(maxLeft, Math.max(minLeft, centered)))

  const above = rect.top - ARROW_HEIGHT - GAP
  top.value = Math.round(above >= 8 ? above : rect.bottom + GAP)
  placed.value = true
}

function tick(): void {
  place()
  if (props.show && props.selector) {
    frame = window.requestAnimationFrame(tick)
  }
}

function start(): void {
  stop()
  if (props.show && props.selector) {
    place()
    frame = window.requestAnimationFrame(tick)
  }
}

function stop(): void {
  if (frame) {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
}

watch(
  () => [props.show, props.selector] as const,
  () => {
    start()
  },
)

onMounted(() => {
  start()
})

onBeforeUnmount(() => {
  stop()
})
</script>

<style scoped>
.tutorial-arrow {
  position: fixed;
  right: 20px;
  bottom: calc(var(--drawer-handle-height, 48px) + 16px + 96px + 6px);
  z-index: calc(var(--z-drawer, 300) + 8);
  pointer-events: none;
}

.tutorial-arrow.target-hand:not(.is-anchored) {
  right: auto;
  left: 50%;
  bottom: calc(var(--hand-dock-height, 210px) + 12px);
}

.tutorial-arrow.is-anchored {
  right: auto;
  bottom: auto;
}

.tutorial-arrow.is-waiting {
  opacity: 0;
}

.arrow-bob {
  animation: arrow-bob 1.3s ease-in-out infinite;
}

.tutorial-arrow.target-hand:not(.is-anchored) .arrow-bob {
  animation-name: arrow-bob-hand;
}

.arrow-svg {
  display: block;
  animation: arrow-pulse 1.3s ease-in-out infinite;
}

@keyframes arrow-bob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(10px); }
}

@keyframes arrow-bob-hand {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(10px); }
}

@keyframes arrow-pulse {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px rgba(210, 170, 40, 0.6)); }
  50%       { opacity: 0.85; filter: drop-shadow(0 0 14px rgba(255, 215, 80, 0.9)); }
}

.arrow-fade-enter-active {
  transition: opacity 0.35s var(--ease-decelerate, ease);
}
.arrow-fade-leave-active {
  transition: opacity 0.2s var(--ease-accelerate, ease);
}
.arrow-fade-enter-from,
.arrow-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .tutorial-arrow:not(.is-anchored) {
    right: 14px;
    bottom: calc(var(--drawer-handle-height, 48px) + 16px + 72px + 6px);
  }

  .tutorial-arrow.target-hand:not(.is-anchored) {
    right: auto;
    left: 50%;
    bottom: calc(var(--hand-dock-height, 180px) + 8px);
  }

  .arrow-svg {
    width: 36px;
    height: 42px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arrow-bob,
  .arrow-svg {
    animation: none;
  }
}
</style>
