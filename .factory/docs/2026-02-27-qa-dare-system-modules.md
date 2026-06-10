## Problem Graph
1. QA `/system/modules` (System + Convex) <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 Validate logic dependency bật/tắt module <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Validation `dependencyType: "any"` sai ở backend
   1.2 Validate cascade disable parent-child
   1.3 Validate tính nhất quán UI route config module
   1.4 Validate i18n + ordering + preset integrity

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Đọc `convex/admin/modules.ts` để kiểm tra rule dependency khi enable.
   - Action: Soát `toggleModule` + `toggleModuleWithCascade`.
   - Observation: Với `dependencyType === "any"`, code không chặn khi *tất cả* dependency đều tắt (chỉ throw cho `all`).
   - Reflection: ✓ Valid (bug logic rõ ràng, ảnh hưởng trực tiếp dữ liệu).

2. Solving 1.2...
   - Thought: Kiểm tra tắt cascade có xử lý dependency nhiều tầng không.
   - Action: Soát `getDependentModules` ở UI + `toggleModuleWithCascade` ở backend.
   - Observation: Chỉ disable danh sách con cấp 1 do client gửi lên, không tính closure phụ thuộc nhiều tầng.
   - Reflection: ✓ Valid (dễ tạo state module không hợp lệ sau khi tắt parent).

3. Solving 1.3...
   - Thought: Kiểm tra route config module có guard theo trạng thái enabled không.
   - Action: Soát `app/system/modules/*/page.tsx`, `components/modules/ModuleConfigPage.tsx`, `useModuleConfig.ts`.
   - Observation: Trang config module vẫn truy cập/lưu được dù module đang disabled; không có guard chặn thao tác cấu hình.
   - Reflection: ✓ Valid (UX + policy inconsistency).

4. Solving 1.4...
   - Thought: Rà các vấn đề QA còn lại về consistency/perf.
   - Action: Soát `page.tsx`, `presets.ts`, `seeders`.
   - Observation: có nhiều điểm lệch chuẩn.
   - Reflection: ✓ Valid.

## Danh sách vấn đề cần sửa (ưu tiên)

### P0 (Cao)
1. **Bug dependencyType `any` không được enforce đúng**
   - Vị trí: `convex/admin/modules.ts` (`toggleModule`, `toggleModuleWithCascade`).
   - Hiện trạng: Nếu module có `dependencyType: "any"`, code vẫn cho bật module ngay cả khi không có dependency nào bật.
   - Tác động: Dữ liệu module state sai ràng buộc.

2. **Cascade disable chỉ 1 tầng phụ thuộc**
   - Vị trí: UI `app/system/modules/page.tsx` + backend `toggleModuleWithCascade`.
   - Hiện trạng: Chỉ disable các module con trực tiếp, không disable phụ thuộc bắc cầu.
   - Tác động: Có thể còn module enabled nhưng parent trung gian đã tắt.

### P1 (Trung bình)
3. **Apply preset có thể tạo state vi phạm dependency**
   - Vị trí: `convex/admin/presets.ts` (`applyPreset`).
   - Hiện trạng: Patch enabled/disabled theo danh sách preset mà không validate dependency graph trước khi apply.
   - Tác động: Preset custom hoặc dữ liệu preset sai sẽ tạo cấu hình invalid.

4. **Module config page không guard theo trạng thái module**
   - Vị trí: `components/modules/ModuleConfigPage.tsx`, `lib/modules/hooks/useModuleConfig.ts`.
   - Hiện trạng: Module disabled vẫn vào trang config, đổi feature/field/setting và lưu bình thường.
   - Tác động: Trải nghiệm và business rule không nhất quán.

5. **Danh sách modules không đảm bảo sort theo `order`**
   - Vị trí: `convex/admin/modules.ts` (`listModules` dùng `.collect()` không sort).
   - Tác động: UI có thể hiển thị thứ tự không ổn định theo thời gian.

### P2 (Thấp)
6. **Hardcode text tiếng Việt trong page modules (i18n chưa đầy đủ)**
   - Vị trí: `app/system/modules/page.tsx` (dialog, button labels, preset hints...).
   - Tác động: Khi chuyển `en`, một phần UI vẫn tiếng Việt.

7. **`moduleConfigRoutes` là mapping tĩnh, dễ lệch khi thêm module mới**
   - Vị trí: `app/system/modules/page.tsx`.
   - Tác động: Có module bật nhưng thiếu link “Cấu hình”.

## Gợi ý verify nhanh sau khi sửa
- Case 1: Bật module `any` khi mọi parent đều OFF => phải bị chặn.
- Case 2: Tắt parent có cây phụ thuộc 2-3 tầng => toàn bộ subtree phải OFF.
- Case 3: Apply preset thiếu dependency => bị từ chối hoặc auto-heal theo rule rõ ràng.
- Case 4: Truy cập trang `/system/modules/{key}` khi module OFF => hiển thị trạng thái lock/read-only hoặc chặn save.
- Case 5: Reload `/system/modules` nhiều lần => thứ tự module ổn định theo `order`.