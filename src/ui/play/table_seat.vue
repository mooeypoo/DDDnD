<template>
  <figure
    class="table-seat"
    :class="[`seat-${slot}`, `mood-${mood}`, { speaking: Boolean(speechBubble) }]"
  >
    <Transition name="seat-bubble">
      <div
        v-if="speechBubble"
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
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { requestAvatarRoleImage } from '@/ui/composables/presentation_asset_lookup'
import type { GameplayStageActor } from '@/ui/composables/gameplay_stage_presentation'
import type { AvatarMood, AvatarRoleId } from '@/ui/config/presentation_asset_types'
import type { SceneActorSlot } from '@/ui/composables/scene_avatar_positioning'

const props = defineProps<{
  displayName: string
  avatarRole: AvatarRoleId | string
  mood: AvatarMood | string
  slot: SceneActorSlot
  speechBubble?: GameplayStageActor['speechBubble']
}>()

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
</script>

<style scoped>
.table-seat {
  margin: 0;
  width: min(22vw, 132px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.55));
  transition: transform 180ms ease;
}

.table-seat.speaking {
  transform: translateY(-6px) scale(1.04);
  z-index: 3;
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
  font-size: 0.62rem;
  color: var(--text-bright);
  letter-spacing: 0.03em;
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.seat-mood {
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.mood-happy .seat-mood { color: #b7e0c0; }
.mood-concerned .seat-mood { color: #f0b07a; }
.mood-angry .seat-mood { color: #f0a098; }

.seat-bubble {
  max-width: 11rem;
  margin-bottom: 0.2rem;
  padding: 0.35rem 0.5rem;
  border-radius: 10px 10px 10px 2px;
  background: rgba(18, 14, 8, 0.92);
  border: 1px solid rgba(232, 196, 96, 0.28);
  color: var(--text-primary);
  font-size: 0.72rem;
  line-height: 1.3;
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
  transform: translateY(6px);
}

@media (max-width: 720px) {
  .table-seat {
    width: min(26vw, 104px);
  }

  .seat-bubble {
    display: none;
  }
}
</style>
