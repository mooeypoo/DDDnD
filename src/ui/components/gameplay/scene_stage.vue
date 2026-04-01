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
        <img class="actor-image" :src="getActorUrl(actor)" alt="" />
        <figcaption class="actor-caption">
          <span class="actor-name">{{ actor.displayName }}</span>
          <span class="actor-mood">{{ actor.mood }}</span>
        </figcaption>
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

interface StageActor {
  id: string
  displayName: string
  avatarRole: AvatarRoleId | string
  mood: AvatarMood | string
  slot: SceneActorSlot
}

const props = defineProps<{
  sceneId: SceneBackgroundId | string
  actors: StageActor[]
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

function getActorUrl(actor: StageActor): string {
  return requestAvatarRoleImage({ avatarRole: actor.avatarRole, mood: actor.mood })
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
  bottom: -30px;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  align-items: center;
  background: rgba(10, 11, 18, 0.82);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 4px 8px;
  max-width: 180px;
}

.actor-name {
  color: var(--text-bright);
  font-size: var(--text-2xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actor-mood {
  color: var(--text-accent);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

@media (max-width: 820px) {
  .actor {
    width: clamp(56px, 17vw, 116px);
  }

  .actor-caption {
    bottom: -24px;
    padding: 3px 7px;
    gap: 5px;
  }

  .actor-name,
  .actor-mood {
    font-size: 10px;
  }
}
</style>
