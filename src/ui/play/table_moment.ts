import type { TurnBeatKind } from '@/ui/play/turn_theater'

/**
 * Presentation timing for table interludes.
 *
 * These waits are UI-only. The engine turn is already resolved.
 */
export const CARD_FLIGHT_DURATION_MS = 820
export const REFILL_FLIGHT_DURATION_MS = 720
export const AFTERSHOCK_FX_DURATION_MS = 1400

export type ImpactTone = 'boon' | 'blow' | 'mixed'

/**
 * Glow for an aftershock (or any scored beat) from engine deltas.
 *
 * Net positive is a delayed mercy. Net negative is a delayed cost.
 * Zero or empty is mixed. This does not invent scores.
 */
export function impactTone(changes: Array<{ delta: number }>): ImpactTone {
  const net = changes.reduce((sum, change) => sum + change.delta, 0)
  if (net > 0) return 'boon'
  if (net < 0) return 'blow'
  return 'mixed'
}

export function prefersReducedPlayMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function tableFxDurationMs(kind: TurnBeatKind): number {
  if (prefersReducedPlayMotion()) {
    return 0
  }

  switch (kind) {
    case 'action':
    case 'consult':
      return CARD_FLIGHT_DURATION_MS
    case 'event':
      return 760
    case 'aftershock':
      return AFTERSHOCK_FX_DURATION_MS
    case 'stakeholder':
      return 620
    default:
      return 640
  }
}

export function waitForMs(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
