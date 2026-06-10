# I. Primer

## 1. TL;DR kiểu Feynman
- Trang checkout và trang cảm ơn không tự động chuyển sang chế độ tối (dark mode) khi bật chế độ tối trong cài đặt hệ thống.
- Nguyên nhân: Hàm tạo màu `getCheckoutColors` đang bị gán cứng các mã màu sáng cho các biến trung hòa (nền, chữ, viền).
- Giải pháp: Thêm tham số `isDark` vào hàm `getCheckoutColors`, cập nhật các biến màu trung hòa sang tông tối khi `isDark` là `true`. Đồng thời, lấy cấu hình `site_dark_mode` từ database truyền xuống trang site checkout, thank-you và preview editor.

## 2. Elaboration & Self-Explanation
Hệ thống hiển thị màu sắc của trang thanh toán (checkout) và trang cảm ơn (thank-you) dựa vào bộ tokens màu được trả về từ hàm `getCheckoutColors`. Hiện tại, hàm này đang giả định giao diện luôn là màu sáng nên gán cứng các mã màu như `#ffffff` cho nền, `#0f172a` cho chữ, v.v. Khi người dùng bật chế độ tối ở `/system/experiences` (được lưu vào setting `site_dark_mode`), hệ thống sẽ thêm tag data-theme="dark" cho layout của site, nhưng trang checkout do sử dụng tokens cứng nên vẫn hiển thị màu trắng sáng gây lệch tông giao diện.
Chúng ta sẽ mở rộng hàm `getCheckoutColors` để nhận thêm tham số `isDark`. Khi `isDark` là `true`, các biến màu nền, chữ, viền sẽ được chuyển sang các mã màu tối tương thích (tương tự như cách đã triển khai cho chi tiết sản phẩm `getProductDetailColors`). Sau đó, chúng ta cập nhật các trang site checkout, thank-you và trang preview trong admin để lấy cài đặt `site_dark_mode` và truyền `isDark` vào hàm này.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - Trước khi sửa:
    `const neutralSurface = '#ffffff';`
  - Sau khi sửa:
    `const neutralSurface = isDark ? '#161617' : '#ffffff';`
- **Ví dụ đời thường**: Giống như bạn có một người pha chế (hàm `getCheckoutColors`) chỉ biết pha nước chanh ngọt (màu sáng) cho mọi khách hàng. Khi quán chuyển sang phục vụ buổi tối (chế độ tối), người pha chế vẫn làm ra nước chanh ngọt thay vì nước chanh ít đường/đặc biệt phù hợp buổi tối. Chúng ta cần dặn người pha chế: "Nếu là buổi tối (`isDark = true`), hãy đổi công thức pha chế nhé!".

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Trang checkout `/checkout?fromCart=true` và trang cảm ơn `/checkout/thank-you` vẫn giữ giao diện nền trắng, chữ đen mặc dù đã bật chế độ tối ở `/system/experiences`.
- Tệp tin liên quan:
  - [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/checkout/colors.ts): Chứa hàm tạo màu `getCheckoutColors`.
  - [page.tsx (checkout)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/checkout/page.tsx): Route checkout chính, gọi `getCheckoutColors`.
  - [page.tsx (thank-you)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/checkout/thank-you/page.tsx): Route thank-you chính, gọi `getCheckoutColors`.
  - [page.tsx (checkout admin)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/checkout/page.tsx): Trang quản lý checkout trong admin.
  - [CheckoutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CheckoutPreview.tsx): Component preview của checkout trong admin.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause**: Hàm `getCheckoutColors` trong `components/site/checkout/colors.ts` không nhận tham số `isDark` và gán cứng toàn bộ màu nền/chữ/viền của checkout sang chế độ sáng. Do đó, dù trang layout chung có chuyển đổi sang dark theme, các component checkout vẫn render inline style màu sáng.
- **Độ tin cậy nguyên nhân gốc**: High (100% vì code hiển thị rõ ràng gán cứng màu sáng).

# IV. Proposal (Đề xuất)
- **Bước 1**: Cập nhật hàm `getCheckoutColors` để nhận tham số `isDark?: boolean` và định nghĩa màu sắc linh hoạt dựa trên `isDark` (sử dụng bảng màu tối tương tự như `getProductDetailColors`).
- **Bước 2**: Tại các trang `app/(site)/checkout/page.tsx` và `app/(site)/checkout/thank-you/page.tsx`, import `useSiteSettings` để lấy `siteDarkMode`. Tính toán biến `isDark` dựa trên `siteDarkMode` và truyền `isDark` vào hàm `getCheckoutColors`.
- **Bước 3**: Tại trang admin `app/system/experiences/checkout/page.tsx`, query cài đặt `site_dark_mode` từ database, tính `isDark` và truyền vào `getCheckoutColors` cũng như component `CheckoutPreview`.
- **Bước 4**: Cập nhật `CheckoutPreview` nhận prop `isDark?: boolean` và truyền vào `getCheckoutColors` nội bộ.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/checkout/colors.ts)
  - Mô tả: Chứa hàm `getCheckoutColors`.
  - Thay đổi: Thêm tham số `isDark?: boolean` và cập nhật các biến màu trung hòa `neutralSurface`, `neutralSurfaceMuted`, `neutralSurfaceSoft`, `neutralBorder`, `neutralBorderStrong`, `neutralText`, `neutralMuted`, `neutralSoft`.
- **Sửa**: [page.tsx (checkout)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/checkout/page.tsx)
  - Mô tả: Trang checkout site.
  - Thay đổi: Sử dụng `useSiteSettings` để lấy `siteDarkMode`, tính toán `isDark` và truyền vào `getCheckoutColors`.
- **Sửa**: [page.tsx (thank-you)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/checkout/thank-you/page.tsx)
  - Mô tả: Trang thank-you site.
  - Thay đổi: Sử dụng `useSiteSettings` để lấy `siteDarkMode`, tính toán `isDark` và truyền vào `getCheckoutColors`.
- **Sửa**: [page.tsx (checkout admin)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/checkout/page.tsx)
  - Mô tả: Trang checkout admin.
  - Thay đổi: Load setting `site_dark_mode`, tính `isDark` và truyền vào `getCheckoutColors` và `CheckoutPreview`.
- **Sửa**: [CheckoutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CheckoutPreview.tsx)
  - Mô tả: Component preview checkout.
  - Thay đổi: Thêm prop `isDark?: boolean` vào component và interface, truyền vào `getCheckoutColors`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `components/site/checkout/colors.ts` để cập nhật signature và mã màu của `getCheckoutColors`.
2. Chỉnh sửa `app/(site)/checkout/page.tsx` và `app/(site)/checkout/thank-you/page.tsx` để tích hợp `useSiteSettings` và truyền `isDark`.
3. Chỉnh sửa `components/experiences/previews/CheckoutPreview.tsx` để hỗ trợ prop `isDark` và truyền vào `getCheckoutColors`.
4. Chỉnh sửa `app/system/experiences/checkout/page.tsx` để lấy cài đặt `site_dark_mode`, tính toán `isDark` và truyền đi.
5. Chạy kiểm tra TypeScript `bunx tsc --noEmit` để đảm bảo không lỗi type.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy lệnh kiểm tra TypeScript: `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để verify các file sửa đổi không lỗi kiểu dữ liệu.
- Kiểm tra thủ công (phía Client/Tester):
  - Truy cập `/system/experiences`, bật chế độ tối.
  - Truy cập `/checkout?fromCart=true` và kiểm tra xem giao diện có chuyển sang màu nền tối, chữ sáng tương ứng chưa.
  - Tạo đơn hàng thử nghiệm, xem trang `/checkout/thank-you` xem đã có giao diện tối chưa.
  - Truy cập `/system/experiences/checkout` xem phần preview của checkout đã hiển thị màu tối đồng bộ chưa.

# VIII. Todo
- [ ] Cập nhật hàm `getCheckoutColors` trong `components/site/checkout/colors.ts`
- [ ] Cập nhật trang `/checkout` tại `app/(site)/checkout/page.tsx`
- [ ] Cập nhật trang `/checkout/thank-you` tại `app/(site)/checkout/thank-you/page.tsx`
- [ ] Cập nhật component `CheckoutPreview` tại `components/experiences/previews/CheckoutPreview.tsx`
- [ ] Cập nhật trang admin `/system/experiences/checkout` tại `app/system/experiences/checkout/page.tsx`
- [ ] Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi `site_dark_mode` được cấu hình là `dark`:
  - Trang checkout và thank-you hiển thị giao diện nền tối (`#161617` hoặc tương đương), chữ sáng, các ô input và border tối màu.
  - Giao diện preview của checkout trong trang admin `/system/experiences/checkout` cũng hiển thị màu tối đồng bộ.
- Khi `site_dark_mode` được cấu hình là `light`:
  - Giao diện vẫn hiển thị màu sáng như bình thường.
- Không phát sinh lỗi compile TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: Có thể gây ra hydration mismatch nhỏ nếu `isDark` được tính toán trực tiếp từ `typeof window !== 'undefined'` trong quá trình server rendering. Tuy nhiên, các trang này đều sử dụng `'use client'`, việc tính toán này đã được áp dụng an toàn ở `ProductDetailPage.tsx`.
- Rollback: `git checkout -- <file_paths>` để hoàn tác các thay đổi.

# XI. Out of Scope (Ngoài phạm vi)
- Không refactor cấu trúc dữ liệu của checkout hay logic thanh toán, chỉ điều chỉnh màu sắc giao diện.
