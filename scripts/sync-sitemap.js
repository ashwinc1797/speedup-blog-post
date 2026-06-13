// ============================================================
//  SpeedUp Infotech — Sitemap Sync Script
//  Reads every MDX/MD file in content/blog/ and rebuilds
//  public/sitemap.xml from scratch.
//
//  Usage:
//    npm run blog:sitemap              # rebuild sitemap
//    npm run blog:sitemap -- --dry-run # preview without writing
//
//  Features:
//    - Reads frontmatter (gray-matter) for accurate lastmod dates
//    - Falls back to today's date for posts without a valid date
//    - Sorts blog posts newest-first
//    - Category-aware changefreq / priority
//    - Validates URLs and escapes XML entities
//    - Dry-run mode (prints XML to stdout, no file write)
//    - Detailed console summary after every run
// ============================================================

import fs   from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const BLOG_DIR  = path.join(ROOT, 'content', 'blog')
const SITEMAP   = path.join(ROOT, 'public', 'sitemap.xml')
const SITE      = 'https://speedupinfotech.com'

const DRY_RUN   = process.argv.includes('--dry-run')

// ── Helpers ──────────────────────────────────────────────────

/** Escape XML special characters */
function escapeXml(value) {
  return String(value)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;')
}

/** Return the date string if it looks like a valid ISO date, otherwise null */
function validDate(raw) {
  if (!raw) return null
  const d = new Date(raw)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

/** Today's date in YYYY-MM-DD */
const TODAY = new Date().toISOString().split('T')[0]

// ── Category config ──────────────────────────────────────────

const CATEGORY_META = {
  'trending-ai':  { changefreq: 'weekly',  priority: '0.85' },
  'career':       { changefreq: 'monthly', priority: '0.80' },
  'comparison':   { changefreq: 'monthly', priority: '0.75' },
  'beginner':     { changefreq: 'monthly', priority: '0.70' },
  'technical':    { changefreq: 'monthly', priority: '0.70' },
  _default:       { changefreq: 'monthly', priority: '0.70' },
}

function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META._default
}

// ── Static pages ─────────────────────────────────────────────

const STATIC_PAGES = [
  { loc: `${SITE}/`,      lastmod: TODAY, changefreq: 'weekly',  priority: '1.00' },
  { loc: `${SITE}/blog`,  lastmod: TODAY, changefreq: 'daily',   priority: '0.90' },
]

// ── Read posts ───────────────────────────────────────────────

function readPosts() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.warn(`  ⚠️  Blog directory not found: ${BLOG_DIR}`)
    return []
  }

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))

  const posts = []
  const warnings = []

  for (const file of files) {
    const slug    = file.replace(/\.(mdx|md)$/, '')
    const absPath = path.join(BLOG_DIR, file)
    let raw

    try {
      raw = fs.readFileSync(absPath, 'utf8')
    } catch (err) {
      warnings.push(`Could not read ${file}: ${err.message}`)
      continue
    }

    let data = {}
    try {
      ;({ data } = matter(raw))
    } catch (err) {
      warnings.push(`Frontmatter parse error in ${file}: ${err.message}`)
    }

    const lastmod  = validDate(data.lastUpdated) || validDate(data.date) || TODAY
    const category = data.category
      ? data.category.toLowerCase().replace(/\s+/g, '-')
      : '_default'

    if (!validDate(data.lastUpdated) && !validDate(data.date)) {
      warnings.push(`No valid date in ${file} — using today (${TODAY})`)
    }

    posts.push({ slug, lastmod, category, title: data.title || slug })
  }

  // Sort newest-first
  posts.sort((a, b) => b.lastmod.localeCompare(a.lastmod))

  return { posts, warnings }
}

// ── Build sitemap XML ─────────────────────────────────────────

function buildSitemap(posts) {
  const urlEntries = [
    ...STATIC_PAGES,
    ...posts.map(post => {
      const meta = categoryMeta(post.category)
      return {
        loc:        `${SITE}/blog/${post.slug}`,
        lastmod:    post.lastmod,
        changefreq: meta.changefreq,
        priority:   meta.priority,
      }
    }),
  ]

  const body = urlEntries
    .map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${body}
</urlset>
`
}

// ── Main ─────────────────────────────────────────────────────

;(function main() {
  console.log('\n════════════════════════════════════════════════')
  console.log('  SpeedUp Infotech — Sitemap Sync')
  console.log(`  ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`)
  console.log('════════════════════════════════════════════════\n')

  const { posts, warnings } = readPosts()

  if (warnings.length) {
    console.log('  Warnings:')
    for (const w of warnings) console.log(`  ⚠️  ${w}`)
    console.log()
  }

  const xml = buildSitemap(posts)

  if (DRY_RUN) {
    console.log('  🔍 DRY RUN — sitemap.xml not written\n')
    console.log(xml)
  } else {
    const dir = path.dirname(SITEMAP)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(SITEMAP, xml, 'utf8')
    console.log(`  ✓ Written: ${path.relative(ROOT, SITEMAP)}`)
  }

  console.log(`  ✓ Static pages : ${STATIC_PAGES.length}`)
  console.log(`  ✓ Blog posts   : ${posts.length}`)
  console.log(`  ✓ Total URLs   : ${STATIC_PAGES.length + posts.length}`)

  if (posts.length > 0) {
    console.log(`\n  Newest : ${posts[0].lastmod}  /blog/${posts[0].slug}`)
    console.log(`  Oldest : ${posts[posts.length - 1].lastmod}  /blog/${posts[posts.length - 1].slug}`)
  }

  console.log('\n  ✅ Done\n')
})()
