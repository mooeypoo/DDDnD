/**
 * The base game's balance targets, read from the scenarios the manifest
 * offers (journal M3.8). Tests that describe the base game's targets use the
 * real content, so they also prove it reproduces the old code table.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'

import type { BalanceTargets, ContentPackManifest, Scenario } from '@/domains/content/model'

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.resolve(file), 'utf8')) as T
}

const manifest = readJson<ContentPackManifest>('content/manifest.json')

export const BASE_BALANCE_TARGETS: Record<string, BalanceTargets> = Object.fromEntries(
  manifest.scenarios.map((ref) => {
    const scenario = readJson<Scenario>(`content/scenarios/${ref.id}-v${ref.version}.json`)
    return [ref.id, scenario.balance_targets as BalanceTargets]
  }),
)

/** A quest as the lobby sees it: id plus its scenario's win-rate band. */
export function baseQuest(id: string): { id: string; winRateTarget?: { min: number; max: number } } {
  const targets = BASE_BALANCE_TARGETS[id]
  return targets ? { id, winRateTarget: { min: targets.win_rate_min, max: targets.win_rate_max } } : { id }
}
