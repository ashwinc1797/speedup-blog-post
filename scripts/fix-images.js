// redownload-missing.js — Re-downloads missing/empty hero images
// using fresh Pollinations prompts built from the MDX title & category

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const BLOG_DIR  = path.join(ROOT, 'content', 'blog')
const IMG_DIR   = path.join(ROOT, 'public', 'images')

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true })

// Good Unsplash fallbacks if Pollinations keeps failing
const FALLBACKS = {
  'trending-ai':  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop&q=80',
  'career':       'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop&q=80',
  'comparison':   'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop&q=80',
  'beginner':     'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=630&fit=crop&q=80',
  'technical':    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&q=80',
}

async function downloadImage(url, destPath, timeoutMs = 60000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 1000) throw new Error(`Image too small (${buffer.length} bytes) — likely empty`)
  fs.writeFileSync(destPath, buffer)
  return buffer.length
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
console.log(`\n🔍 Scanning ${files.length} MDX files for missing images...\n`)

let fixed = 0

for (const file of files) {
  const slug    = file.replace('.mdx', '')
  const mdxPath = path.join(BLOG_DIR, file)
  const imgPath = path.join(IMG_DIR, `${slug}.jpg`)
  const content = fs.readFileSync(mdxPath, 'utf-8')

  // Already has a local image that is valid
  if (content.includes(`heroImage: "/images/${slug}.jpg"`) && fs.existsSync(imgPath) && fs.statSync(imgPath).size > 1000) {
    console.log(`  ✓ ${slug} — OK`)
    continue
  }

  // Extract title and category from MDX frontmatter
  const titleMatch    = content.match(/title:\s*"([^"]+)"/)
  const categoryMatch = content.match(/category:\s*"([^"]+)"/)
  const title         = titleMatch?.[1] || slug
  const categoryRaw   = categoryMatch?.[1] || 'technical'
  // Normalise category to key
  const catKey = categoryRaw.toLowerCase().includes('ai') ? 'trending-ai'
               : categoryRaw.toLowerCase().includes('career') ? 'career'
               : categoryRaw.toLowerCase().includes('comparison') ? 'comparison'
               : categoryRaw.toLowerCase().includes('beginner') ? 'beginner'
               : 'technical'

  const seed    = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const subject = title.replace(/[—–-]+/g, 'and').replace(/[?!]/g, '').slice(0, 60)
  const styleMap = {
    'trending-ai': 'futuristic digital technology interface dark background neon blue',
    'career':      'professional developer office workspace cinematic lighting',
    'comparison':  'split screen two coding interfaces minimal dark theme',
    'beginner':    'young student learning laptop bright tech education',
    'technical':   'clean code multiple monitors dark IDE professional',
  }
  const prompt  = `${subject} ${styleMap[catKey]} high quality photorealistic no text`
  const polUrl  = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&seed=${seed}&nologo=true&model=flux`
  const localUrl = `/images/${slug}.jpg`

  console.log(`  ⏳ ${slug}`)
  console.log(`     Prompt: "${prompt.slice(0, 70)}..."`)

  let success = false

  // Try Pollinations first
  try {
    const bytes = await downloadImage(polUrl, imgPath, 60000)
    console.log(`  ✅ Pollinations — ${Math.round(bytes/1024)}KB saved`)
    success = true
  } catch (e) {
    console.log(`  ⚠️  Pollinations failed: ${e.message}`)
  }

  // Fall back to Unsplash if Pollinations failed
  if (!success) {
    try {
      const fbUrl = FALLBACKS[catKey]
      const bytes = await downloadImage(fbUrl, imgPath, 15000)
      console.log(`  ✅ Unsplash fallback — ${Math.round(bytes/1024)}KB saved`)
      success = true
    } catch (e) {
      console.log(`  ❌ Both failed: ${e.message}`)
    }
  }

  // Update MDX to use local path
  if (success) {
    const updated = content
      .replace(/heroImage:\s*"https:\/\/image\.pollinations\.ai[^"]*"/, `heroImage: "${localUrl}"`)
      .replace(/heroImage:\s*"https:\/\/images\.unsplash\.com[^"]*"/, `heroImage: "${localUrl}"`)
    fs.writeFileSync(mdxPath, updated, 'utf-8')
    console.log(`  📝 MDX updated → ${localUrl}\n`)
    fixed++
  }

  await new Promise(r => setTimeout(r, 1500))
}

console.log(`\n══════════════════════════════════════`)
console.log(`  Done! Fixed ${fixed} posts`)
console.log(`══════════════════════════════════════\n`)
