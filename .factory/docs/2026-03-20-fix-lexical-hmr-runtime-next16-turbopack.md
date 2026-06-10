## TL;DR kiểu Feynman
- Em đã bọc `LexicalEditor` bằng `dynamic(..., { ssr: false })`, nhưng lỗi vẫn nổ vì bản thân `LexicalEditor.client.tsx` vẫn được Turbopack giữ trong HMR graph và instantiate lại.
- Stack trace chỉ ra lỗi xảy ra ngay khi evaluate import `@lexical/react/LexicalComposer` trong `LexicalEditor.client.tsx`, tức boundary hiện tại chưa đủ cô lập với HMR.
- Đây là lỗi dev-runtime/HMR của Next 16.1.1 + Turbopack + Lexical 0.39, không phải lỗi business logic editor.
- Hướng an toàn nhất là tách thêm một lớp lazy boundary thật sự: page chỉ import shell nhẹ, shell mới `dynamic` editor implementation, và implementation chứa toàn bộ import Lexical.
- Nếu vẫn muốn triệt để hơn trong môi trường dev, có thể thêm phương án B: alias/editor package split hoặc tạm opt-out Turbopack cho editor route; nhưng em không recommend làm ngay vì scope lớn hơn.

## Audit Summary
### Observation
1. Runtime error hiện tại: `module factory is not available` với chain `@swc/helpers -> lexical/Lexical.dev.mjs -> app/admin/components/LexicalEditor.client.tsx`.
2. Code frame xác nhận lỗi nổ ở `app/admin/components/LexicalEditor.client.tsx:7`, ngay dòng `import { LexicalComposer } from '@lexical/react/LexicalComposer';`.
3. `app/admin/components/LexicalEditor.tsx` hiện là wrapper nhẹ dùng `dynamic(() => import('./LexicalEditor.client')...)` với `ssr: false`.
4. `app/admin/components/LexicalEditor.client.tsx` vẫn là file lớn chứa toàn bộ import Lexical ở top-level; chỉ cần module này bị evaluate lại sai nhịp HMR là lỗi sẽ lộ ra ngay.
5. `LexicalEditor` đang được dùng ở nhiều route admin/system: posts, products, services, system/seo. Evidence từ grep `<LexicalEditor` cho thấy đây không phải lỗi riêng một page.
6. Repo đang chạy `next 16.1.1`, `react 19.2.3`, `lexical 0.39.0`, và lỗi phát sinh dưới Turbopack dev runtime.
7. `next.config.ts` hiện không có cấu hình đặc biệt cho transpile/externalize Lexical; chỉ có `experimental.turbopackFileSystemCacheForBuild`.
8. Triệu chứng expected vs actual: expected là HMR cập nhật editor/page ổn định; actual là sau một số update, module factory của dependency Lexical/SWC bị mất nên editor crash ở dev.

### Root cause candidate
- Root cause chính: boundary hiện tại mới chặn SSR, nhưng chưa tách rời hoàn toàn Lexical implementation khỏi HMR evaluation path. `LexicalEditor.client.tsx` vẫn là module nặng, import top-level nhiều package Lexical, nên Turbopack vẫn có thể giữ/refresh module graph của nó và gặp trạng thái factory stale sau HMR.
- Counter-hypothesis 1: lỗi do riêng `posts/[id]/edit/page.tsx`. Bị loại trừ một phần vì editor được reuse ở nhiều route và stack trace trỏ vào editor module chung.
- Counter-hypothesis 2: lỗi do logic trong plugin/image upload. Confidence thấp vì crash xảy ra trước khi component render xong, ngay lúc module evaluation.
- Counter-hypothesis 3: lỗi do cache dev server thuần túy. Có thể đúng một phần, nhưng nếu không đổi boundary code thì lỗi dễ lặp lại sau hot update kế tiếp.

## Root Cause Confidence
**Medium-High** — Evidence trực tiếp từ stack trace + cấu trúc import hiện tại cho thấy vấn đề nằm ở HMR/module-boundary của Lexical implementation. Chưa có repro matrix đầy đủ theo từng route/plugin nên chưa chốt High tuyệt đối.

## 8 câu audit bắt buộc
1. **Triệu chứng:** editor crash runtime trong dev sau HMR; expected editor render bình thường, actual crash tại module evaluation của Lexical.
2. **Phạm vi ảnh hưởng:** tất cả màn dùng `LexicalEditor` chung trong admin/system, không riêng posts.
3. **Tái hiện:** có khả năng tái hiện khi sửa file liên quan editor/page trong dev với Turbopack; điều kiện tối thiểu là route có mount `LexicalEditor` và xảy ra hot update.
4. **Mốc thay đổi gần nhất:** vừa refactor `LexicalEditor.tsx` thành dynamic wrapper + thêm `LexicalEditor.client.tsx`.
5. **Dữ liệu còn thiếu:** chưa có ma trận exact repro step nào luôn nổ 100% và chưa biết plugin nào làm HMR graph nhạy hơn.
6. **Giả thuyết thay thế chưa loại trừ hết:** Turbopack cache bug thuần túy hoặc một plugin Lexical cụ thể gây invalidation sai.
7. **Rủi ro nếu fix sai nguyên nhân:** editor vẫn crash ngẫu nhiên, hoặc fix quá tay làm ảnh hưởng typing/import của toàn bộ route dùng editor.
8. **Pass/fail:** pass khi các route dùng editor hot-reload mà không còn crash `module factory is not available`; fail nếu chỉ đổi import nhưng stack trace vẫn trỏ vào `Lexical.dev.mjs` lúc HMR.

## Files Impacted
### Shared editor
- `app/admin/components/LexicalEditor.tsx` — Vai trò hiện tại: wrapper dynamic client-only; **Sửa:** đổi thành shell rất mỏng, chỉ export lazy boundary và fallback, không re-export trực tiếp từ implementation nếu cách đó kéo implementation vào graph sớm.
- `app/admin/components/LexicalEditor.client.tsx` — Vai trò hiện tại: implementation đầy đủ của editor; **Sửa:** giữ implementation thật nhưng tránh pattern export/type khiến module bị chạm sớm; nếu cần tách tiếp thành `LexicalEditor.impl.tsx`.
- `app/admin/components/LexicalEditorShell.tsx` hoặc `LexicalEditor.impl.tsx` — **Thêm:** lớp implementation riêng để page chỉ chạm shell, shell mới import implementation bằng dynamic.

### Consumers
- `app/admin/posts/[id]/edit/page.tsx` — Vai trò hiện tại: mount editor trong form sửa bài viết; **Sửa:** chỉ nếu cần, chuẩn hóa import sang shell export mới.
- Các route consumer khác (`posts/create`, `products/*`, `services/*`, `system/seo/*`) — Vai trò hiện tại: dùng editor chung; **Sửa:** chỉ khi API export đổi tên/đường dẫn.

## Execution Preview
1. Đọc lại editor wrapper + implementation + 1-2 consumer để xác nhận import graph thật sự.
2. Tách editor thành 3 lớp: public shell, lazy-loaded client boundary, implementation chứa toàn bộ import Lexical.
3. Loại các re-export/type-export có thể kéo implementation vào graph sớm; chuyển type sang file type-only riêng nếu cần.
4. Giữ nguyên API `LexicalEditor` để không phải sửa hàng loạt consumer nếu tránh được.
5. Review tĩnh toàn bộ imports/exports và chạy `bunx tsc --noEmit` sau khi user duyệt spec.

## Proposal Options
### Option A (Recommend) — Hard isolate editor implementation
**Confidence 85%**
- Tạo public shell cực mỏng (`LexicalEditor.tsx`) chỉ `dynamic` một file lazy khác.
- File lazy (`LexicalEditor.lazy.tsx`) là `'use client'` và import implementation thật.
- Implementation thật (`LexicalEditor.impl.tsx`) chứa toàn bộ import Lexical/plugin/image logic.
- Tách `LexicalEditorProps` sang file type-only riêng như `LexicalEditor.types.ts` để wrapper không cần `export type ... from './LexicalEditor.client'`.
- Vì sao recommend: giảm xác suất Turbopack chạm vào module Lexical nặng trước thời điểm mount, thay đổi nhỏ, rollback dễ, ít ảnh hưởng consumer.
- Tradeoff: thêm 1-2 file trung gian.

### Option B — Giữ 2 lớp nhưng bỏ mọi re-export từ implementation
**Confidence 65%**
- Chỉ sửa `LexicalEditor.tsx` để không export type từ `.client`, tách type riêng.
- Có thể đủ nếu nguyên nhân là type/export path khiến `.client` bị đưa vào graph sớm.
- Phù hợp khi muốn đổi ít file nhất.
- Tradeoff: nếu lỗi nằm ở HMR invalidation sâu hơn thì vẫn có thể tái phát.

## Acceptance Criteria
- Mở các route dùng editor (`/admin/posts/[id]/edit`, `/admin/posts/create`, ít nhất thêm 1 route products/services) không lỗi runtime lúc mount ban đầu.
- Sau hot update trên page chứa editor và/hoặc file editor, dev server không còn báo `module factory is not available` từ `Lexical.dev.mjs`.
- API component `LexicalEditor` giữ nguyên cho consumer hoặc chỉ cần đổi import tối thiểu, không làm vỡ typing.
- `bunx tsc --noEmit` pass.

## Verification Plan
- Static: rà import graph của `LexicalEditor` + consumer để chắc không còn re-export kéo implementation sớm.
- Typecheck: chạy `bunx tsc --noEmit`.
- Repro thủ công: mở route posts edit, sửa nhẹ file editor hoặc page để kích HMR, xác nhận editor không crash; lặp trên 1 route khác dùng chung editor.

## Out of Scope
- Không đổi business logic toolbar, upload ảnh, serialize HTML.
- Không nâng version Next/Lexical ở vòng này.
- Không tắt Turbopack toàn cục trừ khi Option A/B thất bại.

## Risk / Rollback
- Rủi ro chính là đổi export/import làm vỡ typing ở consumer. Giảm rủi ro bằng cách giữ nguyên API `LexicalEditor` và tách types rõ ràng.
- Rollback đơn giản: quay về wrapper cũ + xóa các file lazy/types mới nếu phương án không cải thiện HMR.

Nếu user duyệt, em sẽ triển khai theo **Option A** trước vì hiệu quả/cost tốt nhất trong scope hiện tại.