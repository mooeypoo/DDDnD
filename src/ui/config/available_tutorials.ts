/**
 * Available Tutorial Quests Configuration
 *
 * UI-layer configuration listing which tutorial scenarios are exposed.
 *
 * Tutorial quests use a separate content provider that loads from
 * /content/tutorial/ instead of /content/, keeping tutorial content
 * fully isolated from the main game.
 *
 * Each entry identifies a tutorial scenario by id and version.
 */

import type { VersionRef } from '@/domains/content/model'

/**
 * List of tutorial quests available on the setup screen.
 *
 * Each entry resolves to: /content/tutorial/scenarios/{id}-v{version}.json
 */
export const AVAILABLE_TUTORIALS: VersionRef[] = [
  {
    id: 'tutorial_basics',
    version: 1,
  },
  {
    id: 'tutorial_systems_under_pressure',
    version: 1,
  },
]
