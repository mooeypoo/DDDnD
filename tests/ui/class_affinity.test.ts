import { describe, expect, it } from 'vitest'

import { classAffinityCopy } from '@/ui/play/class_affinity'

describe('classAffinityCopy', () => {
  it('names the engine play_turn bonus without inventing a consult bonus', () => {
    expect(classAffinityCopy('domain_clarity')).toBe('+1 Clarity when you play a card')
  })

  it('stays quiet when a class has no affinity', () => {
    expect(classAffinityCopy(undefined)).toBeNull()
  })
})
