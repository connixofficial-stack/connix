# Đặc tả kỹ thuật: Đồng bộ Dark Mode và Nhất quán hóa màu nền cho toàn bộ Home Components

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi bạn đổi giao diện sáng/tối (Dark/Light Mode) ở trang quản trị Admin (`/admin`), các ô xem trước (Preview) của các phần tử trang chủ (About, Blog, FAQ...) không tự đổi màu theo. Đồng thời, một số layout vẫn bị set cứng màu nền đen hoặc trắng, gây lệch tông màu khó chịu.
* **Mục tiêu**: Làm sao để khi đổi theme ở Admin, toàn bộ khung Preview đổi màu theo ngay lập tức. Và đảm bảo tất cả các layout (cả ngoài site thực tế lẫn trong preview) đều tự động đổi nền thông minh (trong suốt/sáng ở Light Mode, tối sâu ở Dark Mode) thay vì dùng màu cố định.
* **Cách làm**:
  1. Thêm một "mắt theo dõi" tự động (`MutationObserver`) tại khung bọc preview chung (`PreviewWrapper.tsx`). Khi class của trang web chuyển sang `dark` hoặc ngược lại, nó sẽ tự báo cho các preview con bên trong đổi màu.
  2. Rà soát tất cả các file preview và runtime của các component, thay thế các class màu nền tĩnh (như `bg-slate-900` cố định) thành các class động dựa trên trạng thái `isDark`.

---

### 2. Elaboration & Self-Explanation
Hệ thống hiện tại quản lý theme của trang Admin bằng cách thêm hoặc xóa class `dark` trên thẻ `<html>` (`document.documentElement`). Tuy nhiên, các component con hiển thị Preview (như `FAQPreview`, `AboutPreview`...) không được render lại khi class của thẻ root này thay đổi, vì chúng không có liên kết state nào với nó. 

Để giải quyết điều này một cách nhất quán cho tất cả các component mà không cần sửa code wiring ở từng trang editor con, chúng ta sẽ cập nhật component dùng chung [PreviewWrapper.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/components/PreviewWrapper.tsx). Chúng ta sẽ chèn một `MutationObserver` vào component này. Observer này sẽ theo dõi thuộc tính `class` của thẻ `<html>` và cập nhật state `isDark` cục bộ của `PreviewWrapper`. Vì `PreviewWrapper` tự động clone và truyền prop `isDark` xuống cho tất cả `children` của nó, tất cả các preview component con sẽ lập tức nhận được trạng thái theme chính xác và cập nhật giao diện realtime.

Song song đó, đối với cả phần hiển thị thực tế (Runtime) và Preview của các component còn lại, ta cần sửa các class màu nền tĩnh (hardcoded background classes). Các class dạng `bg-slate-900` (luôn tối) hoặc `bg-white` (luôn sáng) sẽ được chuyển sang dạng động tùy thuộc vào biến `isDark`:
* Khi ở chế độ Sáng (`isDark === false`), sử dụng `bg-transparent` hoặc các màu sáng như `bg-white` / `bg-slate-50` để tiệp màu với nền trang.
* Khi ở chế độ Tối (`isDark === true`), sử dụng màu tối phù hợp như `bg-slate-950` hoặc `bg-slate-900`.

---

### 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: 
  Trong file render preview dùng chung cho các component legacy [previews.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/legacy/previews.tsx), có phần hiển thị Video Section Preview ở dòng 5804 đang hardcode class:
  ```tsx
  <section className={cn("py-12 px-4 bg-slate-900", ...)}>
  ```
  Nếu trang admin đang ở Light Mode, khối video này vẫn có một dải nền đen ngòm (`bg-slate-900`). Chúng ta sẽ chuyển nó thành:
  ```tsx
  <section className={cn("py-12 px-4", isDark ? "bg-slate-950" : "bg-transparent", ...)}>
  ```
  Lúc này, ở chế độ Sáng nó sẽ trong suốt và hòa hợp với nền xám nhạt của khung preview, còn ở chế độ Tối nó sẽ có màu tối sâu đồng bộ.

* **Hình ảnh ẩn dụ (Analogy)**:
  Hãy tưởng tượng căn phòng Preview giống như một căn phòng kính triển lãm đặt trong một tòa nhà lớn. Tòa nhà lớn chính là trang Admin, có thể bật đèn (Light Mode) hoặc tắt đèn (Dark Mode). Trước đây, căn phòng kính này tự trang bị hệ thống rèm màu đen cố định và không quan tâm bên ngoài tòa nhà đang sáng hay tối. Giải pháp của chúng ta là lắp một cảm biến ánh sáng ở cửa phòng kính (MutationObserver) để tự động cuốn rèm lên khi tòa nhà bật đèn sáng, và buông rèm tối xuống khi tòa nhà tắt đèn, tạo nên sự nhất quán hoàn hảo.

---

## II. Audit Summary (Tóm tắt kiểm tra)
* **Khung Preview chung**: Component [PreviewWrapper.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/components/PreviewWrapper.tsx) chịu trách nhiệm bọc ngoài toàn bộ các preview nhưng chưa tự động đồng bộ state `isDark` với class `dark` của hệ thống Admin.
* **Các component Preview con**: 25+ preview components dưới thư mục `app/admin/home-components/` và file render legacy [previews.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/legacy/previews.tsx) có một số layout vẫn chứa class nền tĩnh `bg-slate-900` hoặc `bg-white` không phụ thuộc vào `isDark`.
* **Các component Runtime thực tế**: Một số component dưới `components/site/` hoặc `components/site/home/sections/` cũng gặp tình trạng tương tự khi hiển thị ở site thực.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc (Root Cause)**: Thiết kế ban đầu của các layout chỉ tập trung vào một chế độ hiển thị mặc định hoặc thiết lập màu nền cố định (như mặc định Hero, Video, FAQ là nền tối để tạo điểm nhấn). Khi hệ thống nâng cấp bổ sung tính năng Dark Mode toàn diện cho site thực tế và trang quản trị, các class tĩnh này chưa được chuyển đổi sang dạng động tương thích và thiếu cơ chế truyền/đồng bộ trạng thái theme realtime trong trang Admin.
* **Giả thuyết đối chứng (Counter-Hypothesis)**: Liệu có thể dùng CSS thuần (`dark:bg-slate-950`) thay vì dùng biến `isDark` trong Javascript? 
  * *Trả lời*: Không tối ưu hoàn toàn cho phần Preview. Vì trong trang Preview Admin, khung preview (`PreviewWrapper`) được bọc trong một container thu nhỏ có thể giả lập chiều rộng (mobile, tablet, desktop). Nếu dùng class `dark` thuần của Tailwind, class này đọc trực tiếp từ class `dark` của thẻ `<html>`. Tuy nhiên, trong một số trường hợp admin muốn xem thử chéo (ví dụ: Trang admin đang sáng nhưng muốn bật xem thử preview tối bằng nút toggle riêng trên PreviewWrapper), việc dùng class CSS thuần sẽ bị bó buộc theo theme hệ thống. Do đó, việc truyền biến `isDark` thông qua prop để Javascript tính toán token màu (`adaptTokensForDarkMode`) và gán class động là phương án linh hoạt và chính xác nhất.

---

## IV. Proposal (Đề xuất)

### 1. Centralized Theme Observation tại PreviewWrapper
Cập nhật [PreviewWrapper.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/components/PreviewWrapper.tsx) để tự động lắng nghe class `dark` trên thẻ `<html>` bằng `MutationObserver`. Khi class này thay đổi, cập nhật state `isDark` của PreviewWrapper. State này sẽ tự động được truyền xuống component Preview con thông qua hàm clone child sẵn có ở dòng 113.

### 2. Nhất quán hóa các class nền tĩnh
Quét và thay thế các class background tĩnh trong các file Preview và Runtime sang class động sử dụng biến `isDark` (hoặc `isDarkState`):
* `bg-slate-900` cố định -> `isDark ? "bg-slate-950" : "bg-transparent"` (hoặc màu sáng tương ứng).
* `bg-white` cố định (ở các layout chói mắt như builderCoffee ở Dark mode) -> `isDark ? "bg-slate-950" : "bg-white"`.

---

## V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Shared Components
* **Sửa**: [PreviewWrapper.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/components/PreviewWrapper.tsx) — Vai trò: Khung bọc preview chung ở admin. Thay đổi: Thêm `MutationObserver` để đồng bộ theme hệ thống realtime vào state `isDark`.
* **Sửa**: [previews.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/legacy/previews.tsx) — Vai trò: File render preview cho các component dạng legacy. Thay đổi: Thay các class nền tối tĩnh (như ở Video Preview dòng 5804) thành động dựa trên `isDark`.

### Site Client Runtime Components
* **Sửa**: [HomepageCategoryHeroSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/HomepageCategoryHeroSection.tsx) — Vai trò: Hiển thị Hero danh mục sản phẩm. Thay đổi: Cập nhật background thích ứng Dark Mode.
* **Sửa**: [VideoSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/VideoSection.tsx) — Vai trò: Hiển thị section video trên site thực. Thay đổi: Chuyển class background tĩnh thành động theo `isDark`.

---

## VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Đọc và cập nhật [PreviewWrapper.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/components/PreviewWrapper.tsx) để tích hợp `MutationObserver`.
2. **Bước 2**: Tìm kiếm các class background tĩnh cần sửa đổi trong [previews.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/legacy/previews.tsx) và các files runtime liên quan.
3. **Bước 3**: Cập nhật logic background động cho các file này.
4. **Bước 4**: Chạy công cụ kiểm tra tĩnh (TypeScript, Oxlint) thông qua quy trình Commit của dự án để đảm bảo không phát sinh lỗi cú pháp hay kiểu dữ liệu.

---

## VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy biên dịch TypeScript để kiểm tra kiểu dữ liệu:
  `bunx tsc --noEmit` (được chạy tự động qua Harness Engine pre-commit hook).

### Manual Verification
1. Truy cập trang chỉnh sửa Hero, FAQ hoặc Video ở trang quản trị `/admin`.
2. Bấm nút Toggle Dark Mode ở Header của trang admin.
3. Kiểm tra xem nền và màu sắc của khung Preview có tự động thay đổi mượt mà theo theme của admin hay không.

---

## VIII. Todo
* [ ] Cập nhật [PreviewWrapper.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/components/PreviewWrapper.tsx) với `MutationObserver`.
* [ ] Rà soát và cập nhật màu nền động trong [previews.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/legacy/previews.tsx).
* [ ] Cập nhật các runtime section còn lại nếu có background cứng (như `VideoSection.tsx`).

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
* **Đồng bộ theme**: Khi click nút toggle theme trên Header Admin, phần Preview của tất cả các home-components lập tức đổi theme tương ứng realtime.
* **Không đá màu nền**: Không còn tình trạng dải nền đen ngòm của Hero hay Video hiện giữa trang khi admin/user đang ở Light Mode, hoặc nền trắng chói hiện khi đang ở Dark Mode.
* **Compile OK**: Dự án build thành công không lỗi type.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: MutationObserver có thể gây rò rỉ bộ nhớ nếu không được ngắt kết nối (`disconnect`) đúng cách khi component unmount.
* **Giải pháp**: Đảm bảo hàm cleanup trong `useEffect` luôn gọi `observer.disconnect()`.
* **Rollback**: Sử dụng `git checkout` hoặc `git restore` để khôi phục trạng thái file trước khi sửa đổi nếu phát sinh lỗi nghiêm trọng.

---

## XI. Out of Scope (Ngoài phạm vi)
* Việc thay đổi cấu trúc dữ liệu hoặc schema Convex cho các component khác (chỉ thay đổi logic CSS và hiển thị class ở client/preview).

---

## XII. Open Questions (Câu hỏi mở)
* Hiện tại các thay đổi này đã bao phủ hầu hết các component. Nếu người dùng tạo thêm các component custom mới trong tương lai, họ cần tuân thủ quy tắc sử dụng `isDark` nhận từ `HomeComponentRenderer` để quyết định background. Cần bổ sung tài liệu hướng dẫn phát triển cho lập trình viên.
