import type { Meta, StoryObj } from '@storybook/vue3'

import ScenarioBanner from '@/ui/components/scenario/scenario_banner.vue'
import { SCENE_ASSETS } from '@/ui/config/presentation_asset_registry'
import { scenarioMocks } from '../mocks/scenarios'

const scenarioHeroUrl = SCENE_ASSETS.scenario.default_run_scene

const meta: Meta<typeof ScenarioBanner> = {
  title: 'Game/ScenarioBanner',
  component: ScenarioBanner,
  tags: ['autodocs'],
  args: {
    title: scenarioMocks.legacyMonolithStabilization.title,
    shortDescription: scenarioMocks.legacyMonolithStabilization.shortDescription,
    description: scenarioMocks.legacyMonolithStabilization.description,
    currentTurn: scenarioMocks.legacyMonolithStabilization.currentTurn,
    maxTurns: scenarioMocks.legacyMonolithStabilization.maxTurns
  },
  parameters: {
    layout: 'padded'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const LegacyMonolith: Story = {}

export const StartupScalingCrisis: Story = {
  args: {
    title: scenarioMocks.startupScalingCrisis.title,
    shortDescription: scenarioMocks.startupScalingCrisis.shortDescription,
    description: scenarioMocks.startupScalingCrisis.description,
    currentTurn: scenarioMocks.startupScalingCrisis.currentTurn,
    maxTurns: scenarioMocks.startupScalingCrisis.maxTurns
  }
}

export const ComplianceHeavyPlatform: Story = {
  args: {
    title: scenarioMocks.complianceHeavyPlatform.title,
    shortDescription: scenarioMocks.complianceHeavyPlatform.shortDescription,
    description: scenarioMocks.complianceHeavyPlatform.description,
    currentTurn: scenarioMocks.complianceHeavyPlatform.currentTurn,
    maxTurns: scenarioMocks.complianceHeavyPlatform.maxTurns
  }
}

// ─── Artwork integration stories ────────────────────────────────────────────

export const LegacyMonolithWithHero: Story = {
  name: 'Legacy Monolith — With Hero Image',
  args: {
    title: scenarioMocks.legacyMonolithStabilization.title,
    shortDescription: scenarioMocks.legacyMonolithStabilization.shortDescription,
    description: scenarioMocks.legacyMonolithStabilization.description,
    currentTurn: scenarioMocks.legacyMonolithStabilization.currentTurn,
    maxTurns: scenarioMocks.legacyMonolithStabilization.maxTurns,
    heroUrl: scenarioHeroUrl
  }
}

export const StartupScalingCrisisWithHero: Story = {
  name: 'Startup Scaling Crisis — With Hero Image',
  args: {
    title: scenarioMocks.startupScalingCrisis.title,
    shortDescription: scenarioMocks.startupScalingCrisis.shortDescription,
    description: scenarioMocks.startupScalingCrisis.description,
    currentTurn: scenarioMocks.startupScalingCrisis.currentTurn,
    maxTurns: scenarioMocks.startupScalingCrisis.maxTurns,
    heroUrl: scenarioHeroUrl
  }
}
