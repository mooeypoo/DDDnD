import type { Preview } from '@storybook/vue3'

import '../src/ui/styles/design-system.css'
import '../stories/foundations/storybook-preview.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'DM Console',
      values: [
        { name: 'DM Console', value: 'linear-gradient(135deg, #0f0c29 0%, #16213e 50%, #1a1a2e 100%)' },
        { name: 'Surface', value: '#16213e' },
        { name: 'Night', value: '#0f0c29' }
      ]
    },
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  decorators: [
    () => ({
      template: '<div class="storybook-stage"><story /></div>'
    })
  ]
}

export default preview
