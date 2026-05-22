import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export function getAllPosts() {
  if (!fs.existsSync(BLOG_DIR)) return []

  return fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(filename => {
      const slug = filename.replace(/\.(mdx|md)$/, '')
      const raw  = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8')
      const { data: fm } = matter(raw)
      return {
        slug,
        title:        fm.title        || slug,
        description:  fm.description  || '',
        date:         fm.date         || '',
        category:     fm.category     || 'IT Careers',
        tags:         fm.tags         || [],
        keywords:     fm.keywords     || [],
        readTime:     fm.readTime     || '8 min read',
        author:       fm.author       || 'SpeedUp Infotech',
        canonical:    fm.canonical    || `https://speedupinfotech.com/blog/${slug}`,
        heroImage:    fm.heroImage    || null,
        heroImageAlt: fm.heroImageAlt || fm.title || slug,
      }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getPostBySlug(slug) {
  for (const ext of ['.mdx', '.md']) {
    const fp = path.join(BLOG_DIR, `${slug}${ext}`)
    if (!fs.existsSync(fp)) continue
    const raw = fs.readFileSync(fp, 'utf8')
    const { data: frontmatter, content } = matter(raw)
    return { slug, frontmatter, content }
  }
  return null
}

export function getRelatedPosts(currentSlug, limit = 3) {
  const current = getAllPosts().find(p => p.slug === currentSlug)
  if (!current) return []
  return getAllPosts()
    .filter(p => p.slug !== currentSlug)
    .map(p => ({
      ...p,
      score: p.tags.filter(t => current.tags.includes(t)).length
           + (p.category === current.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
