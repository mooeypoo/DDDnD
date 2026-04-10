import type { Meta, StoryObj } from '@storybook/vue3'

import GameMasthead from '@/ui/components/branding/game_masthead.vue'

const meta: Meta<typeof GameMasthead> = {
  title: 'Branding/GameMasthead',
  component: GameMasthead,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dungeon',
      values: [
        { name: 'dungeon', value: '#0d0904' },
        { name: 'panel',   value: '#0b1c24' },
        { name: 'light',   value: '#f5f5f5' },
      ]
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
      <div style="min-height: 100vh; background: #0c0a05;">
        <GameMasthead
          @show-rules="() => console.log('Show rules')"
          @show-about="() => console.log('Show about')"
          @show-dungeon-master="() => console.log('Show dungeon master')"
          @reset-run="() => console.log('Reset run!')"
        />
        <div style="padding: 24px; color: #7a6c44; font-size: 14px;">
          Game content appears below the masthead…
        </div>
      </div>
    `
  })
}

export const InGameChrome: Story = {
  name: 'In Game Chrome',
  render: () => ({
    components: { GameMasthead },
    template: `
      <div style="min-height: 100vh; background: #0c0a05; display: flex; flex-direction: column;">
        <GameMasthead
          @show-rules="() => {}"
          @show-about="() => {}"
          @show-dungeon-master="() => {}"
          @reset-run="() => {}"
        />
        <!-- Simulated game-shell chrome below the masthead -->
        <div style="
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 320px;
          grid-template-rows: 1fr auto;
          gap: 0;
          overflow: hidden;
        ">
          <!-- Main play area -->
          <div style="
            background: linear-gradient(180deg, #0c0a05 0%, #100d07 100%);
            border-right: 1px solid rgba(168,120,32,0.18);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          ">
            <div style="color: #5c7078; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;">Active Scenario</div>
            <div style="
              background: #0b1c24;
              border: 1px solid rgba(168,120,32,0.22);
              border-radius: 4px;
              padding: 20px;
              color: #d4b860;
              font-size: 13px;
            ">Scenario card area</div>
            <div style="color: #5c7078; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 8px;">Available Actions</div>
            <div style="display: flex; gap: 12px;">
              <div v-for="n in 3" :key="n" style="
                background: #0b1c24;
                border: 1px solid rgba(168,120,32,0.18);
                border-radius: 3px;
                padding: 16px 20px;
                color: #7a6c44;
                font-size: 12px;
                flex: 1;
              ">Action card {{ n }}</div>
            </div>
          </div>
          <!-- Satchel / sidebar -->
          <div style="
            background: #08171e;
            border-left: 1px solid rgba(168,120,32,0.18);
            padding: 20px;
          ">
            <div style="color: #5c7078; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px;">Satchel</div>
            <div v-for="n in 4" :key="n" style="
              background: rgba(14,34,50,0.6);
              border: 1px solid rgba(168,120,32,0.12);
              border-radius: 3px;
              padding: 10px 12px;
              color: #7a6c44;
              font-size: 11px;
              margin-bottom: 8px;
            ">Card item {{ n }}</div>
          </div>
        </div>
        <!-- Status bar -->
        <div style="
          background: #0d0904;
          border-top: 1px solid rgba(168,120,32,0.18);
          padding: 10px 24px;
          display: flex;
          gap: 32px;
        ">
          <div v-for="metric in ['Maintainability','Delivery','Morale','Trust']" :key="metric" style="">
            <div style="color: #5c7078; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;">{{ metric }}</div>
            <div style="color: #d4b860; font-size: 13px; margin-top: 2px;">72</div>
          </div>
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
      <div style="min-height: 100vh; background: #0c0a05;">
        <GameMasthead
          @show-rules="handleShowRules"
          @show-about="handleShowAbout"
          @show-dungeon-master="handleShowDungeonMaster"
          @reset-run="handleResetRun"
        />
        <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
          <div style="background: rgba(14,34,50,0.8); border: 1px solid rgba(168,120,32,0.35); border-radius: 4px; padding: 20px; margin-bottom: 16px;">
            <h2 style="color: #d4b860; margin: 0 0 12px 0; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase;">Try the Masthead Controls</h2>
            <p style="color: #7a6c44; margin: 0; font-size: 13px; line-height: 1.6;">
              Click Rules, About, Dungeon Master, or Reset Run.
              Reset Run shows a confirmation modal before emitting the event.
            </p>
          </div>
          <div v-if="lastAction" style="background: rgba(200,152,36,0.08); border: 1px solid rgba(200,152,36,0.35); border-radius: 4px; padding: 16px;">
            <div style="color: #c89824; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;">Last Action</div>
            <div style="color: #d4b860;">{{ lastAction }}</div>
          </div>
        </div>
      </div>
    `,
    data() {
      return { lastAction: '' }
    },
    methods: {
      handleShowRules(this: any)        { this.lastAction = 'Rules modal opened' },
      handleShowAbout(this: any)        { this.lastAction = 'About modal opened' },
      handleShowDungeonMaster(this: any){ this.lastAction = 'Dungeon Master panel opened' },
      handleResetRun(this: any)         { this.lastAction = 'Reset run confirmed — run is over!' }
    }
  })
}
