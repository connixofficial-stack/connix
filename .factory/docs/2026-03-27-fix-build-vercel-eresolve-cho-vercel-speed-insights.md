## TL;DR kiểu Feynman
- `@vercel/speed-insights` và import `SpeedInsights` đã có đúng trong code.
- Build fail không phải do thiếu import/dependency, mà do Vercel đang dùng `npm install` strict peer-deps.
- Cách fix tối thiểu theo lựa chọn của bạn: thêm `.npmrc` với `legacy-peer-deps=true`.
- Không đổi logic app, không đổi feature; chỉ mở khóa bước cài dependencies trên CI.

## Audit Summary
### Observation
- `package.json` đã có `"@vercel/speed-insights": "^2.0.0"`.
- `app/(site)/layout.tsx` đã import và render `SpeedInsights`.
- Log Vercel fail ở bước `npm install` với `ERESOLVE could not resolve`, gốc do peer dependency chain của `@vercel/speed-insights` (optional peer `@sveltejs/kit`) va chạm với `vite` trong graph hiện tại.
- Repo hiện chưa có `.npmrc` (đã kiểm tra glob).

### Inference
- Đây là lỗi dependency resolution của npm trên môi trường deploy, không phải lỗi code runtime/compile của feature vừa port.
- Thêm `.npmrc` với `legacy-peer-deps=true` là fix nhỏ nhất, bám đúng gợi ý của npm trong log (`--legacy-peer-deps`), và đúng commit pattern đã có bên `ktec`.

### Decision
- Chọn fix tối thiểu: **thêm file `.npmrc` tại root** với nội dung `legacy-peer-deps=true`.
- Giữ nguyên code hiện tại (đã có `bun add @vercel/speed-insights` + import đúng).

## Root Cause Confidence
**High** — Evidence trực tiếp từ log Vercel (`npm install` + `ERESOLVE`) và trạng thái file hiện tại (dependency/import đã tồn tại). Chênh lệch duy nhất để làm npm deploy pass là policy resolve peer deps.

## Files Impacted
- `Thêm: E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\.npmrc`
  - Vai trò hiện tại: chưa có cấu hình npm resolver ở root.
  - Thay đổi: thêm `legacy-peer-deps=true` để npm trên Vercel bỏ strict peer resolution.

## Execution Preview
1. Tạo `.npmrc` ở root với 1 dòng `legacy-peer-deps=true`.
2. Review nhanh `git diff` để đảm bảo chỉ có file cấu hình mới.
3. Commit local theo convention repo.

## Acceptance Criteria
- Repo có `.npmrc` root chứa `legacy-peer-deps=true`.
- Không có thay đổi ngoài scope (không sửa logic/layout/settings).
- Build Vercel không còn fail ở bước `npm install` với lỗi ERESOLVE vừa nêu.

## Verification Plan
- Static: xác nhận `.npmrc` được commit ở root.
- CI/runtime: redeploy trên Vercel và kiểm tra install phase pass.
- Không chạy lint/unit/build local theo guideline repo.

## Out of Scope
- Không đổi package manager của Vercel sang Bun trong đợt này.
- Không rollback/remove `@vercel/speed-insights`.
- Không thay đổi dependency graph khác ngoài resolver policy của npm.

## Risk / Rollback
- Risk thấp: `legacy-peer-deps` có thể cho phép cài peer chưa tối ưu, nhưng chỉ tác động bước install.
- Rollback đơn giản: xóa `.npmrc` nếu muốn quay lại strict resolution.