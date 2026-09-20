/**
 * UI-owned player preferences.
 *
 * These record what a player has already been shown or already finished. They
 * are presentation state: they must never reach simulation, and they must
 * never change what a run does. Constrained browser contexts may block or
 * throw on storage, so every read falls back to the first-time answer.
 */

export const BRIEFING_DISMISSED_STORAGE_KEY = 'dddnd:briefing-dismissed'
export const TUTORIAL_COMPLETED_STORAGE_KEY = 'dddnd:tutorial-completed'

function readFlag(key: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    // Constrained browser contexts may block storage.
    return false
  }
}

function writeFlag(key: string, value: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (value) {
      window.localStorage.setItem(key, '1')
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Constrained browser contexts may block storage.
  }
}

/**
 * True when the player asked not to see the opening briefing again.
 */
export function isBriefingDismissed(): boolean {
  return readFlag(BRIEFING_DISMISSED_STORAGE_KEY)
}

/**
 * Records whether the opening briefing should be skipped on future runs.
 */
export function setBriefingDismissed(dismissed: boolean): void {
  writeFlag(BRIEFING_DISMISSED_STORAGE_KEY, dismissed)
}

/**
 * True when the player has finished at least one tutorial quest.
 *
 * Drives whether onboarding surfaces still recommend starting there.
 */
export function hasCompletedTutorial(): boolean {
  return readFlag(TUTORIAL_COMPLETED_STORAGE_KEY)
}

/**
 * Marks the tutorial recommendation as no longer needed.
 */
export function markTutorialCompleted(): void {
  writeFlag(TUTORIAL_COMPLETED_STORAGE_KEY, true)
}
