import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  preloadImageUrls,
  resetPreloadedPresentationAssets,
} from '@/ui/composables/preload_presentation_assets'

describe('preloadPresentationAssets', () => {
  afterEach(() => {
    resetPreloadedPresentationAssets()
    vi.unstubAllGlobals()
  })

  it('resolves immediately in test mode without hanging on Image decode', async () => {
    await expect(preloadImageUrls(['/scene-a.png', '/scene-b.png'])).resolves.toBeUndefined()
    // Second call is a no-op against the warmed set.
    await expect(preloadImageUrls(['/scene-a.png'])).resolves.toBeUndefined()
  })

  it('ignores empty urls', async () => {
    await expect(preloadImageUrls(['', '/only-real.png', ''])).resolves.toBeUndefined()
  })
})
