# CONTENT_VERSIONING.md

This document explains how versioning works for content files.

Versioning ensures that older game runs remain compatible even as content evolves.

---

# Filename Format

Content files must use versioned filenames.
```
<id>-v<version>.json
```
Example:
```
define_bounded_context-v1.json
```

The file must include matching metadata:
```
"id": "define_bounded_context"
"version": 1
```

Filename and metadata must match.

---

# When to Increase Version

Increase the version when behavior changes.

Examples:

- score changes altered
- delayed effect timing changed
- stakeholder rule logic changed
- event probabilities changed
- card mechanics changed

Any change that could affect gameplay outcomes should produce a new version.

---

# When Not to Increase Version

Do not increase version for cosmetic changes such as:

- spelling corrections
- flavor text improvements
- clearer descriptions
- adding or renaming presentation-only fields that do not change gameplay numbers (for example score `short_name`)
- making existing behavior explicit in a new structured field when the result is provably identical (for example the M1.4 `condition` / `trigger_condition` migration, where a test proves every structured condition equals what the old prose resolved to in every playable scenario)

As long as gameplay behavior remains identical, version may remain unchanged.

---

# Never Modify Old Versions

Old content versions must remain unchanged once released.

If behavior must change, create a new version.

Example:
```
define_bounded_context-v1.json
define_bounded_context-v2.json
```

---

# The Base Pack's Promise

Community packs refer to base content by `id + version` and declare the base pack version they were made with. The game accepts them on any later base of the same major version. So, within a major version, the base pack:

- never removes a versioned file it has shipped,
- never changes how a shipped file plays (wording may change),
- raises its version when it adds content, so a pack that uses the new content declares a base that has it.

`scripts/base-content-lock.json` records what the base has shipped. You don't normally touch it:

- **Locally**, `npm install` installs a pre-commit hook (`.githooks/pre-commit`). When a commit includes base content, it records the lock and adds it to the commit, or stops the commit and says which rule it breaks. It also stops if base content has unstaged changes, because the lock is recorded from the files on disk.
- **In CI**, `npm run content:lock:check` runs as its own step ("Base content keeps its promise to published packs"), and the test suite checks it too.
- **By hand:** `npm run content:lock` records it, and `npm run content:lock:check` checks without writing.

Breaking the promise on purpose means a new major base version (2.0.0), which starts a new lock. The one allowed exception, behaviour made explicit in a new field with a test proving it plays identically, is recorded with `npm run content:lock -- --accept cards/<file>`.

---

# Scenario Compatibility

Runs reference content by:
```
id + version
```

This ensures that exported runs can replay correctly even if newer content exists.

---

# Agent Reminder

When editing content files:

1. Determine whether the change affects gameplay.
2. If yes, create a new version.
3. If no, edit safely without version change.

Agents should explain version changes when creating new versions.

Moving a playable scenario forward means bumping the manifest entry point to the new version. Leave the old file on disk. Exact-run replay of a retired playable version is not a support target unless a later note says otherwise.