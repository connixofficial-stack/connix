## Problem Graph
1. [Main] Dropdown gợi ý trong row menu hiện quá chật, khó scan nhiều route/danh mục <- depends on 1.1, 1.2
   1.1 [Sub] Panel đang bám theo ô URL nên chiều ngang hẹp
      1.1.1 [ROOT CAUSE] Dùng absolute dropdown trong cell URL của từng item
   1.2 [Sub] Trải nghiệm chọn route bị dồn thông tin khi có nhiều nhóm
      1.2.1 [ROOT CAUSE] Không có popup đủ rộng để hiển thị grouped options rõ ràng

## Execution (with reflection)
1. Tạo state popup tập trung theo item đang chọn
- File: `app/admin/menus/page.tsx`
- Thay đổi:
  - Thay `activeQuickPickerId` bằng state popup rõ ràng hơn:
    - `isQuickPickerOpen: boolean`
    - `quickPickerTargetId: string | null`
    - giữ `quickRouteSearch`
  - `handleOpenQuickPicker(item.localId)` mở modal center rộng.
  - `handleCloseQuickPicker()` đóng modal và reset search.
- Reflection: ✓ Tách rõ lifecycle popup, giảm logic click-outside phức tạp.

2. Đổi UI từ dropdown inline sang modal center rộng (theo lựa chọn của bạn)
- File: `app/admin/menus/page.tsx`
- Thay đổi:
  - Ở mỗi row chỉ giữ nút “Gợi ý” để mở popup.
  - Bỏ block dropdown absolute cũ dưới ô URL.
  - Render một modal dùng component sẵn trong `../components/ui`:
    - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
  - Kích thước: `max-w-4xl w-[80vw]` (desktop), mobile co giãn full-width an toàn.
  - Nội dung modal:
    - Input search ở trên
    - danh sách grouped routes hiện có (`Trang cơ bản / Module / Danh mục`)
    - hiển thị 2 cột trên desktop (`md:grid-cols-2`) để scan nhanh, 1 cột mobile.
- Reflection: ✓ Giữ UX gọn nhưng tăng khả năng quan sát nhiều option.

3. Hành vi chọn route: tự đóng popup
- File: `app/admin/menus/page.tsx`
- Thay đổi:
  - Khi click option:
    - cập nhật URL cho đúng `quickPickerTargetId`
    - đóng popup ngay
  - Nếu không còn target hợp lệ thì không set URL.
- Reflection: ✓ Đúng yêu cầu “chọn xong tự đóng popup”, flow nhanh.

4. QA + commit theo rule repo
- Chạy `bunx tsc --noEmit`.
- Commit local (không push), add file code + `.factory/docs` mới.
- Commit message đề xuất:
  - `feat(menus): switch quick link picker to centered modal`

## Checklist
- [ ] Refactor state mở/đóng popup
- [ ] Loại bỏ dropdown absolute cũ
- [ ] Dùng Dialog modal center rộng
- [ ] Hiển thị grouped options rõ ràng, dễ scan
- [ ] Chọn route xong tự đóng popup
- [ ] `bunx tsc --noEmit`
- [ ] Commit local (kèm .factory/docs)