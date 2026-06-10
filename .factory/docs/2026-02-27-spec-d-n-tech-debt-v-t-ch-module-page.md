## Problem Graph
1. Dọn tech debt `app/system/modules/page.tsx` <- depends on 1.1, 1.2, 1.3
   1.1 File monolithic, nhiều UI + logic trộn lẫn
      1.1.1 [ROOT CAUSE] Các component nội bộ (Dialog, Dropdown, Actions, Card) nằm chung 1 file
   1.2 Logic helper/markdown khó test
      1.2.1 [ROOT CAUSE] `generateConfigMarkdown`, mapping/icon/color đang để inline trong page
   1.3 Maintainability thấp khi thêm module/preset mới
      1.3.1 [ROOT CAUSE] Props/types không tách riêng, khó tái sử dụng

## Execution (with reflection)
1. Tách types + constants
   - Tạo file: `app/system/modules/_types.ts`
     - `AdminModule`, `SystemPreset`, các shared prop types.
   - Tạo file: `app/system/modules/_constants.ts`
     - `iconMap`, `categoryColors`, helper `getModuleConfigRoute`.
   - Reflection: giảm nhiễu ở file page, chuẩn hóa nguồn type/constant.

2. Tách markdown helper
   - Tạo file: `app/system/modules/_lib/generate-config-markdown.ts`
   - Di chuyển `generateConfigMarkdown(...)` sang file riêng, giữ signature i18n hiện tại.
   - Reflection: logic xuất markdown độc lập, dễ test unit sau này.

3. Tách UI components khỏi page
   - Tạo folder: `app/system/modules/_components/`
   - Tách các component:
     - `CascadeConfirmDialog.tsx`
     - `PresetDropdown.tsx`
     - `ConfigActions.tsx`
     - `ModuleCard.tsx`
   - Mỗi component import type từ `_types.ts`, constants từ `_constants.ts`.
   - Reflection: page chỉ còn orchestration/state, dễ đọc hơn.

4. Thu gọn `app/system/modules/page.tsx`
   - Chỉ giữ:
     - query/mutation hooks
     - state chính
     - handlers (`handleToggleModule`, `handleCascadeConfirm`, `handleReseedModules`, filter/group)
     - compose các component đã tách.
   - Không đổi behavior/UI hiện tại (KISS, không mở rộng feature).
   - Reflection: giảm độ phức tạp nhận thức nhưng giữ nguyên output.

5. Verify
   - Chạy `bunx tsc --noEmit`.
   - Smoke check nhanh:
     - Toggle module + cascade dialog.
     - Preset dropdown apply/custom.
     - Actions (view markdown/download/open tab/reseed).
     - Link cấu hình module động.

6. Commit
   - Commit đề xuất:
     - `refactor(system-modules): split modules page into focused components`

## Kết quả kỳ vọng
- `app/system/modules/page.tsx` gọn, tập trung state + luồng.
- UI và helper tách module rõ ràng, dễ bảo trì/mở rộng mà không đổi chức năng.