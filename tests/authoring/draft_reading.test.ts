/**
 * Reading a draft the way the game will (docs/PACK_STUDIO.md M4.5b): the
 * draft's own content where it holds that id at that version, else the base
 * game's. Every Studio screen asks these; the answers live in the domain.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  copyToEdit,
  createOwnMember,
  draftFromBaseScenario,
  isOwnRef,
  isReferenced,
  describeIssue,
  issueSubject,
  manifestRefs,
  memberOfReaction,
  addReaction,
  newestRef,
  ownEntity,
  ownItemsNamingAfterRemoval,
  putContent,
  createDraft,
  resolveNames,
  resolveRef,
  scenarioRefs,
  withEffects,
  withOptionalText,
  type DraftPack,
} from '@/domains/authoring'
import type { Card, ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const ROOT = path.resolve('content')
const MANIFEST = JSON.parse(readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')) as ContentPackManifest
const MONOLITH = { id: 'monolith_of_mild_despair', version: 2 }

function base() {
  const registry = new ContentPackRegistry()
  registry.registerPack(MANIFEST, createFileContentProvider(ROOT))
  return registry.createScopedProvider(firstPartyPackKey('base'))
}

async function monolith(): Promise<DraftPack> {
  return (await draftFromBaseScenario(base(), MONOLITH, { name: 'Ours', prefix: 'ours', authors: [{ name: 'A' }] })).draft
}

describe('reading a draft over the base game', () => {
  it('resolves the draft\'s own content first, and only at the exact version', async () => {
    const draft = await monolith()
    const cardRef = scenarioRefs(draft, 'card_refs')[0]
    const game = await resolveRef(draft, 'cards', cardRef, base())
    expect(game?.own).toBe(false)

    const copied = copyToEdit(draft, 'cards', game!.entity as Card)
    const ownRef = { id: copied.id, version: 1 }
    expect(isOwnRef(copied.draft, 'cards', ownRef)).toBe(true)
    expect((await resolveRef(copied.draft, 'cards', ownRef, base()))?.own).toBe(true)
    // Same id, another version: not the draft's own
    expect(isOwnRef(copied.draft, 'cards', { id: copied.id, version: 2 })).toBe(false)
    expect(ownEntity(copied.draft, 'cards', { id: copied.id, version: 2 })).toBeNull()
  })

  it('names what it can, and leaves out what names nothing', async () => {
    const draft = await monolith()
    const refs = [...scenarioRefs(draft, 'stakeholder_refs'), { id: 'nobody', version: 1 }]
    const names = await resolveNames(draft, 'stakeholders', refs, base())
    expect(names.cto).toBe('Chief Technology Officer')
    expect(names).not.toHaveProperty('nobody')
  })

  it('lists each scenario reference once, and knows what is in the deck', async () => {
    const draft = await monolith()
    const scenario = Object.values(draft.content.scenarios)[0]
    const twice = putContent(draft, 'scenarios', { ...scenario, id: 'second' })
    expect(scenarioRefs(twice, 'card_refs')).toEqual(scenario.card_refs)
    expect(isReferenced(draft, 'card_refs', scenario.card_refs[0])).toBe(true)
    expect(isReferenced(draft, 'card_refs', { ...scenario.card_refs[0], version: 99 })).toBe(false)
  })

  it('reads a manifest\'s list as references, and finds the newest', () => {
    const refs = manifestRefs(MANIFEST, 'stakeholders')
    expect(refs).toContainEqual({ id: 'cto', version: 1 })
    expect(newestRef([{ id: 'a', version: 1 }, { id: 'a', version: 3 }, { id: 'b', version: 9 }], 'a')).toEqual({ id: 'a', version: 3 })
    expect(newestRef(refs, 'nobody')).toBeNull()
  })
})

describe('what a check\'s issue is about', () => {
  it('reads the export\'s own file layout back', () => {
    expect(issueSubject('manifest.json')).toEqual({ kind: 'manifest' })
    expect(issueSubject('cards/ours_a-v1.json')).toEqual({ kind: 'content', section: 'cards', ref: { id: 'ours_a', version: 1 } })
    expect(issueSubject('stakeholder-reaction-rules/ours_r-v2.json')).toEqual({ kind: 'content', section: 'stakeholder_reaction_rules', ref: { id: 'ours_r', version: 2 } })
    expect(issueSubject('delayed-effects/ours_x-v1.json')?.kind).toBe('content')
    expect(issueSubject('pack')).toBeNull()
    expect(issueSubject('nonsense/ours_a-v1.json')).toBeNull()
  })
})

describe('editing helpers', () => {
  it('leaves an empty optional text out of the file', () => {
    const card = { id: 'c', version: 1, name: 'C', description: '', score_changes: [], delayed_effect_refs: [], flavor_text: 'old' } as Card
    expect(withOptionalText(card, 'flavor_text', 'new').flavor_text).toBe('new')
    expect(withOptionalText(card, 'flavor_text', '  ')).not.toHaveProperty('flavor_text')
    expect(card.flavor_text).toBe('old')
  })

  it('writes council changes only when there are some', () => {
    const card = { id: 'c', version: 1, name: 'C', description: '', score_changes: [], delayed_effect_refs: [], stakeholder_changes: [{ stakeholder_id: 'cto', delta: 1 }] } as Card
    const cleared = withEffects(card, { score_changes: [{ score_id: 'budget', delta: 2 }], stakeholder_changes: [] })
    expect(cleared).not.toHaveProperty('stakeholder_changes')
    expect(cleared.score_changes).toEqual([{ score_id: 'budget', delta: 2 }])
  })

  it('finds a reaction\'s member, and what still names a member after removal', async () => {
    const made = createOwnMember(await monolith())
    const scoreRef = scenarioRefs(made.draft, 'score_refs')[0]
    const reacted = addReaction(made.draft, made.id, { id: scoreRef.id, name: 'Score' })
    expect(memberOfReaction(reacted.draft, reacted.id)?.id).toBe(made.id)
    expect(memberOfReaction(reacted.draft, 'nothing')).toBeNull()
    // Their own reaction goes with them, so it isn't listed
    expect(ownItemsNamingAfterRemoval(reacted.draft, { id: made.id, version: 1 })).toEqual([])
    // An own card that names them stays, so it is
    const card = { id: 'ours_card', version: 1, name: 'Card', description: '', score_changes: [], delayed_effect_refs: [], stakeholder_changes: [{ stakeholder_id: made.id, delta: 2 }] } as Card
    const named = putContent(reacted.draft, 'cards', card)
    expect(ownItemsNamingAfterRemoval(named, { id: made.id, version: 1 })).toEqual([{ section: 'cards', id: 'ours_card', name: 'Card' }])
  })
})

describe('a check\'s issue, in the Studio\'s words', () => {
  it('says where it is and what to do for the commonest problems, and keeps the game\'s message otherwise', () => {
    expect(describeIssue({ file: 'manifest.json', message: 'authors: must be at least 1 item' })).toEqual({ where: 'Pack details', text: 'Add your name as the author.' })
    expect(describeIssue({ file: 'stakeholders/ours_head-v1.json', message: 'description: must not be blank' })).toEqual({ where: 'Council member', text: 'Add a description: who they are and what they care about.' })
    expect(describeIssue({ file: 'cards/ours_a-v1.json', message: 'description: must not be blank' })).toEqual({ where: 'Card', text: 'Add a description: what it does, in a sentence.' })
    expect(describeIssue({ file: 'cards/ours_a-v1.json', message: 'name: must not be blank' })).toEqual({ where: 'Card', text: 'Give it a name.' })
    expect(describeIssue({ file: 'scores/ours_rest-v1.json', message: 'description: must not be blank' })).toEqual({ where: 'Score', text: 'Add a description: what it measures, in a sentence.' })
    expect(describeIssue({ file: 'outcome-archetypes/ours_end-v1.json', message: 'name: must not be blank' })).toEqual({ where: 'Ending', text: 'Give it a name.' })
    expect(describeIssue({ file: 'pack', message: 'Something else broke' })).toEqual({ where: 'Pack', text: 'Something else broke' })
  })

  it('names which one, from the draft, when it has a name (the guided round, M4.21)', () => {
    const card = { id: 'ours_a', version: 1, name: 'Freeze the Payment Path', description: '', score_changes: [], delayed_effect_refs: [] } as unknown as Card
    const draft = putContent(createDraft({ kind: 'retelling', name: 'Ours' }), 'cards', card)
    expect(describeIssue({ file: 'cards/ours_a-v1.json', message: 'description: must not be blank' }, draft).where).toBe('Card · Freeze the Payment Path')
    // A blank name, or something the draft doesn't hold, stays just its kind
    expect(describeIssue({ file: 'cards/ours_a-v1.json', message: 'name: must not be blank' }, putContent(draft, 'cards', { ...card, name: ' ' })).where).toBe('Card')
    expect(describeIssue({ file: 'cards/ours_b-v1.json', message: 'x' }, draft).where).toBe('Card')
  })
})
