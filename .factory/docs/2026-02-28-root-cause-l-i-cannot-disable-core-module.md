## Problem Graph
1. [Main] Lỗi `Cannot disable core module` nổ ở UI `/system/modules` khi toggle <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Guard backend chặn tắt module core trong `toggleModuleWithCascade`
   1.2 [Trigger Path] UI vẫn gửi request tắt module bị xem là core (do dữ liệu/đồng bộ trạng thái chưa chuẩn)

## Execution (with reflection)
1. Solving 1.1.1 (xác định điểm nổ lỗi)
   - Thought: tìm chính xác nơi throw message.
   - Action: grep `Cannot disable core module`.
   - Observation: có throw tại `convex/admin/modules.ts` trong cả `toggleModule` và `toggleModuleWithCascade`, đặc biệt line check:
     - `if (args.key !== "roles" && normalizedModule.isCore && !args.enabled) throw new Error("Cannot disable core module")`
   - Reflection: ✓ khớp 100% message trong console/runtime error.

2. Solving 1.2.1 (xác định đường đi từ UI)
   - Thought: trace từ code frame `app/system/modules/page.tsx:123`.
   - Action: đọc `handleToggleModule`.
   - Observation: UI luôn gọi `toggleModuleWithCascade({ enabled, key, cascadeKeys: [] })` ở line 123; nếu disable thì request đi thẳng vào guard backend.
   - Reflection: ✓ khớp stack trace “Called by client … handleToggleModule”.

3. Solving 1.2.2 (vì sao người dùng vẫn bấm được để gọi API)
   - Thought: kiểm tra rule disable toggle ở UI.
   - Action: đọc `ModuleCard.tsx` + `canToggleModule`.
   - Observation: UI chỉ khóa toggle khi `module.isCore && module.key !== 'roles'`. Nếu dữ liệu module trên client vẫn cho phép thao tác (hoặc key khác `roles` nhưng `isCore=true`), user vẫn trigger call và backend chặn.
   - Reflection: ✓ giải thích được việc lỗi xuất hiện ở runtime thay vì bị chặn sớm hoàn toàn trên UI.

## Root cause chốt cho 2 lỗi
- Hai lỗi bạn gửi thực chất là **cùng một nguyên nhân gốc**:
  1) **Console Error**: Convex mutation `toggleModuleWithCascade` ném lỗi business rule `Cannot disable core module`.
  2) **Runtime Error**: cùng lỗi đó được bubble về client tại `handleToggleModule` line 123.
- Nói ngắn gọn: **request disable đang nhắm vào module mà backend đang coi là core (trừ `roles`)**, nên bị chặn đúng theo guard.

## Hướng xử lý (không sửa code trong spec này)
- Đồng bộ 1 nguồn sự thật cho rule core giữa UI và backend (tránh UI cho bấm nhưng backend chặn).
- Bổ sung auto-normalize dữ liệu core cho trường hợp legacy (đặc biệt module `roles`) trước khi check guard.
- Ở UI, chặn sớm thao tác disable với module core + hiển thị toast rõ lý do để tránh runtime error nổi lên như lỗi hệ thống.

## Checklist xác nhận nhanh
- [ ] Module đang toggle có `isCore=true` không?
- [ ] `key` có phải `roles` không?
- [ ] Request đi qua `toggleModuleWithCascade` tại `page.tsx:123` đúng như stack trace không?
- [ ] Dữ liệu module ở UI và DB có đồng bộ trạng thái `isCore` không?