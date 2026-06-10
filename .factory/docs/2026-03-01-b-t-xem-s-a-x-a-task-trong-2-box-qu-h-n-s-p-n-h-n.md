## Problem Graph
1. [Main] Cho phép thao tác task trực tiếp trong 2 box “Quá hạn” và “Sắp đến hạn” ở `/admin/calendar` <- depends on 1.1, 1.2, 1.3
   1.1 [UI interaction] Biến item từ read-only thành actionable (xem/sửa/xóa)
   1.2 [Data integrity] Dùng đúng `task._id` để mở modal edit và xóa qua confirm dialog hiện hữu
   1.3 [Regression safety] Không phá UX hiện có ở Month/Week/Day/List và không thay đổi API backend

## Execution (with reflection)
1. Solving 1.1 (UI interaction)
   - Thought: 2 box hiện chỉ render title + badge ngày, chưa có hành động.
   - Action:
     - Sửa file `app/admin/calendar/page.tsx` tại 2 đoạn map:
       - `(upcomingData?.overdue ?? []).map(...)`
       - `(upcomingData?.dueSoon ?? []).map(...)`
     - Đổi layout mỗi item thành 2 cụm:
       - Trái: `button` chứa tiêu đề (truncate) để “xem chi tiết” bằng cách mở **modal Sửa** tại chỗ (theo lựa chọn của bạn), không thêm nút Xem riêng.
       - Phải: giữ `Badge` ngày + thêm 2 action text button `Sửa` và `Xóa`.
     - Hành vi:
       - Click tiêu đề hoặc nút `Sửa`:
         - `setModalMode('edit')`
         - `setEditingTaskId(task._id)`
         - `setModalOpen(true)`
       - Click `Xóa`:
         - `setDeleteTarget({ _id: task._id, title: task.title })`
         - `setDeleteDialogOpen(true)`
   - Reflection: ✓ Valid vì tái sử dụng pattern thao tác đã có ở List/Day/Week/Month, không thêm flow mới.

2. Solving 1.2 (Data integrity)
   - Thought: `upcomingData` trả về `calendarTaskDoc` (có `_id` thật), nên edit/delete trực tiếp an toàn.
   - Action:
     - Không sửa `convex/calendar.ts` vì query/mutation hiện đủ dùng.
     - Giữ confirm dialog hiện tại (`DeleteConfirmDialog`) để tránh xóa nhầm đúng theo yêu cầu.
   - Reflection: ✓ Valid, giảm rủi ro side effect backend.

3. Solving 1.3 (Regression safety)
   - Thought: Cần đồng bộ style tối thiểu, không ảnh hưởng view khác.
   - Action:
     - Chỉ chỉnh đúng 1 file UI: `app/admin/calendar/page.tsx`.
     - Reuse state/handler sẵn có (`modal`, `deleteTarget`, `deleteDialogOpen`) để DRY/KISS.
     - Không đổi API contracts, không đổi schema.
   - Reflection: ✓ Valid, phạm vi nhỏ, đúng YAGNI.

4. Validation + commit plan
   - Chạy typecheck bắt buộc theo rule repo: `bunx tsc --noEmit`.
   - Nếu pass, commit local (không push) với message gợi ý:
     - `feat(calendar): enable edit and delete actions in overdue and due-soon cards`
   - Khi commit sẽ kiểm tra và add `.factory/docs` nếu thư mục này có thay đổi/chứa file cần đi kèm theo rule dự án.

## Files sẽ chỉnh
- `app/admin/calendar/page.tsx`

## Kết quả mong đợi sau khi implement
- Ở 2 box “Quá hạn” và “Sắp đến hạn”:
  - Bấm vào tiêu đề task => mở modal cập nhật task.
  - Có nút `Sửa` => mở modal cập nhật task.
  - Có nút `Xóa` => mở confirm dialog, xác nhận rồi xóa.
- Không thêm trang mới, không thêm nút “Xem” riêng, không đổi backend.

Nếu bạn duyệt spec này, tôi sẽ implement ngay đúng phạm vi trên.