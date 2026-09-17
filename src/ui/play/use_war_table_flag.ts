/**
 * Play-stage flag for gameplay v2.
 *
 * `/game` defaults to the war table. `?stage=legacy` restores the satchel
 * stage. A matching localStorage value persists the choice across reloads.
 */

export const PLAY_STAGE_STORAGE_KEY = 'dddnd:play-stage'

export type PlayStage = 'table' | 'legacy'

function firstQueryValue(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }

  return null
}

function readStoredStage(): PlayStage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(PLAY_STAGE_STORAGE_KEY)
    if (stored === 'table' || stored === 'legacy') {
      return stored
    }
  } catch {
    // Constrained browser contexts may block storage.
  }

  return null
}

/**
 * Resolves which play shell `/game` should render.
 */
export function resolvePlayStage(stageQuery?: unknown): PlayStage {
  const fromQuery = firstQueryValue(stageQuery)
  if (fromQuery === 'legacy' || fromQuery === 'table') {
    return fromQuery
  }

  return readStoredStage() ?? 'table'
}

/**
 * True when the war table play shell should own `/game`.
 */
export function isWarTableEnabled(stageQuery?: unknown): boolean {
  return resolvePlayStage(stageQuery) === 'table'
}
