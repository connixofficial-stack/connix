# I. Primer

## 1. TL;DR kiểu Feynman
- Các card hiển thị đơn hàng và các block thống kê trên trang "Đơn hàng của tôi" `/account/orders` hiển thị nền trắng sáng bất chấp chế độ tối đang bật.
- Nguyên nhân: Hàm tạo màu `getAccountOrdersColors` và `getAccountOrdersStatusBadgeTokens` đang bị gán cứng các mã màu sáng cho các biến trung hòa (nền, chữ, viền).
- Giải pháp: Thêm tham số `isDark` vào các hàm này, chuyển đổi các biến màu trung hòa và màu nền badge sang tông màu tối tương ứng khi `isDark = true`. Đồng thời, lấy cài đặt `siteDarkMode` từ database và truyền xuống các hàm này trong trang `/account/orders`.

## 2. Elaboration & Self-Explanation
Giao diện trang Đơn hàng của tôi sử dụng bộ tokens màu được trả về từ `getAccountOrdersColors` trong `colors.ts`. Hiện tại, hàm này đang giả định giao diện luôn là màu sáng nên gán cứng các mã màu như `#ffffff` cho nền, `#0f172a` cho chữ, v.v. Điều này làm cho các box thống kê và card đơn hàng có nền trắng sáng, lệch tông hoàn toàn với nền tối chung của trang.
Chúng ta sẽ giải quyết bằng cách thêm tham số `isDark?: boolean` vào hàm `getAccountOrdersColors` và `getAccountOrdersStatusBadgeTokens`. Khi `isDark` là `true`, các màu nền, viền và text sẽ được chuyển sang các tông màu tối (tương tự như trang checkout). Sau đó, tại trang `/account/orders/page.tsx`, ta dùng hook `useSiteSettings` để lấy cấu hình `siteDarkMode`, tính toán trạng thái `isDark` và truyền vào các hàm này để cập nhật bộ tokens màu tương thích với Dark Mode.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - Trước khi sửa:
    `const neutralSurface = '#ffffff';`
  - Sau khi sửa:
    `const neutralSurface = isDark ? '#161617' : '#ffffff';`
- **Ví dụ đời thường**: Giống như bạn có một bộ đồng phục dành riêng cho buổi sáng (light mode) gồm áo trắng quần trắng. Khi chuyển sang làm việc buổi tối (dark mode), mọi người trong công ty đổi sang mặc quần áo tối, nhưng riêng nhóm quản lý đơn hàng vẫn mặc bộ áo trắng sáng lóa (card nền trắng) do đồng phục của nhóm này bị may cứng bằng vải trắng. Chúng ta cần bổ sung thêm phiên bản vải màu tối (isDark) cho bộ đồng phục của nhóm này để họ thay đổi đồng bộ theo thời gian làm việc.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Trang `/account/orders` hiển thị nền trang tối nhưng các card đơn hàng, các block thống kê trên cùng và các badge trạng thái vẫn có nền trắng sáng.
- Tệp tin liên quan:
  - [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/account/orders/colors.ts): Chứa các hàm tạo màu `getAccountOrdersColors` và `getAccountOrdersStatusBadgeTokens`.
  - [page.tsx (account/orders)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/account/orders/page.tsx): Route hiển thị danh sách đơn hàng của khách hàng.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause**: Hàm `getAccountOrdersColors` và `getAccountOrdersStatusBadgeTokens` trong `components/site/account/orders/colors.ts` không nhận tham số `isDark` và gán cứng các mã màu sáng cho nền (`neutralSurface`), viền và chữ. Do đó, các card và block thống kê sử dụng inline style dựa trên tokens này đều hiển thị màu sáng.
- **Độ tin cậy nguyên nhân gốc**: High (100% vì code cấu hình màu hiển thị tĩnh).

# IV. Proposal (Đề xuất)
- **Bước 1**: Cập nhật hàm `getAccountOrdersColors` và `getAccountOrdersStatusBadgeTokens` trong `components/site/account/orders/colors.ts` để nhận tham số `isDark?: boolean` và trả về các mã màu tối thích ứng khi `isDark = true`.
- **Bước 2**: Tại `app/(site)/account/orders/page.tsx`, sử dụng hook `useSiteSettings` để lấy `siteDarkMode`.
- **Bước 3**: Tính toán `isDark` dựa trên `siteDarkMode` và truyền `isDark` vào `getAccountOrdersColors` và `getAccountOrdersStatusBadgeTokens`.
- **Bước 4**: Kiểm tra TypeScript compile bằng `bunx tsc --noEmit`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/account/orders/colors.ts)
  - Mô tả: Chứa hàm cấu hình màu của trang đơn hàng.
  - Thay đổi: Thêm tham số `isDark?: boolean` vào `getAccountOrdersColors` và `getAccountOrdersStatusBadgeTokens`, cập nhật các màu trung hòa sang tối.
- **Sửa**: [page.tsx (account/orders)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/account/orders/page.tsx)
  - Mô tả: Route trang danh sách đơn hàng.
  - Thay đổi: Tích hợp hook lấy mode tối, tính `isDark` và truyền vào `getAccountOrdersColors` và `getStatusStyle`.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh sửa `components/site/account/orders/colors.ts` để cập nhật hàm signature và mã màu.
2. Chỉnh sửa `app/(site)/account/orders/page.tsx` để thêm `useSiteSettings` và truyền `isDark`.
3. Chạy `bunx tsc --noEmit` để xác minh.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy kiểm tra TypeScript: `bunx tsc --noEmit 2>&1 | Select-Object -First 10`.
- Kiểm tra thủ công:
  - Truy cập `/system/experiences` bật chế độ tối.
  - Truy cập `/account/orders` và xác nhận các box thống kê, các card đơn hàng hiển thị nền tối và chữ sáng chuẩn.

# VIII. Todo
- [ ] Cập nhật file `components/site/account/orders/colors.ts`
- [ ] Cập nhật file `app/(site)/account/orders/page.tsx`
- [ ] Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi bật chế độ tối: các block thống kê, card đơn hàng, và badge trạng thái trên trang `/account/orders` hiển thị nền tối, chữ sáng tương phản cao và không bị chói.
- Không phát sinh lỗi compile TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: Thấp.
- Rollback: `git checkout -- <file_paths>`.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa logic lọc đơn hàng, logic xem chi tiết hay logic kết nối database.
