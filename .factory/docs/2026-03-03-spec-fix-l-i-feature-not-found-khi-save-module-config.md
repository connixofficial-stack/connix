## Problem Graph
1. [Main] Save cấu hình tại `/system/modules/*` có thể crash `Feature not found` <- depends on 1.1, 1.2
   1.1 [Sub] `useModuleConfig.handleSave` gọi `toggleModuleFeature` cho mọi feature thay đổi
   1.2 [ROOT CAUSE] `convex/admin/modules.ts` trong `toggleModuleFeature` đang `throw new Error("Feature not found")` khi thiếu record `moduleFeatures` theo `moduleKey + featureKey`

## Execution (with reflection)
1. Solving 1.2 (ROOT CAUSE) ở backend mutation
   - Thought: bạn đã chọn hướng chỉ backend; đây là chỗ đúng nhất vì harden cho toàn bộ caller (module pages, seed wizard, flow khác), không phải vá từng client.
   - Action (file): `convex/admin/modules.ts`
     - Sửa mutation `toggleModuleFeature`:
       - Giữ query feature như hiện tại.
       - Nếu **không có feature**:
         - derive `name` từ `featureKey` (bỏ prefix `enable`, tách CamelCase thành từ).
         - `insert` bản ghi mới vào `moduleFeatures` với payload tối thiểu:
           - `moduleKey: args.moduleKey`
           - `featureKey: args.featureKey`
           - `enabled: args.enabled`
           - `name: derivedName || args.featureKey`
         - `return null` (không throw).
       - Nếu có feature: giữ nguyên patch `enabled` như hiện tại.
       - Logic linked field: chỉ chạy khi feature có `linkedFieldKey` (không thay đổi behavior cũ).
   - Reflection: ✓ backward-compatible, không đổi API contract, loại bỏ crash do dữ liệu lệch seed.

2. Safety check
   - Thought: tránh side effect ngoài yêu cầu.
   - Action:
     - Không sửa `useModuleConfig.ts` (YAGNI theo lựa chọn của bạn).
     - Không đổi schema, không thêm migration, không đổi type API.
   - Reflection: ✓ scope gọn, đúng yêu cầu “chỉ backend auto-create”.

3. Verify
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Manual smoke:
       - vào một trang `/system/modules/*` có feature có thể thiếu record (ví dụ analytics nếu đang lệch dữ liệu),
       - toggle 1 feature và Save,
       - kỳ vọng: không còn lỗi `Feature not found`, lưu thành công.
   - Reflection: ✓ kiểm chứng đúng case lỗi thực tế.

4. Commit (local only)
   - Action:
     - `git status`
     - `git diff --cached` (sau khi stage) để rà soát secrets
     - commit message đề xuất: `fix(modules): auto-create missing feature on toggle`
     - include `.factory/docs` theo rule repo.

## File thay đổi dự kiến
- `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\convex\admin\modules.ts`
  - Chỉ chỉnh mutation `toggleModuleFeature` để auto-create feature thiếu thay vì throw.

## Checklist kết quả
- Save ở `/system/modules/*` không còn crash khi DB thiếu `moduleFeatures` record.
- `toggleModuleFeature` vẫn trả `null`, không đổi contract hiện tại.
- Không thay đổi client logic và không mở rộng scope ngoài yêu cầu.
- `bunx tsc --noEmit` pass.