/**
 * Where community packs live in the app (journal M2.11, M2.12).
 *
 * The council lobby (`/play`) shows first-party content only. Community packs
 * have their own place: the bazaar (`/community`) lists added packs, and each
 * pack has its own table (`/community/<pack key>`). The pack key goes into the
 * path as is; it is readable (`github:owner/repo/folder`) and the route accepts
 * slashes.
 */

import type { RouteLocationRaw } from 'vue-router'

import { isFirstPartyPackKey } from '@/domains/content/services/pack_identity'

export const BAZAAR_PATH = '/community'

/** The pack table for a community pack. */
export function packTableRoute(packKey: string): RouteLocationRaw {
  return { name: 'community-pack', params: { packKey: packKey.split('/') } }
}

/**
 * Where to go to choose another scenario after a run: the pack's own table
 * for a community pack, the council lobby for everything else (including
 * runs saved before pack identity, which are always first-party).
 */
export function lobbyRouteFor(packKey: string | undefined): RouteLocationRaw {
  return packKey && !isFirstPartyPackKey(packKey) ? packTableRoute(packKey) : '/play'
}

/** The pack key from a `/community/<pack key>` route param. */
export function packKeyFromParam(param: string | string[] | undefined): string | undefined {
  if (param === undefined) return undefined
  const key = Array.isArray(param) ? param.join('/') : param
  return key.length > 0 ? key : undefined
}
