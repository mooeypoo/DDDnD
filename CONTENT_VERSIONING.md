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