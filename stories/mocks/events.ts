import type { Event } from '@/domains/content/model'

const makeRef = (id: string, version = 1) => ({ id, version })

export const eventMocks: Record<string, Event> = {
  productionIncident: {
    id: 'production_incident',
    version: 1,
    name: 'Production Incident',
    description: 'An outage in a critical integration path halts key customer workflows.',
    flavor_text: 'Status page updates become your team’s primary communication channel.',
    score_changes: [
      { score_id: 'user_trust', delta: -10 },
      { score_id: 'delivery_confidence', delta: -6 }
    ],
    stakeholder_changes: [{ stakeholder_id: 'support_team', delta: -7 }],
    delayed_effect_refs: [],
    occurrence_weight: 3
  },
  stakeholderPanic: {
    id: 'stakeholder_panic',
    version: 1,
    name: 'Stakeholder Panic',
    description: 'Leadership requests daily updates and immediate guarantees.',
    score_changes: [
      { score_id: 'team_morale', delta: -5 },
      { score_id: 'delivery_confidence', delta: -3 }
    ],
    stakeholder_changes: [{ stakeholder_id: 'leadership_team', delta: -8 }],
    delayed_effect_refs: [],
    occurrence_weight: 2
  },
  auditPressure: {
    id: 'audit_pressure',
    version: 1,
    name: 'Audit Pressure',
    description: 'Auditors demand traceability evidence for architecture changes.',
    score_changes: [
      { score_id: 'budget', delta: -4 },
      { score_id: 'domain_clarity', delta: 2 }
    ],
    delayed_effect_refs: [makeRef('documentation_helps_onboarding')],
    occurrence_weight: 2
  },
  surpriseGrowth: {
    id: 'surprise_growth',
    version: 1,
    name: 'Surprise Growth',
    description: 'A new customer segment arrives faster than operational planning.',
    score_changes: [
      { score_id: 'budget', delta: 6 },
      { score_id: 'delivery_confidence', delta: -4 },
      { score_id: 'maintainability', delta: -2 }
    ],
    delayed_effect_refs: [makeRef('integration_complexity_emerges')],
    occurrence_weight: 2
  },
  burnoutWarning: {
    id: 'team_burnout_warning',
    version: 1,
    name: 'Team Burnout Warning',
    description: 'Sustained on-call pressure starts degrading focus and retention.',
    score_changes: [
      { score_id: 'team_morale', delta: -9 },
      { score_id: 'delivery_confidence', delta: -2 }
    ],
    stakeholder_changes: [{ stakeholder_id: 'lead_engineer', delta: -5 }],
    delayed_effect_refs: [],
    occurrence_weight: 1
  }
}
