import type { OutcomeArchetypeId } from '@/domains/simulation/rules/classify_outcome_archetype'

export interface OutcomeMock {
  archetype: OutcomeArchetypeId
  title: string
  summary: string
  mood: 'calm' | 'tense' | 'victorious'
}

export const outcomeMocks: Record<OutcomeArchetypeId, OutcomeMock> = {
  boundary_builder: {
    archetype: 'boundary_builder',
    title: 'Boundary Builder',
    summary: 'You restored structure through clear context boundaries and better team ownership.',
    mood: 'victorious'
  },
  firefighter: {
    archetype: 'firefighter',
    title: 'Firefighter',
    summary: 'You absorbed constant incidents and kept the platform alive under intense pressure.',
    mood: 'tense'
  },
  system_stabilizer: {
    archetype: 'system_stabilizer',
    title: 'System Stabilizer',
    summary: 'You balanced risk, reliability, and throughput to steady a fragile system.',
    mood: 'calm'
  },
  stakeholder_whisperer: {
    archetype: 'stakeholder_whisperer',
    title: 'Stakeholder Whisperer',
    summary: 'You kept alignment across leadership, product, and engineering despite tradeoffs.',
    mood: 'calm'
  },
  runaway_refactorer: {
    archetype: 'runaway_refactorer',
    title: 'Runaway Refactorer',
    summary: 'You chased deep cleanup aggressively, sometimes outrunning delivery expectations.',
    mood: 'tense'
  },
  the_diplomat: {
    archetype: 'the_diplomat',
    title: 'The Diplomat',
    summary: 'You navigated conflicting stakeholder demands with grace and compromise.',
    mood: 'calm'
  },
  budget_hawk: {
    archetype: 'budget_hawk',
    title: 'Budget Hawk',
    summary: 'You kept costs under control, sometimes at the expense of team comfort.',
    mood: 'tense'
  },
  the_pragmatist: {
    archetype: 'the_pragmatist',
    title: 'The Pragmatist',
    summary: 'You made practical tradeoffs that kept the project moving forward.',
    mood: 'calm'
  },
  the_visionary: {
    archetype: 'the_visionary',
    title: 'The Visionary',
    summary: 'You pushed for ambitious long-term improvements despite short-term costs.',
    mood: 'victorious'
  },
  burnout_machine: {
    archetype: 'burnout_machine',
    title: 'Burnout Machine',
    summary: 'You pushed through at an unsustainable pace, wearing the team thin.',
    mood: 'tense'
  }
}
