# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Người dùng muốn toàn bộ 24+ Home Components (Blog, Benefits, Hero, v.v.) hiển thị đúng chế độ Dark Mode trên mọi layout, đồng thời có nút bật/tắt chế độ tối (Light/Dark) ngay trên Header của trang quản lý Menu (`/system/experiences/menu`).
* **Giải pháp**: 
  1. Thêm nút bật/tắt chế độ tối (Moon/Sun icon) ở Header trang `/system/experiences/menu`, lưu trạng thái vào bảng `settings` thông qua Convex mutation `api.settings.setMultiple`.
  2. Tại `HomeComponentRenderer.tsx`, đọc chế độ màu của site bằng `useSiteSettings()` để tính toán biến `isDark` động.
  3. Để tránh sửa đổi thủ công logic sinh màu phức tạp của 31 tệp `colors.ts`, ta xây dựng bộ biến đổi màu đệ quy (Color Adapter) bằng thư viện `culori` (sử dụng không gian màu `oklch`). Bộ adapter này sẽ tự động chuyển đổi các màu trung tính (trắng, đen, xám) sang màu tối/sáng tương ứng khi `isDark === true` mà vẫn giữ nguyên màu sắc thương hiệu (Brand Colors).
  4. Truyền prop `isDark` xuống và bọc `tokens` của các runtime components qua bộ adapter này.

## 2. Elaboration & Self-Explanation
Các Home Components của chúng ta được cấu trúc rất chặt chẽ: màu sắc hiển thị được tính toán động ở phía client thông qua các hàm JS như `getBlogColorTokens` và áp dụng trực tiếp dưới dạng inline style (ví dụ `style={{ backgroundColor: tokens.sectionBg }}`). Điều này khiến cho việc dùng class `dark` thuần túy của Tailwind không thể ghi đè màu nền vì inline style có độ ưu tiên cao nhất.
Để giải quyết triệt để và an toàn:
* Chúng ta xây dựng một hàm trung tâm `adaptTokensForDarkMode(tokens, isDark)` để hậu xử lý các token màu.
* Khi `isDark` là `true`, hàm này sẽ đệ quy quét qua các thuộc tính của `tokens`. Với mỗi mã màu Hex/RGB, nó sử dụng thư viện `culori` chuyển sang hệ màu `oklch`.
* Nếu Chroma $C < 0.04$ (màu trung tính như trắng/xám/đen), ta đảo ngược độ sáng $L$ để màu nền sáng biến thành nền tối, chữ tối biến thành chữ sáng.
* Nếu Chroma $C \ge 0.04$ (màu brand như xanh, cam), ta giữ nguyên tông màu sắc nhưng tăng nhẹ độ sáng nếu màu brand đó quá tối, đảm bảo độ tương phản APCA trên nền tối.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  * Component Blog có `tokens.cardBg = '#ffffff'` (trắng) và `tokens.bodyText = '#0f172a'` (đen).
  * Khi `isDark === true`:
    * `#ffffff` ($L = 1.0, C = 0$) đi qua adapter $\rightarrow$ Chuyển thành màu tối sang trọng `#18181b` ($L \approx 0.15$).
    * `#0f172a` ($L \approx 0.1, C \approx 0.01$) đi qua adapter $\rightarrow$ Chuyển thành màu chữ sáng rõ `#f4f4f5` ($L \approx 0.95$).
    * Màu brand `#3b82f6` ($C \approx 0.15$) $\rightarrow$ Giữ nguyên màu xanh dương để tôn trọng nhận diện thương hiệu.
* **Hình ảnh tương tự**: Giống như việc bạn đeo một chiếc kính lọc phân cực hồng ngoại thông minh. Nó không nhuộm đen tất cả mọi thứ (làm mất màu logo), mà chỉ tự động biến những mảng tường trắng thành tối, đổi mực đen thành mực phản quang phát sáng, còn đèn neon màu đỏ của thương hiệu thì vẫn giữ nguyên màu đỏ rực rỡ của nó.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* Trạng thái thiết lập Dark Mode của Site được lưu trong Convex DB bảng `settings` với `key: "site_dark_mode"` và các giá trị: `'light' | 'dark' | 'system'`.
* Hook client `useSiteSettings` trong `components/site/hooks.ts` đã hỗ trợ đọc cấu hình này qua `siteDarkMode`.
* Trang `/system/experiences/menu` hiển thị thanh Header chứa nút Lưu và các nút chuyển đổi thiết bị, nhưng chưa có nút Toggle Dark Mode.
* Các Home Components được render tập trung qua `HomeComponentRenderer.tsx`, nhưng chưa truyền prop `isDark` và chưa bọc adapter đổi màu.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Dự án ban đầu chưa tích hợp Dark Mode đồng bộ cho hệ thống Home Components động (vốn sử dụng bộ sinh màu JS inline styles). Việc thiếu nút Toggle tại Header trang quản lý Menu khiến admin không thể test hoặc cấu hình realtime trạng thái Dark Mode của site preview.
* **Giả thuyết đối chứng**: Nếu chỉ bọc class `dark` của Tailwind ở wrapper ngoài, các inline styles màu nền `#ffffff` cứng vẫn sẽ được trình duyệt ưu tiên render, khiến giao diện bị loang lổ nửa sáng nửa tối. Vì vậy, bắt buộc phải biến đổi trực tiếp giá trị của các `tokens` màu trước khi render.

---

# IV. Proposal (Đề xuất)
* **a) Xây dựng bộ lọc màu trung tâm**:
  * Tạo tệp `components/site/home/utils/darkModeColorAdapter.ts` chứa hàm đệ quy `adaptTokensForDarkMode` sử dụng thư viện `culori`.
* **b) Tích hợp vào Header trang `/system/experiences/menu`**:
  * Import hook `useSiteSettings` hoặc sử dụng query Convex trực tiếp để lấy `site_dark_mode`.
  * Chèn nút bấm bật/tắt (Moon/Sun icon) cạnh nút **Lưu** ở thanh Header. Khi bấm, gọi mutation cập nhật cấu hình `site_dark_mode`.
* **c) Cập nhật `HomeComponentRenderer.tsx`**:
  * Lấy `siteDarkMode` từ hook `useSiteSettings` và tính toán trạng thái `isDark` realtime.
  * Truyền prop `isDark` xuống tất cả các `SectionComponent`.
* **d) Cập nhật các runtime components**:
  * Cập nhật các file component chính trong `components/site/` và `components/site/home/sections/` để nhận `isDark` và áp dụng `adaptTokensForDarkMode` lên các tokens màu tương ứng.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
1. **[NEW] [darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts)**: Tệp chứa hàm chuyển đổi màu trung hòa tự động dựa trên OKLCH.
2. **[MODIFY] [types.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/types.ts)**: Thêm trường `isDark?: boolean` vào interface `HomeComponentSectionProps`.
3. **[MODIFY] [HomeComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/HomeComponentRenderer.tsx)**: Lấy trạng thái `isDark` từ `useSiteSettings` và truyền xuống các runtime components.
4. **[MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/menu/page.tsx)**: Thêm nút bật/tắt Dark Mode ở Header và đồng bộ hóa qua Convex mutation.
5. **[MODIFY] 24+ Home Components**: Thêm `isDark` vào props và bọc `tokens` bằng `adaptTokensForDarkMode` trước khi truyền vào view.

---

# VI. Execution Preview (Xem trước thực thi)
1. Tạo tệp helper `darkModeColorAdapter.ts`.
2. Sửa `types.ts` để bổ sung `isDark` vào interface props.
3. Cập nhật `HomeComponentRenderer.tsx` để tính toán và truyền `isDark` xuống các components, đồng thời thêm class `dark` vào div wrapper.
4. Thêm nút Toggle Dark Mode vào Header trang `/system/experiences/menu/page.tsx`.
5. Chạy cập nhật đệ quy cho các Home Components để bọc `tokens` qua adapter.
6. Chạy biên dịch TypeScript để kiểm tra tính toàn vẹn kiểu dữ liệu.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tự động**:
  * Chạy `bunx tsc --noEmit` để đảm bảo dự án không gặp lỗi TypeScript.
* **Kiểm tra thủ công**:
  * Truy cập `/system/experiences/menu`, nhấn nút Toggle Dark Mode trên Header.
  * Quan sát xem giao diện Preview của Header và các Home Components có chuyển đổi màu nền sang tối (nền tối, chữ sáng, giữ nguyên màu brand) đồng bộ hay không.

---

# VIII. Todo
- [ ] Tạo file [darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts)
- [ ] Cập nhật `isDark` trong [types.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/types.ts)
- [ ] Cập nhật [HomeComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/HomeComponentRenderer.tsx)
- [ ] Tích hợp nút Toggle Dark Mode vào Header trang [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/menu/page.tsx)
- [ ] Áp dụng adapter lên 24+ Home Components
- [ ] Chạy kiểm thử TypeScript và phát âm thanh hoàn thành

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Nút Toggle hiển thị đẹp mắt, trực quan (Moon/Sun icon) ở Header trang Menu.
* Khi bật Dark Mode, toàn bộ các Home Components trên mọi layout đổi sang giao diện tối đồng bộ, chữ hiển thị rõ nét, không bị loang lổ nền trắng.
* Dự án biên dịch TypeScript thành công không có lỗi type.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Việc tính toán màu sắc trên JS có thể làm giảm hiệu năng nhẹ nếu đệ quy quá sâu.
* **Giảm thiểu**: Cache kết quả biến đổi tokens hoặc chỉ chạy đệ quy phẳng 1-2 cấp độ đối với cấu trúc tokens phẳng của home components.
* **Hoàn tác**: Sử dụng `git checkout` để hoàn tác các file bị sửa đổi nếu phát hiện lỗi logic nghiêm trọng.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thiết kế lại giao diện admin tổng thể của trang Menu.
* Sửa đổi cấu hình màu sắc trong database của các thành phần khác ngoài Home Components.
