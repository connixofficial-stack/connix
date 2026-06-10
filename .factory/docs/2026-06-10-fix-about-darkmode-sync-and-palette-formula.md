# I. Primer

## 1. TL;DR kiểu Feynman
* **Lỗi đồng bộ:** Khi bạn thay đổi chế độ sáng/tối của trang quản trị (Admin), khung xem trước (Preview) không thay đổi theo vì biến trạng thái tối (`isDark`) được gọi sai vị trí (gọi ở component cha thay vì component con nằm trong bộ cung cấp Context). Chúng ta sẽ tách phần nội dung Preview thành component con để nó nhận đúng trạng thái tối.
* **Lỗi phối màu:** Màu sắc khi chuyển sang chế độ tối trông rất tệ hoặc bị giữ nguyên nền trắng chói lòa vì công thức cũ bỏ sót các màu có sắc độ nhạt (như màu kem, màu vàng ấm) và chỉ đổi màu xám/trắng trung tính.
* **Giải pháp phối màu mới:** Áp dụng công thức toán học dựa trên hệ màu OKLCH (Chuẩn CSS mới):
  * **Nền sáng** khi sang tối sẽ hạ độ sáng cảm nhận xuống thấp (`0.12 - 0.18`), giảm sắc độ để không bị sặc sỡ nhưng giữ nguyên tông màu ấm/lạnh gốc.
  * **Chữ tối** khi sang tối sẽ tăng độ sáng lên cao (`0.85 - 0.94`), giúp tương phản tốt và dễ đọc.
  * Giữ nguyên các nút nhấn màu thương hiệu chính để đảm bảo tính nổi bật.

## 2. Elaboration & Self-Explanation
Hệ thống hiện tại có hai lỗi nghiêm trọng:
a) **Lỗi Context của Preview:** Component `AboutPreview` gọi hook `usePreviewDark` của `PreviewWrapper` ngay trong chính cơ thể của nó. Tuy nhiên, `PreviewWrapper` mới là nơi chứa `PreviewDarkContext.Provider`. Theo quy tắc React, component cha không thể nhận được giá trị context từ component con của nó. Do đó, `isDark` ở `AboutPreview` luôn nhận giá trị mặc định là `false`. Điều này làm phần preview bị "kẹt" ở chế độ sáng vĩnh viễn dù người dùng có bấm nút Moon/Sun hay đổi giao diện admin.
b) **Lỗi Công thức Màu sắc (Dark Mode Palette):** Hàm `adaptColorForDarkMode` cũ phân loại màu dựa trên ngưỡng sắc độ cứng (`chromaThreshold = 0.08`). Các màu nền cổ điển (như màu kem `#f5ecdc` của Spa Collage, màu `#fdfaf6` của Minimal) có sắc độ nhỏ hơn `0.08` nên bị biến thành màu xám tối trung tính mất đi sắc thái ấm áp ban đầu. Ngược lại, các màu có sắc độ lớn hơn hoặc bằng `0.08` thì lại không được xử lý đổi màu nền, dẫn đến việc chúng giữ nguyên màu sáng chói lóa trong Dark Mode.
Chúng ta sẽ viết lại cơ chế này bằng cách tính toán chuyển đổi tuyến tính trên không gian màu OKLCH: ánh xạ động độ sáng của màu nền từ dải sáng sang dải tối, và màu chữ từ dải tối sang dải sáng, đồng thời giảm nhẹ sắc độ (Chroma) nhưng giữ nguyên góc màu (Hue) để bảo tồn tông ấm/lạnh nguyên bản của thiết kế gốc.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:**
  * **Trước khi sửa:** Nền kem Spa Collage `#f5ecdc` (sắc độ nhẹ) khi chuyển sang Dark mode vẫn giữ nguyên màu kem sáng, tạo ra một khối màu trắng chói mắt giữa nền đen của trang web. Hoặc bị đổi thành màu xám đen xì trung tính vô hồn.
  * **Sau khi sửa:** Nền `#f5ecdc` được phân tích oklch (`L=0.94, C=0.018, H=82`). Công thức sẽ hạ `L` xuống `0.12` và giữ lại một chút sắc độ vàng ấm `C=0.006`. Kết quả cho ra màu xám đen ấm áp `#1c1a17` cực kỳ hòa hợp và cao cấp, mang đúng phong cách giao diện tối của Apple.
* **Hình ảnh ẩn dụ:**
  Nó giống như việc bạn mang một bức tranh phong cảnh ban ngày đi chụp qua một kính lọc chụp đêm chuyên nghiệp. Bức tranh không bị biến thành trắng đen vô hồn, mà các khoảng trời xanh sáng sẽ thành xanh đêm thẳm, đồng cỏ vàng nắng sẽ thành vàng sẫm dưới trăng. Tất cả các sắc thái màu sắc đều được bảo toàn nhưng ở một tông độ dịu mắt hơn.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Vấn đề phát hiện:**
  * `AboutPreview.tsx` gọi `usePreviewDark` ở cấp cha của `PreviewWrapper`, dẫn đến context luôn trả về mặc định `isDark = false`.
  * `darkModeColorAdapter.ts` có công thức đổi màu cứng nhắc, bỏ qua các màu nền có chroma >= 0.08 và làm mất đi sắc độ ấm/lạnh của các màu nền có chroma < 0.08.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Độ tin cậy nguyên nhân gốc: High (Cao)
* **Triệu chứng:** Preview About component luôn hiển thị nền sáng dù admin ở dark mode hoặc đã bật nút toggle Moon/Sun. Phối màu dark mode của các layout có sắc độ trông không tự nhiên hoặc bị lỗi giữ nguyên màu sáng.
* **Nguyên nhân chính:** 
  1. Vi phạm quy tắc phân cấp Context của React.
  2. Thuật toán chuyển đổi màu OKLCH trong `darkModeColorAdapter.ts` không bao quát hết các trường hợp màu sắc và thiếu công thức ánh xạ động.
* **Giả thuyết đối chứng:** Nếu tách nội dung preview thành component con và áp dụng thuật toán ánh xạ OKLCH động, preview sẽ đổi màu ngay lập tức khi toggle và các màu nền ấm/lạnh sẽ chuyển sang các tông tối tương ứng một cách tự nhiên.

---

# IV. Proposal (Đề xuất)

1. **Sửa lỗi đồng bộ Context ở Preview:**
   * Tạo component con `AboutPreviewContent` bên trong [AboutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutPreview.tsx) chứa toàn bộ phần render từ `BrowserFrame` trở xuống.
   * Gọi `usePreviewDark()` bên trong `AboutPreviewContent` để lấy đúng context.
2. **Cập nhật thuật toán phối màu Dark Mode trong [darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts):**
   * Định nghĩa lại hàm `adaptColorForDarkMode` dựa trên công thức toán học OKLCH:
     * **Màu nền (`isBackgroundKey`):** Nếu `L >= 0.45` (nền sáng), ánh xạ sang nền tối `newL = 0.12 + (1 - L) * 0.06` và giảm sắc độ `newC = Math.min(C * 0.35, 0.015)`. Nếu nền tối sẵn thì giữ nguyên.
     * **Màu chữ/viền:** Nếu `L < 0.45` (chữ tối), ánh xạ sang chữ sáng `newL = 0.88 + (0.45 - L) * 0.12` và giảm sắc độ `newC = Math.min(C * 0.5, 0.01)`. Nếu là màu accent sáng (`C >= 0.06`), tăng nhẹ độ sáng lên `L = 0.65` để đảm bảo tương phản.
     * Giữ nguyên góc màu `H` để bảo toàn tông ấm/lạnh của màu gốc.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
1. **[AboutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutPreview.tsx)**
   * Vai trò hiện tại: Quản lý xem trước About component.
   * Thay đổi: Tách phần hiển thị Browser Frame thành component con `AboutPreviewContent` để nhận đúng context `isDark`.
2. **[darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts)**
   * Vai trò hiện tại: Chuyển đổi màu sắc sang chế độ tối.
   * Thay đổi: Cải tiến thuật toán chuyển đổi màu OKLCH động, bảo toàn sắc độ ấm/lạnh theo chuẩn Apple/macOS.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa [darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts) với công thức phối màu OKLCH mới.
2. Sửa [AboutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutPreview.tsx) tách component con `AboutPreviewContent`.
3. Chạy `bunx tsc --noEmit` để verify.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tĩnh (Static check)
* Thực hiện biên dịch kiểm tra lỗi Type (TypeScript):
  `bunx tsc --noEmit`

---

# VIII. Todo

- [ ] Sửa thuật toán đổi màu oklch trong [darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts)
- [ ] Tách component con `AboutPreviewContent` trong [AboutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutPreview.tsx)
- [ ] Chạy `bunx tsc --noEmit` để kiểm tra lỗi TypeScript toàn dự án.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Khi bật Dark mode ở Admin (hoặc click nút Sun/Moon trên preview), Preview About component phải thay đổi giao diện tối ngay lập tức.
2. Các màu kem ấm dải sáng khi sang Dark Mode phải biến thành màu xám tối ấm áp dễ chịu, không bị biến thành xám trung tính lạnh lẽo hoặc bị giữ nguyên màu trắng sáng chói.
3. Không có lỗi TypeScript biên dịch.
