## Problem Graph
1. [Main] Bật/tắt module vẫn phát sinh lỗi đỏ `Cannot disable core module` và luồng chưa “best practice” <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Backend `toggleModuleWithCascade` đang `throw` cho lỗi nghiệp vụ (core/dependency) nên client thấy Console/Runtime Error.
   1.2 [Flow gap] Chưa chuẩn hoá 1 contract kết quả chung cho mọi caller (`/system/modules`, `SeedWizardDialog`) nên có nơi catch/toast, có nơi vẫn lỗi đỏ.
   1.3 [UX gap] Luồng bật/tắt chưa tự động xử lý dependency theo state machine nhất quán (auto-enable deps + confirm cascade disable).

## Execution (with reflection)
1. Solving 1.1 — Chuẩn hoá contract mutation theo outcome-based (không throw cho business rule)
   - File: `convex/admin/modules.ts`
   - Đổi `toggleModuleWithCascade` từ “throw business error” sang trả object thống nhất:
     - `success: boolean`
     - `code: 'OK' | 'MODULE_NOT_FOUND' | 'CORE_LOCKED' | 'DEPENDENCY_MISSING' | 'INVALID_CASCADE'`
     - `message?: string`
     - `disabledModules: string[]`
     - `autoEnabledModules?: string[]`
   - Chỉ giữ `throw` cho lỗi hệ thống bất ngờ (DB/runtime), còn nghiệp vụ thì trả `success:false`.
   - Reflection: ✓ theo Convex error-handling best practice: business failure nên handle có cấu trúc ở client, tránh error đỏ do expected flow.

2. Solving 1.3 (Enable flow) — Auto-enable dependencies theo thứ tự topo
   - File: `convex/admin/modules.ts`
   - Khi `enabled=true`:
     - Duyệt đồ thị dependencies của `key` (DFS/BFS), detect missing.
     - Auto-enable missing dependencies trước, sau đó enable module chính.
     - Với `dependencyType='any'`: nếu chưa có dependency nào bật thì bật dependency ưu tiên đầu tiên (deterministic).
     - Trả `autoEnabledModules` để UI có thể cập nhật/hiển thị trạng thái hợp lý.
   - Reflection: ✓ đúng lựa chọn của bạn, tránh invalid state transition.

3. Solving 1.3 (Disable flow) — Confirm rồi cascade disable có kiểm soát
   - File: `convex/admin/modules.ts`
   - Khi `enabled=false`:
     - Nếu module core (trừ `roles`) => trả `CORE_LOCKED` (không throw).
     - Tính closure dependents đang enabled, validate `cascadeKeys` có khớp tập cần tắt; nếu lệch trả `INVALID_CASCADE`.
     - Tắt dependents trước rồi tắt module chính; giữ guard không cho tắt core bị khóa.
   - Reflection: ✓ giữ đúng UX “confirm rồi cascade”.

4. Solving 1.2 — Chuẩn hoá caller `/system/modules`
   - File: `app/system/modules/page.tsx`
   - `handleToggleModule` và `handleCascadeConfirm` xử lý theo `result.code` thay vì dựa throw:
     - `OK`: cập nhật loading state như hiện tại.
     - `CORE_LOCKED`, `DEPENDENCY_MISSING`, `INVALID_CASCADE`, `MODULE_NOT_FOUND`: xử lý mềm (không crash), giữ UI stable.
   - Bỏ phụ thuộc vào exception cho expected scenario.
   - Reflection: ✓ không còn runtime error khi user thao tác toggle bình thường.

5. Solving 1.2 — Chuẩn hoá caller `SeedWizardDialog`
   - File: `components/data/SeedWizardDialog.tsx`
   - Trong `syncModules`:
     - Sau mỗi lần gọi toggle, kiểm tra `result.success`; nếu false thì xử lý theo code (skip/reconcile) thay vì để chain fail.
     - Enable flow tận dụng `autoEnabledModules` để tránh gọi dư và tránh xung đột state.
   - Reflection: ✓ bịt luồng còn lại đang có khả năng làm nổ lỗi đỏ.

6. Message mapping/i18n cho outcome codes
   - File: `app/system/i18n/translations.ts`
   - Thêm message theo code (`coreLocked`, `dependencyMissing`, `invalidCascade`, `moduleNotFound`) để UI có thông điệp nhất quán, không generic.
   - Reflection: ✓ giúp debug/user clarity nhưng không phụ thuộc throw stack.

7. Verify + commit theo convention repo
   - Chạy: `bunx tsc --noEmit`
   - Kiểm tra: toggle ON/OFF ở `/system/modules` + seed wizard flow không còn Console/Runtime Error cho expected business cases.
   - Commit gồm code thay đổi + `.factory/docs` theo rule.

## Best-practice áp dụng từ websearch (2026)
- Convex: expected business outcomes nên trả structured result hoặc `ConvexError` có data; ở đây chọn structured result để tránh error đỏ cho luồng hợp lệ.
- Toggle UX: chỉ cho state transition hợp lệ; với enable thì auto-resolve dependency, với disable thì confirm cascade.
- Next.js client actions: không để expected failure bubble thành uncaught runtime error; luôn handle tại action boundary.

## Checklist chốt
- [ ] Tắt module core bị khóa không còn Runtime/Console Error đỏ.
- [ ] Bật module thiếu dependency tự bật dependency đúng thứ tự.
- [ ] Tắt module có dependents luôn qua confirm cascade.
- [ ] `SeedWizardDialog` không còn fail chain vì business rule.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Commit đầy đủ (bao gồm `.factory/docs`).