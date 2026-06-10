---
name: nextjs-seo-guideline
description: Playbook SEO kỹ thuật cho dự án Next.js (App Router/SSG/ISR/SSR) với metadata, sitemap/robots, canonical, OpenGraph, structured data và kiến trúc content. Dùng khi cần audit SEO, thiết kế nền SEO cho blog/site, hoặc viết ví dụ code SEO Next.js.
---

# Next.js SEO Guideline

Playbook SEO kỹ thuật tổng hợp từ các repo mẫu: tailwind-nextjs-starter-blog, Next.js Blog Starter Kit, simple-blog-nextjs, seo-nextjs-starter, taxonomy.

## Quick start
1. Thu thập yêu cầu: loại site, nguồn content, routing, ngôn ngữ, mục tiêu SEO.
2. Audit hiện trạng theo checklist **Must/Should** trong [reference.md](./reference.md).
3. Triển khai metadata, sitemap/robots, canonical, OG/Twitter, JSON-LD theo [examples.md](./examples.md).

## Instructions
1. **Xác định kiến trúc render**
   - Blog/content-driven ưu tiên SSG/ISR (theo blog-starter, tailwind-nextjs-starter-blog).
   - Trang động cần SSR có cache, tránh client-only rendering làm giảm crawlability.
2. **Thiết kế metadata pipeline**
   - Mỗi route có metadata rõ ràng, có title/description, OG/Twitter.
   - Chuẩn hoá site metadata (site name, base URL, default image).
3. **Crawlability**
   - Có `sitemap.ts` và `robots.ts` ở App Router.
   - Canonical cho bài viết/landing để tránh trùng lặp.
4. **Content structure**
   - Dùng frontmatter (title/date/summary/tags/canonicalUrl) và nội dung markdown/MDX (từ blog-starter, tailwind-nextjs-starter-blog).
   - Tạo index/tag pages để internal linking rõ ràng.
5. **Social preview**
   - OG image tĩnh hoặc dynamic bằng `@vercel/og` (taxonomy, seo-nextjs-starter).
6. **Performance SEO**
   - Ưu tiên SSG/ISR, hạn chế JS bundle đầu trang, tối ưu ảnh (tailwind-nextjs-starter-blog).

## Output format khi trả lời user
- **Tóm tắt vấn đề** (1-2 câu)
- **Checklist Must/Should**
- **Gợi ý code cụ thể** (trích từ examples.md)
- **Rủi ro & trade-off** nếu có

## When not to use
- Dự án không dùng Next.js hoặc không yêu cầu SEO kỹ thuật.
- Các câu hỏi chỉ liên quan nội dung/keyword research (ngoài scope).

## Tài liệu chi tiết
- Matrix pattern và anti-pattern: [reference.md](./reference.md)
- Ví dụ code App Router: [examples.md](./examples.md)
