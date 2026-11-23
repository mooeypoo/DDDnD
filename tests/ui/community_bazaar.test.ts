/**
 * The community area (journal M2.11, M2.12): the council lobby shows only
 * first-party content, each community pack has its own table, and the
 * bazaar lists imported packs and says where they are kept.
 */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import type { PackSnapshot } from '@/domains/content/model'
import { packKeyOf } from '@/domains/content/services/pack_identity'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import RunSetupView from '@/ui/views/run_setup_view.vue'
import CommunityBazaarView from '@/ui/views/community_bazaar_view.vue'
import CommunityPacksDialog from '@/ui/components/community/community_packs_dialog.vue'
import { demoPackSnapshot } from '../content/support/demo_pack'

const pushSpy = vi.fn()
const replaceSpy = vi.fn()
const routeQuery: Record<string, string> = {}
let storeMock: any

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushSpy, replace: replaceSpy }),
  useRoute: () => ({ query: routeQuery }),
  RouterLink: defineComponent({
    props: { to: { type: [String, Object], required: true } },
    setup(props, { slots }) {
      return () => h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.())
    },
  }),
}))
vi.mock('@/ui/stores/game_store', () => ({ useGameStore: () => storeMock }))

let pack: PackSnapshot
let packKey: string

function quest(id: string, name: string, key: string, extras: Partial<QuestDisplayModel> = {}): QuestDisplayModel {
  return {
    packKey: key, id, version: 1, name,
    description: `${name} description`, shortDescription: `${name} short`, flavorText: `${name} flavor`,
    turnCount: 8, stakeholderCount: 4, actionCardCount: 10,
    ...extras,
  }
}

beforeEach(async () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  })
  localStorage.setItem('dddnd.tutorialsComplete', 'true')
  pushSpy.mockReset()
  replaceSpy.mockReset()
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]

  pack = await demoPackSnapshot()
  packKey = packKeyOf(pack)
  storeMock = {
    isAboutModalOpen: false, isRulesModalOpen: false, isDungeonMasterModalOpen: false, isLoadingBundle: false,
    availableQuests: [
      quest('monolith_of_mild_despair', 'The Monolith of Mild Despair', 'dddnd:base'),
      quest('ledger_payments_monolith', 'The Gilded Ledger', packKey, { communityPack: { name: 'Demo: The Gilded Ledger', publisher: 'unknown (loaded from a file)' } }),
    ],
    availableTutorials: [],
    availableClasses: [{ id: 'boundary_mage', version: 1, name: 'Boundary Mage', description: 'd' }],
    availableChallengeModifiers: [],
    load_table_choices: vi.fn(async () => ({ classes: storeMock.availableClasses, modifiers: storeMock.availableChallengeModifiers })),
    communityPacks: [pack],
    savedRunPackNotice: null,
    load_available_quests: vi.fn().mockResolvedValue(undefined),
    load_available_classes: vi.fn().mockResolvedValue(undefined),
    load_available_tutorials: vi.fn().mockResolvedValue(undefined),
    load_available_challenge_modifiers: vi.fn().mockResolvedValue(undefined),
    load_content_packs: vi.fn().mockResolvedValue(undefined),
    refresh_saved_run_pack_notice: vi.fn().mockResolvedValue(undefined),
    is_pack_store_persistent: vi.fn().mockResolvedValue(true),
    community_pack_restore_issues: vi.fn().mockResolvedValue([]),
    find_community_pack: (key: string) => (key === packKey ? pack : null),
    find_community_pack_relations: vi.fn().mockReturnValue({ replaces: null, same_name: [] }),
    remove_community_pack: vi.fn().mockResolvedValue(undefined),
    start_new_run: vi.fn().mockResolvedValue(undefined),
    warm_scenario_bundle: vi.fn().mockResolvedValue(undefined),
    openAboutModal: vi.fn(), closeAboutModal: vi.fn(), openRulesModal: vi.fn(), closeRulesModal: vi.fn(),
    openDungeonMasterModal: vi.fn(), closeDungeonMasterModal: vi.fn(),
  }
})

afterEach(() => localStorage.removeItem('dddnd.tutorialsComplete'))

describe('the council lobby (journal M2.11)', () => {
  it('shows only first-party adventures, even with a community pack imported', async () => {
    const wrapper = mount(RunSetupView)
    await flushPromises()
    expect(wrapper.findAll('.quest-name').map((node) => node.text())).toEqual(['The Monolith of Mild Despair'])
    expect(wrapper.find('.pack-banner').exists()).toBe(false)
  })

  it('links to the bazaar instead of opening a dialog', async () => {
    const wrapper = mount(RunSetupView)
    await flushPromises()
    const link = wrapper.findAll('button.plaque-link').find((button) => button.text().includes('Community bazaar'))
    await link!.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/community')
  })

  it('sends a ?pack= link on to the bazaar, which never loads it by itself', async () => {
    routeQuery.pack = 'https://raw.githubusercontent.com/o/r/main/p/manifest.json'
    mount(RunSetupView)
    await flushPromises()
    expect(replaceSpy).toHaveBeenCalledWith({ path: '/community', query: { pack: routeQuery.pack } })
  })
})

describe("a community pack's table (journal M2.11)", () => {
  it("shows only that pack's adventures, under the pack's banner", async () => {
    const wrapper = mount(RunSetupView, { props: { packKey: packKey.split('/') } })
    await flushPromises()
    expect(wrapper.findAll('.quest-name').map((node) => node.text())).toEqual(['The Gilded Ledger'])
    const banner = wrapper.find('.pack-banner')
    expect(banner.text()).toContain('not reviewed by DDDnD')
    expect(banner.text()).toContain('Demo: The Gilded Ledger')
    expect(banner.text()).toContain('Published by unknown (loaded from a file)')
    expect(wrapper.find('.council-lobby').classes()).toContain('bazaar-theme')
  })

  it("starts the run with the pack's key", async () => {
    const wrapper = mount(RunSetupView, { props: { packKey } })
    await flushPromises()
    await wrapper.find('.sit-btn').trigger('click')
    await flushPromises()
    expect(storeMock.start_new_run).toHaveBeenCalledWith(expect.objectContaining({ pack_key: packKey, scenario_id: 'ledger_payments_monolith' }))
  })

  it('goes back to the bazaar, not the front door', async () => {
    const wrapper = mount(RunSetupView, { props: { packKey } })
    await flushPromises()
    await wrapper.find('.ghost-btn').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/community')
  })

  it("sends a link to a pack that isn't imported here to the bazaar, which explains", async () => {
    mount(RunSetupView, { props: { packKey: 'github:someone/else/pack' } })
    await flushPromises()
    expect(replaceSpy).toHaveBeenCalledWith({ path: '/community', query: { missing: '1' } })
  })
})

describe('the bazaar (journal M2.12)', () => {
  it('shows one stall per imported pack, with its publisher and the external mark', async () => {
    const wrapper = mount(CommunityBazaarView)
    await flushPromises()
    const stalls = wrapper.findAll('.stall')
    expect(stalls).toHaveLength(1)
    expect(stalls[0].text()).toContain('External · not reviewed')
    expect(stalls[0].text()).toContain('Demo: The Gilded Ledger')
    expect(stalls[0].text()).toContain('Published by unknown (loaded from a file)')
    expect(stalls[0].text()).toContain('1 adventure')
  })

  it('says packs are kept in this browser only, with no accounts', async () => {
    const wrapper = mount(CommunityBazaarView)
    await flushPromises()
    const note = wrapper.find('.storage-note').text()
    expect(note).toContain('Kept in this browser only.')
    expect(note).toContain('no accounts')
    expect(note).toContain('Keep the links to packs you like')
  })

  it("says packs last only for the visit when the browser won't keep them", async () => {
    storeMock.is_pack_store_persistent = vi.fn().mockResolvedValue(false)
    const wrapper = mount(CommunityBazaarView)
    await flushPromises()
    expect(wrapper.find('.storage-note').text()).toContain('last only until you close the page')
  })

  it('asks before removing a pack, and says what it costs', async () => {
    const wrapper = mount(CommunityBazaarView)
    await flushPromises()
    await wrapper.findAll('.stall-btn').find((button) => button.text() === 'Remove')!.trigger('click')
    expect(wrapper.find('.stall-confirm').text()).toContain("can't be continued until you import it again")
    expect(storeMock.remove_community_pack).not.toHaveBeenCalled()
    await wrapper.find('.stall-btn.danger').trigger('click')
    await flushPromises()
    expect(storeMock.remove_community_pack).toHaveBeenCalledWith(packKey)
  })

  it('keeps importing apart from the packs: an action below them, not a stall', async () => {
    const wrapper = mount(CommunityBazaarView)
    await flushPromises()
    expect(wrapper.find('.stalls .import-btn').exists()).toBe(false)
    expect(wrapper.find('.import-slot .import-btn').text()).toContain('Import a pack')
  })

  it('suggests the example packs, saying what kind each is (a new setting, or a different topic)', async () => {
    storeMock.communityPacks = []
    const wrapper = mount(CommunityBazaarView)
    await flushPromises()
    expect(wrapper.findAll('.stall')).toHaveLength(0)
    expect(wrapper.find('.bazaar-empty').text()).toContain('example packs')
    const cards = wrapper.findAll('.example-card')
    expect(cards.map((card) => card.find('.example-name').text())).toEqual(['Demo: The Gilded Ledger', 'SRE: The Pager Storm'])
    expect(cards.map((card) => card.find('.example-kind').text())).toEqual(['Same game, new setting', 'A different topic'])
  })

  it('opens the import dialog with the example\'s pinned link: the player still reviews it first', async () => {
    storeMock.communityPacks = []
    const wrapper = mount(CommunityBazaarView)
    await flushPromises()
    await wrapper.findAll('.example-try')[1].trigger('click')
    const dialog = wrapper.findComponent(CommunityPacksDialog)
    expect(dialog.props('isOpen')).toBe(true)
    expect(dialog.props('initialUrl')).toBe('https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/sre_on_call-v1.0.0/packs/sre_on_call/manifest.json')
  })

  it('stops suggesting an example once it is imported', async () => {
    storeMock.communityPacks = [{
      ...pack,
      origin: { kind: 'remote', manifest_url: 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.1.0/packs/gilded_ledger/manifest.json', pinning: 'release_tag' },
    }]
    const wrapper = mount(CommunityBazaarView)
    await flushPromises()
    expect(wrapper.findAll('.example-name').map((name) => name.text())).toEqual(['SRE: The Pager Storm'])
  })
})
