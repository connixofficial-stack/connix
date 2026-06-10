## Audit Summary
- **Observation**
  - Route create đang dùng `MultiImageUploader` với `columns={2}` + `layout="vertical"` tại `app/admin/home-components/create/partners/page.tsx`.
  - Route edit render qua `PartnersForm`, trong đó đang dùng `columns={4}` + `layout="horizontal"` tại `app/admin/home-components/partners/_components/PartnersForm.tsx`.
  - `layout="horizontal"` trong `MultiImageUploader` có khối nội dung rộng hơn và không phù hợp khi ép 4 cột, dễ gây cảm giác item chồng/lấn trên viewport nhỏ-trung bình.
- **Inference**
  - Lệch config giữa create/edit là nguyên nhân chính gây không đồng bộ UX.
  - Kiểu card ngang + 4 cột làm mật độ quá dày, gây hiện tượng “đè/chồng” như bạn phản ánh.
- **Decision**
  - Đồng bộ cả 2 màn theo cùng một config an toàn: **grid 4 + layout vertical** để giữ 4 cột như mong muốn nhưng tránh chồng item.

## Root Cause Confidence
- **High** — Có bằng chứng trực tiếp từ mã nguồn ở 2 route và component dùng chung (`page.tsx` create vs `PartnersForm.tsx` edit), khác biệt `columns/layout` là rõ ràng và tái hiện được bằng cấu hình hiện tại.

## Implementation Plan
1. Sửa `app/admin/home-components/partners/_components/PartnersForm.tsx`:
   - Đổi `layout="horizontal"` -> `layout="vertical"`.
   - Giữ `columns={4}` để khớp yêu cầu grid 4.
   - Giữ nguyên các props khác để không mở rộng scope.
2. Sửa `app/admin/home-components/create/partners/page.tsx`:
   - Đổi `columns={2}` -> `columns={4}`.
   - Giữ `layout="vertical"` (đã phù hợp).
3. Static self-review:
   - So khớp lại create/edit cùng behavior upload, reorder, link field.
   - Rà null-safety/type với `PartnerItem` mapping không đổi.
4. Sau khi bạn duyệt spec và cho phép thực thi:
   - Implement patch nhỏ, dễ rollback.
   - Thực hiện bước verify theo quy ước repo trước khi commit.

## Verification Plan
- **Typecheck**: chạy `bunx tsc --noEmit` (vì có thay đổi TS/TSX).
- **Repro UI thủ công**:
  1. Mở trang create partners, xác nhận grid hiển thị 4 cột theo breakpoint hiện tại của `MultiImageUploader`.
  2. Mở trang edit partners hiện có nhiều item, xác nhận không còn cảm giác card chồng/lấn, spacing đồng nhất với create.
  3. Kiểm tra upload/reorder/xóa/link input hoạt động bình thường trên cả 2 trang.
- **Pass/Fail**:
  - Pass khi create/edit cùng layout grid 4, không chồng item, hành vi form không regression.
  - Fail nếu còn lệch layout hoặc thao tác uploader bị vỡ.