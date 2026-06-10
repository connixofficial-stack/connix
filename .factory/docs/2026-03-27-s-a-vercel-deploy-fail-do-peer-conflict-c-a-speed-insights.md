## TL;DR kiểu Feynman
- Vercel đang dùng `npm install` vì repo có `package-lock.json`.
- Sau khi thêm `@vercel/speed-insights`, npm mới trên Vercel cố resolve cả optional peer của nhánh Svelte/Vite nên bị kẹt `ERESOLVE`.
- Đây không phải lỗi code Next.js hay lỗi chỗ mount `<SpeedInsights />`, mà là lỗi chiến lược resolve dependency của npm.
- Hướng ít rủi ro nhất là thêm `.npmrc` với `legacy-peer-deps=true` để npm bỏ qua peer conflict optional này.
- Mình sẽ giữ nguyên tích hợp Speed Insights hiện có, chỉ sửa cấu hình install để deploy qua được.

## Audit Summary
- Observation:
  - Log Vercel cho thấy bước fail là `npm install`, chưa tới `next build`.
  - Repo hiện có cả `bun.lock` và `package-lock.json`; khi có `package-lock.json`, Vercel chọn npm.
  - `package-lock.json` chưa có entry cho `@vercel/speed-insights`, còn `package.json` đã thêm package này.
  - Log `ERESOLVE` chỉ ra xung đột tại optional peer chain `@vercel/speed-insights -> @sveltejs/kit -> @sveltejs/vite-plugin-svelte -> vite@^8`, trong khi repo đang có `vitest` gắn với `vite@^6 || ^7`.
  - `npm view @vercel/speed-insights` xác nhận các peer như `@sveltejs/kit` là optional, nhưng npm trên Vercel vẫn resolve và fail.
- Inference:
  - Root issue nằm ở npm peer resolution trên môi trường Vercel, không nằm ở code import/render trong `app/(site)/layout.tsx`.
- Decision:
  - Dùng `.npmrc` với `legacy-peer-deps=true` để npm bỏ qua xung đột peer optional và tiếp tục cài package đúng cho nhánh Next.js.

## Root Cause Confidence
- High — vì evidence trực tiếp từ log cho thấy fail ở `npm install`, không phải compile/runtime; thêm nữa cây xung đột chỉ xuất hiện sau khi thêm `@vercel/speed-insights` và liên quan peer optional ngoài stack đang dùng.

## 5/8 Root Cause Checklist
1. Triệu chứng: deploy Vercel fail; expected là build qua, actual là dừng ở `npm install` với `ERESOLVE`.
2. Phạm vi ảnh hưởng: mọi deploy trên Vercel đang dùng npm cho repo này.
3. Tái hiện: ổn định khi Vercel đọc `package-lock.json` và chạy npm strict resolution.
4. Mốc thay đổi gần nhất: commit `d810de3` thêm `@vercel/speed-insights`.
5. Dữ liệu còn thiếu: không cần thêm dữ liệu để chốt fix tối thiểu.
6. Giả thuyết thay thế: lỗi do code mount `SpeedInsights`; đã loại trừ vì fail xảy ra trước build step.
7. Rủi ro nếu fix sai: deploy tiếp tục fail hoặc tạo lệch package manager giữa local và Vercel.
8. Tiêu chí pass/fail: Vercel qua được bước `npm install`; code Speed Insights vẫn giữ nguyên scope public site.

## Files Impacted
- Thêm: `E:\NextJS\job\ktec\.npmrc`
  - Vai trò hiện tại: chưa tồn tại.
  - Thay đổi: cấu hình `legacy-peer-deps=true` để npm trên Vercel bỏ qua optional peer conflict.
- Sửa: `E:\NextJS\job\ktec\.factory\docs\2026-03-27-t-ch-h-p-vercel-speed-insights-cho-public-site.md`
  - Vai trò hiện tại: spec đã lưu cho tích hợp Speed Insights.
  - Thay đổi: bổ sung note ngắn về root cause deploy fail và cách xử lý, nếu cần giữ trace quyết định trong docs phiên làm việc.

## Execution Preview
1. Tạo `.npmrc` ở root với cấu hình tối thiểu `legacy-peer-deps=true`.
2. Giữ nguyên `package.json`, `bun.lock`, `package-lock.json` và code layout hiện tại.
3. Review tĩnh để chắc chắn không mở rộng scope sang build config khác.
4. Commit local kèm `.factory/docs`, không push.

## Verification Plan
- Static review:
  - Kiểm tra `.npmrc` nằm ở root repo và chỉ chứa cấu hình cần thiết.
  - Kiểm tra không có sửa đổi thêm vào logic app/layout.
- Typecheck:
  - Không cần nếu chỉ thêm `.npmrc` và note docs, vì không đổi code TS.
- Repro/expected:
  - Redeploy trên Vercel; kỳ vọng bước `npm install` không còn fail vì peer optional conflict.
  - Nếu deploy vẫn lỗi, bước tiếp theo mới xem xét chuyển Vercel sang Bun hoặc dọn `package-lock.json`.

## Acceptance Criteria
- Repo có `.npmrc` với `legacy-peer-deps=true`.
- Không đổi scope tích hợp Speed Insights đã làm.
- Không chỉnh code app ngoài phần cần thiết cho deploy.
- Có commit local chứa fix deploy.

## Out of Scope
- Chuyển toàn bộ project sang Bun-only.
- Refactor dependency test stack (`vitest`/`vite`).
- Gỡ `@vercel/speed-insights` hoặc đổi sang giải pháp đo khác.

## Risk / Rollback
- Risk thấp đến trung bình: `legacy-peer-deps` có thể làm npm bớt strict, nhưng chỉ áp dụng ở mức install và phù hợp khi conflict nằm ở optional peer không dùng tới.
- Rollback đơn giản: xóa `.npmrc` nếu sau này lockfile/dependency tree được chuẩn hóa lại.

Nếu bạn xác nhận spec này, mình sẽ sửa theo Option A.