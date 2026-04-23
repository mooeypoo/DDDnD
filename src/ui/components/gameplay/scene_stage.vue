<template>
  <section class="scene-stage" aria-label="Gameplay stage">
    <img class="stage-background" :src="sceneUrl" alt="" />

    <div class="stage-veil" aria-hidden="true" />
    <div class="stage-floor" aria-hidden="true" />

    <div class="actors" aria-label="Stakeholder actors">
      <figure
        v-for="actor in guardrailedActors"
        :key="actor.id"
        class="actor"
        :style="buildSceneActorStyle(actor.resolvedSlot, actor.horizontalNudgePercent)"
      >
        <!-- State label + satisfaction bar — floats above the character head -->
        <div class="actor-state-top" :class="`mood-${actor.mood}`">
          <span class="actor-state-label" :class="`mood-${actor.mood}`">{{ getMoodLabel(actor.mood) }}</span>
          <div class="actor-state-bar-track">
            <div
              class="actor-state-bar-fill"
              :class="`mood-${actor.mood}`"
              :style="{ width: (actor.satisfaction ?? 0) + '%' }"
            />
          </div>
        </div>

        <Transition name="speech-bubble">
          <div
            v-if="actor.speechBubble"
            class="actor-speech-bubble"
            :class="`tone-${actor.speechBubble.tone}`"
            role="status"
            aria-live="polite"
            :title="actor.speechBubble.text"
          >
            {{ actor.speechBubble.text }}
          </div>
        </Transition>

        <img class="actor-image" :src="getActorUrl(actor)" alt="" />

        <!-- Name pill — bottom of figure -->
        <figcaption
          class="actor-caption"
          :title="`${actor.displayName} — ${getMoodLabel(actor.mood)}`"
        >
          <span class="actor-name" :title="actor.displayName">{{ actor.displayName }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { requestAvatarRoleImage, requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import type { GameplayStageActor } from '@/ui/composables/gameplay_stage_presentation'
import {
  buildGuardrailedNudges,
  buildSceneActorStyle,
  resolveGuardrailedActorSlots,
  type SceneActorSlot,
} from '@/ui/composables/scene_avatar_positioning'
import type { AvatarMood, AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'

/**
 * UI actor contract for the live gameplay stage.
 */
interface StageActor {
  id: string
  displayName: string
  satisfaction?: number
  avatarRole: AvatarRoleId | string
  mood: AvatarMood | string
  slot: SceneActorSlot
  speechBubble?: GameplayStageActor['speechBubble']
}

/**
 * Gameplay stage surface that renders already-prepared actor presentation data
 * on top of a presentation-only scene background.
 */
const props = defineProps<{
  sceneId: SceneBackgroundId | string
  actors: StageActor[]
}>()

const sceneUrl = computed(() => requestSceneBackground(props.sceneId))

/**
 * Applies layout guardrails so simultaneous actors remain readable on stage.
 */
const guardrailedActors = computed(() => {
  const resolvedSlots = resolveGuardrailedActorSlots(props.actors)
  const horizontalNudges = buildGuardrailedNudges(resolvedSlots)

  return props.actors.map((actor, index) => ({
    ...actor,
    resolvedSlot: resolvedSlots[index],
    horizontalNudgePercent: horizontalNudges[index],
  }))
})

function getActorUrl(actor: StageActor): string {
  return requestAvatarRoleImage({ avatarRole: actor.avatarRole, mood: actor.mood })
}

function getMoodLabel(mood: string): string {
  const labels: Record<string, string> = {
    happy: 'Supportive',
    neutral: 'Neutral',
    concerned: 'Concerned',
    angry: 'Critical',
  }
  return labels[mood] ?? mood
}
</script>

<style scoped>
.scene-stage {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-subtle);
  background: #10131f;
  box-shadow: var(--shadow-panel);
}

.stage-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.stage-veil {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 35%, rgba(16, 18, 30, 0.08) 0%, rgba(12, 14, 24, 0.34) 100%);
}

.stage-floor {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40%;
  background: linear-gradient(to top, rgba(8, 10, 16, 0.72) 0%, rgba(8, 10, 16, 0.36) 48%, rgba(8, 10, 16, 0) 100%);
}

.actors {
  position: absolute;
  inset: 0;
}

.actor {
  position: absolute;
  margin: 0;
  width: clamp(76px, 12vw, 152px);
  transform-origin: center bottom;
}

.actor-speech-bubble {
  position: absolute;
  bottom: calc(100% + 34px);
  left: 50%;
  transform: translateX(-50%);
  width: clamp(132px, 18vw, 206px);
  min-height: 30px;
  padding: 6px 8px;
  border-radius: 9px;
  border: 1px solid var(--border-subtle);
  background: rgba(7, 10, 18, 0.9);
  color: var(--text-primary);
  font-size: 10px;
  line-height: 1.3;
  text-align: center;
  z-index: 3;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.45);
  overflow-wrap: break-word;
}

.actor-speech-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background: inherit;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  border-color: inherit;
  rotate: 45deg;
}

.actor-speech-bubble.tone-positive {
  border-color: rgba(34, 197, 94, 0.35);
}

.actor-speech-bubble.tone-mixed {
  border-color: rgba(148, 163, 184, 0.42);
}

.actor-speech-bubble.tone-concern {
  border-color: rgba(249, 115, 22, 0.4);
}

.actor-speech-bubble.tone-critical {
  border-color: rgba(239, 68, 68, 0.45);
}

.actor-speech-bubble.tone-fallback {
  border-color: rgba(148, 163, 184, 0.35);
}

.speech-bubble-enter-active,
.speech-bubble-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.speech-bubble-enter-from,
.speech-bubble-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px) scale(0.98);
}

.actor-state-top {
  position: absolute;
  bottom: calc(100% - 4px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: calc(100% - 6px);
  z-index: 2;
  pointer-events: none;
}

.actor-state-label {
  font-size: 9px;
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  white-space: nowrap;
  background: rgba(6, 8, 14, 0.76);
  border-radius: 4px;
  padding: 1px 5px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.actor-state-label.mood-happy    { color: var(--effect-positive);  border-color: rgba(34, 197, 94, 0.25); }
.actor-state-label.mood-neutral  { color: var(--text-accent);      border-color: rgba(169, 137, 250, 0.25); }
.actor-state-label.mood-concerned{ color: var(--effect-warning);   border-color: rgba(249, 115, 22, 0.25); }
.actor-state-label.mood-angry    { color: var(--effect-negative);  border-color: rgba(239, 68, 68, 0.30); }

.actor-state-bar-track {
  width: 100%;
  height: 5px;
  background: rgba(0, 0, 0, 0.60);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.45);
}

.actor-state-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}
.actor-state-bar-fill.mood-happy     { background: var(--effect-positive); }
.actor-state-bar-fill.mood-neutral   { background: var(--text-accent); }
.actor-state-bar-fill.mood-concerned { background: var(--effect-warning); }
.actor-state-bar-fill.mood-angry     { background: var(--effect-negative); }

.actor-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 8px 10px rgba(3, 4, 8, 0.5));
}

.actor-caption {
  position: absolute;
  left: 50%;
  bottom: 4px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: rgba(10, 11, 18, 0.82);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 4px 8px;
  max-width: min(180px, 46vw);
}

.actor-name {
  display: block;
  color: var(--text-bright);
  font-size: var(--text-2xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

@media (max-width: 1100px) {
  .actor {
    width: clamp(64px, 13vw, 130px);
  }

  .actor-caption {
    max-width: min(152px, 44vw);
  }

  .actor-name {
    max-width: 90px;
  }
}

@media (max-width: 820px) {
  .actor {
    width: clamp(56px, 17vw, 116px);
  }

  .actor-speech-bubble {
    bottom: calc(100% + 24px);
    width: clamp(112px, 26vw, 160px);
    padding: 5px 6px;
    font-size: 9px;
  }

  .actor-state-top {
    top: 3px;
    gap: 2px;
  }

  .actor-state-label {
    font-size: 8px;
    padding: 1px 4px;
  }

  .actor-state-bar-track {
    height: 4px;
  }

  .actor-caption {
    bottom: 3px;
    padding: 3px 6px;
    max-width: min(132px, 52vw);
  }

  .actor-name {
    max-width: 68px;
    font-size: 10px;
  }
}
</style>
