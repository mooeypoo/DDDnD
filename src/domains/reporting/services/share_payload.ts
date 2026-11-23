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

import type { OutcomeArchetypeId } from '@/shared/contracts'

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

  /**
   * Final stakeholder satisfaction values (rounded).
   *
   * Optional for backward compatibility with older links.
   */
  stakeholders?: Record<string, number>

  /** Completion reason — "max_turns_reached" | "failure_condition_met" */
  cr: string

  /**
   * Run seed, so the share card shows the cast the run was played with
   * (ADR 0002). Optional: older links don't have it.
   */
  sd?: string

  /**
   * Community pack the run was played with: name (`n`) and publisher (`p`),
   * so the card says it isn't a DDDnD scenario (journal M2.12). Absent for
   * first-party runs. Shown as plain text only.
   */
  cp?: { n: string; p: string }

  /**
   * Display names of the ending (`an`) and tier (`tn`), from the run's
   * content (M3 slice 1). A shared link opens without the pack, so the names
   * travel with it. Older links fall back to title-cased ids.
   */
  an?: string
  tn?: string

  /**
   * Display names of the scenario (`sn`) and the player's class (`cn`), from
   * the run's content (journal M3.11). A pack's scenario and class can't be
   * looked up where the link is opened, so the names travel with it. Older
   * links fall back to title-cased ids.
   */
  sn?: string
  cn?: string
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
