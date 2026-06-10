## Audit Summary
- `app/system/seo/page.tsx` hiện chỉ có overview SEO (sitemap/robots), chưa có phần quản lý landing pages.
- `app/admin/landing-pages/*` đang chứa đầy đủ list + bulk actions + create/edit.
- Sidebar `/system` đã có mục SEO, phù hợp để gom toàn bộ flow quản lý SEO về System.

## Root Cause Confidence
- **High**: Vấn đề nằm ở vị trí UX (đặt trong Admin không phù hợp vai trò cấu hình hệ thống), không phải lỗi dữ liệu/Convex.

## Plan triển khai (theo đúng lựa chọn của bạn)
1. **Nâng cấp `/system/seo` thành giao diện tab**
   - Tab 1: `Overview` (giữ nguyên nội dung hiện tại).
   - Tab 2: `Landing Pages` (nhúng list quản lý từ admin, giữ bulk delete/publish/draft/open _blank).
2. **Di chuyển create/edit sang System SEO**
   - Tạo route mới:
     - `/system/seo/create`
     - `/system/seo/[id]/edit`
   - Di chuyển logic từ:
     - `app/admin/landing-pages/create/page.tsx`
     - `app/admin/landing-pages/[id]/edit/page.tsx`
   - Update link điều hướng trong tab Landing Pages sang route mới ở `/system/seo/*`.
3. **Bỏ route cũ ở Admin**
   - Xóa toàn bộ thư mục `app/admin/landing-pages` (list/create/edit) theo yêu cầu “bỏ luôn”.
   - Không redirect, không trang trung gian.
4. **Giữ backend Convex không đổi contract**
   - Reuse `api.landingPages.*` hiện có, không đổi schema data.
5. **Cập nhật i18n label nếu cần**
   - Nếu tab title dùng text mới, cập nhật nhẹ tại `app/system/i18n/translations.ts`.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`.
- Manual:
  1) Vào `/system/seo` thấy 2 tab `Overview` và `Landing Pages`.
  2) Tab `Landing Pages` chạy đủ: search, bulk status, bulk delete, mở _blank trang published.
  3) Tạo mới/sửa chạy ở `/system/seo/create` và `/system/seo/[id]/edit`.
  4) `/admin/landing-pages` không còn tồn tại (404).