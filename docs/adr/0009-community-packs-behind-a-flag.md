# ADR 0009: Community packs ship behind a build-time flag until we choose to launch

Status: Superseded by [ADR 0016](0016-community-packs-launched.md)  
Date: 2026-11-21  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)

## Context

M2 adds player-facing surfaces: a community packs entry in the lobby, a consent screen, and remote loading. The project owner wants to merge work to `main` as it progresses without exposing an unfinished feature on dddnd.app, and to turn it on in development to try it.

## Decision

1. **A single build-time flag, `VITE_ENABLE_COMMUNITY_PACKS`, gates every community-pack surface.** It is on only when set to exactly `true`. Unset, empty, or anything else means off, so production is off unless someone deliberately sets it.
2. **Where it is set:**
   - **Local development:** the developer's own `.env` (git-ignored). `.env.example` documents the flag.
   - **Netlify production:** not set (off).
   - **Netlify deploy previews or branch deploys:** may set it in the Netlify UI, scoped to that context, to try the feature on a real URL.
3. **The flag lives in the UI layer** (`src/ui/config/feature_flags.ts`). The content domain hardening from M1 is always on, flag or not, because it protects first-party content too.
4. **Every M2 entry point checks the flag:** the lobby entry, a `?pack=` link, local file import, and any restore of a saved community-pack run. With the flag off, the game behaves exactly as before, and a `?pack=` link is ignored.
5. **The production CSP is not widened while the flag is off.** Allowing the GitHub hosts in `connect-src` (ADR 0003) is part of launching, together with flipping the flag. Netlify's dev server doesn't send the CSP, so local work isn't blocked. A deploy preview with the flag on needs the CSP change in that branch.

## Consequences

- M2 work can merge to `main` slice by slice, with production unchanged.
- **Launching is a small, reviewable change:** set the flag in Netlify production and add the hosts to `connect-src` in `netlify.toml`. The journal keeps a launch checklist.
- Build-time flags mean turning the feature off again needs a redeploy. For a launch toggle, that is acceptable.

## Alternatives considered

- **Runtime flag** (query string or localStorage, like the play-stage flag). Rejected as the gate, because anyone could turn it on in production. That is fine for a UI experiment, not for a feature that fetches third-party content.
- **A long-lived feature branch.** Rejected, because it drifts from `main` and makes the PR hard to review.
