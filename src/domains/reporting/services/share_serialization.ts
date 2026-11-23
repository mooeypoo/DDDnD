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
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'

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

const MAX_SEED_LENGTH = 200
/** Community pack name and publisher on a share card: plain text, kept short. */
const MAX_PACK_LABEL_LENGTH = 160
/** Ending and tier display names on a share card: plain text, kept short. */
const MAX_OUTCOME_NAME_LENGTH = 80

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

  // The ending is any content id: a pack's own endings are shared too, and the
  // viewer may not have that pack (journal M3.7). Its name travels in `an`.
  if (!CONTENT_LIMITS.id_pattern.test(obj.arch as string)) {
    return { ok: false, error: 'Invalid ending id' }
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

  // Optional seed: only feeds the UI's presentation generator, so any short string is fine
  if (obj.sd !== undefined && (typeof obj.sd !== 'string' || obj.sd.length > MAX_SEED_LENGTH)) {
    return { ok: false, error: 'Invalid seed' }
  }

  // Optional community pack: two short strings, shown as plain text
  if (obj.cp !== undefined) {
    const cp = obj.cp as Record<string, unknown> | null
    const isLabel = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= MAX_PACK_LABEL_LENGTH
    if (typeof cp !== 'object' || cp === null || Array.isArray(cp) || !isLabel(cp.n) || !isLabel(cp.p)) {
      return { ok: false, error: 'Invalid community pack' }
    }
  }

  // Optional ending and tier names: short plain text
  for (const field of ['an', 'tn'] as const) {
    const value = obj[field]
    if (value !== undefined && (typeof value !== 'string' || value.length === 0 || value.length > MAX_OUTCOME_NAME_LENGTH)) {
      return { ok: false, error: `Invalid ${field === 'an' ? 'ending' : 'tier'} name` }
    }
  }

  const payload: SharePayload = {
    v: obj.v as number,
    sid: obj.sid as string,
    sv: obj.sv as number,
    cls: obj.cls as string,
    name: (obj.name as string) || undefined,
    tier: obj.tier as string,
    arch: obj.arch as string,
    tid: (obj.tid as string | null) ?? null,
    tc: obj.tc as number,
    mt: obj.mt as number,
    avg: obj.avg as number,
    scores: obj.scores as Record<string, number>,
    stakeholders: obj.stakeholders as Record<string, number> | undefined,
    cr: obj.cr as string,
    sd: (obj.sd as string | undefined) || undefined,
    ...(obj.an !== undefined ? { an: obj.an as string } : {}),
    ...(obj.tn !== undefined ? { tn: obj.tn as string } : {}),
    ...(obj.cp !== undefined
      ? { cp: { n: (obj.cp as { n: string }).n, p: (obj.cp as { p: string }).p } }
      : {})
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
