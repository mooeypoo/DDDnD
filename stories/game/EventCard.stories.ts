import type { Meta, StoryObj } from '@storybook/vue3'

import EventCard from '@/ui/components/events/event_card.vue'
import { eventMocks } from '../mocks/events'

import systemIncidentUrl from '@/assets/artwork/events/system_incident.svg?url'
import auditPressureUrl from '@/assets/artwork/events/audit_pressure.svg?url'
import scalingCrisisUrl from '@/assets/artwork/events/scaling_crisis.svg?url'

const meta: Meta<typeof EventCard> = {
  title: 'Game/EventCard',
  component: EventCard,
  tags: ['autodocs'],
  args: {
    title: eventMocks.productionIncident.name,
    description: eventMocks.productionIncident.description,
    severity: 'high',
    highlights: ['User trust -10', 'Delivery confidence -6', 'Support team satisfaction -7']
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const ProductionIncident: Story = {}

export const AuditPressure: Story = {
  args: {
    title: eventMocks.auditPressure.name,
    description: eventMocks.auditPressure.description,
    severity: 'medium',
    highlights: ['Budget -4', 'Domain clarity +2', 'Documentation aftershock scheduled']
  }
}

export const BurnoutWarning: Story = {
  args: {
    title: eventMocks.burnoutWarning.name,
    description: eventMocks.burnoutWarning.description,
    severity: 'critical',
    highlights: ['Developer morale -9', 'Leadership concern rising']
  }
}

export const SurpriseGrowth: Story = {
  name: 'Surprise Growth (Low Severity)',
  args: {
    title: eventMocks.surpriseGrowth.name,
    description: eventMocks.surpriseGrowth.description,
    severity: 'low',
    highlights: ['Budget +6', 'Delivery confidence -4', 'Aftershock: integration complexity']
  }
}

// ─── Artwork integration stories ────────────────────────────────────────────

export const SystemIncidentWithIllustration: Story = {
  name: 'System Incident — With Illustration',
  args: {
    title: eventMocks.productionIncident.name,
    description: eventMocks.productionIncident.description,
    severity: 'high',
    highlights: ['User trust -10', 'Delivery confidence -6', 'Support team satisfaction -7'],
    illustrationUrl: systemIncidentUrl
  }
}

export const AuditPressureWithIllustration: Story = {
  name: 'Audit Pressure — With Illustration',
  args: {
    title: eventMocks.auditPressure.name,
    description: eventMocks.auditPressure.description,
    severity: 'medium',
    highlights: ['Budget -4', 'Domain clarity +2', 'Documentation aftershock scheduled'],
    illustrationUrl: auditPressureUrl
  }
}

export const ScalingCrisisWithIllustration: Story = {
  name: 'Scaling Crisis — With Illustration',
  args: {
    title: eventMocks.surpriseGrowth.name,
    description: eventMocks.surpriseGrowth.description,
    severity: 'critical',
    highlights: ['Traffic overload detected', 'Service B at capacity', 'Emergency scaling required'],
    illustrationUrl: scalingCrisisUrl
  }
}
