import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BRIEFING_DISMISSED_STORAGE_KEY,
  hasCompletedTutorial,
  isBriefingDismissed,
  markTutorialCompleted,
  setBriefingDismissed,
} from '@/ui/services/player_preferences'

describe('player_preferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('answers first-time on a fresh browser', () => {
    expect(isBriefingDismissed()).toBe(false)
    expect(hasCompletedTutorial()).toBe(false)
  })

  it('remembers that the briefing was muted, and lets it be unmuted', () => {
    setBriefingDismissed(true)
    expect(isBriefingDismissed()).toBe(true)

    setBriefingDismissed(false)
    expect(isBriefingDismissed()).toBe(false)
    expect(window.localStorage.getItem(BRIEFING_DISMISSED_STORAGE_KEY)).toBeNull()
  })

  it('remembers a finished tutorial', () => {
    markTutorialCompleted()
    expect(hasCompletedTutorial()).toBe(true)
  })

  it('falls back to the first-time answer when storage throws', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    expect(() => setBriefingDismissed(true)).not.toThrow()
    expect(isBriefingDismissed()).toBe(false)
    expect(hasCompletedTutorial()).toBe(false)
  })
})
