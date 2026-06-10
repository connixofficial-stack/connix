## Problem Graph
1. Bổ sung khả năng xóa task đầy đủ trên `/admin/calendar` <- phụ thuộc 1.1, 1.2
   1.1 [ROOT CAUSE] UI hiện chỉ có nút `Xóa` ở List view, chưa có ở Month/Day (Week không có detail block để thao tác trực tiếp)
   1.2 Bulk delete chưa có state chọn dòng + action bar + confirm dialog

## Execution (with reflection)
1. Cập nhật UI xóa 1 task trên tất cả view liên quan (`app/admin/calendar/page.tsx`)
   - Thêm nút `Xóa` tại:
     - Month: block `selectedTasks`
     - Day: danh sách task trong ngày
     - List: giữ nguyên nút `Xóa`
   - Tất cả đều dùng chung `DeleteConfirmDialog` hiện có.
   - Reflection: đảm bảo UX đồng nhất, không tạo dialog mới dư thừa (KISS/DRY).

2. Thêm cơ chế chọn nhiều task ở List view để bulk delete (`app/admin/calendar/page.tsx`)
   - Import và dùng `BulkActionBar`, `SelectCheckbox` từ `app/admin/components/TableUtilities.tsx`.
   - Thêm cột checkbox trong bảng List:
     - Checkbox header = chọn/bỏ chọn toàn bộ **task đang hiển thị ở trang hiện tại**.
     - Checkbox từng dòng = chọn riêng từng task.
   - State mới dự kiến:
     - `selectedIds` (Id<'calendarTasks'>[])
     - `bulkDeleteDialogOpen`, `isBulkDeleting`
   - Đồng bộ selection:
     - Khi đổi filter/status/priority/assignee, keyword, page cursor/currentPage -> clear `selectedIds` để tránh xóa nhầm.
   - Reflection: đúng yêu cầu “bao gồm keyword nhưng chỉ trong trang hiện tại”.

3. Thêm luồng xác nhận bulk delete bằng `DeleteConfirmDialog` (`app/admin/calendar/page.tsx`)
   - Hiển thị `BulkActionBar` khi `selectedIds.length > 0`.
   - Nút xóa mở `DeleteConfirmDialog` với title kiểu `Xóa các task đã chọn`.
   - `onConfirm`: gọi `Promise.all(selectedIds.map(id => deleteTask({ id })))`, toast thành công/thất bại, clear selection, đóng dialog, `refreshNow()`.
   - Reflection: bám pattern các trang admin hiện có, không cần thêm mutation mới (YAGNI).

4. Rà soát hành vi và edge cases
   - Nếu task đã bị xóa trước đó: bắt lỗi mutation và báo toast phù hợp.
   - Đảm bảo không giữ `selectedIds` mồ côi sau khi dữ liệu list thay đổi.
   - Reflection: giảm rủi ro xóa nhầm và trạng thái UI sai.

5. Verify + commit theo rule repo
   - Chạy duy nhất: `bunx tsc --noEmit`.
   - Commit thay đổi code (không push), và nhớ include `.factory/docs` nếu có file phát sinh liên quan.

## Checklist chốt với anh
- [x] Xóa 1 task ở tất cả view khả dụng (List + Month + Day; Week chưa có detail action riêng).
- [x] Bulk delete dùng `DeleteConfirmDialog`.
- [x] Bulk delete áp dụng cho các task đang hiển thị ở **trang hiện tại**, đã tính cả keyword + filter hiện tại.
- [x] Giữ code gọn, tái sử dụng component sẵn có, không mở rộng ngoài phạm vi yêu cầu.