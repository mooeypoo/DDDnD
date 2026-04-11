import { setup } from '@storybook/vue3'
import type { Preview } from '@storybook/vue3'
import { createRouter, createMemoryHistory } from 'vue-router'

import '../src/ui/styles/design-system.css'
import '../src/ui/prototypes/dungeon/dungeon-design-tokens.css'
import '../stories/foundations/storybook-preview.css'

// Install a stub router so view-level stories using useRoute/useRouter
// don't crash. Stories that need specific route state can push to it.
setup((app) => {
  app.use(
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/',      component: { template: '<div />' } },
        { path: '/play',  component: { template: '<div />' } },
        { path: '/end',   component: { template: '<div />' } },
      ],
    })
  )
})

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
