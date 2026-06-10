## Audit Summary

### Observation
- Nền SEO hiện tại đã có engine tốt (`lib/seo/metadata.ts`), metadata theo route/entity, `robots.ts`, `sitemap.ts`, JSON-LD cho post/product/service.
- Tuy nhiên vẫn còn các điểm khiến scale SEO chưa “world-class”:
  1) policy canonical/indexability/schema chưa gom thành contract cứng duy nhất,
  2) query cho sitemap còn nặng khi scale,
  3) chưa có full SaaS landing surface,
  4) admin vẫn có khả năng phải chỉnh tay một số SEO field.

### Inference
Để đạt mục tiêu anh vừa chốt (full implement 1 lần, cực mạnh, zero-config gần tuyệt đối), solution tối ưu là chuyển sang **Convention-over-Configuration SEO Platform**: hệ thống tự suy luận 95% từ dữ liệu thật, admin không cần hiểu SEO kỹ thuật.

### Decision
- Scope chốt: **Core + Full SaaS Surface** (theo lựa chọn của anh).
- UX chốt: **Zero-config gần như tuyệt đối** (theo lựa chọn của anh).
- Business schema chốt (em tự quyết): **Auto Organization mặc định, tự nâng LocalBusiness khi đủ dữ liệu thật** (an toàn nhất, tránh khai sai schema).

---

## Root Cause Confidence
**High**

- Vì codebase đã có nền technical SEO, nên nút thắt chính là kiến trúc vận hành: thiếu contract tập trung + thiếu programmatic landing + thiếu cơ chế tự động hóa để không phụ thuộc admin.
- Hướng này phù hợp CoC/KISS/YAGNI: ít config hơn, hành vi mặc định đúng, rollback dễ, mở rộng rõ ràng.

---

## Full Implementation Plan (một đợt triển khai hoàn chỉnh, không chia phase)

### A) Xây SEO Core Contract duy nhất (zero-config by default)
1. Chuẩn hóa một source-of-truth trong `lib/seo/`:
   - `route-policy.ts`: định nghĩa route type và policy index/canonical/schema/sitemap/cache.
   - `resolver.ts`: resolve title/description/image/canonical/indexability từ entity + site settings.
   - `metadata.ts`: chỉ còn nhiệm vụ build output chuẩn Next Metadata từ resolver.
2. Rule cứng toàn hệ thống:
   - private/admin/system/cart/checkout/account/wishlist luôn noindex.
   - public canonical luôn clean URL (bỏ tracking params).
   - module disabled hoặc entity không tồn tại => noindex + fallback metadata nhất quán.
3. Fallback chain không cần admin cấu hình tay:
   - title: entity.title/name -> site_name
   - description: entity.summary/excerpt/stripHtml(content) -> site_tagline/seo_description
   - image: entity.mainImage -> seo_og_image -> site_logo

### B) Chuẩn hóa Schema Engine an toàn dữ liệu thật
1. Tạo `schema-policy.ts`:
   - luôn phát `WebSite + Organization` ở site scope.
   - chỉ phát `LocalBusiness` khi đủ tối thiểu: `site_name + site_url + contact_address + contact_phone|email`.
2. Detail pages:
   - post/guides: `Article + Breadcrumb`
   - product: `Product + Breadcrumb`
   - service: `Service + Breadcrumb`
3. Chặn schema “ảo”:
   - không phát field schema nếu thiếu dữ liệu thật.
   - không cho admin nhập raw JSON-LD.

### C) Refactor toàn bộ route metadata adapters về cùng contract
1. Cập nhật các layout/page public hiện có để chỉ gọi 1 adapter API thống nhất, không tự viết logic SEO rải rác:
   - `app/(site)/layout.tsx`
   - `app/(site)/page.tsx`
   - `app/(site)/posts/**`
   - `app/(site)/products/**`
   - `app/(site)/services/**`
   - `app/(site)/contact|stores|promotions/**`
2. Mỗi route chỉ truyền context tối thiểu (route type + entity minimal data), engine tự suy luận phần còn lại.

### D) Full SaaS Surface (build đầy đủ ngay trong đợt này)
1. Thêm đầy đủ route families:
   - `/features/[slug]`
   - `/use-cases/[slug]`
   - `/solutions/[slug]`
   - `/compare/[slug]`
   - `/integrations/[slug]`
   - `/templates/[slug]`
   - `/guides/[slug]`
2. Mỗi family dùng cùng page contract:
   - metadata auto derive,
   - canonical auto,
   - schema auto (Article/Breadcrumb/FAQ khi có dữ liệu hiển thị thực),
   - internal linking block auto (related entities/related pages).
3. Convex content model tối giản, CoC:
   - trường bắt buộc ít nhất: `slug`, `title`, `summary`, `status`, `updatedAt`, `heroImage?`, `primaryIntent`, `relatedRefs[]`.
   - không tạo “SEO settings” riêng cho từng template trừ khi thật sự cần.

### E) Sitemap + Robots chuẩn scale và free-tier friendly
1. `app/sitemap.ts` chuyển sang lightweight sitemap queries (projection-only: slug + lastModified).
2. Tạo sitemap index + sub-sitemaps theo type (posts/products/services/features/...)
3. `app/robots.ts` dùng duy nhất SEO policy contract để đồng bộ disallow và sitemap location.

### F) Cache/Rendering policy cứng cho SEO pages
1. Public SEO pages dùng server-first + revalidate TTL theo loại trang (định nghĩa trong route policy).
2. Tránh query dư trong `generateMetadata`:
   - chỉ query field cần SEO,
   - song song hóa query độc lập,
   - tránh fetch toàn bộ entity khi chỉ cần title/slug/updatedAt.
3. Private pages giữ dynamic + noindex.

### G) Zero-config Admin UX (cấm cấu hình tay dễ sai)
1. Giữ lại rất ít global settings:
   - `site_name`, `site_url`, `site_tagline`, `site_logo`, `site_favicon`, `seo_og_image`.
2. Ẩn hoặc loại bỏ các control dễ sai:
   - raw robots/hreflang/schema/manual canonical text.
3. Thêm SEO health panel read-only (không phải panel config):
   - hiển thị cảnh báo thiếu dữ liệu bắt buộc (vd thiếu site_url/contact).
   - hiển thị pass/fail theo policy từng template.

### H) Internal linking engine tự động
1. Tạo helper chọn related links theo taxonomy/intent/relation refs.
2. Mỗi detail page luôn có:
   - related pages cùng cụm,
   - link về hub,
   - breadcrumb chuẩn.
3. Anchor text ưu tiên intent phrase, tránh “xem thêm”.

### I) Governance và migration trong cùng đợt
1. Viết migration script cập nhật dữ liệu tối thiểu cho content types mới.
2. Backward compatibility:
   - entity cũ thiếu trường vẫn render được qua fallback chain.
3. Rollout an toàn:
   - giữ URL hiện hữu,
   - chỉ thêm route mới + chuẩn hóa engine, không phá permalink cũ.

### J) Deliverables chốt sau full implement
- SEO engine contract thống nhất.
- Full SaaS landing surface chạy được.
- Zero-config admin UX (chỉ còn essential globals).
- Sitemap index + sub-sitemaps + robots đồng bộ.
- Schema engine auto-safe.
- Internal linking auto theo cụm intent.

---

## Verification Plan

1. **Static verification (bắt buộc)**
- Chạy `bunx tsc --noEmit` sau khi code thay đổi TS.
- Soát typing/null-safety toàn bộ resolver + schema + route adapters.

2. **Contract verification theo route matrix**
- Kiểm từng route type: title/description/canonical/robots/schema/sitemap inclusion.
- Case bắt buộc: module off, slug not found, missing image, thiếu site_url, query params tracking.

3. **SEO output verification thực tế**
- Spot-check HTML output của các trang mẫu mới và cũ:
  - meta tags đầy đủ,
  - canonical đúng,
  - JSON-LD hợp lệ,
  - robots đúng policy.

4. **Performance/scale sanity check**
- Kiểm sitemap generation không gọi query nặng.
- Kiểm metadata resolver không tạo waterfall queries.

5. **Pass criteria để nghiệm thu full implement**
- Admin không cần cấu hình SEO kỹ thuật để site vẫn ra metadata/schema/canonical/sitemap đúng.
- 100% public templates dùng chung engine.
- 0 private route bị index.
- Full SaaS surface routes có thể publish và index theo policy.

Nếu anh duyệt, em sẽ triển khai đúng blueprint này trong một đợt full implement, không tách phase, ưu tiên CoC + ít config nhất cho Admin như anh yêu cầu.