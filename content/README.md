# Content Directory

This directory contains all authored game content for DDDnD scenarios.

Each subdirectory holds a specific type of game content as versioned JSON files.

See CONTENT_SCHEMA.md and CONTENT_VERSIONING.md for details on content structure and versioning rules.

After changing base content, run `npm run content:lock`: community packs depend on what the base pack has shipped, and CI checks that it keeps that promise (CONTENT_VERSIONING.md, "The Base Pack's Promise").

For creating standalone or external content packs, see docs/CONTENT_PACK_AUTHORING_GUIDE.md.
