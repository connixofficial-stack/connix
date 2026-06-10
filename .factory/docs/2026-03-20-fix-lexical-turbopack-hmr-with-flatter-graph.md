## TL;DR kiểu Feynman
- Lỗi hiện tại không phải do editor viết sai, mà do Turbopack HMR làm rơi module factory trong graph của Lexical.
- Evidence web cho thấy thông điệp `module factory is not available` là class bug đã được ghi nhận ở nhiều package khác, không riêng repo này.
- Workaround trước bằng `resolveAlias` root-package đã fail vì đụng package exports, nên vòng này phải tránh hướng đó.
- Cách sửa an toàn hơn là làm graph Lexical bớt phân mảnh trong app code, đồng thời tắt cache dev của Turbopack để giảm stale factory.
- Mục tiêu là giữ Turbopack, giữ API `LexicalEditor`, và ưu tiên thay đổi nhỏ, dễ rollback.

## Audit Summary
### Observation
1. Stack trace vẫn dừng ở `app/admin/components/LexicalEditor.impl.tsx:7`, ngay import `@lexical/react/LexicalComposer`.
2. `LexicalEditor.tsx` hiện đã dùng `dynamic(() => import('./LexicalEditor.lazy'), { ssr: false })`; `LexicalEditor.lazy.tsx` chỉ re-export impl, nhưng lỗi vẫn nổ ở module evaluation.
3. `LexicalEditor.impl.tsx` hiện import nhiều entry rời rạc từ `@lexical/react/*`, `@lexical/list`, `@lexical/link`, `@lexical/rich-text`, `@lexical/html`, `@lexical/selection`, và `lexical`.
4. Web evidence từ Next.js issues/discussions (`#64494`, `#68077`, `#74167`, `#84264`) cho thấy lỗi `module factory is not available` / `It might have been deleted in an HMR update` là class lỗi HMR có thật của Turbopack với graph phức tạp hoặc dynamic boundaries.
5. Web evidence mới cũng cho thấy `resolveAlias` của Turbopack có edge cases với package exports/subpath (`#88540`), nên hướng alias package là rủi ro cao.
6. `next.config.ts` hiện mới có `transpilePackages` cho Lexical family và `experimental.turbopackFileSystemCacheForBuild`; chưa có cấu hình riêng cho dev cache.
7. Expected: route có editor HMR ổn định. Actual: HMR làm stale factory giữa `lexical/Lexical.dev.mjs` và `@swc/helpers/esm/_define_property.js`.

### Inference
- Root cause chính là tổ hợp giữa Turbopack HMR cache/invalidation và import graph dày của Lexical trong một client entry, không phải business logic editor.
- Vì workaround alias package đã bị loại trừ, lever tốt nhất còn lại là: (1) giảm fragmentation graph ở app code, (2) tắt dev filesystem cache để giảm stale module factory.
- Đây là workaround thực dụng theo scope hiện tại, không phải fix gốc ở Turbopack internals.

### Counter-hypothesis
- Có thể chỉ cần đổi import graph là đủ, không cần tắt dev cache.
- Có thể bug nằm sâu trong một package con như `@lexical/react` hoặc `@swc/helpers`, nên workaround app-side chỉ giảm tần suất chứ không triệt để 100%.
- Dù vậy, Option A có xác suất tốt hơn Option B vì nó xử lý cả phía graph lẫn cache invalidation.

## Root Cause Confidence
**High** — vì evidence local + web cùng hội tụ vào class bug HMR của Turbopack; code editor hiện chỉ là nơi kích hoạt graph đó, không phải nguyên nhân business logic.

## 8 câu audit bắt buộc
1. **Triệu chứng:** route có Lexical editor crash trong dev/HMR; expected hot reload ổn định, actual nổ `module factory is not available`.
2. **Phạm vi ảnh hưởng:** mọi trang đang dùng `LexicalEditor` chung trong admin/system.
3. **Tái hiện:** tái hiện trên route edit post hiện tại khi HMR chạy với Turbopack.
4. **Mốc thay đổi gần nhất:** đã thử tách shell/lazy boundary và đã rollback alias root-package vì gây startup crash.
5. **Dữ liệu còn thiếu:** chưa có proof tuyệt đối package con nào là điểm nổ chính trong family Lexical.
6. **Giả thuyết thay thế chưa loại trừ hết:** một import subpath riêng lẻ hoặc `ImageNode.tsx` cũng có thể góp phần làm graph bất ổn.
7. **Rủi ro nếu fix sai nguyên nhân:** thêm thay đổi mà lỗi HMR vẫn còn, hoặc chỉ giảm triệu chứng chứ chưa hết hẳn.
8. **Pass/fail:** pass khi mở `/admin/posts/[id]/edit` và ít nhất 1 route khác có editor, kích HMR mà không còn stack trace `Lexical.dev.mjs` / `@swc/helpers`; fail nếu lỗi vẫn tái hiện cùng class stack.

## Files Impacted
### Config
- `next.config.ts` — Vai trò hiện tại: cấu hình Next.js/Turbopack cho repo. **Sửa:** thêm `experimental.turbopackFileSystemCacheForDev: false` để tránh stale factory trong dev, giữ nguyên các config an toàn khác.

### Shared editor
- `app/admin/components/LexicalEditor.impl.tsx` — Vai trò hiện tại: implementation chính của editor với nhiều import Lexical rời rạc. **Sửa:** làm phẳng/giảm fragmentation import graph của Lexical theo hướng ít entry hơn và nhất quán hơn.
- `app/admin/components/LexicalEditor.lazy.tsx` — Vai trò hiện tại: re-export impl. **Sửa:** chỉ chạm nếu cần giữ boundary ổn định sau khi tinh gọn graph.
- `app/admin/components/nodes/ImageNode.tsx` — Vai trò hiện tại: custom decorator node dùng thêm hook/package Lexical. **Sửa:** review import graph để bảo đảm pattern import đồng nhất với editor chính; chỉ đổi khi thật sự cần.

## Execution Preview
1. Rà lại những import Lexical đang tạo nhiều nhánh trong `LexicalEditor.impl.tsx` và `ImageNode.tsx`.
2. Tinh gọn import graph theo hướng ít entry phân mảnh hơn nhưng không đổi API component.
3. Bổ sung `experimental.turbopackFileSystemCacheForDev: false` trong `next.config.ts`.
4. Review tĩnh để chắc không lặp lại lỗi package exports như vòng alias trước.
5. Chạy `bunx tsc --noEmit`.
6. Commit local kèm spec doc theo rule repo.

## Acceptance Criteria
- `LexicalEditor` vẫn giữ nguyên API import và behavior hiện tại.
- `next.config.ts` không gây startup crash.
- `bunx tsc --noEmit` pass.
- Repro dev/HMR trên route dùng editor không còn lỗi `module factory is not available` với stack bám `Lexical.dev.mjs` / `@swc/helpers`.

## Verification Plan
- Static review: soát toàn bộ import Lexical trong editor và custom node để chắc graph đã nhất quán hơn.
- Typecheck: `bunx tsc --noEmit`.
- Repro thủ công: mở `/admin/posts/[id]/edit`, sửa nhẹ file liên quan để kích HMR; lặp thêm trên 1 route khác dùng editor.

## Out of Scope
- Không đổi toolbar/upload/serialization logic.
- Không nâng cấp Next.js hay Lexical.
- Không tắt Turbopack.

## Risk / Rollback
- Nếu tắt dev cache không giúp, rollback rất nhỏ ở `next.config.ts`.
- Nếu tinh gọn import graph làm phát sinh lỗi type/runtime, rollback giới hạn trong các file editor.
- Nếu Option A vẫn không đủ, vòng sau mới cân nhắc workaround mạnh hơn như thay đổi boundary hoặc giảm HMR exposure riêng cho editor.

Anh/chị đã chọn **Option A**. Nếu duyệt spec này, em sẽ implement đúng phạm vi trên.