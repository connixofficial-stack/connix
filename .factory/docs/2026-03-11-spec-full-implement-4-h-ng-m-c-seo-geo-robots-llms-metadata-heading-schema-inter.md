## Audit Summary
**Observation**
- Codebase đã có sẵn nền SEO tốt: `app/robots.ts`, `app/sitemap.ts`, nhiều `generateMetadata()` theo route, và schema engine ở `lib/seo/schema-policy.ts`.
- Thiếu lớp GEO-focused đồng bộ cho SaaS: `llms.txt`, chuẩn metadata contract dùng chung, schema entity signals sâu hơn (`sameAs`), và internal linking chiến lược giữa các hub.
- Bạn đã chốt: **full implement cả 4 nhóm**.

**Decision**
- Triển khai full cả 4, nhưng vẫn theo nguyên tắc ít conflict: ưu tiên utility/shared layer, sau đó apply vào nhóm route trọng điểm, cuối cùng mới scale rộng.

## Root Cause Confidence
**High**
- Vì vấn đề chính không nằm ở thiếu framework SEO, mà ở thiếu chuẩn hóa và GEO cohesion giữa các phần sẵn có.

## Full Implementation Plan (4/4)

### 1) Robots.txt + llms.txt (Full)
**Mục tiêu:** mở đường crawl đúng chỗ, chặn đúng chỗ, tăng AI discoverability.

**Files dự kiến:**
- `app/robots.ts` (update policy rõ ràng theo nhóm route)
- `app/llms.txt/route.ts` (new)
- `lib/seo/llms.ts` (new utility build content)

**Thay đổi chính:**
- Giữ disallow các route private (`/admin`, `/system`, checkout/account...).
- Chuẩn hóa crawler rules dễ đọc và dễ bảo trì.
- Thêm endpoint `llms.txt` sinh tự động từ site settings + các hub pages + nhóm content chính.
- Bảo đảm output llms có cấu trúc: Summary, Priority URLs, Sitemaps, Policies.

**SEO power kỳ vọng:** tăng khả năng AI crawler hiểu site map ưu tiên nhanh hơn, giảm crawl lãng phí.

---

### 2) Metadata + Heading (Full)
**Mục tiêu:** đồng nhất title/description/canonical/OG/Twitter và heading semantics trên cụm trang SEO chính.

**Files dự kiến:**
- `lib/seo/metadata.ts` (new utility/factory)
- Cập nhật các route hub chính:
  - `app/(site)/page.tsx`
  - `app/(site)/features/page.tsx`
  - `app/(site)/use-cases/page.tsx`
  - `app/(site)/solutions/page.tsx`
  - `app/(site)/compare/page.tsx`
  - `app/(site)/integrations/page.tsx`
  - `app/(site)/templates/page.tsx`
  - `app/(site)/guides/page.tsx`

**Thay đổi chính:**
- Tạo metadata factory dùng chung: title template, description fallback, canonical chuẩn, OG/Twitter mặc định.
- Áp dụng helper để giảm lặp code ở `generateMetadata()`.
- Rà soát heading contract: mỗi trang có 1 H1 rõ ý định tìm kiếm, H2 theo topic clusters.

**SEO power kỳ vọng:** cải thiện CTR snippet, giảm metadata inconsistency, tăng topical clarity.

---

### 3) Schema JSON-LD (Full)
**Mục tiêu:** tăng entity confidence và machine readability.

**Files dự kiến:**
- `lib/seo/schema-policy.ts` (update)
- `lib/seo/schema-helpers.ts` (new, nếu cần chuẩn hóa builder)
- Các điểm inject schema ở layout/page đang dùng schema policy (chỉ nơi cần)

**Thay đổi chính:**
- Mở rộng Organization/LocalBusiness với `sameAs` (social/profile URLs từ settings nếu có).
- Bổ sung guardrails field rỗng/null để JSON-LD sạch.
- Chuẩn hóa schema output cho hub pages (WebSite, Breadcrumb, ItemList khi phù hợp).
- Bảo toàn backward compatibility: không phá contract cũ.

**SEO power kỳ vọng:** tăng khả năng nhận diện entity, tăng cơ hội rich results/citation trust.

---

### 4) Internal Linking (Full)
**Mục tiêu:** tăng crawl depth hiệu quả, truyền topical authority giữa các hub và detail pages.

**Files dự kiến:**
- `lib/seo/internal-links.ts` (new link graph/config)
- Component dùng chung (nếu chưa có): `components/seo/InternalLinkCluster.tsx` (new)
- Áp dụng vào các hub pages đã liệt kê ở mục 2.

**Thay đổi chính:**
- Xây link graph giữa hubs: features ↔ use-cases ↔ solutions ↔ compare ↔ integrations ↔ templates ↔ guides.
- Thêm section “Liên quan”/“Khám phá thêm” ở cuối trang hub bằng component chung.
- Anchor text theo intent (không generic “xem thêm”).

**SEO power kỳ vọng:** tăng index coverage trang sâu, cải thiện semantic association theo cụm chủ đề.

---

## Chiến lược giảm conflict dù full implement
1. **Utility-first**: tạo helper trước, route apply sau.
2. **Batch theo cụm route**: hub pages trước, detail pages sau (nếu cần).
3. **Không chạm business logic/data contracts**: chỉ SEO layer.
4. **Patch nhỏ, độc lập**: mỗi hạng mục 1 commit logic riêng (dễ rollback).

## Verification Plan
### A. Crawl & Index
- Verify `GET /robots.txt`, `GET /sitemap.xml`, `GET /llms.txt` hợp lệ.
- Soát disallow không chặn nhầm trang public SEO.

### B. Metadata & Heading
- Spot-check homepage + 7 hub pages: title, description, canonical, OG/Twitter, single H1.

### C. Schema
- Soát JSON-LD output không field rỗng.
- Xác nhận Organization/LocalBusiness + sameAs xuất hiện đúng điều kiện.

### D. Internal Linking
- Soát mỗi hub có link cluster đến hub liên quan.
- Anchor text phản ánh đúng intent.

### E. KPI mapping (theo mục tiêu bạn chọn “cân bằng cả 3”)
- Crawl/index health: coverage + không lỗi robots.
- Organic readiness: metadata consistency và hub semantics.
- AI citation readiness: llms + schema + answer-first structure trên hub.

Nếu bạn duyệt spec này, mình sẽ triển khai **full cả 4** theo đúng thứ tự trên để tối đa SEO power nhưng vẫn kiểm soát conflict.