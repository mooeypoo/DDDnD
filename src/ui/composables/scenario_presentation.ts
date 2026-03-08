import type { Scenario } from '@/domains/content/model'

const DEFAULT_COMPACT_LENGTH = 160

function normalizeText(value?: string): string {
  if (!value) {
    return ''
  }

  return value.replace(/\s+/g, ' ').trim()
}

function trimToCompactLength(text: string, maxLength = DEFAULT_COMPACT_LENGTH): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export function resolveScenarioShortDescription(
  scenario: Pick<Scenario, 'short_description' | 'flavor_text' | 'description'>,
  maxLength = DEFAULT_COMPACT_LENGTH
): string {
  const shortDescription = normalizeText(scenario.short_description)
  if (shortDescription) {
    return trimToCompactLength(shortDescription, maxLength)
  }

  const flavorText = normalizeText(scenario.flavor_text)
  if (flavorText) {
    return trimToCompactLength(flavorText, maxLength)
  }

  return trimToCompactLength(normalizeText(scenario.description), maxLength)
}
