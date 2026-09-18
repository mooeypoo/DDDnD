import { describe, expect, it } from 'vitest'

import { classAffinityCopy } from '@/ui/play/class_affinity'

describe('classAffinityCopy', () => {
  it('names the engine play_turn bonus from pack short_name when provided', () => {
    expect(classAffinityCopy('domain_clarity', 'Clarity')).toBe('+1 Clarity when you play a card')
  })

  it('falls back to a plain id title when no pack short is available', () => {
    expect(classAffinityCopy('domain_clarity')).toBe('+1 Domain Clarity when you play a card')
  })

  it('stays quiet when a class has no affinity', () => {
    expect(classAffinityCopy(undefined)).toBeNull()
  })
})
