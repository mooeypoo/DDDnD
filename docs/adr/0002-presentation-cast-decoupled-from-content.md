# ADR 0002: Stakeholder cast and scenes are assigned by the UI, never declared by content

Status: Accepted  
Date: 2026-11-21  
Implemented: M2.10 (see the journal entry for how decisions 2, 4 and 5 were applied)  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md) (section "Presentation: who decides what a stakeholder looks like?")

## Context

Once anyone can write a pack, authors will want to control how things look: "the CFO is the dragon warrior", "this scenario is in the throne room", "this score is red". The first proposal was an optional per-pack `presentation.json` with a fixed set of allowed values.

That collides with an existing rule in [AGENT.md](../../AGENT.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md): scene selection, `avatarRole` assignment, and presentation concepts are UI-only and must not leak into content or validation.

The question in the design discussion was: do we need content to say anything about looks at all? What if the UI assigns characters itself every time?

Looking at the code, the game already mostly does this. [gameplay_stage_presentation.ts](../../src/ui/composables/gameplay_stage_presentation.ts) shuffles the avatar-role pool with `Math.random()` and picks a role by hashing the stakeholder id. That version has three defects:

1. **Two stakeholders can get the same role**, because it uses `hash(id) % pool.length`, not distinct assignment.
2. **The cast is inconsistent across screens.** Play uses the shuffled pool. The end-of-run view and the share card call `resolveStakeholderAvatarRole(id)` with the default, unshuffled pool. The same stakeholder can look different on the results screen than during play.
3. **The cast is not stable.** `Math.random()` means a reload or replay of the same run gets a different cast.

Scenes have the same coupling in a smaller form: `SCENARIO_SCENE_BY_ID` maps base scenario ids to backgrounds and falls back to a single default for everything else.

## Decision

1. **Content packs contain no presentation fields.** No avatar roles, no scene ids, no colors, no image paths. No `presentation.json`. The existing architecture rule stays as written.
2. **The UI assigns a cast per run, derived from the run seed.** A single UI function computes the cast once per run. It uses a UI-local seeded generator derived from the run seed and a fixed salt, assigns distinct roles in stable stakeholder order, and every surface (play, end of run, share card, replay) uses that same function.
3. **The presentation generator never touches the simulation's random stream.** It is a separate instance in UI code. Changing art can never change gameplay, and determinism tests for the engine stay valid.
4. **Scenes follow the same rule.** First-party scenarios may keep a hand-picked scene in the UI map. Any other scenario gets a seeded pick from the scene pool.
5. **Score colors and icons** for scores the UI does not know are picked from a palette by position in the scenario's `score_refs`.
6. **When there are more stakeholders than roles**, the UI cycles deterministically. Validation limits stakeholders per scenario, so this stays an edge case.

## Consequences

- The view is fully decoupled from the engine and from content. We can add, remove, or redraw avatar roles and scenes without touching any pack or any content version.
- Changing the role pool changes the cast of old runs on replay. This is a cosmetic difference and is accepted. If it ever matters, the cast function can take a pool version.
- Authors cannot pick a look for a stakeholder. We think this is acceptable, and even right: in a workshop, the stakeholder's *name and behavior* are the teaching material. A random cast also makes repeat play feel fresh.
- The three existing defects get fixed as part of this work (milestone M2), which improves the base game too.

## Alternatives considered

- **`presentation.json` per pack with enum values, validated by the UI.** Workable, but it bends the architecture rule and makes every future art change a compatibility question for third-party packs.
- **Presentation hints inside content entities** (for example `avatar_role_hint` on a stakeholder). Rejected because it is the same leak, but in the core files.
- **Truly random per screen load.** Rejected because the same stakeholder must look the same within a run, across a reload, and in the share card.
