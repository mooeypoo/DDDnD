import type { Meta, StoryObj } from '@storybook/vue3'

import SceneAvatarPreviewWorkbench from '@/ui/components/preview/scene_avatar_preview_workbench.vue'

const meta: Meta<typeof SceneAvatarPreviewWorkbench> = {
  title: 'Game/SceneAvatarPreviewWorkbench',
  component: SceneAvatarPreviewWorkbench,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
