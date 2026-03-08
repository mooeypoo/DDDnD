import type { Meta, StoryObj } from '@storybook/vue3'

import GameMasthead from '@/ui/components/branding/game_masthead.vue'

const meta: Meta<typeof GameMasthead> = {
  title: 'Branding/GameMasthead',
  component: GameMasthead,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark'
    }
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithContext: Story = {
  name: 'In Game Context',
  render: () => ({
    components: { GameMasthead },
    template: `
      <div style="min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);">
        <GameMasthead 
          @show-rules="() => console.log('Show rules')"
          @show-about="() => console.log('Show about')"
        />
        <div style="padding: 24px; color: #94a3b8;">
          <p>Game content would appear below the masthead...</p>
        </div>
      </div>
    `
  })
}

export const MobileView: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

export const TabletView: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
}

export const InteractionDemo: Story = {
  name: 'Interactive Demo',
  render: () => ({
    components: { GameMasthead },
    template: `
      <div style="min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);">
        <GameMasthead 
          @show-rules="handleShowRules"
          @show-about="handleShowAbout"
        />
        <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
          <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <h2 style="color: #a989fa; margin: 0 0 12px 0;">Try the Masthead Controls</h2>
            <p style="color: #94a3b8; margin: 0;">
              Click the Rules, About, or Reset Run buttons to see console logs. 
              Reset Run shows a confirmation modal before emitting the reset event.
            </p>
          </div>
          <div v-if="lastAction" style="background: rgba(169, 137, 250, 0.1); border: 1px solid #a989fa; border-radius: 8px; padding: 16px;">
            <div style="color: #a989fa; font-weight: 600; margin-bottom: 4px;">Last Action:</div>
            <div style="color: #cbd5e1;">{{ lastAction }}</div>
          </div>
        </div>
      </div>
    `,
    data() {
      return {
        lastAction: ''
      }
    },
    methods: {
      handleShowRules() {
        this.lastAction = 'Rules modal opened'
        console.log('Show rules')
      },
      handleShowAbout() {
        this.lastAction = 'About modal opened'
        console.log('Show about')
      }
    },
    mounted() {
      window.addEventListener('reset-run', () => {
        this.lastAction = 'Reset run confirmed!'
        console.log('Reset run event fired')
      })
    }
  })
}
