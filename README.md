# SpeedUp Infotech — Blog Automation Test Site

A complete Next.js website with fully automated blog publishing powered by:
- **Gemini 1.5 Flash** — AI blog writing (FREE)
- **Pollinations.ai** — Hero image generation (FREE, no key needed)
- **Unsplash API** — In-content photos (FREE)
- **GitHub Actions** — Auto-schedule Mon/Wed/Fri 6AM IST (FREE)
- **Vercel** — Hosting & deployment (FREE)

**Total cost: ₹0/month**

---

## Quick Start (5 steps)

### Step 1 — Get your free Gemini API key
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "SpeedUp blog automation"
git remote add origin https://github.com/YOUR_USERNAME/speedup-blog-test.git
git push -u origin main
```

### Step 3 — Deploy to Vercel
1. Go to https://vercel.com
2. "Add New Project" → Import your GitHub repo
3. Click Deploy (leave all settings default)
4. Go to: Project → Settings → Git → Deploy Hooks
5. Create hook: name=`blog-bot`, branch=`main`
6. Copy the webhook URL

### Step 4 — Add secrets to GitHub
Go to: GitHub repo → Settings → Secrets → Actions → New repository secret

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | your key from Step 1 |
| `UNSPLASH_ACCESS_KEY` | from unsplash.com/developers (optional) |
| `VERCEL_DEPLOY_HOOK` | URL from Step 3 |
| `INDEXNOW_KEY` | `speedup2026pune` |

### Step 5 — Test it locally first
```bash
npm install

# Windows:
set GEMINI_API_KEY=AIzaSyXXXXX
node scripts/test-run.js

# Mac/Linux:
GEMINI_API_KEY=AIzaSyXXXXX node scripts/test-run.js
```

Then run `npm run dev` and open http://localhost:3000/blog

---

## How it works

Every Monday, Wednesday, Friday at 6:00 AM IST:
1. GitHub Actions triggers automatically
2. Gemini researches best unused keyword
3. Gemini writes 2000-word SEO blog post
4. Pollinations.ai generates AI hero image (1200×630)
5. Unsplash fetches 3 real photos for article
6. MDX file saved to `content/blog/`
7. Committed to GitHub → Vercel redeploys in ~60 seconds
8. Google + Bing + Yandex notified via IndexNow

---

## File Structure
```
speedup-blog-test/
├── app/
│   ├── layout.js          ← Navigation + footer
│   ├── page.js            ← Homepage
│   └── blog/
│       ├── page.js        ← Blog listing
│       └── [slug]/
│           └── page.js    ← Individual posts
├── content/
│   └── blog/              ← Auto-generated MDX posts appear here
├── scripts/
│   ├── automate.js        ← Main automation engine
│   ├── test-run.js        ← Quick local test
│   └── .state.json        ← Tracks published posts (auto-created)
├── lib/
│   └── blog.js            ← Reads MDX files
├── .github/
│   └── workflows/
│       └── auto-blog.yml  ← GitHub Actions scheduler
└── .env.local.example     ← Copy to .env.local
```

---

## Manual trigger
Go to GitHub → Actions → "Auto Blog Publisher" → "Run workflow"

---

## Troubleshooting
- **GEMINI_API_KEY error** → Add the secret to GitHub (Step 4)
- **No posts showing** → Run `node scripts/test-run.js` first to generate a test post
- **Images not loading** → Pollinations.ai images take 3-5 seconds on first load
- **Build failing on Vercel** → Check Node.js version is 20+ in Vercel settings
