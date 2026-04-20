/**
 * Default manifest URLs bundled with the application.
 *
 * Order matters: defaults are resolved before external overrides and then deduped.
 */
const DEFAULT_CONTENT_PACK_MANIFEST_URLS = [
  '/content/manifest.json',
  '/content/tutorial/manifest.json',
]

/**
 * Returns a deterministic list of manifest URLs to load.
 *
 * Empty and whitespace-only external entries are ignored.
 * Duplicate URLs are removed while preserving first-seen order.
 */
export function resolveContentPackManifestUrls(externalManifestUrls: string[] = []): string[] {
  const normalizedExternalUrls = externalManifestUrls
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  const mergedManifestUrls = [...DEFAULT_CONTENT_PACK_MANIFEST_URLS, ...normalizedExternalUrls]

  const seen = new Set<string>()
  const deduped: string[] = []

  for (const manifestUrl of mergedManifestUrls) {
    if (seen.has(manifestUrl)) {
      continue
    }

    seen.add(manifestUrl)
    deduped.push(manifestUrl)
  }

  return deduped
}

export {
  DEFAULT_CONTENT_PACK_MANIFEST_URLS,
}
