# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Các danh sách sản phẩm, dự án, bài viết, khoá học,... hiện tại chỉ có lựa chọn sắp xếp tên từ A đến Z (tăng dần). Người dùng muốn có thêm lựa chọn sắp xếp ngược lại từ Z đến A (giảm dần).
*   **Giải pháp:** 
    1.  Cập nhật backend Convex: Thêm giá trị sắp xếp mới (`title_desc` hoặc `name_desc` tuỳ vào trường lưu trữ tên) và viết logic sắp xếp ngược (dùng hàm `localeCompare` đảo chiều đối số).
    2.  Cập nhật UI Frontend: Thêm tuỳ chọn "Tên Z-A" vào các dropdown bộ lọc ngay phía dưới tuỳ chọn "Tên A-Z" (hoặc "Theo tên").
    3.  Cập nhật các định nghĩa Typescript liên quan để tránh lỗi biên dịch.

## 2. Elaboration & Self-Explanation
Hiện tại trong hệ thống, các trang danh sách storefront hiển thị các tài nguyên như bài viết, khoá học, tài liệu, dự án, dịch vụ, sản phẩm đều cung cấp tính năng sắp xếp (`sortBy`). Một trong các kiểu sắp xếp thông dụng là sắp xếp theo tên (A-Z) sử dụng trường `title` hoặc `name`. Tuy nhiên, tuỳ chọn Z-A chưa được hỗ trợ.
Để hiện thực hoá điều này, chúng ta cần đi qua hai lớp chính của ứng dụng:
1.  **Lớp Backend (Convex):** 
    *   Các query API nhận tham số `sortBy` dạng `v.union(...)` cần được khai báo thêm một literal mới là `"title_desc"` (cho bài viết, khoá học, tài liệu, dự án, dịch vụ) hoặc `"name_desc"` (cho sản phẩm).
    *   Trong hàm handler của query, nơi xử lý logic sắp xếp bằng Javascript (sau khi kéo dữ liệu từ DB hoặc lọc kết quả), chúng ta bổ sung một nhánh `case "title_desc"` hoặc `case "name_desc"` thực hiện: `data.sort((a, b) => b.title.localeCompare(a.title, 'vi'))`. Việc chỉ định locale `'vi'` giúp đảm bảo tiếng Việt có dấu được sắp xếp chính xác theo bảng chữ cái tiếng Việt.
2.  **Lớp Frontend (React/Next.js components):**
    *   Cập nhật các hằng số hoặc cấu trúc `option` trong phần giao diện bộ lọc lọc danh sách.
    *   Thêm thẻ `<option value="title_desc">Tên Z-A</option>` hoặc phần tử tương ứng ngay dưới lựa chọn sắp xếp A-Z.
    *   Bổ sung kiểu TypeScript (type `SortOption` hoặc `ProductSortOption`) để hỗ trợ giá trị mới này mà không sinh lỗi typecheck.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể:** 
    Nếu có 3 bài viết: `Anh`, `Cường`, `Bình`.
    *   Khi chọn "Tên A-Z" (`title`): Sắp xếp thành `Anh` -> `Bình` -> `Cường`.
    *   Khi chọn "Tên Z-A" (`title_desc`): Sắp xếp thành `Cường` -> `Bình` -> `Anh`.
*   **Phép so sánh đời thường:** 
    Giống như một cuốn danh bạ điện thoại hay danh sách học sinh. Bình thường chúng ta tra từ chữ A đến chữ Z từ trên xuống dưới. Bây giờ chúng ta lật ngược cuốn danh bạ và đọc từ chữ Z ngược lại về chữ A.

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng tôi đã kiểm tra và xác định tất cả các tệp liên quan đến tính năng sắp xếp theo tên ở cả backend lẫn frontend cho 6 modules:
1.  **Posts (Bài viết):**
    *   Backend: `convex/posts.ts`
    *   Frontend: `components/site/posts/PostsFilter.tsx`, `components/site/posts/layouts/MagazineLayout.tsx`, `components/site/posts/layouts/SidebarLayout.tsx`
2.  **Services (Dịch vụ):**
    *   Backend: `convex/services.ts`
    *   Frontend: `components/site/services/ServicesFilter.tsx`, `components/site/services/layouts/MagazineLayout.tsx`, `components/site/services/layouts/SidebarLayout.tsx`
3.  **Products (Sản phẩm):**
    *   Backend: `convex/products.ts`
    *   Frontend: `app/(site)/_components/products/FilterComponents.tsx`, `app/(site)/_components/products/LayoutComponents.tsx`, `app/(site)/_components/products/ProductsPage.tsx`
4.  **Courses (Khóa học):**
    *   Backend: `convex/courses.ts`
    *   Frontend: `app/(site)/_components/courses/CoursesPage.tsx`
5.  **Resources (Tài liệu):**
    *   Backend: `convex/resources.ts`
    *   Frontend: `app/(site)/_components/resources/ResourcesPage.tsx`
6.  **Projects (Dự án):**
    *   Backend: `convex/projects.ts`
    *   Frontend: `app/(site)/projects/page.tsx`

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc:** Tính năng sắp xếp ngược (Z-A) chưa từng được thiết kế và triển khai cả ở định nghĩa schema Convex backend lẫn cấu hình dropdown ở Frontend UI. Do đó, khi người dùng yêu cầu, hệ thống hoàn toàn thiếu capability này.
*   **Giả thuyết đối chứng:** 
    *   *Giả thuyết:* Có thể chỉ cần sửa frontend bằng cách đảo ngược mảng kết quả nhận được từ backend.
    *   *Phản bác:* Không tối ưu và dễ gây lỗi khi phân trang. Nếu danh sách phân trang ở server (offset/cursor-based), việc đảo ngược ở client chỉ đảo ngược được trang hiện tại chứ không đảo ngược toàn bộ tập dữ liệu gốc trong DB. Do đó, bắt buộc phải truyền tham số sort xuống backend Convex để server thực hiện sắp xếp trước khi lấy lát cắt phân trang (`slice(offset, offset + limit)`).

# IV. Proposal (Đề xuất)
*   **Backend:** 
    *   Mở rộng validator `sortBy` ở các query tương ứng trong Convex để chấp nhận `"title_desc"` (hoặc `"name_desc"`).
    *   Bổ sung logic so sánh chuỗi đảo ngược dùng `b.title.localeCompare(a.title, 'vi')` hoặc `b.name.localeCompare(a.name, 'vi')` trong hàm sắp xếp của từng file.
*   **Frontend:**
    *   Bổ sung option tương ứng vào dropdown bộ lọc ở các trang/layout tương ứng.
    *   Đảm bảo đồng bộ hóa các kiểu TypeScript khai báo cho tham số sắp xếp.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Backend (Convex)
1.  **[MODIFY] [posts.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/posts.ts)**
    *   *Vai trò hiện tại:* Cung cấp các API bài viết (`searchPublished`, `listPublishedWithOffset`, `searchPublishedPaginated`).
    *   *Thay đổi:* Thêm `title_desc` vào validator `sortBy`, bổ sung case sắp xếp Z-A bằng cách so sánh ngược.
2.  **[MODIFY] [services.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/services.ts)**
    *   *Vai trò hiện tại:* Cung cấp API dịch vụ (`listPublishedWithOffset`, `searchPublished`).
    *   *Thay đổi:* Thêm `title_desc` vào validator `sortBy`, bổ sung case sắp xếp Z-A.
3.  **[MODIFY] [projects.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/projects.ts)**
    *   *Vai trò hiện tại:* Cung cấp API dự án (`listPublishedWithOffset`, `searchPublished`).
    *   *Thay đổi:* Thêm `title_desc` vào validator `sortBy`, bổ sung case sắp xếp Z-A.
4.  **[MODIFY] [courses.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courses.ts)**
    *   *Vai trò hiện tại:* Cung cấp API khóa học (`listPublishedWithOffset`, `searchPublished`).
    *   *Thay đổi:* Thêm `title_desc` vào validator `sortBy`, bổ sung case sắp xếp Z-A.
5.  **[MODIFY] [resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts)**
    *   *Vai trò hiện tại:* Cung cấp API tài liệu (`listPublishedWithOffset`, `searchPublished`).
    *   *Thay đổi:* Thêm `title_desc` vào validator `sortByValidator`, bổ sung case sắp xếp Z-A trong hàm `sortResources`.
6.  **[MODIFY] [products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/products.ts)**
    *   *Vai trò hiện tại:* Cung cấp API sản phẩm (`listPublishedWithOffset`, `searchPublished`).
    *   *Thay đổi:* Thêm `name_desc` vào validator `sortBy`, bổ sung case sắp xếp Z-A theo `name`.

### Frontend (Storefront UI & Types)
1.  **[MODIFY] [PostsFilter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/posts/PostsFilter.tsx)**
    *   *Vai trò hiện tại:* Hiển thị bộ lọc cho danh sách bài viết.
    *   *Thay đổi:* Thêm tùy chọn "Theo tên Z-A" vào mảng `SORT_OPTIONS`.
2.  **[MODIFY] [MagazineLayout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/posts/layouts/MagazineLayout.tsx)**
    *   *Vai trò hiện tại:* Layout dạng tạp chí cho danh sách bài viết.
    *   *Thay đổi:* Thêm tùy chọn "Theo tên Z-A" vào dropdown sắp xếp.
3.  **[MODIFY] [SidebarLayout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/posts/layouts/SidebarLayout.tsx)**
    *   *Vai trò hiện tại:* Layout có sidebar cho danh sách bài viết.
    *   *Thay đổi:* Thêm tùy chọn "Theo tên Z-A" vào dropdown sắp xếp.
4.  **[MODIFY] [ServicesFilter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/services/ServicesFilter.tsx)**
    *   *Vai trò hiện tại:* Bộ lọc cho danh sách dịch vụ.
    *   *Thay đổi:* Thêm tùy chọn "Theo tên Z-A" vào `SORT_OPTIONS`.
5.  **[MODIFY] [MagazineLayout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/services/layouts/MagazineLayout.tsx)**
    *   *Vai trò hiện tại:* Layout dạng tạp chí cho danh sách dịch vụ.
    *   *Thay đổi:* Thêm tùy chọn "Theo tên Z-A" vào dropdown sắp xếp.
6.  **[MODIFY] [SidebarLayout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/services/layouts/SidebarLayout.tsx)**
    *   *Vai trò hiện tại:* Layout có sidebar cho danh sách dịch vụ.
    *   *Thay đổi:* Thêm tùy chọn "Theo tên Z-A" vào dropdown sắp xếp.
7.  **[MODIFY] [FilterComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/products/FilterComponents.tsx)**
    *   *Vai trò hiện tại:* Chứa các component bộ lọc cho sản phẩm.
    *   *Thay đổi:* Bổ sung `<option value="name_desc">Tên Z-A</option>` vào dropdown sắp xếp.
8.  **[MODIFY] [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/products/LayoutComponents.tsx)**
    *   *Vai trò hiện tại:* Định nghĩa các layout hiển thị sản phẩm.
    *   *Thay đổi:* Bổ sung `<option value="name_desc">Tên Z-A</option>` vào dropdown và cập nhật kiểu `ProductSortOption` để chấp nhận `'name_desc'`.
9.  **[MODIFY] [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/products/ProductsPage.tsx)**
    *   *Vai trò hiện tại:* Trang chính hiển thị danh sách sản phẩm.
    *   *Thay đổi:* Bổ sung `<option value="name_desc">Tên Z-A</option>` vào select sắp xếp và cập nhật kiểu `ProductSortOption` nếu cần.
10. **[MODIFY] [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)**
    *   *Vai trò hiện tại:* Hiển thị danh sách khóa học.
    *   *Thay đổi:* Thêm tùy chọn `{ value: 'title_desc', label: 'Tên Z-A' }` vào các danh sách tùy chọn sắp xếp và cập nhật kiểu `CourseSortOption` nếu có.
11. **[MODIFY] [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)**
    *   *Vai trò hiện tại:* Hiển thị danh sách tài liệu.
    *   *Thay đổi:* Thêm tùy chọn `{ value: 'title_desc', label: 'Tên Z-A' }` vào dropdown sắp xếp.
12. **[MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)**
    *   *Vai trò hiện tại:* Hiển thị danh sách dự án.
    *   *Thay đổi:* Bổ sung `<option value="title_desc">Theo tên Z-A</option>` vào dropdown sắp xếp.

# VI. Execution Preview (Xem trước thực thi)
1.  **Cập nhật các file backend Convex:**
    *   Thay đổi validator `sortBy` ở từng file để chấp nhận `title_desc` / `name_desc`.
    *   Bổ sung logic so sánh chuỗi ngược bằng `localeCompare` đảo đối số trong các nhánh `switch(sortBy)`.
2.  **Cập nhật các file frontend:**
    *   Thêm các option "Tên Z-A" vào các mảng hoặc JSX tương ứng, luôn đứng sau option "Tên A-Z".
    *   Kiểm tra và cập nhật kiểu TS (TypeScript) nếu có định nghĩa union type cho tham số sort.
3.  **Tự review tĩnh:** Đảm bảo không có lỗi typecheck cục bộ.

# VII. Verification Plan (Kế hoạch kiểm chứng)
*   **Chạy code check:** Sử dụng `bunx tsc --noEmit` để đảm bảo không có lỗi TypeScript nào sau khi cập nhật các union type mới.
*   **Kiểm tra giao diện:** F5 các trang `/products`, `/projects`, `/courses`, `/resources`, danh mục bài viết, danh mục dịch vụ để kiểm tra dropdown sort xuất hiện "Tên Z-A" và hoạt động đúng logic (sắp xếp giảm dần theo bảng chữ cái).

# VIII. Todo
- [ ] Cập nhật `convex/posts.ts`
- [ ] Cập nhật `convex/services.ts`
- [ ] Cập nhật `convex/projects.ts`
- [ ] Cập nhật `convex/courses.ts`
- [ ] Cập nhật `convex/resources.ts`
- [ ] Cập nhật `convex/products.ts`
- [ ] Cập nhật Frontend UI của Posts (`PostsFilter.tsx`, `MagazineLayout.tsx`, `SidebarLayout.tsx`)
- [ ] Cập nhật Frontend UI của Services (`ServicesFilter.tsx`, `MagazineLayout.tsx`, `SidebarLayout.tsx`)
- [ ] Cập nhật Frontend UI của Products (`FilterComponents.tsx`, `LayoutComponents.tsx`, `ProductsPage.tsx`)
- [ ] Cập nhật Frontend UI của Courses (`CoursesPage.tsx`)
- [ ] Cập nhật Frontend UI của Resources (`ResourcesPage.tsx`)
- [ ] Cập nhật Frontend UI của Projects (`app/(site)/projects/page.tsx`)
- [ ] Thực hiện check TypeScript `bunx tsc --noEmit`
- [ ] Commit các thay đổi và phát âm báo hoàn thành

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   Tất cả các dropdown sắp xếp danh sách tài nguyên đều có thêm tùy chọn "Tên Z-A" (hoặc "Theo tên Z-A") nằm ngay bên dưới "Tên A-Z" (hoặc "Theo tên").
*   Khi chọn "Tên Z-A", danh sách các phần tử được sắp xếp giảm dần theo thứ tự bảng chữ cái tiếng Việt của tiêu đề/tên.
*   Không xảy ra lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   *Rủi ro:* Lỗi typecheck do mismatch giữa backend API client generator (của Convex) với code frontend nếu frontend dùng kiểu được tự động sinh ra trước khi chạy `npx convex dev` hoặc build.
*   *Khắc phục:* Git rollback (`git checkout -- .`) nhanh chóng khôi phục trạng thái ban đầu.

# XI. Out of Scope (Ngoài phạm vi)
*   Không thêm các tiêu chí sắp xếp khác (như theo ngày tạo, theo lượt xem) nếu module đó chưa hỗ trợ sẵn.
*   Không thay đổi cấu trúc dữ liệu hoặc schema của DB.
