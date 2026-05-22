import { getAllPosts } from '../lib/blog.js'

export default function HomePage() {
  const posts = getAllPosts().slice(0, 3)

  return (
    <main>
      {/* HERO */}
      <section style={{
        maxWidth: 1160, margin: '0 auto', padding: '80px 24px 72px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(217,43,43,0.1)', border: '1px solid rgba(217,43,43,0.25)',
          padding: '5px 14px', marginBottom: 22,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D92B2B', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D92B2B' }}>
            New Batch Starting Soon
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 'clamp(36px,5vw,72px)',
          letterSpacing: '-1px', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 20,
        }}>
          Best IT Training<br />
          <span style={{ color: '#D92B2B' }}>Institute</span> in Pune
        </h1>
        <p style={{ fontSize: 18, color: '#888', lineHeight: 1.7, maxWidth: 540, marginBottom: 36, fontWeight: 300 }}>
          MERN Stack · Full Stack · Data Analytics · AI & ML — Real projects, industry trainers, 100% placement support near FC Road, Shivaji Nagar.
        </p>
        <div style={{ display: 'flex', gap: 14 }}>
          <a href="/contact" style={{
            background: '#D92B2B', color: '#fff', padding: '13px 28px',
            fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14,
            letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
          }}>Book Free Demo Class</a>
          <a href="/blog" style={{
            color: '#fff', padding: '13px 28px', border: '1px solid rgba(255,255,255,0.15)',
            fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 14,
            letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
          }}>Read Our Blog</a>
        </div>
      </section>

      {/* STATS */}
      <div style={{
        background: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 0',
      }}>
        <div style={{
          maxWidth: 1160, margin: '0 auto', padding: '0 24px',
          display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0,
        }}>
          {[
            ['500+', 'Students Placed'],
            ['4.8★', 'Justdial Rating'],
            ['423+', 'Verified Reviews'],
            ['100%', 'Placement Support'],
            ['₹0', 'Blog Cost / Month'],
          ].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center', padding: '16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 28, color: '#D92B2B', letterSpacing: -1 }}>{v}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2, letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LATEST BLOG POSTS */}
      {posts.length > 0 && (
        <section style={{ maxWidth: 1160, margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 3, height: 20, background: '#D92B2B' }} />
            <h2 style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Latest From The Blog
            </h2>
            <a href="/blog" style={{
              marginLeft: 'auto', fontFamily: "'Barlow Condensed'", fontWeight: 700,
              fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#D92B2B', textDecoration: 'none', borderBottom: '1px solid rgba(217,43,43,0.4)',
            }}>View All Posts →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
            {posts.map(post => (
              <a key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit', background: '#0A0A0A', display: 'block' }}>
                {post.heroImage && (
                  <img
                    src={post.heroImage} alt={post.heroImageAlt}
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', filter: 'grayscale(15%)' }}
                  />
                )}
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: 11, color: '#D92B2B', fontFamily: "'Barlow Condensed'", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                    {post.category} · {post.readTime}
                  </div>
                  <h3 style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 18, letterSpacing: '0.2px', textTransform: 'uppercase', marginBottom: 10, lineHeight: 1.25 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, marginBottom: 14 }}>
                    {post.description?.slice(0, 100)}{post.description?.length > 100 ? '...' : ''}
                  </p>
                  <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D92B2B' }}>
                    Read Article →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* COURSES */}
      <section style={{ background: '#000', padding: '64px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 3, height: 20, background: '#D92B2B' }} />
            <h2 style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Courses We Offer
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
            {[
              { name: 'MERN Stack', duration: '4–6 Months', badge: 'Most Popular' },
              { name: 'Full Stack Dev', duration: '5–6 Months', badge: '' },
              { name: 'Python Full Stack', duration: '5–6 Months', badge: '' },
              { name: 'Data Analytics', duration: '4–5 Months', badge: 'Trending' },
              { name: 'AI & ML', duration: '5–6 Months', badge: 'Trending' },
              { name: 'React JS', duration: '3 Months', badge: '' },
            ].map(c => (
              <div key={c.name} style={{ background: '#0A0A0A', padding: '20px', cursor: 'pointer' }}>
                {c.badge && (
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D92B2B', border: '1px solid rgba(217,43,43,0.3)', padding: '2px 7px', display: 'inline-block', marginBottom: 10 }}>
                    {c.badge}
                  </div>
                )}
                <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 5 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{c.duration} · 100% Placement</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </main>
  )
}
