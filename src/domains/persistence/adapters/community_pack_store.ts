/**
 * Community Pack Store (M2.6)
 *
 * Keeps added community packs on this device, so they (and saved runs that
 * use them) survive a reload. One entry per pack id: adding a new version of
 * a pack replaces the old one.
 *
 * What is stored is the pack's `.dddnd-pack.json` text, not parsed objects.
 * On every load it goes back through the full validation (readPackBundle), so
 * a pack saved under older, looser rules can't skip newer checks.
 *
 * Packs are keyed by their pack key (ADR 0012), not their manifest id: two
 * different packs that both call themselves `gilded_ledger` never overwrite
 * each other here.
 *
 * IndexedDB is used because packs can be megabytes and localStorage is small
 * and synchronous. When IndexedDB is unavailable (some private browsing modes,
 * blocked storage), a memory store is used and `persistent` is false, so the
 * UI can say packs won't be kept.
 */

import type { PackOrigin } from '@/domains/content/model'

export interface StoredCommunityPack {
  /** Key: the pack key (ADR 0012). One stored version per pack. */
  pack_key: string
  /** The manifest id. A name, not unique. */
  pack_id: string
  name: string
  version: string
  content_hash: string
  origin: PackOrigin
  /** The pack as `.dddnd-pack.json` text. Re-validated on every load. */
  bundle_text: string
  added_at: string
}

export interface CommunityPackStore {
  /** False when packs only live until the page is closed. */
  readonly persistent: boolean
  list(): Promise<StoredCommunityPack[]>
  put(pack: StoredCommunityPack): Promise<void>
  /** Removes by pack key. */
  remove(packKey: string): Promise<void>
}

const DATABASE_NAME = 'dddnd'
/**
 * 2: keyed by pack_key (ADR 0012). Version 1 keyed by manifest id and only
 * ever existed in development builds, so its store is dropped, not migrated.
 */
const DATABASE_VERSION = 2
const STORE_NAME = 'community_packs'

/**
 * In-memory store: tests, and browsers without IndexedDB. Uses
 * `structuredClone` like IndexedDB does, so values IndexedDB would reject
 * (such as Vue reactive proxies) fail here too.
 */
export function createMemoryCommunityPackStore(persistent = false): CommunityPackStore {
  const packs = new Map<string, StoredCommunityPack>()
  return {
    persistent,
    list: async () => [...packs.values()].map((pack) => structuredClone(pack)),
    put: async (pack) => {
      packs.set(pack.pack_key, structuredClone(pack))
    },
    remove: async (packKey) => {
      packs.delete(packKey)
    },
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = (event) => {
      const database = request.result
      if (event.oldVersion < 2 && database.objectStoreNames.contains(STORE_NAME)) {
        database.deleteObjectStore(STORE_NAME)
      }
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'pack_key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened'))
    request.onblocked = () => reject(new Error('IndexedDB is blocked by another tab'))
  })
}

function indexedDbStore(database: IDBDatabase): CommunityPackStore {
  function read<T>(action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return requestToPromise(action(database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME)))
  }

  /**
   * Resolves when the transaction has committed, not when the request
   * succeeds: only then is the data durable. A player who adds a pack and
   * immediately leaves the page must not lose it.
   */
  function write(action: (store: IDBObjectStore) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write was aborted'))
      action(transaction.objectStore(STORE_NAME))
    })
  }

  return {
    persistent: true,
    list: () => read((store) => store.getAll() as IDBRequest<StoredCommunityPack[]>),
    put: (pack) => write((store) => {
      store.put(pack)
    }),
    remove: (packKey) => write((store) => {
      store.delete(packKey)
    }),
  }
}

/**
 * Opens the IndexedDB-backed store, or falls back to memory (not persistent)
 * when IndexedDB is missing or refuses to open.
 */
export async function openCommunityPackStore(
  factory: IDBFactory | undefined = globalThis.indexedDB,
): Promise<CommunityPackStore> {
  if (!factory) {
    return createMemoryCommunityPackStore(false)
  }
  try {
    return indexedDbStore(await openDatabase(factory))
  } catch {
    return createMemoryCommunityPackStore(false)
  }
}
