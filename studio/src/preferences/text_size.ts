/**
 * The Studio's text-size setting (docs/PACK_STUDIO.md §10).
 *
 * A per-viewer convenience: remembered in this browser when storage is
 * available, and the Studio works the same without it (private windows,
 * blocked storage).
 */

export const TEXT_SIZES = ['standard', 'large', 'largest'] as const
export type TextSize = (typeof TEXT_SIZES)[number]

const STORAGE_KEY = 'dddnd.studio.textSize'

export function isTextSize(value: unknown): value is TextSize {
  return typeof value === 'string' && (TEXT_SIZES as readonly string[]).includes(value)
}

export function readTextSize(storage: Pick<Storage, 'getItem'> | null = safeStorage()): TextSize {
  try {
    const stored = storage?.getItem(STORAGE_KEY)
    return isTextSize(stored) ? stored : 'standard'
  } catch {
    return 'standard'
  }
}

export function writeTextSize(size: TextSize, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, size)
  } catch {
    // Not kept; the setting still applies for this visit
  }
}

/** Applies the size to the page: every rem scales from the root (studio.css). */
export function applyTextSize(size: TextSize, root: HTMLElement = document.documentElement): void {
  root.dataset.textSize = size
}

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
