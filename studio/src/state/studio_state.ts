/**
 * The Studio's state (docs/PACK_STUDIO.md M4.3): the drafts in this browser,
 * the open draft, saving and checking it as the author works, and export.
 *
 * Editing goes through `updateDraft`, which saves shortly after the last
 * change and re-runs the game's own check (`checkDraft`) a little later, so
 * the Checks rail is always about the draft as it is now.
 */

import { reactive, toRaw } from 'vue'

import { checkDraft, draftFromBaseScenario, exportDraftBundle, type DraftPack } from '@/domains/authoring'
import type { PackIssue } from '@/domains/content/services/pack_snapshot_builder'
import { loadFirstParty, type BaseScenarioChoice } from '@studio/content/first_party'
import { newDraftId, openDraftStore, type DraftStore, type StoredDraft } from '@studio/drafts/draft_store'

const SAVE_DELAY_MS = 400
const CHECK_DELAY_MS = 700

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'failed'
export type CheckState = 'idle' | 'checking' | 'done' | 'failed'

interface StudioState {
  ready: boolean
  /** False when drafts only live until the page is closed. */
  persistent: boolean
  drafts: StoredDraft[]
  current: { draft_id: string; draft: DraftPack } | null
  save: SaveState
  check: { state: CheckState; issues: PackIssue[] }
  error: string | null
}

const state = reactive<StudioState>({
  ready: false,
  persistent: true,
  drafts: [],
  current: null,
  save: 'saved',
  check: { state: 'idle', issues: [] },
  error: null,
})

let store: DraftStore | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null
let checkTimer: ReturnType<typeof setTimeout> | null = null
let checkRun = 0

/**
 * A plain copy of a draft, safe to store and to hand to the domain. Vue wraps
 * nested objects in proxies that `structuredClone` (and IndexedDB) refuse, and
 * `toRaw` only unwraps the top level. A draft is plain JSON data, so a JSON
 * round trip unwraps everything.
 */
export function plainDraft(draft: DraftPack): DraftPack {
  return JSON.parse(JSON.stringify(toRaw(draft))) as DraftPack
}

async function refreshList() {
  if (store) state.drafts = await store.list()
}

export async function initStudio(): Promise<void> {
  if (state.ready) return
  store = await openDraftStore()
  state.persistent = store.persistent
  await refreshList()
  state.ready = true
}

async function saveNow() {
  if (!store || !state.current) return
  state.save = 'saving'
  try {
    await store.put({ draft_id: state.current.draft_id, draft: plainDraft(state.current.draft), updated_at: new Date().toISOString() })
    state.save = 'saved'
    await refreshList()
  } catch {
    state.save = 'failed'
  }
}

async function checkNow() {
  if (!state.current) return
  const run = ++checkRun
  state.check.state = 'checking'
  try {
    const { packs } = await loadFirstParty()
    const result = await checkDraft(plainDraft(state.current.draft), packs)
    if (run !== checkRun) return
    state.check = { state: 'done', issues: result.issues }
  } catch (error) {
    if (run !== checkRun) return
    state.check = { state: 'failed', issues: [{ file: 'pack', message: (error as Error).message }] }
  }
}

function scheduleSaveAndCheck() {
  state.save = 'unsaved'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void saveNow(), SAVE_DELAY_MS)
  if (checkTimer) clearTimeout(checkTimer)
  checkTimer = setTimeout(() => void checkNow(), CHECK_DELAY_MS)
}

/** Replaces the open draft with an edited one, then saves and checks it. */
export function updateDraft(next: DraftPack): void {
  if (!state.current) return
  state.current = { draft_id: state.current.draft_id, draft: next }
  scheduleSaveAndCheck()
}

/** "Start from a DDDnD scenario" (D13): a new retelling holding a copy of the scenario. */
export async function startFromBaseScenario(choice: BaseScenarioChoice): Promise<string> {
  const { base } = await loadFirstParty()
  const { draft } = await draftFromBaseScenario(base, choice.ref, { name: `${choice.name}, retold` })
  const draftId = newDraftId()
  state.current = { draft_id: draftId, draft }
  await saveNow()
  void checkNow()
  return draftId
}

export async function openDraft(draftId: string): Promise<boolean> {
  if (!store) await initStudio()
  const entry = await store?.get(draftId)
  if (!entry) {
    state.current = null
    return false
  }
  state.current = { draft_id: entry.draft_id, draft: entry.draft }
  state.save = 'saved'
  state.check = { state: 'idle', issues: [] }
  void checkNow()
  return true
}

/** Saves anything pending, then leaves the draft. */
export async function closeDraft(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
    await saveNow()
  }
  if (checkTimer) clearTimeout(checkTimer)
  state.current = null
}

export async function removeDraft(draftId: string): Promise<void> {
  await store?.remove(draftId)
  if (state.current?.draft_id === draftId) state.current = null
  await refreshList()
}

/**
 * Exports the open draft as a `.dddnd-pack.json` download (D4), only when the
 * game would import it. Returns the issues otherwise.
 */
export async function exportCurrentDraft(): Promise<PackIssue[]> {
  if (!state.current) return []
  const { packs } = await loadFirstParty()
  const result = await exportDraftBundle(plainDraft(state.current.draft), packs)
  if (!result.ok) {
    state.check = { state: 'done', issues: result.issues }
    return result.issues
  }
  const url = URL.createObjectURL(new Blob([result.text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = result.file_name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return []
}

/**
 * The Studio's state, for reading in components. Change it only through the
 * functions above (`updateDraft`, `openDraft`, …), never by assigning to it.
 */
export const studio = state
