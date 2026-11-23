import { describe, expect, it } from 'vitest'

import { endingIcon, GENERIC_ENDING_ICON } from '@/ui/play/ending_icons'

describe('ending icons (journal M3.7)', () => {
  it('keeps the base endings\' icons', () => {
    expect(endingIcon('firefighter')).toBe('🧯')
    expect(endingIcon('the_visionary')).toBe('🔭')
  })

  it("gives any other ending the generic icon, including a pack's and the tutorial's", () => {
    expect(endingIcon('pager_whisperer')).toBe(GENERIC_ENDING_ICON)
    expect(endingIcon('tutorial_learner')).toBe(GENERIC_ENDING_ICON)
  })

  it('never returns an object internal for ids like "constructor"', () => {
    expect(endingIcon('constructor')).toBe(GENERIC_ENDING_ICON)
    expect(endingIcon('__proto__')).toBe(GENERIC_ENDING_ICON)
  })
})
