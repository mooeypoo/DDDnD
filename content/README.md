# Content Directory

This directory contains all authored game content for DDDnD scenarios.

Each subdirectory holds a specific type of game content as versioned JSON files.

See CONTENT_SCHEMA.md and CONTENT_VERSIONING.md for details on content structure and versioning rules.

Community packs depend on what the base pack has shipped, so the base keeps a promise to them (CONTENT_VERSIONING.md, "The Base Pack's Promise"). A pre-commit hook, installed by `npm install`, records `scripts/base-content-lock.json` when you commit base content, and CI checks it.

For creating standalone or external content packs, see docs/CONTENT_PACK_AUTHORING_GUIDE.md.
