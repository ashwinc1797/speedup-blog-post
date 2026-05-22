import './globals.css'

export const metadata = {
  title: {
    default: 'SpeedUp Infotech — Best IT Training Institute in Pune',
    template: '%s | SpeedUp Infotech',
  },
  description: "SpeedUp Infotech is Pune's best IT training institute near FC Road & Shivaji Nagar. MERN Stack, Full Stack, Data Analytics, AI/ML with 100% placement support.",
  keywords: ['IT training Pune', 'MERN stack course Pune', 'best IT institute Pune', 'SpeedUp Infotech'],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}

function Nav() {
  return (
    <nav className="site-nav">
      <div className="nav-inner">
        <a href="/" className="nav-logo">
          <span className="logo-speed">SPEED</span>
          <span className="logo-d">
            <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
              <path d="M4 8L4 1M1.5 3.5L4 1L6.5 3.5" stroke="#D92B2B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="logo-up">UP</span>
          <span className="logo-sub">INFOTECH</span>
        </a>
        <div className="nav-links">
          <a href="/courses" className="nav-link">Courses</a>
          <a href="/placements" className="nav-link">Placements</a>
          <a href="/blog" className="nav-link">Blog</a>
          <a href="/about" className="nav-link">About</a>
          <a href="/contact" className="nav-link">Contact</a>
          <a href="/contact" className="nav-cta">Free Demo</a>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span className="footer-speed">SPEED</span>
              <span className="footer-up">UP</span>
              <span className="footer-infotech">INFOTECH</span>
            </div>
            <p className="footer-desc">
              Best IT training institute in Pune. MERN Stack, Full Stack, Data Analytics, AI & ML with 100% placement support. Near FC Road, Shivaji Nagar.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Courses</div>
            {['MERN Stack', 'Full Stack', 'Data Analytics', 'AI & ML', 'Python'].map(l => (
              <div key={l} className="footer-link">{l}</div>
            ))}
          </div>
          <div>
            <div className="footer-col-title">Institute</div>
            {['About Us', 'Placements', 'Blog', 'Contact'].map(l => (
              <div key={l} className="footer-link">{l}</div>
            ))}
          </div>
          <div>
            <div className="footer-col-title">Location</div>
            {['Shivaji Nagar', 'FC Road Pune', 'Deccan Pune', 'Online Classes'].map(l => (
              <div key={l} className="footer-link">{l}</div>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SpeedUp Infotech · Best IT Training Institute in Pune</span>
          <span className="footer-version">blog.automation.v1</span>
        </div>
      </div>
    </footer>
  )
}
