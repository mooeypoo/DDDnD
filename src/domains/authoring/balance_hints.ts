/**
 * Balance hints (docs/PACK_STUDIO.md D3): arithmetic on a draft's decks,
 * compared with the game's own scenarios. Never a verdict and never
 * blocking: simulated balance is the balance lab's (M5). The hints are
 * cheap, and they would have caught the SRE pack's unwinnable first draft
 * (its cards netted +4.7 against the game's +9 to +12, its events −5.7).
 *
 * The numbers are the ones the game's balance work counts (CONTENT_PACKS.md,
 * "Balancing, and what the audit taught"):
 * - a card's net is the sum of its score changes, aftershocks included;
 * - the event pool's net is each event's net, weighted by how often it's drawn.
 *
 * A run is judged on the average of its scores, so a pack with fewer scores
 * needs less per card: the game's numbers are compared per score.
 */

import type { Card, DelayedEffect, Event, Scenario, VersionRef } from '../content/model'
import { onlyHelps } from './deck'
import type { DraftPack, Effects } from './draft_pack'
import { isOwnRef, resolveRef, type BaseContentReader } from './draft_reading'

/** A deck's arithmetic, for one scenario. A net is null when there's nothing to average. */
export interface DeckBalance {
  scenario_id: string
  scores: number
  cards: number
  /** The average card's net, aftershocks included. */
  card_net: number | null
  events: number
  /** The event pool's net per draw: each event's net, aftershocks included, weighted by how often it's drawn. */
  event_net: number | null
}

export interface BalanceRange {
  low: number
  high: number
}

/** The game's own scenarios' numbers, per score (see the module note). */
export interface GameBalance {
  card_net_per_score: BalanceRange
  event_net_per_score: BalanceRange
}

/**
 * How far outside the game's range a deck can be and still play like the
 * game. The SRE pack wins 40% of runs with cards at +8.2, under a point below
 * the game's lowest (+9.0), so a point either side isn't worth a hint.
 */
export const NEAR_ENOUGH = 1

/** How an event is weighted when it doesn't say (the game's own default). */
const DEFAULT_WEIGHT = 1

/** Finds a card, event or aftershock by reference; null when it can't be found. */
export interface DeckLookup {
  card(ref: VersionRef): Promise<Card | null>
  event(ref: VersionRef): Promise<Event | null>
  aftershock(ref: VersionRef): Promise<DelayedEffect | null>
}

/** A draft's lookup: its own content first, then the game's (as the draft's references resolve). */
export function draftLookup(draft: DraftPack, base: BaseContentReader): DeckLookup {
  const find = async <T>(found: Promise<{ entity: T } | null>) => (await found)?.entity ?? null
  return {
    card: (ref) => find(resolveRef(draft, 'cards', ref, base)),
    event: (ref) => find(resolveRef(draft, 'events', ref, base)),
    aftershock: (ref) => find(resolveRef(draft, 'delayed_effects', ref, base)),
  }
}

/** The game's lookup, for its own scenarios. */
export function gameLookup(base: BaseContentReader): DeckLookup {
  const find = async <T>(load: Promise<T>) => load.catch(() => null)
  return {
    card: (ref) => find(base.loadCard(ref)),
    event: (ref) => find(base.loadEvent(ref)),
    aftershock: (ref) => find(base.loadDelayedEffect(ref)),
  }
}

function scoreTotal(effects: Pick<Effects, 'score_changes'>): number {
  return effects.score_changes.reduce((total, change) => total + change.delta, 0)
}

async function netOf(item: Card | Event, lookup: DeckLookup): Promise<number> {
  const aftershocks = await Promise.all(item.delayed_effect_refs.map((ref) => lookup.aftershock(ref)))
  return aftershocks.reduce((total, aftershock) => total + (aftershock ? scoreTotal(aftershock) : 0), scoreTotal(item))
}

/** One scenario's deck, in numbers. Cards or events that can't be found are left out. */
export async function deckBalance(scenario: Pick<Scenario, 'id' | 'score_refs' | 'card_refs' | 'event_refs'>, lookup: DeckLookup): Promise<DeckBalance> {
  const cards = (await Promise.all(scenario.card_refs.map((ref) => lookup.card(ref)))).filter((card): card is Card => card !== null)
  const events = (await Promise.all(scenario.event_refs.map((ref) => lookup.event(ref)))).filter((event): event is Event => event !== null)
  const cardNets = await Promise.all(cards.map((card) => netOf(card, lookup)))
  const eventNets = await Promise.all(events.map((event) => netOf(event, lookup)))
  const weights = events.map((event) => event.occurrence_weight ?? DEFAULT_WEIGHT)
  const totalWeight = weights.reduce((total, weight) => total + weight, 0)
  return {
    scenario_id: scenario.id,
    scores: scenario.score_refs.length,
    cards: cards.length,
    card_net: cards.length ? cardNets.reduce((total, net) => total + net, 0) / cards.length : null,
    events: events.length,
    event_net: totalWeight > 0 ? eventNets.reduce((total, net, index) => total + net * weights[index], 0) / totalWeight : null,
  }
}

/** Every deck in the draft, scenario by scenario. */
export async function draftBalance(draft: DraftPack, base: BaseContentReader): Promise<DeckBalance[]> {
  const lookup = draftLookup(draft, base)
  return Promise.all(Object.values(draft.content.scenarios).map((scenario) => deckBalance(scenario, lookup)))
}

/** The range the game's own scenarios span, per score. Scenarios without cards, events or scores don't count. */
export async function gameBalance(scenarios: readonly Scenario[], base: BaseContentReader): Promise<GameBalance> {
  const decks = await Promise.all(scenarios.map((scenario) => deckBalance(scenario, gameLookup(base))))
  const span = (values: number[]): BalanceRange => ({ low: Math.min(...values), high: Math.max(...values) })
  const perScore = (deck: DeckBalance, net: number | null) => (net === null || deck.scores === 0 ? [] : [net / deck.scores])
  return {
    card_net_per_score: span(decks.flatMap((deck) => perScore(deck, deck.card_net))),
    event_net_per_score: span(decks.flatMap((deck) => perScore(deck, deck.event_net))),
  }
}

/** The game's range for a deck with this many scores. */
export function rangeFor(perScore: BalanceRange, scores: number): BalanceRange {
  return { low: perScore.low * scores, high: perScore.high * scores }
}

/** The deck a card or event plays in: the first scenario that holds it. Null when none does. */
export function deckHolding(draft: DraftPack, decks: readonly DeckBalance[], section: 'cards' | 'events', ref: VersionRef): DeckBalance | null {
  const field = section === 'cards' ? 'card_refs' : 'event_refs'
  return decks.find((deck) => draft.content.scenarios[deck.scenario_id]?.[field].some((held) => held.id === ref.id && held.version === ref.version)) ?? null
}

/** The hints about one card or event of the author's own (only helps, changes nothing). */
export function hintsAbout(hints: readonly BalanceHint[], section: 'cards' | 'events', ref: VersionRef): BalanceHint[] {
  return hints.flatMap((hint) => {
    if (hint.kind !== 'only_helps' && hint.kind !== 'changes_nothing') return []
    if (hint.section !== section || !hint.refs.some((held) => held.id === ref.id && held.version === ref.version)) return []
    return [{ ...hint, refs: [ref] }]
  })
}

// ── The hints ─────────────────────────────────────────────────────────────

export type BalanceHint =
  | { kind: 'cards_low' | 'cards_high'; scenario_id: string; net: number; range: BalanceRange }
  | { kind: 'events_harsh' | 'events_kind'; scenario_id: string; net: number; range: BalanceRange }
  | { kind: 'only_helps' | 'changes_nothing'; section: 'cards' | 'events'; refs: VersionRef[] }

/** Outside the range by more than NEAR_ENOUGH: below, above, or neither. */
function side(net: number, range: BalanceRange): 'below' | 'above' | null {
  if (net < range.low - NEAR_ENOUGH) return 'below'
  if (net > range.high + NEAR_ENOUGH) return 'above'
  return null
}

function hasChanges(effects: Effects): boolean {
  return [...effects.score_changes, ...(effects.stakeholder_changes ?? [])].some((change) => change.delta !== 0)
}

/**
 * What's worth a look, in the order to look at it: whole decks first, then
 * the author's own cards and events. The game's own content is never hinted
 * at: it plays as it does in DDDnD.
 */
export function balanceHints(draft: DraftPack, decks: readonly DeckBalance[], game: GameBalance | null): BalanceHint[] {
  const hints: BalanceHint[] = []
  if (game) {
    for (const deck of decks) {
      if (deck.scores === 0) continue
      if (deck.card_net !== null) {
        const range = rangeFor(game.card_net_per_score, deck.scores)
        const where = side(deck.card_net, range)
        if (where) hints.push({ kind: where === 'below' ? 'cards_low' : 'cards_high', scenario_id: deck.scenario_id, net: deck.card_net, range })
      }
      if (deck.event_net !== null) {
        const range = rangeFor(game.event_net_per_score, deck.scores)
        const where = side(deck.event_net, range)
        if (where) hints.push({ kind: where === 'below' ? 'events_harsh' : 'events_kind', scenario_id: deck.scenario_id, net: deck.event_net, range })
      }
    }
  }
  const ownInDeck = (section: 'cards' | 'events') => {
    const field = section === 'cards' ? 'card_refs' : 'event_refs'
    const seen = new Set<string>()
    return Object.values(draft.content.scenarios).flatMap((scenario) => scenario[field]).filter((ref) => {
      const key = `${ref.id}@${ref.version}`
      if (seen.has(key) || !isOwnRef(draft, section, ref)) return false
      seen.add(key)
      return true
    })
  }
  const helping = ownInDeck('cards').filter((ref) => onlyHelps(draft.content.cards[ref.id]))
  if (helping.length) hints.push({ kind: 'only_helps', section: 'cards', refs: helping })
  for (const section of ['cards', 'events'] as const) {
    const empty = ownInDeck(section).filter((ref) => !hasChanges(draft.content[section][ref.id]))
    if (empty.length) hints.push({ kind: 'changes_nothing', section, refs: empty })
  }
  return hints
}

// ── In words ──────────────────────────────────────────────────────────────

/** A net as players read it, to one decimal: "+8.2", "−3.3" (a true minus sign), "0". */
export function netWords(net: number): string {
  const rounded = Math.round(net * 10) / 10
  if (rounded === 0) return '0'
  return rounded > 0 ? `+${rounded.toFixed(1)}` : `−${(-rounded).toFixed(1)}`
}

export function rangeWords(range: BalanceRange): string {
  return `${netWords(range.low)} to ${netWords(range.high)}`
}

/** The deck's numbers beside the game's, in two short lines. */
export function deckBalanceWords(deck: DeckBalance, game: GameBalance | null): { cards: string; events: string } {
  const compare = (perScore: BalanceRange | undefined) => (perScore && deck.scores > 0 ? `; the game's scenarios: ${rangeWords(rangeFor(perScore, deck.scores))}` : '')
  return {
    cards: deck.card_net === null
      ? 'No cards in the deck yet.'
      : `Your cards net ${netWords(deck.card_net)} on average, aftershocks included${compare(game?.card_net_per_score)}.`,
    events: deck.event_net === null
      ? 'No events that can happen yet.'
      : `Your events net ${netWords(deck.event_net)} a draw, weighted by how often each is drawn${compare(game?.event_net_per_score)}.`,
  }
}

/**
 * A hint in words: what was found, and what to try (worded like the notes,
 * §9.1). Names come from the draft; the scenario is named only when the
 * draft has more than one.
 */
export function describeBalanceHint(hint: BalanceHint, draft: DraftPack): { title: string; text: string } {
  const scenarios = Object.values(draft.content.scenarios)
  const inScenario = (id: string) => (scenarios.length > 1 ? ` in ${draft.content.scenarios[id]?.name || 'an untitled scenario'}` : '')
  const names = (refs: readonly VersionRef[], section: 'cards' | 'events') =>
    listWords(refs.map((ref) => draft.content[section][ref.id]?.name || (section === 'cards' ? 'Untitled card' : 'Untitled event')))
  switch (hint.kind) {
    case 'cards_low':
      return {
        title: `Your cards gain less than the game's${inScenario(hint.scenario_id)}.`,
        text: `They net ${netWords(hint.net)} on average, aftershocks included; the game's scenarios net ${rangeWords(hint.range)}. Players may struggle to reach your endings. Keep each card's cost, and raise what it gains.`,
      }
    case 'cards_high':
      return {
        title: `Your cards gain more than the game's${inScenario(hint.scenario_id)}.`,
        text: `They net ${netWords(hint.net)} on average, aftershocks included; the game's scenarios net ${rangeWords(hint.range)}. Runs may be won without much thought. Give some cards a bigger cost.`,
      }
    case 'events_harsh':
      return {
        title: `Your events are harsher than the game's${inScenario(hint.scenario_id)}.`,
        text: `They net ${netWords(hint.net)} a draw; the game's scenarios net ${rangeWords(hint.range)}. The world may push back faster than players can recover. Add a good event, soften a bad one, or make a bad one happen only sometimes.`,
      }
    case 'events_kind':
      return {
        title: `Your events are kinder than the game's${inScenario(hint.scenario_id)}.`,
        text: `They net ${netWords(hint.net)} a draw; the game's scenarios net ${rangeWords(hint.range)}. The world may not test the player's plan. Add a bad surprise, or make a good one rarer.`,
      }
    case 'only_helps':
      return {
        title: hint.refs.length === 1 ? `${names(hint.refs, 'cards')} only helps.` : `${names(hint.refs, 'cards')} only help.`,
        text: 'Every move in DDDnD trades something away. Without a cost, players will play nothing else. What does it cost: some budget, a tired team, slower delivery for a while?',
      }
    case 'changes_nothing': {
      const what = hint.section === 'cards' ? 'Playing it is a wasted turn' : 'Drawing it is a turn when nothing happens'
      return {
        title: hint.refs.length === 1 ? `${names(hint.refs, hint.section)} changes nothing yet.` : `${names(hint.refs, hint.section)} change nothing yet.`,
        text: `${hint.refs.length === 1 ? what : `${what}, for each of them`}. Give ${hint.refs.length === 1 ? 'it' : 'each'} a change to a score or to someone's satisfaction.`,
      }
    }
  }
}

function listWords(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
