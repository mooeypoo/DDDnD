/**
 * Pack Source Policy (ADR 0003)
 *
 * Decides which URLs a community pack may be loaded from, and where its
 * content may live relative to its manifest. Pure functions over `URL`, so the
 * game, the CLI, and (later) Pack Studio apply exactly the same rules.
 *
 * Allowed at launch:
 * - `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/.../manifest.json`
 * - `https://<owner>.github.io/.../manifest.json` (GitHub Pages)
 */

/** Which kind of allowed host a pack comes from. */
export type PackHostKind = 'github_raw' | 'github_pages'

/**
 * Whether the URL can change content later.
 * - `commit`: a full commit SHA. Immutable.
 * - `release_tag`: looks like a release tag (`v1.2.3`, `gilded_ledger-v1.0.0`). Tags can
 *   technically be moved, but by convention aren't.
 * - `unpinned`: a branch name or anything else (and every GitHub Pages URL). Can change any time.
 */
export type PackPinning = 'commit' | 'release_tag' | 'unpinned'

/** A manifest URL that passed the policy, with what we learned about it. */
export interface PackSource {
  manifest_url: string
  host_kind: PackHostKind
  owner: string
  /** GitHub raw only. */
  repo?: string
  /** GitHub raw only: the branch, tag, or commit in the URL. */
  ref?: string
  pinning: PackPinning
  /**
   * The folder holding manifest.json: relative to the ref on GitHub raw, to
   * the site root on GitHub Pages. No leading or trailing "/"; "" at the root.
   */
  pack_dir: string
  /** URL prefix the pack's content must stay under. Always ends with "/". */
  content_scope: string
}

export type PackSourceCheck =
  | { ok: true; source: PackSource }
  | { ok: false; reason: string }

const RAW_HOST = 'raw.githubusercontent.com'
const PAGES_SUFFIX = '.github.io'
/** GitHub usernames: alphanumerics and single hyphens, up to 39 characters. */
const GITHUB_OWNER = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i
const GITHUB_REPO = /^[A-Za-z0-9._-]{1,100}$/
const COMMIT_SHA = /^[0-9a-f]{40}$/i
const RELEASE_TAG = /^(?:[A-Za-z0-9_.-]+-)?v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

function classifyRef(ref: string): PackPinning {
  if (COMMIT_SHA.test(ref)) return 'commit'
  if (RELEASE_TAG.test(ref)) return 'release_tag'
  return 'unpinned'
}

function fail(reason: string): PackSourceCheck {
  return { ok: false, reason }
}

/**
 * Checks a manifest URL against the source policy.
 */
export function checkPackSourceUrl(input: string): PackSourceCheck {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return fail('That is not a valid URL.')
  }

  if (url.protocol !== 'https:') return fail('Pack URLs must start with https://.')
  if (url.username || url.password) return fail('Pack URLs must not contain a username or password.')
  if (url.port) return fail('Pack URLs must not specify a port.')
  if (url.search || url.hash) return fail('Pack URLs must not have a query string or #fragment.')
  if (!url.pathname.endsWith('/manifest.json')) return fail('The URL must point to a pack\'s manifest.json file.')
  if (url.pathname.split('/').some((segment) => segment === '..' || segment === '.')) {
    return fail('Pack URLs must not contain "." or ".." path segments.')
  }

  const host = url.hostname.toLowerCase()
  const segments = url.pathname.split('/').filter(Boolean)

  if (host === RAW_HOST) {
    // /<owner>/<repo>/<ref>/<path...>/manifest.json, where ref may be refs/heads/<x> or refs/tags/<x>
    const [owner, repo, ...rest] = segments
    if (!owner || !GITHUB_OWNER.test(owner) || !repo || !GITHUB_REPO.test(repo)) {
      return fail('GitHub raw URLs look like https://raw.githubusercontent.com/<owner>/<repo>/<tag>/.../manifest.json.')
    }
    // Explicit forms: refs/heads/<branch> (never pinned) and refs/tags/<tag> (a tag by construction).
    const explicitRef = rest[0] === 'refs' && (rest[1] === 'heads' || rest[1] === 'tags')
    const refSegments = explicitRef ? 3 : 1
    if (rest.length <= refSegments) {
      return fail('The URL is missing the branch, tag, or commit after the repository name.')
    }
    const ref = rest.slice(0, refSegments).join('/')
    let pinning: PackPinning
    if (explicitRef) {
      pinning = rest[1] === 'heads' ? 'unpinned' : 'release_tag'
    } else {
      // A branch whose name contains "/" (feat/x) shows up here as its first
      // segment, which reads as unpinned and still yields a valid scope prefix.
      pinning = classifyRef(ref)
    }

    return {
      ok: true,
      source: {
        manifest_url: url.href,
        host_kind: 'github_raw',
        owner,
        repo,
        ref,
        pinning,
        pack_dir: rest.slice(refSegments, -1).join('/'),
        content_scope: `https://${RAW_HOST}/${owner}/${repo}/${ref}/`,
      },
    }
  }

  if (host.endsWith(PAGES_SUFFIX)) {
    const owner = host.slice(0, -PAGES_SUFFIX.length)
    if (!GITHUB_OWNER.test(owner)) {
      return fail('GitHub Pages URLs look like https://<owner>.github.io/.../manifest.json.')
    }
    return {
      ok: true,
      source: {
        manifest_url: url.href,
        host_kind: 'github_pages',
        owner,
        pinning: 'unpinned',
        pack_dir: segments.slice(0, -1).join('/'),
        content_scope: `https://${host}/`,
      },
    }
  }

  return fail('Packs can only be loaded from GitHub (raw.githubusercontent.com or a github.io site) for now.')
}

/**
 * Resolves a manifest's `base_url` against where the manifest was loaded from,
 * and checks the result stays inside the pack's allowed scope (same origin and,
 * on GitHub raw, the same owner/repo/ref).
 *
 * Returns the absolute content base URL, always ending in "/".
 */
export function resolvePackContentBase(source: PackSource, baseUrl: string): { ok: true; url: string } | { ok: false; reason: string } {
  let resolved: URL
  try {
    resolved = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`, source.manifest_url)
  } catch {
    return { ok: false, reason: `base_url "${baseUrl}" could not be resolved.` }
  }

  const href = resolved.href
  if (!href.startsWith(source.content_scope)) {
    return {
      ok: false,
      reason: `base_url "${baseUrl}" points outside the pack's location (${source.content_scope}).`,
    }
  }
  return { ok: true, url: href }
}
