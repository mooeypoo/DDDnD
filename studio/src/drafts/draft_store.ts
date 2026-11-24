/**
 * Draft store (docs/PACK_STUDIO.md D8): the author's drafts, kept in this
 * browser.
 *
 * IndexedDB, like the game's community pack store, because drafts grow and
 * localStorage is small and synchronous. Without IndexedDB (some private
 * modes, blocked storage), a memory store is used and `persistent` is false,
 * so the Studio can say drafts won't survive closing the page.
 *
 * Drafts are stored as plain data (structured clones), never Vue proxies.
 */

import type { DraftPack } from '@/domains/authoring'

export interface StoredDraft {
  /** Local id of this draft, not the pack's id. */
  draft_id: string
  draft: DraftPack
  updated_at: string
}

export interface DraftStore {
  readonly persistent: boolean
  list(): Promise<StoredDraft[]>
  get(draftId: string): Promise<StoredDraft | undefined>
  put(entry: StoredDraft): Promise<void>
  remove(draftId: string): Promise<void>
}

const DATABASE_NAME = 'dddnd-studio'
const DATABASE_VERSION = 1
const STORE_NAME = 'drafts'

function newestFirst(entries: StoredDraft[]): StoredDraft[] {
  return [...entries].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export function createMemoryDraftStore(persistent = false): DraftStore {
  const entries = new Map<string, StoredDraft>()
  return {
    persistent,
    async list() {
      return newestFirst([...entries.values()].map((entry) => structuredClone(entry)))
    },
    async get(draftId) {
      const entry = entries.get(draftId)
      return entry ? structuredClone(entry) : undefined
    },
    async put(entry) {
      entries.set(entry.draft_id, structuredClone(entry))
    },
    async remove(draftId) {
      entries.delete(draftId)
    },
  }
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = factory.open(DATABASE_NAME, DATABASE_VERSION)
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE_NAME)) {
        open.result.createObjectStore(STORE_NAME, { keyPath: 'draft_id' })
      }
    }
    open.onsuccess = () => resolve(open.result)
    open.onerror = () => reject(open.error)
    open.onblocked = () => reject(new Error('The drafts database is blocked by another tab'))
  })
}

function createIndexedDbDraftStore(database: IDBDatabase): DraftStore {
  const store = (mode: IDBTransactionMode) => database.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
  return {
    persistent: true,
    async list() {
      return newestFirst(await request(store('readonly').getAll() as IDBRequest<StoredDraft[]>))
    },
    async get(draftId) {
      return request(store('readonly').get(draftId) as IDBRequest<StoredDraft | undefined>)
    },
    async put(entry) {
      await request(store('readwrite').put(structuredClone(entry)))
    },
    async remove(draftId) {
      await request(store('readwrite').delete(draftId))
    },
  }
}

/** The browser's draft store, or a memory one when IndexedDB isn't available. */
export async function openDraftStore(factory: IDBFactory | undefined = globalThis.indexedDB): Promise<DraftStore> {
  if (!factory) return createMemoryDraftStore()
  try {
    return createIndexedDbDraftStore(await openDatabase(factory))
  } catch {
    return createMemoryDraftStore()
  }
}

/** A fresh local id for a new draft. */
export function newDraftId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
