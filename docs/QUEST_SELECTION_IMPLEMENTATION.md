# Quest And Tutorial Selection

Date: 2026-04-16
Status: Current implementation reference

Canonical companions:

- [AGENT.md](../AGENT.md) for boundaries and terminology
- [ARCHITECTURE.md](../ARCHITECTURE.md) for domain separation rules
- [docs/CONTENT_PACK_AUTHORING_GUIDE.md](./CONTENT_PACK_AUTHORING_GUIDE.md) for manifest entry-point authoring

## Summary

Run setup selection is content-pack driven. The UI does not hard-code quest IDs or tutorial IDs. Instead, it loads pack manifests, resolves available scenario and tutorial entry points from the registry, and maps them into a presentational model for selection cards.

## Source Of Truth

Quest and tutorial availability comes from content pack manifests:

- Main scenarios: `manifest.scenarios`
- Tutorial scenarios: `manifest.tutorials`

In the base repository, these are declared in:

- `content/manifest.json`
- `content/tutorial/manifest.json`

The store builds a `ContentPackRegistry`, registers manifests in order, and asks the registry for available refs.

## Selection Data Flow

1. Resolve manifest URLs via `resolveContentPackManifestUrls()`.
2. Load manifests and register them in `ContentPackRegistry`.
3. Build a merged content provider from the registry.
4. Load refs from registry entry points:
   - `getAvailableScenarios()` for main quests
   - `getAvailableTutorials()` for tutorial quests
5. Transform each loaded `Scenario` into `QuestDisplayModel` via `loadQuestDisplayModels()`.
6. Render quest cards in `run_setup_view.vue` and start runs using selected `{ id, version }`.

`loadQuestDisplayModels()` uses `Promise.allSettled()` and skips only failed items, so one bad scenario does not break setup.

## UI Boundary

The quest selection layer remains presentational:

- `QuestDisplayModel` only contains card-facing fields (name, short text, counts, tutorial metadata).
- Simulation rules remain in `src/domains/simulation`.
- Setup view chooses what to start; it does not evaluate gameplay logic.

## Tutorial Behavior

- Tutorials are loaded from registry tutorial entry points, not a separate hard-coded list.
- The setup screen defaults to tutorials until `dddnd.tutorialsComplete` is set in localStorage.
- Starting a tutorial run passes `is_tutorial: true` so tutorial state can initialize before the first briefing.

## How To Add Or Remove Playable Quests

1. Author or version scenario content under `content/scenarios/` (or tutorial content under `content/tutorial/scenarios/`).
2. Update pack manifest entry points:
   - Add/remove scenario refs in `scenarios` for main quests.
   - Add/remove scenario refs in `tutorials` for tutorial quests.
3. Ensure manifest inventory (`content.*` arrays) contains owned files.
4. Run validation:
   - `npm run content:validate`
   - `npm run content:validate:audit` (or `npm run audit:gate` for gate-style checks)

No setup-view code changes are required when entry points are correct.

## Key Files

- `src/domains/content/services/content_pack_registry.ts`
- `src/ui/stores/game_store.ts`
- `src/ui/services/quest_loader.ts`
- `src/ui/types/quest_display_model.ts`
- `src/ui/views/run_setup_view.vue`

## Test Coverage Touchpoints

- `tests/ui/quest_loader.test.ts`
- `tests/ui/run_setup_view.integration.test.ts`
- `tests/ui/game_store_orchestration.test.ts`
- `tests/content/content_pack_registry.test.ts`
