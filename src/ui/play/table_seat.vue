<template>
  <figure
    class="table-seat"
    :class="[
      `seat-${slot}`,
      `mood-${mood}`,
      {
        speaking: Boolean(speechBubble),
        voicing,
        'is-open': isOpen,
        'has-reaction': Boolean(speechBubble),
      },
    ]"
    :tabindex="0"
    :aria-expanded="speechBubble ? isOpen : nameRevealed"
    :aria-describedby="showFullName ? fullNameId : undefined"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onEnter"
    @focusout="onLeave"
    @click="onActivate"
    @keydown.enter.prevent="onActivate"
    @keydown.space.prevent="onActivate"
  >
    <Transition name="seat-bubble">
      <div
        v-if="speechBubble && showBubble"
        class="seat-bubble"
        :class="`tone-${speechBubble.tone}`"
        role="status"
      >
        {{ speechBubble.text }}
      </div>
    </Transition>
    <img class="seat-portrait" :src="portraitUrl" :alt="displayName" />
    <figcaption class="seat-caption">
      <span class="seat-name">{{ displayName }}</span>
      <span class="seat-mood">{{ moodLabel }}</span>
    </figcaption>
    <span
      v-if="showFullName"
      :id="fullNameId"
      class="seat-fullname"
      role="tooltip"
    >{{ displayName }}</span>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { requestAvatarRoleImage } from '@/ui/composables/presentation_asset_lookup'
import type { GameplayStageActor } from '@/ui/composables/gameplay_stage_presentation'
import type { AvatarMood, AvatarRoleId } from '@/ui/config/presentation_asset_types'
import type { SceneActorSlot } from '@/ui/composables/scene_avatar_positioning'

/**
 * Council seat. Bubbles float above the portrait so they never push the seat
 * into the hand. Auto-show only while voicing; after that, hover or tap.
 */
const props = defineProps<{
  displayName: string
  avatarRole: AvatarRoleId | string
  mood: AvatarMood | string
  slot: SceneActorSlot
  speechBubble?: GameplayStageActor['speechBubble']
  voicing?: boolean
}>()

const inspected = ref(false)
const nameRevealed = ref(false)
const fullNameId = computed(() => `seat-fullname-${props.displayName.toLowerCase().replace(/\s+/g, '-')}`)

watch(
  () => props.voicing,
  (isVoicing) => {
    if (isVoicing) {
      inspected.value = false
    }
  },
)

watch(
  () => props.speechBubble?.text,
  () => {
    inspected.value = false
  },
)

const showBubble = computed(() => Boolean(props.voicing) || inspected.value)
const isOpen = computed(() => showBubble.value && Boolean(props.speechBubble))
const showFullName = computed(() => nameRevealed.value)

const portraitUrl = computed(() => {
  return requestAvatarRoleImage({
    avatarRole: props.avatarRole,
    mood: props.mood,
  })
})

const moodLabel = computed(() => {
  switch (props.mood) {
    case 'happy':
      return 'Allied'
    case 'neutral':
      return 'Watching'
    case 'concerned':
      return 'Uneasy'
    case 'angry':
      return 'Opposed'
    default:
      return 'Present'
  }
})

function onEnter() {
  nameRevealed.value = true
  if (props.voicing || !props.speechBubble) return
  inspected.value = true
}

function onLeave() {
  nameRevealed.value = false
  if (props.voicing) return
  inspected.value = false
}

function onActivate() {
  nameRevealed.value = !nameRevealed.value
  if (props.voicing || !props.speechBubble) return
  inspected.value = !inspected.value
}
</script>

<style scoped>
.table-seat {
  position: relative;
  margin: 0;
  width: min(22vw, 132px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.55));
  transform-origin: 50% 100%;
  transition: transform 180ms ease;
  pointer-events: auto;
  cursor: pointer;
}

.table-seat:focus-visible {
  outline: 2px solid rgba(232, 196, 96, 0.75);
  outline-offset: 4px;
}

.table-seat.voicing {
  transform: translateY(-10px) scale(1.16);
  z-index: 4;
  filter:
    drop-shadow(0 0 18px rgba(255, 214, 110, 0.72))
    drop-shadow(0 12px 18px rgba(0, 0, 0, 0.55));
  animation: seat-voice-glow 1.8s ease-in-out infinite;
}

.table-seat.voicing .seat-portrait {
  filter: drop-shadow(0 0 10px rgba(255, 232, 160, 0.45));
}

.table-seat.voicing .seat-caption {
  border-color: rgba(232, 196, 96, 0.82);
  box-shadow: 0 0 14px rgba(232, 196, 96, 0.32);
}

.table-seat.voicing .seat-name {
  color: #ffe7b0;
}

.seat-portrait {
  width: 100%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.seat-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  padding: 0.15rem 0.45rem 0.2rem;
  border-radius: 999px;
  background: rgba(10, 7, 3, 0.78);
  border: 1px solid rgba(176, 132, 42, 0.35);
}

.seat-name {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  color: var(--text-bright);
  letter-spacing: 0.03em;
  text-align: center;
  line-height: 1.25;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.seat-mood {
  font-size: var(--text-kicker);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.mood-happy .seat-mood { color: #b7e0c0; }
.mood-concerned .seat-mood { color: #f0b07a; }
.mood-angry .seat-mood { color: #f0a098; }

.seat-fullname {
  position: absolute;
  left: 50%;
  top: calc(100% + 0.2rem);
  z-index: 6;
  width: max-content;
  max-width: min(14rem, 70vw);
  padding: 0.28rem 0.5rem;
  border-radius: 8px;
  background: rgba(18, 14, 8, 0.96);
  border: 1px solid rgba(232, 196, 96, 0.45);
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  line-height: 1.3;
  text-align: center;
  transform: translateX(-50%);
  pointer-events: none;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.45);
}

/*
 * Float above the portrait. Never participate in the flex height, or a long
 * line will shove the seat under the hand dock.
 */
.seat-bubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% - 0.15rem);
  z-index: 5;
  width: max-content;
  max-width: min(12.5rem, 42vw);
  margin: 0;
  padding: 0.35rem 0.55rem;
  border-radius: 10px 10px 10px 2px;
  background: rgba(18, 14, 8, 0.94);
  border: 1px solid rgba(232, 196, 96, 0.34);
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: 1.35;
  text-align: center;
  transform: translateX(-50%);
  pointer-events: none;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.45);
}

.tone-positive { border-color: rgba(120, 180, 130, 0.5); }
.tone-concern { border-color: rgba(214, 126, 58, 0.55); }
.tone-critical { border-color: rgba(196, 72, 64, 0.65); }

.seat-bubble-enter-active,
.seat-bubble-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.seat-bubble-enter-from,
.seat-bubble-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

@keyframes seat-voice-glow {
  0%, 100% {
    filter:
      drop-shadow(0 0 14px rgba(255, 214, 110, 0.55))
      drop-shadow(0 12px 18px rgba(0, 0, 0, 0.55));
  }
  50% {
    filter:
      drop-shadow(0 0 26px rgba(255, 210, 96, 0.9))
      drop-shadow(0 12px 18px rgba(0, 0, 0, 0.55));
  }
}

@media (prefers-reduced-motion: reduce) {
  .table-seat.voicing {
    transform: none;
    animation: none;
    outline: 2px solid rgba(232, 196, 96, 0.7);
    outline-offset: 4px;
  }

  .seat-bubble-enter-active,
  .seat-bubble-leave-active {
    transition: none;
  }
}

@media (max-width: 720px) {
  .table-seat {
    width: min(26vw, 104px);
  }

  .seat-bubble {
    max-width: min(11rem, 56vw);
  }
}
</style>
