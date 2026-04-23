/**
 * Share Serialization
 *
 * URL-safe encoding and decoding for the share payload.
 *
 * Approach:
 *   1. JSON.stringify the payload
 *   2. Compress-safe encode using base64url (no padding)
 *   3. Place in a query parameter: ?d=<encoded>
 *
 * We use standard btoa/atob with URL-safe character substitution
 * (+→-, /→_, strip =) so the payload survives in URL query strings
 * without additional percent-encoding.
 *
 * For future size optimization, a binary compression layer (e.g.
 * pako/deflate) could be inserted before base64 encoding.
 *
 * Lives in the reporting domain because it handles share result
 * encoding — it does not depend on Vue, Pinia, or the browser DOM
 * beyond the standard btoa/atob functions.
 */

import {
  SHARE_PAYLOAD_VERSION,
  type SharePayload,
  type SharePayloadParseResult
} from './share_payload'
import type { OutcomeArchetypeId } from '@/shared/contracts'

// ─── Base64url helpers ───────────────────────────────────────

function toBase64Url(input: string): string {
  // Encode to standard base64, then swap to URL-safe alphabet
  const base64 = btoa(unescape(encodeURIComponent(input)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  // Restore standard base64 alphabet and padding
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const paddingNeeded = (4 - (base64.length % 4)) % 4
  base64 += '='.repeat(paddingNeeded)
  return decodeURIComponent(escape(atob(base64)))
}

// ─── Encode / Decode ─────────────────────────────────────────

/**
 * Encode a share payload into a URL-safe string.
 */
export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload)
  return toBase64Url(json)
}

/**
 * Decode and validate a share payload from an encoded string.
 *
 * Returns a discriminated result so the caller can handle errors
 * without try/catch.
 */
export function decodeSharePayload(encoded: string): SharePayloadParseResult {
  if (!encoded || encoded.trim().length === 0) {
    return { ok: false, error: 'Empty share payload' }
  }

  let json: string
  try {
    json = fromBase64Url(encoded)
  } catch {
    return { ok: false, error: 'Failed to decode share payload' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Invalid share payload JSON' }
  }

  return validateSharePayload(parsed)
}

// ─── Validation ──────────────────────────────────────────────

function validateSharePayload(raw: unknown): SharePayloadParseResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'Share payload must be an object' }
  }

  const obj = raw as Record<string, unknown>

  // Version check
  if (typeof obj.v !== 'number') {
    return { ok: false, error: 'Missing or invalid payload version' }
  }
  if (obj.v !== SHARE_PAYLOAD_VERSION) {
    return { ok: false, error: `Unsupported share payload version: ${obj.v}` }
  }

  // Required string fields
  for (const field of ['sid', 'tier', 'arch', 'cls', 'cr'] as const) {
    if (typeof obj[field] !== 'string' || (obj[field] as string).length === 0) {
      return { ok: false, error: `Missing or invalid field: ${field}` }
    }
  }

  // Required numeric fields
  for (const field of ['sv', 'tc', 'mt', 'avg'] as const) {
    if (typeof obj[field] !== 'number' || !isFinite(obj[field] as number)) {
      return { ok: false, error: `Missing or invalid numeric field: ${field}` }
    }
  }

  // Optional name
  if (obj.name !== undefined && typeof obj.name !== 'string') {
    return { ok: false, error: 'Invalid character name' }
  }

  // tid may be null or string
  if (obj.tid !== null && typeof obj.tid !== 'string') {
    return { ok: false, error: 'Invalid tier id' }
  }

  // Scores must be a record of string → number
  if (typeof obj.scores !== 'object' || obj.scores === null || Array.isArray(obj.scores)) {
    return { ok: false, error: 'Invalid scores object' }
  }
  for (const [key, val] of Object.entries(obj.scores as Record<string, unknown>)) {
    if (typeof key !== 'string' || typeof val !== 'number') {
      return { ok: false, error: `Invalid score entry: ${key}` }
    }
  }

  // Optional stakeholders: record of string -> number
  if (obj.stakeholders !== undefined) {
    if (typeof obj.stakeholders !== 'object' || obj.stakeholders === null || Array.isArray(obj.stakeholders)) {
      return { ok: false, error: 'Invalid stakeholders object' }
    }

    for (const [key, val] of Object.entries(obj.stakeholders as Record<string, unknown>)) {
      if (typeof key !== 'string' || typeof val !== 'number' || !isFinite(val)) {
        return { ok: false, error: `Invalid stakeholder entry: ${key}` }
      }
    }
  }

  const payload: SharePayload = {
    v: obj.v as number,
    sid: obj.sid as string,
    sv: obj.sv as number,
    cls: obj.cls as string,
    name: (obj.name as string) || undefined,
    tier: obj.tier as string,
    arch: obj.arch as OutcomeArchetypeId,
    tid: (obj.tid as string | null) ?? null,
    tc: obj.tc as number,
    mt: obj.mt as number,
    avg: obj.avg as number,
    scores: obj.scores as Record<string, number>,
    stakeholders: obj.stakeholders as Record<string, number> | undefined,
    cr: obj.cr as string
  }

  return { ok: true, payload }
}

// ─── URL Construction ────────────────────────────────────────

/**
 * Build a full share URL from a payload and the current origin.
 */
export function buildShareUrl(payload: SharePayload, origin: string): string {
  const encoded = encodeSharePayload(payload)
  return `${origin}/share?d=${encoded}`
}
