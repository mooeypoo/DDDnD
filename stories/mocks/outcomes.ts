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
  }
}
