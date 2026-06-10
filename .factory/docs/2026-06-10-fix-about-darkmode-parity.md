# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng chuyển trang web sang giao diện tối (Dark Mode), phần thông tin "Về chúng tôi" (About) vẫn giữ nguyên nền trắng tinh và chữ đen xì. Nguyên nhân là do các màu sắc của phần này đang bị ghi cứng (hardcode) trong mã nguồn và lớp bao ngoài (container) chưa báo cho phần About biết là giao diện tối đã được bật. Chúng ta sẽ giải quyết bằng cách:
* Báo cho phần About biết khi nào chế độ tối được bật (truyền biến `isDark`).
* Kích hoạt chế độ tối của Tailwind bằng cách thêm nhãn `dark` vào khung bao ngoài.
* Dùng một công cụ chuyển đổi màu tự động có sẵn (`adaptColorForDarkMode`) để đổi các màu nền sáng, chữ tối thành màu nền tối, chữ sáng tương ứng một cách thông minh.

## 2. Elaboration & Self-Explanation
Hệ thống hiển thị giao diện thông qua các component dùng chung. Component About của chúng ta hỗ trợ 9 kiểu bố cục (layout) khác nhau (classic, bento, minimal, split, timeline, showcase, spaCollage, solarFeature, kanban). 
Khi lập trình viên thiết kế các bố cục này, họ đã sử dụng các mã màu cố định như màu kem `#f5ecdc` cho Spa Collage, màu trắng `#ffffff` hay màu xám `#f9fafb` để tạo vẻ ngoài đẹp mắt ở chế độ sáng. Tuy nhiên, khi chuyển sang chế độ tối:
a) Tailwind CSS cần class `dark` ở thẻ cha để kích hoạt các định dạng kiểu `dark:text-white`. Trong trang xem trước (preview), container cha chưa hề có class này nên các thuộc tính tối không hoạt động.
b) Các mã màu inline style cố định (như `bg-[#fdfaf6]`) không tự động đổi theo Tailwind. Chúng ta phải can thiệp bằng cách sử dụng hàm `adaptColorForDarkMode` để tính toán lại các mã màu này dựa trên độ sáng (lightness) và sắc độ (chroma) của chúng sang hệ màu tối tương đương mà vẫn giữ được "hồn" của thiết kế gốc.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** 
  Ở bố cục Spa Collage, ta có nền kem nhạt `#f5ecdc` và chữ nâu tối `#523a2a`. Khi bật Dark Mode, nếu giữ nguyên thì sẽ rất chói mắt trên nền đen của toàn trang. Khi qua bộ lọc `adaptColorForDarkMode`:
  * Nền `#f5ecdc` (sáng) sẽ chuyển thành một tông kem tối sang trọng (khoảng `#27211a`).
  * Chữ `#523a2a` (tối) sẽ chuyển thành chữ kem sáng `#eadbc5` dễ đọc.
* **Hình ảnh ẩn dụ:** 
  Nó giống như việc bạn đeo một chiếc kính râm thông minh khi đi ngoài nắng. Chiếc kính không chỉ đơn giản là nhuộm đen mọi thứ, mà nó tự điều chỉnh sắc độ của từng khu vực: chỗ quá sáng thì làm dịu đi, chỗ tối thì làm rõ lên để bạn luôn nhìn rõ ràng và dễ chịu nhất.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Vấn đề phát hiện:**
  * File `app/admin/home-components/about/_components/AboutPreview.tsx` tính toán `isDark` từ preview panel nhưng không truyền vào `AboutSectionShared` và không gán class `dark` lên BrowserFrame container.
  * File `components/site/AboutSection.tsx` nhận `isDark` từ site thực nhưng không truyền tiếp vào `AboutSectionShared`.
  * File `app/admin/home-components/about/_components/AboutSectionShared.tsx` chứa các layout classic, bento, minimal, split, timeline, showcase, spaCollage có nhiều màu nền và màu chữ bị hardcode thông qua style hoặc class Tailwind không hỗ trợ `dark:`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Độ tin cậy nguyên nhân gốc: High (Cao)
* **Triệu chứng:** Preview và site thực của About component hiển thị sai màu ở Dark mode.
* **Nguyên nhân chính:** 
  1. Thiếu lan truyền thuộc tính `isDark` xuống component con `AboutSectionShared`.
  2. Thiếu class kích hoạt Tailwind Dark Mode (`dark`) trên container wrapper của Preview và Site thực.
  3. Nhiều màu nền/chữ được hardcode dạng tĩnh, không phụ thuộc vào trạng thái sáng/tối.
* **Giả thuyết đối chứng:** Nếu chỉ đổi class Tailwind mà không xử lý các inline style màu nền (như `#f5ecdc` hoặc `#fdfaf6`), giao diện vẫn sẽ bị lỗi hiển thị vì inline style có độ ưu tiên cao hơn class CSS thông thường. Do đó bắt buộc phải sử dụng hàm adapter màu động.

---

# IV. Proposal (Đề xuất)

1. **Cập nhật `AboutSectionSharedProps`:**
   * Thêm prop `isDark?: boolean` vào interface.
2. **Truyền `isDark` từ các wrapper:**
   * Trong `AboutPreview.tsx`, truyền `isDark={isDark}` vào `<AboutSectionShared />` và gán class `dark` cho div cha: `className={cn("w-full transition-colors duration-300", isDark && "dark")}`.
   * Trong `AboutSection.tsx`, truyền `isDark={isDark}` vào `<AboutSectionShared />` và gán class `dark` cho section wrapper: `className={cn(getSectionSpacingClassName(spacing), "px-3", isDark && "dark")}`.
3. **Áp dụng bộ chuyển đổi màu động `adaptColorForDarkMode` cho các layout trong `AboutSectionShared.tsx`:**
   * Nhập (import) `adaptColorForDarkMode` từ `@/components/site/home/utils/darkModeColorAdapter`.
   * Sử dụng hàm này để bọc các giá trị màu hardcode (nền, chữ, viền) trong các layout: `classic`, `bento`, `minimal`, `split`, `timeline`, `showcase`, `spaCollage`.
   * Tích hợp `isDark` vào Kanban layout để đồng bộ với preview và site thực: `const isDarkTheme = isDark || isDarkBg`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
1. **[AboutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutPreview.tsx)**
   * Vai trò hiện tại: Quản lý giao diện xem trước trong Admin.
   * Thay đổi: Truyền prop `isDark` cho `AboutSectionShared` và gán class `dark` động cho div wrapper chính của BrowserFrame.
2. **[AboutSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/AboutSection.tsx)**
   * Vai trò hiện tại: Render About Section ở Site thực tế.
   * Thay đổi: Gán class `dark` động cho section wrapper dựa trên prop `isDark` và truyền `isDark` cho `AboutSectionShared`.
3. **[AboutSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutSectionShared.tsx)**
   * Vai trò hiện tại: Chứa logic render 9 layout dùng chung của About.
   * Thay đổi: Thêm prop `isDark` vào interface, import và áp dụng `adaptColorForDarkMode` cho các màu hardcode, tích hợp `isDarkTheme` cho layout Kanban.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và chỉnh sửa [AboutSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutSectionShared.tsx) để hỗ trợ prop `isDark`, import helper `adaptColorForDarkMode` và cập nhật các màu sắc hardcode của từng layout.
2. Chỉnh sửa [AboutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutPreview.tsx) để truyền `isDark` và thêm class `dark` vào wrapper.
3. Chỉnh sửa [AboutSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/AboutSection.tsx) để truyền `isDark` và thêm class `dark` vào section wrapper.
4. Rà soát tĩnh xem có lỗi type hay cú pháp nào không.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tĩnh (Static check)
* Thực hiện biên dịch kiểm tra lỗi Type (TypeScript):
  `bunx tsc --noEmit`

---

# VIII. Todo

- [ ] Sửa [AboutSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutSectionShared.tsx) để tích hợp `isDark`, import `adaptColorForDarkMode` và áp dụng đổi màu động.
- [ ] Sửa [AboutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutPreview.tsx) để truyền `isDark` và gán class `dark` động.
- [ ] Sửa [AboutSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/AboutSection.tsx) để truyền `isDark` và gán class `dark` động.
- [ ] Chạy kiểm thử TypeScript toàn dự án để verify không gây lỗi compile.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Khi bật Dark mode ở Admin Preview, phần About phải thay đổi màu nền và màu chữ tương thích (nền tối, chữ sáng), không còn các block màu trắng chói lòa hoặc chữ xám khó đọc.
2. Khi xem ở Site thực, phần About cũng phải đồng bộ giao diện Dark Mode tương ứng khi dark theme được kích hoạt trên hệ thống.
3. Dự án biên dịch thành công không có bất kỳ lỗi TypeScript nào mới liên quan đến các file được chỉnh sửa.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Một số màu thương hiệu (Brand Colors) có thể bị thay đổi nếu chroma quá thấp và bị nhận nhầm thành màu trung tính.
* **Giảm thiểu:** Hàm `adaptColorForDarkMode` đã loại trừ các màu có chroma > 0.08 và giữ nguyên màu thương hiệu chính (`tokens.primary` và `tokens.secondary`). Do đó rủi ro này là rất thấp.
* **Hoàn tác:** Khôi phục các file về phiên bản trước bằng Git.

---

# XI. Out of Scope (Ngoài phạm vi)
* Sửa đổi các component Home Components khác ngoài component `About`.
* Thay đổi cấu trúc dữ liệu hoặc schema database của component About.
