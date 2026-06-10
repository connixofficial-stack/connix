## Audit Summary
- Observation: Repo nguồn `E:\NextJS\persional_project\system-nhan` có 3 commit mới nhất: `f294a187` (SEO metadata product detail), `e69bfc78` (JSON-LD freshness), `f8a8d7f7` (related products modes).
- Observation: Repo đích đã có sẵn các nền tảng cần thiết: `react-intersection-observer` đã có trong `package.json`, Convex đã có `api.products.listPublishedPaginated` và `api.products.countPublished`, các file đích tương ứng cũng đã tồn tại.
- Observation: Hai commit SEO cùng sửa `app/(site)/products/[slug]/layout.tsx`; commit experience sửa `app/(site)/products/[slug]/page.tsx`, `app/system/experiences/product-detail/page.tsx`, `components/experiences/previews/ProductDetailPreview.tsx`.
- Inference: Không có blocker về dependency, nhưng sẽ có merge thủ công ở `layout.tsx` và cần bám đúng pattern hiện có của repo đích để tránh overwrite logic riêng.
- Decision: Port đúng thứ tự logic nguồn `f294a187` → `e69bfc78` → `f8a8d7f7`, chỉ port code, rồi gom thành 1 commit tổng hợp ở repo đích theo yêu cầu của bạn.

## Root Cause Confidence
- High — Vì đã đối chiếu trực tiếp diff commit nguồn, file tồn tại ở repo đích, dependency và Convex contract tương ứng cũng đang có sẵn. Rủi ro chính không phải thiếu hạ tầng mà là merge thủ công đúng chỗ trong `layout.tsx` và `page.tsx`.

## TL;DR kiểu Feynman
- Có 3 thay đổi cần bê sang: 2 cái về SEO, 1 cái về phần “sản phẩm liên quan”.
- Repo đích đã có gần đủ đồ nghề, nên không cần thêm package hay query mới.
- Điểm khó nhất là 2 commit SEO cùng sửa một file layout, nên phải ghép tay cẩn thận.
- Phần experience sẽ thêm 3 mode cho “sản phẩm liên quan”: cố định 4 món, cuộn vô hạn, phân trang.
- Mình sẽ không port file `.factory/docs`, chỉ lấy code.
- Cuối cùng sẽ tạo 1 commit tổng hợp, không push.

## Files Impacted
### SEO
- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\(site)\products\[slug]\layout.tsx`
  - Vai trò hiện tại: sinh metadata và JSON-LD cho trang chi tiết sản phẩm.
  - Thay đổi: gộp 2 commit SEO để chuẩn hóa title/description, thêm `robots.googleBot`, đồng thời enrich product schema với `images`, `dateCreated`, `dateModified`.

- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\lib\seo\schema-policy.ts`
  - Vai trò hiện tại: định nghĩa builder cho JSON-LD schema.
  - Thay đổi: mở rộng `buildProductSchema` nhận `images`, `createdAt`, `updatedAt`; ưu tiên mảng ảnh khi có và phát thêm freshness fields.

- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\sitemap.ts`
  - Vai trò hiện tại: tạo sitemap tổng cho site.
  - Thay đổi: `lastModified` của URL sản phẩm sẽ ưu tiên `updatedAt`, fallback `_creationTime`.

### Experience / UI
- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\(site)\products\[slug]\page.tsx`
  - Vai trò hiện tại: render product detail thực tế với 3 layout classic/modern/minimal.
  - Thay đổi: thay related products cố định bằng config-driven modes (`fixed`/`infiniteScroll`/`pagination`), dùng `usePaginatedQuery` + `useInView`, truyền thêm props xuống các layout và `RelatedProductsSection`.

- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\system\experiences\product-detail\page.tsx`
  - Vai trò hiện tại: editor cấu hình experience product detail và preview admin.
  - Thay đổi: thêm `relatedProductsMode`, `relatedProductsPerPage` vào default config, normalize logic, control UI và preview props.

- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\components\experiences\previews\ProductDetailPreview.tsx`
  - Vai trò hiện tại: preview giả lập product detail trong experience editor.
  - Thay đổi: thêm preview phần related products theo 3 mode để parity với UI thật.

## Execution Preview
1. Đọc lại 6 file đích ở các đoạn thay đổi chính để tránh lệch context khi patch.
2. Port commit `f294a187` vào `layout.tsx` + `sitemap.ts`:
   - thêm helper `resolveProductTitle`, `resolveProductDescription`
   - bỏ giá khỏi `titleOverride`
   - thêm `robots.googleBot`
   - đổi `lastModified` product sitemap sang `updatedAt ?? _creationTime`.
3. Port commit `e69bfc78` vào `layout.tsx` + `schema-policy.ts`:
   - thu thập `productImages`, `productUpdatedAt`
   - mở rộng `generateProductSchema/buildProductSchema`
   - phát `image[]`, `dateCreated`, `dateModified`.
4. Port commit `f8a8d7f7` vào experience product detail:
   - thêm type/config `RelatedProductsMode`
   - thay query related products sang `usePaginatedQuery`
   - thêm pagination/infinite logic và props wiring
   - cập nhật editor controls + preview.
5. Tự review tĩnh toàn bộ thay đổi: type consistency, null-safety, backward compatibility của config cũ.
6. Chạy đúng rule repo trước commit: chỉ `bunx tsc --noEmit` vì có thay đổi TS/code; không chạy lint/unit test/build.
7. Review `git status`, `git diff --cached`, kiểm tra secrets, rồi tạo 1 commit tổng hợp; không push.

## Acceptance Criteria
- Product detail metadata không còn nối giá vào title; description được cắt gọn ổn định từ meta/description/SEO fallback.
- `robots.googleBot` xuất hiện trên metadata product detail với `max-snippet=-1`, `max-image-preview=large`, `max-video-preview=-1`.
- JSON-LD Product hỗ trợ mảng ảnh khi có nhiều ảnh và phát thêm `dateCreated`/`dateModified` khi dữ liệu tồn tại.
- Sitemap product URLs dùng `updatedAt` nếu có, fallback `_creationTime`.
- Experience product detail có 3 mode related products: `fixed`, `infiniteScroll`, `pagination` cùng setting số item mỗi trang/lần tải.
- Preview admin phản ánh đúng mode related products đã cấu hình.
- TypeScript pass với `bunx tsc --noEmit`.
- Repo đích có đúng 1 commit tổng hợp, không gồm `.factory/docs`, không push.

## Out of Scope
- Port các file spec `.factory/docs` từ repo nguồn.
- Thay đổi backend Convex query hoặc cài thêm dependency mới, vì repo đích đã có sẵn contract cần thiết.
- Chạy lint, unit test, build hoặc verification runtime/integration.

## Risk / Rollback
- Risk: `app/(site)/products/[slug]/layout.tsx` là điểm chồng chéo 2 commit SEO; merge sai có thể làm mất logic metadata hiện có.
- Risk: phần related products ở `page.tsx` khá dài; wiring sai props có thể gây lệch giữa 3 layout hoặc preview/site không parity.
- Rollback: vì thay đổi tập trung ở 6 file và sẽ gom 1 commit, rollback đơn giản bằng revert commit tổng hợp hoặc checkout từng file về `HEAD` trước đó.

## Verification Plan
- Typecheck: chạy `bunx tsc --noEmit` sau khi port xong vì có thay đổi TS/TSX.
- Static review: rà lại callsites của `buildProductSchema`, shape config `product_detail_ui`, fallback khi `updatedAt`/`images`/`categoryId` không tồn tại.
- Repro logic cần tự kiểm: đọc diff cuối cùng của 6 file để xác nhận 3 nhóm thay đổi đã hiện diện đúng thứ tự và không làm mất logic cũ.