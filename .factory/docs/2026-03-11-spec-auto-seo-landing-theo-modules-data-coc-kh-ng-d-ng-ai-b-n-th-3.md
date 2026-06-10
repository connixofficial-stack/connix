## Audit Summary
- **Observation:** `app/admin/landing-pages/*` hiện chỉ là CRUD thủ công (create/edit/list), không có auto-generate từ module/data.
- **Observation:** Public SEO surface đã có đủ 7 cụm route và detail route (`app/(site)/features|use-cases|solutions|compare|integrations|templates|guides`), có `generateMetadata`, JSON-LD, sitemap (`app/sitemap.ts`) và query `landingPages.listPublishedByType/getBySlug`.
- **Observation:** Có nguồn dữ liệu COC rõ ràng để tự động hóa: trạng thái module (`convex/admin/modules.ts`) + dữ liệu admin tables trong `convex/schema.ts`.
- **Inference:** Nền tảng SEO kỹ thuật đang ổn, nhưng bottleneck là **content production thủ công**, dễ rỗng trang/hub thiếu nội dung -> khó tăng thứ hạng nhanh.
- **Decision:** Giữ kiến trúc 7 cụm hiện có, thêm pipeline **auto-generate deterministic (không AI ngoài)** từ module bật + dữ liệu thật, ưu tiên chất lượng tối thiểu để tránh thin content.

## Root Cause Confidence
- **High**: Gốc vấn đề không nằm ở thiếu route/sitemap/schema, mà ở thiếu cơ chế tạo & làm mới nội dung theo dữ liệu vận hành. Evidence: đã có route + metadata + sitemap, nhưng không có mutation/job auto-gen tương ứng trong `landingPages`.

## Proposal (COC + thực dụng cho 7 ngày)
1. **Tạo engine sinh nội dung deterministic** (template-based, không AI):
   - File mới: `lib/seo/programmatic-landing.ts`
   - Input: enabled modules + dữ liệu thật (products/services/posts/promotions...)
   - Output: `title/slug/summary/content/faqItems/relatedSlugs/landingType` cho 7 cụm.
2. **Thêm Convex mutation upsert hàng loạt idempotent**:
   - Update `convex/landingPages.ts`: `upsertProgrammaticFromModules` + `previewProgrammaticPlan`
   - Quy tắc slug ổn định, không tạo trùng, update theo hash nội dung.
3. **Map module -> 7 cụm landing (COC)**:
   - Feature: module capabilities
   - Use-case: ngành/ngữ cảnh từ dữ liệu thật
   - Solution: bundle nhiều module bật cùng lúc
   - Compare: so sánh gói/module-level
   - Integration: modules tích hợp (analytics/notifications/...)
   - Template: mẫu triển khai từ cấu hình hiện tại
   - Guide: hướng dẫn thao tác dựa trên flow admin thực tế
4. **Guardrail chất lượng SEO tối thiểu**:
   - Không publish nếu dưới ngưỡng nội dung (vd < 500–700 chữ hữu ích hoặc thiếu FAQ/related links).
   - Auto internal links chéo giữa 7 cụm + entity pages liên quan.
   - Chỉ lấy dữ liệu có thật, không “bịa” claim.
5. **UI trigger trong admin landing pages**:
   - Update `app/admin/landing-pages/page.tsx`: thêm nút `Tạo tự động theo module bật` + `Xem trước số trang sẽ tạo/cập nhật`.
6. **Mặc định publish strategy**:
   - Lần đầu: tạo `draft` để review nhanh 1 lượt.
   - Lần sau: auto-update và giữ `published` cho trang đã duyệt.

## KPI/Outcome thực tế cho 7 ngày
- Không cam kết “lên top chắc chắn” (không kiểm soát thuật toán Google), nhưng có thể cam kết:
  - 7 cụm có nội dung indexable, không rỗng.
  - Sitemap có URL mới đầy đủ.
  - Có cơ hội đạt **top 20 từ khóa ngách** nếu domain đã có tín hiệu nền + internal link hợp lý.

## Verification Plan
- Static review: typing, null-safety, idempotency, duplicate-slug safety, fallback khi module tắt/không có data.
- Chạy **`bunx tsc --noEmit`** sau khi đổi TS/code.
- Repro checklist cho tester (không chạy lint/unit theo repo rule):
  1) Bật/tắt module ở `/system/modules` -> chạy auto-gen.
  2) Xác nhận tạo/cập nhật đủ 7 cụm trong `/admin/landing-pages`.
  3) Xác nhận route public render đúng metadata/schema/sitemap URL.
  4) Xác nhận trang thiếu dữ liệu bị giữ draft/noindex theo guardrail.