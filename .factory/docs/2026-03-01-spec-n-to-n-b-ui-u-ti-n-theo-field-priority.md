## Problem Graph
1. [Main] UI ưu tiên ở `/admin/calendar` phải ẩn khi tắt priority <- depends on 1.1
   1.1 [ROOT CAUSE] UI cần bám theo trạng thái field `priority` trong `moduleFields` để hiển thị/ẩn nhất quán

## Execution (with reflection)
1. Xác định nguồn trạng thái bật/tắt
   - File: `app/admin/calendar/page.tsx`
   - Dùng `listEnabledModuleFields` để lấy enabled fields của module calendar.
   - Tính `isPriorityEnabled = fieldsData?.some(f => f.fieldKey === 'priority') ?? true`.
   - Reflection: ✓ Đúng yêu cầu: bám theo field `priority` bật/tắt.

2. Ẩn toàn bộ UI liên quan ưu tiên
   - File: `app/admin/calendar/page.tsx`
   - Chỉ render khi `isPriorityEnabled`:
     - Select filter “Tất cả ưu tiên”.
     - Badge ưu tiên ở month/day/selected task.
     - Cột “Ưu tiên” trong list table.
   - Cập nhật `colSpan` table theo điều kiện để layout không vỡ.
   - Reflection: ✓ Đồng bộ đủ “filter + badge + cột” theo yêu cầu.

3. Đồng bộ query filter với trạng thái ẩn UI
   - File: `app/admin/calendar/page.tsx`
   - Với `listCalendarTasksRange` và `listCalendarTasksPage`, chỉ truyền `priority` khi `isPriorityEnabled && priorityFilter !== 'all'`, ngược lại truyền `undefined`.
   - Nếu field bị tắt trong lúc đang lọc priority, tự reset `priorityFilter` về `'all'` bằng `useEffect`.
   - Reflection: ✓ Tránh lọc ngầm theo priority khi UI đã ẩn.

4. Kiểm tra
   - Truy cập `/system/modules/calendar` tắt field `priority` rồi sang `/admin/calendar`:
     - Không còn filter ưu tiên.
     - Không còn badge/cột ưu tiên.
   - Bật lại field `priority`:
     - UI ưu tiên hiện lại đầy đủ.
   - Reflection: ✓ Đảm bảo hành vi đúng kỳ vọng user.

## Checklist giao hàng
- [ ] Ẩn filter ưu tiên khi field `priority` tắt
- [ ] Ẩn badge ưu tiên ở các view calendar khi field `priority` tắt
- [ ] Ẩn cột ưu tiên ở list view khi field `priority` tắt
- [ ] Query không lọc priority khi field `priority` tắt
- [ ] Reset `priorityFilter` về `all` khi priority bị tắt động

## Best practice áp dụng
- Single source of truth: chỉ dùng trạng thái field `priority` từ `moduleFields`.
- UI/Query consistency: hiển thị gì thì query đúng theo đó, tránh mismatch.
- Safe fallback: khi data fields chưa load, default `true` để không làm mất UI đột ngột.