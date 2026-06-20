// ============================================================
//  SpeedUp Infotech - Full Blog Automation Engine
//  Auto keyword research + trending AI/tech topics
//  Images: Pexels (primary) -> Unsplash -> hardcoded fallback
//  AI: Groq Llama 3.3 70B
//  Runs: GitHub Actions Mon/Tue/Thu/Sat 6AM IST
// ============================================================

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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
    bio:        'Data Science & AI Trainer at SpeedUp Infotech Pune | Expert in Machine Learning, Deep Learning, NLP, Generative AI & Data Analytics | Helping freshers and professionals build real-world AI projects and industry-ready skills.',
    background: 'AI & Data Science Training',
    specialty:  'Machine Learning, Generative AI, NLP, Data Analytics, Power BI',
  },
  {
    name:       'Chetana Vasave',
    bio:        'Data Analyst & Data Science Mentor at SpeedUp Infotech Pune | Skilled in Python, SQL, Power BI, Excel, Machine Learning, Computer Vision, and NLP | Helping students and freshers build real-world Data Analytics and AI projects with practical industry-focused training.',
    background: 'Data Analytics and AI Training',
    specialty:  'Excel | Power BI | SQL | AI | Python',
  },
  {
    name:       'Pratik Sabale',
    bio:        'AI System Builder & Founder | Tech Speaker | Expert in MERN Stack, Python, and Scalable AI Systems | Helping businesses and developers build intelligent, production-ready AI solutions.',
    background: 'AI Systems Development & Full-Stack Engineering',
    specialty:  'AI Systems, MERN Stack, Python, Automation, Full-Stack Development',
  },
  {
    name:       'Rutvij Mahamuni',
    bio:        'Training Team Lead at Speedup Infotech, Pune | Expert in Frontend Development, MERN Stack, and Soft Skills',
    background: 'MERN Stack Development and Soft Skills Coaching',
    specialty:  'MERN Stack Development, ReactJS, Communication Coaching and Interview preparation',
  },
  {
    name:       'Sameer Thaware',
    bio:        'Devops Trainer at SpeedUp Infotech Pune | Expert in Automating & Streamlining Processes | Continuous Integration & Deployment Specialist | Helping freshers build real-world projects',
    background: 'Worked in 2 IT companies as a Cloud DevOps Engineer, proficient in automation, containerization, cloud platforms, monitoring and logging, and CI/CD.',
    specialty:  'Linux, AWS, Jenkins, Docker, Kubernetes, AiOps, DevOps',
  },
]

// Pick author based on post count so it rotates every post
function pickAuthor(state) {
  return AUTHORS[(state.total || 0) % AUTHORS.length]
}

// ── GROQ ──────────────────────────────────────────────────────
// Model strategy:
//   8B  (llama-3.1-8b-instant)      → keyword research only (fast, small JSON output)
//   70B (llama-3.3-70b-versatile)   → all writing + editing  (premium quality)
//
// Multi-key rotation: set GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3 in GitHub
// Secrets. On every 429 / 413 the next key is tried automatically.
const MODEL_RESEARCH = 'llama-3.1-8b-instant'
const MODEL_WRITE    = 'llama-3.3-70b-versatile'

// Collect all provided Groq keys (primary + optional extras)
const GROQ_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean)

let _groqKeyIdx = 0
function currentGroqKey() { return GROQ_KEYS[_groqKeyIdx % GROQ_KEYS.length] }
function rotateGroqKey()  { _groqKeyIdx++; console.log(`   🔑 Rotated to Groq key ${(_groqKeyIdx % GROQ_KEYS.length) + 1}/${GROQ_KEYS.length}`) }

const TRUSTED_SOURCE_GUIDE = [
  {
    name: 'React 19 official release notes',
    url: 'https://react.dev/blog/2024/12/05/react-19',
    useWhen: 'React 19, frontend development, server components, React actions',
    facts: [
      'React 19 stable was announced on December 5, 2024.',
      'React 19 includes Actions, useActionState, useOptimistic, the use API, and improvements for Server Components.',
    ],
  },
  {
    name: 'React documentation',
    url: 'https://react.dev',
    useWhen: 'React features, hooks, migration guidance',
    facts: [
      'Use official React docs for feature names and examples.',
      'Do not describe React 19 as a 2026 release.',
    ],
  },
  {
    name: 'Stack Overflow Developer Survey',
    url: 'https://survey.stackoverflow.co/',
    useWhen: 'developer tool usage and broad developer trends',
    facts: [
      'Use for broad developer ecosystem trends only.',
      'Do not invent exact percentages unless the exact survey page is linked and the number is present there.',
    ],
  },
  {
    name: 'NASSCOM reports',
    url: 'https://nasscom.in/knowledge-center/publications',
    useWhen: 'India tech industry trends',
    facts: [
      'Use cautious India-level technology market language.',
      'Do not invent exact market size, CAGR, or job counts unless verified from a specific report.',
    ],
  },
  {
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs/',
    useWhen: 'live hiring demand examples',
    facts: [
      'Use only as a place readers can verify current job postings.',
      'Avoid precise job-count claims unless checked on the day of publishing.',
    ],
  },
  {
    name: 'Glassdoor India',
    url: 'https://www.glassdoor.co.in/Salaries/index.htm',
    useWhen: 'salary ranges',
    facts: [
      'Use salary ranges as estimates, not guarantees.',
      'Mention that salaries vary by company, project portfolio, interview performance, and current market demand.',
    ],
  },
]

const HUMAN_REVIEW_RULES = [
  'Remove AI process artifacts such as "we will continue", "in this article we will", "stay tuned", and placeholder bracket text.',
  'Keep the voice practical and locally useful for Pune students. Use concrete examples, but do not invent named client projects, placements, company migrations, ratings, or survey numbers.',
  'Replace absolute claims with cautious wording unless a trusted source URL is included nearby.',
  'For salaries, provide broad ranges and explain the assumptions. Never guarantee packages.',
  'Add a short "Sources and further reading" section with 3-5 links from the trusted source guide when the article includes trend, salary, framework, or market claims.',
  'Make the article read like an institute trainer edited it: direct, helpful, less repetitive, and no keyword stuffing.',
]

const BLOCKED_CONTENT_PATTERNS = [
  { label: 'AI continuation artifact', regex: /\b(we will continue|stay tuned|in the next part|second half of this|this detailed blog post)\b/i },
  { label: 'Prompt placeholder leaked', regex: /\[[^\]]*(?:write|sentence|word|conclusion|answer|source|number|range)[^\]]*]/i },
  { label: 'Mojibake characters', regex: /â|ðŸ|�/ },
  { label: 'Fake exact CAGR or market-size wording', regex: /\b(?:CAGR|market size|expected to reach|job opportunities)\b[^.]*\b(?:according to|NASSCOM|LinkedIn|Glassdoor)\b/i },
  { label: 'Unsupported company adoption claim', regex: /\b(?:has migrated|have migrated|already adopted|is using React 19|uses React 19 to power)\b/i },
  { label: 'React 19 wrong release year', regex: /\bReact 19\b[^.]{0,80}\breleased in 2026\b/i },
]

const REQUIRED_SOURCE_SECTION = /## Sources and further reading/i

async function groq(system, user, model = MODEL_WRITE, retries = 3, maxTokens = 1800) {
  if (GROQ_KEYS.length === 0) throw new Error('No GROQ_API_KEY set in GitHub Secrets')

  for (let attempt = 1; attempt <= retries; attempt++) {
    const key = currentGroqKey()
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

    // 429 = rate-limited on this key; 413 = request too large for this key's TPM bucket
    if (res.status === 429 || res.status === 413) {
      const errText = await res.text()

      // Try rotating to the next key first — it has a fresh token bucket
      if (GROQ_KEYS.length > 1) {
        rotateGroqKey()
        console.log(`   ⏳ Retrying immediately with new key (attempt ${attempt}/${retries})...`)
        continue
      }

      // Single key — parse Groq's suggested wait and sleep
      let waitMs
      const minsMatch = errText.match(/(\d+)m([\d.]+)s/)
      const secsMatch = errText.match(/try again in ([\d.]+)s/i)
      if (minsMatch) {
        waitMs = (parseInt(minsMatch[1]) * 60 + parseFloat(minsMatch[2])) * 1000 + 3000
      } else if (secsMatch) {
        waitMs = parseFloat(secsMatch[1]) * 1000 + 3000
      } else {
        waitMs = [90000, 120000, 180000][Math.min(attempt - 1, 2)]
      }
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

  throw new Error('Groq rate limit exceeded after all retries. Add a second GROQ_API_KEY_2 secret or upgrade to Groq Dev tier.')
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

// ── STEP 3: GET LOCAL PRE-GENERATED IMAGES ────────────────────

const FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=630&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=630&fit=crop&q=80',
]

const UNSPLASH_HERO_FALLBACKS = {
  'trending-ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop&q=80',
  'career':      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop&q=80',
  'comparison':  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop&q=80',
  'beginner':    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=630&fit=crop&q=80',
  'technical':   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&q=80',
}

async function getImages(topic, state) {
  console.log('\n📸 Step 3: Fetching topic-matched images from local pre-generated pool...')

  const pregenBase = path.join(ROOT, 'public', 'images', 'pre-generated')
  const categoryDir = path.join(pregenBase, topic.category)
  const techDir     = path.join(pregenBase, 'technical')

  // Resolve which directory to use
  let imgDir = null
  if (fs.existsSync(categoryDir)) {
    const files = fs.readdirSync(categoryDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    if (files.length > 0) imgDir = { dir: categoryDir, cat: topic.category, files }
  }
  if (!imgDir && fs.existsSync(techDir)) {
    const files = fs.readdirSync(techDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    if (files.length > 0) {
      console.log(`   ⚠️  No images for category "${topic.category}" — using technical fallback`)
      imgDir = { dir: techDir, cat: 'technical', files }
    }
  }

  if (imgDir) {
    // Shuffle and pick 4, referencing them directly (no file copy needed)
    const shuffle = arr => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }
    const picked = shuffle(imgDir.files).slice(0, 4)
    // Wrap around if fewer than 4 images available
    while (picked.length < 4) picked.push(picked[picked.length - 1])

    const toUrl = filename => `/images/pre-generated/${imgDir.cat}/${filename}`

    console.log(`   ✓ Selected 4 images from pre-generated pool`)
    return {
      hero: { url: toUrl(picked[0]), heroUrl: toUrl(picked[0]), alt: `${topic.title} — SpeedUp Infotech Pune`, credit: 'SpeedUp Infotech' },
      body: picked.slice(1).map(f => ({ url: toUrl(f), heroUrl: toUrl(f), alt: `${topic.title} — SpeedUp Infotech Pune`, credit: 'SpeedUp Infotech' })),
    }
  }

  // Ultimate fallback — no pre-generated images at all
  console.log(`   ⚠️  No pre-generated images found! Using remote Unsplash fallback.`)
  const heroUrl = UNSPLASH_HERO_FALLBACKS[topic.category] || UNSPLASH_HERO_FALLBACKS['technical']
  return {
    hero: { url: heroUrl, heroUrl, alt: topic.title, credit: 'Unsplash' },
    body: FALLBACK_POOL.slice(0, 3).map(u => ({ url: u, heroUrl: u, alt: topic.title, credit: 'Unsplash' })),
  }
}


// ── STEP 4: WRITE BLOG POST (2 calls = ~2000 words) ──────────
async function writePost(topic, images, state) {
  console.log('\n✍️  Step 4: Writing 2000-word blog post...')

  const isTrending = topic.category === 'trending-ai'
  const today      = new Date().toISOString().split('T')[0]
  const author     = pickAuthor(state)

  const system = `You are ${author.name}, a ${author.bio}. You specialise in ${author.specialty}. You write practical, people-first blog content for SpeedUp Infotech students in Pune.
Your draft should be highly humanized, written at a 10th-grade English reading level, and useful before it is promotional:
- Use a conversational, friendly, and highly humanized tone. Avoid robotic AI buzzwords like "unleash," "landscape," "realm," "delve," "tapestry," "moreover," and "furthermore."
- Write short, punchy sentences. Break up long paragraphs. Explain technical ideas clearly with examples a fresher can easily understand.
- Mention real Pune IT areas and companies only as general job-market context.
- Do not invent source names, exact survey numbers, company adoption stories, ratings, placements, or salary guarantees.
- Use cautious wording for salaries and hiring demand unless a source URL is included.
- Include trainer-style experience from ${author.background}, but keep it credible and specific to classroom guidance.
- Always write for Pune context: Shivaji Nagar, FC Road, Hinjewadi, Deccan, Baner.`

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

CRITICAL RULES FOR PEOPLE-FIRST SEO:
- MINIMUM 1000 words for Part 1 — write fully detailed paragraphs, never cut short
- Each section must have AT LEAST 3 full paragraphs
- Write like an expert practitioner — specific, authoritative, experience-based
- NO bullet points in main sections — only flowing paragraphs
- EXPERIENCE: Include phrases like "In our experience training 500+ students at SpeedUp Infotech..."
- EXPERTISE: Use specific technical terms, version numbers, real tool names (GitHub Copilot, Cursor AI, ChatGPT-4o etc.)
- AUTHORITY: Only cite a source if you can name a real source URL later in the article. Do not invent exact survey numbers.
- TRUST: Give salary ranges as estimates with assumptions, not promises.
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
Write as ${author.name}, not a different trainer. Include small batches, real project portfolio, placement preparation, ${ADDR}, and call ${PHONE}. Do not invent placement company names, ratings, or guaranteed packages.

## Frequently Asked Questions

**Q: ${isTrending ? `How is this topic changing IT jobs in Pune in 2026?` : `How long does it take to learn ${topic.keyword.split(' ')[0]} from scratch?`}**
A: Write 3-4 detailed sentences here. Use cautious salary or demand language. Mention that readers should verify current openings on LinkedIn Jobs or company career pages.

**Q: ${isTrending ? 'Which Pune companies are actively hiring for this skill in 2026?' : `Is ${topic.keyword.split(' ').slice(0,3).join(' ')} worth learning for freshers in Pune?`}**
A: Write 3-4 sentences here naming specific Pune companies as examples of employers. Do not claim they are currently hiring for this exact skill; frame it as something readers should verify on company career pages.

**Q: Does SpeedUp Infotech cover this in their courses?**
A: Yes, SpeedUp Infotech at Shivaji Nagar, Pune covers this comprehensively with hands-on projects and real industry assignments. Our students have gone on to work at companies like Persistent Systems, Zensar Technologies, and Cybage. Call ${PHONE} to know the latest batch schedule.

**Q: What is the realistic salary for a fresher with this skill in Pune?**
A: Write 3-4 sentences here with broad salary ranges for freshers, 1-2 years experience, and 3-5 years experience. Explain what factors affect the salary — company size, specific skills, project portfolio, and interview performance.

Write a 120-word conclusion here. Summarize key insights. Include "${topic.keyword}" naturally. End with a strong CTA mentioning a free demo class and limited seats.

Book a free demo class at SpeedUp Infotech, ${ADDR} — call ${PHONE}. New batch starting soon — limited seats.

CRITICAL RULES FOR PEOPLE-FIRST SEO:
- MINIMUM 1000 words for Part 2
- Do not claim specific SpeedUp placements, Justdial ratings, or packages unless they are verified in the source guide.
- TRUST: Salary claims must be broad estimates with assumptions, never guarantees
- AUTHORITY: Do not fake citations. Mention sources only as places readers can verify current data unless you include a real URL.
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
function sourceGuideForTopic(topic) {
  const text = `${topic.title} ${topic.keyword} ${topic.category}`.toLowerCase()
  const selected = TRUSTED_SOURCE_GUIDE.filter(source => {
    const scope = `${source.name} ${source.useWhen}`.toLowerCase()
    return text.includes('react') && scope.includes('react')
      || text.includes('salary') && scope.includes('salary')
      || text.includes('career') && /salary|jobs|nasscom|stackoverflow/i.test(scope)
      || text.includes('ai') && /nasscom|stackoverflow|jobs/i.test(scope)
      || text.includes('ml') && /nasscom|stackoverflow|jobs/i.test(scope)
  })

  const fallback = TRUSTED_SOURCE_GUIDE.filter(source =>
    ['Stack Overflow Developer Survey', 'LinkedIn Jobs', 'Glassdoor India'].includes(source.name)
  )

  return [...new Map([...(selected.length ? selected : fallback), ...fallback].map(source => [source.name, source])).values()]
}

function stripModelFences(text) {
  return text
    .replace(/^```(?:md|markdown)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

function normalizeEditorialText(text) {
  return stripModelFences(text)
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/â€”/g, '-')
    .replace(/â€“/g, '-')
    .replace(/â˜…/g, 'star')
    .replace(/ðŸ[^\s]*/g, '')
    .trim()
}

function contentQualityIssues(content, topic) {
  const issues = []
  const plain = content.replace(/```[\s\S]*?```/g, '')
  const wordCount = plain.split(/\s+/).filter(Boolean).length

  if (wordCount < 1200) issues.push(`Article is too short after editing (${wordCount} words).`)
  if (!/^#\s+/m.test(content)) issues.push('Missing one H1 title.')
  if (!/## Frequently Asked Questions/i.test(content)) issues.push('Missing FAQ section.')
  if (!REQUIRED_SOURCE_SECTION.test(content)) issues.push('Missing "Sources and further reading" section.')
  if (!/https?:\/\//i.test(content)) issues.push('No source URLs found.')
  if (!/SpeedUp Infotech/i.test(content)) issues.push('Missing SpeedUp Infotech context.')

  for (const { label, regex } of BLOCKED_CONTENT_PATTERNS) {
    if (regex.test(content)) issues.push(label)
  }

  if (/according to/i.test(content) && !/https?:\/\//i.test(content)) {
    issues.push('Uses "according to" language without source URLs.')
  }

  if (/\b(?:guaranteed|guarantees|100% placement guarantee|assured job)\b/i.test(content)) {
    issues.push('Contains placement or job guarantee language.')
  }

  if (/\bReact\s+19\b/i.test(`${topic.title} ${topic.keyword}`) && !/2024\/12\/05\/react-19/i.test(content)) {
    issues.push('React 19 article must link the official December 5, 2024 release notes.')
  }

  const speedupMentions = (plain.match(/SpeedUp Infotech/gi) || []).length
  // Allow up to 15 mentions — H2 headings, FAQ question text, and the dedicated
  // SpeedUp section all legitimately repeat the name; 15 gives the editor room
  // without letting true keyword stuffing through.
  if (speedupMentions > 15) issues.push(`Possible promotional stuffing: SpeedUp Infotech mentioned ${speedupMentions} times.`)

  return issues
}

// Pre-scrub bracket placeholders the model may have echoed verbatim from the prompt.
// These would otherwise trip the "Prompt placeholder leaked" QA check.
function scrubPlaceholders(text) {
  return text
    // Remove lines that are entirely a bracket instruction, e.g. [Write 3-4 sentences...]
    .replace(/^\[.{10,300}\]\s*$/gm, '')
    // Remove inline bracket instructions left mid-paragraph
    .replace(/\[(?:Write|Summarize|Include|Add|Cite|Explain|List|Describe|Answer)[^\]]{5,250}\]/gi, '')
    // Collapse any resulting blank lines created by the removal
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Cap occurrences of a brand name to `maxKeep` in a Markdown string.
 * The first `maxKeep` occurrences are left untouched (case-preserved).
 * Subsequent occurrences are replaced with a rotating set of natural alternatives
 * so the text still reads fluently without the repeated brand name.
 */
function capBrandMentions(text, brand, maxKeep = 8) {
  const alts = ['the institute', 'our training centre', 'the training team', 'the centre']
  let seen = 0
  let altIdx = 0
  const regex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  return text.replace(regex, (match) => {
    seen++
    if (seen <= maxKeep) return match          // keep original capitalisation
    return alts[altIdx++ % alts.length]        // replace excess with natural alternative
  })
}

/**
 * Split a Markdown article into two halves at the H2 heading nearest
 * to the midpoint, so each half can be edited in a separate API call.
 * Falls back to a character-position split if no H2 is found.
 */
function splitAtMidH2(text) {
  const mid = Math.floor(text.length / 2)
  // Find last H2 at or before midpoint
  const before = text.slice(0, mid)
  const lastH2 = before.lastIndexOf('\n## ')
  if (lastH2 !== -1) {
    return [text.slice(0, lastH2).trim(), text.slice(lastH2).trim()]
  }
  // Find first H2 after midpoint
  const after = text.slice(mid)
  const nextH2 = after.indexOf('\n## ')
  if (nextH2 !== -1) {
    const splitIdx = mid + nextH2
    return [text.slice(0, splitIdx).trim(), text.slice(splitIdx).trim()]
  }
  // No H2 found — split at midpoint on a newline
  const newline = text.slice(mid).indexOf('\n')
  const idx = newline !== -1 ? mid + newline : mid
  return [text.slice(0, idx).trim(), text.slice(idx).trim()]
}

async function humanizeAndFactCheckPost(topic, draftBody, state) {
  console.log('\nStep 5: Humanizing and fact-checking draft (split-call mode)...')

  const author = pickAuthor(state)
  const sourceGuide = sourceGuideForTopic(topic)

  // Pre-scrub bracket placeholders and cap brand mentions on the raw draft
  let draft = capBrandMentions(scrubPlaceholders(draftBody), 'SpeedUp Infotech', 8)

  const sourceText = sourceGuide.map(source =>
    `- ${source.name}: ${source.url}\n  Use when: ${source.useWhen}\n  Facts: ${source.facts.join(' ')}`
  ).join('\n')

  // Build the shared editorial instruction block (sent with every half)
  const editInstructions = `You are a strict senior editor, SEO reviewer, and fact-checker for SpeedUp Infotech.
Return ONLY the edited Markdown. Do not add frontmatter. Do not explain changes.

Topic: ${topic.title}
Primary keyword: ${topic.keyword}
Author persona: ${author.name} — ${author.specialty}
Location: ${ADDR}

Trusted sources:
${sourceText}

Rules:
${HUMAN_REVIEW_RULES.map(r => `- ${r}`).join('\n')}
- NEVER shorten or delete any section. Only rewrite for tone, clarity, and accuracy.
- CAGR / MARKET-SIZE: If a sentence pairs a growth claim with a source name (NASSCOM, LinkedIn, Glassdoor) without a real URL, rewrite it as a general observation.
- PLACEHOLDER: Replace any text in square brackets with real written content.
- Fact-check: do not invent statistics, ratings, placement outcomes, or salary guarantees.`

  // ── Split edit: Part A then Part B ───────────────────────────────────────────
  // Each half is ~1200 words / ~1600 tokens in + 1800 max out = ~3400 tokens per call.
  // This keeps every call well under Groq's 6,000 TPM free-tier limit.
  const [halfA, halfB] = splitAtMidH2(draft)
  console.log(`   Editing Part A (~${halfA.split(/\s+/).length} words)...`)

  const editedA = normalizeEditorialText(await groq(
    editInstructions,
    `Edit this FIRST HALF of the article. Do not add a conclusion — that is in Part B.\n\n${halfA}`,
    MODEL_WRITE, 3, 2200
  ))

  console.log('   ⏸️  Pausing 15s between halves...')
  await new Promise(r => setTimeout(r, 15000))

  console.log(`   Editing Part B (~${halfB.split(/\s+/).length} words)...`)
  const editedB = normalizeEditorialText(await groq(
    editInstructions,
    `Edit this SECOND HALF of the article. This half must contain the FAQ, SpeedUp Infotech section, and conclusion.\n\n${halfB}`,
    MODEL_WRITE, 3, 2200
  ))

  // Rejoin and run all QA checks on the full article
  let edited = capBrandMentions(
    scrubPlaceholders(`${editedA}\n\n${editedB}`),
    'SpeedUp Infotech', 10
  )

  const issues = contentQualityIssues(edited, topic)
  if (issues.length === 0) {
    console.log('   Editorial QA passed')
    return { fullBody: edited, qaIssues: [], qaPassed: true }
  }

  // One repair pass if QA fails
  console.log(`   QA issues found: ${issues.join('; ')}`)
  console.log('   Running repair pass...')

  await new Promise(r => setTimeout(r, 15000))

  const repairPrompt = `The following article has these QA problems that must be fixed:\n- ${issues.join('\n- ')}\n\nFix every issue. Return the complete corrected Markdown article.\n\n${edited}`
  edited = capBrandMentions(
    scrubPlaceholders(normalizeEditorialText(await groq(
      editInstructions, repairPrompt, MODEL_WRITE, 3, 4000
    ))),
    'SpeedUp Infotech', 10
  )

  const finalIssues = contentQualityIssues(edited, topic)
  if (finalIssues.length === 0) {
    console.log('   Editorial QA passed on repair attempt')
    return { fullBody: edited, qaIssues: [], qaPassed: true }
  }

  throw new Error(`Content QA failed. Not publishing: ${finalIssues.join('; ')}`)
}

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

  const escapeQuote = (str) => (str || '').replace(/"/g, '\\"');

  const frontmatter = `---
title: "${escapeQuote(topic.title)}"
slug: "${topic.slug}"
description: "${escapeQuote(description)}"
date: "${today}"
lastUpdated: "${today}"
author: "${escapeQuote(author.name)}"
authorBio: "${escapeQuote(author.bio)}"
category: "${topic.category === 'trending-ai' ? 'AI & Tech Trends' : topic.category === 'career' ? 'IT Careers' : topic.category === 'comparison' ? 'Course Comparison' : 'IT Guide'}"
tags: ["IT Training Pune", "SpeedUp Infotech", "${escapeQuote(topic.keyword)}"]
keywords: ["${escapeQuote(topic.keyword)}", "IT courses Pune", "SpeedUp Infotech Pune", "IT training Shivaji Nagar"]
heroImage: "${heroUrl}"
heroImageAlt: "${escapeQuote(topic.title)} — SpeedUp Infotech Pune"
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
  if (GROQ_KEYS.length > 1) {
    console.log(`   ✓ ${GROQ_KEYS.length} Groq API keys loaded — key rotation enabled`)
  }

  const state = loadState()

  // 1. Research fresh trending keywords
  const topics = await researchKeywords(state)

  // 2. Pick best unused topic
  const topic = pickTopic(topics, state)

  // 3. Fetch relevant images
  const images = await getImages(topic, state)

  // 4. Write 2000-word post
  const { fullBody: draftBody, totalWords, today } = await writePost(topic, images, state)

  // Cooldown: let the token bucket refill after two 1800-token write calls.
  // 45s recovers ~4500 tokens at 6000 TPM, enough for both split edit calls.
  console.log('\n   ⏸️  Cooling down 45s before editorial pass...')
  await new Promise(r => setTimeout(r, 45000))

  // 5. Humanize, fact-check, and quality-gate the post before publishing
  const { fullBody, qaPassed } = await humanizeAndFactCheckPost(topic, draftBody, state)

  // 6. Build MDX
  const content  = buildMdx(topic, images, fullBody, today, state)
  const finalWc  = content.split(/\s+/).length

  // 7. Save file
  const filename = saveMdx(topic, content)

  // 8. Update sitemap
  updateSitemap(topic.slug)

  // 9. Save social content
  saveSocialContent(topic)

  // 10. Update state
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
    qaPassed,
  })
  state.total   = (state.total || 0) + 1
  state.lastRun = new Date().toISOString()
  saveState(state)

  // 11. Git push
  gitPush(topic.slug, filename)

  // 12. Ping search engines
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
