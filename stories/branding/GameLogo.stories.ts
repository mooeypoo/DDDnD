import type { Meta, StoryObj } from '@storybook/vue3'

import GameLogo from '@/ui/components/branding/game_logo.vue'

const meta: Meta<typeof GameLogo> = {
  title: 'Branding/GameLogo',
  component: GameLogo,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large']
    }
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark'
    }
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    size: 'small'
  }
}

export const Medium: Story = {
  args: {
    size: 'medium'
  }
}

export const Large: Story = {
  args: {
    size: 'large'
  }
}

export const OnWelcomePage: Story = {
  name: 'On Welcome Page (Large)',
  args: {
    size: 'large'
  },
  parameters: {
    backgrounds: {
      default: 'gradient'
    }
  }
}

export const InMasthead: Story = {
  name: 'In Masthead (Small)',
  args: {
    size: 'small'
  }
}

export const AllSizes: Story = {
  render: () => ({
    components: { GameLogo },
    template: `
      <div style="display: flex; flex-direction: column; gap: 48px; padding: 24px;">
        <div>
          <GameLogo size="small" />
          <div style="margin-top: 12px; color: #94a3b8; font-size: 12px;">Small (Masthead)</div>
        </div>
        <div>
          <GameLogo size="medium" />
          <div style="margin-top: 12px; color: #94a3b8; font-size: 12px;">Medium</div>
        </div>
        <div>
          <GameLogo size="large" />
          <div style="margin-top: 12px; color: #94a3b8; font-size: 12px;">Large (Welcome Page)</div>
        </div>
      </div>
    `
  })
}
