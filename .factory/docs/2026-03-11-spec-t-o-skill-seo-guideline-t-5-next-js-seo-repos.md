## Audit Summary
- **Observation:** Bạn yêu cầu tạo **skill SEO guideline** và chỉ rõ phải tận dụng tư duy từ 5 nguồn: `timlrx/tailwind-nextjs-starter-blog`, `vercel/next.js blog starter kit`, `alexmarqs/simple-blog-nextjs`, `wangrunlin/seo-nextjs-starter`, `shadcn-ui/taxonomy`.
- **Observation:** Bạn muốn dùng đúng 2 skill hỗ trợ: **docs-seeker** (thu thập tri thức) và **skill-writer** (chuẩn hoá SKILL.md).
- **Observation:** Bạn đã chốt yêu cầu đầu ra: **Project skill (.factory/skills)**, **Tiếng Việt**, **Playbook đầy đủ + ví dụ code Next.js**.
- **Inference:** Cần tạo 1 skill mới mang tính SEO-first cho Next.js, có thể tái dùng cho audit + implementation.
- **Decision:** Đề xuất tạo skill mới `nextjs-seo-guideline` trong `.factory/skills/nextjs-seo-guideline/` với `SKILL.md` + 2 file phụ trợ để giữ playbook rõ ràng, dễ bảo trì.

## Root Cause Confidence
- **High** — Vì yêu cầu hiện tại không phải bug fix mà là **thiếu một skill tổng hợp chuẩn SEO Next.js** từ các repo tham chiếu. Để giải quyết đúng mục tiêu, cần quy trình: thu thập pattern tốt nhất → hợp nhất thành checklist/playbook → đóng gói thành skill có trigger rõ ràng.

## Proposal (Actionable, step-by-step)
1. **Khảo sát 5 nguồn bằng docs-seeker workflow (read-only):**
   - Ưu tiên `llms.txt`/docs chính thức nếu có, fallback đọc README/cấu trúc repo.
   - Trích xuất các nhóm thực hành SEO: metadata pipeline, canonical, OG/Twitter, sitemap/robots, structured data, rendering strategy (SSG/ISR/RSC), content architecture, internal linking, performance for crawlability.
2. **Chuẩn hoá tri thức thành “SEO pattern matrix”:**
   - Mỗi pattern có: nguồn gốc (repo), khi dùng, trade-off, anti-pattern.
   - Gắn mức ưu tiên: Must / Should / Nice-to-have.
3. **Thiết kế skill theo skill-writer conventions:**
   - Tạo `.factory/skills/nextjs-seo-guideline/SKILL.md` (frontmatter chuẩn, trigger rõ “SEO Next.js”, “metadata”, “sitemap”, “canonical”, “structured data”).
   - Nội dung chính: quick start, workflow audit, workflow implement, checklist kỹ thuật, ví dụ code App Router.
4. **Tạo file phụ trợ cho playbook đầy đủ:**
   - `.factory/skills/nextjs-seo-guideline/reference.md`: matrix pattern + quyết định kiến trúc theo ngữ cảnh.
   - `.factory/skills/nextjs-seo-guideline/examples.md`: snippet thực chiến (metadata object, dynamic metadata, sitemap.ts, robots.ts, JSON-LD).
5. **Đảm bảo tính sử dụng thực tế trong repo hiện tại:**
   - Viết hướng dẫn “khi nào dùng skill”, “khi nào không cần”, “input tối thiểu cần có trước khi chạy audit SEO”.
   - Kiểm tra nội dung không lệch scope (không thêm framework ngoài Next.js khi không cần).
6. **Bàn giao + commit local (không push):**
   - Commit chỉ gồm files skill mới (và file liên quan nếu phát sinh).

## Verification Plan
- **Static quality checks (không chạy lint/test/build theo guideline repo):**
  - Validate frontmatter YAML hợp lệ (`name`, `description`, optional `allowed-tools`).
  - Soát trigger phrases trong description để skill dễ được invoke đúng ngữ cảnh.
  - Soát consistency giữa `SKILL.md` ↔ `reference.md` ↔ `examples.md` (không mâu thuẫn pattern).
- **Repro/usage verification (manual, read-only):**
  - Mô phỏng 3 câu prompt SEO phổ biến để kiểm tra skill có đủ chỉ dẫn xử lý.
  - Đối chiếu từng checklist mục với ít nhất 1 nguồn trong 5 repo tham chiếu.
- **Pass criteria:**
  - Có skill mới trong `.factory/skills/...` bằng tiếng Việt.
  - Có playbook đầy đủ + ví dụ Next.js App Router.
  - Nội dung bám sát các thực hành tốt rút ra từ 5 nguồn, không lan man ngoài phạm vi SEO guideline.