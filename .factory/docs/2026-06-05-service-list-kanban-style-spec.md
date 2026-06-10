# I. Primer

## 1. TL;DR kiểu Feynman
* Khi bạn thay đổi màu nền của trang chủ thành màu đen, các card dịch vụ (service-list) hiện tại vẫn có nền màu trắng xóa và chữ màu đen thui. Điều này trông giống như việc đặt các mảnh giấy trắng rời rạc lên một chiếc bàn đen tuyền — trông rất thô và tương tương phản quá mức.
* Chúng tôi sẽ tạo ra một kiểu hiển thị mới tên là **'kanban'** (phong cách tối giản, chặt chẽ, hiện đại). 
* Điểm đặc biệt của kiểu hiển thị này là nó thông minh: nếu nền nhà (trang chủ) màu đen, nó sẽ tự biến các card dịch vụ thành màu tối (ví dụ: xám đậm/đen) với chữ màu sáng và viền siêu mỏng. Nếu nền nhà màu trắng, nó lại biến chúng thành màu sáng để hài hòa.
* Đồng thời, màn hình chỉnh sửa ở trang quản trị (Admin) cũng sẽ đổi màu nền giống hệt trang chủ để bạn nhìn thấy trước kết quả một cách chính xác nhất.

## 2. Elaboration & Self-Explanation
Vấn đề cốt lõi là các component `ServiceList` hiện tại được thiết kế cứng (hardcoded) với tông màu sáng (nền trắng `#ffffff`, chữ `#0f172a`, viền `#e2e8f0`). Khi quản trị viên cấu hình nền trang chủ là đen tại trang quản lý hệ thống, các card này không tự chuyển đổi tông màu (dark mode adaptation). Điều này phá vỡ tính thẩm mỹ của toàn bộ giao diện.

Để giải quyết triệt để và đem lại trải nghiệm cao cấp (Premium UI), chúng tôi đề xuất thêm một style mới tên là `kanban` vào danh sách `ServiceListStyle`. Style này sẽ tuân thủ nghiêm ngặt triết lý thiết kế **"Calm Productivity UI" / "Ultra-Minimal Dense"** trong tài liệu `home_component_design_prompt.md`:
* **Mật độ thông tin cao (Dense):** Spacing nhỏ (`gap-2.5`, padding card `p-3`).
* **Tối giản tối đa (Zero noise):** Bo góc cực nhỏ (`rounded-sm` - 2px), không có shadow lớn (chỉ dùng shadow rất nhẹ hoặc border flat), chữ nhỏ gọn (`text-xs`), hình ảnh bo góc tương ứng.
* **Tự thích ứng nền (Background-adaptive):** Sử dụng query `api.homeComponentSystemConfig.getConfig` để phát hiện màu nền trang chủ.
  * Nếu nền trang chủ là đen/tối: card sẽ có nền màu tối (`#18181b` - zinc-900), viền tối (`border-zinc-800`), chữ sáng (`text-zinc-100`/`text-zinc-400`).
  * Nếu nền trang chủ là sáng: card sẽ có nền màu sáng (`#ffffff` hoặc `#f8fafc`), viền sáng (`border-zinc-200`), chữ tối (`text-zinc-900`/`text-zinc-600`).
* **Hiệu ứng hover tinh tế (Reveal on hover):** Các chi tiết phụ như icon mũi tên chỉ đường hoặc giá tiền sẽ chuyển màu hoặc hiển thị rõ nét hơn khi hover chuột vào card (`group-hover`).

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Khi style `kanban` được chọn và trang chủ cấu hình nền đen (`#000000`):
  * Cấu trúc card dịch vụ "Thiết kế Web 2D/3D" sẽ có nền `bg-zinc-900/60` (màu xám tối mịn), viền mỏng màu `border-zinc-800`.
  * Dòng chữ tiêu đề "Thiết kế Web 2D/3D" có màu trắng ấm (`text-zinc-100`), mô tả màu xám nhạt (`text-zinc-400`).
  * Tag "NEW" hiển thị dạng hộp chữ nhật bo góc nhỏ `rounded-sm` với màu sắc tinh tế dạng `bg-zinc-800 text-zinc-300 border border-zinc-700` thay vì các tag tròn màu sắc quá rực rỡ.
  * Khi hover vào card, viền sáng nhẹ lên thành màu `border-zinc-700` và icon mũi tên chéo `ArrowUpRight` hiện rõ màu phụ (secondary color) để dẫn dắt hành vi của khách hàng.
* **Analogy đời thường:** Hãy tưởng tượng bạn đang mặc một bộ vest. Nếu bạn đi dự tiệc ban ngày ngoài trời nắng (nền trắng), bạn chọn một chiếc cravat và áo sơ mi sáng màu thanh lịch. Nhưng nếu bạn đi dạ tiệc đêm sang trọng (nền đen), bạn sẽ phối chiếc áo sơ mi đen hoặc tối màu với ánh sáng đèn huyền ảo để hòa quyện vào không gian bí ẩn, chứ không khoác một chiếc áo khoác trắng chói lọi tương phản cộc lệch. Style `kanban` hoạt động giống như người trợ lý thời trang tự động đổi trang phục của card cho phù hợp với môi trường dạ tiệc của trang chủ.

# II. Audit Summary (Tóm tắt kiểm tra)

* Lớp hiển thị của service-list được định nghĩa ở `ServiceListSectionShared.tsx` và gọi bởi `ServiceListSection.tsx` (ở ngoài site) và `ServiceListPreview.tsx` (trong admin).
* Color palette của các card hiện tại được quyết định bởi `getServiceListColorTokens` trong `colors.ts`. Hàm này đang trả về các giá trị tĩnh cho card background và border (`neutralSurface` và `neutralBorder` tương ứng với `#ffffff` và `#e2e8f0`).
* Config nền trang chủ lưu trong bảng cấu hình hệ thống qua mutation `api.homeComponentSystemConfig.setHomePageBackground` và có thể đọc bằng `api.homeComponentSystemConfig.getConfig`.
* Preview của admin hiện tại ở `ServiceListPreview.tsx` chưa nhận diện màu nền trang chủ, khiến preview luôn hiển thị trên nền trắng mặc định của `BrowserFrame`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Trả lời các câu hỏi bắt buộc:
1. **Triệu chứng quan sát được là gì (expected vs actual)?**
   * *Actual:* Khi nền trang chủ là màu đen, các card dịch vụ vẫn có nền trắng toát, viền xám sáng chói mắt và tương phản thô kệch.
   * *Expected:* Các card dịch vụ thích ứng hài hòa với nền đen: nền card màu tối, viền tối mỏng, chữ sáng, thiết kế dense/tối giản theo chuẩn Kanban.
3. **Có tái hiện ổn định không? điều kiện tái hiện tối thiểu?**
   * *Có.* Tái hiện bằng cách cài đặt nền trang chủ thành màu đen tại `http://localhost:3000/system/home-components` rồi xem trang chủ hoặc trang edit service-list.
6. **Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?**
   * *Giả thuyết:* Thay đổi màu nền của tất cả các style hiện tại (`grid`, `bento`, v.v.) thành tối khi nền đen. Tuy nhiên, điều này có thể ảnh hưởng đến thiết kế gốc của các style cũ mà khách hàng vẫn muốn giữ. Do đó, việc giới thiệu một style riêng biệt `'kanban'` được tinh chỉnh tối ưu và chuyên biệt cho triết lý tối giản của Kanban là giải pháp tối ưu và an toàn nhất.
8. **Tiêu chí pass/fail sau khi sửa?**
   * *Pass:* Style `kanban` được tích hợp thành công. Khi nền trang chủ là đen, style `kanban` tự động áp dụng các màu tối (zinc-900, zinc-800, text-zinc-100) cho card và viền. Khi nền trang chủ là sáng, card hiển thị tông sáng. Preview trong admin đồng bộ màu nền trang chủ theo thời gian thực.
   * *Fail:* Card vẫn bị trắng chói trên nền đen, hoặc preview trong admin không phản ánh đúng màu nền trang chủ.

### Độ tin cậy nguyên nhân gốc:
* **High:** Do cơ chế sinh color tokens của `ServiceList` hiện tại cố định màu card là màu sáng, không hỗ trợ đọc màu nền của trang chủ để điều chỉnh độ sáng/tối của card.

# IV. Proposal (Đề xuất)

1. **Mở rộng type và hằng số:**
   * Thêm `'kanban'` vào type `ServiceListStyle` trong `app/admin/home-components/service-list/_types/index.ts`.
   * Thêm `{ id: 'kanban', label: 'Kanban' }` vào hằng số `SERVICE_LIST_STYLES` ở `app/admin/home-components/service-list/_lib/constants.ts`.
2. **Triển khai render style mới trong shared UI:**
   * Trong `ServiceListSectionShared.tsx`, sử dụng query `api.homeComponentSystemConfig.getConfig` để lấy cấu hình nền trang chủ.
   * Viết hàm check `isDarkBackground` dựa trên màu nền lấy được.
   * Viết hàm `renderKanban()` để hiển thị danh sách dịch vụ theo đúng triết lý Kanban:
     * Dùng grid tự thích ứng số cột (`desktopColumns` 3 hoặc 4).
     * Card dùng `rounded-sm` (2px), padding `p-3`, viền siêu mỏng.
     * Nếu nền tối: card background là `bg-zinc-900/60`, border `border-zinc-800`, hover border `border-zinc-700`, title `text-zinc-100`, description `text-zinc-400`.
     * Nếu nền sáng: card background là `bg-white`, border `border-zinc-200`, hover border `border-zinc-300`, title `text-zinc-900`, description `text-zinc-600`.
     * Tag badge: nhỏ gọn, vuông góc `rounded-sm`, chữ in hoa `text-[9px] font-bold uppercase tracking-wider`.
     * Có hiệu ứng reveal on hover cho icon `ArrowUpRight`.
3. **Cập nhật Preview Admin:**
   * Trong `ServiceListPreview.tsx`, thêm query `api.homeComponentSystemConfig.getConfig` để lấy màu nền trang chủ, sau đó bọc ngoài `ServiceListSectionShared` bằng một div có style `backgroundColor: homePageBgColor` giống như cách `GalleryPreview.tsx` đang làm. Điều này giúp admin nhìn thấy ngay giao diện tối giản thích ứng trên nền đen/sáng của trang chủ khi đang cấu hình trong admin panel.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
* [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_types/index.ts)
  * *Vai trò hiện tại:* Định nghĩa các kiểu dữ liệu và helper cho service-list.
  * *Thay đổi:* Thêm giá trị `'kanban'` vào union type `ServiceListStyle`.
* [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_lib/constants.ts)
  * *Vai trò hiện tại:* Định nghĩa các hằng số cấu hình của service-list.
  * *Thay đổi:* Thêm phần tử `{ id: 'kanban', label: 'Kanban' }` vào mảng `SERVICE_LIST_STYLES`.
* [ServiceListSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListSectionShared.tsx)
  * *Vai trò hiện tại:* Component dùng chung để render danh sách dịch vụ cho cả preview và site thực tế.
  * *Thay đổi:*
    * Import `useQuery` và `api`.
    * Đọc cấu hình `homePageBackground` từ hệ thống.
    * Triển khai hàm `renderKanban()` theo phong cách Kanban (Ultra-Minimal Dense) tự thích ứng nền tối/sáng.
    * Gọi `renderKanban()` khi `style === 'kanban'`.
* [ServiceListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListPreview.tsx)
  * *Vai trò hiện tại:* Wrapper hiển thị preview của service-list trong admin edit/create.
  * *Thay đổi:* Lấy cấu hình màu nền của trang chủ từ hệ thống và áp dụng vào thẻ bọc preview để đồng bộ trải nghiệm trực quan cho admin.

# VI. Execution Preview (Xem trước thực thi)

1. Sửa `_types/index.ts` để mở rộng type `ServiceListStyle`.
2. Sửa `_lib/constants.ts` để đưa style `kanban` lên giao diện quản trị.
3. Cập nhật `ServiceListPreview.tsx` để hiển thị màu nền thực tế của trang chủ trong khung preview.
4. Cập nhật `ServiceListSectionShared.tsx` để lấy thông tin màu nền hệ thống, viết logic check nền tối và xây dựng UI cho `renderKanban()`.
5. Kiểm tra trực quan trên trình duyệt (admin edit route và trang chủ).

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Manual Verification
* Mở trang cấu hình hệ thống `http://localhost:3000/system/home-components`, đổi màu nền trang chủ sang **Màu đen (Black)**.
* Mở trang edit của component service-list: `http://localhost:3000/admin/home-components/service-list/mx73epcmhabhhwcvhk0yp2ayr98803yt/edit`.
* Kiểm tra:
  * Trong select box "Kiểu hiển thị" của preview, có xuất hiện thêm tùy chọn **Kanban**.
  * Khi chọn **Kanban**, màu nền của khung preview phải tự động chuyển sang màu đen thui đồng bộ với trang chủ.
  * Các card dịch vụ hiển thị theo phong cách tối giản: nền card tối (xám đậm/bán trong suốt), viền mỏng tối màu, chữ màu sáng, tag vuông vắn nhỏ gọn, và icon mũi tên hiện rõ khi hover vào card.
  * Đổi màu nền trang chủ về **Màu trắng (White)** hoặc màu sáng khác, kiểm tra xem card có tự động quay về tông sáng (nền trắng, chữ đen, viền xám sáng) để giữ tính thẩm mỹ không.
  * Ra ngoài trang chủ `http://localhost:3000/` để kiểm tra xem component hiển thị đúng như trong preview của admin.

# VIII. Todo

- [ ] Cập nhật tệp `app/admin/home-components/service-list/_types/index.ts` để thêm `'kanban'` vào type `ServiceListStyle`.
- [ ] Cập nhật tệp `app/admin/home-components/service-list/_lib/constants.ts` để thêm style `'kanban'` vào danh sách styles.
- [ ] Cập nhật tệp `app/admin/home-components/service-list/_components/ServiceListPreview.tsx` để lấy cấu hình màu nền hệ thống và đổi màu nền preview tương ứng.
- [ ] Cập nhật tệp `app/admin/home-components/service-list/_components/ServiceListSectionShared.tsx` để triển khai style `'kanban'` tự thích ứng nền sáng/tối.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Style `'kanban'` hiển thị đẹp mắt và cân đối khi nền web màu đen.
* Card dịch vụ trong style `'kanban'` khi nền đen có nền tối (`zinc-900` hoặc tương đương) và chữ màu sáng (`zinc-100`/`zinc-400`), tránh tình trạng trắng chói.
* Spacing của style `'kanban'` nhỏ gọn, bo góc cực nhỏ `rounded-sm` đúng chuẩn "Calm Productivity UI".
* Khung preview trong admin phản ánh đúng màu nền thực tế đang thiết lập ở trang chủ để admin dễ dàng quan sát khi chỉnh sửa.
* Không làm hỏng hoặc ảnh hưởng tới các style hiển thị cũ của dự án.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* *Rủi ro:* Cấu hình query Convex có thể gây re-render liên tục nếu không được memoize đúng cách.
* *Cách giải quyết:* Query cấu hình hệ thống được cache và memoize qua React.useMemo, đảm bảo chỉ re-render khi màu nền trang chủ thay đổi thực sự.
* *Rollback:* Dùng `git checkout` để khôi phục trạng thái ban đầu của 4 tệp bị sửa đổi.

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi hành vi hoặc giao diện của các component khác ngoài `ServiceList`.
* Không thay đổi schema dữ liệu của Convex.
