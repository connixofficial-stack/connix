## Problem Graph
1. [Main] `/system/modules` vẫn hiện Calendar và click vào `/system/modules/calendar` bị 404
   1.1 [Sub] UI route đã đổi sang subscriptions nhưng dữ liệu module key trong DB chưa migrate
      1.1.1 [ROOT CAUSE] bảng `adminModules` vẫn còn record `key: "calendar"` từ seed cũ
   1.2 [Sub] Các bảng config liên quan vẫn có `moduleKey: "calendar"`
      1.2.1 [ROOT CAUSE] chưa có migration data one-time sau đợt rename

## Execution (with reflection)
1. Solving 1.1.1 (migrate adminModules key)...
   - Thought: Seed hiện tại đã tạo `subscriptions`, nhưng DB cũ không tự đổi key record đã tồn tại.
   - Action: Thêm mutation migration one-time trong `convex/admin/modules.ts` (hoặc file migration riêng trong convex) để:
     - tìm `adminModules` với `key === "calendar"`
     - nếu chưa có `subscriptions` thì patch record calendar -> subscriptions (name/description/icon giữ theo data mới)
     - nếu đã có cả 2 thì disable hoặc cleanup record calendar theo luật an toàn (không xóa mù).
   - Reflection: ✓ Giải đúng root cause hiển thị sai ở `/system/modules`.

2. Solving 1.2.1 (đồng bộ moduleKey ở config tables)...
   - Thought: Chỉ đổi `adminModules` sẽ chưa đủ; module settings/fields/features vẫn trỏ key cũ khiến trang config bị lệch.
   - Action: Trong cùng migration, patch toàn bộ record có `moduleKey: "calendar"` ở:
     - `moduleSettings`
     - `moduleFeatures`
     - `moduleFields`
     thành `moduleKey: "subscriptions"`.
   - Reflection: ✓ Đảm bảo `/system/modules/subscriptions` load đúng cấu hình cũ.

3. Bảo toàn behavior seed và tránh tái phát...
   - Thought: Nếu không có guard, sau này reseed có thể sinh lại calendar hoặc fail mâu thuẫn key.
   - Action:
     - Rà `convex/seeders/adminModules.seeder.ts`, `convex/seeders/subscriptions.seeder.ts`, `convex/seedManager.ts`, `convex/seeders/registry.ts` để đảm bảo chỉ còn `subscriptions`.
     - Bổ sung check idempotent trong migration: chạy nhiều lần không gây side effect.
   - Reflection: ✓ An toàn vận hành dài hạn, không phụ thuộc chạy đúng 1 lần.

4. Kích hoạt migration từ UI system modules (đúng ngữ cảnh lỗi user gặp)...
   - Thought: User đang thấy lỗi ở `/system/modules`, nên nên auto-heal nhẹ khi mở trang này.
   - Action:
     - Trong `app/system/modules/page.tsx`, thêm `useMutation(api.admin.modules.migrateCalendarToSubscriptions)` và gọi 1 lần trong `useEffect` trước hoặc song song lúc load modules.
     - Migration trả `{ success, changed, message }`; chỉ log/toast nhẹ khi có thay đổi.
   - Reflection: ✓ User vào lại trang sẽ tự hết lỗi, không cần thao tác tay.

5. Validation kỹ trước commit...
   - Thought: Cần chắc chắn không còn đường dẫn calendar bị render từ dữ liệu stale.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Verify logic bằng code-path: `listModules` trả key subscriptions sau migration.
     - Grep check không còn hardcoded route `/system/modules/calendar` ở luồng modules (trừ docs/legacy cho phép tồn tại).
   - Reflection: ✓ Đủ tin cậy trước khi commit.

6. Commit theo rule repo...
   - Action:
     - commit code fix + include `.factory/docs` (nếu có file spec mới).
     - Commit message đề xuất: `fix(modules): migrate stale calendar module key to subscriptions to prevent config 404`
   - Reflection: ✓ Đúng convention hiện tại.

## File-level change list (dự kiến)
- `convex/admin/modules.ts`
  - thêm mutation migration idempotent: migrate `calendar` -> `subscriptions` cho `adminModules/moduleSettings/moduleFeatures/moduleFields`.
- `app/system/modules/page.tsx`
  - gọi mutation migration one-time khi mở trang.
- (nếu cần) `convex/seeders/adminModules.seeder.ts`
  - xác nhận chỉ seed `subscriptions`.
- `.factory/docs/2026-03-05-fix-calendar-stale-module-key-causing-system-modules-404.md`
  - lưu spec theo rule dự án.

## Checklist done-definition
- [ ] Vào `/system/modules` không còn card Calendar (hiện Subscriptions)
- [ ] Link config đi tới `/system/modules/subscriptions` (không còn `/system/modules/calendar`)
- [ ] Migration idempotent, chạy lại không lỗi
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit hoàn tất (không push)

Anh đã chọn **Option A (migration chuẩn)**, em sẽ implement đúng hướng này ngay sau khi anh confirm spec.