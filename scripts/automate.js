// ============================================================
//  SpeedUp Infotech — Full Blog Automation Engine
//  Auto keyword research + trending AI/tech topics
//  Images: Pexels (primary) → Unsplash → hardcoded fallback
//  AI: Groq Llama 3.3 70B
//  Runs: GitHub Actions Mon/Wed/Fri 6AM IST
// ============================================================

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const BLOG_DIR   = path.join(ROOT, 'content', 'blog')
const STATE_FILE = path.join(__dirname, '.state.json')

const SITE  = 'https://speedupinfotech.com'
const PHONE = '+91-8904581086'
const ADDR  = 'Shivaji Nagar, near FC Road, Pune'

// ── ROTATING AUTHOR PERSONAS ──────────────────────────────────
// Real SpeedUp Infotech trainers — rotates per blog post for E-E-A-T diversity
const AUTHORS = [
  {
    name:       'Ashwin Chaudhari',
    bio:        'Data Science & AI Trainer at SpeedUp Infotech Pune | Specialist in Machine Learning, Deep Learning & AI tools | Helping students land AI/ML roles in Pune',
    background: 'the AI & Data Science industry',
    specialty:  'Data Science, AI & Machine Learning',
  },
  {
    name:       'Chetna Vasave',
    bio:        'Data Analytics Trainer at SpeedUp Infotech Pune | Expert in Excel, Power BI, SQL & Python Analytics | Trained 200+ students in data-driven careers',
    background: 'the Data Analytics and Business Intelligence domain',
    specialty:  'Data Analytics, Power BI & SQL',
  },
  {
    name:       'Pratik Sabale',
    bio:        'Full Stack Development Trainer at SpeedUp Infotech Pune | Expert in MERN Stack, Node.js & Python Full Stack | Helping freshers build real-world projects',
    background: 'Full Stack software development',
    specialty:  'Full Stack Development, MERN Stack & Python',
  },
  {
    name:       'Rutvij Mahamuni',
    bio:        'Frontend Development Trainer at SpeedUp Infotech Pune | Specialist in React JS, Next.js & Modern UI Development | Passionate about building beautiful web apps',
    background: 'Frontend and UI/UX development',
    specialty:  'React JS, Next.js & Frontend Development',
  },
  {
    name:       'Sameer',
    bio:        'Cloud Computing Trainer at SpeedUp Infotech Pune | Expert in AWS, Azure & DevOps | Helping IT professionals transition into high-paying cloud roles in Pune',
    background: 'Cloud infrastructure and DevOps',
    specialty:  'Cloud Computing, AWS, Azure & DevOps',
  },
]

// Pick author based on post count so it rotates every post
function pickAuthor(state) {
  return AUTHORS[(state.total || 0) % AUTHORS.length]
}

// ── GROQ ──────────────────────────────────────────────────────
// Model strategy:
//   8B  (llama-3.1-8b-instant)      → keyword research  (fast, cheap, just JSON output)
//   70B (llama-3.3-70b-versatile)   → blog writing      (premium quality content)
const MODEL_RESEARCH = 'llama-3.1-8b-instant'
const MODEL_WRITE    = 'llama-3.3-70b-versatile'

async function groq(system, user, model = MODEL_WRITE, retries = 3, maxTokens = 1800) {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set in GitHub Secrets')

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model,
        max_tokens:  maxTokens,
        temperature: 0.75,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user },
        ],
      }),
    })

    // Handle rate limit — wait and retry
    if (res.status === 429) {
      const errText = await res.text()
      // Extract wait time from error message e.g. "try again in 7m37.92s"
      const waitMatch = errText.match(/(\d+)m([\d.]+)s/)
      const waitMs = waitMatch
        ? (parseInt(waitMatch[1]) * 60 + parseFloat(waitMatch[2])) * 1000 + 2000
        : attempt * 30000 // fallback: 30s, 60s, 90s
      const waitSec = Math.round(waitMs / 1000)
      console.log(`   ⏳ Rate limit hit. Waiting ${waitSec}s before retry ${attempt}/${retries}...`)
      await new Promise(r => setTimeout(r, waitMs))
      continue
    }

    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error('Groq returned empty response')
    return text
  }

  throw new Error('Groq rate limit exceeded after all retries. Try again tomorrow or upgrade to Groq Dev tier.')
}

// ── STATE ─────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }
  catch {
    return {
      usedSlugs:      [],
      usedKeywords:   [],
      publishedPosts: [],
      total:          0,
      lastRun:        null,
    }
  }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)) }

// ── STEP 1: AUTO KEYWORD RESEARCH ────────────────────────────
async function researchKeywords(state) {
  console.log('\n🔑 Step 1: Researching trending keywords...')

  const used    = state.usedKeywords?.slice(-20).join(', ') || 'none yet'
  const covered = state.publishedPosts?.map(p => p.title).slice(-8).join(', ') || 'none yet'
  const today   = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const text = await groq(
    `You are an SEO strategist for SpeedUp Infotech, an IT training institute in Pune. Return ONLY a valid JSON array, no other text.`,
    `Generate 10 blog topic ideas for ${today}. Courses: MERN Stack, Full Stack, Python, Data Analytics, AI & ML, React JS.

Categories needed: trending-ai (4 topics), career (3 topics), comparison (2 topics), beginner (1 topic).
Already covered (skip these): ${covered}
Already used keywords (skip these): ${used}

Return ONLY this JSON array (no markdown, no explanation):
[{"title":"...","keyword":"...","slug":"url-slug","category":"trending-ai","imageQuery":"3 word photo search","priority":1}]

Rules: Include 2026 in titles. Make slugs URL-safe with hyphens only.`,
    MODEL_WRITE,  // 70B model — more reliable JSON formatting
    3,
    1500
  )

  try {
    // Strip any markdown code fences if model wraps in ```json
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const match   = cleaned.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found in response')
    const topics  = JSON.parse(match[0])
    if (!Array.isArray(topics) || topics.length === 0) throw new Error('Empty topics array')
    const sorted  = topics.sort((a, b) => a.priority - b.priority)
    console.log(`   ✓ ${sorted.length} trending topics researched`)
    console.log(`   Top topic: "${sorted[0].title}"`)
    return sorted
  } catch (e) {
    console.log(`   ⚠️  Keyword research parse failed: ${e.message}`)
    console.log('   ℹ️  Using fallback topics')
    return getFallbackTopics(state)
  }
}

// ── FALLBACK TOPICS if Groq research fails ────────────────────
function getFallbackTopics(state) {
  const used = state.usedSlugs || []
  const all = [
    { title: 'Top AI Coding Tools Every Developer Must Use in 2026', keyword: 'AI coding tools developers 2026', slug: 'ai-coding-tools-developers-2026', category: 'trending-ai', imageQuery: 'artificial intelligence coding assistant', priority: 1 },
    { title: 'ChatGPT vs GitHub Copilot vs Cursor AI — Which is Best for Developers?', keyword: 'ChatGPT vs GitHub Copilot developers', slug: 'chatgpt-vs-github-copilot-cursor-ai-developers', category: 'trending-ai', imageQuery: 'AI assistant developer laptop', priority: 1 },
    { title: 'What is RAG in AI? Complete Guide for Developers in Pune 2026', keyword: 'what is RAG AI developers Pune', slug: 'what-is-rag-ai-developers-pune-2026', category: 'trending-ai', imageQuery: 'machine learning AI technology', priority: 1 },
    { title: 'React 19 New Features — What Pune Developers Need to Know', keyword: 'React 19 new features developers Pune', slug: 'react-19-new-features-pune-developers-2026', category: 'trending-ai', imageQuery: 'react javascript frontend development', priority: 2 },
    { title: 'How to Use AI Tools to Learn Coding 3x Faster in 2026', keyword: 'AI tools learn coding faster 2026', slug: 'ai-tools-learn-coding-faster-2026', category: 'trending-ai', imageQuery: 'student learning AI technology laptop', priority: 2 },
    { title: 'MERN Stack Developer Salary in Pune for Freshers 2026', keyword: 'MERN stack salary Pune freshers', slug: 'mern-stack-salary-pune-freshers-2026', category: 'career', imageQuery: 'web developer salary career growth', priority: 3 },
    { title: 'Best IT Training Institutes in Pune 2026', keyword: 'best IT training institute in Pune', slug: 'best-it-training-institutes-pune-2026', category: 'career', imageQuery: 'coding bootcamp students laptops', priority: 3 },
    { title: 'Python vs JavaScript — Which Should You Learn for Jobs in Pune 2026?', keyword: 'Python vs JavaScript jobs Pune 2026', slug: 'python-vs-javascript-jobs-pune-2026', category: 'comparison', imageQuery: 'python javascript programming comparison', priority: 3 },
    { title: 'Data Analytics Course in Pune — Complete Career Guide 2026', keyword: 'data analytics course Pune', slug: 'data-analytics-course-pune-2026', category: 'career', imageQuery: 'data analytics charts dashboard', priority: 4 },
    { title: 'What is LLM? Large Language Models Explained Simply for Beginners', keyword: 'what is LLM large language model beginners', slug: 'what-is-llm-large-language-model-beginners-2026', category: 'beginner', imageQuery: 'AI language model technology', priority: 2 },
  ]
  return all.filter(t => !used.includes(t.slug))
}

// ── STEP 2: PICK BEST TOPIC ───────────────────────────────────
function pickTopic(topics, state) {
  console.log('\n📋 Step 2: Selecting best topic...')
  const used = state.usedSlugs || []

  // Filter out already published
  const available = topics.filter(t => !used.includes(t.slug))
  if (available.length === 0) {
    console.log('   All researched topics used — picking first')
    return topics[0]
  }

  // Prioritise: trending-ai > career > comparison > beginner > technical
  const order = ['trending-ai', 'career', 'comparison', 'beginner', 'technical']
  for (const cat of order) {
    const match = available.find(t => t.category === cat)
    if (match) {
      console.log(`   ✓ Selected: "${match.title}"`)
      console.log(`   ✓ Category: ${match.category}`)
      return match
    }
  }

  console.log(`   ✓ Selected: "${available[0].title}"`)
  return available[0]
}

// ── STEP 3: FETCH IMAGES ─────────────────────────────────────
async function fetchImage(query, fallbackUrl, fallbackAlt, pickIndex = 0) {
  // Words that signal irrelevant photos
  const BAD_KW = [
    'electrical','circuit','electronic','wiring','mechanic','inverter','voltage','smps',
    'solar','engine','factory','construction','medical','hospital','cooking','food',
    'nature','animal','welding','soldering','flower','beach','mountain','wedding',
    'fashion','fitness','gym','sport','car','vehicle','architecture','real estate'
  ]
  const isRelevant = p => !BAD_KW.some(kw => (p.alt || '').toLowerCase().includes(kw))

  // Try Pexels — use query as-is (no blanket 'software' suffix)
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      )
      const data = await res.json()
      const good = (data.photos || []).filter(isRelevant)
      if (good.length) {
        // Pick from top results with variety (not always first)
        const pick = good[pickIndex % good.length]
        return {
          url:     pick.src.large,
          heroUrl: pick.src.large2x || pick.src.large,
          alt:     pick.alt || query,
          credit:  `Photo by ${pick.photographer} on Pexels`
        }
      }
    } catch {}
  }

  // Try Unsplash
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (unsplashKey) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      )
      const data = await res.json()
      if (data.results?.length) {
        const pick = data.results[pickIndex % data.results.length]
        return {
          url:     `${pick.urls.regular}&w=800&q=80`,
          heroUrl: `${pick.urls.regular}&w=1200&h=630&fit=crop&q=80`,
          alt:     pick.alt_description || query,
          credit:  `Photo by ${pick.user.name} on Unsplash`
        }
      }
    } catch {}
  }

  // Hardcoded fallback
  return { url: fallbackUrl, heroUrl: fallbackUrl, alt: fallbackAlt, credit: 'Unsplash' }
}

// Default fallback images pool
const FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=630&fit=crop&q=80',
]

// ── POLLINATIONS.AI HERO IMAGE ────────────────────────────────
// 100% free, no API key needed — generates a unique AI image per blog post
function buildPollinationsPrompt(topic) {
  // Category-specific visual styles for more relevant images
  const styleMap = {
    'trending-ai':  'futuristic digital interface, glowing neural network, modern tech workspace, dark background with neon blue accents, professional photography style',
    'career':       'professional IT office Pune India, modern workspace, confident developer at laptop, bright corporate environment, cinematic lighting',
    'comparison':   'split screen technology comparison, two coding interfaces side by side, modern developer setup, clean minimal dark theme',
    'beginner':     'young student learning to code on laptop, friendly classroom environment, bright colorful tech education, motivational atmosphere',
    'technical':    'close up of clean code on multiple monitors, dark IDE theme, professional software engineering setup, depth of field photography',
  }

  const style = styleMap[topic.category] || styleMap['technical']

  // Build a specific prompt from the blog title
  const subject = topic.title
    .replace(/[—–-]+/g, 'and')
    .replace(/[?!]/g, '')
    .slice(0, 80)

  return `${subject}, ${style}, high quality, 4K, photorealistic, no text, no watermark, no logo`
}

async function generateHeroImage(topic, fallbackUrl) {
  try {
    const prompt  = buildPollinationsPrompt(topic)
    const encoded = encodeURIComponent(prompt)
    const seed    = topic.slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const url     = `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true&model=flux`

    console.log(`   ⏳ Generating AI hero image (this takes ~15s)...`)

    // Download image fully — Pollinations generates on-the-fly so we need GET not HEAD
    const res = await fetch(url, { signal: AbortSignal.timeout(45000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const buffer    = Buffer.from(await res.arrayBuffer())
    const imgDir    = path.join(ROOT, 'public', 'images')
    const localFile = path.join(imgDir, `${topic.slug}.jpg`)
    const localUrl  = `/images/${topic.slug}.jpg`

    // Save to public/images/ so Next.js serves it directly
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true })
    fs.writeFileSync(localFile, buffer)

    console.log(`   ✓ Hero:   Pollinations AI saved → ${localUrl}  (${Math.round(buffer.length/1024)}KB)`)
    return {
      url:     localUrl,
      heroUrl: localUrl,
      alt:     `${topic.title} — SpeedUp Infotech Pune`,
      credit:  'AI Generated Image',
    }
  } catch (e) {
    console.log(`   ⚠️  Pollinations failed (${e.message}) — using stock photo fallback`)
  }

  return null
}


async function getImages(topic, state) {
  console.log('\n📸 Step 3: Fetching topic-matched images...')
  const q   = topic.imageQuery || 'technology coding laptop'
  const idx = state.total || 0
  const fbUrl = FALLBACK_POOL[idx % FALLBACK_POOL.length]

  // Build category-specific, varied queries for each image slot
  // Use imageQuery as the base for hero only — avoid repeating it in suffix
  const categoryQueries = {
    'trending-ai': [
      q,                                          // hero: exact topic query from Groq
      'developer working laptop screen code',
      'machine learning data visualization',
      'students learning technology classroom'
    ],
    'career': [
      `${q} professional`,
      'software developer job interview',
      'IT professional working computer',
      'students coding bootcamp training'
    ],
    'comparison': [
      `${q} technology`,
      'programmer dual screen setup',
      'coding languages framework development',
      'IT students group project laptop'
    ],
    'beginner': [
      `${q} learning`,
      'beginner programmer laptop study',
      'online learning education technology',
      'student studying programming course'
    ],
    'technical': [
      `${q} developer`,
      'full stack web development code',
      'software engineer technical work',
      'programming project team collaboration'
    ],
  }

  const queries = categoryQueries[topic.category] || categoryQueries['technical']

  // Hero: try Pollinations AI first (free, unique, topic-specific)
  // Body images: Pexels/Unsplash stock photos (reliable, fast)
  const pollinationsHero = await generateHeroImage(topic, fbUrl)
  const heroImg  = pollinationsHero || await fetchImage(queries[0], fbUrl, topic.title, idx % 3)

  const bodyImg1 = await fetchImage(queries[1], FALLBACK_POOL[(idx+1) % FALLBACK_POOL.length], topic.keyword, (idx+1) % 4)
  const bodyImg2 = await fetchImage(queries[2], FALLBACK_POOL[(idx+2) % FALLBACK_POOL.length], topic.keyword, (idx+2) % 4)
  const bodyImg3 = await fetchImage(queries[3], FALLBACK_POOL[(idx+3) % FALLBACK_POOL.length], 'SpeedUp Infotech Pune', (idx+3) % 4)

  if (!pollinationsHero) console.log(`   ✓ Hero:   ${heroImg.credit}  ["${queries[0]}")`)
  console.log(`   ✓ Body 1: ${bodyImg1.credit}  ["${queries[1]}")`)
  console.log(`   ✓ Body 2: ${bodyImg2.credit}  ["${queries[2]}")`)
  console.log(`   ✓ Body 3: ${bodyImg3.credit}  ["${queries[3]}")`)

  return { hero: heroImg, body: [bodyImg1, bodyImg2, bodyImg3] }
}

// ── STEP 4: WRITE BLOG POST (2 calls = ~2000 words) ──────────
async function writePost(topic, images, state) {
  console.log('\n✍️  Step 4: Writing 2000-word blog post...')

  const isTrending = topic.category === 'trending-ai'
  const today      = new Date().toISOString().split('T')[0]
  const author     = pickAuthor(state)

  const system = `You are ${author.name}, a ${author.bio}. You specialise in ${author.specialty}. You write Google E-E-A-T compliant blog content for SpeedUp Infotech that demonstrates real Experience, Expertise, Authority, and Trust. Your writing:
- Cites specific data sources (mention "According to Stack Overflow 2025 survey", "LinkedIn Jobs data", "Glassdoor India", "NASSCOM report" etc.)
- Includes specific named tools, companies, technologies (not vague generics)
- Mentions real Pune IT companies hiring: Persistent, Zensar, Infosys BPO, TCS, Cybage, Accenture, KPIT, Synechron
- Adds trust signals: specific batch sizes, student outcomes, years of experience
- Uses authoritative language: "In our experience training 500+ students...", "Industry data shows..."
- Refers to your own background: "Having worked at ${author.background} before joining SpeedUp Infotech..."
- Connects to salary data with sources and reasoning
- Always based in Pune context: Shivaji Nagar, FC Road, Hinjewadi, Deccan, Baner`

  // CALL 1 — First 1000 words (70B model for premium quality)
  console.log(`   Writing Part 1 (~1000 words) with ${MODEL_WRITE}...`)
  const part1 = await groq(system,
    `Write the FIRST HALF of a detailed SEO blog post.

Title: ${topic.title}
Primary keyword: ${topic.keyword}
Category: ${topic.category}
Year: 2026

${isTrending ? `This is a TRENDING AI/TECH topic. Structure it as:
1. # ${topic.title}
2. Introduction (150 words) — Why this is trending NOW in 2026, what developers need to know
3. ## What is [Topic] — Clear Explanation (250 words) — explain simply with real analogy
4. ## Why Every Developer Needs to Know This in 2026 (250 words) — job market impact, Pune specifically
5. ## How It Works — Technical Details (300 words) — deeper explanation with examples` :
`Structure it as:
1. # ${topic.title}
2. Introduction (150 words) — Hook, primary keyword in first sentence, what reader learns
3. ## Overview — What You Need to Know (250 words)
4. ## Why It Matters for IT Careers in Pune (250 words) — Shivaji Nagar, FC Road context
5. ## Key Details and Breakdown (300 words) — facts, numbers, salary Rs X-Y LPA`}

CRITICAL RULES FOR E-E-A-T COMPLIANCE:
- MINIMUM 1000 words for Part 1 — write fully detailed paragraphs, never cut short
- Each section must have AT LEAST 3 full paragraphs
- Write like an expert practitioner — specific, authoritative, experience-based
- NO bullet points in main sections — only flowing paragraphs
- EXPERIENCE: Include phrases like "In our experience training 500+ students at SpeedUp Infotech..."
- EXPERTISE: Use specific technical terms, version numbers, real tool names (GitHub Copilot, Cursor AI, ChatGPT-4o etc.)
- AUTHORITY: Cite sources — "According to Stack Overflow Developer Survey 2025", "LinkedIn Jobs India data shows", "NASSCOM 2026 report"
- TRUST: Add salary data with reasoning — "Freshers at Persistent Pune earn Rs X LPA because..."
- Mention Pune companies by name: Persistent, Zensar, KPIT, Cybage, Synechron, Accenture Pune
- Mention Pune 4-5 times (Shivaji Nagar, FC Road, Hinjewadi, Deccan, Baner)
- Do NOT write a conclusion
- Do NOT include FAQ yet
- Do NOT include image tags
- Start directly with # ${topic.title}`,
    MODEL_WRITE, 3, 1800)  // 70B model, 1800 tokens max per part

  console.log(`   ✓ Part 1: ~${part1.split(/\s+/).length} words`)

  // CALL 2 — Second 1000 words (70B model for premium quality)
  console.log(`   Writing Part 2 (~1000 words) with ${MODEL_WRITE}...`)
  const part2 = await groq(system,
    `Write the SECOND HALF of a blog post about "${topic.title}" for SpeedUp Infotech.

Keyword: ${topic.keyword}
Year: 2026

Write these sections:

${isTrending ? `## How to Learn This as a Fresher in Pune (200 words)
Practical steps. Resources. How SpeedUp Infotech teaches this in their curriculum.

## Real Use Cases and Industry Examples (200 words)
Specific companies using this. Real projects. Pune IT companies adopting it.

## Career Impact — Jobs and Salary in Pune 2026 (200 words)
Specific job roles, salary Rs X-Y LPA, companies in Pune hiring for this skill.` :
`## Career Scope and Salary in Pune 2026 (250 words)
Salary Rs X-Y LPA. Companies: TCS, Infosys, Wipro, Persistent, Cognizant. Job roles. Growth path.

## Step-by-Step Guide to Get Started (200 words)
Concrete steps. Timeline. What to build.`}

## Why SpeedUp Infotech is the Best Place to Learn in Pune (150 words)
Write as Rahul Deshmukh (senior trainer). Include: 8+ years industry experience, batch size (20-25 students max), real project portfolio, 100% placement support, ${ADDR}, call ${PHONE}. Mention 3-4 specific companies where SpeedUp students got placed.

## Frequently Asked Questions

**Q: ${isTrending ? `How is this topic changing IT jobs in Pune in 2026?` : `How long does it take to learn ${topic.keyword.split(' ')[0]} from scratch?`}**
A: [Write 3-4 detailed sentences. Include specific numbers, timeframes, and cite "According to LinkedIn Jobs India" or "NASSCOM data". Mention salary impact in Pune specifically with Rs X-Y LPA range.]

**Q: ${isTrending ? 'Which Pune companies are actively hiring for this skill in 2026?' : `Is ${topic.keyword.split(' ').slice(0,3).join(' ')} worth learning for freshers in Pune?`}**
A: [3-4 sentences naming specific Pune companies: Persistent Systems, Zensar, KPIT, Cybage, Synechron. Include salary ranges Rs X-Y LPA for freshers vs experienced. Add "SpeedUp Infotech students have been placed at..."]

**Q: Does SpeedUp Infotech cover this in their courses?**
A: Yes, SpeedUp Infotech at Shivaji Nagar, Pune covers this comprehensively with hands-on projects and real industry assignments. Our students have been placed at Persistent Systems, Zensar Technologies, and Cybage with packages from Rs 3.5-10 LPA. With 500+ placements and 4.8★ Justdial rating, we are Pune's most trusted IT training institute. Call ${PHONE} to know the latest batch schedule.

**Q: What is the realistic salary for a fresher with this skill in Pune?**
A: [3-4 sentences with specific salary ranges: fresher Rs X-Y LPA, 1-2 years Rs A-B LPA, 3-5 years Rs C-D LPA. Cite Glassdoor India or LinkedIn Salary data. Explain what factors affect the salary — company size, specific skills, project experience.]

[Conclusion — 120 words: Summarize key insights. Include "${topic.keyword}" naturally. Strong CTA mentioning free demo class, batch starting soon, limited seats.]

Book a free demo class at SpeedUp Infotech, ${ADDR} — call ${PHONE}. New batch starting soon — limited seats.

CRITICAL RULES FOR E-E-A-T:
- MINIMUM 1000 words for Part 2
- TRUST: Every salary claim must have reasoning or a source mention
- AUTHORITY: Use "According to [source]" at least 3 times
- EXPERIENCE: Include at least 1 student/trainer experience reference
- FAQ answers must be 4+ sentences each — detailed and specific
- Conclusion must be at least 120 words
- NO bullet points — flowing paragraphs only
- Do NOT repeat H1 title
- Do NOT include image tags
- Do NOT use --- frontmatter`,
    MODEL_WRITE, 3, 1800)  // 70B model, 1800 tokens max per part

  console.log(`   ✓ Part 2: ~${part2.split(/\s+/).length} words`)

  const fullBody   = `${part1}\n\n${part2}`
  const totalWords = fullBody.split(/\s+/).length
  console.log(`   ✓ Total: ~${totalWords} words`)

  return { fullBody, totalWords, today }
}

// ── STEP 5: BUILD FINAL MDX ───────────────────────────────────
function buildMdx(topic, images, fullBody, today, state) {
  // Extract description from first paragraph
  const lines       = fullBody.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const description = (lines[0] || topic.title).replace(/[*_`[\]()]/g, '').slice(0, 155).trim()

  // Inject images after 2nd, 4th, 6th H2
  let count = 0
  const bodyWithImages = fullBody.replace(/^(## .+)$/gm, match => {
    count++
    const idx = count === 2 ? 0 : count === 4 ? 1 : count === 6 ? 2 : -1
    if (idx >= 0 && images.body[idx]) {
      const img = images.body[idx]
      return `${match}\n\n![${img.alt}](${img.url})\n*${img.credit}*\n`
    }
    return match
  })

  const heroUrl = images.hero.heroUrl || images.hero.url

  const author = pickAuthor(state)

  const frontmatter = `---
title: "${topic.title}"
slug: "${topic.slug}"
description: "${description}"
date: "${today}"
lastUpdated: "${today}"
author: "${author.name}"
authorBio: "${author.bio}"
category: "${topic.category === 'trending-ai' ? 'AI & Tech Trends' : topic.category === 'career' ? 'IT Careers' : topic.category === 'comparison' ? 'Course Comparison' : 'IT Guide'}"
tags: ["IT Training Pune", "SpeedUp Infotech", "${topic.keyword}"]
keywords: ["${topic.keyword}", "IT courses Pune", "SpeedUp Infotech Pune", "IT training Shivaji Nagar"]
heroImage: "${heroUrl}"
heroImageAlt: "${topic.title} — SpeedUp Infotech Pune"
canonical: "${SITE}/blog/${topic.slug}"
readTime: "12 min read"
trending: ${topic.category === 'trending-ai'}
---`

  return `${frontmatter}\n\n${bodyWithImages}`
}

// ── STEP 6: SAVE MDX ─────────────────────────────────────────
function saveMdx(topic, content) {
  console.log('\n💾 Step 5: Saving MDX file...')
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true })
  const filename = `${topic.slug}.mdx`
  fs.writeFileSync(path.join(BLOG_DIR, filename), content, 'utf8')
  console.log(`   ✓ content/blog/${filename}`)
  return filename
}

// ── STEP 7: UPDATE SITEMAP ────────────────────────────────────
function updateSitemap(slug) {
  const today    = new Date().toISOString().split('T')[0]
  const pubDir   = path.join(ROOT, 'public')
  const sitePath = path.join(pubDir, 'sitemap.xml')
  const entry    = `  <url>\n    <loc>${SITE}/blog/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`

  if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true })

  if (fs.existsSync(sitePath)) {
    let sm = fs.readFileSync(sitePath, 'utf8')
    if (!sm.includes(`/blog/${slug}`)) sm = sm.replace('</urlset>', entry)
    fs.writeFileSync(sitePath, sm)
  } else {
    fs.writeFileSync(sitePath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>1.0</priority>\n  </url>\n${entry}`)
  }
  console.log('   ✓ sitemap.xml updated')
}

// ── STEP 8: GIT PUSH ─────────────────────────────────────────
function gitPush(slug, filename) {
  // NOTE: Git push is handled by the GitHub Actions workflow step.
  // Do NOT commit here — if we commit inside the script, the workflow's
  // "Push content to GitHub" step finds nothing to commit and skips the push,
  // meaning .state.json is never saved back to the repo.
  console.log('\n🚀 Step 6: Git push will be handled by GitHub Actions workflow')
  console.log(`   ✓ File ready: content/blog/${filename}`)
}

// ── STEP 9: PING SEARCH ENGINES ──────────────────────────────
async function pingSearchEngines(slug) {
  console.log('\n📡 Step 7: Pinging search engines...')
  const postUrl  = `${SITE}/blog/${slug}`
  const indexKey = process.env.INDEXNOW_KEY || 'speedup2026pune'

  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host:        'speedupinfotech.com',
        key:         indexKey,
        keyLocation: `${SITE}/${indexKey}.txt`,
        urlList:     [postUrl, `${SITE}/blog`],
      }),
    })
    console.log('   ✓ Google + Bing + Yandex notified via IndexNow')
  } catch { console.log('   ℹ️  IndexNow ping skipped') }

  try {
    await fetch(`https://www.google.com/ping?sitemap=${SITE}/sitemap.xml`)
    console.log('   ✓ Google sitemap pinged')
  } catch {}
}

// ── STEP 10: SAVE SOCIAL CONTENT ─────────────────────────────
function saveSocialContent(topic) {
  const url = `${SITE}/blog/${topic.slug}`
  const dir = path.join(__dirname, 'social-queue')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const social = {
    generatedAt: new Date().toISOString(),
    url,
    category: topic.category,
    linkedin: `${topic.category === 'trending-ai' ? '🤖 AI Update:' : '📚 New on blog:'}\n\n"${topic.title}"\n\n${url}\n\n#ITTraining #Pune #SpeedUpInfotech #${topic.category === 'trending-ai' ? 'AI #TechTrends' : 'ITCareer'}`,
    twitter:  `"${topic.title}"\n\n${url}\n\n#Pune #ITTraining #SpeedUpInfotech`,
    whatsapp: `${topic.category === 'trending-ai' ? '🤖 AI/Tech Update' : '📚 New Blog'} from SpeedUp Infotech:\n\n*${topic.title}*\n\n${url}`,
  }

  fs.writeFileSync(path.join(dir, `${topic.slug}.json`), JSON.stringify(social, null, 2))
  console.log('   ✓ Social captions saved to scripts/social-queue/')
}

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════')
  console.log('  SpeedUp Infotech — Blog Automation')
  console.log('  Auto keyword research + Trending AI/Tech topics')
  console.log(`  ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`)
  console.log('══════════════════════════════════════════════════════')

  if (!process.env.GROQ_API_KEY) {
    console.error('\n✗ GROQ_API_KEY not set in GitHub Secrets')
    process.exit(1)
  }

  const state = loadState()

  // 1. Research fresh trending keywords
  const topics = await researchKeywords(state)

  // 2. Pick best unused topic
  const topic = pickTopic(topics, state)

  // 3. Fetch relevant images
  const images = await getImages(topic, state)

  // 4. Write 2000-word post
  const { fullBody, totalWords, today } = await writePost(topic, images, state)

  // 5. Build MDX
  const content  = buildMdx(topic, images, fullBody, today, state)
  const finalWc  = content.split(/\s+/).length

  // 6. Save file
  const filename = saveMdx(topic, content)

  // 7. Update sitemap
  updateSitemap(topic.slug)

  // 8. Save social content
  saveSocialContent(topic)

  // 9. Update state
  if (!state.usedSlugs)    state.usedSlugs    = []
  if (!state.usedKeywords) state.usedKeywords  = []
  state.usedSlugs.push(topic.slug)
  state.usedKeywords.push(topic.keyword)
  state.publishedPosts = state.publishedPosts || []
  state.publishedPosts.push({
    slug:        topic.slug,
    title:       topic.title,
    category:    topic.category,
    keyword:     topic.keyword,
    publishedAt: new Date().toISOString(),
    words:       finalWc,
  })
  state.total   = (state.total || 0) + 1
  state.lastRun = new Date().toISOString()
  saveState(state)

  // 10. Git push
  gitPush(topic.slug, filename)

  // 11. Ping search engines
  await pingSearchEngines(topic.slug)

  console.log('\n══════════════════════════════════════════════════════')
  console.log('✅ PUBLISHED!\n')
  console.log(`📄 Post:     ${SITE}/blog/${topic.slug}`)
  console.log(`📝 Words:    ~${finalWc}`)
  console.log(`🏷️  Category: ${topic.category}`)
  console.log(`🔑 Keyword:  ${topic.keyword}`)
  console.log(`📸 Images:   Hero + 3 body (Pexels/Unsplash)`)
  console.log(`📊 Total:    ${state.total} posts published`)
  console.log(`⏰ Next run: Mon/Tue/Thu/Sat 6:00 AM IST (automatic — 4x/week)`)
  console.log('══════════════════════════════════════════════════════\n')
}

main().catch(err => { console.error('\n✗ Fatal:', err.message); process.exit(1) })
