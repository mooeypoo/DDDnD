<template>
  <section class="workbench">
    <aside class="controls" aria-label="Scene avatar preview controls">
      <h2 class="title">Scene / Avatar Preview</h2>

      <label class="control-group">
        <span class="control-label">Scene</span>
        <select v-model="selectedSceneId" class="control-input">
          <option v-for="scene in sceneOptions" :key="scene.id" :value="scene.id">
            {{ scene.label }}
          </option>
        </select>
      </label>

      <label class="control-group">
        <span class="control-label">Actors On Stage</span>
        <select v-model.number="actorCount" class="control-input">
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="3">3</option>
          <option :value="4">4</option>
        </select>
      </label>

      <p class="guardrail-note">
        Guardrails are active: duplicate slots auto-resolve and actors receive soft spacing nudges.
      </p>

      <div v-for="(actor, index) in visibleActors" :key="actor.id" class="actor-config">
        <p class="actor-title">Actor {{ index + 1 }}</p>

        <label class="control-group">
          <span class="control-label">Role</span>
          <select v-model="actor.avatarRole" class="control-input">
            <option v-for="role in avatarRoleOptions" :key="role" :value="role">
              {{ role }}
            </option>
          </select>
        </label>

        <label class="control-group">
          <span class="control-label">Mood</span>
          <select v-model="actor.mood" class="control-input">
            <option v-for="mood in moodOptions" :key="mood" :value="mood">
              {{ mood }}
            </option>
          </select>
        </label>

        <label class="control-group">
          <span class="control-label">Position Slot</span>
          <select v-model="actor.slot" class="control-input">
            <option v-for="slot in slotOptions" :key="slot" :value="slot">
              {{ slot }}
            </option>
          </select>
        </label>
      </div>
    </aside>

    <div class="surface-wrap">
      <SceneAvatarPreviewSurface :scene-id="selectedSceneId" :actors="visibleActors" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import SceneAvatarPreviewSurface from '@/ui/components/preview/scene_avatar_preview_surface.vue'
import {
  AVATAR_MOOD_OPTIONS,
  AVATAR_ROLE_OPTIONS,
  DEFAULT_PREVIEW_ACTORS,
  SCENE_PREVIEW_OPTIONS,
  SLOT_OPTIONS,
  type PreviewActorConfig,
} from '@/ui/config/scene_avatar_preview_config'

const sceneOptions = SCENE_PREVIEW_OPTIONS
const avatarRoleOptions = AVATAR_ROLE_OPTIONS
const moodOptions = AVATAR_MOOD_OPTIONS
const slotOptions = SLOT_OPTIONS

const selectedSceneId = ref(sceneOptions[0].id)
const actorCount = ref(3)
const actors = ref<PreviewActorConfig[]>([...DEFAULT_PREVIEW_ACTORS])

const visibleActors = computed(() => actors.value.slice(0, actorCount.value))
</script>

<style scoped>
.workbench {
  display: grid;
  grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.controls {
  background: var(--surface-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 12px;
}

.title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
}

.control-group {
  display: grid;
  gap: 6px;
}

.control-label {
  color: var(--text-secondary);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  font-weight: var(--font-semibold);
}

.control-input {
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  color: var(--text-bright);
  padding: 8px 10px;
  font-size: var(--text-sm);
}

.actor-config {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 8px;
  background: color-mix(in oklab, var(--surface-panel), black 8%);
}

.actor-title {
  margin: 0;
  color: var(--text-accent);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.surface-wrap {
  min-width: 0;
}

.guardrail-note {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

@media (max-width: 980px) {
  .workbench {
    grid-template-columns: 1fr;
  }
}
</style>
