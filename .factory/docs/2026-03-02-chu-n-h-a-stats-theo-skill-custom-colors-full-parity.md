## Problem Graph
1. [Main] Chuẩn hóa Stats theo skill `apply-home-component-custom-colors` cho full parity create/edit/site <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Edit Stats còn dùng `TypeColorOverrideCard` thủ công với handler mode/primary chưa ép chặt contract single/dual như template chuẩn.
   1.2 [ROOT CAUSE] Contract submit/edit chưa tách rõ và nhất quán `systemEnabled` (panel visibility) vs `enabled` (runtime custom) trong logic hiển thị/đổi màu.
   1.3 [ROOT CAUSE] Chưa có checklist verify cụ thể cho Stats để đảm bảo preview/site fallback đúng khi runtime OFF.

## Execution (with reflection)
1. Chuẩn hóa `app/admin/home-components/stats/[id]/edit/page.tsx` theo template skill
   - Dùng nhất quán state từ `useTypeColorOverrideState('Stats')`.
   - Cập nhật handlers của `TypeColorOverrideCard`:
     - `onModeChange`: nếu `single` thì ép `secondary = primary`; nếu đổi sang `dual` từ `single` thì dùng `getSuggestedSecondary(primary)`.
     - `onPrimaryChange`: nếu đang `single` thì sync secondary theo primary.
   - `customChanged` dùng `resolveSecondaryByMode(...)` để so sánh snapshot chính xác.
   - Submit `setTypeColorOverride` với payload chuẩn (`enabled/mode/primary/secondary resolved`).
   - Reflection: giữ UI hiện có, chỉ tinh gọn đúng contract để tránh regression.

2. Chuẩn hóa `app/admin/home-components/create/stats/page.tsx`
   - Giữ pattern wrapper hiện tại (đã đúng), tinh gọn nhẹ theo template skill (tách hằng/handler rõ ràng, bỏ lặp inline không cần thiết).
   - Bảo đảm preview luôn lấy từ `effectiveColors`.
   - Reflection: create hiện đã gần chuẩn, chỉnh nhẹ để đồng bộ coding-style với contract mới.

3. Xác nhận parity site renderer cho Stats
   - Rà `components/site/ComponentRenderer.tsx`:
     - Nhánh `Stats` phải luôn dùng `resolvedColors` từ `resolveTypeOverrideColors(...)` (không dùng raw system color).
   - Nếu có điểm lệch, sửa tối thiểu để đảm bảo site = preview contract.
   - Reflection: hiện đang đúng kiến trúc, chỉ chạm khi phát hiện lệch thực tế.

4. Verify contract cho Stats (manual matrix)
   - Case A: `systemEnabled=true`, `enabled=false` -> create/edit vẫn hiện panel; preview + site dùng system colors.
   - Case B: `systemEnabled=true`, `enabled=true` -> preview + site dùng custom colors.
   - Case C: `systemEnabled=false` -> panel ẩn ở create/edit; site dùng system colors.
   - Case D: single mode -> secondary luôn bằng primary ở state/payload/render.
   - Reflection: đây là tiêu chí chấp nhận chính theo skill mới.

5. Validation + commit
   - Chạy `bunx --no-install tsc --noEmit`.
   - Commit toàn bộ thay đổi liên quan Stats + `.factory/docs` theo rule repo.

## Kết quả kỳ vọng
- Stats đạt full parity create/edit/site theo skill mới.
- Không còn lệch hành vi panel/toggle giữa runtime OFF và system ON.
- Single/dual xử lý đồng nhất ở state, payload, preview và site.