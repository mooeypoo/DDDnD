# ADR 0011: Pack authors validate with a reusable workflow published from DDDnD

Status: Accepted  
Date: 2026-11-22  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md) (entry M2.2)

## Context

Pack authors need to run DDDnD's validator and balance audit on their own repositories, ideally on every push. The question came up whether they need "our tests". They don't. DDDnD's test suite and hostile-pack fixtures test the *engine*. What authors need is the *validator*, applied to *their* pack.

The first version of the [DDDnD-packs](https://github.com/mooeypoo/DDDnD-packs) CI copied about 40 lines of workflow that checked out DDDnD, installed the whole game (including Storybook and the docs site), and called an internal script path. Every author copying that would drift from DDDnD and break when the script changed.

Three options were weighed:
- **A.** Each author copies the workflow (status quo).
- **B.** A reusable workflow published from DDDnD.
- **C.** An npm CLI package.

## Decision

1. **DDDnD publishes `.github/workflows/validate-pack.yml` as a reusable workflow** (`on: workflow_call`). A pack repository uses it in about 5 lines:

   ```yaml
   jobs:
     validate:
       uses: mooeypoo/DDDnD/.github/workflows/validate-pack.yml@<ref>
       with:
         dddnd-ref: <ref>
         packs: packs/*/
   ```

2. **It installs only what the validator needs:** DDDnD's runtime dependencies (`npm ci --omit=dev`, about 50 MB) and the exact `tsx` version from DDDnD's lockfile. The validator imports the content and simulation domains, never the game UI, so this is enough. That is one more practical payoff of keeping the domains free of UI imports.
3. **Each pack is checked the way the game loads it:**
   - schema per file,
   - scenarios built with their declared dependencies (`base` and `tutorial` from DDDnD, others via `dependency-roots`),
   - the balance audit (`audit-runs`, default 50, failing on critical findings by default).

   A failing pack fails the job but doesn't stop the other packs from being checked.
4. **Versioning:** callers pin a DDDnD ref in two places (`@<ref>` and `dddnd-ref`). A reusable workflow cannot reliably discover its own ref, so it is passed explicitly. After community packs merge, DDDnD will publish a moving major tag, `pack-validator-v1`, that only moves forward for compatible validator changes, like the `v1` tags of GitHub Actions. Authors pin to it and aren't broken by DDDnD's `main`.
5. **DDDnD-packs uses the reusable workflow itself,** so the published path is exercised by a real repository.
6. **Option C (an npm CLI) is not planned.** It is revisited only if pack authoring sees enough use to justify extracting and publishing the domains (the same trigger as ADR 0005's alternative).

## Consequences

- Authors get the same rules as the game, maintained in one place.
- Authors outside GitHub (GitLab, local only) still need a DDDnD checkout and the CLI command from the authoring guide.
- Changes to the validator's command-line interface are now a published contract for workflow callers, and go through the moving tag.

## Alternatives considered

- **A. Copy-paste workflow.** Rejected: drift, a heavy install, and dependence on internal paths.
- **C. npm package.** Deferred (decision 6).
- **A "test pack" of DDDnD's own tests for authors.** Rejected as a category error: engine tests belong to the engine. Authors need their *own* pack checked, which is what the validator does.
