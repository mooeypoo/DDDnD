/**
 * Preload presentation image URLs before revealing a chamber surface.
 *
 * Presentation only: this warms the browser cache for scene art already
 * resolved by the UI registries. It does not touch simulation or content packs.
 */

const warmedUrls = new Set<string>()

function shouldSkipDecode(): boolean {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return true
  }

  // Vitest/jsdom never decodes real image bytes; do not hang the lobby.
  return import.meta.env.MODE === 'test'
}

function preloadOne(url: string): Promise<void> {
  if (warmedUrls.has(url)) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const img = new Image()
    let settled = false

    const done = () => {
      if (settled) return
      settled = true
      warmedUrls.add(url)
      resolve()
    }

    img.onload = done
    img.onerror = done
    img.src = url

    if (img.complete) {
      done()
    }
  })
}

/**
 * Decode each unique URL once. Failures still resolve so a missing asset
 * cannot trap the player behind the veil forever.
 */
export function preloadImageUrls(urls: readonly string[]): Promise<void> {
  const unique = [...new Set(urls.filter((url) => Boolean(url)))]
  if (unique.length === 0 || shouldSkipDecode()) {
    for (const url of unique) {
      warmedUrls.add(url)
    }
    return Promise.resolve()
  }

  return Promise.all(unique.map((url) => preloadOne(url))).then(() => undefined)
}

/**
 * Test helper: forget warmed URLs so a suite can assert a fresh preload.
 */
export function resetPreloadedPresentationAssets(): void {
  warmedUrls.clear()
}
