import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')
const sourceDir = resolve(projectRoot, 'content')
const destinationDir = resolve(projectRoot, 'dist', 'content')

if (!existsSync(sourceDir)) {
  console.warn(`[copy-content] Source directory not found: ${sourceDir}`)
  process.exit(0)
}

mkdirSync(destinationDir, { recursive: true })
cpSync(sourceDir, destinationDir, { recursive: true, force: true })
console.log(`[copy-content] Copied ${sourceDir} -> ${destinationDir}`)
