# Tutorial Content

This directory contains content files for the tutorial system.

Tutorial content is **completely separate** from main gameplay content.
It uses the same schema and structure as main content, but lives in its own namespace.

## Structure

```
tutorial/
├── scenarios/          Tutorial scenario definitions
├── cards/              Tutorial action cards
├── events/             Tutorial events
├── delayed-effects/    Tutorial delayed effects
├── scores/             Tutorial score definitions
├── stakeholders/       Tutorial stakeholders
├── stakeholder-reaction-rules/  Tutorial stakeholder rules
├── scripts/            Tutorial hint/guidance scripts
├── outcome-tiers/      Tutorial outcome tiers
└── outcome-archetypes/ Tutorial outcome archetypes
```

## Content Isolation Rules

- Tutorial content must NOT reference or depend on main game content files
- Main game content must NOT reference tutorial content
- Tutorial scenarios use the same engine rules but with tutorial-specific entities
- The content provider loads tutorial content from `/content/tutorial/` instead of `/content/`

## Tutorial Scripts

Tutorial scripts (`scripts/` directory) are a tutorial-specific content type.
They define step-by-step guidance hints triggered by game events (turn start, turn end, run start, run end).

Script files are referenced by scenarios via the `tutorial_script_ref` field.

## Modifying Tutorial Content

When gameplay mechanics change:
1. Review tutorial content to ensure it still accurately represents the game
2. Update tutorial scripts if the UI or flow has changed
3. Test both tutorials end-to-end after mechanical changes
