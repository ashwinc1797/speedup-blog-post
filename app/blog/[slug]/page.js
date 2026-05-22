'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

// Custom MDX components to fix heading hierarchy
const components = {
  h1: ({ children }) => (
    <h2 style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 800, fontSize: 22,
      textTransform: 'uppercase', letterSpacing: '0.3px',
      color: '#fff', margin: '28px 0 10px',
      borderLeft: '3px solid #D92B2B', paddingLeft: 12,
    }}>{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 800, fontSize: 20,
      textTransform: 'uppercase', letterSpacing: '0.3px',
      color: '#fff', margin: '24px 0 10px',
      borderLeft: '3px solid #D92B2B', paddingLeft: 12,
    }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '18px 0 7px' }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ marginBottom: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.75)' }}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong style={{ color: '#fff', fontWeight: 700 }}>{children}</strong>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '8px 0 14px 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>{children}</ul>
  ),
  li: ({ children }) => (
    <li style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>{children}</li>
  ),
  a: ({ children, href }) => (
    <a href={href} style={{ color: '#D92B2B' }}>{children}</a>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt} style={{ maxWidth: '100%', margin: '16px 0', display: 'block', border: '1px solid rgba(255,255,255,0.07)' }} loading="lazy" />
  ),
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: '3px solid #D92B2B', paddingLeft: 14, margin: '16px 0', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{children}</blockquote>
  ),
}

export default function BlogPost() {
  const params = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/post/${params.slug}`)
        if (!res.ok) throw new Error('Post not found')
        const data = await res.json()
        setPost(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [params.slug])

  if (loading) return (
    <div style={{ maxWidth: 780, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>Loading...</div>
    </div>
  )

  if (error || !post) return (
    <div style={{ maxWidth: 780, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, textTransform: 'uppercase', color: '#D92B2B', marginBottom: 8 }}>Post Not Found</div>
      <a href="/blog" style={{ color: '#888', fontSize: 13 }}>← Back to Blog</a>
    </div>
  )

  return (
    <main>
      {/* Hero Image */}
      {post.heroImage && (
        <div style={{ width: '100%', height: 420, overflow: 'hidden', background: '#111' }}>
          <img
            src={post.heroImage}
            alt={post.heroImageAlt || post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="eager"
          />
        </div>
      )}

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 48, paddingTop: 40 }}>

          {/* ARTICLE */}
          <article>
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#D92B2B', border: '1px solid rgba(217,43,43,0.3)', padding: '2px 8px',
              }}>{post.category || 'IT Careers'}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#444' }}>{post.date}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#444' }}>{post.readTime}</span>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px',
              }}>SEO Optimised</span>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 'clamp(26px,4vw,42px)',
              textTransform: 'uppercase', letterSpacing: '-0.5px',
              lineHeight: 1.1, marginBottom: 18, color: '#fff',
            }}>{post.title}</h1>

            {/* Description */}
            {post.description && (
              <p style={{
                fontSize: 16, color: '#888', lineHeight: 1.7, marginBottom: 28,
                borderLeft: '3px solid #D92B2B', paddingLeft: 14, fontWeight: 300,
              }}>{post.description}</p>
            )}

            {/* Render content as plain HTML safely */}
            <div
              style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.75)' }}
              className="article-body"
              dangerouslySetInnerHTML={{ __html: post.htmlContent }}
            />

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div style={{ marginTop: 36, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '3px 9px', border: '1px solid rgba(255,255,255,0.1)', color: '#555',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{
              marginTop: 48, background: '#000',
              border: '1px solid rgba(217,43,43,0.25)',
              padding: '28px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 22,
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
              }}>
                Ready to Start Your <span style={{ color: '#D92B2B' }}>IT Career</span> in Pune?
              </div>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                Book a free demo class at SpeedUp Infotech — Shivaji Nagar, Pune
              </p>
              <a href="/contact" style={{
                background: '#D92B2B', color: '#fff', padding: '12px 28px',
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                display: 'inline-block',
              }}>Book Free Demo Class →</a>
            </div>
          </article>

          {/* SIDEBAR */}
          <aside style={{ paddingTop: 4 }}>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', padding: 16, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 12 }}>Post Info</div>
              {[
                ['Author', post.author || 'SpeedUp Infotech'],
                ['Published', post.date],
                ['Read time', post.readTime],
                ['Category', post.category],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                  <span style={{ color: '#555' }}>{l}</span>
                  <span style={{ color: '#888', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Back link */}
            <a href="/blog" style={{
              display: 'block', padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.07)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#555', textAlign: 'center',
            }}>← Back to Blog</a>
          </aside>
        </div>
      </div>
    </main>
  )
}
