/**
 * Share Payload Model
 *
 * Defines the compact, versioned share-result model used to encode
 * end-of-run summaries into shareable URLs.
 *
 * This model lives in the reporting domain because it produces
 * shareable results from simulation outcomes — it does not modify
 * simulation state.
 *
 * The payload is intentionally compact to fit comfortably in a URL.
 * Field names use short keys to minimize encoded size while remaining
 * readable in code through the type definition.
 */

import type { OutcomeArchetypeId } from '@/domains/simulation/rules/classify_outcome_archetype'

/**
 * Share payload version.
 *
 * Bump this when the payload shape changes in a breaking way.
 */
export const SHARE_PAYLOAD_VERSION = 1

/**
 * Compact share payload for URL-based sharing.
 *
 * Field naming convention: short but unambiguous keys to keep URL size small.
 */
export interface SharePayload {
  /** Payload format version — required for safe future evolution */
  v: number

  /** Scenario id */
  sid: string

  /** Scenario version */
  sv: number

  /** Selected class id (e.g. "boundary_mage") */
  cls: string

  /** Character display name (optional) */
  name?: string

  /** Outcome tier — "success" | "partial_success" | "failure" */
  tier: string

  /** Outcome archetype id */
  arch: OutcomeArchetypeId

  /** Selected tier id from content (e.g. "triumph", "survival") */
  tid: string | null

  /** Turns completed */
  tc: number

  /** Max turns */
  mt: number

  /** Score average (rounded to nearest integer for compactness) */
  avg: number

  /** Final scores — compact record of score_id → rounded value */
  scores: Record<string, number>

  /** Completion reason — "max_turns_reached" | "failure_condition_met" */
  cr: string
}

/**
 * Result of parsing a share payload.
 *
 * Wraps the payload in a discriminated union so callers can
 * branch on success/failure without exceptions.
 */
export type SharePayloadParseResult =
  | { ok: true; payload: SharePayload }
  | { ok: false; error: string }
