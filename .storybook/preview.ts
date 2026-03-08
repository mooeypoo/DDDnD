import type { Preview } from '@storybook/vue3'

import '../src/ui/styles/design-system.css'
import '../stories/foundations/storybook-preview.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'DM Console',
      values: [
        { name: 'DM Console',  value: '#0b0e1a' },
        { name: 'Panel',       value: '#141b2d' },
        { name: 'Card',        value: '#192031' },
        { name: 'Light Check', value: '#f0f0f0' }
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
