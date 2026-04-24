import { defineConfig } from 'vitepress'
import path from 'path'

const projectRoot = path.resolve(__dirname, '../..')

export default defineConfig({
  lang: 'en-US',
  title: 'DDDnD — Technical Dashboard',
  description: 'Audit reports, scenario catalog, and balance metrics for Domain-Driven Design Card Game',

  root: path.join(projectRoot, 'docs-site'),
  outDir: path.join(projectRoot, 'docs-site/.vitepress/dist'),

  vite: {
    resolve: {
      alias: {
        '@tokens': path.resolve(projectRoot, 'src/ui/tokens'),
      },
    },
  },

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500&display=swap',
      },
    ],
  ],

  themeConfig: {
    author: {
      name: 'Moriel Schottlender',
      github: 'https://github.com/mooeypoo',
      website: 'https://moriel.tech',
      blog: 'https://blog.moriel.tech',
      blurb: 'The blog covers the design thinking, architecture decisions, and ongoing development of DDDnD.',
    },

    nav: [
      { text: 'Dashboard', link: '/dashboard/' },
      { text: 'Guide', link: '/guide/gameplay' },
      { text: 'Play the Game', link: 'https://dddnd.games' },
      { text: 'GitHub', link: 'https://github.com/mooeypoo/DDDnD' },
    ],

    sidebar: {
      '/guide/': [
        { text: 'Playing the Game', items: [
          { text: 'Gameplay', link: '/guide/gameplay' },
          { text: 'Strategy', link: '/guide/strategy' },
        ] },
        { text: 'Development', items: [
          { text: 'Content Authoring', link: '/guide/content-authoring' },
          { text: 'Reading the Audit', link: '/guide/reading-the-audit' },
        ] },
      ],
      '/dashboard/': [
        { text: 'Audit Overview', link: '/dashboard/' },
        { text: 'Scenarios', link: '/dashboard/scenarios' },
        { text: 'Metrics', link: '/dashboard/metrics' },
      ],
    },

    footer: {
      message: 'Made with care by Moriel Schottlender.',
      copyright: 'GPL-3.0-only © 2024-present Moriel Schottlender',
    },
  },
})
