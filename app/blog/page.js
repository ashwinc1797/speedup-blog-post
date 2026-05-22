import { getAllPosts } from '../../lib/blog.js'

export const metadata = {
  title: 'IT Career Blog | SpeedUp Infotech Pune',
  description: 'Latest articles on IT careers, MERN Stack, Data Analytics, Python and courses in Pune. Updated 3 times a week automatically.',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main style={{ maxWidth: 1160, margin: '0 auto', padding: '48px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 3, height: 20, background: '#D92B2B', flexShrink: 0 }} />
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 36, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            IT Career Blog
          </h1>
        </div>
        <p style={{ fontSize: 15, color: '#666', maxWidth: 560, lineHeight: 1.6 }}>
          Guides, career advice and course comparisons for IT students in Pune.
          Auto-published 3 times per week by AI.
        </p>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['All Posts', 'MERN Stack', 'Full Stack', 'Data Analytics', 'Career', 'Salary'].map(tag => (
            <span key={tag} style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '4px 12px',
              border: '1px solid',
              borderColor: tag === 'All Posts' ? '#D92B2B' : 'rgba(255,255,255,0.12)',
              color: tag === 'All Posts' ? '#fff' : '#666',
              background: tag === 'All Posts' ? '#D92B2B' : 'transparent',
              cursor: 'pointer',
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {posts.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 48, height: 48,
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555', marginBottom: 8 }}>
            No Posts Yet
          </div>
          <p style={{ fontSize: 14, color: '#444', maxWidth: 320, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Run the automation to generate your first blog post.
          </p>
          <code style={{
            background: '#111', border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 16px', fontSize: 13, color: '#D92B2B',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            node scripts/test-run.js
          </code>
        </div>
      )}

      {/* Post grid */}
      {posts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.06)',
        }}>
          {posts.map(post => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{
                textDecoration: 'none', color: 'inherit',
                background: '#0A0A0A', display: 'block',
              }}
            >
              {/* Hero image */}
              <div style={{ width: '100%', height: 200, overflow: 'hidden', background: '#111', position: 'relative' }}>
                {post.heroImage ? (
                  <img
                    src={post.heroImage}
                    alt={post.heroImageAlt || post.title}
                    width={600}
                    height={200}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#111',
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#D92B2B',
                  }}>
                    {post.category}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#444' }}>
                    {post.date}
                  </span>
                </div>

                <h2 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800, fontSize: 17,
                  textTransform: 'uppercase', letterSpacing: '0.2px',
                  marginBottom: 10, lineHeight: 1.25, color: '#fff',
                }}>
                  {post.title}
                </h2>

                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, marginBottom: 16 }}>
                  {post.description?.slice(0, 110)}
                  {post.description?.length > 110 ? '...' : ''}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: '#D92B2B',
                  }}>
                    Read Article →
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#444' }}>
                    {post.readTime}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
