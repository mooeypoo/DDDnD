/**
 * Balance hints (D3): a draft's decks in numbers, beside the game's own
 * scenarios, and what's worth a look. Read against the game's real content.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  balanceHints,
  createOwnCard,
  createOwnEvent,
  deckBalance,
  deckBalanceWords,
  describeBalanceHint,
  draftBalance,
  draftFromBaseScenario,
  gameBalance,
  NEAR_ENOUGH,
  netWords,
  putContent,
  rangeFor,
  rangeWords,
  removeFromDeck,
  scenarioRefs,
  type DeckLookup,
  type DraftPack,
  type GameBalance,
} from '@/domains/authoring'
import type { Card, ContentPackManifest, DelayedEffect, Event, Scenario } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

function baseReader() {
  const registry = new ContentPackRegistry()
  const manifest = JSON.parse(readFileSync(path.resolve('content/manifest.json'), 'utf8')) as ContentPackManifest
  registry.registerPack(manifest, createFileContentProvider(path.resolve('content')))
  return { manifest, base: registry.createScopedProvider(firstPartyPackKey('base')) }
}

async function theGame(): Promise<GameBalance> {
  const { manifest, base } = baseReader()
  const scenarios = await Promise.all(manifest.scenarios.map((ref) => base.loadScenario(ref)))
  return gameBalance(scenarios, base)
}

async function retelling(): Promise<DraftPack> {
  const { base } = baseReader()
  return (await draftFromBaseScenario(base, { id: 'monolith_of_mild_despair', version: 2 }, { name: 'Ours', prefix: 'ours', authors: [] })).draft
}

/** The retelling with its deck replaced by cards of its own, each netting what's given. */
function withOwnCards(draft: DraftPack, nets: number[], events: number[] = []): DraftPack {
  let next = draft
  for (const ref of scenarioRefs(next, 'card_refs')) next = removeFromDeck(next, 'cards', ref)
  for (const ref of scenarioRefs(next, 'event_refs')) next = removeFromDeck(next, 'events', ref)
  nets.forEach((net, index) => {
    const made = createOwnCard(next, `Card ${index + 1}`)
    next = putContent(made.draft, 'cards', { ...made.draft.content.cards[made.id], score_changes: [{ score_id: 'domain_clarity', delta: net + 3 }, { score_id: 'team_morale', delta: -3 }] })
  })
  events.forEach((net, index) => {
    const made = createOwnEvent(next, `Event ${index + 1}`)
    next = putContent(made.draft, 'events', { ...made.draft.content.events[made.id], score_changes: [{ score_id: 'user_trust', delta: net }], occurrence_weight: 1 })
  })
  return next
}

describe("the game's own numbers", () => {
  it('span the five scenarios it offers, per score, and read as the SRE balancing found them', async () => {
    const game = await theGame()
    // Every base scenario tracks six scores
    expect(rangeWords(rangeFor(game.card_net_per_score, 6))).toBe('+9.0 to +12.2')
    expect(rangeWords(rangeFor(game.event_net_per_score, 6))).toBe('−3.3 to +0.5')
  })

  it("asks for less per card when a pack has fewer scores (a run is judged on the scores' average)", async () => {
    const game = await theGame()
    const six = rangeFor(game.card_net_per_score, 6)
    const three = rangeFor(game.card_net_per_score, 3)
    expect(three.low).toBeCloseTo(six.low / 2)
    expect(three.high).toBeCloseTo(six.high / 2)
  })
})

describe("a deck's numbers", () => {
  it('count aftershocks, weight events by how often they are drawn, and leave out what cannot be found', async () => {
    const card = { id: 'a', version: 1, name: 'A', description: '', score_changes: [{ score_id: 's', delta: 4 }], delayed_effect_refs: [{ id: 'later', version: 1 }] } as Card
    const rare = { id: 'rare', version: 1, name: 'Rare', description: '', score_changes: [{ score_id: 's', delta: 9 }], delayed_effect_refs: [], occurrence_weight: 1 } as Event
    const common = { id: 'common', version: 1, name: 'Common', description: '', score_changes: [{ score_id: 's', delta: -3 }], delayed_effect_refs: [], occurrence_weight: 3 } as Event
    const later = { id: 'later', version: 1, name: 'Later', description: '', score_changes: [{ score_id: 's', delta: 6 }], turns_until_resolution: 2 } as unknown as DelayedEffect
    const lookup: DeckLookup = {
      card: async (ref) => (ref.id === 'a' ? card : null),
      event: async (ref) => ({ rare, common })[ref.id as 'rare' | 'common'] ?? null,
      aftershock: async (ref) => (ref.id === 'later' ? later : null),
    }
    const scenario = { id: 'sc', score_refs: [{ id: 's', version: 1 }], card_refs: [{ id: 'a', version: 1 }, { id: 'gone', version: 1 }], event_refs: [{ id: 'rare', version: 1 }, { id: 'common', version: 1 }] } as Scenario
    const deck = await deckBalance(scenario, lookup)
    expect(deck).toEqual({ scenario_id: 'sc', scores: 1, cards: 1, card_net: 10, events: 2, event_net: 0 })
  })

  it('reads as numbers beside the game\'s', async () => {
    const game = await theGame()
    const words = deckBalanceWords({ scenario_id: 'x', scores: 6, cards: 3, card_net: 4.6666, events: 2, event_net: -5.71 }, game)
    expect(words.cards).toBe("Your cards net +4.7 on average, aftershocks included; the game's scenarios: +9.0 to +12.2.")
    expect(words.events).toBe("Your events net −5.7 a draw, weighted by how often each is drawn; the game's scenarios: −3.3 to +0.5.")
    expect(deckBalanceWords({ scenario_id: 'x', scores: 6, cards: 0, card_net: null, events: 0, event_net: null }, game).cards).toBe('No cards in the deck yet.')
  })

  it('writes a net players can read', () => {
    expect([netWords(8.18), netWords(-3.28), netWords(0.04), netWords(12)]).toEqual(['+8.2', '−3.3', '0', '+12.0'])
  })
})

describe('what is worth a look', () => {
  it("says nothing about a copy of the game's scenario: it is the game's balance", async () => {
    const draft = await retelling()
    const { base } = baseReader()
    expect(balanceHints(draft, await draftBalance(draft, base), await theGame())).toEqual([])
  })

  it("catches the SRE pack's first draft: cards that gain too little and events that push too hard", async () => {
    const { base } = baseReader()
    const draft = withOwnCards(await retelling(), [5, 4, 5], [-8, -8, -1])
    const game = await theGame()
    const hints = balanceHints(draft, await draftBalance(draft, base), game)
    expect(hints.map((hint) => hint.kind)).toEqual(['cards_low', 'events_harsh'])
    expect(describeBalanceHint(hints[0], draft)).toEqual({
      title: "Your cards gain less than the game's.",
      text: "They net +4.7 on average, aftershocks included; the game's scenarios net +9.0 to +12.2. Players may struggle to reach your endings. Keep each card's cost, and raise what it gains.",
    })
    expect(describeBalanceHint(hints[1], draft).title).toBe("Your events are harsher than the game's.")
    expect(describeBalanceHint(hints[1], draft).text).toContain('Add a good event, soften a bad one, or make a bad one happen only sometimes.')
  })

  it('lets a deck sit near the range: the SRE pack wins 40% of runs with cards at +8.2', async () => {
    const { base } = baseReader()
    const game = await theGame()
    const low = rangeFor(game.card_net_per_score, 6).low
    const near = withOwnCards(await retelling(), [low - NEAR_ENOUGH + 0.25])
    expect(balanceHints(near, await draftBalance(near, base), game).map((hint) => hint.kind)).not.toContain('cards_low')
    const high = withOwnCards(await retelling(), [30, 30])
    expect(balanceHints(high, await draftBalance(high, base), game).map((hint) => hint.kind)).toContain('cards_high')
  })

  it("names the author's own cards that only help or change nothing, never the game's", async () => {
    let draft = await retelling()
    const helper = createOwnCard(draft, 'Hire a Platform Team')
    draft = putContent(helper.draft, 'cards', { ...helper.draft.content.cards[helper.id], score_changes: [{ score_id: 'domain_clarity', delta: 6 }] })
    draft = createOwnCard(draft, 'Write an RFC').draft
    draft = createOwnEvent(draft, 'Quiet Week').draft
    const hints = balanceHints(draft, [], null)
    expect(hints.map((hint) => describeBalanceHint(hint, draft).title)).toEqual([
      'Hire a Platform Team only helps.',
      'Write an RFC changes nothing yet.',
      'Quiet Week changes nothing yet.',
    ])
    expect(describeBalanceHint(hints[2], draft).text).toBe("Drawing it is a turn when nothing happens. Give it a change to a score or to someone's satisfaction.")
  })
})
