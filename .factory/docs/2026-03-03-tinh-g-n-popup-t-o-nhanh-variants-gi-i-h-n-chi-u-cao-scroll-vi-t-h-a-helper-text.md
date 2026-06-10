## Problem Graph
1. [Tối ưu UX popup Tạo nhanh variants] <- depends on 1.1, 1.2, 1.3
   1.1 [Popup đang quá cao/tràn viewport] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Container popup chưa giới hạn chiều cao tổng theo viewport, mới chỉ scroll ở bảng
   1.2 [Thuật ngữ Backorder chưa Việt hóa đồng nhất]
   1.3 [Input giá khó đọc số lớn] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Chưa có helper text format số theo hàng nghìn bên dưới input

## Execution (with reflection)
1. Giới hạn chiều cao popup + bật scroll dọc toàn popup
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Giữ popup width lớn như bạn chọn (không giảm width).
  - Thêm giới hạn chiều cao popup: `max-h-[85vh]`.
  - Cho phần body popup scroll dọc: tách layout thành 3 phần `header / content / footer`, trong đó `content` dùng `overflow-y-auto`.
  - Giữ bảng tổ hợp vẫn có `max-h` + scroll nội bộ để thao tác dữ liệu lớn không đẩy vỡ layout.
- Reflection: ✓ popup không tràn màn hình, vẫn giữ không gian ngang cho bảng.

2. Việt hóa Backorder
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi text:
  - Header cột `Backorder` -> `Cho đặt trước` (hoặc `Cho phép đặt trước`).
  - Label/switch liên quan trong row giữ tiếng Việt thống nhất.
- Reflection: ✓ đồng nhất ngôn ngữ UI admin.

3. Thêm helper text format số cho Giá bán / Giá trước giảm
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi logic:
  - Tạo helper formatter dùng `Intl.NumberFormat('en-US')` để hiển thị dạng `1,000` đúng yêu cầu.
  - Áp dụng cho:
    - input mặc định `Giá bán`, `Giá trước giảm` ở phần trên popup.
    - input theo từng dòng trong bảng tổ hợp.
  - Chỉ hiện helper khi input là số hợp lệ và > 0; không thêm hậu tố tiền tệ.
  - UI helper đặt ngay dưới input với text nhỏ, màu trung tính để không gây rối.
- Reflection: ✓ tăng khả năng đọc nhanh số lớn, đúng chuẩn bạn chọn.

4. Kiểm tra tương thích hiện tại
- Đảm bảo không ảnh hưởng logic hiện có:
  - `overwriteExisting`
  - validate `Giá trước giảm <= Giá bán`
  - submit mutation bulk.
- Reflection: ✓ chỉ thay UX/UI hiển thị, không đổi nghiệp vụ lõi.

5. Kiểm thử
- Chạy: `bunx tsc --noEmit`.
- Test tay:
  - Popup mở trên màn hình thấp vẫn không tràn, cuộn dọc mượt.
  - Cột/label Backorder đã Việt hóa.
  - Nhập `1000` ở giá => helper hiện `1,000` ở dưới; xóa input thì helper ẩn.
  - Flow tạo mới/ghi đè vẫn hoạt động như trước.

6. Commit
- `git status` + `git diff --cached` kiểm tra an toàn.
- Commit message đề xuất: `fix(products): compact quick-create modal and add price format helpers`
- Add kèm `.factory/docs` nếu có theo rule repo.

## Checklist chốt
- [ ] Popup không tràn màn hình, có scroll dọc
- [ ] Giữ width lớn như hiện tại
- [ ] Backorder được Việt hóa
- [ ] Giá bán/Giá trước giảm có helper `1,000` dưới input
- [ ] `bunx tsc --noEmit` pass