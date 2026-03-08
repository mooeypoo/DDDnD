/**
 * Available Quests Configuration
 * 
 * This is a UI-layer configuration that defines which scenarios/quests
 * are exposed on the run setup screen.
 * 
 * Each entry is a versioned reference to a scenario content file.
 * The configuration is explicit and UI-owned, allowing different UIs
 * (web, terminal, etc.) to expose different scenario selections independently.
 * 
 * This is NOT the authoritative source of all possible scenarios in the content library.
 * It is only the list of scenarios this particular UI chooses to present.
 */

import type { VersionRef } from '@/domains/content/model'

/**
 * List of scenarios/quests available on the setup screen.
 * 
 * Each entry identifies a scenario by its id and version,
 * which resolves to a file at: /content/scenarios/{id}-v{version}.json
 */
export const AVAILABLE_QUESTS: VersionRef[] = [
  {
    id: 'monolith_of_mild_despair',
    version: 1
  },
  {
    id: 'microservice_sprawl',
    version: 1
  },
  {
    id: 'compliance_gauntlet',
    version: 1
  },
  {
    id: 'startup_hypergrowth',
    version: 1
  }
]
