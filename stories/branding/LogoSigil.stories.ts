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

export const AllSizes: Story = {
  render: () => ({
    components: { LogoSigil },
    template: `
      <div style="display: flex; gap: 48px; align-items: center;">
        <div style="text-align: center;">
          <LogoSigil size="small" />
          <div style="margin-top: 8px; color: #94a3b8; font-size: 12px;">Small</div>
        </div>
        <div style="text-align: center;">
          <LogoSigil size="medium" />
          <div style="margin-top: 8px; color: #94a3b8; font-size: 12px;">Medium</div>
        </div>
        <div style="text-align: center;">
          <LogoSigil size="large" />
          <div style="margin-top: 8px; color: #94a3b8; font-size: 12px;">Large</div>
        </div>
      </div>
    `
  })
}
