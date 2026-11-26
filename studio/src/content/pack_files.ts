/**
 * Pack files in and out of the Studio (docs/PACK_STUDIO.md M4.8;
 * CONTENT_PACKS_SECURITY.md T11). Only the Studio reads zips: the game never
 * unzips.
 *
 * The zip format is fflate's. The bounds are this file's, checked before and
 * while anything is decompressed:
 *
 * - the file's size, before it's read at all;
 * - the number of entries, and every entry's name (plain relative paths only:
 *   no `..`, no leading `/`, no backslashes or drive letters);
 * - only the entries the domain asks for are decompressed, each counted while
 *   it inflates and stopped past its cap, so a header that lies about its size
 *   can't inflate past it; everything read is capped together as well;
 * - every entry must be UTF-8 text.
 *
 * What a pack's files are, and which to read, is the authoring domain's
 * (`readPackArchive`); what the content may be is the game's own snapshot
 * builder's, exactly as when a player imports a pack.
 */

import { strToU8, Unzip, UnzipInflate, zipSync, type UnzipFile } from 'fflate'

import { PACK_ARCHIVE_LIMITS, readPackArchiveFiles, readPackReadme, type PackArchive } from '@/domains/authoring'
import type { PackSnapshot } from '@/domains/content/model'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import { buildPackSnapshot, PackLoadError, type RawPackFiles } from '@/domains/content/services/pack_snapshot_builder'

/** A reason an imported file was refused, in words. */
export class ImportError extends Error {
  constructor(public problems: string[]) {
    super(problems.join('\n'))
    this.name = 'ImportError'
  }
}

/** True for a plain relative path: no `..`, no root, no backslash or drive letter. */
export function isSafeEntryName(name: string): boolean {
  if (name === '' || name.startsWith('/') || name.includes('\\') || /^[a-zA-Z]:/.test(name) || name.includes('\0')) return false
  return name.split('/').every((part, index, parts) => part !== '..' && part !== '.' && (part !== '' || index === parts.length - 1))
}

/** Streams the archive once, handing each entry to `visit`. */
function eachEntry(bytes: Uint8Array, visit: (file: UnzipFile) => void): void {
  const unzip = new Unzip(visit)
  unzip.register(UnzipInflate)
  unzip.push(bytes, true)
}

/**
 * Opens a zip within PACK_ARCHIVE_LIMITS. Its names are checked at once;
 * files are decompressed only when read. Throws ImportError.
 */
export function openPackZip(bytes: Uint8Array, fileName: string): PackArchive {
  const limits = PACK_ARCHIVE_LIMITS
  if (bytes.byteLength > limits.archiveBytes) throw new ImportError([`${fileName} is larger than ${limits.archiveBytes} bytes.`])

  const names: string[] = []
  try {
    eachEntry(bytes, (file) => {
      if (names.length >= limits.entries) throw new ImportError([`${fileName} has more than ${limits.entries} files.`])
      if (!isSafeEntryName(file.name)) throw new ImportError([`${fileName} has a file with an unsafe name: ${JSON.stringify(file.name.slice(0, 80))}.`])
      if (!file.name.endsWith('/')) names.push(file.name)
    })
  } catch (error) {
    if (error instanceof ImportError) throw error
    throw new ImportError([`${fileName} is not a zip file the Studio can read.`])
  }
  if (new Set(names).size !== names.length) throw new ImportError([`${fileName} lists the same file twice.`])

  let budget = limits.totalBytes
  const decoder = new TextDecoder('utf-8', { fatal: true })

  return {
    names,
    async read(wanted, maxBytes) {
      const want = new Set(wanted)
      const chunks = new Map<string, Uint8Array[]>()
      let failure: string | null = null
      try {
        eachEntry(bytes, (file) => {
          if (!want.has(file.name) || failure) return
          const parts: Uint8Array[] = []
          let size = 0
          file.ondata = (error, data, final) => {
            if (failure) return
            if (error) {
              failure = `${file.name} in ${fileName} is damaged.`
              return
            }
            size += data.byteLength
            budget -= data.byteLength
            if (size > maxBytes) failure = `${file.name} in ${fileName} is larger than ${maxBytes} bytes.`
            else if (budget < 0) failure = `${fileName} holds more than ${limits.totalBytes} bytes of files.`
            if (failure) {
              file.terminate()
              return
            }
            parts.push(data)
            if (final) chunks.set(file.name, parts)
          }
          file.start()
        })
      } catch {
        failure ??= `${fileName} is not a zip file the Studio can read.`
      }
      if (failure) throw new ImportError([failure])

      const out: Record<string, string> = {}
      for (const name of wanted) {
        const parts = chunks.get(name)
        if (!parts) throw new ImportError([`${name} in ${fileName} couldn't be read.`])
        const joined = new Uint8Array(parts.reduce((sum, part) => sum + part.byteLength, 0))
        let at = 0
        for (const part of parts) {
          joined.set(part, at)
          at += part.byteLength
        }
        try {
          out[name] = decoder.decode(joined)
        } catch {
          throw new ImportError([`${name} in ${fileName} is not text.`])
        }
      }
      return out
    },
  }
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

/**
 * A pack file (`.dddnd-pack.json`) or a zip, read the way the game reads an
 * import. Throws ImportError with every reason it was refused.
 */
export async function readImportedPack(file: File): Promise<{ snapshot: PackSnapshot; sources?: RawPackFiles; readme?: string }> {
  const limit = PACK_ARCHIVE_LIMITS.archiveBytes
  if (file.size > limit) throw new ImportError([`${file.name} is larger than ${limit} bytes.`])
  const bytes = new Uint8Array(await file.arrayBuffer())
  try {
    if (ZIP_MAGIC.every((byte, index) => bytes[index] === byte)) {
      // The files as written travel with the snapshot, so the draft keeps how they were written (N4)
      const archive = openPackZip(bytes, file.name)
      const sources = await readPackArchiveFiles(archive, file.name)
      const snapshot = await buildPackSnapshot(sources, { kind: 'file', file_name: file.name })
      return { snapshot, sources, readme: await readPackReadme(archive, file.name) }
    }
    let text: string
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
      throw new ImportError([`${file.name} is neither a DDDnD pack file nor a zip.`])
    }
    if (!text.trimStart().startsWith('{')) throw new ImportError([`${file.name} is neither a DDDnD pack file nor a zip.`])
    return { snapshot: await readPackBundle(text, file.name) }
  } catch (error) {
    if (error instanceof PackLoadError) throw new ImportError(error.issues.map((issue) => `${issue.file}: ${issue.message}`))
    throw error
  }
}

/** The zip of a pack's files (`exportDraftArchive`), ready to download. */
export function zipPackFiles(files: Record<string, string>): Uint8Array {
  return zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])), { level: 6 })
}
