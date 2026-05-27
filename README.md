# SpeedUp Infotech Blog Automation

Next.js blog site for SpeedUp Infotech with automated SEO post generation.

The app uses:

- Next.js 14 App Router for the website
- MDX files in `content/blog/` as the blog source
- Groq Llama models for keyword research and article writing
- Pollinations, Pexels, Unsplash, and hardcoded fallbacks for images
- GitHub Actions for scheduled publishing
- Vercel or any Next.js host for deployment

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000/blog`.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the keys you want to use.

```bash
GROQ_API_KEY=your-groq-api-key
PEXELS_API_KEY=optional-pexels-key
UNSPLASH_ACCESS_KEY=optional-unsplash-key
INDEXNOW_KEY=speedup2026pune
```

`GROQ_API_KEY` is required for article generation. Image keys are optional because the automation has fallbacks.

## Useful Scripts

```bash
npm run dev
npm run build
npm run blog:generate
npm run blog:test
npm run blog:sitemap
npm run blog:fix-images
```

`blog:generate` runs the production automation engine.

`blog:test` generates a local test post from the older fixed-topic generator.

`blog:sitemap` rebuilds `public/sitemap.xml` from every MDX post in `content/blog`.

`blog:fix-images` downloads missing local hero images and updates MDX frontmatter where possible.

## How Publishing Works

The workflow in `.github/workflows/auto-blog.yml` runs Monday, Tuesday, Thursday, and Saturday at 6:00 AM IST.

1. GitHub Actions installs dependencies.
2. `scripts/automate.js` researches a topic with Groq.
3. The script writes an MDX post into `content/blog/`.
4. A humanization and fact-check pass rewrites the draft against trusted source guidance.
5. A quality gate blocks publication if AI artifacts, fake citations, unsupported claims, broken characters, missing FAQs, or missing source links remain.
6. A hero image is saved into `public/images/` when possible.
7. Social captions are saved into `scripts/social-queue/`.
8. `scripts/sync-sitemap.js` rebuilds the sitemap.
9. The workflow commits and pushes the generated content.
10. IndexNow and Google sitemap pings are attempted.

## Project Structure

```text
app/
  layout.js              Global layout, nav, footer
  page.js                Homepage
  blog/page.js           Blog listing
  blog/[slug]/page.js    Server-rendered blog post page
  api/post/[slug]/route.js
components/
  AuthorBox.js           Trainer author profile block
content/blog/
  *.mdx                  Blog posts
lib/
  blog.js                Reads blog MDX files
public/
  images/                Local hero images
  sitemap.xml
scripts/
  automate.js            Main blog automation engine
  sync-sitemap.js        Rebuilds sitemap from MDX
  fix-images.js          Repairs missing hero images
  test-run.js            Local fixed-topic generator
```

## GitHub Secrets

Add these in GitHub repository settings under Actions secrets:

- `GROQ_API_KEY`
- `PEXELS_API_KEY` optional
- `UNSPLASH_ACCESS_KEY` optional
- `INDEXNOW_KEY` optional
- `NOTIFY_EMAIL`, `NOTIFY_EMAIL_PASSWORD`, and `NOTIFY_EMAILS` if email notifications are enabled

## Troubleshooting

- Missing posts on Google: run `npm run blog:sitemap` and redeploy.
- Generation fails immediately: confirm `GROQ_API_KEY` is set.
- Missing local hero images: run `npm run blog:fix-images`.
- Build warnings about Google Fonts can happen when the build machine cannot fetch the stylesheet; the app still builds.
