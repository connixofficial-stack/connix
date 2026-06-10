## TL;DR kiểu Feynman
- `llms.txt` luôn đọc domain mới trực tiếp từ settings nên cập nhật ngay.
- `robots.txt` và `sitemap.xml` là metadata routes có cache, nên cần revalidate khi đổi `site_url`.
- Flow lưu ở `/system/modules/settings` hiện chưa gọi API revalidate SEO.
- Vì vậy sau khi đổi domain, robots/sitemap vẫn giữ cache cũ.
- Patch nhanh: sau khi save settings module thành công, gọi `POST /api/internal/seo/revalidate` giống flow legacy `/admin/settings`.

## Audit Summary
1) **Triệu chứng (expected vs actual):**
- Expected: đổi domain ở `/system/modules/settings` thì `/robots.txt` + `/sitemap.xml` đổi theo ngay.
- Actual: 2 route này giữ domain cũ, trong khi `/llms.txt` đổi đúng.

2) **Phạm vi ảnh hưởng:**
- Ảnh hưởng SEO output của robots/sitemap trên môi trường production/public crawl.
- Không ảnh hưởng logic hiển thị UI admin trực tiếp.

3) **Khả năng tái hiện:**
- Tái hiện ổn định khi đổi `site_url` bằng settings module mà không trigger revalidate.

4) **Mốc thay đổi gần nhất liên quan:**
- Có sẵn endpoint `app/api/internal/seo/revalidate/route.ts` và đang được gọi từ `app/admin/settings/page.tsx` (legacy), nhưng không có trong flow module settings.

5) **Giả thuyết thay thế đã loại trừ (#6 bắt buộc):**
- Không phải do hàm resolve domain sai: `resolveSiteUrl()` vẫn query đúng key `site_url` từ Convex.
- Không phải do llms đặc biệt sai: llms đúng vì route handler đọc settings trực tiếp mỗi request.

6) **Tiêu chí pass/fail (#8 bắt buộc):**
- Pass: sau khi save domain ở `/system/modules/settings`, mở lại `/robots.txt` + `/sitemap.xml` thấy domain mới.
- Fail: save thành công nhưng 2 route vẫn giữ domain cũ.

## Root Cause Confidence
**High** — Có evidence rõ từ code path:
- `robots.ts`/`sitemap.ts` phụ thuộc `resolveSiteUrl()` (cacheable metadata route).
- Revalidate SEO chỉ được gọi ở flow legacy `app/admin/settings/page.tsx`.
- `useModuleConfig.handleSave` (flow `/system/modules/settings`) chưa gọi revalidate API.

## Files Impacted
- **Sửa:** `lib/modules/hooks/useModuleConfig.ts`
  - Vai trò hiện tại: xử lý save batch feature/field/setting cho module config.
  - Thay đổi: sau `Promise.all(promises)` thành công (riêng module `settings` hoặc khi đổi `site_url`), gọi `POST /api/internal/seo/revalidate` kèm secret header để invalid cache robots/sitemap.

- **Không đổi (tham chiếu):** `app/api/internal/seo/revalidate/route.ts`
  - Vai trò hiện tại: endpoint revalidate các route SEO.
  - Dùng lại nguyên trạng để giữ thay đổi nhỏ, dễ rollback.

## Execution Preview
1. Đọc `useModuleConfig.handleSave` để bám pattern toast/error hiện có.
2. Chèn bước gọi revalidate ngay sau save thành công, chỉ áp dụng cho `moduleKey === 'settings'` (và tối ưu chỉ khi `site_url` thực sự đổi).
3. Giữ fail-safe: nếu revalidate lỗi thì không rollback save settings; hiển thị cảnh báo nhẹ để biết SEO cache có thể chưa refresh.
4. Review tĩnh: typing, null-safety, không leak secret.

## Acceptance Criteria
- Khi đổi `site_url` trong `/system/modules/settings` và bấm lưu:
  - `settings` vẫn lưu thành công như hiện tại.
  - `robots.txt` và `sitemap.xml` phản ánh domain mới sau save.
  - Không ảnh hưởng các module khác dùng chung `useModuleConfig`.
- Nếu thiếu/không khớp secret revalidate:
  - Save settings vẫn thành công.
  - Có thông báo cảnh báo revalidate thất bại (không chặn luồng chính).

## Verification Plan
- **Typecheck:** chạy `bunx tsc --noEmit` (vì có thay đổi TS code).
- **Repro thủ công:**
  1) đổi `site_url` ở `/system/modules/settings`, save;
  2) mở `/robots.txt`, `/sitemap.xml` kiểm tra domain mới;
  3) mở `/llms.txt` xác nhận vẫn đúng như trước.
- **Runtime/integration:** để tester xác nhận theo quy trình dự án.

## Out of Scope
- Không refactor kiến trúc revalidate tập trung toàn hệ thống.
- Không đổi nội dung policy robots hoặc cấu trúc sitemap hiện tại.
- Không thêm alias `/robot.txt`.

## Risk / Rollback
- **Risk thấp:** chạm 1 hook save trung tâm; nếu gọi revalidate thất bại có thể thêm network call thừa nhưng không làm mất dữ liệu settings.
- **Rollback:** revert thay đổi tại `useModuleConfig.ts` là quay về trạng thái cũ ngay.
