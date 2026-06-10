## TL;DR kiểu Feynman
- Boundary code đã được tách thêm lớp nhưng lỗi vẫn nổ ngay khi `LexicalEditor.impl.tsx` import `@lexical/react/*`.
- Evidence mới cho thấy đây không còn là lỗi do shell/lazy split, mà là bug HMR sâu hơn giữa Turbopack và graph của Lexical/SWC.
- Vì anh muốn giữ Turbopack và chấp nhận sửa config, hướng hợp lý tiếp theo là workaround ở `next.config.ts` để đổi cách Turbopack xử lý nhóm package Lexical.
- Em sẽ ưu tiên workaround nhỏ, dễ rollback: thêm cấu hình Turbopack/transpile cho Lexical trước; chỉ nếu chưa đủ mới fallback sang alias/resolution hẹp hơn.
- Không động tới business logic editor; chỉ chỉnh import graph/config để dev HMR ổn định hơn.

## Audit Summary
### Observation
1. Lỗi mới vẫn là `module factory is not available`, nhưng stack trace giờ chuyển từ `LexicalEditor.client.tsx` sang `LexicalEditor.impl.tsx:7`, ngay dòng `import { LexicalComposer } from '@lexical/react/LexicalComposer';`.
2. `LexicalEditor.tsx` hiện đã là shell mỏng, dùng `dynamic(() => import('./LexicalEditor.lazy'))` và không còn `'use client'`.
3. `LexicalEditor.lazy.tsx` chỉ còn 1 import từ `./LexicalEditor.impl`; không có business logic nào ở đây.
4. `LexicalEditor.impl.tsx` vẫn chứa toàn bộ import `@lexical/react`, `lexical`, `@lexical/*`; lỗi nổ trước khi render, tại module evaluation.
5. Repo hiện chưa có bất kỳ cấu hình `transpilePackages`, `serverExternalPackages`, hay `turbopack.resolveAlias/rules` nào ngoài `experimental.turbopackFileSystemCacheForBuild` trong `next.config.ts`.
6. Web evidence từ Next.js issues/discussions cho thấy lỗi kiểu `x was instantiated because it was required from module ... but the module factory is not available` là class lỗi HMR đã được ghi nhận với Turbopack, không riêng repo này.
7. User đã xác nhận mục tiêu là **giữ Turbopack** và **cho phép sửa `next.config.ts`**.
8. Expected vs actual: expected là đổi boundary đủ để hết crash; actual là boundary thay đổi nhưng lỗi vẫn bám vào package Lexical khi HMR.

### Inference
- Root cause chính đã dịch từ “boundary app code chưa đủ tốt” sang “Turbopack đang invalidation/instantiate không ổn với graph dependency của Lexical”.
- Vì lazy split không giải quyết được, sửa tiếp ở component tree có confidence thấp; leverage cao hơn nằm ở config xử lý package.
- Hướng hợp lý nhất trong scope hiện tại là làm Turbopack coi nhóm package Lexical theo cách nhất quán hơn: transpile/resolve chung cụm package để tránh stale factory giữa `@swc/helpers`, `lexical`, `@lexical/react`, `@lexical/*`.

### Counter-hypothesis
- Có thể lỗi do một plugin cụ thể trong editor impl. Nhưng stack trace nổ ngay import `LexicalComposer`, trước khi chạy toolbar/plugin logic; nên confidence thấp.
- Có thể chỉ cần xóa cache dev server. Nhưng user báo “vẫn lỗi” sau refactor boundary, nên đây không còn là fix bền.
- Có thể cần tắt Turbopack mới ổn. Đúng là đây là fallback đáng tin cậy, nhưng user ưu tiên giữ Turbopack nên chưa phải đề xuất chính.

## Root Cause Confidence
**High** — Vì sau khi cô lập boundary mà stack trace vẫn dừng đúng ở import đầu tiên của Lexical, evidence khá mạnh rằng vấn đề nằm ở cách Turbopack xử lý package Lexical/HMR, không còn ở code tổ chức component.

## 8 câu audit bắt buộc
1. **Triệu chứng:** runtime crash trong dev/HMR; expected editor mount và hot reload bình thường, actual nổ ở module evaluation của `@lexical/react/LexicalComposer`.
2. **Phạm vi ảnh hưởng:** tất cả route dùng editor chung trong admin/system.
3. **Tái hiện:** tái hiện được sau các hot update trên route có editor với Turbopack; user vừa xác nhận vẫn còn lỗi.
4. **Mốc thay đổi gần nhất:** đã tách `LexicalEditor` thành shell/lazy/impl/types nhưng không cải thiện.
5. **Dữ liệu còn thiếu:** chưa có matrix package-level nào chứng minh package con nào trong nhóm Lexical gây invalidation chính.
6. **Giả thuyết thay thế chưa loại trừ hết:** bug nằm ở một package con `@lexical/react/*` cụ thể hoặc ở `@swc/helpers` resolution, không phải toàn bộ Lexical family.
7. **Rủi ro nếu fix sai nguyên nhân:** thêm config không đúng có thể không hết lỗi, hoặc làm build/dev chậm hơn mà không giải quyết HMR.
8. **Pass/fail:** pass khi route posts edit và ít nhất 1 route khác dùng editor hot-reload mà không còn báo `module factory is not available`; fail nếu stack trace vẫn trỏ về `Lexical.dev.mjs`/`@swc/helpers` sau khi đổi config.

## Files Impacted
### Config
- `next.config.ts` — Vai trò hiện tại: config Next.js tối giản; **Sửa:** thêm cấu hình Turbopack/Next để xử lý nhóm Lexical theo cách ổn định hơn dưới HMR.

### Shared editor
- `app/admin/components/LexicalEditor.tsx` — Vai trò hiện tại: shell lazy load editor; **Sửa:** có thể giữ nguyên, chỉ chạm nếu cần fallback import path nhỏ.
- `app/admin/components/LexicalEditor.impl.tsx` — Vai trò hiện tại: implementation thật của editor; **Sửa:** chỉ nếu cần tinh gọn import path hoặc gom import để giảm fragmentation graph.
- `app/admin/components/LexicalEditor.lazy.tsx` / `LexicalEditor.client.tsx` — Vai trò hiện tại: lớp trung gian; **Sửa:** khả năng thấp, chủ yếu giữ ổn định API.

## Execution Preview
1. Đọc `next.config.ts` và xác nhận API config Turbopack đang dùng trong repo.
2. Áp dụng workaround config mức 1: thêm xử lý package Lexical theo cụm trong config Next/Turbopack.
3. Nếu cần, giảm fragmentation import trong `LexicalEditor.impl.tsx` để package graph ít nhánh hơn.
4. Review tĩnh import graph editor + config.
5. Chạy `bunx tsc --noEmit`.
6. Nếu user muốn vòng sau, verify thủ công HMR ở posts edit.

## Proposal Options
### Option A (Recommend) — Thêm workaround config cho Lexical family trong `next.config.ts`
**Confidence 80%**
- Thêm cấu hình để Turbopack/Next xử lý thống nhất nhóm package: `lexical`, `@lexical/react`, `@lexical/html`, `@lexical/link`, `@lexical/list`, `@lexical/rich-text`, `@lexical/selection`.
- Kết hợp `transpilePackages` cho cả family Lexical để giảm lệch factory giữa các package con.
- Chỉ tinh chỉnh editor imports nếu cần, còn lại giữ nguyên API component.
- Vì sao recommend: đúng chỗ lỗi hiện lộ ra, scope nhỏ, rollback dễ, vẫn giữ Turbopack.
- Tradeoff: chưa đảm bảo 100% nếu bug nằm sâu trong Turbopack internals.

### Option B — Config + simplify import graph trong `LexicalEditor.impl.tsx`
**Confidence 65%**
- Làm Option A, đồng thời đổi một số import path/package aggregation trong editor impl để graph ít phân mảnh hơn.
- Phù hợp khi muốn tăng xác suất fix trong một vòng.
- Tradeoff: đụng vào code editor nhiều hơn, review dài hơn.

## Acceptance Criteria
- `next.config.ts` có workaround rõ ràng cho Lexical family và không phá config hiện tại.
- `bunx tsc --noEmit` pass.
- Khi mở `/admin/posts/[id]/edit` và kích HMR, không còn crash `module factory is not available` từ `Lexical.dev.mjs`/`@swc/helpers`.
- Các route khác dùng `LexicalEditor` tiếp tục dùng cùng API import hiện tại.

## Verification Plan
- Static: rà `next.config.ts` + import graph của editor để chắc package list đầy đủ và không có import thừa.
- Typecheck: chạy `bunx tsc --noEmit`.
- Repro thủ công: mở posts edit, sửa nhẹ page/editor file để kích HMR; lặp trên 1 route system/seo hoặc products.

## Out of Scope
- Không đổi logic toolbar/upload/serialization.
- Không nâng cấp version Next/Lexical.
- Không tắt Turbopack toàn cục trong vòng này.

## Risk / Rollback
- Nếu workaround config không hiệu quả, rollback chỉ cần revert `next.config.ts` và các tinh chỉnh import liên quan.
- Nếu HMR vẫn lỗi sau Option A, evidence sẽ đủ mạnh để đề xuất fallback opt-out Turbopack riêng dev ở vòng kế tiếp.

Em đề xuất triển khai theo **Option A** trước.