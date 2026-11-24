/**
 * The Pack Studio's import boundaries (ADR 0005), checked on every file:
 *
 * - the Studio (studio/src) may import the domains, never the game's UI;
 * - the game (src) never imports the Studio;
 * - the authoring domain is pure: no Vue, DOM or storage;
 * - only the Studio's content adapter (studio/src/content) reaches the content
 *   domain's services; screens ask the authoring domain (M4.5b);
 * - the Studio doesn't read content file names itself: the domain does.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(ts|vue)$/.test(entry) ? [full] : []
  })
}

function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(/(?:import|export)[^'"`]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map((match) => match[1] ?? match[2])
}

function violations(files: string[], isForbidden: (specifier: string, file: string) => boolean): string[] {
  return files.flatMap((file) => importsOf(file).filter((specifier) => isForbidden(specifier, file)).map((specifier) => `${file}: ${specifier}`))
}

describe('Pack Studio boundaries (ADR 0005)', () => {
  it('the Studio never imports the game\'s UI', () => {
    const studio = sourceFiles('studio/src')
    expect(studio.length).toBeGreaterThan(0)
    expect(violations(studio, (specifier, file) =>
      specifier.startsWith('@/ui') || specifier.startsWith('@/app')
      || (specifier.startsWith('.') && /[\\/]src[\\/](ui|app)[\\/]/.test(path.resolve(path.dirname(file), specifier))),
    )).toEqual([])
  })

  it('the game never imports the Studio', () => {
    expect(violations(sourceFiles('src'), (specifier) => specifier.startsWith('@studio') || specifier.includes('studio/src'))).toEqual([])
  })

  it('the authoring domain is pure: no Vue, DOM, storage or UI', () => {
    const authoring = sourceFiles('src/domains/authoring')
    expect(authoring.length).toBeGreaterThan(0)
    expect(violations(authoring, (specifier) => specifier === 'vue' || specifier.startsWith('@/ui') || specifier.startsWith('@studio'))).toEqual([])
    for (const file of authoring) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/\b(window|document|localStorage|indexedDB)\./)
    }
  })

  it('only the content adapter reaches the content services (M4.5b)', () => {
    const screens = sourceFiles('studio/src').filter((file) => !file.includes(`${path.sep}content${path.sep}`))
    expect(violations(screens, (specifier) => specifier.startsWith('@/domains/content/services'))).toEqual([])
  })

  it('the Studio leaves content file names to the domain (M4.5b)', () => {
    for (const file of sourceFiles('studio/src')) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/-v\(\\d\+\)/)
    }
  })
})
