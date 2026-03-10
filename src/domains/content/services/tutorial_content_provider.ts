/**
 * Tutorial Content Provider
 *
 * Creates a content provider specifically for tutorial content.
 * Tutorial content lives in /content/tutorial/ and mirrors the main
 * content directory structure.
 *
 * Also provides a loader for tutorial scripts (a tutorial-specific
 * content type not present in the main content system).
 */

import { createContentProvider } from './content_provider'
import type { ContentProvider } from './content_provider'
import type { VersionRef } from '../model/version_ref'
import { versionRefKey } from '../model/version_ref'
import type { TutorialScript } from '../model/tutorial_types'

const TUTORIAL_CONTENT_BASE_PATH = '/content/tutorial'

/**
 * Extended content provider for tutorial content.
 *
 * Includes the standard ContentProvider interface (loading from tutorial namespace)
 * plus a tutorial-specific loadTutorialScript method.
 */
export interface TutorialContentProvider extends ContentProvider {
  loadTutorialScript(ref: VersionRef): Promise<TutorialScript>
}

/**
 * Creates a content provider that loads from the tutorial content namespace.
 */
export function createTutorialContentProvider(): TutorialContentProvider {
  const baseProvider = createContentProvider(TUTORIAL_CONTENT_BASE_PATH)

  async function loadTutorialScript(ref: VersionRef): Promise<TutorialScript> {
    const filename = `${versionRefKey(ref)}.json`
    const filePath = `${TUTORIAL_CONTENT_BASE_PATH}/scripts/${filename}`

    let response: Response
    try {
      response = await fetch(filePath)
    } catch {
      throw new Error(`Tutorial script not found: ${filePath}`)
    }

    if (!response.ok) {
      throw new Error(`Tutorial script not found: ${filePath}`)
    }

    const content = await response.json() as TutorialScript

    if (content.id !== ref.id || content.version !== ref.version) {
      throw new Error(
        `Tutorial script metadata mismatch in ${filename}: ` +
        `expected id="${ref.id}" version=${ref.version}, ` +
        `found id="${content.id}" version=${content.version}`
      )
    }

    return content
  }

  return {
    ...baseProvider,
    loadTutorialScript,
  }
}
