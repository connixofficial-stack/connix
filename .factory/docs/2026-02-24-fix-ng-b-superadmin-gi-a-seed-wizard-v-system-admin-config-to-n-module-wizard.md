## Problem Graph
1. Seed wizard xong nhưng `/system/admin-config` không giống thông tin đã nhập ở wizard <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Wizard chỉ gọi `createSuperAdmin` khi `superAdmin === null`; nếu đã tồn tại thì **không cập nhật** email/password theo wizard
   1.2 `/system/admin-config` đọc trực tiếp `getSuperAdmin` nên hiển thị dữ liệu cũ, tạo cảm giác “không giống wizard”

## Execution (with reflection)
1. Chuẩn hóa rule đồng bộ tại Seed Wizard (ghi đè toàn bộ)
   - Thought: Bạn xác nhận rõ: email/password trong wizard phải giống admin-config, và seed lại thì ghi đè toàn bộ.
   - Action (planned): Sửa `components/data/SeedWizardDialog.tsx` trong `handleSeed`:
     - Resolve `resolvedAdminEmail` + `resolvedAdminPassword` như hiện tại.
     - Đổi nhánh xử lý từ:
       - `if (superAdmin === null) createSuperAdmin(...)`
       - sang:
         - `if (superAdmin === null) createSuperAdmin(...)`
         - `else updateSuperAdminCredentials({ email: resolvedAdminEmail, password: resolvedAdminPassword, ...(name nếu có) })`
     - Dùng `useMutation(api.auth.updateSuperAdminCredentials)` ngay trong wizard để luôn đồng bộ sau seed.
   - Reflection: ✓ Bám đúng yêu cầu “ghi đè toàn bộ”, không thêm tính năng ngoài scope.

2. Đảm bảo không thiếu dữ liệu (fallback giữ nguyên)
   - Thought: Bạn nói “không thể thiếu được có fallback rồi”.
   - Action (planned): Giữ fallback cũ cho admin credentials trong wizard (email/password mặc định nếu người dùng để trống), chỉ đổi cơ chế apply từ “chỉ create” sang “create hoặc update”.
   - Reflection: ✓ Tận dụng fallback hiện có, không phát sinh schema mới.

3. Áp dụng cho toàn bộ module trong wizard
   - Thought: Bạn chọn phạm vi “Toàn bộ module đang có trong wizard”.
   - Action (planned): Đồng bộ SuperAdmin chạy trong flow `handleSeed` chung (không phụ thuộc từng module), nên mọi lần seed bằng wizard đều áp dụng cùng rule.
   - Reflection: ✓ Đảm bảo behavior nhất quán cho toàn bộ module mà không nhân bản logic.

4. Kiểm tra an toàn logic backend hiện tại
   - Thought: `updateSuperAdminCredentials` đã có check unique email + hash password.
   - Action (planned): Không đổi `convex/auth.ts` nếu không cần; tái sử dụng mutation hiện có để giảm rủi ro.
   - Reflection: ✓ KISS/DRY, tránh sửa backend dư thừa.

5. Validation & commit sau implement
   - Action (planned): Sau khi code xong sẽ chạy `bunx tsc --noEmit` theo rule repo; nếu pass thì commit với message dạng `fix(seed-wizard): sync superadmin credentials with admin-config on reseed`.
   - Reflection: ✓ Đúng quy ước dự án, không chạy lint/test nặng ngoài yêu cầu local rule.

## Files sẽ thay đổi (dự kiến)
- `components/data/SeedWizardDialog.tsx`
  - Thêm mutation `updateSuperAdminCredentials`
  - Sửa block apply SuperAdmin trong `handleSeed` để always sync (create/update)

Không dự kiến sửa UI `/system/admin-config` và không dự kiến sửa schema/backend trừ khi phát sinh lỗi compile.