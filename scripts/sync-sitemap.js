import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')
const SITEMAP = path.join(ROOT, 'public', 'sitemap.xml')
const SITE = 'https://speedupinfotech.com'

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function readPosts() {
  if (!fs.existsSync(BLOG_DIR)) return []

  return fs
    .readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
    .map(file => {
      const slug = file.replace(/\.(mdx|md)$/, '')
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
      const { data } = matter(raw)
      return {
        slug,
        date: data.lastUpdated || data.date || new Date().toISOString().split('T')[0],
      }
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

function buildSitemap(posts) {
  const today = new Date().toISOString().split('T')[0]
  const urls = [
    {
      loc: `${SITE}/`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      loc: `${SITE}/blog`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.9',
    },
    ...posts.map(post => ({
      loc: `${SITE}/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ]

  const body = urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${escapeXml(url.lastmod)}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

const posts = readPosts()
if (!fs.existsSync(path.dirname(SITEMAP))) fs.mkdirSync(path.dirname(SITEMAP), { recursive: true })
fs.writeFileSync(SITEMAP, buildSitemap(posts), 'utf8')
console.log(`Sitemap synced with ${posts.length} blog posts.`)
