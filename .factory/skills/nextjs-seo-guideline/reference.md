# Next.js SEO Pattern Matrix

Nguồn rút gọn: tailwind-nextjs-starter-blog (RSS/sitemap/metadata), Next.js blog-starter (SSG + frontmatter), simple-blog-nextjs (Next SEO + social preview), seo-nextjs-starter (metadata/robots/sitemap/OG), taxonomy (metadata files + OG image bằng @vercel/og).

## Must
- **Metadata chuẩn mỗi route**: title/description/OG/Twitter, dùng metadata API của App Router.
- **Sitemap + robots**: file conventions `sitemap.ts`, `robots.ts` để đảm bảo crawl.
- **Canonical URL** cho bài viết/landing bị trùng nội dung.
- **Content frontmatter**: title/date/summary/tags + optional canonical (blog-starter + tailwind-nextjs-starter-blog).
- **SSG/ISR cho content**: tối ưu crawl + tốc độ (blog-starter).

## Should
- **OG image** tĩnh hoặc dynamic `@vercel/og` (taxonomy).
- **Structured data (JSON-LD)** cho Article/BlogPosting.
- **Internal linking**: tag page, category page, related posts.
- **RSS feed** cho blog (tailwind-nextjs-starter-blog).
- **Social preview pipeline**: thumbnail generator (simple-blog-nextjs).

## Nice-to-have
- **Multi-author metadata** hoặc author pages.
- **Reading time** & view counter (simple-blog-nextjs) nếu cần UX/content.

## Anti-patterns
- Render client-only cho content chính (khó crawl).
- Thiếu canonical khi có nhiều URL cho cùng content.
- Sitemap/robots không cập nhật hoặc thiếu base URL.
- OG/Twitter dùng ảnh mặc định không theo nội dung.

## Khi áp dụng
- **Blog/knowledge base**: ưu tiên SSG/ISR, markdown/MDX, RSS.
- **Marketing site**: metadata đầy đủ, canonical, OG image động.
- **App có phần public content**: tách public routes có metadata chuẩn.
