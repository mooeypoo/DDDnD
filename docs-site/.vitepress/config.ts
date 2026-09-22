import { defineConfig } from 'vitepress'
import path from 'path'

const projectRoot = path.resolve(__dirname, '../..')

const docsUrl = 'https://mooeypoo.github.io/DDDnD/'
const ogImage = `${docsUrl}og-image.png`
const ogDescription =
  'Companion documentation for DDDnD: player help and game-design notes for the online card adventure.'

export default defineConfig({
  lang: 'en-US',
  title: 'DDDnD',
  description: ogDescription,
  base: '/DDDnD/',
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['meta', { name: 'theme-color', content: '#0c0a05' }],
    ['meta', { name: 'author', content: 'Moriel Schottlender' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'DDDnD Docs' }],
    ['meta', { property: 'og:title', content: 'DDDnD — Companion documentation' }],
    ['meta', { property: 'og:description', content: ogDescription }],
    ['meta', { property: 'og:url', content: docsUrl }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    [
      'meta',
      {
        property: 'og:image:alt',
        content: 'DDDnD companion documentation — player help and game design for Domain-Driven Design n’ Dragons.',
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'DDDnD — Companion documentation' }],
    ['meta', { name: 'twitter:description', content: ogDescription }],
    ['meta', { name: 'twitter:image', content: ogImage }],
    [
      'meta',
      {
        name: 'twitter:image:alt',
        content: 'DDDnD companion documentation — player help and game design for Domain-Driven Design n’ Dragons.',
      },
    ],
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

  root: path.join(projectRoot, 'docs-site'),
  outDir: path.join(projectRoot, 'docs-site/.vitepress/dist'),

  vite: {
    resolve: {
      alias: {
        '@tokens': path.resolve(projectRoot, 'src/ui/tokens'),
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',
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
