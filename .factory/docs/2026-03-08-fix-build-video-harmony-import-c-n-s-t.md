## Audit Summary
- Observation: Build fail tại `components/site/ComponentRenderer.tsx:77-82` vì vẫn import `DEFAULT_VIDEO_HARMONY` và `normalizeVideoHarmony` từ `app/admin/home-components/video/_lib/constants.ts`, nhưng file constants hiện không còn export các symbol này.
- Observation: `app/admin/home-components/video/_lib/constants.ts` chỉ còn `DEFAULT_VIDEO_CONFIG`, `DEFAULT_VIDEO_STYLE`, `normalizeVideoStyle`, `normalizeVideoConfig`, `getVideoConfigWithMode`; không còn harmony export.
- Observation: `components/site/ComponentRenderer.tsx:4314-4328` vẫn tính `const harmony = normalizeVideoHarmony(normalizedConfig.harmony ?? DEFAULT_VIDEO_HARMONY);` rồi truyền `harmony` vào `getVideoColorTokens(...)` và `config`.
- Observation: `app/admin/home-components/video/_lib/colors.ts` hiện tại `getVideoColorTokens` chỉ nhận `{ primary, secondary, mode, style }`, không dùng harmony nữa; `resolveSecondaryForMode()` tự fallback secondary bằng `getHarmonyColor(primary)` khi dual mode và thiếu secondary.
- Observation: `app/admin/home-components/video/_types/index.ts` vẫn còn `VideoHarmony` và `harmony?: VideoHarmony`, nên việc “bỏ Harmony” mới hoàn tất một phần; build error hiện tại đến từ runtime import cũ, chưa phải cleanup type hoàn toàn.

## Root Cause Confidence
High — nguyên nhân trực tiếp là refactor bỏ Harmony ở module video chưa đồng bộ hết callsite runtime. `ComponentRenderer` vẫn dùng API cũ, trong khi `video/_lib/constants.ts` và `video/_lib/colors.ts` đã chuyển sang API không còn harmony. Counter-hypothesis đã kiểm tra: `VideoPreview.tsx` đã gọi `getVideoColorTokens` không có harmony và không import default harmony, nên lỗi không nằm ở preview/colors mà ở `ComponentRenderer` còn sót import + usage.

## Proposal
Thực hiện fix tối thiểu, không mở rộng scope:

1. Sửa `components/site/ComponentRenderer.tsx`
   - Xóa import `DEFAULT_VIDEO_HARMONY` và `normalizeVideoHarmony` từ `video/_lib/constants`.
   - Trong `VideoSection(...)`, bỏ dòng tính `harmony`.
   - Cập nhật call `getVideoColorTokens({ ... })` chỉ truyền `primary, secondary, mode, style`.
   - Cập nhật prop `config` truyền vào `VideoSectionShared` từ `{ ...normalizedConfig, style, harmony }` thành `{ ...normalizedConfig, style }`.

2. Verify phạm vi ảnh hưởng nhanh bằng search
   - Tìm toàn repo các usage còn lại của `DEFAULT_VIDEO_HARMONY` và `normalizeVideoHarmony`.
   - Nếu chỉ còn ở `ComponentRenderer` thì không sửa thêm ngoài file này.
   - Nếu còn file runtime khác cùng pattern, sẽ cleanup cùng đợt để tránh lỗi build tiếp theo, nhưng vẫn giữ scope chỉ quanh video harmony remnants.

3. Giữ nguyên các phần chưa gây lỗi ở vòng này
   - Chưa xóa `VideoHarmony` / `harmony?: VideoHarmony` trong `_types/index.ts` nếu chưa có yêu cầu cleanup toàn bộ, để tránh lan scope sang form/data compatibility.
   - Nếu user muốn, có thể làm thêm pass cleanup riêng sau khi build xanh.

## Verification Plan
- Repro: chạy build/typecheck liên quan để xác nhận import mismatch biến mất.
- Bắt buộc theo repo rule vì có đổi TS/code: chạy `bunx tsc --noEmit`.
- Nên chạy thêm build mục tiêu hoặc `next build`/script build trong `package.json` nếu repo đã có script phù hợp, để xác nhận Turbopack/Next không còn báo export missing.
- Search pass: xác nhận không còn `DEFAULT_VIDEO_HARMONY` / `normalizeVideoHarmony` usage runtime gây lỗi.
- Sau khi verify xong sẽ commit local theo repo rule, không push.

Nếu bạn duyệt spec này, tôi sẽ sửa tối thiểu đúng chỗ còn sót rồi chạy verify.