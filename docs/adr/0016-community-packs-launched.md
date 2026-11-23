# ADR 0016: Community packs are launched; the flag is removed

Status: Accepted  
Date: 2026-11-24  
Supersedes: [ADR 0009](0009-community-packs-behind-a-flag.md)  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)

## Context

ADR 0009 put community packs behind a build-time flag (`VITE_ENABLE_COMMUNITY_PACKS`) so M2 and M3 could merge to `main` without exposing an unfinished feature on dddnd.app. Its launch plan was to set the flag in Netlify production and widen the CSP's `connect-src` in the same change.

By M3's end, everything the launch checklist asked for was done:

- the bazaar, pack tables, review and import;
- saved runs;
- content-driven endings, tiers, coupling and classes;
- two example packs pinned to release tags;
- the player and author docs.

The project owner chose to launch.

## Decision

1. **The flag is removed, not flipped.** `src/ui/config/feature_flags.ts`, its test, the `ImportMeta` typing and the `.env.example` entry are deleted. Every entry point it guarded is always on:
   - the bazaar and pack-table routes;
   - the lobby's "Community bazaar" link;
   - `?pack=` links and saved-run notices;
   - the browser's pack store.
2. **The CSP allows exactly the allowlisted pack hosts:** `connect-src 'self' https://raw.githubusercontent.com https://*.github.io`. These match ADR 0003's source policy, which still checks every URL's full shape in the app. The CSP is the second wall if that check ever fails.
3. **The docs say it's live:** the player page drops its "not switched on yet" notice, and the packs repository's README drops its "switched off" status line.

## Why remove instead of flipping

- A flag left permanently on is dead weight: every new entry point would have to remember to check it, and tests would keep mocking it.
- Flipping it in Netlify's settings would also make the launch invisible in the repository. Removing it makes the launch a reviewed, revertible commit, with the CSP and docs in the same change.

## Consequences

- **Turning community packs off again means reverting this change** (or re-adding a flag), followed by a deploy. ADR 0009 already accepted that a build-time switch needs a redeploy.
- **Players can fetch from GitHub hosts.** Fetching a pack tells GitHub the player's IP address. The import dialog only fetches on an explicit player action, and the example packs only fill in the link, never load it (ADR 0003, M2.3).
- **ADR 0009's other decisions stand:** domain rules were never flagged, and the security reasoning in CONTENT_PACKS_SECURITY.md is unchanged.

## Verification

On a production build served with the CSP from `netlify.toml` (headless Chrome, no flag set):

- the lobby offers the bazaar;
- the SRE pack imports from its `sre_on_call-v1.0.0` tag with no CSP violations;
- a run starts at its table;
- a deliberate fetch to another host (`example.com`) is blocked by `connect-src`.
