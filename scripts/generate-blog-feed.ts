import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface BlogPost {
  title: string
  link: string
  pub_date: string | null
  category_labels: string[]
  excerpt: string
}

const DEFAULT_FEED_URL = 'https://blog.moriel.tech/rss.xml'
const DEFAULT_CATEGORY = 'DDDnD'
const DEFAULT_LIMIT = 5

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const outputDir = path.resolve(projectRoot, 'docs-site/public/data')

function parseArgs(argv: string[]) {
  const args = argv.slice(2)
  const opts: Record<string, string> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--url' && args[i + 1]) {
      opts.url = args[++i]
    } else if (arg === '--category' && args[i + 1]) {
      opts.category = args[++i]
    } else if (arg === '--limit' && args[i + 1]) {
      opts.limit = args[++i]
    }
  }

  return opts
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTag(itemXml: string, tagName: string): string | null {
  const match = itemXml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'))
  if (!match) {
    return null
  }
  return decodeXml(match[1]).trim()
}

function extractCategories(itemXml: string): string[] {
  const categories: string[] = []
  const regex = /<category[^>]*>([\s\S]*?)<\/category>/gi

  let match: RegExpExecArray | null
  while ((match = regex.exec(itemXml)) !== null) {
    const value = decodeXml(match[1]).trim()
    if (value.length > 0) {
      categories.push(value)
    }
  }

  return categories
}

function parseItems(xml: string): string[] {
  const items: string[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi

  let match: RegExpExecArray | null
  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(match[1])
  }

  return items
}

function parsePubDate(value: string | null): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

async function loadPosts(feedUrl: string, categoryFilter: string, limit: number): Promise<BlogPost[]> {
  const response = await fetch(feedUrl)
  if (!response.ok) {
    throw new Error(`Feed request failed (${response.status} ${response.statusText})`)
  }

  const xml = await response.text()
  const categoryNormalized = categoryFilter.toLowerCase()

  const posts = parseItems(xml)
    .map((itemXml) => {
      const title = extractTag(itemXml, 'title')
      const link = extractTag(itemXml, 'link')
      const pubDate = parsePubDate(extractTag(itemXml, 'pubDate'))
      const description = extractTag(itemXml, 'description')
      const categories = extractCategories(itemXml)

      return {
        title: title ?? '',
        link: link ?? '',
        pub_date: pubDate,
        category_labels: categories,
        excerpt: stripHtml(description ?? '').slice(0, 220),
      }
    })
    .filter((post) => post.title.length > 0 && post.link.length > 0)
    .filter((post) => post.category_labels.some((category) => category.toLowerCase() === categoryNormalized))
    .sort((a, b) => {
      const aTime = a.pub_date ? Date.parse(a.pub_date) : 0
      const bTime = b.pub_date ? Date.parse(b.pub_date) : 0
      return bTime - aTime
    })
    .slice(0, limit)

  return posts
}

async function main() {
  const opts = parseArgs(process.argv)

  const feedUrl = opts.url ?? process.env.BLOG_FEED_URL ?? DEFAULT_FEED_URL
  const category = opts.category ?? process.env.BLOG_CATEGORY ?? DEFAULT_CATEGORY
  const limit = Number(opts.limit ?? process.env.BLOG_LIMIT ?? DEFAULT_LIMIT)

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('--limit (or BLOG_LIMIT) must be a positive integer')
  }

  let posts: BlogPost[] = []
  let fetch_error: string | null = null

  try {
    posts = await loadPosts(feedUrl, category, limit)
  } catch (error) {
    fetch_error = error instanceof Error ? error.message : String(error)
    console.warn(`Warning: failed to fetch blog feed (${fetch_error}). Continuing with empty post list.`)
  }

  const output = {
    meta: {
      generated_at: new Date().toISOString(),
      generator: 'scripts/generate-blog-feed.ts',
      source_url: feedUrl,
      category_filter: category,
      limit,
      post_count: posts.length,
      fetch_error,
      commit_sha: process.env.COMMIT_SHA ?? null,
    },
    posts,
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(path.join(outputDir, 'blog-feed.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`Wrote ${path.join(outputDir, 'blog-feed.json')} (${posts.length} posts)`)
}

main().catch((error) => {
  console.error('Failed to generate blog feed:', error)
  process.exit(1)
})
