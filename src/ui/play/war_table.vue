<template>
  <section class="war-table" aria-label="War table">
    <div class="seat-ring" aria-label="Council">
      <TableSeat
        v-for="actor in actors"
        :key="actor.id"
        :displayName="actor.displayName"
        :avatarRole="actor.avatarRole"
        :mood="actor.mood"
        :slot="actor.slot"
        :speechBubble="actor.speechBubble"
      />
    </div>

    <div class="table-board" aria-hidden="true">
      <div class="table-grain" />
      <div class="table-inlay">
        <img class="table-map" :src="sceneUrl" alt="" />
        <img
          v-if="eventSceneUrl"
          class="table-event"
          :src="eventSceneUrl"
          alt=""
        />
        <div class="table-veil" />
      </div>
    </div>

    <div class="table-focus">
      <TurnBeatOverlay :beat="currentBeat" @skip="$emit('skipTheater')" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { GameplayStageActor } from '@/ui/composables/gameplay_stage_presentation'
import { requestEventScene, requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import type { SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import TableSeat from '@/ui/play/table_seat.vue'
import TurnBeatOverlay from '@/ui/play/turn_beat_overlay.vue'
import { resolveEventSceneId, type TurnBeat } from '@/ui/play/turn_theater'

const props = defineProps<{
  actors: GameplayStageActor[]
  sceneId: SceneBackgroundId
  currentBeat: TurnBeat | null
}>()

defineEmits<{
  skipTheater: []
}>()

const sceneUrl = computed(() => requestSceneBackground(props.sceneId))

const eventSceneUrl = computed(() => {
  if (props.currentBeat?.kind !== 'event' || !props.currentBeat.event_id) {
    return null
  }

  return requestEventScene(resolveEventSceneId(props.currentBeat.event_id, props.currentBeat.title))
})
</script>

<style scoped>
.war-table {
  position: relative;
  isolation: isolate;
  min-height: 22rem;
  display: grid;
  place-items: center;
  padding: 0.25rem 0.5rem 0.4rem;
}

.table-board {
  width: min(620px, 86vw);
  aspect-ratio: 1.22 / 1;
  border-radius: 50% / 44%;
  transform: perspective(1400px) rotateX(52deg);
  transform-origin: center 62%;
  background:
    radial-gradient(ellipse at 50% 38%, rgba(92, 58, 22, 0.5), transparent 58%),
    repeating-linear-gradient(
      94deg,
      #3a2412 0 3px,
      #51361c 3px 6px,
      #2a1a0c 6px 8px,
      #4a3018 8px 12px
    );
  box-shadow:
    0 40px 50px rgba(0, 0, 0, 0.55),
    inset 0 0 0 10px #5a3a16,
    inset 0 0 0 14px #1a1006,
    inset 0 18px 40px rgba(255, 196, 96, 0.12);
}

.table-grain {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: radial-gradient(rgba(255, 220, 140, 0.05) 0.6px, transparent 0.8px);
  background-size: 4px 4px;
  opacity: 0.35;
  pointer-events: none;
}

.table-inlay {
  position: absolute;
  inset: 16% 18% 20%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow:
    inset 0 0 0 3px rgba(18, 10, 4, 0.85),
    0 0 24px rgba(0, 0, 0, 0.45);
}

.table-map,
.table-event {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.08);
}

.table-event {
  mix-blend-mode: screen;
  opacity: 0.72;
}

.table-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 40%, transparent 28%, rgba(8, 5, 2, 0.55) 100%);
}

.seat-ring {
  position: absolute;
  inset: 4% 6% 28%;
  pointer-events: none;
  z-index: 2;
}

.seat-ring :deep(.seat-left) { position: absolute; left: 0; top: 38%; }
.seat-ring :deep(.seat-center) { position: absolute; left: 18%; top: 4%; }
.seat-ring :deep(.seat-right) { position: absolute; right: 18%; top: 4%; }
.seat-ring :deep(.seat-far) { position: absolute; right: 0; top: 38%; }

.table-focus {
  position: absolute;
  inset: 22% 18% 34%;
  display: grid;
  place-items: center;
  z-index: 4;
  pointer-events: none;
}

.table-focus :deep(.turn-beat) {
  pointer-events: auto;
}

@media (max-width: 720px) {
  .war-table {
    min-height: 18rem;
    padding-bottom: 0.25rem;
  }

  .table-board {
    transform: perspective(900px) rotateX(38deg);
  }

  .seat-ring {
    inset: 0 2% 34%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .table-board {
    transform: none;
    border-radius: 28px;
    aspect-ratio: 16 / 10;
  }
}
</style>
