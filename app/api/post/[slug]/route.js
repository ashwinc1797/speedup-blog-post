import { getPostBySlug } from '../../../../lib/blog.js'

function mdToHtml(md) {
  return md
    // Remove frontmatter
    .replace(/^---[\s\S]*?---\n?/m, '')
    // H1 → h2 to avoid nesting issues
    .replace(/^# (.+)$/gm, '<h2 class="art-h2">$1</h2>')
    .replace(/^## (.+)$/gm, '<h2 class="art-h2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="art-h3">$1</h3>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, m => {
      const code = m.replace(/```\w*\n?/, '').replace(/```$/, '')
      return `<pre style="background:#0A0A0A;border:1px solid rgba(255,255,255,0.1);padding:14px;border-radius:4px;overflow-x:auto;margin:14px 0"><code style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#D92B2B">${code}</code></pre>`
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#111;padding:2px 6px;font-family:monospace;font-size:12px;color:#D92B2B;border:1px solid rgba(255,255,255,0.1)">$1</code>')
    // Images with caption
    .replace(/!\[([^\]]*)\]\(([^)]+)\)\n\*([^*]+)\*/g,
      '<figure style="margin:24px 0"><img src="$2" alt="$1" loading="lazy" style="width:100%;max-height:400px;object-fit:cover;display:block;border:1px solid rgba(255,255,255,0.07)"/><figcaption style="font-size:11px;color:#555;margin-top:6px;text-align:center">$3</figcaption></figure>')
    // Images without caption
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<figure style="margin:24px 0"><img src="$2" alt="$1" loading="lazy" style="width:100%;max-height:400px;object-fit:cover;display:block;border:1px solid rgba(255,255,255,0.07)"/></figure>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color:#D92B2B;text-decoration:underline;text-underline-offset:3px">$1</a>')
    // Bullet lists
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m =>
      `<ul style="margin:8px 0 14px 20px;display:flex;flex-direction:column;gap:5px">${m}</ul>`)
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // FAQ: Q: ... A: ... on same line
    .replace(/Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gs, (_, q, a) =>
      `<div style="margin-bottom:16px;padding:14px 16px;background:#111;border-left:3px solid #D92B2B">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#fff;margin-bottom:6px">Q: ${q.trim()}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7">A: ${a.trim()}</div>
      </div>`)
    // FAQ: **Q: ...** format
    .replace(/<strong>Q:\s*(.+?)<\/strong>/g,
      '<strong style="display:block;font-family:\'Barlow Condensed\',sans-serif;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#fff;margin-top:14px;margin-bottom:4px">Q: $1</strong>')
    .replace(/<strong>A:\s*(.+?)<\/strong>/g,
      '<span style="font-size:14px;color:rgba(255,255,255,0.7)">A: $1</span>')
    // Paragraphs
    .split('\n\n')
    .map(block => {
      block = block.trim()
      if (!block) return ''
      if (block.startsWith('<')) return block
      return `<p style="margin-bottom:14px;line-height:1.8;color:rgba(255,255,255,0.75)">${block.replace(/\n/g, ' ')}</p>`
    })
    .join('\n')
}

// Better FAQ formatter — handles all common FAQ formats Groq uses
function formatFAQs(html) {
  // Detect FAQ section and reformat it
  return html.replace(
    /(<h2[^>]*>.*?(?:FAQ|Frequently Asked|Questions).*?<\/h2>)([\s\S]*?)(?=<h2|$)/gi,
    (match, heading, content) => {
      // Extract Q&A pairs from various formats
      const pairs = []

      // Format 1: Q: question\nA: answer
      const format1 = /Q:\s*(.+?)[\n<][\s]*A:\s*([\s\S]+?)(?=Q:|$)/gi
      let m
      while ((m = format1.exec(content)) !== null) {
        pairs.push({ q: m[1].trim(), a: m[2].replace(/<[^>]+>/g, '').trim() })
      }

      // Format 2: **Question** \n Answer
      if (pairs.length === 0) {
        const format2 = /<strong>(.+?\?)<\/strong>[\s\S]*?<p[^>]*>([\s\S]+?)<\/p>/gi
        while ((m = format2.exec(content)) !== null) {
          pairs.push({ q: m[1].trim(), a: m[2].replace(/<[^>]+>/g, '').trim() })
        }
      }

      if (pairs.length === 0) return match

      const faqHtml = pairs.map(({ q, a }) => `
        <div style="margin-bottom:12px;border:1px solid rgba(255,255,255,0.07);border-left:3px solid #D92B2B">
          <div style="padding:12px 16px;background:#111;cursor:pointer">
            <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:0.05em;color:#fff">${q}</div>
          </div>
          <div style="padding:12px 16px;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.75">${a}</div>
        </div>`).join('')

      return `${heading}<div style="margin-top:12px">${faqHtml}</div>`
    }
  )
}

export async function GET(request, { params }) {
  try {
    const post = getPostBySlug(params.slug)
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 })

    let htmlContent = mdToHtml(post.content)
    htmlContent = formatFAQs(htmlContent)

    return Response.json({
      slug:         post.slug,
      title:        post.frontmatter.title,
      description:  post.frontmatter.description,
      date:         post.frontmatter.date,
      author:       post.frontmatter.author,
      authorBio:    post.frontmatter.authorBio,
      category:     post.frontmatter.category,
      tags:         post.frontmatter.tags || [],
      keywords:     post.frontmatter.keywords || [],
      readTime:     post.frontmatter.readTime,
      heroImage:    post.frontmatter.heroImage,
      heroImageAlt: post.frontmatter.heroImageAlt,
      canonical:    post.frontmatter.canonical,
      htmlContent,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
