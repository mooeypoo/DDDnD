# ADR 0004: Packs that build on the base pack must use a GPL-3.0-compatible license

Status: Accepted (pending a legal sanity check; see Consequences)  
Date: 2026-11-21  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)

## Context

The base content pack is `GPL-3.0-only` ([content/manifest.json](../../content/manifest.json)). Manifests already require a valid SPDX `license` ([manifest_validator.ts](../../src/domains/content/services/manifest_validator.ts)).

The Studio will offer "start from the base pack" templates, and `extension` packs depend on base content by reference. A pack that copies and edits base cards is very likely a derivative work. A pack that only references base content is less clear-cut.

## Decision

1. **Every pack declares a valid SPDX license.** This is already enforced today.
2. **The license must be GPL-3.0-compatible when:**
   - the pack declares a dependency on the base pack (`depends_on` includes `base`), or
   - the pack was created in the Studio from a base-pack template.

   For now that means `GPL-3.0-only` or `GPL-3.0-or-later`. The validator rejects anything else in these cases.
3. **`standalone` packs that neither depend on nor derive from base content may use any SPDX license.** The Studio suggests a content-appropriate license (for example `CC-BY-SA-4.0`) and explains the choice in plain language.
4. **The Studio tells authors about the license at the moment they choose a template**, not as small print at export time.

## Consequences

- This is the conservative, safe choice. It may be stricter than the law requires for reference-only `extension` packs. If so, we can relax it later with a new ADR. Loosening is easy; tightening after packs exist is not.
- We are not lawyers. Before the Studio ships (milestone M4), this rule gets a sanity check from someone qualified. Until then the status carries that caveat.
- The compatible-license list is data in the content domain, shared by the game, the Studio, and the CLI validator.

## Alternatives considered

- **Any SPDX license, author's responsibility.** Simplest, but it leaves authors exposed and makes the base pack's license easy to violate by accident.
- **Relicensing base content under a more permissive content license.** Out of scope for this feature. It is a separate decision for the project owner.
