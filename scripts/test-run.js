// SpeedUp Infotech — Blog Generator v7
// 2000 words via 2 Groq calls + Pexels images (primary)
// Run:
//   $env:GROQ_API_KEY="gsk_..."
//   $env:PEXELS_API_KEY="your-pexels-key"
//   node scripts/test-run.js

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const BLOG_DIR  = path.join(ROOT, 'content', 'blog')
const STATE     = path.join(__dirname, '.state.json')

// ── PEXELS SEARCH ─────────────────────────────────────────────
// Words that indicate irrelevant photos — reject these
const BAD_KEYWORDS = [
  'electrical', 'circuit', 'electronic', 'wiring', 'mechanic',
  'inverter', 'voltage', 'smps', 'solar', 'battery', 'engine',
  'factory', 'construction', 'medical', 'hospital', 'doctor',
  'cooking', 'food', 'kitchen', 'nature', 'plant', 'animal',
  'repair', 'hardware', 'board', 'soldering', 'welding',
]

function isRelevantPhoto(photo) {
  const text = (photo.alt || '').toLowerCase()
  return !BAD_KEYWORDS.some(kw => text.includes(kw))
}

async function pexelsSearch(query) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  try {
    // Always add "software" or "coding" to ensure IT-relevant results
    const safeQuery = `${query} software`
    const res  = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(safeQuery)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: key } }
    )
    const data = await res.json()
    if (!data.photos?.length) return null

    // Filter out irrelevant photos
    const relevant = data.photos.filter(isRelevantPhoto)
    if (!relevant.length) {
      console.log(`   ⚠️  Pexels returned irrelevant photos — trying fallback`)
      return null
    }

    return relevant.slice(0, 3).map(p => ({
      url:     p.src.large,
      heroUrl: p.src.large2x || p.src.large,
      alt:     p.alt || query,
      credit:  `Photo by ${p.photographer} on Pexels`,
    }))
  } catch { return null }
}

// ── UNSPLASH FALLBACK ─────────────────────────────────────────
async function unsplashSearch(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const res  = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    const data = await res.json()
    if (!data.results?.length) return null
    return data.results.map(p => ({
      url:     `${p.urls.regular}&w=800&q=80`,
      heroUrl: `${p.urls.regular}&w=1200&h=630&fit=crop&q=80`,
      alt:     p.alt_description || query,
      credit:  `Photo by ${p.user.name} on Unsplash`,
    }))
  } catch { return null }
}

// ── HARDCODED FALLBACKS per topic ─────────────────────────────
const FALLBACK_IMAGES = {
  'best-it-training-institutes-pune-2026': {
    hero: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=450&fit=crop&q=80', alt: 'Students learning programming at IT institute' },
      { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop&q=80', alt: 'Developer coding on laptop' },
      { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80', alt: 'Students collaborating on project' },
    ],
  },
  'mern-stack-salary-pune-freshers-2026': {
    hero: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop&q=80', alt: 'JavaScript MERN stack developer' },
      { url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=450&fit=crop&q=80', alt: 'Web developer coding' },
      { url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop&q=80', alt: 'Career growth salary' },
    ],
  },
  'how-to-get-it-job-pune-after-engineering': {
    hero: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=450&fit=crop&q=80', alt: 'Job interview preparation' },
      { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop&q=80', alt: 'Professional writing resume' },
      { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=450&fit=crop&q=80', alt: 'Software development team' },
    ],
  },
  'python-full-stack-vs-mern-stack-pune': {
    hero: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=450&fit=crop&q=80', alt: 'Python programming code' },
      { url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop&q=80', alt: 'JavaScript web development' },
      { url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=450&fit=crop&q=80', alt: 'Programming comparison' },
    ],
  },
  'top-it-companies-hiring-freshers-pune-2026': {
    hero: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop&q=80', alt: 'Modern IT company office' },
      { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=450&fit=crop&q=80', alt: 'Tech team collaboration' },
      { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop&q=80', alt: 'IT professionals working' },
    ],
  },
  'data-analytics-course-pune-career-guide': {
    hero: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&q=80', alt: 'Data analytics charts' },
      { url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=450&fit=crop&q=80', alt: 'Business intelligence dashboard' },
      { url: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&h=450&fit=crop&q=80', alt: 'Data analyst working' },
    ],
  },
  'full-stack-developer-salary-pune-2026': {
    hero: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=450&fit=crop&q=80', alt: 'Full stack developer coding' },
      { url: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=450&fit=crop&q=80', alt: 'Multiple monitors code' },
      { url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop&q=80', alt: 'IT career salary growth' },
    ],
  },
  'what-is-mern-stack-beginners-guide-pune-2026': {
    hero: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop&q=80', alt: 'Beginner learning web development' },
      { url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop&q=80', alt: 'JavaScript code screen' },
      { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop&q=80', alt: 'Student coding project' },
    ],
  },
  'data-analytics-vs-data-science-pune': {
    hero: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=80', alt: 'Data analytics dashboard' },
      { url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop&q=80', alt: 'Machine learning concept' },
      { url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=450&fit=crop&q=80', alt: 'Data science comparison' },
    ],
  },
  'react-js-course-pune-guide-2026': {
    hero: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=450&fit=crop&q=80', alt: 'React JavaScript development' },
      { url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop&q=80', alt: 'Frontend developer React' },
      { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=450&fit=crop&q=80', alt: 'Students learning React JS' },
    ],
  },
  'ai-machine-learning-course-pune-2026': {
    hero: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=450&fit=crop&q=80', alt: 'Artificial intelligence concept' },
      { url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop&q=80', alt: 'Python machine learning code' },
      { url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=450&fit=crop&q=80', alt: 'Data scientist AI models' },
    ],
  },
  'it-courses-after-engineering-pune-2026': {
    hero: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&q=80',
    body: [
      { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=450&fit=crop&q=80', alt: 'Engineering graduate IT career' },
      { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=450&fit=crop&q=80', alt: 'IT training engineering graduates' },
      { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80', alt: 'Students learning IT skills' },
    ],
  },
}

// ── IMAGE QUERY MAP ───────────────────────────────────────────
const IMAGE_QUERIES = {
  'best-it-training-institutes-pune-2026':       { hero: 'coding bootcamp students laptops classroom', body: ['programming students computers', 'software training class', 'developer learning laptop'] },
  'mern-stack-salary-pune-freshers-2026':        { hero: 'javascript web developer coding', body: ['nodejs mongodb developer', 'web development salary career', 'software engineer office'] },
  'how-to-get-it-job-pune-after-engineering':    { hero: 'job interview professional', body: ['resume laptop job application', 'software engineer hired', 'IT career success'] },
  'python-full-stack-vs-mern-stack-pune':        { hero: 'python programming code screen', body: ['javascript react code', 'programming comparison laptop', 'developer choosing technology'] },
  'top-it-companies-hiring-freshers-pune-2026':  { hero: 'modern tech company office', body: ['office team technology', 'startup hiring developers', 'IT professionals working'] },
  'data-analytics-course-pune-career-guide':     { hero: 'data analytics dashboard charts', body: ['business intelligence charts', 'data visualization screen', 'analyst laptop data'] },
  'full-stack-developer-salary-pune-2026':       { hero: 'full stack developer code laptop', body: ['developer dual monitor', 'coding career growth', 'software engineer desk'] },
  'what-is-mern-stack-beginners-guide-pune-2026':{ hero: 'web development beginner laptop', body: ['javascript nodejs code', 'mongodb database developer', 'react frontend code'] },
  'data-analytics-vs-data-science-pune':         { hero: 'data science machine learning', body: ['data analytics tools charts', 'python data analysis', 'machine learning code'] },
  'react-js-course-pune-guide-2026':             { hero: 'react javascript frontend code', body: ['html css javascript', 'frontend developer laptop', 'web app development'] },
  'ai-machine-learning-course-pune-2026':        { hero: 'artificial intelligence technology', body: ['machine learning algorithm', 'AI neural network digital', 'python deep learning'] },
  'it-courses-after-engineering-pune-2026':      { hero: 'software developer coding laptop office', body: ['programming student computer science', 'web development coding screen', 'IT professional working laptop'] },
}

const TOPICS = [
  { title: 'Best IT Training Institutes in Pune 2026', keyword: 'best IT training institute in Pune', slug: 'best-it-training-institutes-pune-2026', type: 'listicle' },
  { title: 'MERN Stack Developer Salary in Pune for Freshers 2026', keyword: 'MERN stack salary Pune freshers', slug: 'mern-stack-salary-pune-freshers-2026', type: 'salary' },
  { title: 'How to Get an IT Job in Pune After Engineering', keyword: 'how to get IT job Pune after engineering', slug: 'how-to-get-it-job-pune-after-engineering', type: 'guide' },
  { title: 'Python Full Stack vs MERN Stack — Which is Better in Pune?', keyword: 'Python full stack vs MERN stack Pune', slug: 'python-full-stack-vs-mern-stack-pune', type: 'comparison' },
  { title: 'Top IT Companies Hiring Freshers in Pune 2026', keyword: 'IT companies hiring freshers Pune 2026', slug: 'top-it-companies-hiring-freshers-pune-2026', type: 'listicle' },
  { title: 'Data Analytics Course in Pune — Complete Career Guide', keyword: 'data analytics course Pune', slug: 'data-analytics-course-pune-career-guide', type: 'guide' },
  { title: 'Full Stack Developer Salary in Pune 2026', keyword: 'full stack developer salary Pune', slug: 'full-stack-developer-salary-pune-2026', type: 'salary' },
  { title: 'What is MERN Stack? Beginner Guide for Pune Students', keyword: 'what is MERN stack beginners Pune', slug: 'what-is-mern-stack-beginners-guide-pune-2026', type: 'beginner' },
  { title: 'Data Analytics vs Data Science — Which Course in Pune?', keyword: 'data analytics vs data science Pune', slug: 'data-analytics-vs-data-science-pune', type: 'comparison' },
  { title: 'React JS Course in Pune — Complete Guide 2026', keyword: 'React JS course Pune', slug: 'react-js-course-pune-guide-2026', type: 'guide' },
  { title: 'AI and Machine Learning Course in Pune 2026', keyword: 'AI ML course Pune', slug: 'ai-machine-learning-course-pune-2026', type: 'guide' },
  { title: 'IT Courses After Engineering in Pune 2026', keyword: 'IT courses after engineering Pune', slug: 'it-courses-after-engineering-pune-2026', type: 'listicle' },
]

// ── GROQ ──────────────────────────────────────────────────────
async function groq(systemPrompt, userPrompt, model = 'llama-3.3-70b-versatile') {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens:  3000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

// ── STATE ─────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')) }
  catch { return { usedSlugs: [], total: 0 } }
}
function saveState(s) { fs.writeFileSync(STATE, JSON.stringify(s, null, 2)) }

function pickTopic() {
  const state = loadState()
  const avail = TOPICS.filter(t => !(state.usedSlugs || []).includes(t.slug))
  if (avail.length === 0) { saveState({ usedSlugs: [], total: 0 }); return TOPICS[0] }
  return avail[Math.floor(Math.random() * avail.length)]
}

function injectImages(body, images) {
  let count = 0
  return body.replace(/^(## .+)$/gm, match => {
    count++
    const idx = count === 2 ? 0 : count === 4 ? 1 : count === 6 ? 2 : -1
    if (idx >= 0 && images[idx]) {
      const img = images[idx]
      return `${match}\n\n![${img.alt}](${img.url})\n*${img.credit || img.alt}*\n`
    }
    return match
  })
}

// ── FETCH IMAGES ──────────────────────────────────────────────
async function getImage(query, fallbackUrl, fallbackAlt) {
  // Try Pexels first
  const pexels = await pexelsSearch(query)
  if (pexels?.[0]) return { ...pexels[0], url: pexels[0].url, heroUrl: pexels[0].heroUrl }

  // Try Unsplash
  const unsplash = await unsplashSearch(query)
  if (unsplash?.[0]) return { ...unsplash[0] }

  // Use hardcoded fallback
  return { url: fallbackUrl, heroUrl: fallbackUrl, alt: fallbackAlt, credit: 'Unsplash' }
}

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log('\n════════════════════════════════════════════════')
  console.log('  SpeedUp Infotech — Blog Generator v7')
  console.log('  2000 words · Pexels primary · Unsplash fallback')
  console.log('════════════════════════════════════════════════\n')

  if (!process.env.GROQ_API_KEY) {
    console.error('✗ GROQ_API_KEY not set!\n')
    console.log('  $env:GROQ_API_KEY="gsk_your_key_here"')
    process.exit(1)
  }

  const hasPexels   = !!process.env.PEXELS_API_KEY
  const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY
  console.log(`✓ Groq key found`)
  console.log(`✓ Images: ${hasPexels ? 'Pexels (primary)' : hasUnsplash ? 'Unsplash' : 'Hardcoded fallback'}`)

  const state   = loadState()
  const topic   = pickTopic()
  const fb      = FALLBACK_IMAGES[topic.slug]
  const queries = IMAGE_QUERIES[topic.slug]
  const today   = new Date().toISOString().split('T')[0]
  const used    = state.usedSlugs || []

  console.log(`✓ Topic: "${topic.title}"`)
  console.log(`✓ Remaining: ${TOPICS.filter(t => !used.includes(t.slug)).length - 1} topics after this\n`)

  // Fetch all 4 images
  console.log('Fetching images from Pexels...')
  const heroImg  = await getImage(queries.hero,    fb.hero,      topic.title)
  const bodyImg0 = await getImage(queries.body[0], fb.body[0].url, fb.body[0].alt)
  const bodyImg1 = await getImage(queries.body[1], fb.body[1].url, fb.body[1].alt)
  const bodyImg2 = await getImage(queries.body[2], fb.body[2].url, fb.body[2].alt)
  const heroUrl  = heroImg.heroUrl || heroImg.url

  console.log(`✓ Hero: ${heroImg.credit || 'fallback'} — "${queries.hero}"`)
  console.log(`✓ Body 1: ${bodyImg0.credit || 'fallback'}`)
  console.log(`✓ Body 2: ${bodyImg1.credit || 'fallback'}`)
  console.log(`✓ Body 3: ${bodyImg2.credit || 'fallback'}\n`)

  const system = `You are an expert SEO content writer for SpeedUp Infotech, a top IT training institute in Pune at Jangali Maharaj Road, Shivaji Nagar near FC Road. Write detailed, educational, keyword-rich content. Always explain technical terms simply. Write in a professional but approachable tone.`

  // ── CALL 1: First 1000 words ──────────────────────────────
  console.log('Writing Part 1 (~1000 words)...')
  const part1 = await groq(system,
    `Write the FIRST HALF of a detailed SEO blog post for SpeedUp Infotech.

Title: ${topic.title}
Primary keyword: ${topic.keyword}
Type: ${topic.type}
Year: 2026

Write these sections with DETAILED content — aim for 1000 words total:

# ${topic.title}

[Introduction - 200 words: Hook the reader. Include primary keyword in first sentence. Explain what they will learn. Mention Pune.]

## What is ${topic.title.split('—')[0].trim()} — Overview
[250 words: Detailed explanation. Use simple language. Real-world analogies.]

## Why It Matters for IT Careers in Pune
[250 words: Pune job market context. Mention Shivaji Nagar, FC Road, Hinjewadi. Salary data Rs X-Y LPA. Specific companies.]

## Key Details and Breakdown
[300 words: Deep dive. Specific facts, numbers, comparisons. Mention SpeedUp Infotech twice.]

CRITICAL RULES:
- MINIMUM 1000 words — write fully detailed paragraphs, never cut short
- Each section needs AT LEAST 3 full paragraphs (not 1-2 short sentences)
- Write like a journalist — detailed, specific, authoritative
- NO bullet points in main sections — flowing paragraphs only
- Do NOT write a conclusion
- Do NOT include FAQ yet
- Do NOT include image tags
- Do NOT use --- frontmatter`)

  console.log(`   ✓ Part 1: ~${part1.split(/\s+/).length} words`)

  // ── CALL 2: Second 1000 words ─────────────────────────────
  console.log('Writing Part 2 (~1000 words)...')
  const part2 = await groq(system,
    `Continue writing the SECOND HALF of a blog post about "${topic.title}" for SpeedUp Infotech in Pune.

Primary keyword: ${topic.keyword}
Year: 2026

Write these sections with DETAILED content — aim for 1000 words total:

## Career Scope and Salary in Pune 2026
[250 words: Detailed salary ranges Rs X-Y LPA. List specific Pune companies — TCS, Infosys, Wipro, Persistent, Cognizant, Tech Mahindra. Job roles available. Growth trajectory.]

## Step-by-Step Guide to Getting Started
[250 words: Concrete action steps. What to learn first, how long it takes, what projects to build.]

## Why Choose SpeedUp Infotech Pune
[200 words: Curriculum details, hands-on projects, placement support, location at Shivaji Nagar near FC Road, batch timing, fee structure, student success stories.]

## Frequently Asked Questions

**Q: ${topic.type === 'salary' ? `What is the average ${topic.keyword} for beginners?` : `How long does it take to learn ${topic.keyword.split(' ')[0]}?`}**
A: [3 sentence detailed answer with specific numbers]

**Q: ${topic.type === 'comparison' ? 'Which option has better job opportunities in Pune?' : `Is ${topic.keyword.split(' ')[0]} in demand in Pune 2026?`}**
A: [3 sentence detailed answer mentioning Pune companies and salary]

**Q: Does SpeedUp Infotech offer placement support?**
A: Yes, SpeedUp Infotech at Shivaji Nagar provides 100% placement support with dedicated placement drives, resume building workshops, and mock interviews. Students have been placed in top companies across Pune including TCS, Infosys, and Persistent Systems with packages ranging from Rs 3.5-8 LPA.

**Q: What is the course fee at SpeedUp Infotech Pune?**
A: [2-3 sentence answer about value for money, EMI options, and contacting SpeedUp Infotech for current pricing]

[Conclusion - 100 words: Summarize key points. Include "${topic.keyword}". Strong CTA.]

Book a free demo class at SpeedUp Infotech, Shivaji Nagar, Pune — call +91-8904581086

RULES:
- Write detailed paragraphs — NO skimping on content
- Do NOT repeat the H1 title
- Do NOT include image tags
- Do NOT use --- frontmatter`
  , 'llama-3.3-70b-versatile')
  console.log(`   ✓ Part 2: ~${part2.split(/\s+/).length} words`)

  // Combine
  const fullBody   = `${part1}\n\n${part2}`
  const totalWords = fullBody.split(/\s+/).length
  console.log(`   ✓ Total body: ~${totalWords} words\n`)

  // Extract description
  const lines      = fullBody.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const description = (lines[0] || topic.title).replace(/[*_`]/g, '').slice(0, 155).trim()

  // Build frontmatter — script writes this, NOT Groq
  const frontmatter = `---
title: "${topic.title}"
slug: "${topic.slug}"
description: "${description}"
date: "${today}"
author: "SpeedUp Infotech"
category: "IT Careers"
tags: ["IT Training Pune", "SpeedUp Infotech", "${topic.keyword}"]
keywords: ["${topic.keyword}", "IT courses Pune", "SpeedUp Infotech Pune"]
heroImage: "${heroUrl}"
heroImageAlt: "${topic.title} — SpeedUp Infotech Pune"
canonical: "https://speedupinfotech.com/blog/${topic.slug}"
readTime: "9 min read"
---`

  // Inject images
  const bodyImages     = [bodyImg0, bodyImg1, bodyImg2]
  const bodyWithImages = injectImages(fullBody, bodyImages)
  const content        = `${frontmatter}\n\n${bodyWithImages}`
  const finalWords     = content.split(/\s+/).length

  // Save
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true })
  fs.writeFileSync(path.join(BLOG_DIR, `${topic.slug}.mdx`), content, 'utf8')

  // Update state
  if (!state.usedSlugs) state.usedSlugs = []
  state.usedSlugs.push(topic.slug)
  state.total = (state.total || 0) + 1
  state.lastRun = new Date().toISOString()
  saveState(state)

  const left = TOPICS.filter(t => !state.usedSlugs.includes(t.slug)).length

  console.log('════════════════════════════════════════════════')
  console.log('✅ DONE!\n')
  console.log(`📄 content/blog/${topic.slug}.mdx`)
  console.log(`📝 Words: ~${finalWords}`)
  console.log(`🖼️  Source: ${hasPexels ? 'Pexels' : hasUnsplash ? 'Unsplash' : 'Hardcoded'}`)
  console.log(`📸 Hero + 3 body images`)
  console.log(`📋 ${left} topics remaining\n`)
  console.log('View:  http://localhost:3000/blog')
  console.log('More:  node scripts/test-run.js')
  console.log('════════════════════════════════════════════════\n')
}

main().catch(err => { console.error('\n✗', err.message); process.exit(1) })
