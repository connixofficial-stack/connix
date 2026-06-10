## Problem Graph
1. [Main] Nút “Mở Google Maps” phải phục vụ mục tiêu admin vào Google Maps để tự lấy iframe, không phụ thuộc iframe đã nhập <- depends on 1.1, 1.2
   1.1 [Logic nút] Mở URL cố định tiện nhất để lấy iframe
   1.2 [UI/UX] Nút luôn bấm được, bỏ trạng thái disable theo iframe

## Execution (with reflection)
1. Solving 1.1 (logic mở link)
   - Thought: Bạn xác nhận mục tiêu là mở nhanh Google Maps để lấy iframe, nên không parse `src` từ textarea nữa.
   - Action:
     - Trong `app/admin/settings/page.tsx`, đổi `onClick` của nút “Mở Google Maps” thành mở cố định:
       - `https://www.google.com/maps`
       - với `_blank`, `noopener,noreferrer`.
     - Lý do chọn URL này: phổ biến, ổn định, thao tác Share → Embed map trực tiếp.
   - Reflection: ✓ Đúng mục tiêu “mở để lấy iframe cho dễ”.

2. Solving 1.2 (UI nút)
   - Thought: Vì không còn phụ thuộc iframe đã nhập, nút cần luôn khả dụng.
   - Action:
     - Bỏ toàn bộ logic `extractIframeSrc`, `googleMapSrc`, `canOpenGoogleMap`.
     - Bỏ `disabled` của nút.
     - Đổi helper text bên cạnh thành hướng dẫn rõ ràng, ví dụ:
       - “Mở Google Maps để lấy mã nhúng iframe rồi dán vào ô phía trên.”
   - Reflection: ✓ Tránh hiểu nhầm, UX đúng flow admin.

3. Validation
   - Chạy `bunx tsc --noEmit`.
   - Test tay tại `/admin/settings` tab Liên hệ:
     - Chọn Google Maps nhúng.
     - Bấm nút mở tab Google Maps thành công dù textarea đang trống.

4. Commit
   - Commit message đề xuất: `fix(settings): make google maps button a direct embed shortcut`
   - Add kèm `.factory/docs` theo rule repo.

## Checklist scope
- [x] Nút mở Google Maps là shortcut cố định cho admin lấy iframe
- [x] Không còn phụ thuộc iframe đã dán
- [x] Nút luôn bấm được
- [x] Không thay đổi data model/backend