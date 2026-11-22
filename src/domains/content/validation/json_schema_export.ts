/**
 * JSON Schema Export
 *
 * Generates the published JSON Schemas for pack authors from the same Zod
 * schemas the game validates with (ADR 0007). Authors get editor autocomplete
 * and inline errors by adding `"$schema": "<url>"` to a file.
 *
 * JSON Schema cannot express every rule: refinements (blank text, forbidden
 * characters, cross-field rules such as license compatibility) are not
 * included. The game's validator, the CLI, and Pack Studio remain the authority.
 *
 * Not exported from the validation barrel on purpose: the game never needs it,
 * so it stays out of the player bundle. Used by `scripts/generate-json-schemas.ts`
 * and a drift test.
 */

import { CURRENT_PACK_SCHEMA_VERSION } from './pack_policy'
import { manifestShapeSchema } from './manifest_schema'
import {
  cardSchema,
  challengeModifierSchema,
  delayedEffectSchema,
  eventSchema,
  outcomeArchetypeSchema,
  outcomeTierSchema,
  playerClassSchema,
  scenarioSchema,
  scoreSchema,
  stakeholderReactionRuleSchema,
  stakeholderSchema,
} from './content_entity_schemas'
import { z } from './schema_primitives'

/** Where published schemas live. */
export const JSON_SCHEMA_BASE_URL = `https://dddnd.app/schema/v${CURRENT_PACK_SCHEMA_VERSION}/`

const PUBLISHED_SCHEMAS: Array<{ name: string; title: string; schema: z.ZodMiniType }> = [
  { name: 'manifest', title: 'DDDnD content pack manifest', schema: manifestShapeSchema },
  { name: 'scenario', title: 'DDDnD scenario', schema: scenarioSchema },
  { name: 'card', title: 'DDDnD architecture card', schema: cardSchema },
  { name: 'event', title: 'DDDnD event', schema: eventSchema },
  { name: 'delayed-effect', title: 'DDDnD delayed effect (aftershock)', schema: delayedEffectSchema },
  { name: 'score', title: 'DDDnD score', schema: scoreSchema },
  { name: 'stakeholder', title: 'DDDnD stakeholder', schema: stakeholderSchema },
  { name: 'stakeholder-reaction-rule', title: 'DDDnD stakeholder reaction rule', schema: stakeholderReactionRuleSchema },
  { name: 'outcome-tier', title: 'DDDnD outcome tier', schema: outcomeTierSchema },
  { name: 'outcome-archetype', title: 'DDDnD outcome archetype', schema: outcomeArchetypeSchema },
  { name: 'class', title: 'DDDnD player class', schema: playerClassSchema },
  { name: 'challenge-modifier', title: 'DDDnD challenge modifier', schema: challengeModifierSchema },
]

/**
 * Returns `{ "<name>.schema.json": schemaObject }` for every published schema.
 */
export function generateJsonSchemas(): Record<string, Record<string, unknown>> {
  const files: Record<string, Record<string, unknown>> = {}

  for (const { name, title, schema } of PUBLISHED_SCHEMAS) {
    const generated = z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' }) as Record<string, unknown>
    const properties = (generated.properties ?? {}) as Record<string, unknown>
    const filename = `${name}.schema.json`

    files[filename] = {
      $schema: generated.$schema,
      $id: `${JSON_SCHEMA_BASE_URL}${filename}`,
      title,
      description:
        `Generated from the DDDnD content validator (pack format ${CURRENT_PACK_SCHEMA_VERSION}). ` +
        'Some rules (non-blank text, forbidden characters, cross-field rules) are only checked by the game and CLI validator.',
      ...generated,
      properties: {
        $schema: { type: 'string', description: 'Optional link to this schema, for editor support. Ignored by the game.' },
        ...properties,
      },
    }
  }

  return files
}
