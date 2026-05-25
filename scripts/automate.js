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

// ── GROQ ──────────────────────────────────────────────────────
async function groq(system, user, model = 'llama-3.3-70b-versatile') {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set in GitHub Secrets')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens:  3000,
      temperature: 0.75,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Groq returned empty response')
  return text
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

  const used    = state.usedKeywords?.slice(-40).join(', ') || 'none yet'
  const covered = state.publishedPosts?.map(p => p.title).slice(-10).join(', ') || 'none yet'
  const today   = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const text = await groq(
    `You are an expert SEO strategist and tech industry analyst. You understand the Indian IT job market deeply, especially Pune. You track AI/tech trends and know what developers and students search for.`,

    `Generate 15 high-value blog topic ideas for SpeedUp Infotech, an IT training institute in Pune.

Current month: ${today}
Institute: SpeedUp Infotech, Shivaji Nagar near FC Road, Pune
Courses: MERN Stack, Full Stack, Python Full Stack, Data Analytics, AI & ML, React JS, Python

COVER THESE CATEGORIES (3 topics each):

1. TRENDING AI & TECH NEWS (most important)
   - Latest AI tools developers must know in 2026
   - New framework/technology updates (React 19, Python 3.13, Node.js updates etc)
   - ChatGPT, Claude, Gemini updates for developers
   - GitHub Copilot, Cursor AI, AI coding tools
   - Hot topics: LLMs, RAG, Vector databases, AI agents

2. PUNE IT CAREER & SALARY
   - Current salary trends for specific roles in Pune
   - Which companies are hiring what roles in Pune
   - Interview experience at specific Pune companies

3. COURSE COMPARISONS
   - X vs Y comparisons for courses/technologies
   - Which course gets jobs faster in Pune

4. BEGINNER GUIDES
   - What is [technology] explained for beginners
   - How to start learning [technology] from scratch

5. ADVANCED TECHNICAL
   - Specific technical skills companies want in Pune 2026
   - Project ideas that get you hired

Already covered (DO NOT repeat): ${covered}
Already used keywords (DO NOT repeat): ${used}

Return ONLY valid JSON array of 15 objects:
[
  {
    "title": "exact engaging blog title",
    "keyword": "primary SEO keyword phrase",
    "slug": "url-friendly-slug",
    "category": "trending-ai|career|comparison|beginner|technical",
    "imageQuery": "3-4 word Pexels search query for relevant photo",
    "priority": 1-5
  }
]

Make titles specific and clickable. Include year 2026. Prioritize trending AI topics.`
  )

  try {
    const match   = text.match(/\[[\s\S]*\]/)
    const topics  = JSON.parse(match[0])
    const sorted  = topics.sort((a, b) => a.priority - b.priority)
    console.log(`   ✓ ${sorted.length} trending topics researched`)
    console.log(`   Top topic: "${sorted[0].title}"`)
    return sorted
  } catch (e) {
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
async function fetchImage(query, fallbackUrl, fallbackAlt) {
  // Words that signal irrelevant photos
  const BAD_KW = ['electrical','circuit','electronic','wiring','mechanic','inverter','voltage','smps','solar','engine','factory','construction','medical','hospital','cooking','food','nature','animal','welding','soldering']
  const isRelevant = p => !BAD_KW.some(kw => (p.alt||'').toLowerCase().includes(kw))

  // Try Pexels — always append "software" for IT relevance
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      const safeQuery = `${query} software`
      const res  = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      )
      const data = await res.json()
      const good = (data.photos || []).filter(isRelevant)
      if (good.length) {
        const p = good[0]
        return { url: p.src.large, heroUrl: p.src.large2x || p.src.large, alt: p.alt || query, credit: `Photo by ${p.photographer} on Pexels` }
      }
    } catch {}
  }

  // Try Unsplash
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (unsplashKey) {
    try {
      const res  = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      )
      const data = await res.json()
      if (data.results?.length) {
        const p = data.results[0]
        return { url: `${p.urls.regular}&w=800&q=80`, heroUrl: `${p.urls.regular}&w=1200&h=630&fit=crop&q=80`, alt: p.alt_description || query, credit: `Photo by ${p.user.name} on Unsplash` }
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

async function getImages(topic, state) {
  console.log('\n📸 Step 3: Fetching topic-matched images...')
  const q     = topic.imageQuery || 'technology coding laptop'
  const fbUrl = FALLBACK_POOL[(state.total || 0) % FALLBACK_POOL.length]

  // Different queries for hero and 3 body images
  const heroImg  = await fetchImage(q, fbUrl, topic.title)
  const bodyImg1 = await fetchImage(`${q} professional`, FALLBACK_POOL[(state.total + 1) % FALLBACK_POOL.length], topic.keyword)
  const bodyImg2 = await fetchImage(`${q} career`, FALLBACK_POOL[(state.total + 2) % FALLBACK_POOL.length], topic.keyword)
  const bodyImg3 = await fetchImage(`IT training students laptop`, FALLBACK_POOL[(state.total + 3) % FALLBACK_POOL.length], 'SpeedUp Infotech Pune')

  console.log(`   ✓ Hero:   ${heroImg.credit}`)
  console.log(`   ✓ Body 1: ${bodyImg1.credit}`)
  console.log(`   ✓ Body 2: ${bodyImg2.credit}`)
  console.log(`   ✓ Body 3: ${bodyImg3.credit}`)

  return { hero: heroImg, body: [bodyImg1, bodyImg2, bodyImg3] }
}

// ── STEP 4: WRITE BLOG POST (2 calls = ~2000 words) ──────────
async function writePost(topic, images) {
  console.log('\n✍️  Step 4: Writing 2000-word blog post...')

  const isTrending = topic.category === 'trending-ai'
  const today      = new Date().toISOString().split('T')[0]

  const system = `You are an expert SEO content writer and tech journalist for SpeedUp Infotech, a top IT training institute in Pune at Jangali Maharaj Road, ${ADDR}. You write detailed, educational blog content that ranks on Google and gets cited by AI tools like ChatGPT and Perplexity. You explain technical concepts clearly with real examples. Always connect tech topics to career opportunities and salary in Pune.`

  // CALL 1 — First 1000 words
  console.log('   Writing Part 1 (~1000 words)...')
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

CRITICAL RULES:
- MINIMUM 1000 words for Part 1 — write fully detailed paragraphs, never cut short
- Each section must have AT LEAST 3 full paragraphs (not 1-2 sentences)
- Write like a journalist — detailed, specific, authoritative
- NO bullet points in main sections — only flowing paragraphs
- Mention SpeedUp Infotech 2 times naturally
- Mention Pune 4-5 times (Shivaji Nagar, FC Road, Hinjewadi, Deccan)
- Include specific salary data Rs X-Y LPA with reasoning
- Do NOT write a conclusion
- Do NOT include FAQ yet
- Do NOT include image tags
- Start directly with # ${topic.title}`)

  console.log(`   ✓ Part 1: ~${part1.split(/\s+/).length} words`)

  // CALL 2 — Second 1000 words
  console.log('   Writing Part 2 (~1000 words)...')
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
Hands-on curriculum, real projects, 100% placement support, ${ADDR}, batch options, call ${PHONE}.

## Frequently Asked Questions

**Q: ${isTrending ? `How is ${topic.title.split(' ')[0]} ${topic.title.split(' ')[1]} changing IT jobs in Pune?` : `How long does it take to master ${topic.keyword.split(' ')[0]}?`}**
A: [3 detailed sentences with specific numbers and Pune context]

**Q: ${isTrending ? 'Do I need to know this to get hired at Pune IT companies in 2026?' : `Is ${topic.keyword.split(' ').slice(0,3).join(' ')} worth learning in Pune 2026?`}**
A: [3 sentences mentioning specific Pune companies and salary ranges Rs X-Y LPA]

**Q: Does SpeedUp Infotech cover this in their courses?**
A: Yes, SpeedUp Infotech at Shivaji Nagar, Pune covers this comprehensively in their curriculum with hands-on projects and real industry assignments. Students get placement support with companies across Pune offering packages from Rs 3.5-10 LPA. Call ${PHONE} to know the latest batch schedule.

**Q: What is the salary for someone with this skill in Pune?**
A: [3 sentences with specific salary ranges for freshers, mid-level, and senior professionals in Pune]

[Conclusion — 100 words: Summarize. Include "${topic.keyword}". Strong call to action.]

Book a free demo class at SpeedUp Infotech, ${ADDR} — call ${PHONE}

CRITICAL RULES:
- MINIMUM 1000 words for Part 2 — every section must be fully detailed
- Each section needs AT LEAST 3-4 full paragraphs
- FAQ answers must be 3-4 sentences each, detailed and specific
- Conclusion must be at least 100 words
- NO bullet points — flowing paragraphs only
- Do NOT repeat H1 title
- Do NOT include image tags
- Do NOT use --- frontmatter`)

  console.log(`   ✓ Part 2: ~${part2.split(/\s+/).length} words`)

  const fullBody   = `${part1}\n\n${part2}`
  const totalWords = fullBody.split(/\s+/).length
  console.log(`   ✓ Total: ~${totalWords} words`)

  return { fullBody, totalWords, today }
}

// ── STEP 5: BUILD FINAL MDX ───────────────────────────────────
function buildMdx(topic, images, fullBody, today) {
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

  const frontmatter = `---
title: "${topic.title}"
slug: "${topic.slug}"
description: "${description}"
date: "${today}"
author: "SpeedUp Infotech"
category: "${topic.category === 'trending-ai' ? 'AI & Tech Trends' : topic.category === 'career' ? 'IT Careers' : topic.category === 'comparison' ? 'Course Comparison' : 'IT Guide'}"
tags: ["IT Training Pune", "SpeedUp Infotech", "${topic.keyword}"]
keywords: ["${topic.keyword}", "IT courses Pune", "SpeedUp Infotech Pune", "IT training Shivaji Nagar"]
heroImage: "${heroUrl}"
heroImageAlt: "${topic.title} — SpeedUp Infotech Pune"
canonical: "${SITE}/blog/${topic.slug}"
readTime: "9 min read"
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
  const { fullBody, totalWords, today } = await writePost(topic, images)

  // 5. Build MDX
  const content  = buildMdx(topic, images, fullBody, today)
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
  console.log(`⏰ Next run: Mon/Wed/Fri 6:00 AM IST (automatic)`)
  console.log('══════════════════════════════════════════════════════\n')
}

main().catch(err => { console.error('\n✗ Fatal:', err.message); process.exit(1) })
