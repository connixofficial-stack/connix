# I. Primer

## 1. TL;DR kiểu Feynman
* Khi bạn đổi màu nền trang chủ thành màu đen, phần giới thiệu "Về chúng tôi" (about) hiện tại vẫn hiện lên là một khối hộp màu trắng khổng lồ. Nó trông thô như một tờ giấy trắng dán đè lên một bức tường đen vậy.
* Chúng tôi sẽ tạo ra một kiểu hiển thị mới tên là **'kanban'** (tối giản, gọn gàng, tinh tế).
* Kiểu hiển thị này rất thông minh: Nếu trang chủ có nền màu đen, nó sẽ tự dùng nền tối/trong suốt, chữ sáng màu và viền mỏng để hòa quyện hoàn hảo vào màn đêm. Nếu trang chủ có nền màu trắng, nó lại tự chuyển thành nền sáng chữ tối để dễ đọc.
* Ở màn hình chỉnh sửa Admin, màu nền cũng sẽ đổi giống hệt trang chủ để bạn dễ dàng căn chỉnh và nhìn thấy giao diện thật.

## 2. Elaboration & Self-Explanation
Component `About` hiện có các style (`classic`, `bento`, `minimal`, v.v.) được lập trình cứng (hardcoded) với màu nền sáng (ví dụ: `#f5ecdc` hoặc `#f9fafb`) và chữ tối. Khi nền trang chủ được thiết lập là màu đen, các style này hiển thị dưới dạng các khối hộp trắng tương phản mạnh, phá vỡ tính đồng bộ và thẩm mỹ của trang web.

Để giải quyết vấn đề này theo phong cách thiết kế **"Calm Productivity UI" / "Ultra-Minimal Dense"** trong tài liệu `home_component_design_prompt.md`, chúng tôi đề xuất bổ sung style `'kanban'`:
* **Mật độ thông tin cao (Dense):** Sử dụng cấu trúc grid 2 cột cân đối, khoảng cách nhỏ (`gap-6`), padding gọn gàng.
* **Tối giản (Zero noise):** Bo góc nhỏ (`rounded-sm` - 2px), không dùng shadow lớn.
* **Tự thích ứng màu nền (Background-adaptive):** Đọc cấu hình màu nền hệ thống bằng query `api.homeComponentSystemConfig.getConfig`.
  * Nếu nền trang chủ là đen/tối: card sử dụng nền tối mờ (`bg-zinc-900/65` hoặc `rgba(9, 9, 11, 0.3)`), viền tối (`border-zinc-800`), chữ sáng màu (`text-zinc-100`/`text-zinc-400`).
  * Nếu nền trang chủ là sáng: card sử dụng nền sáng (`bg-white` hoặc `rgba(244, 244, 245, 0.4)`), viền sáng (`border-zinc-200`), chữ tối màu (`text-zinc-900`/`text-zinc-600`).
* **Hiệu ứng hover tinh tế (Reveal on hover):** Các chi tiết phụ như icon mũi tên hoặc đường link xem chi tiết chỉ xuất hiện rõ nét khi di chuột vào card (`group-hover:opacity-100`).

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Khi style `kanban` được áp dụng trên nền trang chủ màu đen (`#000000`):
  * Khối giới thiệu sẽ hiển thị dưới dạng một hộp chữ nhật tối màu mịn (`bg-zinc-900/40`), có viền siêu mỏng `border-zinc-800`.
  * Dòng chữ tiêu đề chính có màu trắng ấm (`text-zinc-100`), phần mô tả chi tiết có màu xám dịu (`text-zinc-400`).
  * Các đặc điểm nổi bật (features) hiển thị dưới dạng danh sách, mỗi dòng có icon nhỏ (`w-4 h-4`) màu phụ (secondary color) và dòng chữ in đậm bên cạnh.
  * Nút "Xem chi tiết" (CTA) có dạng hình chữ nhật bo góc nhỏ `rounded-sm` với nền xám tối và chữ sáng màu, không bóng bẩy rực rỡ, tiệp vào nền chung.
* **Analogy đời thường:** Hãy tưởng tượng bạn đang xem một bộ phim trong rạp chiếu tối thui. Nếu có một người bật đèn flash điện thoại sáng trưng ngay trước mặt bạn, bạn sẽ cảm thấy rất chói và khó chịu. Tương tự, các khối component nền trắng trên trang chủ nền đen giống như đèn flash gây chói mắt. Style `kanban` hoạt động giống như việc giảm độ sáng và chuyển giao diện sang chế độ rạp chiếu phim (dark mode) giúp mắt bạn dễ chịu và trải nghiệm xem phim (lướt web) được liền mạch.

# II. Audit Summary (Tóm tắt kiểm tra)

* Lớp hiển thị của component about được định nghĩa ở `AboutSectionShared.tsx` và gọi bởi `AboutSection.tsx` (ngoài site thực tế) và `AboutPreview.tsx` (trong admin).
* Các style của about hiện tại (`classic`, `bento`, `minimal`, v.v.) đều sử dụng màu nền tĩnh và màu chữ tối cố định.
* Query `api.homeComponentSystemConfig.getConfig` đã có sẵn trong dự án để truy vấn cấu hình màu nền của trang chủ.
* Preview của admin hiện tại ở `AboutPreview.tsx` chưa nhận diện màu nền trang chủ, khiến preview luôn hiển thị trên nền trắng mặc định của `BrowserFrame`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Trả lời các câu hỏi bắt buộc:
1. **Triệu chứng quan sát được là gì (expected vs actual)?**
   * *Actual:* Khi nền trang chủ là màu đen, các khối giới thiệu vẫn có màu nền sáng cứng (ví dụ: `#f5ecdc`, `#f9fafb`), làm hỏng tính thẩm mỹ của trang web.
   * *Expected:* Khối giới thiệu hiển thị hài hòa trên nền đen với nền tối/trong suốt, viền tối mỏng, chữ sáng theo phong cách tối giản.
3. **Có tái hiện ổn định không? điều kiện tái hiện tối thiểu?**
   * *Có.* Tái hiện bằng cách cài đặt nền trang chủ thành màu đen tại `http://localhost:3000/system/home-components` rồi xem component `about` trên trang chủ hoặc trang edit.
6. **Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?**
   * *Giả thuyết:* Thay đổi màu nền của tất cả các style hiện tại (`classic`, `bento`, v.v.) của about thành tối khi nền đen. Điều này sẽ phá vỡ cấu trúc và màu sắc gốc của các layout cũ. Vì vậy, việc giới thiệu một style riêng biệt `'kanban'` được tinh chỉnh tối ưu cho nền tối là lựa chọn thông minh và an toàn nhất.
8. **Tiêu chí pass/fail sau khi sửa?**
   * *Pass:* Style `kanban` được tích hợp thành công. Khi nền trang chủ là đen, style `kanban` tự động áp dụng các màu tối (zinc-900, zinc-800, text-zinc-100) cho card và viền. Khi nền trang chủ là sáng, card hiển thị tông sáng. Preview trong admin edit/create cũng đổi màu nền tương ứng với cấu hình nền trang chủ.
   * *Fail:* Card vẫn bị trắng chói trên nền đen, hoặc preview trong admin không đổi màu.

### Độ tin cậy nguyên nhân gốc:
* **High:** Do cơ chế sinh màu nền của các style `about` hiện tại là màu tĩnh, không có khả năng tự động đổi màu khi nền trang chủ thay đổi sang đen.

# IV. Proposal (Đề xuất)

1. **Mở rộng type và hằng số:**
   * Thêm `'kanban'` vào type `AboutStyle` trong `app/admin/home-components/about/_types/index.ts`.
   * Thêm `{ id: 'kanban', label: 'Mẫu tối giản Kanban (Layout 9)' }` vào mảng `ABOUT_STYLES` ở `app/admin/home-components/about/_lib/constants.ts`.
2. **Triển khai render style mới trong shared UI:**
   * Trong `AboutSectionShared.tsx`, sử dụng query `api.homeComponentSystemConfig.getConfig` để lấy cấu hình nền trang chủ.
   * Viết hàm check `isDarkBackground` dựa trên màu nền lấy được.
   * Viết hàm `renderKanban()` để hiển thị thông tin giới thiệu theo đúng triết lý Kanban:
     * Dùng grid 2 cột (`gridTwoColClass`), khoảng cách vừa phải (`gap-6`).
     * Cột 1: Hiển thị hình ảnh chính bo góc cực nhỏ (`rounded-sm`), viền tối mỏng.
     * Cột 2: Hiển thị tiêu đề, mô tả và đặc điểm nổi bật.
     * Nếu nền tối: nền section là `bg-zinc-950/20` hoặc trong suốt, viền mỏng `border-zinc-800`, title `text-zinc-100`, description `text-zinc-400`, features text `text-zinc-300`, button style tối giản (nền tối, viền mỏng).
     * Nếu nền sáng: nền section là `bg-zinc-50/20`, viền `border-zinc-200`, title `text-zinc-900`, description `text-zinc-600`, features text `text-zinc-800`.
     * Có hiệu ứng reveal on hover cho icon mũi tên của button.
3. **Cập nhật Preview Admin:**
   * Trong `AboutPreview.tsx`, thêm query `api.homeComponentSystemConfig.getConfig` để lấy màu nền trang chủ, sau đó bọc ngoài `AboutSectionShared` bằng một div có style `backgroundColor: homePageBgColor` giống như cách `GalleryPreview.tsx` đang làm. Điều này giúp admin nhìn thấy ngay giao diện tối giản thích ứng trên nền đen/sáng của trang chủ khi đang cấu hình trong admin panel.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
* [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_types/index.ts)
  * *Vai trò hiện tại:* Định nghĩa các kiểu dữ liệu và helper cho about.
  * *Thay đổi:* Thêm giá trị `'kanban'` vào union type `AboutStyle`.
* [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_lib/constants.ts)
  * *Vai trò hiện tại:* Định nghĩa các hằng số cấu hình của about.
  * *Thay đổi:* Thêm phần tử `{ id: 'kanban', label: 'Mẫu tối giản Kanban (Layout 9)' }` vào mảng `ABOUT_STYLES`.
* [AboutSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutSectionShared.tsx)
  * *Vai trò hiện tại:* Component dùng chung để render giao diện giới thiệu cho cả preview và site thực tế.
  * *Thay đổi:*
    * Import `useQuery` và `api`.
    * Đọc cấu hình `homePageBackground` từ hệ thống.
    * Triển khai hàm `renderKanban()` theo phong cách Kanban (Ultra-Minimal Dense) tự thích ứng nền tối/sáng.
    * Gọi `renderKanban()` khi `style === 'kanban'`.
* [AboutPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/about/_components/AboutPreview.tsx)
  * *Vai trò hiện tại:* Wrapper hiển thị preview của about trong admin edit/create.
  * *Thay đổi:* Lấy cấu hình màu nền của trang chủ từ hệ thống và áp dụng vào thẻ bọc preview để đồng bộ trải nghiệm trực quan cho admin.

# VI. Execution Preview (Xem trước thực thi)

1. Sửa `_types/index.ts` để mở rộng type `AboutStyle`.
2. Sửa `_lib/constants.ts` để đưa style `kanban` lên giao diện quản trị.
3. Cập nhật `AboutPreview.tsx` để hiển thị màu nền thực tế của trang chủ trong khung preview.
4. Cập nhật `AboutSectionShared.tsx` để lấy thông tin màu nền hệ thống, viết logic check nền tối và xây dựng UI cho `renderKanban()`.
5. Kiểm tra trực quan trên trình duyệt (admin edit route và trang chủ).

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Manual Verification
* Mở trang cấu hình hệ thống `http://localhost:3000/system/home-components`, đổi màu nền trang chủ sang **Màu đen (Black)**.
* Mở trang edit của component about: `http://localhost:3000/admin/home-components/about/mx79d53cqrbhpp56byt5c8dm2x8817pb/edit`.
* Kiểm tra:
  * Trong select box "Kiểu hiển thị" của preview, có xuất hiện thêm tùy chọn **Mẫu tối giản Kanban (Layout 9)**.
  * Khi chọn **Mẫu tối giản Kanban (Layout 9)**, màu nền của khung preview có tự động chuyển sang màu đen thui đồng bộ với trang chủ.
  * Các khối giới thiệu hiển thị theo phong cách tối giản: nền tối mỏng, viền tối mỏng, chữ màu sáng, và icon mũi tên hiện rõ khi hover vào card.
  * Đổi màu nền trang chủ về **Màu trắng (White)** hoặc màu sáng khác, kiểm tra xem card có tự động quay về tông sáng (nền sáng, chữ đen, viền xám sáng) để giữ tính thẩm mỹ không.
  * Ra ngoài trang chủ `http://localhost:3000/` để kiểm tra xem component hiển thị đúng như trong preview của admin.

# VIII. Todo

- [ ] Cập nhật tệp `app/admin/home-components/about/_types/index.ts` để thêm `'kanban'` vào type `AboutStyle`.
- [ ] Cập nhật tệp `app/admin/home-components/about/_lib/constants.ts` để thêm style `'kanban'` vào danh sách styles.
- [ ] Cập nhật tệp `app/admin/home-components/about/_components/AboutPreview.tsx` để lấy cấu hình màu nền hệ thống và đổi màu nền preview tương ứng.
- [ ] Cập nhật tệp `app/admin/home-components/about/_components/AboutSectionShared.tsx` để triển khai style `'kanban'` tự thích ứng nền sáng/tối.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Style `'kanban'` hiển thị đẹp mắt và cân đối khi nền web màu đen.
* Component about trong style `'kanban'` khi nền đen có nền tối (`zinc-900` hoặc trong suốt) và chữ màu sáng (`zinc-100`/`zinc-400`), tránh tình trạng trắng chói.
* Spacing của style `'kanban'` nhỏ gọn, bo góc cực nhỏ `rounded-sm` đúng chuẩn "Calm Productivity UI".
* Khung preview trong admin phản ánh đúng màu nền thực tế đang thiết lập ở trang chủ để admin dễ dàng quan sát khi chỉnh sửa.
* Không làm hỏng hoặc ảnh hưởng tới các style hiển thị cũ của dự án.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* *Rủi ro:* Cấu hình query Convex có thể gây re-render liên tục nếu không được memoize đúng cách.
* *Cách giải quyết:* Query cấu hình hệ thống được cache và memoize qua React.useMemo, đảm bảo chỉ re-render khi màu nền trang chủ thay đổi thực sự.
* *Rollback:* Dùng `git checkout` để khôi phục trạng thái ban đầu của 4 tệp bị sửa đổi.

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi hành vi hoặc giao diện của các component khác ngoài `About`.
* Không thay đổi schema dữ liệu của Convex.
