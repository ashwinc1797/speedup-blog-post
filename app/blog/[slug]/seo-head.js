'use client'

import { useEffect } from 'react'

export default function SeoHead({ post }) {
  useEffect(() => {
    if (!post) return

    // ── TITLE ──────────────────────────────────────────────
    document.title = `${post.title} | SpeedUp Infotech`

    // ── META TAGS ──────────────────────────────────────────
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el) }
      el.content = content
    }
    const setOg = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
      el.content = content
    }
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`)
      if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el) }
      el.href = href
    }

    // Basic meta
    setMeta('description', post.description || '')
    setMeta('keywords', (post.keywords || []).join(', '))
    setMeta('author', post.author || 'SpeedUp Infotech')
    setMeta('robots', 'index, follow')

    // Canonical
    setLink('canonical', post.canonical || `https://speedupinfotech.com/blog/${post.slug}`)

    // Open Graph
    setOg('og:title', post.title)
    setOg('og:description', post.description || '')
    setOg('og:type', 'article')
    setOg('og:url', post.canonical || `https://speedupinfotech.com/blog/${post.slug}`)
    setOg('og:site_name', 'SpeedUp Infotech')
    setOg('og:locale', 'en_IN')
    if (post.heroImage) setOg('og:image', post.heroImage)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', post.title)
    setMeta('twitter:description', post.description || '')
    if (post.heroImage) setMeta('twitter:image', post.heroImage)

    // ── JSON-LD SCHEMA ─────────────────────────────────────
    // Remove old schema if exists
    const oldSchema = document.getElementById('seo-schema')
    if (oldSchema) oldSchema.remove()

    // Build FAQ schema from content
    const faqMatches = []
    const faqRegex = /\*\*Q[:\.]?\s*(.+?)\*\*[\s\S]*?\*\*A[:\.]?\s*(.+?)\*\*/g
    const h3Regex = /### (.+?)\n([\s\S]+?)(?=###|##|$)/g
    let match

    // Try to extract FAQs from content
    if (post.htmlContent) {
      const qRegex = /<h3[^>]*>([^<]+)<\/h3>\s*<p[^>]*>([^<]+)<\/p>/g
      while ((match = qRegex.exec(post.htmlContent)) !== null && faqMatches.length < 6) {
        const q = match[1].trim()
        const a = match[2].trim()
        if (q && a && (q.includes('?') || q.toLowerCase().startsWith('what') || q.toLowerCase().startsWith('how') || q.toLowerCase().startsWith('is') || q.toLowerCase().startsWith('can'))) {
          faqMatches.push({ q, a })
        }
      }
    }

    const schemas = []

    // Article Schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description || '',
      datePublished: post.date,
      dateModified: post.date,
      author: {
        '@type': 'Organization',
        name: 'SpeedUp Infotech',
        url: 'https://speedupinfotech.com',
      },
      publisher: {
        '@type': 'Organization',
        name: 'SpeedUp Infotech',
        logo: {
          '@type': 'ImageObject',
          url: 'https://speedupinfotech.com/logo.png',
        },
      },
      image: post.heroImage || '',
      url: post.canonical || `https://speedupinfotech.com/blog/${post.slug}`,
      keywords: (post.keywords || []).join(', '),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': post.canonical || `https://speedupinfotech.com/blog/${post.slug}`,
      },
    })

    // FAQPage Schema
    if (faqMatches.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqMatches.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      })
    }

    // BreadcrumbList Schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://speedupinfotech.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://speedupinfotech.com/blog' },
        { '@type': 'ListItem', position: 3, name: post.title, item: post.canonical },
      ],
    })

    // Inject all schemas
    const script = document.createElement('script')
    script.id = 'seo-schema'
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schemas)
    document.head.appendChild(script)

  }, [post])

  return null
}
