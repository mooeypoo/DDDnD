# ADR 0008: One public repository holds several packs (demos now, sanctioned packs later)

Status: Accepted  
Date: 2026-11-21  
Refines: [ADR 0006](0006-delivery-order-loading-before-studio.md), decision 2 ("hosted in its own public GitHub repository")  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)

## Context

ADR 0006 planned the demo pack in its own public repository. While planning M2, the project owner asked whether one repository could hold several packs: the first demo, later demos, and eventually packs the project vouches for ("sanctioned" packs). That would give one home for every pack the project publishes outside the game build.

The M1 design allows it. A pack is addressed by its manifest URL, not by its repository. The source rules in ADR 0003 only require that a pack's `base_url` stays on the manifest's origin and, on `raw.githubusercontent.com`, under the same `owner/repo` prefix. Two packs in sibling folders of one repository satisfy that.

## Decision

1. **One repository, created and owned by the project owner, holds several packs.** The name is the owner's choice (candidates: `dddnd-packs`, `dddnd-demos`, `dddnd-external`, `dddnd-content`).
2. **Layout:** one folder per pack, each a complete pack:

   ```text
   <repo>/
     README.md
     index.json                 # list of packs in this repo (see 4)
     packs/
       <pack_id>/
         manifest.json
         scenarios/ cards/ stakeholders/ ...
   ```

   Players load a pack by its manifest URL, preferably pinned to a tag:
   `https://raw.githubusercontent.com/<owner>/<repo>/<tag>/packs/<pack_id>/manifest.json`
3. **Each pack is independent.** Packs in the same repository don't share files. The registry's one-owner rule (M1.3) would refuse that anyway. If one pack builds on another, it declares it in `depends_on` like any other pack.
4. **`index.json` is a plain list** of the repository's packs, with a `status` of `demo` or `sanctioned`. The game does not read it in M2. It is the seed of the curated directory (milestone M7), so the format is kept minimal and will get its own schema when the game starts reading it.
5. **The demo pack still has an in-repo copy** under `tests/` so CI never depends on the network (unchanged from ADR 0006).

## Consequences

- One place to publish, tag, and review every pack the project stands behind.
- Tags cover the whole repository, so releasing one pack creates a tag the other packs also have. Manifest URLs pinned to a tag stay immutable, which is what matters for saves and replays (ADR 0001, decision 9).
- "Sanctioned" is a label, not a security boundary. Sanctioned packs still go through exactly the same validation, consent, and labeling as any community pack. Trust affects discovery, never validation.

## Alternatives considered

- **One repository per pack** (ADR 0006 as written). Cleaner isolation, but more repositories to create and maintain for small demo packs.
- **Hosting demo packs inside the game build.** Rejected in ADR 0006: it would skip the remote path we most need to exercise.
