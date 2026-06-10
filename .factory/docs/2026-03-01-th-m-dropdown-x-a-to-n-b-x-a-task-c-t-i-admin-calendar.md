## Problem Graph
1. [Main] Thêm dropdown hành động xóa hàng loạt trong `/admin/calendar` <- depends on 1.1, 1.2, 1.3
   1.1 [Sub] Thiếu backend mutation tối ưu để xóa theo điều kiện thời gian
      1.1.1 [ROOT CAUSE] Hiện tại chỉ có `deleteCalendarTask(id)` nên phải loop N request ở client
   1.2 [Sub] Chưa có UI dropdown ở header để trigger “xóa toàn bộ” và “xóa task cũ”
   1.3 [Sub] Chưa có confirm 2 bước (nhập `XOA`) cho thao tác nguy hiểm

## Execution (with reflection)
1. Solving 1.1.1 (backend bulk delete)
   - Thought: Cần mutation server-side để giảm số lần gọi DB/network, đúng KISS + tối ưu bandwidth.
   - Action:
     - Sửa `convex/calendar.ts`, thêm:
       - `deleteAllCalendarTasks`: lấy task theo index `by_dueDate` (gte 0), xóa batch theo `limit` an toàn (vd 500), trả về `{ deletedCount }`.
       - `deleteOverdueCalendarTasks`: nhận `now`, query `by_dueDate` với `.lt('dueDate', now)`, xóa batch, trả về `{ deletedCount }`.
     - Dùng pattern validate/returns giống các mutation hiện có.
   - Reflection: ✓ Giảm N+1 từ client, gom logic xóa vào backend, không đổi schema.

2. Solving 1.2 (dropdown tại header cạnh nút Tạo task)
   - Thought: Codebase chưa có DropdownMenu component sẵn; làm dropdown tối giản bằng `Popover` có sẵn trong `ui.tsx` để giữ DRY/KISS.
   - Action:
     - Sửa `app/admin/calendar/page.tsx`:
       - Thêm state mở/đóng popover hành động.
       - Thêm nút “Hành động” đặt cạnh nút “Tạo task” (góc phải trên).
       - Trong popover có 2 action:
         1) `Xóa toàn bộ task`
         2) `Xóa toàn bộ task cũ` (định nghĩa: task quá hạn `dueDate < now` theo xác nhận của bạn)
       - Khi click action, mở dialog confirm 2 bước tương ứng (không xóa ngay).
   - Reflection: ✓ Đúng vị trí UX bạn chọn, không cần tạo thư viện dropdown mới.

3. Solving 1.3 (confirm 2 bước nhập “XOA”)
   - Thought: `DeleteConfirmDialog` hiện chỉ confirm 1 bước; nên tạo dialog riêng cho “dangerous bulk action” để không phá behavior cũ.
   - Action:
     - Tạo mới `app/admin/components/BulkDeleteConfirmDialog.tsx`:
       - Props: `open`, `onOpenChange`, `title`, `description`, `confirmKeyword='XOA'`, `isLoading`, `onConfirm`.
       - UI: text warning + `Input` yêu cầu nhập đúng `XOA`.
       - Disable nút xóa nếu chưa nhập đúng keyword.
       - Reset input khi đóng dialog.
     - Quay lại `app/admin/calendar/page.tsx`:
       - Thêm 2 dialog state riêng:
         - `deleteAllDialogOpen`
         - `deleteOldDialogOpen`
       - Gọi mutation tương ứng khi confirm.
       - Hiển thị toast kết quả:
         - Nếu `deletedCount > 0`: success với số lượng.
         - Nếu `deletedCount = 0`: info “Không có task để xóa”.
       - Sau xóa: `refreshNow()`, clear selection/cursor nếu cần để UI đồng bộ.
   - Reflection: ✓ Đáp ứng đúng yêu cầu “Confirm 2 bước (nhập XOA)” và an toàn dữ liệu hơn.

4. Verification
   - Chạy typecheck duy nhất theo rule repo khi có thay đổi TS:
     - `bunx tsc --noEmit`
   - Smoke test thủ công tại `http://localhost:3000/admin/calendar`:
     - Dropdown hiện cạnh nút Tạo task.
     - Chọn “xóa toàn bộ task”: dialog bắt nhập `XOA`, xóa thành công, list cập nhật.
     - Chọn “xóa toàn bộ task cũ”: chỉ xóa task quá hạn, task chưa quá hạn còn nguyên.

5. Commit (sau khi bạn duyệt spec và mình implement)
   - Commit theo convention hiện tại (feat/fix scope calendar), ví dụ:
     - `feat(calendar): add header bulk delete dropdown with 2-step confirmation`
   - Kèm `.factory/docs` nếu thư mục này có thay đổi (theo rule repo).

### File dự kiến thay đổi
- `convex/calendar.ts` (thêm 2 mutation bulk delete)
- `app/admin/calendar/page.tsx` (thêm dropdown + flow dialog + gọi mutation)
- `app/admin/components/BulkDeleteConfirmDialog.tsx` (mới)

Checklist chốt:
- [x] Dropdown ở góc phải trên cạnh “Tạo task”
- [x] Có 2 action: xóa toàn bộ / xóa task cũ (quá hạn)
- [x] Confirm 2 bước bằng từ khóa `XOA`
- [x] Dùng server-side bulk mutation để tối ưu
- [x] Kiểm thử bằng `bunx tsc --noEmit` + smoke test UI