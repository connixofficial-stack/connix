## TL;DR kiểu Feynman
- App hiện đã có `@vercel/analytics` ở root layout, nhưng chưa có `@vercel/speed-insights`.
- Bạn chọn chỉ đo phần public site, nên vị trí gắn phù hợp nhất là `app/(site)/layout.tsx`, không phải root.
- Mình sẽ thêm package `@vercel/speed-insights` rồi render `<SpeedInsights />` trong site layout để chỉ track traffic public.
- Cách này ít đụng chạm nhất, không ảnh hưởng `/admin` và `/system`, dễ rollback.
- Sau khi code xong, mình sẽ tự review tĩnh và commit local, không push.

## Audit Summary
- Observation:
  - `package.json` hiện có `@vercel/analytics` nhưng chưa có `@vercel/speed-insights`.
  - `app/layout.tsx` đang mount `<Analytics />` ở root nên analytics hiện áp dụng cho toàn app.
  - `app/(site)/layout.tsx` là layout bao cho phần public site và phù hợp với yêu cầu “chỉ public site”.
- Inference:
  - Gắn `SpeedInsights` tại `app/(site)/layout.tsx` sẽ đúng scope yêu cầu và tránh thu thập từ khu vực quản trị.
- Decision:
  - Chọn tích hợp tối thiểu: cài package + mount component tại `app/(site)/layout.tsx`.

## Root Cause Confidence
- High — vì đã xác nhận bằng code rằng package chưa tồn tại trong `package.json`, grep toàn repo không có `SpeedInsights`, và user đã chốt scope là chỉ public site.

## 5/8 Root Cause Checklist
1. Triệu chứng: site deploy Vercel nhưng chưa có Speed Insights; expected là có telemetry speed cho public site, actual là chưa thấy bất kỳ tích hợp nào trong code.
2. Phạm vi ảnh hưởng: phần public site trên Vercel; không cần áp dụng cho admin/system.
3. Tái hiện: ổn định; chỉ cần grep repo và kiểm tra `package.json`/layout là thấy thiếu tích hợp.
4. Mốc thay đổi gần nhất: repo gần đây thêm `@vercel/analytics` nhưng chưa thêm `speed-insights`.
5. Dữ liệu còn thiếu: không thiếu gì quan trọng để triển khai bản tối thiểu.
6. Giả thuyết thay thế: có thể user định gắn ở root để đo toàn app, nhưng đã bị loại trừ vì user chọn “Chỉ public site”.
7. Rủi ro nếu fix sai: nếu gắn root layout sẽ thu cả admin/system, làm lệch dữ liệu.
8. Tiêu chí pass/fail: package có trong dependencies, `app/(site)/layout.tsx` render `<SpeedInsights />`, không đụng layout admin/system.

## Files Impacted
- Sửa: `E:\NextJS\job\ktec\package.json`
  - Vai trò hiện tại: khai báo dependencies/scripts của app Next.js.
  - Thay đổi: thêm dependency `@vercel/speed-insights`.
- Sửa: `E:\NextJS\job\ktec\app\(site)\layout.tsx`
  - Vai trò hiện tại: layout bao cho toàn bộ public site, sinh metadata và render `SiteShell`.
  - Thay đổi: import và mount `<SpeedInsights />` ở mức site layout để chỉ đo public traffic.

## Execution Preview
1. Đọc lại `package.json` và `app/(site)/layout.tsx` để bám style import/render hiện tại.
2. Thêm `@vercel/speed-insights` vào dependencies.
3. Chèn import `SpeedInsights` và render component ở `app/(site)/layout.tsx`.
4. Tự review tĩnh: import order, SSR compatibility, null impact tới layout hiện có.
5. Commit local với message ngắn gọn, không push.

## Verification Plan
- Static review:
  - Kiểm tra dependency đã khai báo đúng tên package.
  - Kiểm tra `SpeedInsights` chỉ xuất hiện trong `app/(site)/layout.tsx`.
  - Kiểm tra không có thay đổi ngoài scope `/admin` và `/system`.
- Typecheck:
  - Sau khi sửa code TS, chạy `bunx tsc --noEmit` trước commit theo guideline repo.
- Repro/expected:
  - Sau deploy lên Vercel, truy cập vài page public để Vercel bắt đầu thu thập data.
  - Không kỳ vọng có data ngay lập tức trong codebase; phần đó phụ thuộc dashboard Vercel sau deploy.

## Acceptance Criteria
- `package.json` có `@vercel/speed-insights`.
- `app/(site)/layout.tsx` import và render `<SpeedInsights />`.
- Không thêm Speed Insights vào `app/layout.tsx`, `app/admin/layout.tsx`, hay `app/system/layout.tsx`.
- Thay đổi nhỏ, dễ rollback, không mở rộng scope.

## Out of Scope
- Cấu hình thêm cho Vercel dashboard.
- Thay đổi analytics hiện tại (`@vercel/analytics`).
- Tối ưu Core Web Vitals hay performance code của site.

## Risk / Rollback
- Risk thấp: chỉ thêm 1 dependency và 1 component mount.
- Rollback đơn giản: gỡ dependency và xóa `<SpeedInsights />` khỏi `app/(site)/layout.tsx`.

Nếu bạn xác nhận spec này, mình sẽ triển khai đúng theo hướng trên.
## Deploy Note
- Nếu Vercel fail ở bước `npm install` do peer conflict optional, dùng `.npmrc` với `legacy-peer-deps=true` để bỏ qua.