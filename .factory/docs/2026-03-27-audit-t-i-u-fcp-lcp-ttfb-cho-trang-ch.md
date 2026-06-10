## TL;DR kiểu Feynman
- Ảnh cho thấy Speed Insights đã hoạt động, không còn lỗi tích hợp.
- Vấn đề hiện tại là hiệu năng thực tế của route `/`, không phải thiếu import hay thiếu script.
- Chỉ số đang kéo điểm xuống là `TTFB 1.49s`, `LCP 2.96s`, `FCP 2.19s`; CLS và INP/FID đang ổn.
- Mình sẽ audit trang chủ để tìm phần nào làm server trả chậm và phần hero/render đầu trang hiển thị chậm.
- Hướng làm sẽ ưu tiên thay đổi nhỏ, dễ rollback, bám pattern Next.js hiện có.

## Audit Summary
- Observation:
  - Ảnh dashboard có **4 data points** và route `/` đã được ghi nhận, nên Speed Insights đang nhận dữ liệu bình thường.
  - `Real Experience Score = 89` ở mức *Needs Improvement*, không phải lỗi tracking.
  - Các metric nhìn thấy trên ảnh:
    - `FCP: 2.19s`
    - `LCP: 2.96s`
    - `TTFB: 1.49s`
    - `CLS: 0`
    - `INP/FID: 0ms`
  - Code hiện tại đã có `import { SpeedInsights } from '@vercel/speed-insights/next'` trong `app/(site)/layout.tsx`.
  - Khảo sát sơ bộ cho thấy phần public site dùng nhiều `getSiteSettings/getSEOSettings/...` ở layout/page, và có homepage client component riêng (`app/(site)/_components/HomePageClient.tsx`) là ứng viên cần audit tiếp.
- Inference:
  - Root bottleneck khả năng cao nằm ở 2 nhóm:
    1. **Server/render đầu trang**: nhiều request/settings/query ở layout hoặc homepage làm tăng TTFB.
    2. **Hero/above-the-fold content**: thành phần đầu trang hoặc ảnh đầu trang làm tăng FCP/LCP.
- Decision:
  - Thay vì sửa mù, mình sẽ audit có evidence cho riêng route `/`, rồi mới chốt fix tối thiểu.

## Root Cause Confidence
- Medium — đã chắc chắn không còn lỗi tích hợp Speed Insights, nhưng chưa đủ evidence để kết luận chính xác file/hàm nào đang kéo TTFB/LCP cho route `/` nếu chưa đọc sâu homepage và các component đầu trang.

## 5/8 Root Cause Checklist
1. Triệu chứng: dashboard có data nhưng điểm RES chỉ 89, expected là >90 hoặc tốt hơn.
2. Phạm vi ảnh hưởng: production public route `/`.
3. Tái hiện: có dấu hiệu ổn định vì đã có 4 datapoint cho `/`.
4. Mốc thay đổi gần nhất: vừa thêm Speed Insights nên mới thấy metric thực tế.
5. Dữ liệu còn thiếu: chưa xác định chính xác component/query nào ở homepage là nguyên nhân lớn nhất.
6. Giả thuyết thay thế: metric xấu do traffic sample ít; chưa loại trừ hoàn toàn nhưng TTFB/LCP hiện đủ rõ để audit tiếp.
7. Rủi ro nếu fix sai: tối ưu nhầm khu vực không ảnh hưởng metric chính, tăng độ phức tạp mà không cải thiện điểm.
8. Tiêu chí pass/fail: tìm được root cause có evidence theo file/hàm/query; fix phải nhắm đúng TTFB/LCP/FCP của `/`.

## Files Impacted
- Sửa: `E:\NextJS\job\ktec\app\(site)\page.tsx`
  - Vai trò hiện tại: route `/` của public site.
  - Thay đổi dự kiến: audit logic fetch/render của homepage, xác định phần blocking trên server và above-the-fold.
- Sửa: `E:\NextJS\job\ktec\app\(site)\_components\HomePageClient.tsx`
  - Vai trò hiện tại: client component chính của homepage.
  - Thay đổi dự kiến: audit render đầu trang, hydration cost, thành phần hero/LCP candidate.
- Sửa: `E:\NextJS\job\ktec\components\site\SiteShell.tsx`
  - Vai trò hiện tại: shell chung cho public site.
  - Thay đổi dự kiến: kiểm tra xem header/shell có tạo thêm blocking work cho `/` không.
- Sửa: `E:\NextJS\job\ktec\lib\get-settings.ts`
  - Vai trò hiện tại: lấy dữ liệu settings dùng rất nhiều ở public layouts/pages.
  - Thay đổi dự kiến: audit pattern truy vấn, khả năng lặp query hoặc thiếu caching cho route `/`.
- Shared / audit candidates khác (đọc thêm nếu cần): các component đầu trang trong `components/site/**` được homepage render ngay above-the-fold.

## Execution Preview
1. Đọc `app/(site)/page.tsx` và `app/(site)/_components/HomePageClient.tsx` để xác định cấu trúc render route `/`.
2. Lập bản đồ các query/settings/data fetch chặn render đầu tiên.
3. Xác định LCP candidate thực tế (hero image/text block/slider/banner) từ code route `/`.
4. Đề xuất fix tối thiểu theo thứ tự ưu tiên: giảm TTFB trước, rồi giảm LCP/FCP.
5. Sau khi chốt hướng có evidence, mới triển khai thay đổi code nhỏ nhất cần thiết.

## Verification Plan
- Static audit:
  - Truy ra file/hàm/query làm tăng TTFB cho `/`.
  - Truy ra element likely là LCP candidate ở above-the-fold.
  - Kiểm tra có fetch trùng, query nối tiếp, hoặc client hydration nặng không.
- Typecheck sau khi có sửa code TS:
  - `bunx tsc --noEmit`
- Repro/expected:
  - Sau deploy, Speed Insights cho route `/` cần có xu hướng cải thiện ở TTFB/LCP/FCP sau khi có đủ thêm datapoints.

## Acceptance Criteria
- Có audit rõ root cause cho route `/` với evidence theo file/path.
- Có proposal fix theo thứ tự ưu tiên TTFB → LCP → FCP.
- Nếu triển khai, thay đổi phải nhỏ, đúng scope trang chủ, dễ rollback.

## Out of Scope
- Tối ưu toàn bộ site ngoài route `/`.
- Refactor lớn kiến trúc public site nếu chưa cần.
- Chuyển Speed Insights sang root layout.

## Risk / Rollback
- Risk thấp ở giai đoạn audit.
- Nếu triển khai fix, sẽ ưu tiên thay đổi cục bộ tại homepage/shell/query để rollback dễ.

Nếu bạn xác nhận spec này, mình sẽ bắt đầu audit sâu route `/` và chốt root cause cụ thể trước khi sửa.