/**
 * Where "Go to it" lands (M4.23): the field a check is about, in the editor
 * it opened. Inputs say which field they edit with `data-field` (and
 * `data-index` in a list); a reaction on a member's page or an aftershock
 * on a card's page is marked with `data-subject`, so its "name" is never
 * taken for the page's own. Which field an issue is about is the domain's
 * (`issueField`); this only finds it on the screen.
 */

export interface FieldPlace {
  /** `section/id` of something edited inside another's page: a reaction, an aftershock. */
  subject?: string
  field?: { field: string; index?: number }
}

const INPUTS = 'input, textarea, select'

/** The element to focus: the field, else the first input of the right part of the page. Null when there's nothing to focus. */
export function fieldElement(root: ParentNode, place: FieldPlace): HTMLElement | null {
  const scope = place.subject
    ? [...root.querySelectorAll<HTMLElement>('[data-subject]')].find((element) => element.dataset.subject === place.subject)
    : root
  if (!scope) return null
  // Without a subject, what belongs to a reaction or an aftershock isn't this page's own field
  const own = (element: HTMLElement) => place.subject !== undefined || element.closest('[data-subject]') === null
  const all = (selector: string) => [...scope.querySelectorAll<HTMLElement>(selector)].filter(own)
  if (place.field) {
    const { field, index } = place.field
    const fields = all('[data-field]').filter((element) => element.dataset.field === field)
    const exact = index === undefined ? undefined : fields.find((element) => element.dataset.index === String(index))
    const found = exact ?? fields[0]
    if (found) return found
  }
  return all(INPUTS)[0] ?? null
}

/**
 * Scrolls the editor area alone so the field sits in its middle. Not
 * `scrollIntoView`, which scrolls every container up to the window and
 * pushes the Studio's header off the top.
 */
export function centreIn(area: HTMLElement, element: HTMLElement): void {
  const box = area.getBoundingClientRect()
  const field = element.getBoundingClientRect()
  area.scrollTo?.({ top: area.scrollTop + (field.top - box.top) - (box.height - field.height) / 2 })
}
