import { defineConfig } from 'vitepress'
import path from 'path'

const projectRoot = path.resolve(__dirname, '../..')

export default defineConfig({
  lang: 'en-US',
  title: 'DDDnD',
  description: 'Companion documentation for DDDnD: player help and game-design notes for the online card adventure.',
  base: '/DDDnD/',
  appearance: 'dark',

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
      blurb: 'Software engineer passionate about human-centric development and the quiet superpowers of localization — building tools that are fun, thoughtful, and work for everyone.',
    },

    nav: [
      { text: 'Player help', link: '/guide/gameplay' },
      { text: 'Game design', link: '/dashboard/' },
      { text: 'Play', link: 'https://dddnd.app' },
      { text: 'GitHub', link: 'https://github.com/mooeypoo/DDDnD' },
    ],

    sidebar: {
      '/guide/': [
        { text: 'Player help', items: [
          { text: 'The table', link: '/guide/gameplay' },
          { text: 'How to think', link: '/guide/strategy' },
        ] },
        { text: 'For authors', items: [
          { text: 'Content authoring', link: '/guide/content-authoring' },
          { text: 'Reading the audit', link: '/guide/reading-the-audit' },
        ] },
      ],
      '/dashboard/': [
        {
          text: 'Game design',
          items: [
            { text: 'What is the audit?', link: '/dashboard/audit-intro' },
            { text: 'Audit overview', link: '/dashboard/' },
          ],
        },
        {
          text: 'Content in play',
          items: [
            { text: 'What is the catalog?', link: '/dashboard/content-catalog-intro' },
            { text: 'Adventures', link: '/dashboard/scenarios' },
            { text: 'Cards', link: '/dashboard/cards' },
            { text: 'Aftershocks', link: '/dashboard/delayed-effects' },
            { text: 'Stakeholders', link: '/dashboard/stakeholders' },
            { text: 'Events', link: '/dashboard/events' },
          ],
        }
      ],
    },

    footer: {
      message: 'Made with care by Moriel Schottlender.',
      copyright: 'GPL-3.0-only © 2024-present Moriel Schottlender',
    },
  },
})
