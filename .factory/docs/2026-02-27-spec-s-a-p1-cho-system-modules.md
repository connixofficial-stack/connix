## Problem Graph
1. Sửa nhóm P1 cho module system <- depends on 1.1, 1.2, 1.3
   1.1 Apply preset phải không tạo state vi phạm dependency
      1.1.1 [ROOT CAUSE] `convex/admin/presets.ts` đang patch theo danh sách preset, không validate dependency graph
   1.2 Guard trang config khi module disabled
      1.2.1 [ROOT CAUSE] `ModuleConfigPage`/`useModuleConfig` chưa chặn save khi module OFF
   1.3 Danh sách modules phải ổn định theo `order`
      1.3.1 [ROOT CAUSE] `listModules` trả `.collect()` không sort

## Execution (with reflection)
1. Solving 1.3.1 (dễ, ít rủi ro)
   - File: `convex/admin/modules.ts`
   - Đổi `listModules` sang query có thứ tự ổn định:
     - Ưu tiên: dùng index `by_enabled_order` để lấy enabled/disabled rồi merge theo `order`.
     - Nếu không phù hợp: collect + sort in-memory theo `order` tăng dần.
   - Reflection: đảm bảo UI `/system/modules` không nhảy thứ tự khi reload.

2. Solving 1.1.1 (preset integrity)
   - File: `convex/admin/presets.ts`
   - Trước khi patch module:
     - Load toàn bộ `adminModules` 1 lần, tạo `modulesByKey` map.
     - Tính set module sẽ bật theo preset + luôn giữ core module bật.
     - Validate dependency cho từng module dự định bật:
       - `all`: tất cả dependencies phải nằm trong set enabled.
       - `any`: ít nhất 1 dependency nằm trong set enabled.
     - Nếu vi phạm -> throw error rõ module nào/preset nào.
   - Sau validate mới patch trạng thái.
   - Reflection: ngăn preset sai làm vỡ rule dependency.

3. Solving 1.2.1 (guard module config)
   - Files: `components/modules/ModuleConfigPage.tsx`, `lib/modules/hooks/useModuleConfig.ts`
   - Thêm guard ở UI:
     - Nếu `moduleData?.enabled === false`:
       - Hiển thị trạng thái “Module đang tắt” + cảnh báo cần bật ở `/system/modules`.
       - Disable toàn bộ control chỉnh feature/field/setting.
       - Nút Save disabled, không gọi `handleSave`.
   - Thêm guard ở hook:
     - `handleSave` return sớm khi module OFF + toast thông báo.
   - Reflection: đảm bảo rule nhất quán cả UX lẫn logic save.

4. Verify bắt buộc
   - Chạy `bunx tsc --noEmit`.
   - Smoke test tay:
     - Apply preset thiếu dependency -> bị chặn với message rõ.
     - Vào `/system/modules/{key}` khi module OFF -> không chỉnh/sửa được.
     - Reload `/system/modules` nhiều lần -> thứ tự ổn định theo `order`.

5. Commit
   - Commit 1 lần cho toàn bộ P1 với message đề xuất:
     - `fix(system-modules): validate preset deps, guard disabled config, stabilize ordering`