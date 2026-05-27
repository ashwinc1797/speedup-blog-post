import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import AuthorBox from '../../../components/AuthorBox.js'
import { getAllPosts, getPostBySlug } from '../../../lib/blog.js'

const SITE_URL = 'https://speedupinfotech.com'
const PHONE = '+918904581086'

function stripOpeningTitle(content) {
  return content.replace(/^# .+\r?\n+/, '')
}

function absoluteUrl(url) {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function normalizePost(rawPost) {
  const fm = rawPost.frontmatter
  return {
    slug: rawPost.slug,
    content: stripOpeningTitle(rawPost.content),
    title: fm.title || rawPost.slug,
    description: fm.description || '',
    date: fm.date || '',
    lastUpdated: fm.lastUpdated || fm.date || '',
    author: fm.author || 'SpeedUp Infotech',
    authorBio: fm.authorBio || '',
    category: fm.category || 'IT Careers',
    tags: fm.tags || [],
    keywords: fm.keywords || [],
    readTime: fm.readTime || '8 min read',
    heroImage: fm.heroImage || '',
    heroImageAlt: fm.heroImageAlt || fm.title || rawPost.slug,
    canonical: fm.canonical || `${SITE_URL}/blog/${rawPost.slug}`,
  }
}

function extractFaqs(content) {
  const faqs = []
  const patterns = [
    /\*\*Q:\s*(.+?)\*\*\s*\n+A:\s*([\s\S]+?)(?=\n+\*\*Q:|\n+##|$)/gi,
    /^Q:\s*(.+?)\s*\n+A:\s*([\s\S]+?)(?=\n+Q:|\n+##|$)/gim,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content)) !== null && faqs.length < 6) {
      const question = match[1].replace(/[*_`#]/g, '').trim()
      const answer = match[2]
        .replace(/!\[[^\]]*]\([^)]+\)/g, '')
        .replace(/[*_`#>\[\]()]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (question && answer) faqs.push({ question, answer })
    }
    if (faqs.length) break
  }

  return faqs
}

function buildSchemas(post, faqs) {
  const image = absoluteUrl(post.heroImage)
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.lastUpdated || post.date,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'SpeedUp Infotech',
        url: SITE_URL,
      },
      image,
      url: post.canonical,
      keywords: post.keywords.join(', '),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': post.canonical,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: post.canonical },
      ],
    },
  ]

  if (faqs.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    })
  }

  return schemas
}

function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

const mdxComponents = {
  h1: props => <h2 className="article-h2" {...props} />,
  h2: props => <h2 className="article-h2" {...props} />,
  h3: props => <h3 className="article-h3" {...props} />,
  p: props => <p className="article-p" {...props} />,
  ul: props => <ul className="article-list" {...props} />,
  ol: props => <ol className="article-list article-list-numbered" {...props} />,
  li: props => <li className="article-li" {...props} />,
  blockquote: props => <blockquote className="article-quote" {...props} />,
  strong: props => <strong className="article-strong" {...props} />,
  em: props => <em className="article-em" {...props} />,
  a: ({ href = '', ...props }) => {
    const external = href.startsWith('http://') || href.startsWith('https://')
    return (
      <a
        className="article-link"
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...props}
      />
    )
  },
  img: ({ src = '', alt = '' }) => (
    <img
      className="article-image"
      src={src}
      alt={alt}
      loading="lazy"
    />
  ),
  code: props => <code className="article-code" {...props} />,
  pre: props => <pre className="article-pre" {...props} />,
  table: props => <div className="article-table-wrap"><table className="article-table" {...props} /></div>,
}

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export function generateMetadata({ params }) {
  const rawPost = getPostBySlug(params.slug)
  if (!rawPost) return {}

  const post = normalizePost(rawPost)
  const image = absoluteUrl(post.heroImage)

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: {
      canonical: post.canonical,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: post.canonical,
      siteName: 'SpeedUp Infotech',
      locale: 'en_IN',
      publishedTime: post.date || undefined,
      modifiedTime: post.lastUpdated || undefined,
      authors: [post.author],
      images: image ? [{ url: image, alt: post.heroImageAlt }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: image ? [image] : [],
    },
  }
}

export default function BlogPost({ params }) {
  const rawPost = getPostBySlug(params.slug)
  if (!rawPost) notFound()

  const post = normalizePost(rawPost)
  const faqs = extractFaqs(post.content)
  const schemas = buildSchemas(post, faqs)

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }}
      />

      {post.heroImage && (
        <div className="blog-hero-image">
          <img
            src={post.heroImage}
            alt={post.heroImageAlt}
            loading="eager"
          />
        </div>
      )}

      <div className="blog-post-wrap">
        <div className="blog-post-grid">
          <article>
            <nav className="blog-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span>/</span>
              <a href="/blog">Blog</a>
              <span>/</span>
              <span>{post.title.slice(0, 44)}{post.title.length > 44 ? '...' : ''}</span>
            </nav>

            <div className="blog-meta-row">
              <span className="blog-category-pill">{post.category}</span>
              {post.date && <span>{post.date}</span>}
              <span>{post.readTime}</span>
            </div>

            <h1 className="blog-post-title">{post.title}</h1>

            {post.description && (
              <p className="blog-post-description">{post.description}</p>
            )}

            <div className="article-body">
              <MDXRemote
                source={post.content}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                  },
                }}
              />
            </div>

            <AuthorBox author={post.author} authorBio={post.authorBio} />

            <section className="related-courses" aria-labelledby="related-courses-title">
              <div id="related-courses-title" className="sidebar-title">
                Related Courses at SpeedUp Infotech
              </div>
              <div className="related-course-grid">
                {[
                  ['MERN Stack Course', '/mern-stack-course-pune'],
                  ['Full Stack Course', '/full-stack-developer-course-pune'],
                  ['Data Analytics Course', '/data-analytics-course-pune'],
                  ['Python Full Stack', '/python-full-stack-course-pune'],
                  ['AI and ML Course', '/ai-course-pune'],
                  ['React JS Course', '/react-js-course-pune'],
                ].map(([name, href]) => (
                  <a key={name} href={href}>{name}</a>
                ))}
              </div>
            </section>

            {post.tags.length > 0 && (
              <section className="blog-tags" aria-label="Tags">
                <div className="sidebar-title">Tags</div>
                <div>
                  {post.tags.map(tag => <span key={tag}>{tag}</span>)}
                </div>
              </section>
            )}

            <section className="article-cta">
              <h2>Ready to Start Your <span>IT Career</span> in Pune?</h2>
              <p>Book a free demo class at SpeedUp Infotech, Shivaji Nagar, FC Road, Pune.</p>
              <div>
                <a href={`tel:${PHONE}`} className="article-cta-primary">Call Now</a>
                <a href="/contact" className="article-cta-secondary">Book Free Demo</a>
              </div>
            </section>
          </article>

          <aside className="blog-sidebar">
            <section className="sidebar-card">
              <div className="sidebar-title">Post Info</div>
              {[
                ['Author', post.author],
                ['Published', post.date],
                ['Read time', post.readTime],
                ['Category', post.category],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="sidebar-row">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </section>

            {post.keywords.length > 0 && (
              <section className="sidebar-card">
                <div className="sidebar-title">Keywords Covered</div>
                <div className="keyword-list">
                  {post.keywords.slice(0, 6).map(keyword => (
                    <span key={keyword}># {keyword}</span>
                  ))}
                </div>
              </section>
            )}

            <section className="sidebar-demo">
              <div>Free Demo Class</div>
              <p>SpeedUp Infotech<br />Shivaji Nagar, Pune</p>
              <a href={`tel:${PHONE}`}>+91 89045 81086</a>
            </section>

            <a href="/blog" className="back-to-blog">Back to Blog</a>
          </aside>
        </div>
      </div>
    </main>
  )
}
