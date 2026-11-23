# ADR 0015: Community packs live in their own place, grouped by pack

Status: Accepted  
Date: 2026-11-22  
Refines: [ADR 0014](0014-pack-keys-everywhere.md), decision 7 (where the publisher is shown) and decision 5 (game-wide choices; the future direction is recorded here)  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md) (entries M2.11 and M2.12)

## Context

Since M2.5, importing a community pack dealt its scenarios into the council lobby. Its adventures joined the base game's Adventures fan, and its tutorials joined the Tutorials tab, each with a small "Community" badge.

Testing by hand raised two problems:

1. **Confusion with the base game.** A community scenario sat among DDDnD's own as if it were one of them.
2. **Confusion between packs.** Packs can be about very different subjects, and a single mixed deck hides that.

The deciding question was "do packs only add one scenario?" They don't. A manifest lists any number of scenarios and tutorials. The thing a player chooses is a **pack**, and a scenario is chosen inside it.

The model already said so. Since ADR 0014, every scenario is addressed as (pack key, id, version), and content belongs to its pack. The lobby was the one place that flattened packs back out.

## Decision

1. **The council lobby (`/play`) shows first-party content only.** It links to the bazaar ("Community bazaar ›").
2. **The bazaar (`/community`)** lists imported packs, one stall each. A stall shows:
   - the name and version;
   - the publisher (from where the pack was loaded, ADR 0013);
   - how many adventures and tutorials it has;
   - its description;
   - an "External · not reviewed" mark.

   Each stall has Open, and Remove with a confirmation that names the cost to saved runs. Importing is an action below the stalls, not a stall. `?pack=` links and saved-run notices land in the bazaar.
3. **Each pack has its own table (`/community/<pack key>`).** It reuses the lobby's layout for that pack's scenarios only, under a banner: "Community pack · not reviewed by DDDnD", name, publisher, description.
   - It is the same for every pack, even one with a single scenario.
   - The pack key is the path, as is. A link to a pack that isn't imported in this browser lands in the bazaar with an explanation.
   - After a community run, "Play again", resetting the run, and leaving a tutorial all return to the pack's table. Tutorials suggested after a tutorial come from the same table.
4. **The community area has its own look.** It uses a warm canvas palette, a thin awning stripe, and a **stitched (dashed) border on community content**, which base content never uses. The look is a set of `.bazaar-theme` tokens.
5. **A community run is marked wherever it is seen or shared:**
   - the play screen;
   - the results screen;
   - the share card ("Community pack · name · publisher · not a DDDnD scenario").

   Share links carry the pack's name and publisher as an optional `cp` field: two plain-text strings of at most 160 characters each.
6. **The bazaar says where packs are kept:** "Kept in this browser only." There are no accounts and nothing about the player is stored, so packs don't follow a player to another browser or device, and clearing site data removes them. Players are told to keep their own list of pack links.
7. **The verb is "import".** "Add" read as if the player would create a pack, which is the future Studio's job.

## Consequences

- A community scenario can't be mistaken for a base one in the lobby. Two packs about different subjects never share a deck.
- Each pack's table is the natural home for pack-specific choices. **Built in M3 slice 8 (journal M3.10):** pack-owned classes and challenge modifiers (option A from the M2.12 brainstorm). A pack's table offers its own classes and modifiers plus those of the first-party packs it depends on, filtered to the scenario's scores. This supersedes ADR 0014 decision 5, whose refusal was needed only because the lobby offered every class with every scenario.
- **Share links stay forgeable,** as they always were: anyone can write a link with any scores, and now with any `cp` text, or with none. The marker is honest for links the game makes. It renders as plain text, so the worst case is unwanted text (ADR 0014).
- **Translation (overlay) packs** have no scenarios. Their stall will need to say what they change instead of offering a table. That comes with overlay packs.
- The lobby no longer shows the publisher on quest badges (ADR 0014 decision 7). The bazaar stall, the pack banner and the run labels show it instead.

## Alternatives considered

- **A third lobby tab ("Community").** It keeps one page but still frames community packs as part of the council. It can't show packs as groups without nesting tabs, and it can't be linked to.
- **Keep mixing, with stronger badges.** It doesn't scale past a few scenarios, and it hides which scenarios belong together.
- **Skip the table for single-scenario packs.** It saves a click, but the screen would then change shape depending on the pack. The owner chose consistency.
