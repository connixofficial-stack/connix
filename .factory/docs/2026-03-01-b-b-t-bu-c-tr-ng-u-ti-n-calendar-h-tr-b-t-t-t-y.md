## Problem Graph
1. [Main] Calendar "Ưu tiên" đang bị xem như bắt buộc và chưa đồng bộ khi tắt field <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Dữ liệu moduleFields của `calendar.priority` đang `required: true` từ seeder cũ
   1.2 Form create/edit luôn gửi `priority` nên chưa đúng kỳ vọng "tắt field thì không bắt gửi"
   1.3 UI `/admin/calendar` luôn hiển thị filter/badge/cột priority dù field có thể bị tắt

## Execution (with reflection)
1. Sửa nguồn seed để chuẩn mới không còn required cho `calendar.priority`
   - File: `convex/seeders/calendar.seeder.ts`
   - Đổi field `priority` trong `fields[]` từ `required: true` -> `required: false`.
   - Reflection: ✓ Đảm bảo seed mới đúng chuẩn, không tạo thêm data bắt buộc sai.

2. Migrate dữ liệu cũ khi mở trang config calendar
   - File: `lib/modules/hooks/useModuleConfig.ts`
   - Bổ sung logic chỉ cho `moduleKey === 'calendar'`: sau khi `fieldsData` load, nếu tìm thấy field `priority.required === true` thì gọi `updateModuleField({ id, required: false })` đúng 1 lần (guard bằng `useRef` để tránh loop gọi mutation).
   - Sau khi patch thành công: cập nhật `localFields` tương ứng và `toast.success` nhẹ; lỗi thì `toast.error`.
   - Reflection: ✓ Đáp ứng yêu cầu migrate bản ghi hiện có ngay khi vào `/system/modules/calendar`, không đụng module khác.

3. Cho phép create task không gửi priority khi field bị tắt; backend tự fallback
   - File: `app/admin/calendar/create/page.tsx`
   - Trong payload `createTask`, đổi:
     - từ `priority: priority as ...`
     - thành `priority: enabledFields.has('priority') ? (priority as ...) : undefined`
   - Giữ UI select priority chỉ hiển thị khi `enabledFields.has('priority')` (đã có sẵn).
   - Reflection: ✓ Frontend không còn ép gửi khi field tắt.

4. Cho phép edit task không gửi priority khi field bị tắt; backend tự fallback giữ giá trị cũ
   - File: `app/admin/calendar/[id]/edit/page.tsx`
   - Trong payload `updateTask`, đổi:
     - từ `priority: priority as ...`
     - thành `priority: enabledFields.has('priority') ? (priority as ...) : undefined`
   - Reflection: ✓ Tránh ghi đè priority khi field bị tắt.

5. Nới validator backend cho create để nhận `priority` optional + fallback MEDIUM
   - File: `convex/calendar.ts`
   - `createCalendarTask.args.priority`: đổi từ bắt buộc `calendarPriority` -> `v.optional(calendarPriority)`.
   - Khi insert DB: `priority: args.priority ?? 'MEDIUM'`.
   - Giữ `updateCalendarTask` như hiện tại (đã optional).
   - Reflection: ✓ Đúng yêu cầu “không gửi priority, backend tự fallback MEDIUM”.

6. Dọn UI admin calendar khi field priority bị tắt
   - File: `app/admin/calendar/page.tsx`
   - Thêm query `fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY })`.
   - Tạo `isPriorityEnabled = fieldsData?.some(f => f.fieldKey === 'priority') ?? true`.
   - Chỉ render các phần liên quan priority khi `isPriorityEnabled`:
     - dropdown filter "Tất cả ưu tiên"
     - badge priority ở month/day/selected/list
     - cột "Ưu tiên" trong list table
     - logic `priorityCounts` và `priorityFilter` query param truyền vào `listCalendarTasksRange`/`listCalendarTasksPage` (khi tắt thì luôn `undefined`).
   - Nếu đang có `priorityFilter != 'all'` mà field vừa tắt: reset về `all`.
   - Reflection: ✓ UI nhất quán với cấu hình field bật/tắt.

7. Typecheck theo rule dự án
   - Chạy: `bunx tsc --noEmit`.
   - Reflection: ✓ Đúng guideline repo (không chạy lint/test nặng).

8. Commit sau khi hoàn tất
   - Chạy theo an toàn: `git status` -> `git diff --cached` (sau khi stage) -> kiểm tra secrets -> commit.
   - Commit message đề xuất: `fix(calendar): make priority optional and respect field toggle`
   - Kèm `.factory/docs` nếu có thay đổi theo rule repo.
   - Reflection: ✓ Đáp ứng quy tắc bắt buộc commit, không push.

### Kết quả kỳ vọng
- Tại `/system/modules/calendar`, trường "Ưu tiên" nằm nhóm tùy chọn (không bắt buộc), bật/tắt bình thường.
- Dữ liệu cũ `required=true` được tự migrate về `false` khi mở trang config calendar.
- Khi tắt trường priority: form create/edit không gửi priority; backend create tự fallback `MEDIUM`.
- `/admin/calendar` tự ẩn filter/badge/cột priority khi field bị tắt.