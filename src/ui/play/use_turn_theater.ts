import { computed, getCurrentInstance, onUnmounted, ref } from 'vue'

import type { TurnBeatSource, TurnBeat, TurnBeatKind, TurnTheaterNames } from '@/ui/play/turn_theater'
import { buildTurnBeats } from '@/ui/play/turn_theater'
import * as tableMoment from '@/ui/play/table_moment'
import type { ImpactTone } from '@/ui/play/table_moment'

export type TheaterPhase = 'idle' | 'fx' | 'beat'

/**
 * Sequences resolved turn beats on the war table.
 *
 * The engine has already finished the turn. This composable pages the replay
 * so the player can read each moment. Short table FX plays before each beat.
 * Advance of the readable card is player-paced.
 */
export function useTurnTheater() {
  const beats = ref<TurnBeat[]>([])
  const index = ref(-1)
  const phase = ref<TheaterPhase>('idle')
  let timer: ReturnType<typeof setTimeout> | null = null

  const currentBeat = computed(() => {
    if (phase.value !== 'beat' || index.value < 0 || index.value >= beats.value.length) {
      return null
    }

    return beats.value[index.value] ?? null
  })

  const fxBeat = computed(() => {
    if (phase.value !== 'fx' || index.value < 0) {
      return null
    }

    return beats.value[index.value] ?? null
  })

  const fxKind = computed<TurnBeatKind | null>(() => fxBeat.value?.kind ?? null)
  const fxStakeholderId = computed(() => fxBeat.value?.stakeholder_id ?? null)
  const voicingStakeholderId = computed(() => {
    const moment = phase.value === 'fx' ? fxBeat.value : currentBeat.value
    if (moment?.kind !== 'stakeholder') return null
    return moment.stakeholder_id ?? null
  })
  const fxEventId = computed(() => fxBeat.value?.event_id ?? null)
  const fxTone = computed<ImpactTone | null>(() => {
    if (!fxBeat.value) return null
    return tableMoment.impactTone(fxBeat.value.score_changes)
  })
  const isFxActive = computed(() => phase.value === 'fx')
  const isActive = computed(() => phase.value === 'fx' || phase.value === 'beat')
  const isComplete = computed(() => {
    return beats.value.length > 0 && index.value >= beats.value.length
  })
  const beatCount = computed(() => beats.value.length)
  const beatIndex = computed(() => (currentBeat.value ? index.value + 1 : 0))

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function finish() {
    clearTimer()
    index.value = beats.value.length
    phase.value = 'idle'
  }

  function revealBeat() {
    timer = null
    if (index.value < 0 || index.value >= beats.value.length) {
      phase.value = 'idle'
      return
    }

    phase.value = 'beat'
  }

  function startCurrentMoment() {
    clearTimer()
    const beat = beats.value[index.value]
    if (!beat) {
      phase.value = 'idle'
      return
    }

    const duration = tableMoment.tableFxDurationMs(beat.kind)
    if (duration <= 0) {
      phase.value = 'beat'
      return
    }

    phase.value = 'fx'
    timer = setTimeout(revealBeat, duration)
  }

  function play(context: TurnBeatSource, names?: TurnTheaterNames) {
    clearTimer()
    beats.value = buildTurnBeats(context, names)
    index.value = beats.value.length > 0 ? 0 : -1
    if (index.value < 0) {
      phase.value = 'idle'
      return
    }

    startCurrentMoment()
  }

  function advance() {
    if (index.value < 0) {
      return
    }

    if (index.value < beats.value.length - 1) {
      index.value += 1
      startCurrentMoment()
      return
    }

    finish()
  }

  function skip() {
    finish()
  }

  function dismiss() {
    clearTimer()
    beats.value = []
    index.value = -1
    phase.value = 'idle'
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      clearTimer()
    })
  }

  return {
    beats,
    index,
    phase,
    beatIndex,
    beatCount,
    currentBeat,
    fxKind,
    fxStakeholderId,
    voicingStakeholderId,
    fxEventId,
    fxTone,
    isFxActive,
    isActive,
    isComplete,
    play,
    advance,
    skip,
    dismiss,
  }
}
