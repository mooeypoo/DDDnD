/**
 * Ending icons (ADR 0002: icons and art stay in the UI, not in content).
 *
 * The base game's endings have their own; any other ending, from a pack or
 * the tutorial, gets the generic one (journal M3.7).
 */

const ENDING_ICONS: Record<string, string> = {
  boundary_builder: '🏗️',
  firefighter: '🧯',
  runaway_refactorer: '♻️',
  stakeholder_whisperer: '🗣️',
  system_stabilizer: '⚖️',
  the_diplomat: '🤝',
  budget_hawk: '🦅',
  the_pragmatist: '🔧',
  the_visionary: '🔭',
  burnout_machine: '🔥',
}

export const GENERIC_ENDING_ICON = '🎯'

export function endingIcon(endingId: string): string {
  return Object.prototype.hasOwnProperty.call(ENDING_ICONS, endingId) ? ENDING_ICONS[endingId] : GENERIC_ENDING_ICON
}
