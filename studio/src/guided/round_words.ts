/**
 * The guided round's words (§5, D9, D14): what each step asks, the teaching
 * moment it carries, and a worked example beside it. A retelling's examples
 * are the Gilded Ledger's, a topic's the SRE pack's: the packs in
 * DDDnD-packs each round draws from (D14). What each step needs, and whether
 * the draft has it, is the domain's (guided_round.ts); these are only the
 * Studio's words for it.
 */

import type { CardVerdict, DraftKind, EventLeaning, RoundStep, ScorePull } from '@/domains/authoring'

export interface StepWords {
  /** In the step strip. */
  short: string
  title: string
  ask: string
  rule?: { title: string; text: string[] }
  example: { title: string; lines: string[] }
}

/** A round's own words: what it's called in its header, and the pack its examples come from (D14). */
export interface RoundWords {
  what: string
  example_pack: string
  steps: Partial<Record<RoundStep, StepWords>>
}

const RETELLING_STEPS: Partial<Record<RoundStep, StepWords>> = {
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

const TOPIC_STEPS: Partial<Record<RoundStep, StepWords>> = {
  world: {
    short: 'Name your world',
    title: 'Name your world',
    ask: 'What will players see when they find your pack? Give it a name, a sentence about what it teaches, and your name as its author.',
    rule: { title: 'Name the subject', text: ['Players pick a pack by what they\'ll learn. Name it for your topic and its trouble, not for DDDnD.'] },
    example: { title: 'SRE: The Pager Storm', lines: ['"A second domain for DDDnD: site reliability engineering and incident response."'] },
  },
  scores: {
    short: 'What it trades off',
    title: 'What does your topic trade off?',
    ask: 'Scores are what a run is judged on. Name three to six things your topic pulls between, each phrased so that higher is better.',
    rule: {
      title: 'Scores should trade off',
      text: [
        'If nothing ever lowers a score, the best plan is to raise it every turn, and one strategy wins. Choose scores that pull against each other: rest against speed, safety against cost.',
        'Phrase each so higher is better: "Rested On-Call", not "Burnout".',
      ],
    },
    example: {
      title: 'SRE: The Pager Storm',
      lines: [
        'Availability, Error Budget, Rested On-Call, Customer Trust, Change Velocity, Observability.',
        'Rested On-Call: "Whether the people holding the pager can sleep, think, and stay."',
      ],
    },
  },
  scenario: {
    short: 'Your scenario',
    title: 'Where does the story start?',
    ask: 'Your scenario is the situation the player walks into. Tell its story in a few sentences, set where each score starts, and how many turns there are.',
    rule: { title: 'Start where it hurts', text: ['Set the starting scores where things really are today. A low score is the trouble the player came to fix.'] },
    example: {
      title: 'SRE: The Pager Storm',
      lines: [
        '"A growing service pages its on-call team every night. The SLOs are vague, the error budget is nearly spent, and the people holding the pager are running out of sleep."',
        'Observability starts at 34, Change Velocity at 60. Ten turns.',
      ],
    },
  },
  council: {
    short: 'Your council',
    title: 'Bring your people to the table',
    ask: 'Add two people whose opinion decides things in your topic. Give each of them a reaction: what makes them nervous, or pleased.',
    rule: { title: 'A reaction is a line in the sand', text: ['Name the moment a person speaks up: "when Rested On-Call drops below 30". One each is enough to make the council feel alive.'] },
    example: {
      title: 'SRE: The Pager Storm',
      lines: [
        'On-Call Engineer: "Carries the pager this rotation. Has opinions about 3 a.m."',
        'Their reaction: when Rested On-Call is below 30, Availability −2, and On-Call Engineer −6 satisfaction.',
      ],
    },
  },
  cards: {
    short: 'Your cards',
    title: 'Write the moves people argue about',
    ask: 'A card is something the player can do in one turn: a decision someone in your field would actually propose. Write three; your deck is all your own, so add more whenever you like.',
    rule: {
      title: 'The one rule',
      text: [
        'Every move trades something away. Tuning the alerts lets the on-call sleep, but someone stops watching a graph. If a card only helps, players will play nothing else.',
        'Don\'t overdo the cost, though: a good card still gains more than it gives up. The trade-off is in which scores move.',
      ],
    },
    example: {
      title: 'SRE: The Pager Storm',
      lines: ['Tune the Noisy Alerts: Rested On-Call +8, Observability +2, Availability −1, Change Velocity −1, and On-Call Engineer +4 satisfaction.'],
    },
  },
  surprises: {
    short: 'Your surprises',
    title: 'What could happen to you?',
    ask: 'Events land between turns, whatever the player does. Write one bad one and one good one.',
    rule: { title: 'The world pushes back', text: ['A bad surprise tests the player\'s plan; a good one rewards the groundwork. Both make a run feel like the real thing.'] },
    example: {
      title: 'SRE: The Pager Storm',
      lines: [
        'Bad: The 3 a.m. Outage, "The service goes down in the middle of the night, and the pager goes off." Availability −5, Rested On-Call −4, Customer Trust −2.',
        'Good: A Quiet Week. Rested On-Call +5, Customer Trust +2.',
      ],
    },
  },
  endings: {
    short: 'Your endings',
    title: 'What kinds of leader can a player become?',
    ask: 'An ending names the kind of leader the player turned out to be, from how the run went. Write two of your own. A run that fits none of them gets the ending tried last.',
    rule: {
      title: 'Endings should be reachable, and mean something here',
      text: [
        '"Firefighter" meant different things in DDD and in SRE. Name what a leader in your topic is known for.',
        'Set conditions a real run can meet: a score that ends at 95 or more almost never happens.',
      ],
    },
    example: {
      title: 'SRE: The Pager Storm',
      lines: [
        'The Hero Firefighter: "You saved the day, again and again, and the pager ate the people holding it." When Availability rose by 5 or more and Rested On-Call fell by 8 or more.',
        'The Toil Slayer: when Rested On-Call rose by 15 or more.',
      ],
    },
  },
  class: {
    short: 'Your class',
    title: 'Who do players sit down as?',
    ask: 'A class is who the player plays as. Its favourite score gains 1 every turn, so each class plays a different run. Name your first one and give it a favourite.',
    rule: { title: 'A class is a way to play', text: ['Lean each class toward one score. One is enough to start; add more later, from your pack\'s contents.'] },
    example: {
      title: 'SRE: The Pager Storm',
      lines: ['Toil Druid: "Tends the rotation like a garden: prune the alerts, and the people grow back." Its favourite: Rested On-Call.'],
    },
  },
  check: {
    short: 'Check it',
    title: 'Check it',
    ask: 'These are the game\'s own checks, the same ones a player\'s import runs. If they list anything, "Go to it" opens the editor where it\'s fixed.',
    example: { title: 'SRE: The Pager Storm', lines: ['Passes the same checks, which is why players can import it.'] },
  },
  play: {
    short: 'Play it',
    title: 'Play it',
    ask: 'Open your pack in the game, in a tab of its own. Play a few turns of your own scenario. Nothing is saved there.',
    example: { title: 'SRE: The Pager Storm', lines: ['Its first draft never won a run: its cards cost almost as much as they gained. The trade-off had to move into which scores change.'] },
  },
}

/** Each kind of draft's round (§5). */
export const ROUNDS: Record<DraftKind, RoundWords> = {
  retelling: { what: 'Retell DDDnD for your organization', example_pack: 'The Gilded Ledger', steps: RETELLING_STEPS },
  new_topic: { what: 'Teach your topic with DDDnD', example_pack: 'SRE: The Pager Storm', steps: TOPIC_STEPS },
}

/** A step's words, in this kind of round. Every step of a round has its words (a test says so). */
export function stepWords(kind: DraftKind, step: RoundStep): StepWords {
  return ROUNDS[kind].steps[step]!
}

/** Where a topic's first sitting ends (§5, "in two sittings"): shown on its last step. */
export const SITTING_BREAK = {
  title: 'A good place to stop',
  text: 'Your world is made: what it trades off, where it starts, who\'s at the table. Leave the round now if you like; your work is kept, and "Back to the guided round" brings you back here.',
}

export const PULL_WORDS: Record<ScorePull, { text: string; tone: 'good' | 'look' | 'quiet' }> = {
  both_ways: { text: 'pulls both ways', tone: 'good' },
  only_up: { text: 'only goes up', tone: 'look' },
  only_down: { text: 'only goes down', tone: 'look' },
  untouched: { text: 'no card moves it yet', tone: 'quiet' },
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
