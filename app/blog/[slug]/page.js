'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import SeoHead from './seo-head.js'

export default function BlogPost() {
  const params   = useParams()
  const [post, setPost]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/post/${params.slug}`)
        if (!res.ok) throw new Error('Post not found')
        const data = await res.json()
        setPost(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.slug])

  if (loading) return (
    <div style={{ maxWidth: 780, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555' }}>
        Loading...
      </div>
    </div>
  )

  if (error || !post) return (
    <div style={{ maxWidth: 780, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, textTransform: 'uppercase', color: '#D92B2B', marginBottom: 8 }}>
        Post Not Found
      </div>
      <a href="/blog" style={{ color: '#888', fontSize: 13 }}>← Back to Blog</a>
    </div>
  )

  return (
    <main>
      {/* Inject SEO meta tags + JSON-LD schema */}
      <SeoHead post={post} />

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

          {/* ── ARTICLE ──────────────────────────────────── */}
          <article>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: '#555' }}>
              <a href="/" style={{ color: '#555' }}>Home</a>
              <span>›</span>
              <a href="/blog" style={{ color: '#555' }}>Blog</a>
              <span>›</span>
              <span style={{ color: '#888' }}>{post.title?.slice(0, 40)}...</span>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#D92B2B', border: '1px solid rgba(217,43,43,0.3)', padding: '2px 8px',
              }}>{post.category || 'IT Careers'}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#444' }}>{post.date}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#444' }}>{post.readTime}</span>

            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Barlow Condensed',sans-serif",
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

            {/* Article body */}
            <div
              className="article-body"
              style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.75)' }}
              dangerouslySetInnerHTML={{ __html: post.htmlContent }}
            />

            {/* Internal links section */}
            <div style={{
              marginTop: 40, padding: '20px',
              background: '#111', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 12 }}>
                Related Courses at SpeedUp Infotech
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  ['MERN Stack Course', '/mern-stack-course-pune'],
                  ['Full Stack Course', '/full-stack-developer-course-pune'],
                  ['Data Analytics Course', '/data-analytics-course-pune'],
                  ['Python Full Stack', '/python-full-stack-course-pune'],
                  ['AI & ML Course', '/ai-course-pune'],
                  ['React JS Course', '/react-js-course-pune'],
                ].map(([name, href]) => (
                  <a key={name} href={href} style={{
                    display: 'block', padding: '8px 10px',
                    background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.07)',
                    fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11,
                    fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: '#D92B2B', textDecoration: 'none',
                  }}>{name} →</a>
                ))}
              </div>
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>
                  Tags
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '3px 9px', border: '1px solid rgba(255,255,255,0.1)', color: '#555',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{
              marginTop: 40, background: '#000',
              border: '1px solid rgba(217,43,43,0.25)', padding: '28px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22,
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
              }}>
                Ready to Start Your <span style={{ color: '#D92B2B' }}>IT Career</span> in Pune?
              </div>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                Book a free demo class at SpeedUp Infotech — Shivaji Nagar, FC Road, Pune
              </p>
              <a href="tel:+918904581086" style={{
                background: '#D92B2B', color: '#fff', padding: '12px 28px',
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                display: 'inline-block', marginRight: 10,
              }}>
                📞 Call Now
              </a>
              <a href="/contact" style={{
                color: '#fff', padding: '12px 28px',
                border: '1px solid rgba(255,255,255,0.2)',
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                display: 'inline-block',
              }}>
                Book Free Demo →
              </a>
            </div>
          </article>

          {/* ── SIDEBAR ──────────────────────────────────── */}
          <aside style={{ paddingTop: 4 }}>

            {/* Post info */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', padding: 16, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 12 }}>
                Post Info
              </div>
              {[
                ['Author', post.author || 'SpeedUp Infotech'],
                ['Published', post.date],
                ['Read time', post.readTime],
                ['Category', post.category],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                  <span style={{ color: '#555' }}>{l}</span>
                  <span style={{ color: '#888', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Keywords */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', padding: 16, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>
                Keywords Covered
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(post.keywords || []).slice(0, 5).map(kw => (
                  <div key={kw} style={{ fontSize: 11, color: '#D92B2B', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600 }}>
                    # {kw}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA box */}
            <div style={{ background: '#D92B2B', padding: 16, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Free Demo Class
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 14, lineHeight: 1.5 }}>
                SpeedUp Infotech<br/>Shivaji Nagar, Pune
              </div>
              <a href="tel:+918904581086" style={{
                display: 'block', background: '#000', color: '#fff',
                padding: '9px', fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 700, fontSize: 12, letterSpacing: '0.08em',
                textTransform: 'uppercase', textDecoration: 'none',
              }}>
                +91 89045 81086
              </a>
            </div>

            {/* Back link */}
            <a href="/blog" style={{
              display: 'block', marginTop: 10, padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.07)',
              fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#555', textAlign: 'center',
            }}>← Back to Blog</a>
          </aside>
        </div>
      </div>
    </main>
  )
}
