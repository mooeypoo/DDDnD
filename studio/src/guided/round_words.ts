/**
 * The guided round's words (§5, D9, D14): what each step asks, the teaching
 * moment it carries, and a worked example beside it. The examples are the
 * Gilded Ledger's, the retelling in DDDnD-packs the round draws from (D14).
 * What each step needs, and whether the draft has it, is the domain's
 * (guided_round.ts); these are only the Studio's words for it.
 */

import type { CardVerdict, EventLeaning, RoundStep } from '@/domains/authoring'

export interface StepWords {
  /** In the step strip. */
  short: string
  title: string
  ask: string
  rule?: { title: string; text: string[] }
  example: { title: string; lines: string[] }
}

/** The pack the round's examples come from (D14). */
export const EXAMPLE_PACK = 'The Gilded Ledger'

export const ROUND_WORDS: Record<RoundStep, StepWords> = {
  world: {
    short: 'Name your world',
    title: 'Name your world',
    ask: 'What will players see when they find your pack? Give it a name, a sentence about the world it\'s set in, and your name as its author.',
    rule: { title: 'Make it sound like your place', text: ['Players pick a pack by its name. Name it for your organization or your system, not for DDDnD.'] },
    example: { title: 'The Gilded Ledger', lines: ['"The DDDnD monolith story retold for a fictional payments company."'] },
  },
  scenario: {
    short: 'Your scenario',
    title: 'What system are you untangling?',
    ask: 'Your scenario is the situation the player walks into. Name it, tell its story in a few sentences, and set where things stand at the start and how many turns there are.',
    rule: { title: 'Start where it hurts', text: ['Set the starting scores where your system really is today. A low score is the trouble the player came to fix.'] },
    example: {
      title: 'The Gilded Ledger',
      lines: [
        '"Gilded Ledger Co. runs every charge, refund, and chargeback through one payments monolith and one shared database. The regulator\'s audit is coming, and nobody can say where a refund\'s data actually lives."',
        'Domain Clarity starts at 36, Budget at 72. Ten turns.',
      ],
    },
  },
  council: {
    short: 'Your council',
    title: 'Bring your people to the table',
    ask: 'Add two people from your organization whose opinion decides things. Give each of them a reaction: what makes them nervous, or pleased.',
    rule: { title: 'A reaction is a line in the sand', text: ['Name the moment a person speaks up: "when User Trust drops below 40". One each is enough to make the council feel alive.'] },
    example: {
      title: 'The Gilded Ledger',
      lines: [
        'Head of Payments: "Owns the money flow. Measures success in uptime, and in not being on the evening news."',
        'Their reaction: when User Trust is below 40, Head of Payments −6 satisfaction, and Budget −2.',
      ],
    },
  },
  cards: {
    short: 'Your cards',
    title: 'Write the moves your team argues about',
    ask: 'A card is something the player can do in one turn: a decision someone in your organization would actually propose in a meeting. Write three.',
    rule: {
      title: 'The one rule',
      text: [
        'Every move trades something away. Splitting a service clarifies the domain, but slows delivery for a while. If a card only helps, players will play nothing else.',
        'Don\'t overdo the cost, though: a good card still gains more than it gives up. The trade-off is in which scores move.',
      ],
    },
    example: {
      title: 'The Gilded Ledger',
      lines: ['Freeze Changes to the Payment Path: User Trust +5, Team Morale −3, Delivery Confidence −3, and Head of Payments +3 satisfaction.'],
    },
  },
  surprises: {
    short: 'Your surprises',
    title: 'What could happen to you?',
    ask: 'Events land between turns, whatever the player does. Write one bad one and one good one.',
    rule: { title: 'The world pushes back', text: ['A bad surprise tests the player\'s plan; a good one rewards the groundwork. Both make a run feel like your place.'] },
    example: {
      title: 'The Gilded Ledger',
      lines: [
        'Bad: Double-Charge Incident, "A retry bug charges hundreds of customers twice." User Trust −6, Head of Payments −5 satisfaction.',
        'Good: The Audit Dry Run Goes Well. User Trust +4, Team Morale +4.',
      ],
    },
  },
  deck: {
    short: 'Fill the deck',
    title: 'Fill the deck',
    ask: 'Your copy came with the scenario\'s own cards and events. Keep what fits your world, take out what doesn\'t, and add any others from the game.',
    rule: { title: 'Yours and the game\'s, together', text: ['The game\'s cards are moves any team can make. Yours are what makes the run about your place. A card from the game plays exactly as it does there.'] },
    example: { title: 'The Gilded Ledger', lines: ['Four cards of its own, four events, and the game\'s cards for everything else.'] },
  },
  check: {
    short: 'Check it',
    title: 'Check it',
    ask: 'These are the game\'s own checks, the same ones a player\'s import runs. If they list anything, "Go to it" opens the editor where it\'s fixed.',
    example: { title: 'The Gilded Ledger', lines: ['Passes the same checks, which is why players can import it.'] },
  },
  play: {
    short: 'Play it',
    title: 'Play it',
    ask: 'Open your pack in the game, in a tab of its own. Play a few turns of your own scenario. Nothing is saved there.',
    example: { title: 'The Gilded Ledger', lines: ['Started the same way: a copy of the Monolith, made about one company.'] },
  },
}

export const VERDICT_WORDS: Record<CardVerdict, { text: string; tone: 'good' | 'look' }> = {
  trades_off: { text: 'trades off', tone: 'good' },
  only_helps: { text: 'only helps', tone: 'look' },
  only_hurts: { text: 'only costs', tone: 'look' },
  no_changes: { text: 'changes nothing yet', tone: 'look' },
}

export const LEANING_WORDS: Record<EventLeaning, { text: string; tone: 'good' | 'look' }> = {
  bad: { text: 'bad', tone: 'good' },
  good: { text: 'good', tone: 'good' },
  mixed: { text: 'mixed: neither', tone: 'look' },
  no_changes: { text: 'changes nothing yet', tone: 'look' },
}
