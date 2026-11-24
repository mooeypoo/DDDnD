/**
 * Records the base pack in the base-content lock (scripts/lib/base_content_lock.ts),
 * after checking it keeps the lock's promise. Run it after changing base
 * content: `npm run content:lock`.
 *
 * A file whose recorded play changes without a new version is refused, unless
 * it is named with `--accept <section>/<file>`: for the case
 * CONTENT_VERSIONING.md allows, behaviour made explicit in a new field with a
 * test proving it plays identically. Say why in the commit.
 *
 * `--check` (`npm run content:lock:check`, run in CI) writes nothing: it fails
 * when the promise is broken or the lock wasn't recorded. The pre-commit hook
 * (.githooks/pre-commit) records the lock whenever base content is committed.
 */

import { isDeepStrictEqual } from 'node:util'
import { writeFileSync } from 'node:fs'

import { currentBase, LOCK_PATH, lockProblems, readLock } from './lib/base_content_lock'

// `--accept cards/x-v1.json`: its play signature changed on purpose and provably
// plays the same (CONTENT_VERSIONING.md, "When Not to Increase Version")
const args = process.argv.slice(2)
const accepted = new Set(args.flatMap((arg, index) => (args[index - 1] === '--accept' ? [arg] : [])))
const checkOnly = args.includes('--check')

const now = currentBase()
const lock = readLock()
const problems = lockProblems(lock, now, accepted)
if (problems.length > 0) {
  console.error('The base pack breaks the promise in the base-content lock:\n')
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}
if (checkOnly) {
  if (!isDeepStrictEqual(lock, now)) {
    console.error('Base content changed but the base-content lock was not recorded. Run `npm run content:lock` and commit scripts/base-content-lock.json.')
    process.exit(1)
  }
  console.log(`Base ${now.version} keeps its promise to published packs.`)
  process.exit(0)
}
writeFileSync(LOCK_PATH, `${JSON.stringify(now, null, 2)}\n`)
console.log(`Recorded base ${now.version} in ${LOCK_PATH}.`)
