## TL;DR kiểu Feynman
- Lỗi mới nặng hơn vì app chưa kịp chạy: `next.config.ts` đã crash ngay lúc load config.
- Nguyên nhân là em alias package theo kiểu `require.resolve('@lexical/react')`, nhưng package này không cho resolve root entry.
- Nghĩa là workaround trước đã sai ở lớp Node package exports, không chỉ sai ở Turbopack.
- Cách sửa an toàn nhất là rollback alias root-package để `bun dev` sống lại trước.
- Sau đó chỉ giữ các hướng an toàn hơn: không alias package root, hoặc chỉ alias subpath thật sự tồn tại nếu cần.

## Audit Summary
### Observation
1. `bun dev` hiện fail trước khi dev server start với `Failed to load next.config.ts` và `ERR_PACKAGE_PATH_NOT_EXPORTED`.
2. `next.config.ts` hiện có:
   - `createRequire(import.meta.url)`
   - `require.resolve('@lexical/react')`
   - `require.resolve('@lexical/html')`, `@lexical/link`, `@lexical/list`, `@lexical/rich-text`, `@lexical/selection`
3. `node_modules/@lexical/react/package.json` không export root `"."`; nó chỉ export các subpath như `./LexicalComposer`, `./LexicalRichTextPlugin`, ...
4. `node_modules/lexical/package.json` thì có export root `"."`, nên `require.resolve('lexical')` hợp lệ nhưng `require.resolve('@lexical/react')` thì không.
5. Expected: `bun dev` start được để tiếp tục kiểm tra HMR. Actual: config crash ngay ở phase load config, nên block toàn bộ app.

### Inference
- Root cause hiện tại là workaround config dùng sai contract của package exports trong Node/Next config load phase.
- Đây là lỗi chắc chắn và độc lập với bug HMR trước đó; tức là phải sửa startup crash trước khi nói tiếp về HMR.
- Với Option A, thay đổi đúng nhất là rollback alias root-package vừa thêm và quay về trạng thái bootable.

### Counter-hypothesis
- Có thể alias sang file/subpath cụ thể của từng package thay vì root. Tuy nhiên đây là bước tối ưu tiếp theo, không phải bước an toàn nhất để cứu startup ngay.
- Có thể một số package khác trong family Lexical cũng không export root tương tự. Vì vậy giữ pattern `require.resolve('<pkg>')` cho scoped packages là rủi ro.

## Root Cause Confidence
**High** — vì đã có evidence trực tiếp từ stack startup và `package.json` exports của `@lexical/react`; đây không còn là suy luận gián tiếp.

## 8 câu audit bắt buộc
1. **Triệu chứng:** `bun dev` chết ngay khi load `next.config.ts`; expected server khởi động, actual nổ `ERR_PACKAGE_PATH_NOT_EXPORTED`.
2. **Phạm vi ảnh hưởng:** toàn bộ môi trường dev, không route nào chạy được.
3. **Tái hiện:** tái hiện ổn định chỉ cần chạy `bun dev` với config hiện tại.
4. **Mốc thay đổi gần nhất:** commit vừa thêm `turbopack.resolveAlias` với `require.resolve(...)` cho family Lexical.
5. **Dữ liệu còn thiếu:** chưa cần thêm để kết luận startup root cause; evidence đã đủ.
6. **Giả thuyết thay thế chưa loại trừ hết:** ngoài `@lexical/react`, các package scoped khác có thể cũng fail root resolve tương tự.
7. **Rủi ro nếu fix sai nguyên nhân:** tiếp tục block startup hoặc sửa loanh quanh HMR trong khi app vẫn không boot.
8. **Pass/fail:** pass khi `bun dev` load config thành công; fail nếu còn `Failed to load next.config.ts` hoặc `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Files Impacted
### Config
- `next.config.ts` — Vai trò hiện tại: cấu hình Next.js. **Sửa:** bỏ alias root-package gây crash startup; giữ thay đổi tối thiểu để khôi phục boot và không phá API hiện tại.

### Spec / evidence
- `.factory/docs/2026-03-20-fix-lexical-turbopack-hmr-option-a.md` — Vai trò hiện tại: spec vòng trước. **Sửa/Thêm:** ghi nhận rằng workaround root alias đã gây startup crash và bị rollback trong vòng này nếu cần lưu dấu vết spec mới.

## Execution Preview
1. Mở `next.config.ts` và gỡ phần `createRequire` + `lexicalAliases` root-package gây lỗi.
2. Giữ lại các cấu hình an toàn sẵn có (`transpilePackages`, `experimental`, `images`, ...).
3. Review tĩnh để chắc config không còn phụ thuộc vào package exports root không hợp lệ.
4. Chạy `bunx tsc --noEmit` theo rule repo nếu có đổi code/config TypeScript.
5. Chuẩn bị commit local cho bản rollback an toàn.

## Acceptance Criteria
- `bun dev` không còn fail ở bước load `next.config.ts`.
- Không còn `ERR_PACKAGE_PATH_NOT_EXPORTED` từ `@lexical/react` trong startup.
- `next.config.ts` quay về trạng thái bootable, thay đổi nhỏ, dễ rollback.
- Chưa đụng business logic editor.

## Verification Plan
- Repro chính: chạy `bun dev`, xác nhận server khởi động qua phase load config.
- Typecheck: `bunx tsc --noEmit`.
- Static review: kiểm tra không còn `require.resolve('@lexical/...')` ở root package không export `.`.

## Out of Scope
- Chưa xử lý triệt để bug HMR cũ ở vòng này.
- Không refactor `LexicalEditor.impl.tsx`.
- Không upgrade Next/Lexical.

## Risk / Rollback
- Rủi ro thấp vì đây là rollback của thay đổi vừa thêm.
- Nếu sau rollback HMR cũ vẫn còn, app ít nhất đã boot lại và mình có thể điều tra tiếp ở vòng sau mà không block dev server.

Anh/chị đã chọn **Option A**. Nếu duyệt spec này, em sẽ rollback phần alias root-package gây crash startup và commit bản sửa an toàn.