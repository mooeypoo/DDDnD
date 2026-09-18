# Coding-Agent Implementation Constraints (Gameplay v2)

Date: 2026-09-17
Status: Canonical execution constraints for the `gameplay-v2` overhaul

This file is the operational contract for coding agents working on gameplay v2. For the full plan, play model, and slice sequence, read [GAMEPLAY_V2.md](GAMEPLAY_V2.md) first.

## 1. Scope by slice

Follow the slice sequence in [GAMEPLAY_V2.md](GAMEPLAY_V2.md). Do not skip ahead to Three.js.

- Slices 1–5: complete (engine hand, player-true audit, persistence, satchel wiring; +2 `max_turns` deferred).
- Slice 6: war table in `src/ui/play/`. `/game` defaults to the table; `?stage=legacy` restores the satchel stage.
- Slice 8: player-paced theater, Annals history panel, Consult as a spent-turn action.
- Slice 9: table moments — card flight, kind-specific beat interludes, remaining-turns clock. Theater plaques (`You play`, aftershocks, adjourn) teleport to a fixed viewport layer; do not put them back inside `.war-table` (it isolates and clips, and the hand paints over later siblings). System events are a rafter omen (shaft, seal, ribbon), not a muted inlay bolt and not an aftershock quake. Aftershock origin (source card/event and how many turns ago) is presentation of `source_id` / `source_turn` on the resolved record. Do not reconstruct it from history in Vue, and do not write that sentence in the simulation.
- Slice 10: antechamber — chamber door, council lobby, table-moment welcome. Lore plaques (About / How to play / Dungeon Master) match the table. Lobby quests fan as overlapping plates with a Tutorials / Adventures toggle; that is presentation, not a second legal hand. Scene backgrounds are large; `/play` holds a chamber veil until content and lobby scene/portrait URLs have been preloaded. Presentation only — no simulation wait.
- Slice 11: tutorial audit — pressure now authors an opening hand and a Consult beat; basics still has no Grimoire. Still no Three.js; still no `max_turns` bump.
- Slice 13 (current, landed): informed choice, and an audit worth believing. The lobby says what varies between adventures and marks each plate Easy / Normal / Hard, derived in `src/ui/play/quest_difficulty.ts` from `SCENARIO_BALANCE_TARGETS` — the same bands CI gates on — so there is no second source of difficulty to drift. The fan is gentlest first (`sortQuestsByDifficulty`) and the lobby opens on that first plate; returning from tutorials does the same. Tutorials keep teaching order. Class picker gets a heading and an unmistakable selected state. Separately: `createSeededRandom` now avalanches its seed hash. Without it, seeds differing only in a trailing index (`..._run_1`, `..._run_2`) started an LCG a few steps apart and stayed correlated, giving a 200-run audit batch ~15 runs of information. Fairness holds under v2 once measured properly; no content was retuned. Do not reintroduce a per-scenario authored difficulty field or a `sort_order`, do not restore pack order on the fan, and do not lower the CI gate below 400 runs.
- Slice 12 (landed): first contact. A cold player was never told the objective. The door names the quest, `RunIntroSplash` becomes the teach (derived charge line, turn shape, dismissible, tutorial link for first-timers), and the weather strip becomes a readable scoreboard with per-turn deltas at three breakpoints. Copy and presentation only: the charge line is view-model logic over the starting `ScoreSnapshot`, not a content field. Player preferences are UI-owned and must not reach simulation. Still no Three.js; still no `max_turns` bump.

Do not mix simulation rules into Vue. The war table only renders the briefing hand and calls `play_turn` / `consult_archives`. Consult may pass an optional `draw_id` that names a remaining deck card; omitting it draws the next legal page. Random replacement peeks that page so the approval can name it. This is still a spent turn, not a free catalog. After a play, the UI may fly a replenished page from the Grimoire into the empty fan slot; that is presentation of `diffHandCards` arrived ids, not a second draw. Scenarios may pin `opening_hand_card_ids` so a tutorial can name the opening fan without a Vue deal.

## 2. Boundary Rules

- Keep strict separation between UI/presentation and simulation/domain.
- A legal hand is a **simulation rule**. Do not implement it only in Vue.
- `consult_archives` is an **engine verb**, not a content card.
- Scene selection and avatarRole assignment remain UI-only.
- Do not leak scene/avatar logic into domain models, content schema, or simulation rules.
- Simulation must not import Vue, Pinia, DOM, or browser storage.

## 3. Terminology Rules

Use in new work:

- playerClass
- endingType
- avatarRole

Do not introduce archetype as a new generic term.
Legacy references may remain only where already established.

## 4. Asset Rules

- Scene backgrounds and avatar mood art are presentation-only raster assets.
- UI chrome, ornamental frames/surfaces, icons, and badges should be SVG assets.
- Use individual transparent avatar mood files as implementation assets.
- Mood sheets are reference-only.
- Pack authors must not need to ship 3D assets.

## 5. Test Rules

- Do not change tests only to force passing status.
- When the rule under test changes (catalog-legal vs hand-legal), update the test to exercise the new rule and say so.
- New hand/consult behavior needs new simulation tests, including determinism.

## 5a. Local verification (do not hang the session)

Vite on this machine binds `127.0.0.1:5173` outside the agent sandbox. Cursor IDE `browser_navigate` to localhost **hangs** — the MCP browser cannot reach that loopback socket and waits on page load. Do not retry it. Verify with host `curl`, headless Chrome, tests, or the human's own browser tab.

## 6. Companion Docs

- [GAMEPLAY_V2.md](GAMEPLAY_V2.md)
- [SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md)
- [PRESENTATION_ASSET_PLAN.md](PRESENTATION_ASSET_PLAN.md)
