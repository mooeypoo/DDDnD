import { computed, onUnmounted, ref } from 'vue'

import type { TurnResolutionContext } from '@/domains/simulation/model/turn_resolution_context'
import {
  TURN_BEAT_DURATION_MS,
  buildTurnBeats,
  type TurnBeat,
  type TurnTheaterNames,
} from '@/ui/play/turn_theater'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Sequences resolved turn beats on the war table.
 *
 * The engine has already finished the turn. This composable only times the
 * replay so the table can show aftershocks, the commitment, the event, and
 * stakeholder reactions as separate moments.
 */
export function useTurnTheater() {
  const beats = ref<TurnBeat[]>([])
  const index = ref(-1)
  let timer: ReturnType<typeof setTimeout> | null = null

  const currentBeat = computed(() => {
    if (index.value < 0 || index.value >= beats.value.length) {
      return null
    }

    return beats.value[index.value] ?? null
  })

  const isActive = computed(() => currentBeat.value !== null)

  const isComplete = computed(() => {
    return beats.value.length > 0 && index.value >= beats.value.length
  })

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleAdvance() {
    const beat = currentBeat.value
    if (!beat) {
      return
    }

    const duration = prefersReducedMotion() ? 450 : TURN_BEAT_DURATION_MS[beat.kind]
    timer = setTimeout(() => {
      advance()
    }, duration)
  }

  function play(context: TurnResolutionContext, names?: TurnTheaterNames) {
    clearTimer()
    beats.value = buildTurnBeats(context, names)
    index.value = beats.value.length > 0 ? 0 : -1
    scheduleAdvance()
  }

  function advance() {
    clearTimer()
    if (index.value < 0) {
      return
    }

    if (index.value < beats.value.length - 1) {
      index.value += 1
      scheduleAdvance()
      return
    }

    index.value = beats.value.length
  }

  function skip() {
    clearTimer()
    if (beats.value.length === 0) {
      return
    }

    index.value = beats.value.length
  }

  function dismiss() {
    clearTimer()
    beats.value = []
    index.value = -1
  }

  onUnmounted(() => {
    clearTimer()
  })

  return {
    beats,
    index,
    currentBeat,
    isActive,
    isComplete,
    play,
    advance,
    skip,
    dismiss,
  }
}
