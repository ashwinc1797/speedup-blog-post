'use client'

// ── Real SpeedUp Infotech Trainer Profiles ────────────────────
const AUTHOR_PROFILES = {
  'Ashwin Chaudhari': {
    initials:   'AC',
    color:      '#D92B2B',
    title:      'Data Science & AI Trainer',
    company:    'SpeedUp Infotech Pune',
    specialty:  'Data Science, AI & Machine Learning',
    tags:       ['AI & ML', 'Deep Learning', 'Python'],
  },
  'Chetna Vasave': {
    initials:   'CV',
    color:      '#2B7DD9',
    title:      'Data Analytics Trainer',
    company:    'SpeedUp Infotech Pune',
    specialty:  'Data Analytics, Power BI & SQL',
    tags:       ['Power BI', 'SQL', 'Excel', 'Python'],
  },
  'Pratik Sabale': {
    initials:   'PS',
    color:      '#2BD97D',
    title:      'Full Stack Trainer',
    company:    'SpeedUp Infotech Pune',
    specialty:  'Full Stack Development, MERN Stack & Python',
    tags:       ['MERN Stack', 'Node.js', 'Python', 'MongoDB'],
  },
  'Rutvij Mahamuni': {
    initials:   'RM',
    color:      '#D9882B',
    title:      'Frontend Development Trainer',
    company:    'SpeedUp Infotech Pune',
    specialty:  'React JS, Next.js & Frontend Development',
    tags:       ['React JS', 'Next.js', 'JavaScript', 'UI/UX'],
  },
  'Sameer': {
    initials:   'SM',
    color:      '#8B2BD9',
    title:      'Cloud Computing Trainer',
    company:    'SpeedUp Infotech Pune',
    specialty:  'Cloud Computing, AWS, Azure & DevOps',
    tags:       ['AWS', 'Azure', 'DevOps', 'Docker'],
  },
}

export default function AuthorBox({ author, authorBio }) {
  const profile = AUTHOR_PROFILES[author] || {
    initials:  (author || 'SI').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    color:     '#D92B2B',
    title:     'IT Trainer',
    company:   'SpeedUp Infotech Pune',
    specialty: 'IT Training & Career Guidance',
    tags:      ['IT Training', 'Pune'],
  }

  return (
    <div style={{
      marginTop: 40,
      marginBottom: 8,
      background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
      border: `1px solid ${profile.color}33`,
      borderLeft: `4px solid ${profile.color}`,
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: '50%',
        background: `${profile.color}08`, pointerEvents: 'none',
      }} />

      {/* Label */}
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: '#444',
        marginBottom: 16,
      }}>
        About the Author
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>

        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `linear-gradient(135deg, ${profile.color}CC, ${profile.color}44)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: 22, color: '#fff',
          flexShrink: 0,
          border: `2px solid ${profile.color}44`,
          letterSpacing: '1px',
          boxShadow: `0 0 20px ${profile.color}22`,
        }}>
          {profile.initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>

          {/* Name + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 20,
              textTransform: 'uppercase', letterSpacing: '0.5px',
              color: '#fff',
            }}>
              {author || 'SpeedUp Infotech'}
            </span>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: profile.color,
              border: `1px solid ${profile.color}44`,
              padding: '2px 8px', whiteSpace: 'nowrap',
            }}>
              {profile.title}
            </span>
          </div>

          {/* Institute */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: '#555', marginBottom: 10,
          }}>
            📍 {profile.company} · Shivaji Nagar, FC Road, Pune
          </div>

          {/* Bio */}
          {authorBio && (
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.65, margin: '0 0 14px',
            }}>
              {authorBio}
            </p>
          )}

          {/* Skill tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(profile.tags || []).map(tag => (
              <span key={tag} style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', padding: '3px 10px',
                background: `${profile.color}12`, color: profile.color,
                border: `1px solid ${profile.color}30`,
              }}>
                {tag}
              </span>
            ))}
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', padding: '3px 10px',
              background: '#ffffff08', color: '#444',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              ✅ 500+ Students Trained
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA strip */}
      <div style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11, color: '#444',
          letterSpacing: '0.05em',
        }}>
          🎓 Learn <strong style={{ color: '#666' }}>{profile.specialty}</strong> at SpeedUp Infotech Pune
        </span>
        <a
          href="tel:+918904581086"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: profile.color,
            textDecoration: 'none',
            border: `1px solid ${profile.color}33`,
            padding: '5px 14px',
            transition: 'background 0.2s',
          }}
        >
          Book Free Demo →
        </a>
      </div>
    </div>
  )
}
