const DEFAULT_CONTENT_PACK_MANIFEST_URLS = [
  '/content/manifest.json',
  '/content/tutorial/manifest.json',
]

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
