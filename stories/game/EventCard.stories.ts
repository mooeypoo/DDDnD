import type { Meta, StoryObj } from '@storybook/vue3'

import EventCard from '@/ui/components/events/event_card.vue'
import { eventMocks } from '../mocks/events'

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
