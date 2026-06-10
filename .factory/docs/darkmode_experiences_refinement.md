# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Giao diện tối (Dark Mode) trên các trang public (Experiences như Khóa học, Tài nguyên, Sản phẩm, Bài viết, Dự án) hiện tại trông "lỏ" và "tối thui lùi" vì dùng tông xám xanh (Slate) của Tailwind. Các ô tìm kiếm, thanh bộ lọc (Filters) và các menu thả xuống (Dropdowns) chưa đồng bộ và thiếu độ nổi khối sang trọng.
* **Nguyên nhân**: Bảng màu neutral tối trong các file token màu đang định nghĩa màu nền xám đục (`bg-slate-950` / `#020617` và `bg-slate-900` / `#0f172a`), gây cảm giác u tối xám xịt. Việc pha màu `brandColors.primary}18` (opacity 10%) trên nền tối bị mờ đục, giảm tương phản.
* **Giải pháp**: 
  1. Chuyển đổi toàn bộ dải màu tối sang phong cách Apple Premium: Nền chính tối sâu (`#000000`), nền card/panel nổi lên dùng màu xám sang trọng (`#161617`), các ô input/dropdown dùng `#1c1c1e` hoặc `#252529` với viền xám mỏng (`#27272a` / `zinc-800`).
  2. Bổ sung logic `isDark` động cho trang Dự án (`projects`) bằng hook `useSiteSettings`.
  3. Cải tiến style cho các Category active ở dark mode: dùng nền xám đậm phẳng `#2c2c2e` kèm viền mỏng `#3a3a3c` và chữ màu primary thay vì dùng background pha opacity.

## 2. Elaboration & Self-Explanation
Hiện tại, trang cấu hình `/system/experiences` đã có tab "Cấu hình Chế độ tối" để bật tắt cho toàn bộ hệ thống. Tuy nhiên, khi chuyển qua chế độ này, trải nghiệm thực tế bị xám xịt buồn tẻ.
Để tạo nên giao diện phẳng sang trọng kiểu macOS/iOS (Calm Productivity UI), chúng ta thay đổi dải màu trung lập (neutral scale) ở chế độ tối:
- Nền ngoài cùng của các trang danh sách sẽ là màu đen tuyền (`#000000` / `bg-black`), giống như trang sản phẩm của Apple (apple.com).
- Các card sản phẩm/khóa học và sidebar filter sẽ nổi lên với màu xám phẳng cực tối (`#161617`).
- Các viền ngăn cách mảnh mỏng sẽ là xám tối (`#27272a` / `border-zinc-800`), giúp phân chia bố cục rõ ràng mà không gây nhiễu thị giác.
- Màu chữ chính sẽ dùng màu trắng đục nhẹ (`#f5f5f7`), mô tả dùng xám mịn (`#86868b`), nhãn muted dùng `#6e6e73`.
- Các nút Category đang được active sẽ có nền `#2c2c2e` (Apple active) và chữ có màu `primary` để nổi bật hẳn lên trên nền tối.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Trước đây, một card khóa học ở chế độ tối có nền xám xanh `#0f172a`, viền `#1e293b` và text `#f8fafc`. Nhìn tổng thể trang web bị xám mịt như trời sắp mưa. Sau khi sửa, nền card sẽ là `#161617`, viền mảnh xám nhạt `#27272a` nổi bật trên nền trang màu đen tuyền `#000000`, chữ màu trắng mịn `#f5f5f7` và mô tả xám dịu `#86868b`. Sự kết hợp này mang lại độ tương phản sắc nét cực cao nhưng lại dịu mắt, cực kỳ đẳng cấp.
* **Analogy đời thường**: Giống như việc bạn trưng bày điện thoại hay trang sức đắt tiền. Thay vì đặt chúng trên một chiếc bàn gỗ xám cũ xỉn (tông xám Slate), bạn đặt chúng trong một hộp trưng bày nhung đen tuyền (nền đen `#000000`), có các khay đỡ bằng da xám tối cao cấp (nền container `#161617`) và viền chỉ khâu mảnh sắc sảo (border `#27272a`). Khi đó, từng món đồ trang sức (nội dung khóa học, sản phẩm) sẽ tỏa sáng và thu hút mọi ánh nhìn.

# II. Audit Summary (Tóm tắt kiểm tra)

* Các tệp tin cấu hình màu sắc động: `components/site/products/colors.ts` và `components/site/posts/colors.ts` đang hardcode màu slate tối (`#020617`, `#0f172a`, `#1e293b`) cho biến thể `isDark`.
* Các tệp experiences khóa học (`CoursesPage.tsx`) và tài nguyên (`ResourcesPage.tsx`) dùng màu nền `bg-slate-50 dark:bg-slate-950` ở main và `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800` ở panels/cards.
* Tệp danh sách dự án (`app/(site)/projects/page.tsx`) chưa tích hợp đầy đủ hook `useSiteSettings` để lấy trạng thái `isDark` động từ Convex. Đồng thời đang bị hardcode màu hover `group-hover:text-teal-600`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Root Cause**: Giao diện tối bị "lỏ" do sử dụng dải màu Slate xám xanh mặc định của Tailwind CSS, thiếu chiều sâu của thiết kế macOS/Apple (nền đen sâu + panel xám phẳng + border zinc mảnh).
* **Counter-Hypothesis**: Nếu chỉ sửa màu nền body sang đen `#000000` mà không cập nhật màu nền card, dropdown và viền border đồng bộ sang dải xám Apple, các card sẽ bị chìm nghỉm hoặc lệch tông màu xám xanh thô kệch. Vì vậy, bắt buộc cập nhật đồng bộ toàn bộ dải màu neutral tối trong colors.ts và các classes tương ứng.

# IV. Proposal (Đề xuất)

* **Bước 1**: Cập nhật hàm `getProductsListColors` và `getPostsListColors` thay đổi dải neutral tối:
  * `neutralSurface`: `#161617` (Nền container Apple)
  * `neutralSubtle`: `#1c1c1e` (Nền element Apple)
  * `neutralBorder`: `#27272a` (Viền xám zinc-800)
  * `neutralBorderSoft`: `#1c1c1e`
  * `neutralText`: `#f5f5f7` (Chữ chính Apple)
  * `neutralMuted`: `#86868b` (Chữ phụ Apple)
  * `neutralSoft`: `#6e6e73` (Chữ muted Apple)
* **Bước 2**: Thay thế các class Tailwind trong `CoursesPage.tsx` và `ResourcesPage.tsx`:
  * `bg-slate-50 dark:bg-slate-950` -> `bg-slate-50 dark:bg-black`
  * `dark:bg-slate-900` -> `dark:bg-[#161617]` (ở card/aside)
  * `dark:border-slate-800` -> `dark:border-zinc-800/60`
  * `dark:bg-slate-950` (ở input search) -> `dark:bg-[#1c1c1e]`
  * Cập nhật các inline style của Category/Level active để ở Dark Mode dùng nền `#2c2c2e` và viền `#3a3a3c`.
* **Bước 3**: Cập nhật `projects/page.tsx`:
  * Sử dụng hook `useSiteSettings` để xác định `isDark` động.
  * Sửa wrapper ngoài cùng thành `bg-slate-50 dark:bg-black`.
  * Thay thế các classes `dark:bg-slate-900`, `dark:border-slate-800` bằng màu Apple.
  * Cập nhật style active category tương tự CoursesPage.
  * Loại bỏ hardcode hover `group-hover:text-teal-600` chuyển thành `group-hover:opacity-90` hoặc transition mịn màng.

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [colors.ts (Products)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/products/colors.ts)
  * Sửa: Cập nhật dải màu tối trung lập (neutral scale) sang màu Apple.
* **Sửa**: [colors.ts (Posts)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/posts/colors.ts)
  * Sửa: Cập nhật dải màu tối trung lập (neutral scale) sang màu Apple.
* **Sửa**: [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
  * Sửa: Thay thế các class background/border tối sang màu Apple, cập nhật logic active button ở Dark Mode.
* **Sửa**: [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)
  * Sửa: Thay thế các class background/border tối sang màu Apple, cập nhật logic active button ở Dark Mode.
* **Sửa**: [page.tsx (Projects)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)
  * Sửa: Import `useSiteSettings`, tính `isDark` động, cập nhật class màu nền/viền tối sang màu Apple, sửa active category style và hover effect.

# VI. Execution Preview (Xem trước thực thi)

1. Cập nhật các file định nghĩa token màu `colors.ts` của Products và Posts.
2. Nâng cấp style dark mode cho `CoursesPage.tsx` và `ResourcesPage.tsx`.
3. Tích hợp `isDark` động và nâng cấp style dark mode cho `projects/page.tsx`.
4. Chạy compiler tĩnh `bunx tsc --noEmit` để xác minh tính đúng đắn.
5. Chạy âm thanh thông báo hoàn thành.

# VII. Verification Plan (Kế hoạch kiểm chứng)

* **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit` để đảm bảo không lỗi type.
* **Kiểm tra thực tế (do Tester/User)**: Bật chế độ tối trong Experiences settings, kiểm tra 5 trang public xem giao diện hiển thị màu đen Apple tinh tế, mượt mà và chữ tương phản tốt.

# VIII. Todo

- [ ] Cập nhật file `components/site/products/colors.ts`
- [ ] Cập nhật file `components/site/posts/colors.ts`
- [ ] Cập nhật file `app/(site)/_components/courses/CoursesPage.tsx`
- [ ] Cập nhật file `app/(site)/_components/resources/ResourcesPage.tsx`
- [ ] Cập nhật file `app/(site)/projects/page.tsx`
- [ ] Xác minh compile TypeScript (`bunx tsc --noEmit`)
- [ ] Phát âm báo hoàn thành task

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Nền chính (body/wrapper) của toàn bộ 5 Experiences ở Dark Mode phải có màu đen tuyền (`bg-black` / `#000000`).
* Các card, panel, dropdown menu có màu xám Apple `#161617`, viền mảnh zinc `#27272a`.
* Các ô input search, select button có màu nền `#1c1c1e` hoặc `#252529`.
* Nút active category ở dark mode dùng nền `#2c2c2e` và chữ màu primary thay vì dùng background opacity đục.
* Không có lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* Rủi ro thấp do chỉ thay đổi các class dark mode CSS của Tailwind và style inline ở dạng an toàn. Nếu cần hoàn tác, rollback git các tệp tin trên.

# XI. Out of Scope (Ngoài phạm vi)

* Không sửa đổi code logic lấy dữ liệu hoặc chức năng khác ngoài CSS/Style.
