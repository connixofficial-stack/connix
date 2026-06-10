# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng chọn màu nền Header là "màu trắng" (White/Surface) trong cài đặt, ở chế độ sáng (Light Mode) nó sẽ là màu trắng tinh khôi. Tuy nhiên, khi chuyển sang chế độ tối (Dark Mode), nếu ta vẫn giữ màu trắng đó thì trông rất chói mắt và kỳ quặc trên nền tối của trang web. 

Để giải quyết, ta sẽ tạo một cơ chế "thích ứng thông minh": Khi trang web đổi sang Dark Mode, màu "trắng" mặc định của Header sẽ tự động biến thành màu tối (Slate 900) và chữ sẽ tự đổi sang màu sáng (Slate 50). Các màu thương hiệu (Primary/Secondary) sẽ được giữ nguyên tông màu nhưng chữ của chúng vẫn được tính toán độ tương phản (APCA contrast) để đảm bảo luôn đọc được.

## 2. Elaboration & Self-Explanation
Hiện tại, màu sắc của Header được tính toán tĩnh thông qua hàm `getMenuColors` trong file `colors.ts` với các biến màu sắc trung hòa (neutral) cố định theo Light Mode (nền trắng `#ffffff`, chữ đen `#0f172a`, border `#e2e8f0`). 

Giải pháp là nâng cấp hàm `getMenuColors` nhận thêm tham số `isDark`. Nếu `isDark = true`, chúng ta sẽ cấu hình các biến trung hòa này theo bảng màu Dark Mode chuẩn (nền tối `#0f172a`, chữ sáng `#f8fafc`, border tối `#1e293b`). Đồng thời, các khung bao logo (logo background frame style như shadow, outline, inset) vốn sử dụng màu nền trắng đè cứng sẽ được chuyển đổi sang màu bán trong suốt tối hoặc màu nền tối tương ứng khi ở Dark Mode để tránh bị lộ khung màu trắng.

## 3. Concrete Examples & Analogies
- *Ví dụ tương tự:* Giống như đèn màn hình điện thoại tự động chuyển từ "nền trắng chữ đen" (Light mode) sang "nền tối chữ trắng" (Dark mode) khi trời tối để bảo vệ mắt của bạn. 
- *Ví dụ thực tế:* Nếu navbar được cấu hình màu là "white", ở Light Mode nó sẽ render `bg-[#ffffff] text-[#0f172a]`. Ở Dark Mode, nó tự động đổi thành `bg-[#0f172a] text-[#f8fafc]` mà người dùng không cần phải vào trang quản trị để thiết lập lại một bảng màu thứ hai dành riêng cho Dark Mode.

# II. Audit Summary (Tóm tắt kiểm tra)
- File `components/site/header/colors.ts` định nghĩa bảng màu tĩnh cho menu layer nhưng chưa nhận biết dark mode.
- File `components/site/Header.tsx` khởi tạo token màu bằng `getMenuColors` nhưng chưa truyền trạng thái `isDark` từ hook `useSiteSettings()`.
- File `components/experiences/previews/HeaderMenuPreview.tsx` hiển thị preview trong admin cũng chưa nhận biết trạng thái theme để hiển thị phối màu tối tương ứng.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Cơ chế sinh bảng màu menu `getMenuColors` đang là một hàm thuần túy tĩnh, không nhận biết trạng thái Dark Mode của hệ thống.
- **Giả thuyết đối chứng**: Việc yêu cầu người dùng thiết lập thêm bộ cấu hình màu riêng cho Dark Mode sẽ làm phức tạp hóa UI cấu hình và tăng debt dữ liệu (DB schema phải thêm trường mới). Cơ chế tự động ánh xạ màu mặc định ('white') sang màu tối của hệ thống là giải pháp tối ưu nhất, giữ UI cấu hình đơn giản (KISS) và bảo toàn tính tương thích.

# IV. Proposal (Đề xuất)
- Cập nhật signature của `getMenuColors` trong `colors.ts` để hỗ trợ `isDark?: boolean`.
- Ánh xạ các giá trị màu neutral sang Dark Mode tương ứng khi `isDark === true`.
- Cập nhật `Header.tsx` để lấy `isDark` từ `useSiteSettings()` và truyền vào `getMenuColors`.
- Cập nhật `HeaderMenuPreview.tsx` để tự động phát hiện class `.dark` trên document root thông qua một MutationObserver và truyền giá trị này vào preview render.
- Điều chỉnh các style của `logoBackgroundStyles` trong cả hai file render để tương thích trực quan với Dark Mode.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**:
  - `components/site/header/colors.ts` (Thêm logic dark mode vào hàm resolve màu sắc).
  - `components/site/Header.tsx` (Truyền trạng thái dark mode thực tế vào hàm resolve màu sắc & cập nhật logo frame style).
  - `components/experiences/previews/HeaderMenuPreview.tsx` (Thêm listener theme state và truyền vào resolve màu sắc preview & cập nhật logo frame style).

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `components/site/header/colors.ts` để hỗ trợ tham số `isDark`.
2. Chỉnh sửa `components/site/Header.tsx` để truyền `siteSettings.isDark`.
3. Chỉnh sửa `components/experiences/previews/HeaderMenuPreview.tsx` để tích hợp MutationObserver phát hiện theme.
4. Chạy `tsc --noEmit` và `oxlint` để xác minh code biên dịch sạch.
5. Kiểm nghiệm local dev server.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Typecheck**: `bunx tsc --noEmit` thành công.
- **Lint check**: `bunx oxlint --type-aware --type-check` exit 0.
- **Kiểm tra trực quan**:
  - Truy cập preview `/system/experiences/menu`, bấm chuyển đổi light/dark mode của hệ thống quản trị, preview của Header phải tự động cập nhật màu nền sang tối (đối với phần chọn màu "white") và màu chữ sang sáng.
  - Trên trang web thực, bật/tắt dark mode, header phải chuyển đổi trơn tru và đảm bảo chữ luôn đọc được.

# VIII. Todo
- [ ] 1. Sửa file `components/site/header/colors.ts` hỗ trợ tham số `isDark`
- [ ] 2. Sửa file `components/site/Header.tsx` truyền trạng thái `siteSettings.isDark`
- [ ] 3. Sửa file `components/experiences/previews/HeaderMenuPreview.tsx` tự động nhận biết class `.dark` và truyền vào render
- [ ] 4. Sửa các style logoBackgroundStyles trong cả hai file render cho khớp Dark Mode
- [ ] 5. Chạy tsc và oxlint kiểm tra chất lượng code
