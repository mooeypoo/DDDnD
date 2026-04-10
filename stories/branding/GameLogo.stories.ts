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
      default: 'dungeon',
      values: [
        { name: 'dungeon', value: '#0d0904' },
        { name: 'panel',   value: '#0b1c24' },
        { name: 'masthead', value: '#0d0904' },
        { name: 'light',   value: '#f5f5f5' },
      ]
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
  render: () => ({
    components: { GameLogo },
    template: `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #0c0a05 0%, #100d07 50%, #141009 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <GameLogo size="large" />
      </div>
    `
  })
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
      <div style="display: flex; flex-direction: column; gap: 48px; padding: 32px;">
        <div>
          <GameLogo size="small" />
          <div style="margin-top: 12px; color: #7a6c44; font-size: 12px;">Small — masthead</div>
        </div>
        <div>
          <GameLogo size="medium" />
          <div style="margin-top: 12px; color: #7a6c44; font-size: 12px;">Medium — default</div>
        </div>
        <div>
          <GameLogo size="large" />
          <div style="margin-top: 12px; color: #7a6c44; font-size: 12px;">Large — welcome page</div>
        </div>
      </div>
    `
  })
}
