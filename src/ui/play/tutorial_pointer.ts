export interface TutorialPointerOptions {
  requiredVerb?: 'play' | 'consult' | null
  consultMode?: boolean
}

/**
 * Resolves which table element a tutorial pointer should follow.
 *
 * Selectors are presentation anchors (`data-play-highlight` / `data-card-id`).
 * They do not invent legality. `satchel` still aliases to the hand dock.
 * A consult step points at Consult until the Grimoire is open.
 */
export function tutorialPointerSelector(
  requiredCardId: string | null | undefined,
  highlight: string | null | undefined,
  options: TutorialPointerOptions = {},
): string | null {
  if (options.requiredVerb === 'consult') {
    if (options.consultMode) {
      return null
    }

    return '[data-play-highlight="consult"]'
  }

  if (requiredCardId) {
    return `.fan-slot[data-card-id="${escapeAttr(requiredCardId)}"]`
  }

  switch (highlight) {
    case 'hand':
    case 'satchel':
      return '[data-play-highlight="hand"]'
    case 'scores':
      return '[data-play-highlight="weather"]'
    case 'aftershocks':
      return '[data-play-highlight="aftershocks"], [data-play-highlight="weather"]'
    case 'coupling':
      return '[data-play-highlight="coupling"], [data-play-highlight="weather"]'
    case 'stakeholders':
      return '[data-play-highlight="stakeholders"]'
    case 'consult':
      return '[data-play-highlight="consult"]'
    default:
      return null
  }
}

function escapeAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
