# What Is The Content Catalog?

Welcome to the game's x-ray mode.

The Content Catalog is a readable lens over the authored game content. It pulls from the active content manifest and renders the JSON-backed data as human-friendly pages so you can inspect what is actually in play.

## Where This Data Comes From

The catalog is generated from content declared in the current content pack manifest, then presented through dashboard views for:

- Scenarios
- Cards
- Stakeholders
- Events

In other words: this is not a hand-written wiki. It is a dynamic reflection of authored content.

## Why It Exists

Raw JSON is great for machines, less great for fast design review. The catalog makes content easier to audit, compare, and reason about without digging through dozens of files.

Use it when you want to:

- Validate authored intent against what was actually loaded
- Spot missing references or surprising combinations
- Review balancing surfaces across entities
- Debug behavior seen in audit findings

## What You Can See Here That Players Cannot

Some details exposed in the dashboard are intentionally hidden during normal gameplay because they would leak internal mechanics.

Examples include:

- Internal references between entities
- Versioned linkages used by authored content
- Architecture aftereffects and delayed-effect wiring
- Under-the-hood metadata that supports simulation and diagnostics

That transparency is intentional for designers and maintainers: this view is meant for inspection, not mystery.

## How To Use This Section

Start with any catalog page and drill into entity details:

1. Scenarios for full context and related content
2. Cards for effects and dependencies
3. Stakeholders for reaction-rule structure
4. Events for pressure patterns and effect chains

If the game feels odd in play, this section is usually the fastest way to find out why.
