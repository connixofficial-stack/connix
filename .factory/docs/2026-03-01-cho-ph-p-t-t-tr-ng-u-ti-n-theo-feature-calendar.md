Đã rõ yêu cầu của bạn: **priority không còn là system field**, khi tắt feature `enablePriority` thì **tự tắt luôn field `priority`**, dữ liệu cũ **giữ nguyên DB** và chỉ ẩn/không cho chỉnh.

## Problem Graph
1. [Main] Cho phép tắt trường ưu tiên qua tính năng ưu tiên ở `/system/modules/calendar` <- depends on 1.1, 1.2, 1.3
   1.1 [Backend guard] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `updateModuleField` chặn `enabled=false` cho mọi `isSystem=true`, trong seed hiện `priority` đang là system field
   1.2 [UI state sync] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Toggle feature chưa ép auto-sync field `priority` theo yêu cầu mới
   1.3 [Runtime behavior] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Form/list vẫn có thể hiển thị/chỉnh `priority` nếu chỉ tắt feature mà chưa đồng bộ field enabled

## Execution (with reflection)
1. Solving 1.1.1 (đưa priority khỏi system)
- File: `convex/seeders/calendar.seeder.ts`
- Thay đổi: sửa seed field `priority` từ `isSystem: true` -> `isSystem: false` (giữ `required: true` nếu đang dùng rule này cho UI badge), vẫn linked `enablePriority`.
- Reflection: ✓ Đúng yêu cầu “đưa ưu tiên khỏi system field”; không mở rộng sang field system khác.

2. Solving 1.2.1 (auto tắt field khi tắt feature)
- File: `lib/modules/hooks/useModuleConfig.ts`
- Thay đổi trong `handleToggleFeature`:
  - Giữ logic linked field hiện có.
  - Bổ sung nhánh đặc thù `calendar + enablePriority`: khi feature chuyển `false` thì set `priority.enabled=false`; khi bật lại thì set `priority.enabled=true`.
- Reflection: ✓ Đảm bảo UX “tắt feature là tắt luôn field” ngay trên local state trước khi Save.

3. Solving 1.3.1 (ẩn/không chỉnh priority khi feature tắt)
- File: `app/admin/calendar/_components/CalendarTaskForm.tsx`
- Thay đổi:
  - Đã có cơ chế `enabledFields.has('priority')`; sẽ rà soát để chắc chắn:
    - Không render input priority nếu field disabled.
    - Payload create/update không gửi `priority` khi disabled.
  - Để tránh lỗi schema bắt buộc ở create (`priority` hiện required ở mutation), khi không gửi priority sẽ fallback an toàn tại mutation.
- File: `convex/calendar.ts`
- Thay đổi:
  - `createCalendarTask`: cho phép `priority` optional và fallback `MEDIUM` ở server nếu thiếu.
  - `updateCalendarTask`: giữ optional như hiện tại.
- Reflection: ✓ Giữ dữ liệu cũ nguyên DB; dữ liệu mới không bị crash khi feature priority tắt.

4. Bổ sung an toàn backend (không bắt buộc nhưng cần để không vỡ dữ liệu cũ)
- File: `convex/admin/modules.ts`
- Thay đổi nhỏ, đúng phạm vi:
  - Guard `Cannot disable system field` vẫn giữ nguyên cho mọi field system.
  - Vì `priority` đã chuyển khỏi system nên không còn bị guard này chặn.
- Reflection: ✓ Không nới lỏng guard toàn cục, an toàn hơn.

5. Verification + commit
- Chạy: `bunx tsc --noEmit`
- Kiểm tra: tắt `enablePriority` ở `/system/modules/calendar`, Save thành công, không còn console error `Cannot disable system field`, form calendar không hiện/chỉnh priority.
- Commit (kèm `.factory/docs` theo rule repo).

## Checklist chốt
- [ ] `priority` không còn là system field trong seed
- [ ] Tắt `enablePriority` => `priority` field tự động disabled
- [ ] Calendar form/list ẩn/không chỉnh priority khi disabled
- [ ] Không còn lỗi Convex `Cannot disable system field` cho case này
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit đầy đủ (kèm `.factory/docs` nếu có)