## TL;DR kiểu Feynman
- Lỗi không còn nằm ở cách tách component nữa; nó nổ ngay lúc Turbopack nạp package Lexical.
- Nghĩa là app code đã né bớt rồi nhưng engine dev/HMR vẫn giữ graph package không nhất quán.
- Cách sửa ít rủi ro nhất là chỉnh `next.config.ts` để cả family Lexical được xử lý đồng bộ.
- Em sẽ giữ nguyên business logic editor, chỉ đụng config và chỉ fallback sâu hơn nếu config chưa đủ.

## Audit Summary
### Observation
1. Stack trace hiện dừng tại `app/admin/components/LexicalEditor.impl.tsx:7`, dòng import `@lexical/react/LexicalComposer`.
2. `LexicalEditor.tsx` đã là shell `dynamic(..., { ssr: false })`; `LexicalEditor.lazy.tsx` chỉ re-export impl.
3. `next.config.ts` hiện đã có `transpilePackages` cho family Lexical, nhưng chưa có thêm guard/config Turbopack nào khác ngoài `experimental.turbopackFileSystemCacheForBuild`.
4. Có spec cũ trong `.factory/docs/2026-03-20-fix-lexical-hmr-runtime-next16-turbopack-keep-turbopack.md` cho thấy boundary refactor không giải quyết được lỗi.
5. Expected: HMR không crash khi route có Lexical editor reload. Actual: crash `module factory is not available` qua `Lexical.dev.mjs` -> `@swc/helpers/esm/_define_property.js`.

### Inference
- Root cause nhiều khả năng là bug/edge case ở Turbopack HMR với graph package Lexical + SWC helper, không phải business logic editor.
- Vì `transpilePackages` hiện đã có nhưng vẫn chưa đủ, vòng sửa tiếp theo cần tập trung vào config Turbopack/Next theo hướng làm graph ổn định hơn, thay vì refactor editor thêm.

### Counter-hypothesis
- Có thể một package con cụ thể của Lexical gây invalidation lỗi, không phải cả family.
- Có thể cần đồng thời giảm fragmentation import trong `LexicalEditor.impl.tsx` nếu config đơn lẻ chưa đủ.
- Tuy nhiên với lựa chọn đã chốt, em sẽ ưu tiên config-only trước để giữ scope nhỏ.

## Root Cause Confidence
**High** — vì lỗi vẫn nổ ngay ở import đầu tiên của Lexical sau khi đã tách shell/lazy boundary; evidence đang nghiêng mạnh về lớp package graph/HMR của Turbopack.

## Files Impacted
### Config
- `next.config.ts` — Vai trò hiện tại: cấu hình Next.js cho repo. **Sửa:** bổ sung workaround config theo hướng giữ Turbopack nhưng ép xử lý nhóm Lexical ổn định hơn trong dev/HMR.

### Shared editor
- `app/admin/components/LexicalEditor.tsx` — Vai trò hiện tại: shell dynamic import cho editor. **Sửa:** dự kiến giữ nguyên.
- `app/admin/components/LexicalEditor.lazy.tsx` — Vai trò hiện tại: re-export impl. **Sửa:** dự kiến giữ nguyên.
- `app/admin/components/LexicalEditor.impl.tsx` — Vai trò hiện tại: editor implementation. **Sửa:** không đổi ở Option A, trừ khi review cuối phát hiện import cần chỉnh rất nhỏ để khớp config.

## Execution Preview
1. Rà lại API config Next 16/Turbopack đang dùng trong repo để chọn đúng field an toàn.
2. Sửa `next.config.ts` theo Option A: thêm workaround config cho family Lexical, ưu tiên thay đổi nhỏ và dễ rollback.
3. Review tĩnh lại import graph/editor entry để chắc không phá API import hiện tại.
4. Chạy `bunx tsc --noEmit` theo rule của repo vì có thay đổi code/config TS liên quan build graph.
5. Chuẩn bị commit local sau khi typecheck sạch.

## Acceptance Criteria
- Có thay đổi rõ ràng trong `next.config.ts` nhằm ổn định Turbopack HMR cho Lexical family.
- API import `LexicalEditor` ở các page hiện tại không phải đổi.
- `bunx tsc --noEmit` pass.
- Repro mục tiêu: route như `app/admin/posts/[id]/edit/page.tsx` không còn crash `module factory is not available` khi HMR reload.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`.
- Repro thủ công: mở một route admin dùng editor, kích HMR bằng thay đổi nhỏ, kiểm tra không còn stack trace `Lexical.dev.mjs` / `@swc/helpers`.
- Static review: soát `next.config.ts` để bảo đảm thay đổi chỉ ảnh hưởng nhóm Lexical, rollback đơn giản.

## Out of Scope
- Không đổi logic toolbar, upload ảnh, serialization, node registration.
- Không upgrade Next.js hoặc Lexical.
- Không tắt Turbopack.

## Risk / Rollback
- Nếu workaround config không đủ, rollback chỉ cần revert thay đổi `next.config.ts`.
- Nếu vẫn lỗi sau Option A, bước kế tiếp sẽ là Option B: thêm chỉnh import graph trong `LexicalEditor.impl.tsx` với evidence rõ hơn.

Anh/chị đã chọn **Option A**. Nếu duyệt spec này, em sẽ bắt đầu implement đúng phạm vi đó.