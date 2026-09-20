<template>
  <section
    class="war-table"
    :class="{
      'seats-highlighted': highlight === 'stakeholders',
      'is-adjourned': isAdjourned,
      'is-collapsing': isCollapsing,
      'is-compound-storm': collapseCount > 1,
      [`fx-${fxKind}`]: Boolean(fxKind),
      [`tone-${fxTone}`]: fxKind === 'aftershock' && Boolean(fxTone),
    }"
    aria-label="War table"
  >
    <div class="table-quake-root" :class="{ 'is-shaking': fxKind === 'aftershock' }">
    <div class="seat-ring" data-play-highlight="stakeholders" aria-label="Council">
      <TableSeat
        v-for="actor in actors"
        :key="actor.id"
        :displayName="actor.displayName"
        :avatarRole="actor.avatarRole"
        :mood="actor.mood"
        :slot="actor.slot"
        :speechBubble="actor.speechBubble"
        :voicing="voicingStakeholderId === actor.id"
      />
    </div>

    <div
      class="table-board"
      :class="{
        'is-thump': fxKind === 'action' || fxKind === 'consult',
        'is-omen': fxKind === 'event',
      }"
      aria-hidden="true"
    >
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
        <div class="table-landing" data-table-landing>
          <p v-if="landedCardName" class="landed-card">
            {{ landedCardName }}
          </p>
        </div>
        <div
          v-if="fxKind"
          class="table-fx"
          :class="[`fx-${fxKind}`, fxKind === 'aftershock' && fxTone ? `tone-${fxTone}` : '']"
        >
          <span class="fx-ripple" />
          <span class="fx-ember" />
          <span class="fx-ember ember-2" />
          <svg class="fx-bolt" viewBox="0 0 40 80" aria-hidden="true">
            <path d="M22 2 L10 34 H21 L14 78 L32 36 H20 Z" />
          </svg>
          <svg class="fx-crack" viewBox="0 0 200 140" aria-hidden="true">
            <polyline
              class="crack-main"
              points="28,6 46,22 40,40 68,52 62,74 96,88 88,108 124,122 158,134"
            />
            <polyline
              class="crack-branch"
              points="68,52 86,46 102,58 98,72"
            />
            <polyline
              class="crack-branch crack-branch-2"
              points="96,88 118,82 132,94"
            />
          </svg>
        </div>
      </div>
    </div>

    <div
      v-if="isCollapsing"
      class="table-hearth"
      :class="{ 'is-compound': collapseCount > 1 }"
      aria-hidden="true"
    >
      <span class="hearth-lick lick-1" />
      <span class="hearth-lick lick-2" />
      <span class="hearth-lick lick-3" />
      <span class="hearth-spark spark-1" />
      <span class="hearth-spark spark-2" />
      <span class="hearth-spark spark-3" />
    </div>

    <div
      v-if="fxKind === 'aftershock'"
      class="aftershock-strike"
      :class="`tone-${fxTone || 'mixed'}`"
      aria-hidden="true"
    >
      <svg class="strike-bolt" viewBox="0 0 90 180">
        <path d="M52 4 L18 76 H44 L16 176 L82 80 H52 Z" />
      </svg>
    </div>

    </div>

    <Teleport to="body">
      <div
        v-if="fxKind === 'event'"
        class="system-omen"
        :class="`tone-${fxTone || 'mixed'}`"
        aria-hidden="true"
      >
        <span class="omen-veil" />
        <span class="omen-shaft" />
        <span class="omen-ribbon" />
        <svg class="omen-seal" viewBox="0 0 72 100">
          <line class="seal-chain" x1="36" y1="0" x2="36" y2="30" />
          <circle class="seal-ring" cx="36" cy="56" r="20" />
          <circle class="seal-core" cx="36" cy="56" r="9" />
          <polygon class="seal-eye" points="36,46 46,56 36,66 26,56" />
        </svg>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="currentBeat || (isAdjourned && !currentBeat)"
        class="table-focus"
      >
        <Transition name="beat-card">
          <TurnBeatOverlay
            v-if="currentBeat"
            :key="currentBeat.id"
            :beat="currentBeat"
            :beatIndex="beatIndex"
            :beatCount="beatCount"
            @continue="$emit('continueTheater')"
            @skip="$emit('skipTheater')"
          />
        </Transition>
        <div v-if="isAdjourned && !currentBeat" class="adjourn-plate" role="status">
          <p class="adjourn-kicker">The council adjourns</p>
          <h2>The table stills</h2>
          <p>Your architectural journey has reached its conclusion.</p>
          <button type="button" class="adjourn-action" @click="$emit('viewResults')">
            View Results
          </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { GameplayStageActor } from '@/ui/composables/gameplay_stage_presentation'
import { requestEventScene, requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import type { SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import TableSeat from '@/ui/play/table_seat.vue'
import TurnBeatOverlay from '@/ui/play/turn_beat_overlay.vue'
import { resolveEventSceneId, type TurnBeat, type TurnBeatKind } from '@/ui/play/turn_theater'
import type { ImpactTone } from '@/ui/play/table_moment'

const props = defineProps<{
  actors: GameplayStageActor[]
  sceneId: SceneBackgroundId
  currentBeat: TurnBeat | null
  highlight?: string | null
  isAdjourned?: boolean
  beatIndex?: number
  beatCount?: number
  fxKind?: TurnBeatKind | null
  voicingStakeholderId?: string | null
  fxEventId?: string | null
  fxTone?: ImpactTone | null
  landedCardName?: string | null
  isCollapsing?: boolean
  collapseCount?: number
}>()

defineEmits<{
  continueTheater: []
  skipTheater: []
  viewResults: []
}>()

const sceneUrl = computed(() => requestSceneBackground(props.sceneId))
const isCollapsing = computed(() => Boolean(props.isCollapsing))
const collapseCount = computed(() => props.collapseCount ?? 0)

const eventSceneUrl = computed(() => {
  const eventId = props.currentBeat?.kind === 'event'
    ? props.currentBeat.event_id
    : props.fxKind === 'event'
      ? props.fxEventId
      : null
  if (!eventId) {
    return null
  }

  return requestEventScene(resolveEventSceneId(eventId, props.currentBeat?.title))
})
</script>

<style scoped>
.war-table {
  position: relative;
  isolation: isolate;
  min-height: 24rem;
  display: grid;
  place-items: center;
  padding: 0.25rem 0.5rem 1.4rem;
  overflow: hidden;
}

.table-board {
  position: relative;
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

.war-table.is-collapsing .table-board {
  box-shadow:
    0 40px 50px rgba(0, 0, 0, 0.55),
    0 0 48px rgba(220, 40, 8, 0.42),
    inset 0 0 0 10px #6a2410,
    inset 0 0 0 14px #1a0804,
    inset 0 18px 48px rgba(255, 96, 32, 0.28);
}

.table-hearth {
  position: absolute;
  width: min(620px, 86vw);
  aspect-ratio: 1.22 / 1;
  border-radius: 50% / 44%;
  transform: perspective(1400px) rotateX(52deg);
  transform-origin: center 62%;
  pointer-events: none;
  z-index: 1;
  box-shadow:
    0 0 52px 14px rgba(255, 72, 16, 0.32),
    inset 0 -22px 42px rgba(255, 64, 8, 0.4);
  animation: hearth-breathe 2.2s ease-in-out infinite;
}

.table-hearth.is-compound {
  box-shadow:
    0 0 58px 16px rgba(255, 48, 8, 0.32),
    inset 0 -22px 42px rgba(255, 48, 0, 0.38);
}

.hearth-lick {
  position: absolute;
  bottom: 6%;
  width: 16%;
  height: 20%;
  background: radial-gradient(ellipse at 50% 88%, rgba(255, 196, 80, 0.78), rgba(255, 48, 0, 0) 72%);
  filter: blur(3px);
  animation: lick-rise 1.35s ease-in-out infinite;
}

.lick-1 { left: 16%; }
.lick-2 { left: 42%; height: 26%; animation-delay: 0.28s; }
.lick-3 { left: 66%; animation-delay: 0.56s; }

.hearth-spark {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffe7a8;
  box-shadow: 0 0 10px #ff8020;
  animation: spark-drift 2s linear infinite;
}

.spark-1 { left: 28%; bottom: 18%; animation-delay: 0.1s; }
.spark-2 { left: 52%; bottom: 12%; animation-delay: 0.7s; }
.spark-3 { left: 71%; bottom: 20%; animation-delay: 1.2s; }

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

.war-table.fx-event .table-event {
  animation: event-scene-drop 1100ms ease-out forwards;
}

.table-landing {
  position: absolute;
  inset: 56% 22% 10%;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 2;
}

.landed-card {
  margin: 0;
  max-width: 9.5rem;
  padding: 0.4rem 0.55rem;
  border-radius: 8px;
  text-align: center;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  line-height: 1.25;
  color: var(--dng-title-gold);
  background: rgba(18, 12, 6, 0.82);
  border: 1px solid rgba(232, 196, 96, 0.55);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
}

.table-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.fx-ripple {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 22%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid rgba(232, 196, 96, 0.55);
  transform: translate(-50%, -50%) scale(0.35);
  opacity: 0;
}

.fx-action .fx-ripple,
.fx-consult .fx-ripple {
  animation: table-ripple 820ms ease-out forwards;
}

.fx-ember {
  position: absolute;
  left: 42%;
  bottom: 18%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(240, 140, 64, 0);
}

.fx-aftershock .fx-ember {
  animation: ember-rise 1400ms 220ms ease-out forwards;
}

.fx-aftershock .ember-2 {
  left: 58%;
  animation-delay: 300ms;
}

.fx-bolt {
  position: absolute;
  left: 52%;
  top: 8%;
  width: 28px;
  height: 56px;
  fill: rgba(214, 232, 255, 0);
  filter: drop-shadow(0 0 8px rgba(180, 210, 255, 0.0));
  transform: translateX(-50%);
}

.fx-event .fx-bolt {
  display: none;
}

.fx-aftershock .fx-bolt {
  width: 42px;
  height: 78px;
  left: 48%;
  animation: bolt-strike 900ms 180ms ease-out forwards;
}

.fx-event {
  background: radial-gradient(circle at 50% 0%, rgba(160, 200, 230, 0.0), transparent 58%);
  animation: event-wash 1100ms ease-out forwards;
}

.fx-crack {
  display: none;
  position: absolute;
  inset: -4%;
  width: 108%;
  height: 108%;
  overflow: visible;
}

.fx-aftershock .fx-crack {
  display: block;
}

.fx-crack polyline {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 280;
  stroke-dashoffset: 280;
}

.crack-main {
  stroke: rgba(240, 208, 128, 0.92);
  stroke-width: 1.7;
  filter: drop-shadow(0 0 6px rgba(214, 160, 64, 0.5));
  animation: crack-draw 520ms 260ms ease-out forwards;
}

.crack-branch {
  stroke: rgba(240, 208, 128, 0.92);
  stroke-width: 1.1;
  filter: drop-shadow(0 0 5px rgba(214, 160, 64, 0.4));
  animation: crack-draw 440ms 340ms ease-out forwards;
}

.crack-branch-2 {
  animation-delay: 400ms;
}

.fx-aftershock.tone-blow .crack-main,
.fx-aftershock.tone-blow .crack-branch {
  stroke: rgba(255, 168, 112, 0.92);
  filter: drop-shadow(0 0 6px rgba(232, 96, 48, 0.55));
}

.fx-aftershock.tone-boon .crack-main,
.fx-aftershock.tone-boon .crack-branch {
  stroke: rgba(186, 232, 176, 0.9);
  filter: drop-shadow(0 0 6px rgba(96, 176, 112, 0.5));
}

.fx-aftershock.tone-mixed .crack-main,
.fx-aftershock.tone-mixed .crack-branch {
  stroke: rgba(240, 208, 128, 0.92);
  filter: drop-shadow(0 0 6px rgba(214, 160, 64, 0.5));
}

.fx-aftershock {
  background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0), transparent 62%);
  animation: aftershock-hold 1400ms ease-out forwards;
}

.fx-aftershock.tone-blow {
  animation-name: aftershock-hold-blow;
}

.fx-aftershock.tone-boon {
  animation-name: aftershock-hold-boon;
}

.table-quake-root {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.table-quake-root.is-shaking {
  animation: table-quake 1400ms cubic-bezier(0.22, 0.08, 0.28, 1) both;
}

.aftershock-strike {
  position: absolute;
  left: 50%;
  top: -2%;
  z-index: 5;
  width: min(150px, 32vw);
  height: 56%;
  transform: translateX(-46%);
  pointer-events: none;
}

.strike-bolt {
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 0 18px rgba(255, 220, 140, 0.85));
}

.strike-bolt path {
  fill: #fff6d0;
  stroke: rgba(255, 248, 220, 0.95);
  stroke-width: 2.2;
  stroke-linejoin: round;
  transform-origin: 50% 0;
  animation: bolt-slam 1400ms ease-out forwards;
}

.aftershock-strike.tone-blow .strike-bolt {
  filter: drop-shadow(0 0 18px rgba(255, 150, 80, 0.9));
}

.aftershock-strike.tone-blow path {
  fill: #ffe0b8;
}

.aftershock-strike.tone-boon .strike-bolt {
  filter: drop-shadow(0 0 18px rgba(170, 230, 160, 0.85));
}

.aftershock-strike.tone-boon path {
  fill: #e8ffd8;
}

.system-omen {
  position: fixed;
  left: 50%;
  top: 0;
  z-index: var(--z-overlay);
  width: min(340px, 72vw);
  height: min(58vh, 30rem);
  transform: translateX(-50%);
  pointer-events: none;
}

.omen-veil {
  position: absolute;
  left: 50%;
  top: 0;
  width: 220%;
  height: 100%;
  transform: translateX(-50%);
  background:
    linear-gradient(180deg, rgba(8, 16, 28, 0.55) 0%, rgba(10, 18, 32, 0.18) 42%, transparent 78%);
  opacity: 0;
  animation: omen-veil 1100ms ease-out forwards;
}

.omen-shaft {
  position: absolute;
  left: 50%;
  top: 0;
  width: 28%;
  height: 100%;
  transform: translateX(-50%) scaleY(0);
  transform-origin: 50% 0;
  background:
    linear-gradient(180deg, rgba(210, 232, 255, 0.72) 0%, rgba(140, 190, 230, 0.28) 38%, transparent 100%);
  filter: blur(1.5px);
  animation: omen-shaft 1100ms cubic-bezier(0.18, 0.7, 0.22, 1) forwards;
}

.omen-ribbon {
  position: absolute;
  left: 50%;
  top: 22%;
  width: 0;
  height: 3px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(214, 236, 255, 0.95), transparent);
  box-shadow: 0 0 14px rgba(170, 210, 255, 0.7);
  animation: omen-ribbon 1100ms ease-out forwards;
}

.omen-seal {
  position: absolute;
  left: 50%;
  top: 8%;
  width: 5.4rem;
  height: 7.6rem;
  overflow: visible;
  transform: translate(-50%, -36%) scale(0.72);
  opacity: 0;
  filter: drop-shadow(0 0 16px rgba(180, 220, 255, 0.7));
  animation: omen-seal 1100ms cubic-bezier(0.2, 0.8, 0.24, 1) forwards;
}

.seal-chain {
  stroke: rgba(220, 236, 255, 0.85);
  stroke-width: 2.2;
  stroke-linecap: round;
}

.seal-ring {
  fill: none;
  stroke: rgba(232, 244, 255, 0.95);
  stroke-width: 2.4;
}

.seal-core {
  fill: rgba(186, 220, 255, 0.22);
  stroke: rgba(210, 234, 255, 0.8);
  stroke-width: 1.4;
}

.seal-eye {
  fill: rgba(240, 248, 255, 0.92);
}

.system-omen.tone-blow .omen-shaft {
  background:
    linear-gradient(180deg, rgba(255, 196, 176, 0.7) 0%, rgba(210, 96, 80, 0.28) 40%, transparent 100%);
}

.system-omen.tone-blow .omen-ribbon {
  background: linear-gradient(90deg, transparent, rgba(255, 198, 170, 0.95), transparent);
  box-shadow: 0 0 14px rgba(232, 120, 80, 0.65);
}

.system-omen.tone-blow .omen-seal {
  filter: drop-shadow(0 0 16px rgba(255, 160, 110, 0.7));
}

.system-omen.tone-blow .seal-eye {
  fill: #ffe0c8;
}

.system-omen.tone-boon .omen-shaft {
  background:
    linear-gradient(180deg, rgba(198, 240, 196, 0.7) 0%, rgba(110, 176, 120, 0.26) 40%, transparent 100%);
}

.system-omen.tone-boon .omen-ribbon {
  background: linear-gradient(90deg, transparent, rgba(198, 240, 190, 0.95), transparent);
  box-shadow: 0 0 14px rgba(120, 200, 130, 0.6);
}

.system-omen.tone-boon .omen-seal {
  filter: drop-shadow(0 0 16px rgba(160, 230, 160, 0.7));
}

.system-omen.tone-boon .seal-eye {
  fill: #e4ffd8;
}

.fx-stakeholder {
  background: radial-gradient(circle at 50% 20%, rgba(186, 160, 255, 0.0), transparent 55%);
  animation: council-wash 620ms ease-out forwards;
}

.fx-consult {
  background: radial-gradient(circle at 78% 18%, rgba(232, 210, 140, 0.0), transparent 50%);
  animation: archive-wash 820ms ease-out forwards;
}

.table-board.is-thump {
  animation: table-thump 820ms ease-out;
}

.table-board.is-omen {
  animation: omen-press 1100ms ease-out;
}

.beat-card-enter-active,
.beat-card-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.beat-card-enter-from,
.beat-card-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@keyframes table-ripple {
  0% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.3); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.7); }
}

@keyframes ember-rise {
  0% { opacity: 0; transform: translateY(8px) scale(0.6); background: rgba(240, 140, 64, 0.85); }
  40% { opacity: 0.8; }
  100% { opacity: 0; transform: translateY(-28px) scale(1.1); background: rgba(240, 180, 96, 0); }
}

@keyframes bolt-strike {
  0% { fill: rgba(214, 232, 255, 0); filter: drop-shadow(0 0 0 rgba(180, 210, 255, 0)); }
  18% { fill: rgba(234, 244, 255, 0.92); filter: drop-shadow(0 0 10px rgba(180, 210, 255, 0.55)); }
  42% { fill: rgba(214, 232, 255, 0.2); }
  100% { fill: rgba(214, 232, 255, 0); filter: drop-shadow(0 0 0 rgba(180, 210, 255, 0)); }
}

@keyframes event-wash {
  0%, 100% { background: radial-gradient(circle at 50% 0%, rgba(160, 200, 230, 0), transparent 58%); }
  18% { background: radial-gradient(circle at 50% 0%, rgba(170, 214, 255, 0.38), transparent 62%); }
  48% { background: radial-gradient(circle at 50% 12%, rgba(150, 196, 240, 0.22), transparent 68%); }
}

@keyframes event-scene-drop {
  0% { opacity: 0; transform: scale(1.08) translateY(-10%); }
  28% { opacity: 0.78; transform: scale(1.08) translateY(0); }
  100% { opacity: 0.72; transform: scale(1.08) translateY(0); }
}

@keyframes omen-veil {
  0% { opacity: 0; }
  16% { opacity: 1; }
  62% { opacity: 0.85; }
  100% { opacity: 0; }
}

@keyframes omen-shaft {
  0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  18% { transform: translateX(-50%) scaleY(1); opacity: 1; }
  58% { opacity: 0.85; }
  100% { transform: translateX(-50%) scaleY(1.04); opacity: 0; }
}

@keyframes omen-ribbon {
  0%, 12% { width: 0; opacity: 0; }
  28% { width: 92%; opacity: 1; }
  70% { opacity: 0.8; }
  100% { width: 100%; opacity: 0; }
}

@keyframes omen-seal {
  0% { opacity: 0; transform: translate(-50%, -42%) scale(0.62); }
  22% { opacity: 1; transform: translate(-50%, 0) scale(1.06); }
  40% { transform: translate(-50%, 4%) scale(1); }
  72% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, 10%) scale(0.96); }
}

@keyframes omen-press {
  0%, 100% { filter: brightness(1); }
  20% { filter: brightness(1.14) saturate(0.86); }
}

@keyframes ember-wash {
  0%, 100% { background: radial-gradient(circle at 50% 70%, rgba(240, 120, 48, 0), transparent 58%); }
  30% { background: radial-gradient(circle at 50% 70%, rgba(240, 120, 48, 0.2), transparent 58%); }
}

@keyframes aftershock-hold {
  0% { background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0), transparent 62%); }
  8% { background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0.38), transparent 62%); }
  54% { background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0.4), transparent 62%); }
  64% { background: radial-gradient(circle at 48% 38%, rgba(48, 22, 8, 0.28), transparent 64%); }
  100% { background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0), transparent 62%); }
}

@keyframes aftershock-hold-blow {
  0% { background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0), transparent 62%); }
  8% { background: radial-gradient(circle at 50% 42%, rgba(10, 4, 2, 0.44), transparent 62%); }
  54% { background: radial-gradient(circle at 50% 42%, rgba(10, 4, 2, 0.46), transparent 62%); }
  64% { background: radial-gradient(circle at 46% 36%, rgba(96, 28, 12, 0.32), transparent 64%); }
  100% { background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0), transparent 62%); }
}

@keyframes aftershock-hold-boon {
  0% { background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0), transparent 62%); }
  8% { background: radial-gradient(circle at 50% 42%, rgba(6, 10, 6, 0.38), transparent 62%); }
  54% { background: radial-gradient(circle at 50% 42%, rgba(6, 10, 6, 0.4), transparent 62%); }
  64% { background: radial-gradient(circle at 52% 36%, rgba(48, 78, 42, 0.28), transparent 64%); }
  100% { background: radial-gradient(circle at 50% 42%, rgba(8, 4, 2, 0), transparent 62%); }
}

@keyframes crack-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes table-quake {
  0%, 14% { transform: translate3d(0, 0, 0); }
  18% { transform: translate3d(-18px, 10px, 0) rotate(-1.35deg); }
  24% { transform: translate3d(20px, -11px, 0) rotate(1.5deg); }
  30% { transform: translate3d(-16px, 8px, 0) rotate(-1.2deg); }
  38% { transform: translate3d(15px, -7px, 0) rotate(1.05deg); }
  46% { transform: translate3d(-11px, 6px, 0) rotate(-0.75deg); }
  56% { transform: translate3d(9px, -4px, 0) rotate(0.5deg); }
  68% { transform: translate3d(-5px, 3px, 0) rotate(-0.25deg); }
  82% { transform: translate3d(3px, -1px, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

@keyframes table-quake-soft {
  0%, 14% { transform: translate3d(0, 0, 0); }
  20% { transform: translate3d(-11px, 7px, 0) rotate(-0.9deg); }
  28% { transform: translate3d(12px, -7px, 0) rotate(1deg); }
  38% { transform: translate3d(-8px, 5px, 0) rotate(-0.6deg); }
  50% { transform: translate3d(6px, -3px, 0); }
  66% { transform: translate3d(-3px, 2px, 0); }
  100% { transform: translate3d(0, 0, 0); }
}

@keyframes bolt-slam {
  0%, 10% {
    opacity: 0;
    transform: translateY(-18px) scaleY(0.4);
  }
  16%, 36% {
    opacity: 1;
    transform: translateY(0) scaleY(1.06);
  }
  52% { opacity: 0.35; }
  100% { opacity: 0; transform: translateY(8px) scaleY(1); }
}

@keyframes bolt-slam-blow {
  0%, 10% { opacity: 0; transform: translateY(-18px) scaleY(0.4); }
  16%, 36% { opacity: 1; transform: translateY(0) scaleY(1.06); }
  52% { opacity: 0.35; }
  100% { opacity: 0; transform: translateY(8px) scaleY(1); }
}

@keyframes bolt-slam-boon {
  0%, 10% { opacity: 0; transform: translateY(-18px) scaleY(0.4); }
  16%, 36% { opacity: 1; transform: translateY(0) scaleY(1.06); }
  52% { opacity: 0.35; }
  100% { opacity: 0; transform: translateY(8px) scaleY(1); }
}

@keyframes council-wash {
  0%, 100% { background: radial-gradient(circle at 50% 20%, rgba(186, 160, 255, 0), transparent 55%); }
  35% { background: radial-gradient(circle at 50% 20%, rgba(186, 160, 255, 0.18), transparent 55%); }
}

@keyframes archive-wash {
  0%, 100% { background: radial-gradient(circle at 78% 18%, rgba(232, 210, 140, 0), transparent 50%); }
  40% { background: radial-gradient(circle at 78% 18%, rgba(232, 210, 140, 0.16), transparent 50%); }
}

@keyframes table-thump {
  0%, 100% { filter: brightness(1); }
  28% { filter: brightness(1.1); }
}

@keyframes hearth-breathe {
  0%, 100% { opacity: 0.72; }
  50% { opacity: 1; }
}

@keyframes lick-rise {
  0%, 100% { transform: scaleY(0.82) translateY(6px); opacity: 0.45; }
  50% { transform: scaleY(1.18) translateY(-4px); opacity: 0.95; }
}

@keyframes spark-drift {
  0% { transform: translateY(0) scale(0.7); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-42px) scale(0.4); opacity: 0; }
}

.seat-ring {
  position: absolute;
  inset: 4% 6% 28%;
  pointer-events: none;
  z-index: 2;
}

.seat-ring :deep(.table-seat) {
  pointer-events: auto;
}

.seats-highlighted :deep(.seat-portrait) {
  filter: drop-shadow(0 0 12px rgba(240, 208, 96, 0.55));
}

.seat-ring :deep(.seat-left) { position: absolute; left: 0; top: 38%; }
.seat-ring :deep(.seat-center) { position: absolute; left: 18%; top: 4%; }
.seat-ring :deep(.seat-right) { position: absolute; right: 18%; top: 4%; }
.seat-ring :deep(.seat-far) { position: absolute; right: 0; top: 38%; }

/*
 * Theater plaques cannot live inside .war-table. The table isolates a stacking
 * context and clips overflow so the 3D board stays contained; the hand dock is
 * a later sibling and paints over anything that still leaks. Teleport to body
 * and pin the layer to the viewport so Continue is never under the cards.
 * The event omen teleports for the same clip: it has to drop from the chamber
 * ceiling, not from inside a box that hides overflow.
 */
.table-focus {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: grid;
  place-items: center;
  padding:
    max(0.75rem, env(safe-area-inset-top))
    0.75rem
    max(0.75rem, env(safe-area-inset-bottom));
  pointer-events: none;
}

.table-focus :deep(.turn-beat),
.adjourn-plate {
  pointer-events: auto;
  max-height: min(76dvh, 34rem);
  overflow-y: auto;
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
  font-size: var(--text-kicker);
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
  font-size: var(--text-base);
  line-height: 1.45;
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
  font-size: var(--text-sm);
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
    padding-bottom: 1.1rem;
  }

  .table-board {
    transform: perspective(900px) rotateX(38deg);
  }

  .table-hearth {
    transform: perspective(900px) rotateX(38deg);
  }

  .seat-ring {
    inset: 2% 8% 36%;
  }

  .table-quake-root.is-shaking {
    animation-name: table-quake-soft;
  }
}

@media (max-width: 720px) and (orientation: portrait) {
  .war-table {
    min-height: 16.5rem;
    padding-bottom: 0.9rem;
  }

  .table-board {
    width: min(560px, 92vw);
    transform: perspective(780px) rotateX(32deg);
  }

  .table-hearth {
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

  .table-hearth {
    transform: none;
    border-radius: 28px;
    aspect-ratio: 16 / 10;
    animation: none;
  }

  .hearth-lick,
  .hearth-spark {
    animation: none;
  }

  .table-board.is-thump,
  .table-board.is-omen,
  .table-quake-root.is-shaking,
  .aftershock-strike,
  .system-omen,
  .strike-bolt path,
  .fx-ripple,
  .fx-ember,
  .fx-bolt,
  .fx-crack polyline,
  .fx-event,
  .fx-aftershock,
  .fx-stakeholder,
  .fx-consult,
  .beat-card-enter-active,
  .beat-card-leave-active {
    animation: none;
    transition: none;
  }

  .table-fx,
  .aftershock-strike,
  .system-omen {
    display: none;
  }
}
</style>
