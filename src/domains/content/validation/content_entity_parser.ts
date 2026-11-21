/**
 * Content Entity Parser
 *
 * The single entry point that turns one untrusted content file into a typed
 * content entity. Every content provider (browser fetch, disk-based scripts,
 * future bundle-file import) calls this, so the same rules apply everywhere.
 */

import type { ContentType } from '../services/content_provider'
import type { VersionRef } from '../model/version_ref'
import { versionRefKey } from '../model/version_ref'
import type {
  Card,
  ChallengeModifier,
  DelayedEffect,
  Event,
  OutcomeArchetype,
  OutcomeTier,
  PlayerClass,
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
} from '../model/content_types'
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
import type { z } from './schema_primitives'

/**
 * Maps each content type to the entity type it produces.
 */
export interface ContentEntityByType {
  scenarios: Scenario
  scores: Score
  stakeholders: Stakeholder
  'stakeholder-reaction-rules': StakeholderReactionRule
  cards: Card
  events: Event
  'delayed-effects': DelayedEffect
  'outcome-tiers': OutcomeTier
  'outcome-archetypes': OutcomeArchetype
  classes: PlayerClass
  'challenge-modifiers': ChallengeModifier
}

const SCHEMA_BY_TYPE: { [K in ContentType]: z.ZodMiniType<ContentEntityByType[K]> } = {
  scenarios: scenarioSchema,
  scores: scoreSchema,
  stakeholders: stakeholderSchema,
  'stakeholder-reaction-rules': stakeholderReactionRuleSchema,
  cards: cardSchema,
  events: eventSchema,
  'delayed-effects': delayedEffectSchema,
  'outcome-tiers': outcomeTierSchema,
  'outcome-archetypes': outcomeArchetypeSchema,
  classes: playerClassSchema,
  'challenge-modifiers': challengeModifierSchema,
}

/**
 * One field-level problem, with a dotted path an author can follow
 * (for example `score_changes[1].delta`).
 */
export interface ContentSchemaIssue {
  path: string
  message: string
}

/**
 * Thrown when a content file does not match its schema.
 */
export class ContentSchemaError extends Error {
  constructor(
    public contentType: ContentType,
    public ref: VersionRef,
    public issues: ContentSchemaIssue[],
  ) {
    super(
      `Invalid content ${contentType}/${versionRefKey(ref)}.json: ` +
      issues.map((issue) => `${issue.path || '(file)'}: ${issue.message}`).join('; '),
    )
    this.name = 'ContentSchemaError'
  }
}

/**
 * Formats a Zod issue path as `field[0].nested`.
 */
export function formatIssuePath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === 'number') {
      return `${formatted}[${segment}]`
    }
    const key = String(segment)
    return formatted ? `${formatted}.${key}` : key
  }, '')
}

/**
 * True when the raw JSON has a value at `path`. JSON has no `undefined`, so a
 * missing value means the author left the field out.
 */
function hasValueAtPath(raw: unknown, path: readonly PropertyKey[]): boolean {
  let current: unknown = raw
  for (const segment of path) {
    if (typeof current !== 'object' || current === null || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return false
    }
    current = (current as Record<PropertyKey, unknown>)[segment]
  }
  return current !== undefined
}

const TYPE_NAMES: Record<string, string> = {
  int: 'a whole number',
  number: 'a number',
  string: 'text',
  boolean: 'true or false',
  array: 'a list',
  object: 'an object',
  record: 'an object',
}

function sizeUnit(origin: string): string {
  if (origin === 'string') return ' characters'
  if (origin === 'array' || origin === 'set') return ' items'
  return ''
}

/**
 * Turns one Zod issue into a short, author-facing message.
 *
 * `zod/mini` ships without English messages (a locale would cost bundle size),
 * and generic messages like "Invalid input" are useless to a pack author
 * anyway. Our own wording is written for the people who will read it in the
 * CLI today and in Pack Studio later. Checks that carry their own message
 * (regex and refine checks in schema_primitives) keep that message.
 */
export function describeIssue(issue: z.core.$ZodIssue, raw?: unknown): string {
  switch (issue.code) {
    case 'invalid_type':
      if (raw !== undefined && !hasValueAtPath(raw, issue.path)) return 'is required'
      return `must be ${TYPE_NAMES[issue.expected] ?? issue.expected}`
    case 'too_big':
      return `must be at most ${String(issue.maximum)}${sizeUnit(issue.origin)}`
    case 'too_small':
      return `must be at least ${String(issue.minimum)}${sizeUnit(issue.origin)}`
    case 'unrecognized_keys':
      return `unknown field${issue.keys.length > 1 ? 's' : ''} ${issue.keys.map((key) => `"${key}"`).join(', ')} (check the spelling)`
    case 'invalid_value':
      return `must be one of ${issue.values.map((value) => JSON.stringify(value)).join(', ')}`
    case 'invalid_key':
      return `has an invalid key: ${issue.issues.map((inner) => describeIssue(inner)).join('; ')}`
    case 'invalid_element':
      return `has an invalid entry: ${issue.issues.map((inner) => describeIssue(inner)).join('; ')}`
    case 'invalid_union':
      return 'does not match any allowed shape'
    case 'not_multiple_of':
      return `must be a multiple of ${issue.divisor}`
    default:
      return issue.message
  }
}

/**
 * Converts Zod issues into author-facing issues.
 */
export function toSchemaIssues(error: z.core.$ZodError, raw?: unknown): ContentSchemaIssue[] {
  return error.issues.map((issue) => ({
    path: formatIssuePath(issue.path),
    message: describeIssue(issue as z.core.$ZodIssue, raw),
  }))
}

/**
 * Validates one raw content value against its type's schema.
 *
 * Returns the parsed entity, which contains only known fields.
 * Throws ContentSchemaError with every issue found.
 */
export function parseContentEntity<K extends ContentType>(
  contentType: K,
  ref: VersionRef,
  raw: unknown,
): ContentEntityByType[K] {
  const result = SCHEMA_BY_TYPE[contentType].safeParse(raw)
  if (!result.success) {
    throw new ContentSchemaError(contentType, ref, toSchemaIssues(result.error, raw))
  }
  return result.data
}
