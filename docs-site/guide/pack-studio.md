# Making a pack in the Studio

::: info For authors
The Pack Studio is DDDnD's editor for packs: no code, no files to write by hand. It opens to everyone at its launch. To write a pack's files by hand instead, see [Content authoring](/guide/content-authoring).
:::

A **pack** is a set of DDDnD adventures someone made: their scenario, their council, the moves their team argues about. Players import a pack in the game's [Community bazaar](/guide/community-packs) and play it like any other adventure.

## What a pack holds

- **Scores:** what a run is judged on, each phrased so higher is better.
- **The council:** the people whose satisfaction rises and falls with your moves. A reaction says when one of them speaks up ("when User Trust drops below 40").
- **Cards:** one move a turn. Each gains something and costs something.
- **Events:** what happens between turns, good and bad.
- **Endings:** the kind of leader the run says you were.

## Two kinds of pack

- **DDD retelling:** domain-driven design, in your world. It keeps the game's scores and endings, with your own scenario, people and moves. Made for workshops: "the Monolith, but ours".
  - Example: *The Gilded Ledger*, a payments company.
- **New subject:** teach something else, such as incident response, security or product discovery. Its scores, council, cards and endings are all its own, on the game's outcome tiers.
  - Example: *SRE: The Pager Storm*.

## Three ways to start

**Create a pack** asks what your pack is about, then how you want to start:

- **Step by step.** The guided round builds a small, playable pack with you, with a worked example beside every step.
  - A retelling takes about fifteen minutes and starts from a copy of the game's scenario closest to yours.
  - A new subject takes two sittings:
    - the first is what it trades off, where it starts and who's at the table;
    - the second is the cards, events, endings and a class.
- **From one of the game's scenarios** (retellings). Preview a scenario first: where its scores start, its council, its deck. Then start from it, or keep looking. Your copy plays exactly like the original until you change it.
- **From scratch.**
  - A retelling from scratch has the game's scores and endings and nothing else; you seat a council and fill the deck.
  - A new subject from scratch has a scenario, an ending every run can reach, and a class to play as.

Already have a pack file or zip? **Import** it to keep editing.

## Looking inside the examples

The Studio carries two finished packs from the [DDDnD-packs repository](https://github.com/mooeypoo/DDDnD-packs), each at a released version: *The Gilded Ledger* (a DDD retelling) and *SRE: The Pager Storm* (a new subject). Open one with **Look inside**, from the welcome page, the create screen, or a guided round's example.

An example opens **view-only**: every part of it is there to read, and nothing can change. It never appears in your packs.

To start a new subject from *SRE: The Pager Storm*, choose **Start a pack from this** on the example, or **From an example** when you create a pack. Your copy has all of it, under your name and a pack id of its own; the original stays as it is.

## Working on a pack

- **The summary** says how the pack began and where to go next. Every step can be done in any order.
- **The sidebar** lists everything in the pack, and **Find** (Ctrl K, or ⌘ K on a Mac) finds anything by name or by its words.
- **Connections are made where you are.** A card's change can name a new council member or score, which you fill in later.
- **Undo and Redo** take back whole steps. Typing a name is one step.

## Checks, balance, and playing it

- **The checks** are the game's own: the same ones a player's import runs. Each problem has **Go to it**, which opens the field to fix. A pack exports only when they all pass.
- **Balance hints** compare your deck with the game's own scenarios. They're arithmetic, not a playtest, and never stop an export.
- **Play it** opens your pack in the game, in a tab of its own. Nothing is saved there.

## Three things to keep in mind

These come from building the SRE pack, whose first draft never won a run:

1. **Every move trades something away, but still gains more than it costs.** The trade-off lives in *which* scores move, not in the total.
2. **Scores should pull against each other.** If nothing ever lowers a score, the best plan is to raise it every turn, and one strategy wins.
3. **Endings should be reachable, and mean something in your subject.** "Firefighter" meant different things in DDD and in SRE.

## Sharing it

- **Packs live in your browser** until you export them. Export to keep a copy of your own.
- **The pack file** (`.dddnd-pack.json`) is what players import in the bazaar. Send it to your workshop, or host it and share the link.
- **The zip** holds the same pack as a folder, with a README, ready for GitHub. The [example packs](https://github.com/mooeypoo/DDDnD-packs) live in a repository like that.
