import type { Meta, StoryObj } from '@storybook/vue3'

import LogoSigil from '@/ui/components/branding/logo_sigil.vue'

const meta: Meta<typeof LogoSigil> = {
  title: 'Branding/LogoSigil',
  component: LogoSigil,
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

export const AllSizes: Story = {
  render: () => ({
    components: { LogoSigil },
    template: `
      <div style="display: flex; gap: 48px; align-items: center; padding: 32px;">
        <div style="text-align: center;">
          <LogoSigil size="small" />
          <div style="margin-top: 8px; color: #7a6c44; font-size: 12px;">Small (42px)</div>
        </div>
        <div style="text-align: center;">
          <LogoSigil size="medium" />
          <div style="margin-top: 12px; color: #7a6c44; font-size: 12px;">Medium (64px)</div>
        </div>
        <div style="text-align: center;">
          <LogoSigil size="large" />
          <div style="margin-top: 16px; color: #7a6c44; font-size: 12px;">Large (96px)</div>
        </div>
      </div>
    `
  })
}
