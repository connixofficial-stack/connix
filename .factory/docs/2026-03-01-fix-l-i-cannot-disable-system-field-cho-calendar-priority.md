Đã chốt theo lựa chọn của bạn: **A** + **fallback MEDIUM ở backend**.

## Problem Graph
1. [Main] Không tắt được priority vì bị guard system field <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `calendar.priority` đang là `isSystem: true` trong seed nên `updateModuleField(enabled=false)` bị chặn.
   1.2 [Sync state] Toggle feature `enablePriority` chưa ép đồng bộ field `priority`.
   1.3 [Create safety] Khi tắt priority, create task có thể thiếu `priority` gây vỡ nếu backend vẫn bắt buộc.

## Kế hoạch implement (step-by-step, full scope)
1. **Đổi seed field priority thành non-system**
   - File: `convex/seeders/calendar.seeder.ts`
   - Sửa object field `priority`: `isSystem: false` (giữ các thuộc tính còn lại).
   - Mục tiêu: cho phép disable field mà không đụng guard toàn cục.

2. **Giữ nguyên guard system field toàn cục**
   - File: `convex/admin/modules.ts`
   - Không nới lỏng logic `if (field.isSystem && args.enabled === false) throw ...`.
   - Mục tiêu: bảo toàn an toàn cho các system field khác.

3. **Đồng bộ feature -> field trong UI cấu hình module**
   - File: `lib/modules/hooks/useModuleConfig.ts`
   - Trong `handleToggleFeature`, thêm nhánh `moduleKey==='calendar' && featureKey==='enablePriority'`:
     - `enabled=false` => set local field `priority.enabled=false`
     - `enabled=true` => set local field `priority.enabled=true`
   - Mục tiêu: UX đúng kỳ vọng “tắt feature là tắt field”.

4. **Cho phép create task khi priority đang tắt (fallback backend)**
   - File: `convex/calendar.ts`
   - `createCalendarTask`:
     - cho `priority` thành optional trong args schema.
     - khi insert: `priority: args.priority ?? 'MEDIUM'`.
   - `updateCalendarTask` giữ optional như hiện tại.
   - Mục tiêu: không crash create, dữ liệu cũ giữ nguyên.

5. **Rà soát form calendar không gửi priority khi field disabled**
   - File: `app/admin/calendar/_components/CalendarTaskForm.tsx`
   - Đảm bảo:
     - Không render input priority khi `enabledFields` không có `priority`.
     - Submit payload không gửi `priority` khi disabled.
   - Mục tiêu: UI/Backend nhất quán, tránh gửi dữ liệu ẩn.

6. **Typecheck & xác nhận hành vi**
   - Chạy: `bunx tsc --noEmit`.
   - Test tay:
     - `/system/modules/calendar`: tắt `enablePriority`, save thành công, không còn error `Cannot disable system field`.
     - `/admin/calendar`: ẩn toàn bộ UI priority theo field; vẫn tạo/sửa task bình thường.
     - Bật lại `enablePriority`: field/UI priority hiển thị lại.

7. **Commit theo rule repo**
   - Stage toàn bộ file thay đổi + kèm `.factory/docs` nếu có.
   - Commit message gợi ý: `fix(calendar): allow disabling priority via feature and fallback on create`.

## Checklist giao hàng
- [ ] Không còn lỗi Convex `Cannot disable system field` cho case calendar priority
- [ ] `priority` là non-system field trong seed
- [ ] Toggle `enablePriority` tự sync `priority.enabled`
- [ ] Create task không vỡ khi priority tắt (fallback `MEDIUM`)
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit đầy đủ (kèm `.factory/docs` nếu có)

## Best practices áp dụng
- KISS/YAGNI: chỉ sửa đúng đường đi gây lỗi, không mở rộng guard toàn hệ thống.
- Single source of truth: trạng thái field quyết định hiển thị UI priority.
- Backward-safe: dữ liệu cũ giữ nguyên; dữ liệu mới có fallback an toàn.