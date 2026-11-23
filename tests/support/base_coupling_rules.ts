/**
 * The base game's coupling rules, read from content (M3 slice 2). Tests that
 * describe the base game's coupling use the real files, so they also prove
 * the content reproduces what the engine used to hard-code.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'

import type { CouplingRule } from '@/domains/content/model'

function readRule(file: string): CouplingRule {
  return JSON.parse(readFileSync(path.resolve(file), 'utf8')) as CouplingRule
}

export const BASE_COUPLING_RULES: CouplingRule[] = ['delivery_collapse', 'morale_collapse', 'trust_collapse']
  .map((id) => readRule(`content/coupling-rules/${id}-v1.json`))
