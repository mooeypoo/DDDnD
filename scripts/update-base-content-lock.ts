/**
 * Records the base pack in the base-content lock (scripts/lib/base_content_lock.ts),
 * after checking it keeps the lock's promise. Run it after changing base
 * content: `npm run content:lock`.
 *
 * A file whose recorded play changes without a new version is refused, unless
 * it is named with `--accept <section>/<file>`: for the case
 * CONTENT_VERSIONING.md allows, behaviour made explicit in a new field with a
 * test proving it plays identically. Say why in the commit.
 */

import { writeFileSync } from 'node:fs'

import { currentBase, LOCK_PATH, lockProblems, readLock } from './lib/base_content_lock'

// `--accept cards/x-v1.json`: its play signature changed on purpose and provably
// plays the same (CONTENT_VERSIONING.md, "When Not to Increase Version")
const args = process.argv.slice(2)
const accepted = new Set(args.flatMap((arg, index) => (args[index - 1] === '--accept' ? [arg] : [])))

const now = currentBase()
const problems = lockProblems(readLock(), now, accepted)
if (problems.length > 0) {
  console.error('The base pack breaks the promise in the base-content lock:\n')
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}
writeFileSync(LOCK_PATH, `${JSON.stringify(now, null, 2)}\n`)
console.log(`Recorded base ${now.version} in ${LOCK_PATH}.`)
