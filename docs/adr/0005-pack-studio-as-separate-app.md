# ADR 0005: Pack Studio is a separate local-first app that shares the domain code, not the game UI

Status: Accepted  
Date: 2026-11-21  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)

## Context

Authors need a way to create, edit, validate, and balance packs without hand-writing dozens of versioned JSON files. We want this as a secondary site on a subdomain of dddnd.app, deployed separately on Netlify.

The Studio's balance numbers must match what players will experience. If the Studio ran a copy of the engine, or a reimplementation, its numbers would drift from the game's.

## Decision

1. **Same repository, separate app.** The Studio is its own Vite app (working name `studio/`) with its own Netlify site, base directory, and build command. It is served on its own subdomain (working name `studio.dddnd.app`).
2. **Import boundary:**
   - The Studio may import `src/domains/content`, `src/domains/simulation`, and `src/domains/reporting`.
   - The Studio must not import the game's `src/ui`.
   - The game must not import anything from the Studio.

   The engine, schemas, validators, bundle builder, simulation runner, and audits are then literally the same code in both apps.
3. **A new pure `authoring` domain** (`src/domains/authoring`) owns the editing model: draft packs, editing operations (create, rename with ref cascade), the version-bump assistant, lint rules, and import/export. Like the other domains, it does not import Vue, the DOM, or storage. The Studio UI calls it the way the game UI calls the engine.
4. **Local-first, no backend.**
   - Drafts are kept in the browser (IndexedDB) through an adapter in the Studio app.
   - No accounts. We never store authors' content.
   - Export produces a single-file bundle (`.dddnd-pack.json`) for direct loading, and a zip in the repository layout for GitHub hosting.
   - Import accepts both formats.
5. **The game never unzips.** Zip handling exists only in the Studio. The game accepts the single-file bundle or a hosted manifest URL.
6. **Balance runs happen in a Web Worker** so long simulations do not freeze the editor. Workers use the same simulation runner and audits as the CLI (`npm run content:validate:audit`).
7. **Playtest handoff** (later milestone) uses `postMessage` from the Studio to a game preview route. The game accepts a message only from the Studio's exact origin, and preview runs never write to normal saves.

## Consequences

- The domain code becomes a shared kernel between two apps. Changing a domain API now affects both, and CI must build and test both.
- Visual consistency between the Studio and the game is not free. Shared design tokens may later be extracted into a small shared module that both UIs import. Game components are not shared, by rule.
- No backend means no server-side "publish to GitHub" at first. A GitHub OAuth flow would need a small serverless function. That is a later, optional milestone with its own ADR.
- The architecture docs gain a new domain and a new app boundary. They are updated when the work starts (milestone M4), and [ARCHITECTURE.md](../../ARCHITECTURE.md) already notes the plan.

## Alternatives considered

- **Studio as a route inside the game.** Rejected. It mixes authoring language and dependencies (editors, zip, workers) into the player bundle, and blurs the play and authoring contexts.
- **A separate repository with the engine published as an npm package.** Cleaner in theory. In practice it adds versioning and release overhead before we know the API is stable. Can be revisited once the shared kernel settles.
- **A hosted backend with accounts and saved packs.** Rejected for the same reasons as a hosted registry in [ADR 0003](0003-remote-pack-source-allowlist.md).
