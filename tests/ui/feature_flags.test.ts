import { afterEach, describe, expect, it, vi } from 'vitest'

import { isCommunityPacksEnabled, parseFlag } from '@/ui/config/feature_flags'

describe('feature flags (ADR 0009)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is on only for the exact string "true"', () => {
    expect(parseFlag('true')).toBe(true)
    for (const value of [undefined, '', 'false', 'TRUE', '1', 'yes', ' true']) {
      expect(parseFlag(value), String(value)).toBe(false)
    }
  })

  it('keeps community packs off unless the build sets the flag', () => {
    vi.stubEnv('VITE_ENABLE_COMMUNITY_PACKS', '')
    expect(isCommunityPacksEnabled()).toBe(false)
    vi.stubEnv('VITE_ENABLE_COMMUNITY_PACKS', 'true')
    expect(isCommunityPacksEnabled()).toBe(true)
  })
})
