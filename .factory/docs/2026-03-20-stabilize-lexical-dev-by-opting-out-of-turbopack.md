## TL;DR kiểu Feynman
- Lỗi hiện không còn là chuyện import viết chưa đẹp nữa; nó vẫn nổ sau khi đã flatten graph và tắt dev cache.
- Evidence local + web đều chỉ vào cùng một điểm: bug HMR của Turbopack với graph package kiểu Lexical.
- Nghĩa là tiếp tục vá app-side có thể tốn vòng nhưng xác suất khỏi thấp.
- Hướng thực dụng nhất là chỉ opt out Turbopack cho dev workflow cần Lexical, còn project vẫn giữ Next 16 bình thường.
- Em sẽ ưu tiên thay đổi nhỏ, dễ rollback: chỉnh script dev hoặc thêm script dev riêng không Turbopack, không đụng business logic editor.

## Audit Summary
### Observation
1. Lỗi vẫn giữ nguyên class: `Module ... was instantiated because it was required from module lexical/Lexical.dev.mjs, but the module factory is not available. It might have been deleted in an HMR update.`
2. Stack trace hiện vẫn dừng tại `app/admin/components/LexicalEditor.impl.tsx` ngay khi module import được evaluate.
3. Repo đã thử 2 vòng workaround app-side:
   - tách shell/lazy boundary,
   - flatten import graph qua `lexicalImports.ts` và tắt `experimental.turbopackFileSystemCacheForDev`.
4. Dù vậy lỗi vẫn tái hiện, nên confidence cho hướng vá app-side tiếp theo giảm mạnh.
5. Web evidence từ nhiều issue/discussion Next.js (`#64494`, `#68077`, `#70424`, `#74167`, `#84264`, `#85883`) cho thấy đây là class bug HMR/Turbopack có thật, lặp lại ở nhiều package khác nhau chứ không riêng Lexical.
6. Workaround alias package đã từng bị loại vì gây startup crash với package exports; tức là không còn nhiều lever config an toàn còn lại trong scope nhỏ.
7. Expected: dev workflow mở route dùng Lexical mà không crash khi HMR. Actual: Turbopack dev vẫn crash sau nhiều vòng workaround.

### Inference
- Root cause mạnh nhất hiện tại là bug/limitation của Turbopack HMR với graph package Lexical, không còn là vấn đề tổ chức code editor.
- Cách đạt mục tiêu ổn định nhanh nhất là tách dev workflow của editor khỏi Turbopack, thay vì tiếp tục sửa app code mà không có evidence đủ mạnh.
- Đây là quyết định thực dụng: tối ưu stability cho dev, không phải giải pháp đẹp nhất về mặt ý tưởng nhưng là giải pháp đáng tin nhất theo evidence hiện có.

### Counter-hypothesis
- Có thể vẫn còn một workaround app-side chưa thử đủ sâu, ví dụ boundary riêng hơn hoặc lazy isolation khác.
- Nhưng sau 2 vòng fix và evidence web hiện tại, xác suất thấp hơn rõ rệt so với opt out Turbopack ở dev.
- Nếu sau này Next.js fix upstream, có thể bật lại Turbopack cho workflow này rất dễ.

## Root Cause Confidence
**High** — vì nhiều vòng sửa app-side không đổi triệu chứng cốt lõi, trong khi web evidence khớp trực tiếp class lỗi HMR/Turbopack.

## 8 câu audit bắt buộc
1. **Triệu chứng:** dev route có Lexical editor crash trong HMR; expected hot reload ổn định, actual nổ `module factory is not available`.
2. **Phạm vi ảnh hưởng:** các trang admin/system dùng `LexicalEditor`; ảnh hưởng dev workflow nhiều hơn production.
3. **Tái hiện:** tái hiện ổn định trên route edit post với Turbopack.
4. **Mốc thay đổi gần nhất:** đã thử boundary split, flatten import graph, tắt dev cache nhưng lỗi vẫn còn.
5. **Dữ liệu còn thiếu:** không có evidence mới đủ mạnh cho một workaround app-side cụ thể khác sẽ chắc thắng.
6. **Giả thuyết thay thế chưa loại trừ hết:** vẫn có thể tồn tại workaround app-side khác, nhưng confidence thấp.
7. **Rủi ro nếu fix sai nguyên nhân:** tiếp tục tốn thêm nhiều vòng sửa mà dev workflow vẫn bất ổn.
8. **Pass/fail:** pass khi chạy dev non-Turbopack và route Lexical không còn crash kiểu HMR này; fail nếu vẫn nổ cùng class lỗi.

## Files Impacted
### Config / scripts
- `package.json` — Vai trò hiện tại: chứa script `dev`, `build`, `start`, `lint`. **Sửa:** đổi `dev` sang non-Turbopack hoặc thêm script dev riêng ổn định cho Lexical workflow.
- `next.config.ts` — Vai trò hiện tại: config Next. **Sửa:** dự kiến giữ nguyên trừ khi cần dọn config workaround dev cache không còn cần thiết.

### Shared editor
- `app/admin/components/LexicalEditor.impl.tsx` — Vai trò hiện tại: implementation editor. **Sửa:** dự kiến không đổi thêm ở vòng này.
- `app/admin/components/lexicalImports.ts` / `nodes/ImageNode.tsx` — Vai trò hiện tại: workaround graph từ vòng trước. **Sửa:** có thể giữ nguyên để tránh mở thêm scope; chỉ rollback nếu cần tối giản.

## Execution Preview
1. Cập nhật `package.json` theo hướng dev workflow không dùng Turbopack cho local editing ổn định.
2. Review `next.config.ts` để quyết định giữ hay bỏ workaround dev-cache hiện tại; ưu tiên đổi ít nhất.
3. Review tĩnh các file editor để không đụng thêm business logic.
4. Chạy `bunx tsc --noEmit` theo rule repo.
5. Commit local kèm spec doc.

## Acceptance Criteria
- Có dev workflow rõ ràng không dùng Turbopack cho Lexical.
- Chạy dev theo workflow mới không còn crash `module factory is not available` từ Lexical/Turbopack HMR.
- `bunx tsc --noEmit` pass.
- Không đổi API/behavior business logic của `LexicalEditor`.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`.
- Repro thủ công: chạy workflow dev mới, mở route `/admin/posts/[id]/edit`, xác nhận editor mount được và không gặp class lỗi HMR cũ.
- Static review: kiểm tra scripts/config thay đổi nhỏ, rollback đơn giản.

## Out of Scope
- Không tiếp tục săn workaround app-side sâu hơn trong vòng này.
- Không nâng cấp Next.js/Lexical.
- Không đổi logic editor.

## Risk / Rollback
- Rủi ro thấp vì thay đổi chủ yếu ở script/config dev.
- Rollback dễ: revert script/config về trạng thái cũ khi upstream fix Turbopack.
- Tradeoff: mất lợi ích Turbopack trong workflow dev có Lexical, nhưng đổi lại là ổn định cao hơn nhiều.

Anh/chị đã chọn **Option A**. Nếu duyệt spec này, em sẽ chuyển dev workflow của repo sang hướng non-Turbopack ổn định hơn cho Lexical.