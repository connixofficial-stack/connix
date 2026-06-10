# I. Primer

## 1. TL;DR kiểu Feynman
- Trang tra cứu đơn hàng `/tra-cuu-don-hang` không hỗ trợ chế độ tối (dark mode) dù hệ thống đã được bật chế độ tối.
- Nguyên nhân: Các màu sắc nền, viền và chữ trên trang tra cứu đang bị viết cứng (hardcode) bằng màu sáng (như `#ffffff`, `#f8fafc`, v.v.).
- Giải pháp: Tích hợp bộ tạo màu `getCheckoutColors` vào trang tra cứu đơn hàng, tính toán trạng thái `isDark` và sử dụng các tokens màu tương ứng để hiển thị giao diện thay cho các mã màu viết cứng.

## 2. Elaboration & Self-Explanation
Giao diện trang tra cứu đơn hàng hiện tại đang sử dụng các class Tailwind cứng (ví dụ `bg-white`, `text-gray-900`) kết hợp các style inline cứng (như `background: '#f8fafc'`, `borderColor: '#e5e7eb'`). Khi người dùng đổi sang giao diện tối, toàn bộ trang vẫn trắng sáng và chữ mờ nhạt do không tự động điều chỉnh.
Chúng ta sẽ giải quyết bằng cách áp dụng cơ chế tokens màu tương tự như trang checkout. Chúng ta import `getCheckoutColors` và `useSiteSettings`, tính toán trạng thái `isDark` từ cấu hình hệ thống `siteDarkMode`, sau đó tạo bộ màu `tokens`. Thay thế toàn bộ mã màu nền, viền, chữ và input viết cứng bằng các tokens này (ví dụ: nền trang dùng `tokens.pageBg`, card dùng `tokens.surface`, chữ dùng `tokens.bodyText` và `tokens.heading`).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - Trước khi sửa:
    `<div className="min-h-screen" style={{ background: '#f8fafc' }}>`
  - Sau khi sửa:
    `<div className="min-h-screen" style={{ backgroundColor: tokens.pageBg, color: tokens.bodyText }}>`
- **Ví dụ đời thường**: Trang tra cứu đơn hàng giống như một căn phòng chưa được nối dây điện vào công tắc tổng (cấu hình hệ thống). Khi bên ngoài trời đã tối (chế độ tối) và các phòng khác đã bật đèn tối (chuyển dark mode), căn phòng này vẫn bật đèn tuýp sáng trưng vì công tắc của nó bị nối trực tiếp vào nguồn điện sáng (hardcode). Chúng ta cần kết nối công tắc của căn phòng này vào hệ thống điều khiển chung để nó tự động đổi đèn khi trời tối.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Trang tra cứu đơn hàng `/tra-cuu-don-hang` hiển thị nền trắng sáng, chữ xám và các viền xám sáng khi bật chế độ tối.
- Tệp tin liên quan:
  - [page.tsx (tra-cuu-don-hang)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/tra-cuu-don-hang/page.tsx): Route tra cứu đơn hàng.
  - [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/checkout/colors.ts): Hàm tạo màu `getCheckoutColors` dùng chung cho checkout.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause**: Route `app/(site)/tra-cuu-don-hang/page.tsx` sử dụng các mã màu hardcode sáng cho thuộc tính `style` và class Tailwind sáng, hoàn toàn bỏ qua cấu hình `site_dark_mode` của hệ thống.
- **Độ tin cậy nguyên nhân gốc**: High (100% vì code sử dụng mã màu tĩnh).

# IV. Proposal (Đề xuất)
- **Bước 1**: Import `useSiteSettings` từ `@/components/site/hooks` và `getCheckoutColors` từ `@/components/site/checkout/colors`.
- **Bước 2**: Tại `TraCuuContent()`, tính toán `isDark` dựa trên `siteDarkMode`. Sinh ra `tokens` từ `getCheckoutColors`.
- **Bước 3**: Truyền `tokens` và `isDark` từ `TraCuuContent` xuống các component con: `OrderByNumberView`, `OrdersByPhoneView`, `OrderCard`, `CancelDialog`.
- **Bước 4**: Thay thế toàn bộ mã màu nền, chữ, viền, input viết cứng sang các tokens phù hợp (ví dụ: `tokens.pageBg`, `tokens.surface`, `tokens.border`, `tokens.bodyText`, `tokens.heading`, `tokens.inputText`, `tokens.inputBg`).

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [page.tsx (tra-cuu-don-hang)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/tra-cuu-don-hang/page.tsx)
  - Mô tả: Route chính cho trang tra cứu đơn hàng.
  - Thay đổi: Tích hợp hook lấy mode tối, truyền tokens màu xuống toàn bộ component con và thay thế inline style/class Tailwind cứng.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh sửa `app/(site)/tra-cuu-don-hang/page.tsx` để thêm imports, nhận thêm các tham số `tokens` trong props của các component con, và đổi các mã màu.
2. Kiểm tra TypeScript compile bằng `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy lệnh kiểm tra TypeScript: `bunx tsc --noEmit 2>&1 | Select-Object -First 10`.
- Kiểm tra thủ công (Client/Tester):
  - Truy cập `/system/experiences`, bật chế độ tối.
  - Truy cập `/tra-cuu-don-hang?orderNumber=ORD-20260607-3115` kiểm tra giao diện trang tra cứu xem đã hiển thị nền tối và chữ sáng chuẩn chưa.

# VIII. Todo
- [ ] Chỉnh sửa `app/(site)/tra-cuu-don-hang/page.tsx` tích hợp tokens màu.
- [ ] Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi `site_dark_mode` là `dark`:
  - Trang `/tra-cuu-don-hang` hiển thị màu nền tối, các card nền xám đen/tối, chữ sáng, input và các nút bấm có màu sắc hài hòa.
- Không có lỗi compile TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: Thấp. Chỉ ảnh hưởng giao diện hiển thị của trang tra cứu đơn hàng.
- Rollback: `git checkout -- app/(site)/tra-cuu-don-hang/page.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào logic xử lý API tra cứu hay hủy đơn hàng.
