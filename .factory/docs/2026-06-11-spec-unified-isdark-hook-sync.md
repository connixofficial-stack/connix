# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Các trang danh sách và chi tiết (như Khóa học, Bài viết, Sản phẩm...) bị lỗi hiển thị "3 mớ" (nửa sáng nửa tối) vì các component này tự tính toán biến `isDark` trực tiếp từ database settings mà bỏ qua trạng thái ghi đè trong `localStorage` và class `dark` thực tế trên thẻ `<html>`.
* **Giải pháp**: 
  - Tập trung logic xác định `isDark` vào custom hook dùng chung `useSiteSettings` trong [components/site/hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/hooks.ts).
  - Trả về thêm thuộc tính `isDark` đồng bộ thời gian thực với `site-theme-change` và `localStorage`.
  - Cập nhật các trang con để sử dụng trực tiếp `const { isDark } = useSiteSettings()`.

## 2. Elaboration & Self-Explanation
* Hiện tại, mỗi trang con đang tự thực hiện lại logic:
  `const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && ...)`
  Dẫn đến việc khi DB cấu hình là Tối nhưng trình duyệt đang áp dụng Sáng (do override), trang con vẫn tự nhận `isDark = true` và vẽ các card màu đen trên nền trắng.
* Bằng cách đưa logic này vào `useSiteSettings`:
  - Ta sử dụng một state `isDark` cục bộ trong hook và cập nhật nó thông qua `useEffect` lắng nghe sự kiện `'site-theme-change'`.
  - Khi người dùng click nút Toggle ở Header hoặc khi admin thay đổi cấu hình DB (kích hoạt sự kiện `'site-theme-change'`), state `isDark` trong hook sẽ tự động cập nhật, khiến toàn bộ các component con đang sử dụng hook này lập tức render lại với màu sắc nhất quán.
  - Các trang con không cần tự viết lại các dòng code tính toán phức tạp, giảm thiểu trùng lặp mã nguồn.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Trang Khóa học `/khoa-hoc` gọi `const { isDark } = useSiteSettings()`. Khi admin đang ở chế độ Sáng (dù DB cấu hình là Tối), `isDark` trả về từ hook sẽ là `false`. Trang Khóa học render nền trắng, sidebar trắng, và truyền `isDark = false` xuống `StorefrontCard` giúp các card hiển thị nền trắng đồng bộ. Khi admin click chuyển sang Tối, hook nhận sự kiện, trả về `isDark = true`, toàn bộ trang chuyển sang đen đồng loạt.
* **Hình ảnh đời thường**: Thay vì mỗi phòng trong tòa nhà tự lắp một cảm biến ánh sáng riêng (dễ dẫn đến việc phòng thì bật đèn phòng thì tắt), ta lắp một cảm biến tổng ở cổng chào của tòa nhà (hook `useSiteSettings`) rồi truyền tín hiệu bật/tắt (isDark) tới tất cả các phòng để đảm bảo cả tòa nhà luôn sáng hoặc tối đồng nhất.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Hook dùng chung**: [components/site/hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/hooks.ts)
  - Chỉ trả về `siteDarkMode` dạng chuỗi thô từ DB.
* **Các trang con bị ảnh hưởng**:
  - [app/(site)/_components/courses/CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
  - [app/(site)/[categorySlug]/_components/PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx)
  - [app/(site)/_components/posts/PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx)
  - [app/(site)/_components/products/ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/products/ProductsPage.tsx)
  - [app/(site)/_components/resources/ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Codebase cũ bị trùng lặp logic tính `isDark` ở nhiều trang, và các công thức này không đồng bộ với class thực tế của root document và localStorage.
* **Giả thuyết đối chứng**: Nếu ta chỉ sửa ở trang Khóa học, các trang khác như Bài viết hay Sản phẩm vẫn sẽ bị lỗi tương tự khi gặp tình trạng override. Do đó, việc sửa đổi tập trung qua hook và áp dụng cho các trang danh sách chính là cần thiết.

# IV. Proposal (Đề xuất)
1. **Cập nhật `components/site/hooks.ts`**:
   - Nhập thêm `useState`, `useEffect` từ `react`.
   - Trong hook `useSiteSettings`, khai báo state `isDark` và lắng nghe sự kiện `'site-theme-change'`.
   - Trả về `isDark` cùng với các site settings khác.
2. **Cập nhật các trang danh sách chính**:
   - Thay thế công thức tính `isDark` tự trị bằng việc lấy từ `useSiteSettings()`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [components/site/hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/hooks.ts)
  - Thay đổi: Bổ sung logic tính toán `isDark` thời gian thực vào hook `useSiteSettings`.
* **Sửa:** [app/(site)/_components/courses/CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
  - Thay đổi: Lấy `isDark` từ `useSiteSettings` thay vì tự tính.
* **Sửa:** [app/(site)/[categorySlug]/_components/PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx)
  - Thay đổi: Lấy `isDark` từ `useSiteSettings` thay vì tự tính.
* **Sửa:** [app/(site)/_components/posts/PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx)
  - Thay đổi: Lấy `isDark` từ `useSiteSettings`.
* **Sửa:** [app/(site)/_components/products/ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/products/ProductsPage.tsx)
  - Thay đổi: Lấy `isDark` từ `useSiteSettings`.
* **Sửa:** [app/(site)/_components/resources/ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)
  - Thay đổi: Lấy `isDark` từ `useSiteSettings`.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm `useState` và `useEffect` vào `components/site/hooks.ts`, cập nhật hook `useSiteSettings` trả về `isDark`.
2. Sửa đổi cách khai báo `isDark` tại các trang danh sách cốt lõi nêu trên.
3. Typecheck toàn dự án.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **TypeScript**: Chạy `bunx tsc --noEmit`.
* **Manual**:
  - Test chuyển đổi theme trên trang `/khoa-hoc`, `/bai-viet` và xác nhận toàn bộ nền, sidebar, card đều đồng loạt sáng/tối đồng nhất.

# VIII. Todo
- [ ] Cập nhật [components/site/hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/hooks.ts).
- [ ] Cập nhật [app/(site)/_components/courses/CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx).
- [ ] Cập nhật [app/(site)/[categorySlug]/_components/PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx).
- [ ] Cập nhật [app/(site)/_components/posts/PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx).
- [ ] Cập nhật [app/(site)/_components/products/ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/products/ProductsPage.tsx).
- [ ] Cập nhật [app/(site)/_components/resources/ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx).
- [ ] Typecheck.
- [ ] Commit thay đổi.
- [ ] Phát âm thông báo hoàn thành.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Toàn bộ trang danh sách Khóa học, Bài viết, Sản phẩm, Tài nguyên hiển thị đồng nhất (nền sáng thì card sáng, nền tối thì card tối).
* Không có hiện tượng "3 mớ" (lai tạp sáng tối).
* Logic theme tập trung, dễ bảo trì.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có.
* **Hoàn tác**: Rollback bằng git checkout.
