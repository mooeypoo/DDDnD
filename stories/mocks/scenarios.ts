export interface ScenarioBannerMock {
  id: string
  title: string
  shortDescription: string
  description: string
  currentTurn: number
  maxTurns: number
}

export const scenarioMocks: Record<string, ScenarioBannerMock> = {
  legacyMonolithStabilization: {
    id: 'legacy-monolith-stabilization',
    title: 'Monolith of Mild Despair',
    shortDescription: 'A legacy platform groans under unclear boundaries and anxious stakeholders.',
    description:
      'A decade of rapid delivery fused every concern into one giant codebase. You must restore clarity and trust while still shipping critical features.',
    currentTurn: 3,
    maxTurns: 12
  },
  startupScalingCrisis: {
    id: 'startup-scaling-crisis',
    title: 'Rocketship Runtime Panic',
    shortDescription: 'Sudden growth exposes brittle architecture and overloaded teams.',
    description:
      'Traffic has spiked, incidents are climbing, and everyone wants miracles by Friday. Stabilize the system without freezing product momentum.',
    currentTurn: 6,
    maxTurns: 10
  },
  complianceHeavyPlatform: {
    id: 'compliance-heavy-platform',
    title: 'Audit Citadel',
    shortDescription: 'Regulatory pressure now competes with delivery speed and morale.',
    description:
      'A new compliance program introduces strict controls and frequent external review. You need traceability, safety, and enough throughput to keep the business moving.',
    currentTurn: 2,
    maxTurns: 14
  }
}
