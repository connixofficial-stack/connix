## Problem Graph
1. [Main] Nâng cấp skill `apply-home-component-custom-colors` thành playbook đầy đủ để rollout toàn bộ home-components <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [ROOT CAUSE] Skill hiện tại mới ở mức checklist tổng quát, thiếu template thao tác chi tiết theo từng lớp (system/admin/site/convex)
   1.2 Thiếu contract rõ ràng để đảm bảo parity create/edit/preview/site cho mọi type
   1.3 Thiếu guardrails chống regression (single/dual, override fallback, toast, hiddenTypes, bulk actions)
   1.4 Thiếu test/verification matrix chuẩn hoá cho rollout diện rộng
   1.5 Thiếu “failure catalog + fix recipe” để agent xử lý nhanh các bug lặp lại

## Execution (with reflection)
1. Solving 1.1.1 - Chuẩn hoá lại cấu trúc SKILL.md thành playbook thực chiến
- Thought: Muốn dùng được cho all-type rollout, skill phải dẫn đường theo thứ tự thao tác và có output contract rõ.
- Action: Refactor nội dung `E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/.factory/skills/apply-home-component-custom-colors/SKILL.md` theo khung:
  - Mục tiêu / Khi dùng / Không dùng
  - Input contract bắt buộc trước khi code
  - Execution flow bắt buộc (System -> Convex -> Create -> Edit -> Preview -> Site -> Verification)
  - Output format bắt buộc cho agent khi báo cáo
- Reflection: ✓ Valid — giải quyết thiếu playbook có cấu trúc.

2. Solving 1.2 - Bổ sung “Parity Contract” chi tiết cho create/edit/preview/site
- Thought: Ngữ cảnh hiện tại cho thấy bug lớn nhất là mismatch runtime (preview đúng nhưng site sai) và lệch mode single/dual.
- Action: Thêm section mới trong skill:
  - `Parity Contract (must-pass)`:
    1) `system/home-components` là control center duy nhất cho override visibility/state.
    2) Edit page đọc + cập nhật đúng override state qua `useTypeColorOverrideState` + `setTypeColorOverride`.
    3) Preview dùng `effectiveColors` cùng logic mode.
    4) Site renderer luôn resolve qua `resolveTypeOverrideColors(...)`, không dùng raw system color trực tiếp.
    5) Single mode luôn ép `secondary = primary` ở cả UI state + payload + runtime.
- Reflection: ✓ Valid — khóa chặt đường đi dữ liệu end-to-end.

3. Solving 1.3 - Thêm template thao tác đầy đủ (theo yêu cầu user)
- Thought: Team cần copy/paste pattern để tăng tốc rollout all types, giảm sai sót thủ công.
- Action: Thêm các template code-level vào skill (dạng snippet khung, không hardcode business):
  - Template A: Edit page integration
    - import `TypeColorOverrideCard`, `useTypeColorOverrideState`, `resolveSecondaryByMode`
    - setup `customState/effectiveColors/initialCustom/showCustomBlock`
    - submit flow cập nhật component config + override mutation
    - hasChanges gồm cả customChanged
  - Template B: Create page integration
    - dùng `useTypeColorOverrideState(type)` + `setTypeColorOverride` trước `handleSubmit`
    - compact card và guard mode switch single/dual
  - Template C: System page row action + bulk action
    - toggle hidden + toggle custom + bulk custom + toast success/error
  - Template D: Renderer integration
    - `resolvedColors = resolveTypeOverrideColors({ type, systemColors, overrides })`
    - truyền `resolvedColors` xuống section component
  - Template E: Convex setting contract
    - normalize/validate hex
    - supported types lấy từ `HOME_COMPONENT_TYPE_VALUES`
    - mutation payload shape thống nhất
- Reflection: ✓ Valid — đáp ứng yêu cầu “template đầy đủ” và bám codebase hiện tại.

4. Solving 1.4 - Guardrails + anti-regression rules theo bài học commit gần nhất
- Thought: Cần chuyển lessons learned thành luật cứng trong skill để không tái phạm.
- Action: Thêm section `Guardrails bắt buộc`:
  - Không tự tạo danh sách type rời rạc; luôn dùng `lib/home-components/componentTypes.ts`.
  - Bất kỳ toggle nào cũng phải có sonner toast (success/error).
  - Không hiển thị input secondary trong single mode (nếu UI có mode switch).
  - Không update state lặp gây loop (chỉ sync khi giá trị thực sự thay đổi).
  - Không ghi đè site colors cục bộ nếu đã có resolvedColors từ override.
  - Hidden create types không ảnh hưởng data runtime hiện hữu.
- Reflection: ✓ Valid — ngăn các lỗi đã xuất hiện trong nhánh hiện tại.

5. Solving 1.5 - Verification matrix “toàn bộ type ngay” + failure catalog
- Thought: Rollout diện rộng cần checklist test theo ma trận để tránh bỏ sót type.
- Action: Thêm 2 section lớn:
  - `Verification Matrix (All Types)`:
    - Mỗi type phải pass 8 check: system toggle, bulk toggle, create visibility, edit custom card, preview color, site color, single mode behavior, persistence after reload.
    - Cách test ngắn theo cặp: (system action) -> (edit) -> (site) -> (reload) -> (seed/module reset nếu liên quan).
  - `Failure Catalog & Fix Recipe`:
    - Case 1: Preview đổi màu, site không đổi -> kiểm tra renderer resolveTypeOverrideColors.
    - Case 2: Single mode vẫn cần secondary -> kiểm tra resolveSecondaryByMode + UI hide logic.
    - Case 3: Toggle không có feedback -> thêm toast success/error.
    - Case 4: Reset/seed làm lệch state -> kiểm tra mutation reset path.
    - Case 5: Type không nhận custom -> kiểm tra `HOME_COMPONENT_TYPE_VALUES` và SUPPORTED set.
- Reflection: ✓ Valid — tăng khả năng rollout all-types an toàn.

## File sẽ thay đổi
1) `E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/.factory/skills/apply-home-component-custom-colors/SKILL.md`
- Viết lại theo format playbook chi tiết.
- Thêm template thao tác đầy đủ cho system/create/edit/renderer/convex.
- Thêm parity contract, guardrails, verification matrix, failure catalog.
- Giữ frontmatter hiện tại, nâng cấp description để phản ánh “all-types rollout + templates + anti-regression”.

## Kết quả mong đợi sau nâng cấp skill
- Agent có thể dùng 1 skill duy nhất để rollout custom colors cho toàn bộ home-components mà không lệch create/edit/preview/site.
- Giảm lỗi lặp lại nhờ contract + guardrails + fix recipes.
- Tăng tốc triển khai nhờ template copy/paste chuẩn theo codebase hiện tại.

## Checklist chốt cho user (dễ review)
- [ ] Skill mới có execution flow rõ từ system -> site.
- [ ] Có template đầy đủ cho edit/create/system/renderer/convex.
- [ ] Có parity contract bắt buộc cho single/dual + runtime override.
- [ ] Có verification matrix để chạy cho toàn bộ type.
- [ ] Có failure catalog để debug nhanh khi rollout.