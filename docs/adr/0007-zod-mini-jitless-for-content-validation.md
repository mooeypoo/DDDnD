# ADR 0007: Validate content with `zod/mini` in jitless mode, with our own error messages

Status: Accepted  
Date: 2026-11-21  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md) (section 11, entry M1.1)  
Builds on: [ADR 0001](0001-community-content-packs.md)

## Context

ADR 0001 requires a field-level schema for every content file and named Zod v4 as the working proposal. It ruled out Ajv because Ajv compiles validators with `new Function`, which a strict Content Security Policy blocks.

Implementing M1 turned up three facts the proposal did not account for:

1. **Zod v4 also uses `new Function` by default.** It probes whether `eval` is allowed so it can compile faster object parsers. The probe is wrapped in `try`/`catch`, so it works under a strict CSP. But browsers still report the blocked attempt as a CSP violation, which would put noise in every violation report we ever collect. Zod's own source says so, and offers `z.config({ jitless: true })` to skip the probe.
2. **The classic Zod API is heavy for this app.** Measured on the production build: +99 kB raw / +28 kB gzipped on the main bundle (431 → 530 kB). That is about a 20% increase, right after a performance PR.
3. **`zod/mini` has no English error messages by default.** Its default message is "Invalid input". Loading the English locale adds back some of the size we saved.

## Decision

1. **Use `zod/mini`** (the functional, tree-shakable API on the same Zod v4 core). Measured cost: +32 kB raw / +9.5 kB gzipped.
2. **Set `jitless: true`** in the one module every schema imports (`schema_primitives.ts`), before any schema is constructed.
3. **Write our own author-facing messages** (`describeIssue` in `content_entity_parser.ts`) from Zod's structured issue codes. Examples: "is required", "must be a whole number", `unknown field "stakehoder_changes" (check the spelling)`. Checks we define ourselves (id grammar, blank text, forbidden characters) carry their own wording.
4. **Keep a test that spies on the `Function` constructor during validation.** With the classic API, that test failed when jitless was off, which confirms it can catch the problem. With `zod/mini`, our schemas never reach the JIT path, so jitless is a second safeguard. The test guards the outcome regardless of library internals.

## Consequences

- Content validation never evaluates generated code. That keeps the planned strict CSP (`script-src 'self'`, no `unsafe-eval`) clean.
- The error messages are ours, in the project's voice, and ready for Pack Studio's validation panel. In exchange, we maintain about 40 lines of message mapping.
- Schemas use function-call style (`z.optional(x)`, `.check(z.maxLength(n))`) instead of method chains. That's slightly more verbose, which we accepted for the bundle size.
- JSON Schema generation for authors (later in M1) uses `toJSONSchema`, which `zod/mini` also exports.

## Alternatives considered

- **Classic `zod` with `jitless`.** Same behavior and nicer syntax, but +28 kB gzipped. Rejected on size.
- **Valibot.** Comparable size and a similar design. Zod was already the proposal in ADR 0001, has wider adoption, and has built-in JSON Schema output. Not worth re-litigating.
- **Hand-written validators** (the style of the existing `manifest_validator.ts`). No dependency, but every schema would be written twice (validator plus JSON Schema for authors), and the two would drift.
- **Ajv.** Rejected in ADR 0001 (CSP).
