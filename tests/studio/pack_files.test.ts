// @vitest-environment node
/**
 * The Studio's zip adapter (studio/src/content/pack_files.ts; M4.8,
 * CONTENT_PACKS_SECURITY.md T11): zips round-trip, and hostile archives are
 * refused before or while they decompress, never after.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { strToU8, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'

import { draftFromPack, PACK_ARCHIVE_LIMITS } from '@/domains/authoring'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { ImportError, isSafeEntryName, openPackZip, readImportedPack, zipPackFiles } from '@studio/content/pack_files'

const LEDGER = path.resolve('tests/content/fixtures/packs/gilded_ledger')

function folderFiles(root: string, prefix: string): Record<string, string> {
  const files: Record<string, string> = {}
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else files[`${prefix}${path.relative(root, full).split(path.sep).join('/')}`] = readFileSync(full, 'utf8')
    }
  }
  walk(root)
  return files
}

const fileOf = (bytes: Uint8Array | string, name: string) => new File([bytes as BlobPart], name)

async function refusal(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ImportError) return error.problems.join('\n')
    throw error
  }
  throw new Error('expected the import to be refused')
}

describe('importing a zip', () => {
  it('reads a pack folder zipped by the Studio, or found deeper in a repository', async () => {
    for (const prefix of ['gilded_ledger/', 'DDDnD-packs-main/packs/gilded_ledger/']) {
      const zip = zipPackFiles({ ...folderFiles(LEDGER, prefix), 'DDDnD-packs-main/LICENSE': 'GPL' })
      const { snapshot, sources } = await readImportedPack(fileOf(zip, 'ledger.zip'))
      expect(snapshot.manifest.id).toBe('gilded_ledger')
      expect(sources?.files).toHaveProperty(['cards/ledger_freeze_payment_changes-v1.json'])
      expect(draftFromPack(snapshot, { sources }).ok).toBe(true)
    }
  })

  it('reads a pack file too', async () => {
    const { snapshot: zip } = await readImportedPack(fileOf(zipPackFiles(folderFiles(LEDGER, '')), 'ledger.zip'))
    const { writePackBundle } = await import('@/domains/content/services/pack_bundle_file')
    const again = await readImportedPack(fileOf(writePackBundle(zip), 'ledger.dddnd-pack.json'))
    expect(again.snapshot.entities).toEqual(zip.entities)
    expect(again.sources).toBeUndefined()
  })

  it('refuses unsafe entry names before reading anything', () => {
    for (const name of ['../evil.json', '/abs.json', 'a/../../b.json', 'C:/x.json', 'a\\b.json', './a.json']) {
      expect(isSafeEntryName(name), name).toBe(false)
      const zip = zipSync({ [name]: strToU8('{}') })
      expect(() => openPackZip(zip, 'evil.zip'), name).toThrow(/unsafe name/)
    }
    expect(isSafeEntryName('pack/cards/x-v1.json')).toBe(true)
    expect(isSafeEntryName('pack/')).toBe(true)
  })

  it('refuses a file that inflates past its cap, while inflating', async () => {
    // 4 MiB of spaces deflates to a few KiB: a small zip bomb
    const bomb = zipSync({ 'manifest.json': new Uint8Array(4 * 1024 * 1024).fill(0x20) }, { level: 9 })
    expect(bomb.byteLength).toBeLessThan(64 * 1024)
    const archive = openPackZip(bomb, 'bomb.zip')
    await expect(archive.read(['manifest.json'], CONTENT_LIMITS.max_manifest_bytes)).rejects.toThrow(/larger than 262144 bytes/)
  })

  it('caps everything read together', async () => {
    const big = new Uint8Array(CONTENT_LIMITS.max_file_bytes - 10).fill(0x20)
    const count = Math.ceil(PACK_ARCHIVE_LIMITS.totalBytes / big.byteLength) + 1
    const files = Object.fromEntries(Array.from({ length: count }, (_, index) => [`f${index}.json`, big]))
    const archive = openPackZip(zipSync(files, { level: 9 }), 'many.zip')
    await expect(archive.read(Object.keys(files), CONTENT_LIMITS.max_file_bytes)).rejects.toThrow(/holds more than/)
  })

  it('refuses too many entries, an oversized archive, and what is not a zip', async () => {
    const many = zipSync(Object.fromEntries(Array.from({ length: PACK_ARCHIVE_LIMITS.entries + 1 }, (_, index) => [`f${index}.json`, strToU8('{}')])))
    expect(() => openPackZip(many, 'many.zip')).toThrow(/more than \d+ files/)
    expect(() => openPackZip(new Uint8Array(PACK_ARCHIVE_LIMITS.archiveBytes + 1), 'huge.zip')).toThrow(/larger than/)
    expect(await refusal(readImportedPack(fileOf(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]), 'broken.zip')))).toMatch(/not a zip file|damaged|couldn't be read|no manifest\.json/)
    expect(await refusal(readImportedPack(fileOf(new Uint8Array([0xff, 0xfe, 0x00]), 'x.bin')))).toMatch(/neither a DDDnD pack file nor a zip/)
    expect(await refusal(readImportedPack(fileOf('{"hello": 1}', 'x.json')))).toMatch(/not a DDDnD pack file/)
    expect(await refusal(readImportedPack(fileOf('just some notes', 'notes.txt')))).toMatch(/neither a DDDnD pack file nor a zip/)
  })

  it('reports the game\'s own reasons for a pack it would refuse', async () => {
    const files = folderFiles(LEDGER, '')
    const manifest = JSON.parse(files['manifest.json']) as { license: string }
    files['manifest.json'] = JSON.stringify({ ...manifest, license: 'MIT' })
    expect(await refusal(readImportedPack(fileOf(zipPackFiles(files), 'ledger.zip')))).toMatch(/manifest\.json: .*licen/i)
  })
})
