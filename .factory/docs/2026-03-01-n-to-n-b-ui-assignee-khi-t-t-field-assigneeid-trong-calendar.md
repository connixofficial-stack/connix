Đã chốt theo lựa chọn của anh: **Toàn bộ Calendar** (`/admin/calendar` + modal/create/edit).

## Problem Graph
1. [Main] Tắt field `assigneeId` nhưng UI phân công chưa ẩn hết <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `app/admin/calendar/page.tsx` chưa bám `fieldsData` cho assignee filter/cột list/query assignee.
   1.2 [ROOT CAUSE] Một số route form (`create/edit`) có redirect, nhưng logic form vẫn còn và cần chuẩn hóa điều kiện assignee nhất quán.
   1.3 [ROOT CAUSE] Khi field bị tắt lúc đang lọc assignee, state filter không reset nên có thể lọc ngầm.

## Execution (with reflection)
1. Chuẩn hóa flag assignee theo field enabled
   - File: `app/admin/calendar/page.tsx`
   - Thêm `isAssigneeEnabled = fieldsData?.some(f => f.fieldKey === 'assigneeId') ?? true`.
   - Reflection: ✓ Đồng bộ cùng pattern `isPriorityEnabled` hiện có.

2. Ẩn UI assignee ở trang `/admin/calendar`
   - File: `app/admin/calendar/page.tsx`
   - Chỉ render dropdown “Tất cả người phụ trách” khi `isAssigneeEnabled`.
   - Ở list table: ẩn cột “Phụ trách” + cell tương ứng khi `isAssigneeEnabled=false`.
   - Cập nhật `listColSpan` theo 2 điều kiện `isPriorityEnabled` và `isAssigneeEnabled` để không vỡ layout.
   - Reflection: ✓ Ẩn toàn bộ UI hiển thị/phân công tại trang chính.

3. Đồng bộ query + reset filter assignee
   - File: `app/admin/calendar/page.tsx`
   - `listCalendarTasksRange` và `listCalendarTasksPage`: chỉ truyền `assigneeId` khi `isAssigneeEnabled && assigneeFilter !== 'all'`, ngược lại `undefined`.
   - Thêm `useEffect` reset `assigneeFilter` về `'all'` khi `isAssigneeEnabled=false`.
   - Reflection: ✓ Tránh lọc ngầm khi UI đã ẩn.

4. Rà soát form modal/create/edit
   - Files:
     - `app/admin/calendar/_components/CalendarTaskForm.tsx`
     - `app/admin/calendar/create/page.tsx`
     - `app/admin/calendar/[id]/edit/page.tsx`
   - Xác nhận (và chỉ chỉnh nếu thiếu):
     - Select “Người phụ trách” chỉ render khi `enabledFields.has('assigneeId')`.
     - Payload create/update gửi `assigneeId` là `undefined` khi field tắt.
   - Reflection: ✓ Đảm bảo đồng bộ toàn bộ bề mặt UI theo yêu cầu “ẩn hết”.

5. Kiểm tra type + hành vi
   - Chạy: `bunx tsc --noEmit`.
   - Verify thủ công:
     - Tắt field `assigneeId` tại `/system/modules/calendar` và Save.
     - `/admin/calendar`: mất filter assignee, mất cột/cell phụ trách, không còn lọc assignee ngầm.
     - Mở modal/create/edit: không còn select người phụ trách.
     - Bật lại field: UI assignee xuất hiện lại đúng chỗ.
   - Reflection: ✓ Đúng KISS/YAGNI, chỉ sửa đúng vùng lỗi UI/query.

6. Commit theo rule repo
   - Commit code + add kèm `.factory/docs` nếu có.

## Checklist giao hàng
- [ ] Ẩn filter assignee ở `/admin/calendar` khi field tắt
- [ ] Ẩn cột/cell phụ trách ở list view khi field tắt
- [ ] Query không truyền `assigneeId` khi field tắt
- [ ] Reset `assigneeFilter` về `all` khi field tắt động
- [ ] Modal/create/edit không hiển thị select assignee khi field tắt
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit đầy đủ (kèm `.factory/docs` nếu có)

## Best practice áp dụng
- Single source of truth: chỉ dùng `listEnabledModuleFields` để quyết định UI/query.
- UI-query consistency: ẩn gì thì query không lọc theo field đó.
- Backward-safe: không đụng schema/data, chỉ chỉnh điều kiện hiển thị + filter state.