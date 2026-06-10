## Problem Graph
1. Sửa P2 cho `/system/modules` <- depends on 1.1, 1.2
   1.1 i18n chưa đầy đủ, còn hardcode text
      1.1.1 [ROOT CAUSE] `app/system/modules/page.tsx` chứa nhiều chuỗi tiếng Việt/Anh cố định ngoài `translations.ts`
   1.2 Route config module đang map tĩnh
      1.2.1 [ROOT CAUSE] `moduleConfigRoutes` hardcode key -> URL, dễ lệch khi thêm module mới

## Execution (with reflection)
1. Solving 1.1.1 (i18n)
   - File: `app/system/i18n/translations.ts`
   - Bổ sung key mới trong `modules` cho toàn bộ text đang hardcode ở trang modules, gồm:
     - Dialog cascade: title, description, autoDisable, cancel, confirmDisable, processing, hint.
     - Preset dropdown: selectPreset, customConfig.
     - Config actions: reseed, viewConfig, openNewTab, download, moduleConfiguration.
     - Header/helper text: presetHint.
     - Markdown export labels: generatedAt, preset, summary, enabledModules, disabledModules, jsonConfig, none, yes, no.
   - Cập nhật cả `vi` và `en` tương ứng.
   - Reflection: Tách toàn bộ text UI khỏi page để không bị lẫn ngôn ngữ khi switch locale.

2. Solving 1.1.1 ở UI
   - File: `app/system/modules/page.tsx`
   - Thay toàn bộ chuỗi hardcode bằng `t.modules.*`.
   - `generateConfigMarkdown(...)` đổi chữ ký thành nhận object labels i18n (hoặc `t`) để render markdown đa ngôn ngữ.
   - Các tooltip/title/button/modal text đều lấy từ translation keys mới.
   - Reflection: đảm bảo không còn text cứng trong page, kể cả text trong markdown export.

3. Solving 1.2.1 (route map linh hoạt)
   - File: `app/system/modules/page.tsx`
   - Loại bỏ `moduleConfigRoutes` map tĩnh.
   - Tạo helper động:
     - `getModuleConfigRoute(moduleKey: string) => "/system/modules/${moduleKey}"`.
   - Link “Cấu hình” hiển thị theo rule đơn giản:
     - Module enabled thì luôn có link theo key hiện tại.
   - Reflection: module mới seed vào chỉ cần có route cùng key là tự dùng được, giảm rủi ro quên update map.

4. Safety check cho route động
   - File: `app/system/modules/page.tsx` (và giữ nguyên các route con hiện có)
   - Không thêm validate nặng ở runtime; giữ KISS.
   - Nếu cần fallback nhẹ: chỉ hiển thị link khi `module.key` là chuỗi không rỗng.
   - Reflection: tránh over-engineering, đúng YAGNI.

5. Verify bắt buộc
   - Chạy `bunx tsc --noEmit`.
   - Smoke test tay:
     - Chuyển ngôn ngữ vi/en: toàn bộ text trang modules + dialog + markdown modal đổi đúng ngôn ngữ.
     - Với module bất kỳ (vd `services`, `kanban`, `wishlist`): link cấu hình tạo đúng `/system/modules/{key}`.
     - Tải markdown ở cả vi/en để xác nhận tiêu đề/nhãn đúng locale.

6. Commit
   - Commit đề xuất:
     - `refactor(system-modules): localize module UI text and use dynamic config routes`