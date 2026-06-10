Đã chốt requirement theo câu trả lời của bạn:
- Rule theo **từng type**.
- Nếu type có **0 component** trong DB, create phải **khóa theo màu Settings** (không prefill custom).
- Dù bật custom trên card ở create, khi type=0 vẫn **không áp custom ngay**.
- Scope chỉ áp dụng **create pages** (30 type), không đổi edit/site renderer.

## Problem Graph
1. [Main] Create đang dùng custom quá sớm <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `useTypeColorOverrideState` không biết trạng thái count theo type
   1.2 `ComponentFormWrapper` luôn submit override trong create khi panel hiển thị
   1.3 Thiếu contract “type chưa có data thì khóa custom” dùng chung cho 30 create routes

## Execution (with reflection)
1. Solving 1.1 (hook-level contract)
   - Thought: Cần thêm guard tập trung ở hook để mọi create page dùng chung, tránh sửa 30 file.
   - Action:
     - Sửa `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`:
       - Thêm optional option cho create mode, ví dụ `lockCustomUntilTypeHasData?: boolean`.
       - Query `api.homeComponents.listByType({ type })` ngay trong hook, derive `hasTypeData = (list?.length ?? 0) > 0`.
       - Tạo `isCreateCustomLocked = lockCustomUntilTypeHasData && !hasTypeData`.
       - `effectiveColors` trong locked state luôn fallback `systemColors` (giống settings), bất kể `customState.enabled`.
       - Expose thêm flag: `isCreateCustomLocked`.
   - Reflection: ✓ Valid — sửa 1 chỗ, tác động toàn bộ create qua shared wrapper.

2. Solving 1.2 (wrapper-level submit + UI lock)
   - Thought: Nếu chỉ đổi preview mà submit vẫn ghi override thì vẫn sai contract.
   - Action:
     - Sửa `app/admin/home-components/create/shared.tsx`:
       - Khi gọi fallback hook trong `ComponentFormWrapper`, truyền option bật lock cho create.
       - Ở `handleFormSubmit`, nếu `isCreateCustomLocked===true` thì **không gọi** `setTypeColorOverride`.
       - Truyền `disabled={isCreateCustomLocked}` vào `TypeColorOverrideCard` để user thấy card nhưng không chỉnh được khi count=0.
       - (Nhẹ) thêm hint text ngắn dưới card: “Tạo ít nhất 1 component cùng loại để bật custom màu.”
   - Reflection: ✓ Valid — giữ UI hiện tại, chỉ thêm behavior guard đúng rule.

3. Solving 1.3 (phủ 30 create types)
   - Thought: Nhiều create page đang tự gọi `useTypeColorOverrideState` trước khi vào wrapper để lấy preview colors.
   - Action:
     - Cập nhật API hook để create pages vẫn dùng 1 call hiện tại nhưng có lock contract thống nhất.
     - Cập nhật các chỗ gọi trong create để bật lock option (1 pattern, áp cho tất cả create routes và `create/product-list/_shared.tsx`).
     - Không đụng edit pages và không đụng renderer.
   - Reflection: ✓ Valid — đúng scope bạn yêu cầu (create-only), DRY và ít rủi ro.

## File-level plan chi tiết
1) `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`
- Thêm options cho `useTypeColorOverrideState`.
- Query `homeComponents.listByType` để biết type đã có data chưa.
- Derive `isCreateCustomLocked`.
- Force `effectiveColors` = settings khi locked.
- Expose `isCreateCustomLocked` để wrapper/card xử lý disable + submit guard.

2) `app/admin/home-components/create/shared.tsx`
- Dùng hook với option lock trong ngữ cảnh create.
- `ComponentFormWrapper.handleFormSubmit` skip `setTypeColorOverride` khi locked.
- Pass `disabled={isCreateCustomLocked}` vào `TypeColorOverrideCard`.
- Thêm helper message ngắn (không đổi layout lớn).

3) Các create entrypoints (30 type, gồm shared create cho ProductList/ServiceList/Blog)
- Áp pattern gọi hook có option lock (nếu cần theo chữ ký mới).
- Đảm bảo preview nhận `effectiveColors` đã lock đúng.
- Không sửa logic form nghiệp vụ khác.

## Verification matrix (bắt buộc pass)
A. Type=Hero, count=0, system custom bật:
- Create Hero preview hiển thị màu Settings.
- Card custom hiện nhưng disabled.
- Submit create không ghi override mới.

B. Sau khi tạo 1 Hero (count>=1):
- Reload create Hero: card active lại.
- Bật custom => preview đổi theo custom.
- Submit create ghi override bình thường.

C. Áp dụng tương tự cho sample các nhóm khác (ví dụ: Stats, ProductList(shared), Footer).

D. Regression guard:
- Edit page behavior không đổi.
- Site renderer không đổi.

## Quality & Git
- Chạy `bunx --no-install tsc --noEmit`.
- Stage đúng file + `.factory/docs` nếu có.
- Commit local theo style hiện tại (không push).

## Kết quả kỳ vọng
- 30 create pages cùng tuân thủ contract mới:
  - type chưa có data => mặc định Settings, khóa custom.
  - type đã có data => custom hoạt động như hiện tại.