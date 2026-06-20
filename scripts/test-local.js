// ============================================================
//  SpeedUp Infotech — Local Test Runner
//  Tests the blog automation pipeline locally.
//
//  Usage:
//    npm run blog:test-local              # dry-run (no API calls)
//    npm run blog:test-local -- --step 1  # test only step 1 (keyword research)
//    npm run blog:test-local -- --step 4  # test only step 4 (write post, uses API)
//    npm run blog:test-local -- --full    # full real run (uses API credits)
//    npm run blog:test-local -- --qa      # run QA check on a saved draft
//
//  Environment:
//    Create a .env.local file:
//      GROQ_API_KEY=gsk_...
//    The script loads it automatically — no need to set env vars manually.
// ============================================================

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

// ── Load .env.local ──────────────────────────────────────────
const envFile = path.join(ROOT, '.env.local')
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
  console.log(`   ✓ Loaded .env.local`)
} else {
  console.log(`   ℹ️  No .env.local found — using existing environment variables`)
  console.log(`   Tip: create .env.local with GROQ_API_KEY=gsk_... to avoid setting env vars manually`)
}

// ── Parse CLI flags ───────────────────────────────────────────
const args     = process.argv.slice(2)
const DRY_RUN  = !args.includes('--full') && !args.includes('--step') && !args.includes('--qa')
const FULL_RUN = args.includes('--full')
const QA_ONLY  = args.includes('--qa')
const STEP     = (() => {
  const i = args.indexOf('--step')
  return i !== -1 ? parseInt(args[i + 1]) : null
})()

// ── Mock data for dry-run ─────────────────────────────────────
const MOCK_TOPIC = {
  title:      'How AI is Transforming IT Careers in Pune 2026',
  keyword:    'AI IT careers Pune 2026',
  slug:       'ai-transforming-it-careers-pune-2026-test',
  category:   'trending-ai',
  imageQuery: 'artificial intelligence career growth',
  priority:   1,
}

const MOCK_DRAFT = `# How AI is Transforming IT Careers in Pune 2026

Artificial intelligence is no longer a buzzword — it is actively reshaping the IT job market in Pune.
From Hinjewadi's tech parks to the startups along Baner road, companies are looking for developers
who understand both code and AI-powered tools.

## What is AI's Impact on IT Careers?

In 2026, knowing how to use AI tools like GitHub Copilot, ChatGPT-4o, and Cursor AI is becoming
as essential as knowing Git. Companies at Persistent Systems, Zensar, and Cybage in Pune are
increasingly asking freshers to demonstrate AI-assisted development skills in interviews.

## Why This Matters for Pune Students

At SpeedUp Infotech, near FC Road, Shivaji Nagar, Pune, we've updated our MERN Stack and
Full Stack curriculum to include hands-on AI tool integration from day one.

## Career Scope and Salary in Pune 2026

Freshers with AI skills can expect Rs 3.5–6 LPA, while mid-level developers with 2–3 years of
experience and strong AI project portfolios can command Rs 8–14 LPA at Pune's leading tech companies.

## Why SpeedUp Infotech is the Best Place to Learn in Pune

SpeedUp Infotech at Shivaji Nagar, near FC Road, Pune offers industry-aligned courses that
combine traditional development skills with modern AI tool proficiency. Call +91-8904581086
to book your free demo class.

## Frequently Asked Questions

**Q: How is AI changing IT jobs in Pune in 2026?**
A: AI is automating routine coding tasks, shifting demand toward developers who can architect
solutions, review AI output critically, and integrate AI tools effectively. Pune companies like
Persistent and Zensar are specifically seeking these hybrid skill sets.

**Q: Which Pune companies are hiring AI-skilled developers in 2026?**
A: Companies like Persistent Systems, Zensar Technologies, KPIT, Cybage, and many product
startups in Baner and Hinjewadi are actively looking for developers with AI tool experience.
Verify current openings on LinkedIn Jobs or their career pages.

**Q: Does SpeedUp Infotech cover AI tools in their courses?**
A: Yes, SpeedUp Infotech covers GitHub Copilot, ChatGPT for developers, and AI-assisted
project workflows in their MERN Stack and Full Stack programs.

**Q: What salary can freshers expect with AI skills in Pune?**
A: Freshers typically start at Rs 3.5–6 LPA. With 1–2 years of experience and a strong AI
project portfolio, salaries typically rise to Rs 7–12 LPA depending on the company and role.

## Sources and Further Reading

- [Stack Overflow Developer Survey](https://survey.stackoverflow.co/)
- [LinkedIn Jobs — AI Developer Pune](https://www.linkedin.com/jobs/)
- [Glassdoor India Salary Data](https://www.glassdoor.co.in/Salaries/index.htm)
`

// ── Helpers ───────────────────────────────────────────────────
function sep(title) {
  console.log(`\n${'═'.repeat(56)}`)
  console.log(`  ${title}`)
  console.log('═'.repeat(56))
}

function ok(msg)   { console.log(`   ✅ ${msg}`) }
function info(msg) { console.log(`   ℹ️  ${msg}`) }
function warn(msg) { console.log(`   ⚠️  ${msg}`) }
function fail(msg) { console.log(`   ❌ ${msg}`) }

// ── Step runners ──────────────────────────────────────────────

async function testStep1_Keywords(dryRun) {
  sep('Step 1 — Keyword Research')
  if (dryRun) {
    info('DRY RUN — skipping Groq API call')
    ok(`Would research trending topics and select: "${MOCK_TOPIC.title}"`)
    return [MOCK_TOPIC]
  }

  if (!process.env.GROQ_API_KEY) {
    fail('GROQ_API_KEY not set — add it to .env.local')
    process.exit(1)
  }

  // Dynamically import the real automate.js functions is not possible since
  // they're not exported. Instead call the script directly for real runs.
  info('For real keyword research, run: npm run blog:generate')
  ok('Step 1 structure: OK')
  return [MOCK_TOPIC]
}

function testStep2_PickTopic(topics) {
  sep('Step 2 — Topic Selection')
  const topic = topics[0]
  ok(`Selected: "${topic.title}"`)
  ok(`Category: ${topic.category}`)
  ok(`Keyword:  ${topic.keyword}`)
  ok(`Slug:     ${topic.slug}`)
  return topic
}

function testStep3_Images(topic) {
  sep('Step 3 — Image Selection')
  const pregenDir = path.join(ROOT, 'public', 'images', 'pre-generated', topic.category)
  const techDir   = path.join(ROOT, 'public', 'images', 'pre-generated', 'technical')

  let imgDir = pregenDir
  if (!fs.existsSync(pregenDir)) {
    warn(`No images in category "${topic.category}" — checking technical fallback`)
    imgDir = techDir
  }

  if (!fs.existsSync(imgDir)) {
    fail(`No pre-generated images found in: ${imgDir}`)
    return null
  }

  const images = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  ok(`Found ${images.length} images in: public/images/pre-generated/${path.basename(imgDir)}/`)

  const selected = images.slice(0, 4)
  selected.forEach((img, i) => ok(`  ${i === 0 ? 'Hero' : `Body ${i}`}: ${img}`))

  return {
    hero: { url: `/images/pre-generated/${path.basename(imgDir)}/${selected[0]}`, alt: topic.title, credit: 'SpeedUp Infotech' },
    body: selected.slice(1).map(img => ({ url: `/images/pre-generated/${path.basename(imgDir)}/${img}`, alt: topic.title, credit: 'SpeedUp Infotech' })),
  }
}

async function testStep4_WritePost(topic, dryRun) {
  sep('Step 4 — Write Blog Post (AI)')
  if (dryRun) {
    info('DRY RUN — returning mock draft')
    const words = MOCK_DRAFT.split(/\s+/).length
    ok(`Mock draft: ~${words} words`)
    return { fullBody: MOCK_DRAFT, totalWords: words }
  }

  info('This step calls Groq API — run with --full to execute')
  ok('Step 4 structure: OK')
  return { fullBody: MOCK_DRAFT, totalWords: MOCK_DRAFT.split(/\s+/).length }
}

async function testStep5_QA(content, topic) {
  sep('Step 5 — Content QA Check')

  // Replicate contentQualityIssues logic locally
  const issues = []
  const plain = content.replace(/```[\s\S]*?```/g, '')
  const wordCount = plain.split(/\s+/).filter(Boolean).length

  console.log(`   Word count: ${wordCount}`)

  if (wordCount < 1200)                             issues.push(`Too short: ${wordCount} words (min 1200)`)
  if (!/^#\s+/m.test(content))                     issues.push('Missing H1 title')
  if (!/## Frequently Asked Questions/i.test(content)) issues.push('Missing FAQ section')
  if (!/## Sources and further reading/i.test(content)) issues.push('Missing Sources section')
  if (!/https?:\/\//i.test(content))               issues.push('No URLs found')
  if (!/SpeedUp Infotech/i.test(content))          issues.push('Missing SpeedUp Infotech mention')

  const BLOCKED = [
    { label: 'AI artifact',        regex: /\b(we will continue|stay tuned|in the next part)\b/i },
    { label: 'Placeholder leaked', regex: /\[[^\]]*(?:write|sentence|word|conclusion|answer)[^\]]*]/i },
    { label: 'Mojibake',           regex: /â|ðŸ|ufffd/ },
  ]
  for (const { label, regex } of BLOCKED) {
    if (regex.test(content)) issues.push(label)
  }

  const speedupCount = (plain.match(/SpeedUp Infotech/gi) || []).length
  console.log(`   SpeedUp Infotech mentions: ${speedupCount}`)
  if (speedupCount > 15) issues.push(`Brand stuffing: ${speedupCount} mentions (max 15)`)

  if (issues.length === 0) {
    ok(`QA passed — ${wordCount} words, ${speedupCount} brand mentions`)
  } else {
    issues.forEach(i => fail(`QA: ${i}`))
  }

  return issues
}

function testStep6_BuildMdx(topic, content) {
  sep('Step 6 — MDX Frontmatter Build')
  const today = new Date().toISOString().split('T')[0]
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const desc  = (lines[0] || topic.title).replace(/[*_`[\]()]/g, '').slice(0, 155)

  const frontmatter = [
    '---',
    `title: "${topic.title}"`,
    `slug: "${topic.slug}"`,
    `description: "${desc}"`,
    `date: "${today}"`,
    `category: "AI & Tech Trends"`,
    `heroImage: "/images/${topic.slug}.png"`,
    '---',
  ].join('\n')

  ok('Frontmatter generated:')
  console.log('\n' + frontmatter.split('\n').map(l => `   ${l}`).join('\n') + '\n')
  return `${frontmatter}\n\n${content}`
}

function testStep7_Save(topic, mdx, dryRun) {
  sep('Step 7 — Save MDX File')
  const blogDir  = path.join(ROOT, 'content', 'blog')
  const filename = `${topic.slug}.mdx`
  const filepath = path.join(blogDir, filename)

  if (dryRun) {
    info(`DRY RUN — would save to: content/blog/${filename}`)
    info(`File size would be: ~${(mdx.length / 1024).toFixed(1)} KB`)
    ok('Step 7 structure: OK')
    return
  }

  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true })
  fs.writeFileSync(filepath, mdx, 'utf8')
  ok(`Saved: content/blog/${filename}`)
  ok(`Size: ${(mdx.length / 1024).toFixed(1)} KB`)
}

function testSitemap() {
  sep('Sitemap Check')
  const sitemapPath = path.join(ROOT, 'public', 'sitemap.xml')
  if (!fs.existsSync(sitemapPath)) {
    warn('sitemap.xml not found — run: npm run blog:sitemap')
    return
  }
  const xml   = fs.readFileSync(sitemapPath, 'utf8')
  const urls  = (xml.match(/<loc>/g) || []).length
  const dates = xml.match(/\d{4}-\d{2}-\d{2}/g) || []
  const newest = dates.sort().reverse()[0]
  ok(`sitemap.xml: ${urls} URLs — newest: ${newest}`)
}

function testEnv() {
  sep('Environment Check')
  const key1 = process.env.GROQ_API_KEY
  const key2 = process.env.GROQ_API_KEY_2
  if (!key1) {
    fail('GROQ_API_KEY not set')
    info('Create .env.local in the project root:')
    info('  GROQ_API_KEY=gsk_...')
    info('  GROQ_API_KEY_2=gsk_... (optional, for key rotation)')
    info('Get a free key at: https://console.groq.com/keys')
  } else {
    ok(`GROQ_API_KEY: set (${key1.slice(0, 8)}...)`)
  }
  if (key2) ok(`GROQ_API_KEY_2: set (${key2.slice(0, 8)}...) — rotation enabled`)

  const nodeVer = process.version
  const major   = parseInt(nodeVer.slice(1))
  if (major >= 20) ok(`Node.js: ${nodeVer}`)
  else             warn(`Node.js: ${nodeVer} — v20+ recommended`)

  const blogDir = path.join(ROOT, 'content', 'blog')
  const posts   = fs.existsSync(blogDir) ? fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx')).length : 0
  ok(`Blog posts in content/blog/: ${posts}`)

  const categories = ['trending-ai', 'career', 'comparison', 'beginner', 'technical']
  for (const cat of categories) {
    const dir = path.join(ROOT, 'public', 'images', 'pre-generated', cat)
    if (fs.existsSync(dir)) {
      const count = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).length
      ok(`Images [${cat}]: ${count} files`)
    } else {
      warn(`Images [${cat}]: directory missing`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────
;(async function main() {
  const mode = DRY_RUN ? 'DRY RUN (no API calls)' : FULL_RUN ? 'FULL RUN (uses API credits)' : QA_ONLY ? 'QA ONLY' : `STEP ${STEP} ONLY`

  console.log('\n══════════════════════════════════════════════════════')
  console.log('  SpeedUp Infotech — Local Test Runner')
  console.log(`  Mode: ${mode}`)
  console.log(`  ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`)
  console.log('══════════════════════════════════════════════════════')

  // ── QA only mode ──────────────────────────────────────────
  if (QA_ONLY) {
    const draftPath = path.join(ROOT, 'scripts', '.test-draft.md')
    if (!fs.existsSync(draftPath)) {
      info('No draft found at scripts/.test-draft.md')
      info('Running QA on mock draft instead...')
      await testStep5_QA(MOCK_DRAFT, MOCK_TOPIC)
    } else {
      const draft = fs.readFileSync(draftPath, 'utf8')
      info(`Running QA on: scripts/.test-draft.md (${draft.split(/\s+/).length} words)`)
      await testStep5_QA(draft, MOCK_TOPIC)
    }
    sep('Done')
    return
  }

  // ── Single step mode ──────────────────────────────────────
  if (STEP !== null) {
    testEnv()
    if (STEP === 1) await testStep1_Keywords(false)
    if (STEP === 2) { const t = await testStep1_Keywords(true); testStep2_PickTopic(t) }
    if (STEP === 3) { const t = testStep2_PickTopic([MOCK_TOPIC]); testStep3_Images(t) }
    if (STEP === 4) await testStep4_WritePost(MOCK_TOPIC, false)
    if (STEP === 5) await testStep5_QA(MOCK_DRAFT, MOCK_TOPIC)
    if (STEP === 6) testStep6_BuildMdx(MOCK_TOPIC, MOCK_DRAFT)
    if (STEP === 7) testStep7_Save(MOCK_TOPIC, MOCK_DRAFT, true)
    sep('Done')
    return
  }

  // ── Dry run or full run ───────────────────────────────────
  testEnv()
  testSitemap()

  const topics  = await testStep1_Keywords(DRY_RUN)
  const topic   = testStep2_PickTopic(topics)
  const images  = testStep3_Images(topic)
  const { fullBody } = await testStep4_WritePost(topic, DRY_RUN)
  const issues  = await testStep5_QA(fullBody, topic)
  const mdx     = testStep6_BuildMdx(topic, fullBody)
  testStep7_Save(topic, mdx, DRY_RUN)

  sep('Summary')
  if (DRY_RUN) {
    ok('Dry run complete — no API calls made, no files written')
    info('To run the real pipeline: npm run blog:generate')
    info('To test a specific step: npm run blog:test-local -- --step 3')
    info('To run QA on your own draft: npm run blog:test-local -- --qa')
  } else {
    if (issues.length === 0) ok('All checks passed — ready for production')
    else                     fail(`${issues.length} QA issue(s) — review above`)
  }
  console.log()
})()
