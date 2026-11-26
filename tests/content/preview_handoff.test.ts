/**
 * "Play it"'s exchange (docs/PACK_STUDIO.md §11, threat T12): the game takes
 * one pack, only from the tab that opened it, at a trusted origin, with its
 * own nonce; the Studio answers only the tab it opened.
 */

import { describe, expect, it } from 'vitest'

import {
  createPreviewReceiver,
  isNonce,
  PREVIEW_MESSAGES,
  previewReadyNonce,
  previewStatus,
} from '@/domains/content/services/preview_handoff'

const STUDIO = 'https://studio.dddnd.app'
const GAME = 'https://dddnd.app'
const NONCE = 'a'.repeat(32)
const opener = { name: 'the Studio tab' }
const pack = (overrides: Record<string, unknown> = {}) => ({ type: PREVIEW_MESSAGES.pack, nonce: NONCE, bundle: '{"format":"dddnd-pack"}', ...overrides })

function receiver(trustedOrigins: string[] = [STUDIO]) {
  return createPreviewReceiver({ trustedOrigins, opener, nonce: NONCE })
}

describe('the game takes a preview pack', () => {
  it('from its opener, at a trusted origin, with its nonce', () => {
    expect(receiver().accept({ origin: STUDIO, source: opener, data: pack() })).toBe('{"format":"dddnd-pack"}')
  })

  it('ignores any other origin, including a deploy preview of the Studio (D17)', () => {
    for (const origin of ['https://evil.example', 'https://deploy-preview-12--dddnd-studio.netlify.app', 'http://studio.dddnd.app', 'https://studio.dddnd.app.evil.example']) {
      expect(receiver().accept({ origin, source: opener, data: pack() }), origin).toBeNull()
    }
  })

  it('ignores a window other than the one that opened it, even at the trusted origin', () => {
    expect(receiver().accept({ origin: STUDIO, source: { name: 'another tab' }, data: pack() })).toBeNull()
    expect(createPreviewReceiver({ trustedOrigins: [STUDIO], opener: null, nonce: NONCE }).accept({ origin: STUDIO, source: null, data: pack() })).toBeNull()
  })

  it('ignores a wrong or reused nonce, and anything that isn\'t a pack message', () => {
    const r = receiver()
    for (const data of [pack({ nonce: 'b'.repeat(32) }), pack({ nonce: undefined }), pack({ type: 'something-else' }), pack({ bundle: { not: 'text' } }), 'a string', null, [pack()]]) {
      expect(r.accept({ origin: STUDIO, source: opener, data }), JSON.stringify(data)).toBeNull()
    }
    expect(r.accepted).toBe(false)
  })

  it('takes only the first pack: every later one is ignored', () => {
    const r = receiver()
    expect(r.accept({ origin: STUDIO, source: opener, data: pack() })).not.toBeNull()
    expect(r.accepted).toBe(true)
    expect(r.accept({ origin: STUDIO, source: opener, data: pack({ bundle: 'a second pack' }) })).toBeNull()
  })

  it('trusts nothing when the build trusts no origin (production before launch)', () => {
    expect(receiver([]).accept({ origin: STUDIO, source: opener, data: pack() })).toBeNull()
  })

  it('refuses to start without a real nonce', () => {
    expect(() => createPreviewReceiver({ trustedOrigins: [STUDIO], opener, nonce: '' })).toThrow(/nonce/)
    expect(isNonce('0123456789abcdef0123456789abcdef')).toBe(true)
    expect(isNonce('not-hex-not-hex-not-hex-not-hex-x')).toBe(false)
  })
})

describe('the Studio answers only the tab it opened', () => {
  const tab = { name: 'the preview tab' }

  it('reads a "ready" from its tab at the game\'s origin, and nothing else', () => {
    const ready = { type: PREVIEW_MESSAGES.ready, nonce: NONCE }
    expect(previewReadyNonce({ origin: GAME, source: tab, data: ready }, { origin: GAME, tab })).toBe(NONCE)
    expect(previewReadyNonce({ origin: 'https://evil.example', source: tab, data: ready }, { origin: GAME, tab })).toBeNull()
    expect(previewReadyNonce({ origin: GAME, source: { name: 'other' }, data: ready }, { origin: GAME, tab })).toBeNull()
    expect(previewReadyNonce({ origin: GAME, source: tab, data: { ...ready, nonce: '<script>' } }, { origin: GAME, tab })).toBeNull()
  })

  it('reads the game\'s answer for the pack it sent, keeping only text problems', () => {
    const status = { type: PREVIEW_MESSAGES.status, nonce: NONCE, ok: false, problems: ['manifest.json: authors', 42] }
    expect(previewStatus({ origin: GAME, source: tab, data: status }, { origin: GAME, tab, nonce: NONCE })).toEqual({ ok: false, problems: ['manifest.json: authors'] })
    expect(previewStatus({ origin: GAME, source: tab, data: { ...status, nonce: 'c'.repeat(32) } }, { origin: GAME, tab, nonce: NONCE })).toBeNull()
  })
})
