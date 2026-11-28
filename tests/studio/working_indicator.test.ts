/**
 * Showing that the Studio is working on it (M4.26): what the last check
 * found is out of date from the moment of an edit, and every screen that
 * shows it says so (a turning ring, the last answer dimmed) instead of
 * presenting it as the answer.
 */

import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { createDraft } from '@/domains/authoring'
import type { ContentPackManifest } from '@/domains/content/model'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'
import ChecksButton from '@studio/workspace/checks_button.vue'
import ChecksPanel from '@studio/workspace/checks_panel.vue'
import ReleaseView from '@studio/workspace/release_view.vue'
import { createFileContentProvider } from '../../scripts/lib/file_content_provider'

const issues = [{ file: 'manifest.json', message: 'authors: must be at least 1 items' }]

describe("the checks' findings after an edit", () => {
  it('are out of date at once, kept until the next check replaces them', async () => {
    vi.resetModules()
    const BASE = path.resolve('content')
    vi.doMock('@studio/content/first_party', () => ({
      listBaseRefs: async () => [],
      loadFirstParty: async () => {
        const registry = new ContentPackRegistry()
        const manifest = JSON.parse(readFileSync(path.join(BASE, 'manifest.json'), 'utf8')) as ContentPackManifest
        registry.registerPack(manifest, createFileContentProvider(BASE))
        return { packs: [{ manifest, provider: createFileContentProvider(BASE) }], base: registry.createScopedProvider(firstPartyPackKey('base')) }
      },
      loadGameBalance: async () => null,
    }))
    const { startNewTopic, studio, updateDraft } = await import('@studio/state/studio_state')
    await startNewTopic('Incident Response', 'On call.')
    await vi.waitFor(() => expect(studio.check.state).toBe('done'))
    const found = studio.check.issues.length
    expect(found).toBeGreaterThan(0)

    // The edit, before the check after it has even started
    updateDraft({ ...studio.current!.draft, name: 'On Call' })
    expect(studio.check.state).toBe('checking')
    expect(studio.check.issues).toHaveLength(found)
    await vi.waitFor(() => expect(studio.check.state).toBe('done'), { timeout: 5000 })
    vi.doUnmock('@studio/content/first_party')
  })
})

describe('the toolbar and the checks panel, while checking again', () => {
  it('turn the ring instead of the status dot, and keep the last findings, dimmed and busy', () => {
    const button = mount(ChecksButton, { props: { state: 'checking', issues, notes: [], full: false } })
    expect(button.find('.dot').exists()).toBe(false)
    expect(button.find('.working').text()).toBe('Checking…')
    expect(mount(ChecksButton, { props: { state: 'done', issues, notes: [], full: false } }).find('.working').exists()).toBe(false)

    const panel = mount(ChecksPanel, { props: { state: 'checking', issues } })
    expect(panel.find('.checks-status').classes()).toContain('working')
    expect(panel.find('.issue-list').classes()).toContain('is-updating')
    expect(panel.find('.issue-list').attributes('aria-busy')).toBe('true')
    const settled = mount(ChecksPanel, { props: { state: 'done', issues } })
    expect(settled.find('.issue-list').classes()).not.toContain('is-updating')
    expect(settled.find('.issue-list').attributes('aria-busy')).toBeUndefined()
  })
})

describe('the export page, while checking again', () => {
  it('says it is checking, not that there is something to fix', () => {
    const draft = createDraft({ kind: 'retelling', name: 'Ours', authors: [{ name: 'A' }] })
    const checking = mount(ReleaseView, { props: { draft, checksClean: false, checking: true } })
    expect(checking.find('.working').text()).toBe('Checking the pack…')
    expect(checking.text()).not.toContain('Fix what the checks list first')
    expect(mount(ReleaseView, { props: { draft, checksClean: false } }).text()).toContain('Fix what the checks list first')
  })
})
