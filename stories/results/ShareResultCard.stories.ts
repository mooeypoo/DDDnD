import type { Meta, StoryObj } from '@storybook/vue3'

import ShareResultCard from '@/ui/components/results/share_result_card.vue'
import type { SharePayload } from '@/domains/reporting/services/share_payload'

// ─── Shared fixtures ──────────────────────────────────────────

const basePayload: SharePayload = {
  v: 1,
  sid: 'the_monolith_of_mild_despair',
  sv: 1,
  cls: 'boundary_mage',
  name: 'Archibald',
  tier: 'success',
  arch: 'boundary_builder',
  tid: 'triumph',
  tc: 8,
  mt: 8,
  avg: 72,
  scores: {
    domain_clarity: 82,
    maintainability: 68,
    delivery_confidence: 55,
    team_morale: 78,
    user_trust: 70,
    budget: 62
  },
  cr: 'max_turns_reached'
}

const meta: Meta<typeof ShareResultCard> = {
  title: 'Results/ShareResultCard',
  component: ShareResultCard,
  tags: ['autodocs'],
  args: {
    payload: basePayload
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0b0e1a' }]
    }
  }
}

export default meta

type Story = StoryObj<typeof meta>

// ─── Tier variants ────────────────────────────────────────────

export const Triumph: Story = {
  args: {
    payload: { ...basePayload, tid: 'triumph', tier: 'success', arch: 'boundary_builder', avg: 82 }
  }
}

export const Success: Story = {
  args: {
    payload: { ...basePayload, tid: 'success', tier: 'success', arch: 'system_stabilizer', avg: 65 }
  }
}

export const Survival: Story = {
  args: {
    payload: { ...basePayload, tid: 'survival', tier: 'partial_success', arch: 'stakeholder_whisperer', avg: 52 }
  }
}

export const Struggle: Story = {
  args: {
    payload: { ...basePayload, tid: 'struggle', tier: 'partial_success', arch: 'firefighter', avg: 38 }
  }
}

export const Collapse: Story = {
  args: {
    payload: {
      ...basePayload,
      tid: 'collapse',
      tier: 'failure',
      arch: 'runaway_refactorer',
      avg: 18,
      cr: 'failure_condition_met',
      tc: 5,
      scores: {
        domain_clarity: 30,
        maintainability: 12,
        delivery_confidence: 8,
        team_morale: 22,
        user_trust: 15,
        budget: 5
      }
    }
  }
}

// ─── Class variants ───────────────────────────────────────────

export const StakeholderBard: Story = {
  name: 'Class — Stakeholder Bard',
  args: {
    payload: { ...basePayload, cls: 'stakeholder_bard', arch: 'stakeholder_whisperer' }
  }
}

export const ReliabilityCleric: Story = {
  name: 'Class — Reliability Cleric',
  args: {
    payload: { ...basePayload, cls: 'reliability_cleric', arch: 'system_stabilizer' }
  }
}

// ─── Edge cases ───────────────────────────────────────────────

export const NoCharacterName: Story = {
  name: 'No Character Name',
  args: {
    payload: { ...basePayload, name: undefined }
  }
}

export const NullTierId: Story = {
  name: 'Null Tier ID (fallback to tier)',
  args: {
    payload: { ...basePayload, tid: null }
  }
}

export const LongName: Story = {
  name: 'Long Character Name',
  args: {
    payload: { ...basePayload, name: 'Sir Reginald von Überarchitekt III' }
  }
}
