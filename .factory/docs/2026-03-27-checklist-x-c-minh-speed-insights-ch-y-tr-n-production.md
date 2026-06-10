## TL;DR kiểu Feynman
- Import `SpeedInsights` thực tế **đã có** trong code của bạn.
- File hiện tại: `app/(site)/layout.tsx` có cả `import { SpeedInsights } from '@vercel/speed-insights/next'` và `<SpeedInsights />`.
- Nên vấn đề “chưa thấy data” nhiều khả năng nằm ở trạng thái enable/inject/reporting trên Vercel, không phải thiếu import.
- Mình sẽ không đổi code, chỉ đi theo checklist xác minh production theo docs Vercel.

## Audit Summary
- Observation:
  - Trong `E:\NextJS\job\ktec\app\(site)\layout.tsx` đã có:
    - `import { SpeedInsights } from '@vercel/speed-insights/next';`
    - `<SpeedInsights />` trong JSX.
  - Bạn xác nhận đang test trên production domain và đã điều hướng nhiều trang public.
  - Docs Vercel yêu cầu: enable Speed Insights trong project + deploy sau khi enable + script `/<unique-path>/script.js` xuất hiện trên page.
- Inference:
  - Thiếu data không phải do thiếu import trong code.
- Decision:
  - Thực hiện checklist xác minh vận hành trên production, không sửa code.

## Root Cause Confidence
- Medium-High — vì bằng chứng code đã đủ để loại trừ nguyên nhân “quên import”, nhưng chưa có evidence trực tiếp về trạng thái inject script/enable trong dashboard.

## 5/8 Root Cause Checklist
1. Triệu chứng: Vercel chưa hiện data Speed Insights.
2. Phạm vi ảnh hưởng: dashboard Speed Insights của project production.
3. Tái hiện: ổn định theo mô tả của bạn (đã truy cập nhiều trang public).
4. Mốc thay đổi: đã thêm Speed Insights ở commit gần nhất.
5. Dữ liệu thiếu: chưa xác nhận script `/<unique-path>/script.js` có inject thực tế chưa.
6. Giả thuyết thay thế: chưa enable Speed Insights trong dashboard hoặc chưa deploy lại sau khi enable.
7. Rủi ro nếu chẩn đoán sai: sửa code không cần thiết, mất thời gian.
8. Pass/fail: thấy script inject + có traffic + dashboard bắt đầu có datapoint.

## Files Impacted
- Không thay đổi file code trong bước này.

## Execution Preview
1. Mở production page public, View Source (không phải DevTools DOM) để tìm `/_vercel/speed-insights` hoặc `/<unique-path>/script.js`.
2. Vào Vercel project → Speed Insights, xác nhận trạng thái đã Enable.
3. Nếu vừa enable gần đây, redeploy production một lần rồi truy cập lại nhiều page public.
4. Chờ cửa sổ ingest ngắn (thường vài chục giây đến vài phút), refresh dashboard.

## Verification Plan
- Checklist pass:
  - [ ] Có import + mount trong code (đã pass).
  - [ ] Speed Insights đã Enable trong project.
  - [ ] HTML production có script path đặc trưng của Speed Insights.
  - [ ] Có truy cập thật vào các route public sau deployment mới nhất.
- Nếu 4 mục đều pass mà vẫn trống data: chuyển pha 2 audit (xác minh project/team mapping, domain mapping, hoặc CSP/network chặn beacon).

## Acceptance Criteria
- Xác nhận được script inject trên production HTML.
- Dashboard Speed Insights bắt đầu nhận datapoint sau khi truy cập thực tế.
- Không cần chỉnh code thêm nếu checklist pass.

## Out of Scope
- Đổi vị trí mount từ public layout sang root layout.
- Thêm debug code tạm trong app.

## Risk / Rollback
- Không có rủi ro code vì chưa sửa code.

Nếu bạn đồng ý, mình sẽ hướng dẫn bạn check nhanh từng bước ngay trên production URL.