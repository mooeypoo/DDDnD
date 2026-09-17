<template>
  <section
    class="war-table"
    :class="{
      'seats-highlighted': highlight === 'stakeholders',
      'is-adjourned': isAdjourned,
    }"
    aria-label="War table"
  >
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

    <p v-if="scenarioName" class="table-nameplate">{{ scenarioName }}</p>

    <figure v-if="playerName || playerClassId" class="player-seat">
      <ClassPortrait
        :classId="playerClassId"
        :className="playerClassName"
        size="md"
      />
      <figcaption class="player-caption">
        <span class="player-name">{{ playerName || 'You' }}</span>
        <span class="player-class">{{ playerClassName || 'Architect' }}</span>
      </figcaption>
    </figure>

    <div class="table-focus">
      <TurnBeatOverlay :beat="currentBeat" @skip="$emit('skipTheater')" />
      <div v-if="isAdjourned && !currentBeat" class="adjourn-plate" role="status">
        <p class="adjourn-kicker">The council adjourns</p>
        <h2>The table stills</h2>
        <p>Your architectural journey has reached its conclusion.</p>
        <button type="button" class="adjourn-action" @click="$emit('viewResults')">
          View Results
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { GameplayStageActor } from '@/ui/composables/gameplay_stage_presentation'
import { requestEventScene, requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import type { SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import ClassPortrait from '@/ui/components/common/class_portrait.vue'
import TableSeat from '@/ui/play/table_seat.vue'
import TurnBeatOverlay from '@/ui/play/turn_beat_overlay.vue'
import { resolveEventSceneId, type TurnBeat } from '@/ui/play/turn_theater'

const props = defineProps<{
  actors: GameplayStageActor[]
  sceneId: SceneBackgroundId
  currentBeat: TurnBeat | null
  highlight?: string | null
  scenarioName?: string
  playerName?: string
  playerClassId?: string
  playerClassName?: string
  isAdjourned?: boolean
}>()

defineEmits<{
  skipTheater: []
  viewResults: []
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
  min-height: 24rem;
  display: grid;
  place-items: center;
  padding: 0.25rem 0.5rem 6.8rem;
  overflow: hidden;
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

.seats-highlighted .seat-ring {
  filter: drop-shadow(0 0 12px rgba(240, 208, 96, 0.55));
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
  z-index: 6;
  pointer-events: none;
}

.table-focus :deep(.turn-beat),
.adjourn-plate {
  pointer-events: auto;
}

.table-nameplate {
  position: absolute;
  left: 50%;
  bottom: 7.2rem;
  z-index: 3;
  margin: 0;
  max-width: min(70%, 22rem);
  padding: 0.22rem 0.9rem;
  transform: translateX(-50%);
  font-family: var(--font-heading);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-align: center;
  color: var(--dng-title-gold);
  background: rgba(12, 8, 4, 0.78);
  border: 1px solid rgba(176, 132, 42, 0.45);
  box-shadow: inset 0 1px 0 rgba(232, 196, 96, 0.16);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.player-seat {
  position: absolute;
  left: 50%;
  bottom: 0.2rem;
  z-index: 5;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  transform: translateX(-50%);
  pointer-events: none;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.55));
}

.player-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  max-width: 10rem;
  padding: 0.15rem 0.5rem 0.2rem;
  border-radius: 999px;
  background: rgba(10, 7, 3, 0.78);
  border: 1px solid rgba(176, 132, 42, 0.45);
}

.player-name {
  font-family: var(--font-heading);
  font-size: 0.68rem;
  color: var(--text-bright);
  letter-spacing: 0.03em;
  line-height: 1.2;
  text-align: center;
}

.player-class {
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.adjourn-plate {
  width: min(420px, 92%);
  padding: 1rem 1.1rem 0.95rem;
  border-radius: 16px;
  text-align: center;
  background:
    linear-gradient(180deg, rgba(28, 20, 8, 0.92) 0%, rgba(10, 8, 4, 0.9) 100%);
  border: 1px solid rgba(232, 196, 96, 0.42);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.adjourn-kicker {
  margin: 0 0 0.3rem;
  font-size: 0.64rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.adjourn-plate h2 {
  margin: 0 0 0.4rem;
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--text-bright);
}

.adjourn-plate p:last-of-type {
  margin: 0 0 0.85rem;
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--text-primary);
}

.adjourn-action {
  appearance: none;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(232, 196, 96, 0.55);
  background: rgba(42, 30, 12, 0.92);
  color: var(--dng-title-gold);
  font-family: var(--font-heading);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.adjourn-action:hover {
  color: var(--text-bright);
}

.is-adjourned .table-board {
  filter: saturate(0.7) brightness(0.72);
}

@media (max-width: 720px) {
  .war-table {
    min-height: 18.5rem;
    padding-bottom: 5.4rem;
  }

  .table-board {
    transform: perspective(900px) rotateX(38deg);
  }

  .seat-ring {
    inset: 2% 8% 36%;
  }

  .table-nameplate {
    bottom: 5.8rem;
    max-width: min(82%, 18rem);
    font-size: 0.62rem;
    letter-spacing: 0.1em;
  }

  .player-seat :deep(.class-portrait) {
    width: 44px;
    height: 44px;
  }

  .player-name {
    font-size: 0.6rem;
  }
}

@media (max-width: 720px) and (orientation: portrait) {
  .war-table {
    min-height: 16.5rem;
    padding-bottom: 5rem;
  }

  .table-board {
    width: min(560px, 92vw);
    transform: perspective(780px) rotateX(32deg);
  }

  .seat-ring {
    inset: 4% 10% 40%;
  }

  .seat-ring :deep(.table-seat) {
    width: min(18vw, 72px);
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
