/**
 * The Studio's state (docs/PACK_STUDIO.md M4.3): the drafts in this browser,
 * the open draft, saving and checking it as the author works, and export.
 *
 * Editing goes through `updateDraft`, which saves shortly after the last
 * change and re-runs the game's own check (`checkDraft`) a little later, so
 * the Checks rail is always about the draft as it is now.
 */

import { reactive, toRaw } from 'vue'

import { checkDraft, draftFromBaseScenario, exportDraftBundle, newestRef, releaseDraft, unseatedNotes, type BaseContentReader, type DraftPack, type UnseatedNote } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import type { PackIssue } from '@/domains/authoring'
import { listBaseRefs, loadFirstParty, type BaseScenarioChoice } from '@studio/content/first_party'
import { newDraftId, openDraftStore, type DraftStore, type StoredDraft } from '@studio/drafts/draft_store'

const SAVE_DELAY_MS = 400
const CHECK_DELAY_MS = 700

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'failed'
export type CheckState = 'idle' | 'checking' | 'done' | 'failed'

/** A council note (M4.5a), with the person's name and, when they can be seated, who to seat. */
export interface CouncilNote extends UnseatedNote {
  name: string
  seat: VersionRef | null
}

interface StudioState {
  ready: boolean
  /** False when drafts only live until the page is closed. */
  persistent: boolean
  drafts: StoredDraft[]
  current: { draft_id: string; draft: DraftPack } | null
  save: SaveState
  check: { state: CheckState; issues: PackIssue[] }
  /** Things worth knowing that don't block export (M4.5a). */
  notes: CouncilNote[]
  error: string | null
}

const state = reactive<StudioState>({
  ready: false,
  persistent: true,
  drafts: [],
  current: null,
  save: 'saved',
  check: { state: 'idle', issues: [] },
  notes: [],
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
    const { packs, base } = await loadFirstParty()
    const draft = plainDraft(state.current.draft)
    const [result, notes] = await Promise.all([checkDraft(draft, packs), councilNotes(draft, base)])
    if (run !== checkRun) return
    state.check = { state: 'done', issues: result.issues }
    state.notes = notes
  } catch (error) {
    if (run !== checkRun) return
    state.check = { state: 'failed', issues: [{ file: 'pack', message: (error as Error).message }] }
  }
}

/** Council notes, named: the game's members by their base version, the draft's own by theirs. */
async function councilNotes(draft: DraftPack, base: BaseContentReader): Promise<CouncilNote[]> {
  const notes = await unseatedNotes(draft, base)
  const baseMembers = await listBaseRefs('stakeholders')
  return Promise.all(notes.map(async (note) => {
    const own = draft.content.stakeholders[note.stakeholder_id]
    if (own) return { ...note, name: own.name || 'Unnamed council member', seat: { id: own.id, version: own.version } }
    const seat = newestRef(baseMembers, note.stakeholder_id)
    if (!seat) return { ...note, name: note.stakeholder_id, seat: null }
    const name = await base.loadStakeholder(seat).then((member) => member.name, () => note.stakeholder_id)
    return { ...note, name, seat }
  }))
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
  state.check = { state: 'idle', issues: [] }
  state.notes = []
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
  state.notes = []
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
  state.notes = []
}

export async function removeDraft(draftId: string): Promise<void> {
  await store?.remove(draftId)
  if (state.current?.draft_id === draftId) state.current = null
  await refreshList()
}

/**
 * Exports the open draft as a release at `version` (M4.7): content whose play
 * changed since the last export gets its next version first. The released
 * draft is kept, and saved at once, only if the game would import it.
 * Returns the issues otherwise.
 */
export async function exportCurrentDraft(version: string): Promise<PackIssue[]> {
  if (!state.current) return []
  const { packs } = await loadFirstParty()
  const released = releaseDraft(plainDraft(state.current.draft), version)
  const result = await exportDraftBundle(released, packs)
  if (!result.ok) {
    state.check = { state: 'done', issues: result.issues }
    return result.issues
  }
  state.current = { draft_id: state.current.draft_id, draft: released }
  if (saveTimer) clearTimeout(saveTimer)
  await saveNow()
  void checkNow()
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
