## Problem Graph
1. Week view click đang chuyển sang Day view (khác kỳ vọng) <- depends on 1.1, 1.2
   1.1 Handler click ở ô ngày tuần đang `setView('day')` [ROOT CAUSE]
   1.2 Week view chưa có vùng detail panel như Month

## Execution (with reflection)
1. Sửa hành vi click ở Week view trong `app/admin/calendar/page.tsx`
   - Thought: Root cause là event handler của từng ô ngày tuần đang ép đổi view.
   - Action: Thay `onClick` của week cell từ `setCurrentDate(date); setView('day');` thành:
     - `setCurrentDate(date)` (giữ ngữ cảnh ngày)
     - `setSelectedDateKey(getDateKey(date))`
     - không đổi `view`.
   - Reflection: ✓ Đúng kỳ vọng “giữ nguyên Week view”.

2. Thêm detail panel cho Week view, giống Month
   - Thought: Reuse dữ liệu đã có (`selectedDateKey`, `selectedTasks`, `tasksByDay`) để DRY/KISS.
   - Action: Ngay dưới lưới tuần, render block chi tiết khi có `selectedDateKey`:
     - Header: `Task ngày {selectedDateKey}`
     - Empty state: “Không có task”
     - List task + action `Sửa/Xóa` y hệt Month (mở modal edit, mở dialog delete).
   - Reflection: ✓ Đồng nhất UX với Month, không thêm logic thừa.

3. Tránh state chọn ngày cũ gây nhiễu khi chuyển view
   - Thought: Nếu đang chọn ngày ở Month rồi chuyển sang Week có thể hiện panel không mong muốn.
   - Action: Khi bấm nút chuyển sang `Week`, reset `setSelectedDateKey(null)` để user click chọn lại trong tuần hiện tại.
   - Reflection: ✓ UX rõ ràng, tránh hiển thị detail ngoài ngữ cảnh tuần.

4. Verify + commit theo rule project
   - Action:
     - Chạy: `bunx tsc --noEmit`
     - Kiểm tra: `git status`, `git diff`, `git diff --cached`
     - Commit với message đề xuất: `fix(calendar): keep week view and show day details on click`
     - Khi commit, nếu có thư mục `.factory/docs` thì add kèm theo đúng rule repo.
   - Reflection: ✓ Đảm bảo pass typecheck và đúng quy trình commit nội bộ.

## Checklist triển khai
- [ ] Week click không còn chuyển sang Day view
- [ ] Week click mở detail panel bên dưới
- [ ] Panel có đầy đủ Sửa/Xóa
- [ ] Typecheck pass (`bunx tsc --noEmit`)
- [ ] Đã commit local, không push