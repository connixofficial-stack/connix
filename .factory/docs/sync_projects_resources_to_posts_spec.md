# I. Primer

## 1. TL;DR kiểu Feynman
* Trang danh sách bài viết (`/posts`) đang là chuẩn mực giao diện (UI/UX) tốt nhất của hệ thống: có phân trang số xịn (`1 ... 4 5 6 ... 10`), chọn số bài hiển thị mỗi trang, tự động tải thêm khi cuộn (Infinite Scroll) kèm hiệu ứng đẹp mắt.
* Trang danh sách dự án (`/projects`) và trang danh sách tài nguyên (`/resources`) hiện tại đang sử dụng các bộ lọc, phân trang và cuộn vô hạn rất đơn sơ và thủ công, không đồng bộ.
* Ta sẽ nâng cấp trang `/projects` và `/resources` bằng cách sao chép chính xác logic, cấu trúc HTML/CSS, các bộ lọc tinh gọn, phân trang số xịn và hiệu ứng cuộn vô hạn của trang `/posts` sang hai trang này.

## 2. Elaboration & Self-Explanation
Chi tiết việc đồng bộ hóa:
a) **Phân trang Số chuẩn (Numbered Pagination & Ellipsis)**:
   Hiện tại, cả projects và resources chỉ có hai nút "Trước" và "Sau" (hoặc "Xem thêm") rất thô sơ. Ta sẽ chuyển sang sử dụng thuật toán tạo phân trang số xịn `generatePaginationItems` giống trang `/posts`. Điều này cho phép hiển thị các nút số trang cụ thể, tự động co gọn thành dấu ba chấm (`…`) khi có quá nhiều trang, hiển thị dải số lượng hiện tại (ví dụ: `1–12 / 48 dự án`), và thêm dropdown cho phép người dùng thay đổi số lượng hiển thị trên mỗi trang (ví dụ: 12, 20, 24, 48).
b) **Cuộn Vô Hạn Tự Động (Infinite Scroll with useInView)**:
   - Đối với `/projects`: Ta sẽ tích hợp thư viện `react-intersection-observer` (`useInView`) và Convex `usePaginatedQuery(api.projects.listPublishedPaginated)` để tự động tải thêm khi cuộn xuống cuối màn hình, loại bỏ thao tác bấm nút thủ công.
   - Đối với `/resources`: Vì Convex của resources hiện chưa có API paginated chuyên biệt mà dùng offset-based, ta vẫn sử dụng `useInView` để tự động tăng `visibleLimit` (giới hạn hiển thị) của query offset khi cuộn xuống, mang lại trải nghiệm cuộn vô hạn tự động mượt mà cho người dùng.
   - Cả hai trang sẽ có hiệu ứng 3 chấm nhảy nhót khi tải thêm dữ liệu và thông báo "Đã hiển thị tất cả X bài viết/dự án/tài nguyên" khi hết dữ liệu.
c) **Header Tinh Gọn (Clean Header)**:
   Đồng bộ header của `/projects` và `/resources` theo style của `/posts`: tiêu đề sẽ tự động thay đổi theo danh mục đang chọn (ví dụ: "Website", "Tài liệu AutoCAD"), chỉ giữ lại tiêu đề chính căn giữa và xóa bỏ các text mô tả/dẫn dắt hardcode rườm rà.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như việc bạn đi siêu thị. Trang `/posts` là một quầy hàng hiện đại có xe đẩy thông minh, bản đồ chỉ dẫn số trang cụ thể, tự động đưa thêm hàng lên kệ khi bạn đi qua. Còn trang `/projects` và `/resources` là những quầy hàng cũ kỹ mà bạn phải tự bê rổ, tự hỏi nhân viên để lấy hàng tiếp theo. Chúng ta cần nâng cấp hai quầy hàng cũ lên cùng tiêu chuẩn hiện đại của quầy hàng thông minh.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Trang bài viết chuẩn**: `app/(site)/_components/posts/PostsPage.tsx`
  - Đang dùng `usePaginatedQuery` cho Infinite Scroll.
  - Có hàm `generatePaginationItems` cho phân trang số.
  - Có các component phụ trợ: `PostsFilter`, `FullWidthLayout`, `SidebarLayout`.
* **Trang dự án**: `app/(site)/projects/page.tsx`
  - Đang viết gộp toàn bộ logic trong file page.tsx.
  - Phân trang thô sơ chỉ có nút "Trước" và "Xem thêm".
  - Chưa dùng `useInView`.
* **Trang tài nguyên**: `app/(site)/_components/resources/ResourcesPage.tsx`
  - Code phân trang rất thô sơ: `Trang urlPage/totalPages`.
  - Cuộn vô hạn dùng nút bấm "Tải thêm" thủ công.
  - Header rườm rà và nhiều text cứng.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**:
  Do các trang được phát triển ở các thời điểm khác nhau bởi các dev khác nhau nên không có sự nhất quán trong thiết kế các module list (Dự án, Tài nguyên, Bài viết). Bài viết được module hóa xịn sò và thiết kế tốt nhất, trong khi Dự án và Tài nguyên vẫn giữ code legacy thô sơ.
* **Giả thuyết đối chứng**:
  Việc áp dụng chung một framework UI cho phân trang, bộ lọc và cuộn vô hạn từ bài viết sang dự án và tài nguyên không chỉ nâng tầm thẩm mỹ mà còn giúp giảm thiểu code lặp thừa thãi, đồng bộ trải nghiệm người dùng trên toàn bộ website.

---

# IV. Proposal (Đề xuất)

1. **Nâng cấp trang Dự án** (`app/(site)/projects/page.tsx`):
   - Import `useInView` từ `react-intersection-observer`.
   - Bổ sung hàm `generatePaginationItems`.
   - Thiết lập logic phân trang số xịn, có dropdown chọn số lượng hiển thị.
   - Hỗ trợ cuộn vô hạn qua `usePaginatedQuery(api.projects.listPublishedPaginated)`.
   - Căn chỉnh UI/UX, spacing tinh tế hơn theo phong cách MacBook Flat UI.
2. **Nâng cấp trang Tài nguyên** (`app/(site)/_components/resources/ResourcesPage.tsx`):
   - Import `useInView` từ `react-intersection-observer`.
   - Bổ sung hàm `generatePaginationItems`.
   - Thay thế toàn bộ khối phân trang cũ bằng khối phân trang số xịn của `/posts`.
   - Chuyển nút bấm "Tải thêm" thủ công thành tự động load thêm khi cuộn bằng `useInView`.
   - Tinh giản Header: tự động đổi tiêu đề theo danh mục và loại bỏ mô tả rườm rà.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)
* **Vai trò hiện tại**: Trang danh sách dự án.
* **Thay đổi**: Viết lại toàn bộ phần phân trang, tích hợp cuộn vô hạn tự động `useInView` và `usePaginatedQuery`, tinh giản header.

### Sửa: [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)
* **Vai trò hiện tại**: Trang danh sách tài nguyên.
* **Thay đổi**: Thay thế khối phân trang cũ thành phân trang số xịn, tích hợp `useInView` để tự động tải thêm thay cho nút bấm thủ công, tinh giản header.

---

# VI. Execution Preview (Xem trước thực thi)

1. Kiểm tra các import và thư viện phụ trợ (như `react-intersection-observer` xem đã có sẵn trong dự án chưa).
2. Sửa đổi `page.tsx` của projects.
3. Sửa đổi `ResourcesPage.tsx` của resources.
4. Tự review tĩnh và đảm bảo không có lỗi TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Thủ công:
* **Kiểm tra trang `/projects`**:
  - Giao diện phân trang dạng số hiển thị chuẩn, đổi page size hoạt động tốt.
  - Đổi cấu hình sang cuộn vô hạn trong Admin để xem hiệu ứng cuộn tự động load thêm hoạt động trơn tru.
* **Kiểm tra trang `/resources`**:
  - Phân trang dạng số và dropdown page size hiển thị đẹp mắt và chuyển trang mượt mà.
  - Khi cuộn vô hạn, tài nguyên tự động load thêm khi cuộn xuống chân trang mà không cần bấm nút.

---

# VIII. Todo

- [ ] Sửa file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx) để nâng cấp phân trang, cuộn vô hạn và header.
- [ ] Sửa file [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx) để nâng cấp phân trang, cuộn vô hạn và header.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Cả hai trang `/projects` và `/resources` đều sở hữu phân trang số dạng `1 ... 4 5 6 ... 10` kèm dải số lượng và dropdown chọn kích thước trang giống hệt `/posts`.
2. Hỗ trợ cuộn vô hạn tự động bằng `useInView` cho cả hai trang (tự động load khi cuộn tới cuối trang).
3. Header của hai trang chỉ chứa tiêu đề chính căn giữa và tự động thay đổi theo category được chọn (giống `/posts`).
4. Không có lỗi biên dịch TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi logic khi fetch dữ liệu paginated.
* **Hoàn tác**: Sử dụng `git checkout` để rollback code về trạng thái trước đó.
