/**
 * The Studio's state (docs/PACK_STUDIO.md M4.3): the drafts in this browser,
 * the open draft, saving and checking it as the author works, and export.
 *
 * Editing goes through `updateDraft`, which saves shortly after the last
 * change and re-runs the game's own check (`checkDraft`) a little later, so
 * the Checks rail is always about the draft as it is now.
 */

import { reactive, toRaw } from 'vue'

import {
  checkDraft,
  draftFromBaseScenario,
  draftFromPack,
  draftForNewTopic,
  startRound,
  exportDraftArchive,
  previewBundle,
  exportDraftBundle,
  newestRef,
  releaseDraft,
  unseatedNotesFrom,
  scenarioChanges,
  changesByMemberFrom,
  balanceHints,
  draftBalance,
  type BalanceHint,
  type DeckBalance,
  type GameBalance,
  type ChangeSource,
  type ScenarioChanges,
  type BaseContentReader,
  type DraftPack,
  type UnseatedNote,
} from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import type { PackIssue } from '@/domains/authoring'
import { listBaseRefs, loadFirstParty, loadGameBalance, type BaseScenarioChoice } from '@studio/content/first_party'
import { playInGame, type PlayStatus } from '@studio/content/game_preview'
import { LICENSE_TEXTS } from '@studio/content/license_texts'
import { ImportError, readImportedPack, zipPackFiles } from '@studio/content/pack_files'
import { newDraftId, openDraftStore, type DraftStore, type StoredDraft } from '@studio/drafts/draft_store'
import { emptyHistory, recordEdit, redoEdit, undoEdit, type DraftHistory } from '@studio/state/draft_history'

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
  /** What changes each council member's satisfaction, by member id (slice 3). */
  memberChanges: Record<string, ChangeSource[]>
  /** The draft's decks in numbers, beside the game's, and what's worth a look (D3). Never blocking. */
  balance: { decks: DeckBalance[]; game: GameBalance | null; hints: BalanceHint[] }
  /** Whether there's a step to undo or redo (M4.24), and what was last done, for a polite announcement. */
  undo: { can_undo: boolean; can_redo: boolean; said: string }
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
  memberChanges: {},
  balance: { decks: [], game: null, hints: [] },
  undo: { can_undo: false, can_redo: false, said: '' },
  error: null,
})

let store: DraftStore | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null
let checkTimer: ReturnType<typeof setTimeout> | null = null
let checkRun = 0
let history: DraftHistory = emptyHistory()

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
    // One walk of who changes whom, for the notes and every member's page
    const tables = await scenarioChanges(draft, base)
    const [result, notes, decks, game] = await Promise.all([
      checkDraft(draft, packs),
      councilNotes(draft, tables, base),
      draftBalance(draft, base),
      // The game's own numbers, to compare with; without them the hints still name cards that only help
      loadGameBalance().catch(() => null),
    ])
    if (run !== checkRun) return
    state.check = { state: 'done', issues: result.issues }
    state.notes = notes
    state.memberChanges = Object.fromEntries(changesByMemberFrom(tables))
    state.balance = { decks, game, hints: balanceHints(draft, decks, game) }
  } catch (error) {
    if (run !== checkRun) return
    state.check = { state: 'failed', issues: [{ file: 'pack', message: (error as Error).message }] }
  }
}

/** Council notes, named: the game's members by their base version, the draft's own by theirs. */
async function councilNotes(draft: DraftPack, tables: readonly ScenarioChanges[], base: BaseContentReader): Promise<CouncilNote[]> {
  const notes = unseatedNotesFrom(draft, tables)
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

/** Forgets what the last check found, for a draft just opened or closed. */
function clearDraftFindings() {
  state.check = { state: 'idle', issues: [] }
  state.notes = []
  state.memberChanges = {}
  state.balance = { decks: [], game: null, hints: [] }
  // Another draft, or none: its history isn't this one's
  setHistory(emptyHistory())
}

/** Replaces the open draft with an edited one, then saves and checks it. */
export function updateDraft(next: DraftPack, options: { sameStep?: boolean } = {}): void {
  if (!state.current) return
  const before = state.current.draft
  // Moving through the guided round isn't an edit to undo; a new item's id following its name is part of naming it
  if (!onlyRoundMoved(before, next)) setHistory(recordEdit(history, before, Date.now(), options))
  state.current = { draft_id: state.current.draft_id, draft: next }
  scheduleSaveAndCheck()
}

/** Undo (M4.24): the draft before the last step. Saved and checked like any edit. */
export function undoDraft(): void {
  if (!state.current) return
  const step = undoEdit(history, state.current.draft)
  if (!step) return
  applyStep(step, 'Undone')
}

export function redoDraft(): void {
  if (!state.current) return
  const step = redoEdit(history, state.current.draft)
  if (!step) return
  applyStep(step, 'Redone')
}

function applyStep(step: { history: DraftHistory; draft: DraftPack }, words: string) {
  setHistory(step.history)
  state.current = { draft_id: state.current!.draft_id, draft: step.draft }
  state.undo.said = words
  scheduleSaveAndCheck()
}

/** The history and what the toolbar shows of it, together. */
function setHistory(next: DraftHistory) {
  history = next
  state.undo = { can_undo: next.past.length > 0, can_redo: next.future.length > 0, said: '' }
}

/** True when the only difference is the round's place: everything else is the same object (edits return new ones). */
function onlyRoundMoved(before: DraftPack, next: DraftPack): boolean {
  const keys = new Set([...Object.keys(before), ...Object.keys(next)])
  keys.delete('round')
  return [...keys].every((key) => before[key as keyof DraftPack] === next[key as keyof DraftPack])
}

/** "Start from a DDDnD scenario" (D13): a new retelling holding a copy of the scenario. */
export async function startFromBaseScenario(choice: BaseScenarioChoice, options: { guided?: boolean } = {}): Promise<string> {
  const { base } = await loadFirstParty()
  const copied = (await draftFromBaseScenario(base, choice.ref, { name: `${choice.name}, retold` })).draft
  // The guided round (§5) starts on the same copy, with the round's place kept beside it
  const draft = options.guided ? startRound(copied) : copied
  const draftId = newDraftId()
  state.current = { draft_id: draftId, draft }
  clearDraftFindings()
  await saveNow()
  void checkNow()
  return draftId
}

/** "Teach another subject" (M4.17): a new topic's skeleton, using the game's outcome tiers. Returns its draft id. */
export async function startNewTopic(name: string, description: string, options: { guided?: boolean } = {}): Promise<string> {
  const tiers = await listBaseRefs('outcome_tiers')
  const { draft: skeleton } = draftForNewTopic({ name, description }, tiers)
  // The topic's guided round (§5) starts on the same skeleton
  const draft = options.guided ? startRound(skeleton) : skeleton
  const draftId = newDraftId()
  state.current = { draft_id: draftId, draft }
  clearDraftFindings()
  await saveNow()
  void checkNow()
  return draftId
}

/**
 * "Import a pack" (M4.8): a pack file or a zip becomes a new draft, if the
 * game would import it and the draft can hold all of it (D26). Returns the
 * new draft's id, or every reason it was refused.
 */
export async function importPack(file: File): Promise<{ ok: true; draft_id: string } | { ok: false; problems: string[] }> {
  let draft: DraftPack
  try {
    const { snapshot, sources, readme } = await readImportedPack(file)
    const result = draftFromPack(snapshot, { sources, readme })
    if (!result.ok) return { ok: false, problems: result.problems }
    draft = result.draft
  } catch (error) {
    if (error instanceof ImportError) return { ok: false, problems: error.problems }
    return { ok: false, problems: [`${file.name} couldn't be read: ${(error as Error).message}`] }
  }
  const draftId = newDraftId()
  state.current = { draft_id: draftId, draft }
  clearDraftFindings()
  await saveNow()
  void checkNow()
  return { ok: true, draft_id: draftId }
}

export async function openDraft(draftId: string): Promise<boolean> {
  // Already open (the guided round and the workspace are two views of one draft): keep it,
  // and any edit still waiting to be saved, rather than reading an older copy back
  if (state.current?.draft_id === draftId) return true
  if (!store) await initStudio()
  const entry = await store?.get(draftId)
  if (!entry) {
    state.current = null
    return false
  }
  state.current = { draft_id: entry.draft_id, draft: entry.draft }
  state.save = 'saved'
  clearDraftFindings()
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
  clearDraftFindings()
}

export async function removeDraft(draftId: string): Promise<void> {
  await store?.remove(draftId)
  if (state.current?.draft_id === draftId) state.current = null
  await refreshList()
}

/**
 * "Play it" (D15): the open draft, as it is now, played in the game's preview
 * tab. Returns the issues that stop it (the game's own checks), or none.
 */
export async function playCurrentDraft(onStatus: (status: PlayStatus) => void): Promise<PackIssue[]> {
  if (!state.current) return []
  const { packs } = await loadFirstParty()
  const preview = await previewBundle(plainDraft(state.current.draft), packs)
  if (!preview.ok) return preview.issues
  playInGame(preview.text, onStatus)
  return []
}

/** What an export downloads: the pack file the bazaar imports, or a zip for GitHub (D4). */
export type ExportFormat = 'pack_file' | 'zip'

/**
 * Exports the open draft as a release at `version` (M4.7): content whose play
 * changed since the last export gets its next version first. The released
 * draft is kept, and saved at once, only if the game would import it.
 * Returns the issues otherwise.
 */
export async function exportCurrentDraft(version: string, format: ExportFormat = 'pack_file'): Promise<PackIssue[]> {
  if (!state.current) return []
  const { packs } = await loadFirstParty()
  const released = releaseDraft(plainDraft(state.current.draft), version)
  const result = format === 'zip'
    ? await exportDraftArchive(released, packs, LICENSE_TEXTS).then((archive) => (archive.ok
      ? { ok: true as const, blob: new Blob([zipPackFiles(archive.files) as BlobPart], { type: 'application/zip' }), file_name: archive.file_name }
      : archive))
    : await exportDraftBundle(released, packs).then((bundle) => (bundle.ok
      ? { ok: true as const, blob: new Blob([bundle.text], { type: 'application/json' }), file_name: bundle.file_name }
      : bundle))
  if (!result.ok) {
    state.check = { state: 'done', issues: result.issues }
    return result.issues
  }
  state.current = { draft_id: state.current.draft_id, draft: released }
  // An export is out in the world: undoing past it would forget what players have
  setHistory(emptyHistory())
  if (saveTimer) clearTimeout(saveTimer)
  await saveNow()
  void checkNow()
  const url = URL.createObjectURL(result.blob)
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
