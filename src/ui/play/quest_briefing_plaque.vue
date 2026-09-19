<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    :title="quest?.name ?? 'The quest'"
    size="md"
    @close="emit('close')"
  >
    <div v-if="quest" class="briefing-body">
      <p v-if="turnsLeftCopy" class="briefing-remaining">{{ turnsLeftCopy }}</p>
      <p v-if="quest.flavorText" class="briefing-flavor">{{ quest.flavorText }}</p>
      <p class="briefing-description">{{ quest.description }}</p>

      <h3>The council</h3>
      <ul v-if="quest.councilNames && quest.councilNames.length > 0" class="briefing-council">
        <li v-for="name in quest.councilNames" :key="name">{{ name }}</li>
      </ul>
      <p v-else class="briefing-empty">
        {{ councilCountLabel(quest.stakeholderCount) }}
      </p>

      <h3>How the system starts</h3>
      <p v-if="turnsRemaining == null" class="briefing-turns">{{ quest.turnCount }} turns remain on this quest.</p>
      <ul v-if="moodRows.length > 0" class="briefing-mood">
        <li v-for="row in moodRows" :key="row.scoreId">
          <span>{{ row.label }}</span>
          <span>{{ row.value }} · {{ row.mood }}</span>
        </li>
      </ul>
      <p v-else class="briefing-empty">The pack does not list starting scores.</p>
    </div>

    <template #footer>
      <AppButton label="Return to the council" variant="primary" @click="emit('close')" />
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
/**
 * Opt-in quest briefing. Shows authored description, council names, and
 * starting_scores as the system's mood. Does not invent scores or run the engine.
 */
import { computed } from 'vue'

import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import { councilCountLabel } from '@/ui/play/council_copy'
import { describeScoreWeather } from '@/ui/play/weather_band'
import { scoreShortName } from '@/ui/play/score_labels'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import AppButton from '@/ui/components/common/AppButton.vue'

const props = defineProps<{
  isOpen: boolean
  quest: QuestDisplayModel | null
  turnsRemaining?: number | null
}>()

const emit = defineEmits<{
  close: []
}>()

const turnsLeftCopy = computed(() => {
  if (props.turnsRemaining == null) return null
  return props.turnsRemaining === 1 ? '1 turn left' : `${props.turnsRemaining} turns left`
})

const moodRows = computed(() => {
  const scores = props.quest?.startingScores
  if (!scores) {
    return []
  }

  const shortNames = props.quest?.startingScoreShortNames
  return Object.entries(scores).map(([scoreId, value]) => {
    const packShort = shortNames?.[scoreId]
    return {
      scoreId,
      label: packShort ?? scoreShortName(scoreId),
      value,
      mood: describeScoreWeather(value).label,
    }
  })
})
</script>

<style scoped>
.briefing-body {
  color: var(--dng-subtitle-warm);
}

.briefing-flavor {
  margin: 0 0 0.7rem;
  font-style: italic;
  color: #ead58a;
  font-size: var(--text-base);
  line-height: 1.45;
}

.briefing-remaining {
  margin: 0 0 0.7rem;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.briefing-description,
.briefing-turns,
.briefing-empty {
  margin: 0 0 0.7rem;
  font-size: var(--text-base);
  line-height: 1.55;
}

.briefing-body h3 {
  margin: 0.9rem 0 0.4rem;
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--dng-title-gold);
}

.briefing-council,
.briefing-mood {
  margin: 0 0 0.7rem;
  padding-left: 1.1rem;
  font-size: var(--text-base);
  line-height: 1.5;
}

.briefing-mood li {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  list-style: none;
  margin-left: -1.1rem;
  padding: 0.15rem 0;
  border-bottom: 1px solid rgba(176, 132, 42, 0.18);
}
</style>
