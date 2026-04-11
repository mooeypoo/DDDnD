import type { Meta, StoryObj } from '@storybook/vue3'
import TurnResolutionPanel from '@/ui/components/turn/turn_resolution_panel.vue'
import type { TurnResolutionContext } from '@/domains/simulation/model'

const mockResolution: TurnResolutionContext = {
  turn_number: 4,
  resolved_aftershocks: [
    {
      effect_instance_id: 'eff-001',
      effect_id: 'technical_debt_spike',
      effect_version: 1,
      source_type: 'card',
      source_id: 'define_bounded_context',
      source_version: 1,
      score_changes: [
        { score_id: 'maintainability', delta: -8 },
        { score_id: 'delivery_confidence', delta: -4 },
      ],
      stakeholder_changes: [],
      presentation: {
        title: 'Technical Debt Surfaces',
        summary: 'Shortcuts taken in a previous sprint have manifested as integration failures across three services.',
      },
    },
  ],
  selected_action: { id: 'introduce_anti_corruption_layer', version: 1 },
  action_resolution: {
    selected_action: { id: 'introduce_anti_corruption_layer', version: 1 },
    score_changes: [
      { score_id: 'domain_clarity', delta: 12 },
      { score_id: 'maintainability', delta: 6 },
    ],
    stakeholder_changes: [{ stakeholder_id: 'lead_engineer', delta: 8 }],
    queued_delayed_effects: [],
    presentation: {
      title: 'Anti-Corruption Layer Established',
      summary: 'A translation boundary now isolates the legacy billing domain from the new order system. Coupling reduced significantly.',
    },
  },
  event_resolution: {
    selected_event: { id: 'surprise_growth', version: 1 },
    score_changes: [
      { score_id: 'user_trust', delta: 5 },
      { score_id: 'budget', delta: -6 },
    ],
    stakeholder_changes: [{ stakeholder_id: 'vp_product', delta: 4 }],
    queued_delayed_effects: [],
    presentation: {
      title: 'Organic Traffic Surge',
      summary: 'Unexpected marketing success sends traffic 3× above projections. Architecture holds — barely.',
    },
  },
  stakeholder_resolution: {
    reactions: [
      {
        stakeholder_id: 'lead_engineer',
        applied_rule_refs: [],
        score_changes: [],
        stakeholder_changes: [],
        presentation: {
          title: 'Lead Engineer',
          summary: 'Finally — a proper boundary. This is the kind of architectural thinking the team has been pushing for.',
        },
      },
      {
        stakeholder_id: 'vp_product',
        applied_rule_refs: [],
        score_changes: [],
        stakeholder_changes: [],
        presentation: {
          title: 'VP Product',
          summary: 'Glad the traffic handled itself, but we need to talk about the budget overrun before next sprint.',
        },
      },
    ],
    presentation: { title: 'Stakeholder Reactions', summary: '' },
  },
  total_score_changes: [
    { score_id: 'domain_clarity', delta: 12 },
    { score_id: 'maintainability', delta: -2 },
    { score_id: 'delivery_confidence', delta: -4 },
    { score_id: 'user_trust', delta: 5 },
    { score_id: 'budget', delta: -6 },
  ],
  total_stakeholder_changes: [
    { stakeholder_id: 'lead_engineer', delta: 8 },
    { stakeholder_id: 'vp_product', delta: 4 },
  ],
}

const meta: Meta<typeof TurnResolutionPanel> = {
  title: 'Game/TurnResolutionPanel',
  component: TurnResolutionPanel,
  tags: ['autodocs'],
  args: {
    turnResolution: mockResolution,
    stakeholderNames: {
      lead_engineer: 'Lead Engineer',
      vp_product: 'VP Product',
    },
  },
  parameters: {
    layout: 'padded',
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const WithAftershocks: Story = {}

export const ActionOnly: Story = {
  args: {
    turnResolution: {
      ...mockResolution,
      turn_number: 1,
      resolved_aftershocks: [],
      event_resolution: null,
      stakeholder_resolution: {
        reactions: [],
        presentation: { title: '', summary: '' },
      },
    },
  },
}

export const FullTurn: Story = {
  args: {
    turnResolution: mockResolution,
  },
}
