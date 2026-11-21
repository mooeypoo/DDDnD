# ADR 0003: Remote packs load only from GitHub raw and GitHub Pages at first

Status: Accepted  
Date: 2026-11-21  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)  
Threat model: [docs/CONTENT_PACKS_SECURITY.md](../CONTENT_PACKS_SECURITY.md)

## Context

The game will load packs that authors host themselves. Every remote host a pack can name is another origin the game fetches from, a place that sees players' IP addresses, and an entry in the Content Security Policy. Allowing any `https` host from day one maximizes reach and also maximizes the attack surface and the moderation questions.

Our main authors are workshop facilitators. Most of them can push a folder to GitHub, and the Studio will export exactly that layout.

## Decision

1. **Allowed hosts at launch:** `raw.githubusercontent.com` and `<owner>.github.io` (GitHub Pages user and project sites). Both serve with permissive CORS.
2. **URL rules:**
   - `https:` only, no explicit port, no userinfo (`user:pass@`).
   - The hostname must match the allowlist exactly. For Pages, that means the `.github.io` suffix with a single owner label.
3. **No cross-origin fetches within a pack.** The manifest's `base_url` resolves relative to the manifest URL and must stay on the same origin. On `raw.githubusercontent.com` it must also stay under the same `owner/repo` path prefix.
4. **Redirects are refused** (`redirect: 'error'` or an equivalent response-URL check). This matters because a GitHub Pages site with a custom domain redirects `*.github.io` to that domain, which would silently leave the allowlist. Those authors use the raw URL instead.
5. **Local file import is always available**, with no network and no allowlist. A single-file bundled pack can be dropped into the game.
6. **The Content Security Policy** `connect-src` lists exactly these hosts plus `'self'`.
7. **We nudge authors to pin.** The consent screen says whether the URL points to a branch (mutable) or a tag or commit SHA (pinned), and the authoring docs recommend pinned URLs.
8. **The allowlist lives in the content domain** as pure data plus a pure check function, so the game, the Studio, and the CLI validator enforce exactly the same policy.

## Consequences

- Authors who self-host elsewhere must mirror to GitHub, or wait. That is a real cost, accepted for a safer launch.
- The policy is a single data structure, so widening it later is a small, reviewable change. Moving to "any `https` host" also means relaxing CSP `connect-src` to `https:` and re-reading the threat model (tracking, phishing, availability). That gets its own ADR.
- GitHub caches raw content for a few minutes and rate-limits it. Authors see delays after a push. The local snapshot from [ADR 0001](0001-community-content-packs.md) keeps a loaded pack working afterward.

## Alternatives considered

- **Any `https` host.** Deferred, not rejected.
- **jsDelivr GitHub mirror** (`cdn.jsdelivr.net/gh/...`). A reasonable next host to add: it is immutable at a tag and well cached. Left out to keep the first list minimal.
- **A DDDnD-hosted registry where authors upload packs.** Rejected for now. It makes us a host of user content, with accounts, moderation, storage, and legal exposure. A *curated directory* (a reviewed list of links in this repo) gets the discovery benefit without hosting anything (milestone M7).
