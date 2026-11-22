/**
 * Community packs flow (M2.5): load → check → review → confirm.
 *
 * UI orchestration only. Loading and validation are content-domain services;
 * registration goes through the game store. Gated by ADR 0009: callers render
 * the entry point only when `isCommunityPacksEnabled()`.
 *
 * Nothing is added to the game until the player confirms the review. Loading
 * a URL happens only on an explicit player action, because fetching tells the
 * host the player's IP address.
 */

import { computed, ref } from 'vue'

import type { PackSnapshot } from '@/domains/content/model'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { PackLoadError, type PackIssue } from '@/domains/content/services/pack_snapshot_builder'
import { loadRemotePackSnapshot } from '@/domains/content/services/remote_pack_loader'
import { buildPackReview, type PackReview } from '@/ui/play/community_pack_review'
import { useGameStore } from '@/ui/stores/game_store'

export type CommunityPackPhase = 'idle' | 'loading' | 'review' | 'adding' | 'error'

const STAGE_TITLES: Record<PackLoadError['stage'], string> = {
  source: 'This link can\'t be used',
  fetch: 'The pack couldn\'t be downloaded',
  manifest: 'The pack\'s manifest has problems',
  content: 'The pack\'s content has problems',
}

/** Shown issues are capped so a badly broken pack doesn't flood the dialog. */
const MAX_SHOWN_ISSUES = 12

/**
 * Reads a chosen file as text. `File.text()` is missing in some older browsers
 * (and in jsdom), so fall back to FileReader.
 */
function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text()
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('The file could not be read'))
    reader.readAsText(file)
  })
}

export interface CommunityPackDependencies {
  loadRemote?: typeof loadRemotePackSnapshot
  readBundle?: typeof readPackBundle
}

export function useCommunityPacks(deps: CommunityPackDependencies = {}) {
  const store = useGameStore()
  const loadRemote = deps.loadRemote ?? loadRemotePackSnapshot
  const readBundle = deps.readBundle ?? readPackBundle

  const phase = ref<CommunityPackPhase>('idle')
  const candidate = ref<PackSnapshot | null>(null)
  const errorTitle = ref('')
  const issues = ref<PackIssue[]>([])
  const hiddenIssueCount = ref(0)
  const lastAdded = ref<string | null>(null)
  /** False when the last added pack couldn't be kept on this device. */
  const lastAddedKept = ref(true)
  /** Whether added packs survive a reload in this browser. */
  const persistent = ref(false)
  /** Stored packs that couldn't be restored this visit. */
  const restoreIssues = ref<Array<{ name: string; reason: string }>>([])

  /** Why the saved run can't continue, in plain words, plus a link to re-add from. */
  const savedRunNotice = computed(() => {
    const notice = store.savedRunPackNotice
    if (!notice) return null
    const label = `${notice.pack.id} v${notice.pack.version}`
    const addAgain = notice.pack.source_url ? 'Add it again from its original link' : 'Add that pack file again'
    const messages: Record<typeof notice.reason, string> = {
      missing: `Your saved run was played with the community pack “${label}”, which isn't added right now. ${addAgain} to continue that run, or start a new one.`,
      different_version: `Your saved run was played with a different version of “${label}” than the one added now. ${addAgain} to continue it, or start a new run.`,
      different_source: `Your saved run was played with “${label}”, but the pack added now with that name was loaded from somewhere else, and saved runs only continue with the pack they were played with. ${addAgain} to continue that run, or start a new one.`,
    }
    return { message: messages[notice.reason], sourceUrl: notice.pack.source_url }
  })

  void (async () => {
    persistent.value = await store.is_pack_store_persistent()
    restoreIssues.value = (await store.community_pack_restore_issues()).map((issue) => ({ name: issue.name, reason: issue.reason }))
  })()

  const review = computed<PackReview | null>(() => (candidate.value ? buildPackReview(candidate.value) : null))

  /**
   * What adding the reviewed pack would replace (ADR 0012). Replacing another
   * version of the same pack is routine; replacing a different pack that uses
   * the same name is a caution the player must see before confirming.
   */
  const replacing = computed(() => {
    if (!candidate.value) return []
    const candidateHash = candidate.value.content_hash
    return store.find_replaced_community_packs(candidate.value).map(({ snapshot, same_pack }) => {
      const replaced = buildPackReview(snapshot)
      if (same_pack) {
        return { samePack: true, tone: 'calm' as const, message: `Replaces the version you added before (v${replaced.version}).` }
      }
      // Same content from another place (a GitHub pack and its downloaded file):
      // nothing changes in play, but saved runs remember where a pack came from.
      if (snapshot.content_hash === candidateHash) {
        return {
          samePack: false,
          tone: 'caution' as const,
          message: `The same content is already added from ${replaced.origin.detail}. Adding it from here replaces that copy, and runs saved with that copy will ask for it again.`,
        }
      }
      return {
        samePack: false,
        tone: 'caution' as const,
        message: `A different pack also named “${snapshot.manifest.id}” is added: ${replaced.title} v${replaced.version}, ${replaced.origin.detail}. Only one pack with that name can be added at a time, so adding this one removes it.`,
      }
    })
  })
  const loadedPacks = computed(() => store.communityPacks.map((snapshot) => ({
    id: snapshot.manifest.id,
    review: buildPackReview(snapshot),
  })))

  function showError(title: string, found: PackIssue[]) {
    errorTitle.value = title
    issues.value = found.slice(0, MAX_SHOWN_ISSUES)
    hiddenIssueCount.value = Math.max(0, found.length - MAX_SHOWN_ISSUES)
    candidate.value = null
    phase.value = 'error'
  }

  async function review_(load: () => Promise<PackSnapshot>) {
    phase.value = 'loading'
    lastAdded.value = null
    try {
      const snapshot = await load()
      const check = await store.check_community_pack(snapshot)
      if (!check.ok) {
        showError('This pack can\'t be played here', check.issues)
        return
      }
      candidate.value = snapshot
      phase.value = 'review'
    } catch (error) {
      if (error instanceof PackLoadError) {
        showError(STAGE_TITLES[error.stage], error.issues)
      } else {
        showError('Something went wrong', [{ file: 'pack', message: error instanceof Error ? error.message : String(error) }])
      }
    }
  }

  function loadFromUrl(url: string) {
    return review_(() => loadRemote(url.trim()))
  }

  function loadFromFile(file: File) {
    return review_(async () => readBundle(await readFileText(file), file.name))
  }

  async function confirm() {
    if (!candidate.value) return
    const snapshot = candidate.value
    phase.value = 'adding'
    try {
      const { kept } = await store.add_community_pack(snapshot)
      lastAddedKept.value = kept || !persistent.value
      lastAdded.value = snapshot.manifest.name
      candidate.value = null
      phase.value = 'idle'
    } catch (error) {
      showError('The pack couldn\'t be added', [{ file: 'pack', message: error instanceof Error ? error.message : String(error) }])
    }
  }

  function cancel() {
    candidate.value = null
    issues.value = []
    phase.value = 'idle'
  }

  async function remove(packId: string) {
    lastAdded.value = null
    await store.remove_community_pack(packId)
  }

  return {
    phase,
    review,
    replacing,
    errorTitle,
    issues,
    hiddenIssueCount,
    lastAdded,
    lastAddedKept,
    persistent,
    restoreIssues,
    savedRunNotice,
    loadedPacks,
    loadFromUrl,
    loadFromFile,
    confirm,
    cancel,
    remove,
  }
}
