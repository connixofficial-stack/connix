## Audit Summary
- Observation: 3 commit mới nhất của `E:\NextJS\persional_project\system-nhan` là `cb389187`, `03e3e747`, `dd0fadcf`, đều tập trung vào SEO runtime: đồng bộ `site_url` cho robots/sitemap/llms, cơ chế revalidate sau khi lưu settings, và harden metadata + breadcrumbs.
- Observation: Repo đích `system-vietadmin-nextjs` đã có sẵn hầu hết nền tảng tương ứng: `lib/seo/metadata.ts`, `app/robots.ts`, `app/sitemap.ts`, `app/sitemap/*.xml/route.ts`, `app/llms.txt/route.ts`, `app/admin/settings/page.tsx`, `components/seo/JsonLd.tsx`, `lib/get-settings.ts`.
- Observation: Có chênh lệch implementation giữa 2 repo: repo đích đang query `site_url` trực tiếp ở nhiều nơi; chưa có `app/manifest.ts`; `buildSeoMetadata` chưa nhận `social`; admin settings chưa trigger SEO revalidation; sitemap XML hiện đang resolve base URL qua helper cũ.
- Inference: 3 commit có thể port được theo kiểu cherry-pick logic, nhưng không nên cherry-pick git trực tiếp giữa 2 repo vì path/logic đã diverge; phù hợp hơn là port thủ công theo nội dung commit, vẫn giữ đúng intent.
- Decision: Áp dụng theo thứ tự phụ thuộc `cb389187` → `03e3e747` → `dd0fadcf`, để tránh sửa chồng logic robots/sitemap nhiều lần.

## Root Cause Confidence
- High: Repo đích đang thiếu 3 khối chức năng chính mà repo nguồn vừa bổ sung:
  1. Thiếu shared resolver cho `site_url`, nên robots/sitemap/llms còn tự query rải rác.
  2. Thiếu revalidate endpoint và wiring từ admin settings, nên robots/sitemap có nguy cơ stale sau khi đổi cấu hình SEO.
  3. Thiếu metadata hardening (social-aware twitter/open graph image metadata, manifest, breadcrumb schema ở các hub pages).
- Counter-hypothesis: Có thể repo đích cố tình giữ behavior hiện tại để tránh thêm runtime complexity. Tuy nhiên evidence cho thấy các file tương ứng đã tồn tại và cùng domain SEO, nên port theo pattern nguồn là tự nhiên và ít rủi ro hơn việc sáng tạo hướng mới.

## TL;DR kiểu Feynman
- Mình sẽ lấy 3 cải tiến SEO mới nhất từ `system-nhan` và chép logic sang repo này.
- Bước 1 là gom cách đọc `site_url` về 1 chỗ để robots/sitemap/llms luôn dùng cùng một domain.
- Bước 2 là khi admin lưu settings, web sẽ tự làm mới robots và sitemap thay vì chờ cache hết hạn.
- Bước 3 là bổ sung metadata đẹp hơn cho social share, thêm manifest và breadcrumb schema cho các trang hub.
- Vì 2 repo không giống nhau 100%, mình sẽ port thủ công theo logic commit thay vì cherry-pick raw.

## Files Impacted
### Shared / SEO
- Sửa: `lib/seo/sitemap-xml.ts` — hiện build XML và tự resolve `site_url`; sẽ đổi sang dùng shared site-url resolver.
- Thêm: `lib/seo/site-url.ts` — helper chuẩn hóa `site_url` từ settings/env để robots, sitemap, llms dùng chung.
- Sửa: `lib/seo/metadata.ts` — hiện build metadata chưa nhận social settings và chưa enrich twitter/openGraph image metadata; sẽ mở rộng API cho social-aware metadata.

### Routes SEO
- Sửa: `app/robots.ts` — hiện query `site_url` trực tiếp; sẽ dùng `resolveSiteUrl()`.
- Sửa: `app/sitemap.ts` — hiện query `site_url` trực tiếp; sẽ dùng `resolveSiteUrl()`.
- Sửa: `app/llms.txt/route.ts` — hiện tự normalize `site_url`; sẽ dùng helper mới để đồng bộ domain.
- Sửa: `app/sitemap/static.xml/route.ts` — hiện dùng `resolveBaseUrl()` cũ; có thể cần `dynamic = 'force-dynamic'` hoặc đồng bộ theo flow revalidate mới.
- Sửa: `app/sitemap/posts.xml/route.ts` — tương tự trên.
- Sửa: `app/sitemap/products.xml/route.ts` — tương tự trên.
- Sửa: `app/sitemap/services.xml/route.ts` — tương tự trên.
- Sửa: `app/sitemap/landings.xml/route.ts` — tương tự trên.
- Thêm: `app/api/internal/seo/revalidate/route.ts` — endpoint nội bộ để revalidate robots/sitemap khi settings thay đổi.
- Thêm: `app/manifest.ts` — manifest.webmanifest sinh từ settings site branding.

### Admin / Site UI
- Sửa: `app/admin/settings/page.tsx` — sau `setMultiple`, gọi endpoint revalidate SEO và báo lỗi mềm nếu call fail.
- Sửa: `app/(site)/layout.tsx` — bổ sung `manifest`, `icons.apple`, và đảm bảo metadata gắn social settings nếu cần.
- Sửa: một nhóm hub/detail pages dưới `app/(site)` như `compare`, `features`, `guides`, `integrations`, `posts`, `products`, `promotions`, `services`, `solutions`, `stores`, `templates`, `use-cases`, `contact`, `page.tsx` — chỉ những file đang có `generateMetadata`/schema tương ứng sẽ được patch để truyền `social` vào metadata và thêm breadcrumb schema ở các hub pages theo pattern nguồn.

## Execution Preview
1. Đọc diff chi tiết từng commit nguồn và map sang file tương ứng trong repo đích.
2. Tạo `lib/seo/site-url.ts`, rồi refactor `robots.ts`, `sitemap.ts`, `llms.txt`, `lib/seo/sitemap-xml.ts` sang helper mới.
3. Thêm `/api/internal/seo/revalidate` và nối call này vào `app/admin/settings/page.tsx` sau khi save.
4. Mở rộng `lib/seo/metadata.ts` để nhận `social`, normalize twitter handle, enrich OG/Twitter images.
5. Thêm `app/manifest.ts`, cập nhật `app/(site)/layout.tsx` cho manifest/icons.
6. Patch các site routes liên quan để truyền `getSocialSettings()` vào metadata và thêm breadcrumb JSON-LD cho hub pages theo đúng pattern sẵn có.
7. Tự review tĩnh toàn bộ thay đổi, sau đó chạy duy nhất `bunx tsc --noEmit` theo rule repo vì có thay đổi TypeScript/code.
8. Review `git status`, `git diff --cached`, commit local, không push.

## Acceptance Criteria
- `robots.ts`, `sitemap.ts`, `app/sitemap/*.xml`, `llms.txt` cùng dùng chung một nguồn `site_url` đã normalize.
- Sau khi lưu ở `app/admin/settings/page.tsx`, endpoint revalidate được gọi để làm mới robots/sitemap paths.
- `buildSeoMetadata` hỗ trợ social settings, có twitter/openGraph image metadata đầy đủ hơn.
- `app/(site)/layout.tsx` expose manifest và apple icon; repo có `app/manifest.ts`.
- Các hub pages được chọn có breadcrumb JSON-LD theo pattern hiện hữu của `JsonLd.generateBreadcrumbSchema`.
- TypeScript pass với `bunx tsc --noEmit`.
- Có commit local chứa toàn bộ thay đổi, không push.

## Verification Plan
- Static review: kiểm tra typing, null-safety, fallback `site_url`, secret handling cho revalidate endpoint, tương thích khi thiếu social/site settings.
- Typecheck: chạy `bunx tsc --noEmit` sau khi sửa xong vì có thay đổi TS/code.
- Repro checklist cho tester:
  1. Đổi `site_url` trong admin settings rồi kiểm tra `robots.txt`, `sitemap.xml`, `llms.txt` phản ánh domain mới.
  2. Kiểm tra source HTML của một hub page có breadcrumb JSON-LD.
  3. Kiểm tra metadata share của trang chủ/hub có twitter/openGraph images và manifest link.

## Risk / Rollback
- Rủi ro chính: revalidate secret config thiếu hoặc mismatch khiến endpoint fail; sẽ xử lý theo hướng fail-soft trong UI, không chặn save settings.
- Rủi ro phụ: một số page ở repo đích không hoàn toàn giống repo nguồn; chỉ patch các file thực sự có metadata/schema tương ứng để tránh mở rộng scope.
- Rollback: revert commit local là đủ vì thay đổi tập trung ở nhóm file SEO/app route, không đụng data migration.

## Out of Scope
- Không port các file `.factory/docs` từ repo nguồn nguyên xi.
- Không mở rộng sang audit SEO tổng thể ngoài 3 commit này.
- Không push remote.

Nếu bạn duyệt spec này, mình sẽ bắt đầu thực thi theo đúng thứ tự trên.