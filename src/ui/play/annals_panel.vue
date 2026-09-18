<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="Annals"
    subtitle="Every turn already resolved. Look, but do not rewrite it."
    size="lg"
    @close="$emit('close')"
  >
    <p v-if="turns.length === 0" class="annals-empty">The table has no memory yet.</p>
    <ol v-else class="annals-turns">
      <li v-for="turn in turns" :key="turn.turn_number" class="annals-turn">
        <p class="annals-kicker">
          Turn {{ turn.turn_number }}
          · {{ turn.intent === 'consult_archives' ? 'You searched' : 'You played' }}
        </p>
        <h3>{{ turn.title }}</h3>
        <p class="annals-summary">{{ turn.summary }}</p>
        <ul v-if="turn.score_changes.length" class="annals-deltas">
          <li
            v-for="(change, index) in turn.score_changes"
            :key="`${turn.turn_number}-${change.score_id}-${index}`"
            :class="change.delta >= 0 ? 'gain' : 'loss'"
          >
            {{ formatScoreName(change.score_id) }}
            {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
          </li>
        </ul>
        <ul v-if="turn.stakeholder_changes.length" class="annals-deltas">
          <li
            v-for="(change, index) in turn.stakeholder_changes"
            :key="`${turn.turn_number}-sh-${change.stakeholder_id}-${index}`"
            :class="change.delta >= 0 ? 'gain' : 'loss'"
          >
            {{ stakeholderLabel(change.stakeholder_id) }}
            {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
          </li>
        </ul>
        <ol class="annals-beats">
          <li v-for="beat in turn.beats" :key="beat.id">
            <span class="annals-beat-kicker">{{ beatKicker(beat.kind) }}</span>
            <span class="annals-beat-title">{{ beat.title }}</span>
            <span v-if="beat.origin" class="annals-beat-origin">{{ beat.origin }}</span>
            <span class="annals-beat-copy">{{ beat.summary }}</span>
          </li>
        </ol>
      </li>
    </ol>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import { useScoreLabels } from '@/ui/composables/use_score_labels'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import { beatKicker, type AnnalsTurn } from '@/ui/play/turn_theater'

const props = defineProps<{
  isOpen: boolean
  turns: AnnalsTurn[]
  stakeholderNames?: Record<string, string>
}>()

defineEmits<{
  close: []
}>()

const scoreLabels = useScoreLabels()

function formatScoreName(scoreId: string): string {
  return scoreLabels.short(scoreId)
}

function stakeholderLabel(stakeholderId: string): string {
  return props.stakeholderNames?.[stakeholderId] ?? stakeholderId
}
</script>

<style scoped>
.annals-empty {
  margin: 0;
  color: var(--text-secondary);
}

.annals-turns {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.annals-turn {
  padding: 0.75rem 0.8rem 0.8rem;
  border: 1px solid rgba(176, 132, 42, 0.22);
  border-radius: 12px;
  background: rgba(8, 12, 16, 0.45);
}

.annals-kicker {
  margin: 0 0 0.25rem;
  font-size: var(--text-kicker);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.annals-turn h3 {
  margin: 0 0 0.3rem;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  color: var(--text-bright);
}

.annals-summary {
  margin: 0 0 0.5rem;
  font-size: var(--text-base);
  line-height: 1.45;
  color: var(--text-primary);
}

.annals-deltas {
  list-style: none;
  margin: 0 0 0.55rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.annals-deltas li {
  font-size: var(--text-sm);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.28);
}

.gain { color: #b7e0c0; }
.loss { color: #f0a098; }

.annals-beats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.annals-beats li {
  display: grid;
  gap: 0.1rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(176, 132, 42, 0.16);
}

.annals-beat-kicker {
  font-size: var(--text-kicker);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.annals-beat-title {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--text-bright);
}

.annals-beat-origin {
  font-size: var(--text-sm);
  color: var(--dng-title-gold);
}

.annals-beat-copy {
  font-size: var(--text-sm);
  line-height: 1.4;
  color: var(--text-secondary);
}
</style>
