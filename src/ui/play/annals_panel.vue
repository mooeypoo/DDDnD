<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="Annals"
    subtitle="Every turn already resolved. Look, but do not rewrite it."
    size="lg"
    @close="$emit('close')"
  >
    <p v-if="pages.length === 0" class="annals-empty">The table has no memory yet.</p>
    <div v-else class="annals-book">
      <p class="annals-folio">
        Turn {{ currentTurn?.turn_number }} of {{ pages.length }}
      </p>
      <div class="annals-leaf">
        <Transition :name="pageMotion" mode="out-in">
          <article v-if="currentTurn" :key="currentTurn.turn_number" class="annals-page">
            <p class="annals-kicker">
              {{ currentTurn.intent === 'consult_archives' ? 'You searched' : 'You played' }}
            </p>
            <h3>{{ currentTurn.title }}</h3>
            <p class="annals-summary">{{ currentTurn.summary }}</p>
            <ul v-if="currentTurn.score_changes.length" class="annals-deltas">
              <li
                v-for="(change, index) in currentTurn.score_changes"
                :key="`${currentTurn.turn_number}-${change.score_id}-${index}`"
                :class="change.delta >= 0 ? 'gain' : 'loss'"
              >
                {{ formatScoreName(change.score_id) }}
                {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
              </li>
            </ul>
            <ul v-if="currentTurn.stakeholder_changes.length" class="annals-deltas">
              <li
                v-for="(change, index) in currentTurn.stakeholder_changes"
                :key="`${currentTurn.turn_number}-sh-${change.stakeholder_id}-${index}`"
                :class="change.delta >= 0 ? 'gain' : 'loss'"
              >
                {{ stakeholderLabel(change.stakeholder_id) }}
                {{ change.delta > 0 ? '+' : '' }}{{ change.delta }}
              </li>
            </ul>
            <ol class="annals-beats">
              <li v-for="beat in currentTurn.beats" :key="beat.id">
                <span class="annals-beat-kicker">{{ beatKicker(beat.kind) }}</span>
                <span class="annals-beat-title">{{ beat.title }}</span>
                <span v-if="beat.origin" class="annals-beat-origin">{{ beat.origin }}</span>
                <span class="annals-beat-copy">{{ beat.summary }}</span>
              </li>
            </ol>
          </article>
        </Transition>
      </div>
    </div>
    <template v-if="pages.length > 0" #footer>
      <div class="annals-pager">
        <button
          class="annals-flip"
          type="button"
          :disabled="!canGoEarlier"
          @click="goEarlier"
        >
          Previous
        </button>
        <button
          class="annals-flip"
          type="button"
          :disabled="!canGoLater"
          @click="goLater"
        >
          Next
        </button>
      </div>
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

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
const pageIndex = ref(0)
const pageMotion = ref('annals-forward')

const pages = computed(() => [...props.turns].slice().reverse())
const currentTurn = computed(() => pages.value[pageIndex.value] ?? null)
const canGoEarlier = computed(() => pageIndex.value > 0)
const canGoLater = computed(() => pageIndex.value < pages.value.length - 1)

function openOnLatest() {
  pageIndex.value = Math.max(0, pages.value.length - 1)
}

function goEarlier() {
  if (!canGoEarlier.value) return
  pageMotion.value = 'annals-back'
  pageIndex.value -= 1
}

function goLater() {
  if (!canGoLater.value) return
  pageMotion.value = 'annals-forward'
  pageIndex.value += 1
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.isOpen) return
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goEarlier()
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    goLater()
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) openOnLatest()
  },
  { immediate: true },
)

watch(
  () => props.turns.length,
  () => {
    if (props.isOpen) openOnLatest()
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

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

.annals-book {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.annals-folio {
  margin: 0;
  font-size: var(--text-kicker);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.annals-leaf {
  position: relative;
  min-height: 14rem;
  overflow: hidden;
}

.annals-page {
  padding: 0.9rem 1rem 1rem;
  border: 1px solid rgba(176, 132, 42, 0.28);
  border-radius: 4px 18px 4px 18px;
  background:
    linear-gradient(180deg, rgba(62, 42, 18, 0.35) 0%, rgba(12, 10, 6, 0.72) 100%);
  box-shadow: inset 0 1px 0 rgba(232, 196, 96, 0.12);
}

.annals-kicker {
  margin: 0 0 0.25rem;
  font-size: var(--text-kicker);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.annals-page h3 {
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

.annals-pager {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
}

.annals-flip {
  appearance: none;
  min-width: 7.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(176, 132, 42, 0.45);
  background: rgba(18, 12, 6, 0.85);
  color: var(--dng-title-gold);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.annals-flip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.annals-flip:not(:disabled):hover {
  border-color: rgba(232, 196, 96, 0.7);
  color: var(--text-bright);
}

.annals-forward-enter-active,
.annals-forward-leave-active,
.annals-back-enter-active,
.annals-back-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.annals-forward-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.annals-forward-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}

.annals-back-enter-from {
  opacity: 0;
  transform: translateX(-18px);
}

.annals-back-leave-to {
  opacity: 0;
  transform: translateX(18px);
}

@media (prefers-reduced-motion: reduce) {
  .annals-forward-enter-active,
  .annals-forward-leave-active,
  .annals-back-enter-active,
  .annals-back-leave-active {
    transition: none;
  }

  .annals-forward-enter-from,
  .annals-forward-leave-to,
  .annals-back-enter-from,
  .annals-back-leave-to {
    transform: none;
  }
}
</style>
