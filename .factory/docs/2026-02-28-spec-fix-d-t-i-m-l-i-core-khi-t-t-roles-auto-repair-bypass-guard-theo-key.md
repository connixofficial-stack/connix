## Problem Graph
1. [Main] Vẫn nổ `Cannot disable core module` khi tắt roles <- depends on 1.1, 1.2
   1.1 [Race/cache drift] Dữ liệu `isCore` của roles có thể chưa tự-heal kịp trước check guard
   1.2 [Guard coupling] Điều kiện guard đang phụ thuộc `moduleRecord` thay vì intent request (`args.key`)

## Execution (with reflection)
1. Tạo auto-repair mutation-level trước mọi toggle
   - File: `convex/admin/modules.ts`
   - Thêm helper mutation-only, ví dụ `repairRolesCoreFlag(ctx)`:
     - Query roles record bằng `by_key('roles')`
     - Nếu tồn tại và `isCore === true` thì patch thành `false`
     - Idempotent (chạy nhiều lần không side-effect)
   - Gọi helper này ở đầu `toggleModule` và `toggleModuleWithCascade`.
   - Reflection: ✓ đảm bảo sửa dữ liệu trước khi validate, không lệ thuộc query trước đó.

2. Bypass core guard theo request key
   - File: `convex/admin/modules.ts`
   - Đổi guard từ phụ thuộc record sang ý định action:
     - `if (args.key !== 'roles' && moduleRecord.isCore && !args.enabled) throw ...`
   - Áp dụng cho cả `toggleModule` và `toggleModuleWithCascade`.
   - Reflection: ✓ chống lỗi do drift/cached record, đúng business rule “roles được phép tắt”.

3. Giữ normalize ở query để UI luôn hiển thị đúng
   - File: `convex/admin/modules.ts`
   - Giữ các hàm normalize ở query hiện tại để badge/lock luôn đồng nhất.
   - Reflection: ✓ UX ổn định và backwards-compatible.

4. UI giữ một đường toggle cascade
   - File: `app/system/modules/page.tsx`
   - Giữ `toggleModuleWithCascade` cho cả on/off như đã làm (không rollback).
   - Reflection: ✓ giảm branching, dễ debug.

5. Verify & commit
   - Chạy `bunx tsc --noEmit`.
   - Commit local, include `.factory/docs` theo rule.

## Checklist sau fix
- [ ] Tắt roles không còn nổ `Cannot disable core module` ở cả toggle thường/cascade.
- [ ] Dữ liệu cũ `roles.isCore=true` được auto-repair khi thao tác toggle.
- [ ] Core module khác vẫn bị chặn disable bình thường.
- [ ] UI `/system/modules` hoạt động ổn định không cần reseed thủ công.