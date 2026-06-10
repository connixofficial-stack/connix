## Audit Summary
- **Observation:** Public site đã có nền SEO tốt: `app/sitemap.ts`, `app/robots.ts`, metadata động rộng khắp `app/(site)/**/layout.tsx`, và JSON-LD qua `lib/seo/schema-policy.ts`.
- **Observation:** Đã có engine zero-config (`buildSeoMetadata`, `buildSiteSchemas`) nhưng còn thiếu một số khối “full implement” theo playbook: OG image route coverage, schema coverage sâu theo từng loại trang, feed/content discovery, và chuẩn hóa noindex/index policy cho các route tiện ích.
- **Observation:** Bạn yêu cầu ưu tiên **toàn bộ public site** và mục tiêu là **tăng toàn diện** (index coverage, CTR, rich results, crawl/render).
- **Inference:** Vấn đề không phải thiếu nền tảng mà là thiếu **độ phủ + đồng bộ policy** trên tất cả route public.
- **Decision:** Triển khai gói full SEO theo checklist Must/Should của skill `nextjs-seo-guideline`, ưu tiên thay đổi nhỏ theo cụm file để dễ rollback.

## Root Cause Confidence
- **High** — Vì evidence cho thấy hệ thống đã có core SEO, nhưng chưa full coverage ở các lớp nâng cao (OG pipeline đồng nhất, schema theo page intent, discovery signals kiểu RSS/feed, policy noindex rõ cho trang utility). Đây là khoảng trống thường làm mất thêm crawl budget và CTR dù metadata cơ bản đã có.

## Proposal (Checklist ưu tiên + effort)

### P0 — Must (Effort: 1.5–2.5 ngày)
1. **Chuẩn hoá metadata contract cho 100% route public**
   - Soát và đồng bộ toàn bộ `app/(site)/**/layout.tsx`, `app/(site)/**/page.tsx` theo 1 contract: title/description/canonical/openGraph/twitter/robots.
   - File chính: `lib/seo/metadata.ts`, các route layouts trong `app/(site)/**`.
2. **Củng cố canonical + indexability policy**
   - Mở rộng `lib/seo/route-policy.ts` để kiểm soát rõ: trang list/detail index, trang account/cart/checkout/wishlist noindex nhất quán.
   - Đồng bộ với `app/robots.ts` để tránh policy lệch.
3. **Sitemap hardening cho toàn bộ nội dung indexable**
   - Nâng `app/sitemap.ts`: chuẩn hóa `lastModified`, chống URL trùng, bảo đảm tất cả landing/content route đều có trong sitemap.
   - Thêm guard khi thiếu `site_url` để không phát sitemap lỗi.
4. **Structured data baseline cho tất cả loại trang chính**
   - Mở rộng `lib/seo/schema-policy.ts` + các layouts detail/list:
     - Article/BlogPosting cho posts/guides/landing content.
     - Product cho products detail.
     - Service cho services detail.
     - Breadcrumb cho mọi detail page.

### P1 — Should (Effort: 2–3 ngày)
5. **OG image pipeline thống nhất**
   - Tạo OG route mặc định và theo cụm trang (nếu chưa có): `opengraph-image.tsx` ở root hoặc route groups chính.
   - Fallback ảnh OG theo priority: entity image → seo setting → default.
6. **Rich-result depth cho landing hubs**
   - Bổ sung ItemList schema cho trang hub (`/features`, `/solutions`, `/templates`, ...), FAQ schema khi có dữ liệu thật.
   - File chính: `app/(site)/*/page.tsx` hub + `lib/seo/schema-policy.ts`.
7. **Content discovery signal**
   - Thêm feed RSS cho nhóm content phù hợp (posts/guides) để tăng discoverability.
   - File dự kiến: `app/feed.xml/route.ts` (hoặc tương đương theo kiến trúc hiện tại).

### P2 — Nice-to-have (Effort: 1–1.5 ngày)
8. **SEO observability nhẹ**
   - Thêm logging/anomaly guard cho metadata thiếu title/description/canonical trong runtime server.
   - Không thêm vendor ngoài scope; chỉ guard nội bộ.
9. **Internal linking reinforcement**
   - Chuẩn hóa related-links block cho detail pages để tăng crawl depth.

## File-level implementation map (dự kiến)
- `lib/seo/metadata.ts`: mở rộng builder contract và fallback chain.
- `lib/seo/route-policy.ts`: hoàn thiện rule index/noindex + canonical behavior.
- `lib/seo/schema-policy.ts`: bổ sung ItemList/Breadcrumb/Article/Product/Service/FAQ coverage.
- `app/sitemap.ts`: hardening dữ liệu sitemap.
- `app/robots.ts`: đồng bộ disallow/index policy.
- `app/(site)/**/layout.tsx`, `app/(site)/**/page.tsx`: áp dụng thống nhất metadata + JsonLd theo loại trang.
- `app/**/opengraph-image.tsx` (nếu thiếu): chuẩn hóa OG output.
- `app/feed.xml/route.ts` (nếu chưa có): feed cho content-driven SEO.

## Verification Plan
- **Static checks (theo guideline repo, không chạy lint/test/build):**
  - Soát thủ công 100% route public có metadata hợp lệ (title/description/canonical/robots/OG/Twitter).
  - Soát schema theo intent trang (hub/list/detail) không phát sai type.
  - Soát sitemap không chứa route disallow/noindex.
- **Repro checks thủ công:**
  - Mở các route mẫu: homepage, 1 hub, 1 detail post, 1 detail product, 1 detail service, 1 utility page (cart/checkout).
  - Xác nhận head tags, canonical, robots, JSON-LD đúng kỳ vọng.
- **Pass criteria:**
  - Tăng full coverage SEO cho toàn bộ public site theo checklist P0+P1.
  - Không phá contract zero-config hiện có.
  - Dễ rollback theo cụm file/module.