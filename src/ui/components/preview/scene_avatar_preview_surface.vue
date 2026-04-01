<template>
  <section class="scene-preview-surface" aria-label="Scene avatar preview surface">
    <img class="scene-background" :src="sceneUrl" alt="" />

    <div class="floor-gradient" aria-hidden="true" />

    <div class="actor-layer" aria-hidden="true">
      <figure
        v-for="actor in guardrailedActors"
        :key="actor.id"
        class="actor"
        :style="buildSceneActorStyle(actor.resolvedSlot, actor.horizontalNudgePercent)"
      >
        <img class="actor-image" :src="getActorUrl(actor)" alt="" />
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { requestAvatarRoleImage, requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import {
  buildGuardrailedNudges,
  buildSceneActorStyle,
  resolveGuardrailedActorSlots,
  type SceneActorSlot,
} from '@/ui/composables/scene_avatar_positioning'
import type { AvatarMood, AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'

interface SurfaceActor {
  id: string
  avatarRole: AvatarRoleId | string
  mood: AvatarMood | string
  slot: SceneActorSlot
}

const props = defineProps<{
  sceneId: SceneBackgroundId | string
  actors: SurfaceActor[]
}>()

const sceneUrl = computed(() => requestSceneBackground(props.sceneId))

const guardrailedActors = computed(() => {
  const resolvedSlots = resolveGuardrailedActorSlots(props.actors)
  const horizontalNudges = buildGuardrailedNudges(resolvedSlots)

  return props.actors.map((actor, index) => ({
    ...actor,
    resolvedSlot: resolvedSlots[index],
    horizontalNudgePercent: horizontalNudges[index],
  }))
})

function getActorUrl(actor: SurfaceActor): string {
  return requestAvatarRoleImage({
    avatarRole: actor.avatarRole,
    mood: actor.mood,
  })
}
</script>

<style scoped>
.scene-preview-surface {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  border: 1px solid color-mix(in oklab, var(--border-accent), white 8%);
  background: #12141f;
  box-shadow: var(--shadow-panel);
}

.scene-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.floor-gradient {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 42%;
  background: linear-gradient(
    to top,
    rgba(8, 10, 18, 0.68) 0%,
    rgba(8, 10, 18, 0.38) 40%,
    rgba(8, 10, 18, 0) 100%
  );
  pointer-events: none;
}

.actor-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.actor {
  position: absolute;
  margin: 0;
  width: clamp(74px, 12vw, 148px);
  transform-origin: center bottom;
}

.actor-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  image-rendering: auto;
  filter: drop-shadow(0 6px 10px rgba(4, 6, 12, 0.45));
}

@media (max-width: 820px) {
  .actor {
    width: clamp(56px, 18vw, 108px);
  }
}
</style>
