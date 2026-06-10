## Problem Graph
1. [Main] Đổi hành vi phân quyền theo yêu cầu mới <- depends on 1.1, 1.2, 1.3
   1.1 [Seed Wizard UX] xử lý toàn bộ quyết định phân quyền ngay trong wizard, không điều hướng/link sang `/system/modules/roles`
   1.2 [Roles module toggle] cho phép bật/tắt roles từ `/system/modules`
   1.3 [Permission model mới] nếu từng chọn mode đơn giản thì admin thường luôn full quyền (sticky), chỉ Super Admin được quản lý quyền của nhóm full-admin

## Execution (with reflection)
1. Seed Wizard: thêm step riêng “Phân quyền admin” ngay trong flow
   - File mới: `components/data/seed-wizard/steps/AdminPermissionModeStep.tsx`
   - File sửa: `components/data/seed-wizard/types.ts`, `components/data/SeedWizardDialog.tsx`, `components/data/seed-wizard/steps/ReviewStep.tsx`
   - Nội dung step:
     - Cho chọn mode: `simpleFullAdmin` (mặc định bật theo yêu cầu).
     - Text rõ: “Admin thường full quyền toàn hệ thống; quyền phân vai trò chỉ Super Admin quản lý”.
     - Không có link sang `/system/modules/roles`.
   - Reflection: ✓ Đúng ý “ở seed wizard luôn chứ không cần link sang module roles”.

2. Cho phép toggle module roles ở `/system/modules`
   - File sửa: `convex/seeders/adminModules.seeder.ts`
   - Đổi `roles.isCore: true -> false` để toggle trực tiếp như module thường.
   - Reflection: ✓ Phù hợp quyết định trước đó của bạn.

3. Thêm cờ hệ thống để lưu “mode phân quyền sticky”
   - Dùng settings hiện có, không tạo bảng mới (KISS/YAGNI).
   - Key đề xuất: `admin_permission_mode = simple_full_admin | rbac`
   - File sửa chính: `components/data/SeedWizardDialog.tsx` (khi seed), `convex/lib/permissions.ts`, `app/admin/auth/context.tsx`.

4. Runtime permission theo cờ sticky (ưu tiên backend)
   - File: `convex/lib/permissions.ts`
   - Logic mới trong `requireAdminPermission`:
     - Nếu `admin_permission_mode === simple_full_admin` => cho phép full quyền với mọi admin đã đăng nhập.
     - Nếu `rbac` => chạy RBAC như hiện tại.
   - Điều này độc lập với toggle roles on/off, nên **bật lại roles vẫn full quyền** đúng yêu cầu “sticky”.
   - Reflection: ✓ Đáp ứng chính xác yêu cầu mới “ban đầu tắt, sau bật lại vẫn full quyền hết”.

5. Đồng bộ UI check quyền để không ẩn sai nút
   - File: `app/admin/auth/context.tsx`
   - `hasPermission(...)` đọc `admin_permission_mode`:
     - `simple_full_admin` => return true.
     - `rbac` => dùng permissions hiện tại.
   - Reflection: ✓ FE/BE nhất quán.

6. Chặn thao tác quản lý quyền full-admin cho non-super-admin
   - File: `convex/roles.ts` + một phần `convex/users.ts` (điểm đổi role)
   - Rule:
     - Khi ở `simple_full_admin`, các thao tác làm thay đổi cơ chế quyền (create/update/delete role, gán role đặc biệt liên quan quyền) chỉ cho Super Admin.
     - Non-super-admin vẫn thao tác nghiệp vụ modules khác bình thường (vì full-admin mode).
   - Reflection: ✓ Đúng ý “để sửa quyền của mớ admin full quyền thì chính là super admin do system cấp”.

7. Áp dụng khi seed
   - File: `components/data/SeedWizardDialog.tsx`
   - Trong `handleSeed()`:
     - Lưu setting `admin_permission_mode` theo lựa chọn step mới.
     - Nếu chọn simple mode, wizard có thể tự tắt roles mặc định ban đầu (theo yêu cầu bạn đang dùng), nhưng không phụ thuộc vào trạng thái roles cho runtime permission.
     - Khi bật lại roles sau này không đổi mode trừ khi Super Admin đổi explicit.

8. ReviewStep hiển thị rõ kết quả, không link ngoài
   - File: `components/data/seed-wizard/steps/ReviewStep.tsx`
   - Hiển thị block “Phân quyền admin: Full quyền (sticky)” + note “chỉ Super Admin quản lý quyền”.
   - Không hiển thị CTA/link qua `/system/modules/roles`.

9. Verification & commit (sau khi bạn duyệt spec)
   - Chạy: `bunx tsc --noEmit`.
   - Commit toàn bộ thay đổi code, kèm `.factory/docs` nếu có thay đổi trong commit set.

## Checklist kỳ vọng sau triển khai
- [ ] Seed Wizard có step phân quyền riêng, xử lý tại chỗ, không link sang `/system/modules/roles`.
- [ ] Có thể tắt/bật module roles tại `/system/modules`.
- [ ] Nếu đã chọn `simple_full_admin`, mọi admin thường full quyền kể cả khi bật lại roles sau này.
- [ ] Chỉ Super Admin mới được thao tác phần thay đổi/quản trị quyền trong mode full-admin sticky.
- [ ] Không phá flow đăng nhập hiện tại, không ảnh hưởng module guard.

Nếu bạn duyệt, tôi sẽ implement đúng spec này, không mở rộng thêm.