import { nextTick, ref } from 'vue'

import { CARD_FLIGHT_DURATION_MS, prefersReducedPlayMotion, waitForMs } from '@/ui/play/table_moment'

export type CommitmentFlightMode = 'play' | 'consult'

export interface CommitmentFlight {
  name: string
  mode: CommitmentFlightMode
  x: number
  y: number
  width: number
  height: number
  rotate: number
  scale: number
  moving: boolean
  held: boolean
}

interface CapturedCommitment {
  name: string
  mode: CommitmentFlightMode
  from: DOMRect
}

function escapeSelector(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value.replace(/["\\]/g, '\\$&')
}

/**
 * Flies a played or set-aside card from the hand onto the table (or toward
 * the Grimoire). Presentation only; it does not change engine state.
 */
export function useCommitmentFlight() {
  const flight = ref<CommitmentFlight | null>(null)
  const captured = ref<CapturedCommitment | null>(null)
  const landedName = ref<string | null>(null)

  function capture(cardId: string, name: string, mode: CommitmentFlightMode) {
    if (typeof document === 'undefined') {
      captured.value = { name, mode, from: new DOMRect() }
      return
    }

    const origin = document.querySelector(`[data-card-id="${escapeSelector(cardId)}"]`)
    captured.value = {
      name,
      mode,
      from: origin?.getBoundingClientRect() ?? new DOMRect(),
    }
  }

  function holdCaptured() {
    const shot = captured.value
    if (!shot || prefersReducedPlayMotion() || shot.from.width === 0) {
      return
    }

    flight.value = {
      name: shot.name,
      mode: shot.mode,
      x: shot.from.left,
      y: shot.from.top,
      width: shot.from.width,
      height: shot.from.height,
      rotate: shot.mode === 'play' ? -6 : 8,
      scale: 1.06,
      moving: false,
      held: true,
    }
  }

  async function playCaptured() {
    const shot = captured.value
    captured.value = null
    const holding = flight.value?.held ? flight.value : null

    const name = holding?.name ?? shot?.name
    const mode = holding?.mode ?? shot?.mode

    if (!name || !mode || prefersReducedPlayMotion()) {
      landedName.value = mode === 'play' ? name ?? null : null
      flight.value = null
      return
    }

    const landing = document.querySelector('[data-table-landing]')
    const archive = document.querySelector('[data-look-grimoire]')
    const destEl = mode === 'consult' ? archive ?? landing : landing
    const dest = destEl?.getBoundingClientRect()
    const originWidth = holding?.width ?? shot?.from.width ?? 0
    const originHeight = holding?.height ?? shot?.from.height ?? 0
    const originX = holding?.x ?? shot?.from.left ?? 0
    const originY = holding?.y ?? shot?.from.top ?? 0

    if (!dest || originWidth === 0) {
      landedName.value = mode === 'play' ? name : null
      flight.value = null
      return
    }

    const destX = dest.left + dest.width / 2 - originWidth / 2
    const destY = dest.top + dest.height / 2 - originHeight / 2

    flight.value = {
      name,
      mode,
      x: originX,
      y: originY,
      width: originWidth,
      height: originHeight,
      rotate: holding?.rotate ?? (mode === 'play' ? -8 : 12),
      scale: holding?.scale ?? 1,
      moving: false,
      held: false,
    }

    await nextTick()
    if (!flight.value) {
      return
    }

    flight.value = {
      ...flight.value,
      x: destX,
      y: destY,
      rotate: mode === 'consult' ? 18 : 0,
      scale: mode === 'consult' ? 0.55 : 0.86,
      moving: true,
      held: false,
    }

    await waitForMs(CARD_FLIGHT_DURATION_MS)
    landedName.value = mode === 'play' ? name : null
    flight.value = null
  }

  function cancelFlight() {
    captured.value = null
    flight.value = null
  }

  function settle() {
    if (captured.value?.mode === 'play' || flight.value?.mode === 'play') {
      landedName.value = captured.value?.name ?? flight.value?.name ?? landedName.value
    }

    cancelFlight()
  }

  function clear() {
    cancelFlight()
    landedName.value = null
  }

  return {
    flight,
    landedName,
    capture,
    holdCaptured,
    playCaptured,
    cancelFlight,
    settle,
    clear,
  }
}
