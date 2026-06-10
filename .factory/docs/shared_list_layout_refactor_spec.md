# I. Primer

## 1. TL;DR kiểu Feynman
Ở Phase trước, chúng ta đã xây dựng thành công một bộ khung bố cục dùng chung gọi là `SharedListLayout.tsx` và áp dụng thử nghiệm vào trang Dự án (`projects`) và Bài viết (`posts`).
Phase này là giai đoạn hoàn thiện. Chúng ta sẽ áp dụng bộ khung chuẩn hóa `SharedListLayout` vào tất cả 5 trang storefront còn lại: Bài viết theo danh mục (`[categorySlug]/posts`), Tài nguyên (`resources`), Khóa học (`courses`), Dịch vụ (`services`), và Dịch vụ theo danh mục (`[categorySlug]/services`).
Đồng thời, toàn bộ mã nguồn vẽ giao diện cũ (Legacy Code) bao gồm các layout riêng lẻ, toolbar thủ công sẽ bị loại bỏ hoàn toàn, không giữ lại cơ chế Fallback (dự phòng) để đảm bảo mã nguồn sạch sẽ ("không dơ") và dễ bảo trì về sau.

## 2. Elaboration & Self-Explanation
Việc duy trì các giao diện danh sách riêng lẻ cho từng module dẫn đến lặp mã nguồn giao diện vẽ 3 layout (Grid, Sidebar, List), phân trang và mobile filter bottom sheet ở các trang con.
Bằng cách refactor 5 trang storefront còn lại sang sử dụng `<SharedListLayout>`, các trang con sẽ chỉ hoạt động như các "Data Controller" - đảm nhận việc query dữ liệu từ Convex, quản lý state và truyền card component đặc thù vào `<SharedListLayout>`.
Mọi trang storefront giờ đây đều dùng chung một bộ CSS, padding lề, kiểu bo góc `cornerRadius` (None / Bo ít / Bo nhiều) cấu hình từ Admin, cấu trúc Page Header, và trải nghiệm Bottom Sheet trên thiết bị di động.

Để làm được điều này cho các trang có bộ lọc phức tạp (ví dụ: Tài nguyên lọc theo filter values, Khóa học lọc theo level):
- Ta sẽ sử dụng các render props linh hoạt: `renderToolbarFilters` (Desktop Toolbar), `renderSidebarFilters` (Desktop Sidebar), và `renderMobileFilters` (Mobile Bottom Sheet).
- Các hàm này cho phép truyền các thành phần lọc đặc thù vào bên trong khung của `<SharedListLayout>`, giúp layout giữ tính tổng quát (generic) mà vẫn đáp ứng đủ tính năng lọc của từng module.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang quản lý một chuỗi đại siêu thị. Mỗi ngành hàng (Thực phẩm, Điện máy, Quần áo, Sách) trước đây tự đóng kệ trưng bày riêng, tự in nhãn giá và tự bố trí lối đi theo phong cách riêng của từng trưởng ngành hàng. Điều này làm khách hàng cảm thấy bối rối khi di chuyển giữa các khu vực.
Giải pháp đồng bộ là siêu thị cung cấp một loại kệ đa năng chuẩn hóa duy nhất (tương ứng với `SharedListLayout`). Kệ này có các khe lắp ráp linh hoạt để đặt bảng thông tin hoặc khay đựng đặc thù. Ngành hàng Sách chỉ việc mang sách đặt lên kệ và gắn thêm khay chia nhỏ sách; ngành hàng Điện máy chỉ việc đặt tivi lên kệ đó và gắn thêm móc treo dây điện. Khung kệ là duy nhất và đồng bộ, nhưng sản phẩm và phụ kiện lọc hiển thị vẫn giữ được tính đặc trưng của từng ngành hàng.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Vị trí kiểm tra**:
  - `app/(site)/[categorySlug]/_components/PostsPage.tsx`
  - `app/(site)/_components/resources/ResourcesPage.tsx`
  - `app/(site)/_components/courses/CoursesPage.tsx`
  - `app/(site)/_components/services/ServicesPage.tsx`
  - `app/(site)/[categorySlug]/_components/ServicesPage.tsx`
- **Hành vi hiện tại**:
  - Các trang này vẫn đang sử dụng mã giao diện vẽ layout cũ riêng lẻ (legacy code).
  - Khoảng cách, kích thước chữ, bo góc viền và Bottom Sheet lọc ở thiết bị di động chưa nhất quán với trang Sản phẩm và Dự án đã refactor.
- **Hành vi mong muốn**:
  - Đồng bộ 100% giao diện bằng cách thay thế toàn bộ logic hiển thị của 5 trang bằng `<SharedListLayout>`.
  - Loại bỏ hoàn toàn legacy code giao diện (layout) cũ trong các file trên.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Code base storefront được phát triển qua nhiều giai đoạn khác nhau nên các module Bài viết, Tài nguyên, Khóa học, Dịch vụ có mã giao diện bị tách rời ad-hoc và trùng lặp nhiều.
- **Giả thuyết đối chứng**: Bằng cách refactor triệt để và xóa hẳn code layout cũ (không dùng fallback), hệ thống storefront sẽ được quy về một Single Source of Truth (Nguồn chân lý duy nhất) duy nhất cho giao diện danh sách, đảm bảo tính nhất quán 2026 cao cấp.

---

# IV. Proposal (Đề xuất)

### 1. Refactor trang Bài viết danh mục (`[categorySlug]/_components/PostsPage.tsx`)
- Thay thế toàn bộ cấu trúc hiển thị 3 layout bằng cách gọi `<SharedListLayout>`.
- Định nghĩa hàm `renderItem` nhận phần tử bài viết và trả về card bài viết tương ứng với layout `grid` / `list` chuẩn.
- Loại bỏ các import liên quan đến `FullWidthLayout`, `SidebarLayout`, `PostsFilter` cũ.

### 2. Refactor trang Tài nguyên (`_components/resources/ResourcesPage.tsx`)
- Sử dụng `<SharedListLayout>` nhận generic type `<Doc<'resources'>>`.
- Lắp ghép các bộ lọc đặc thù:
  - `renderToolbarFilters`: Trả về cụm dropdown chọn danh mục (`CustomDropdown`) và bộ lọc phần mềm (`MultiSelectDropdown` cho các filter values) trên desktop.
  - `renderSidebarFilters`: Trả về sidebar lọc danh mục và các filter checkbox/button tương tự cấu trúc sidebar cũ nhưng được định dạng sạch sẽ hơn.
  - `renderMobileFilters`: Trả về giao diện lọc cho mobile bottom sheet bao gồm tìm nhanh danh mục, lọc trình độ, lọc phần mềm.
- Loại bỏ code layout thủ công dài gần 400 dòng ở cuối file.

### 3. Refactor trang Khóa học (`_components/courses/CoursesPage.tsx`)
- Sử dụng `<SharedListLayout>` nhận generic type `<Doc<'courses'>>`.
- Lắp ghép các bộ lọc đặc thù:
  - `renderToolbarFilters`: Cụm dropdown chọn danh mục, trình độ (`level`), và bộ lọc phần mềm (`courseFilters`).
  - `renderSidebarFilters`: Sidebar lọc danh mục, trình độ và các thuộc tính lọc khóa học.
  - `renderMobileFilters`: Giao diện lọc mobile tương ứng.
- Loại bỏ hoàn toàn code hiển thị layout thủ công.

### 4. Refactor trang Dịch vụ & Dịch vụ danh mục (`ServicesPage.tsx`)
- Thực hiện refactor tương tự cho cả hai trang dịch vụ: root và category.
- Sử dụng `<SharedListLayout>` với generic type `<Doc<'services'>>` để hiển thị 3 layout Grid, Sidebar, List dịch vụ đồng bộ 100%.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### a) [MODIFY] [PostsPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx)
- *Vai trò*: Trang danh sách bài viết theo danh mục.
- *Thay đổi*: Thay đổi cấu trúc layout hiển thị sang dùng `<SharedListLayout>`. Xóa bỏ code layout cũ.

### b) [MODIFY] [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)
- *Vai trò*: Trang danh sách tài nguyên tải xuống.
- *Thay đổi*: Chuyển đổi sang sử dụng `<SharedListLayout>`, đưa các bộ lọc gán thuộc tính vào các render props của layout dùng chung, xóa bỏ legacy layout code.

### c) [MODIFY] [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
- *Vai trò*: Trang danh sách khóa học.
- *Thay đổi*: Chuyển đổi sang sử dụng `<SharedListLayout>`, đưa bộ lọc `level` và `courseFilters` vào các render props của layout dùng chung, xóa bỏ legacy layout code.

### d) [MODIFY] [ServicesPage.tsx (root)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx)
- *Vai trò*: Trang danh sách dịch vụ mặc định.
- *Thay đổi*: Thay thế toàn bộ giao diện layout thủ công bằng `<SharedListLayout>`. Xóa các file layout cũ không dùng tới nếu có.

### e) [MODIFY] [ServicesPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/ServicesPage.tsx)
- *Vai trò*: Trang danh sách dịch vụ theo danh mục.
- *Thay đổi*: Thay thế toàn bộ giao diện layout thủ công bằng `<SharedListLayout>`.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Chuẩn bị và Phân tích**: Đọc cấu trúc chi tiết của card hiển thị ở từng trang storefront để giữ nguyên thiết kế card đặc thù (như progress phần trăm học tập của khóa học, nút download/thêm giỏ hàng của tài nguyên).
2. **Thực thi Refactor**:
   - Sửa đổi [PostsPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx).
   - Sửa đổi [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx).
   - Sửa đổi [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx).
   - Sửa đổi [ServicesPage.tsx (root)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx).
   - Sửa đổi [ServicesPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/ServicesPage.tsx).
3. **Kiểm tra biên dịch tĩnh**: Chạy typecheck `bunx tsc --noEmit` toàn dự án và giới hạn dòng lỗi đầu tiên để kiểm tra lỗi TypeScript.
4. **Git Commit & Dọn dẹp**: Commit các thay đổi sạch sẽ, xóa bỏ file rác phát sinh (nếu có).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh kiểm tra lỗi kiểu dữ liệu:
  `bunx tsc --noEmit`
  Yêu cầu: Biên dịch thành công 100%, không phát sinh bất kỳ lỗi TypeScript nào trong các file được chỉnh sửa.

### Manual Verification
- Truy cập vào các URL trên localhost:
  - Bài viết danh mục: `http://localhost:3000/tin-tuc` (hoặc các slug danh mục bài viết tương ứng)
  - Tài nguyên: `http://localhost:3000/resources`
  - Khóa học: `http://localhost:3000/khoa-hoc`
  - Dịch vụ: `http://localhost:3000/services`
- Kiểm thử các chức năng:
  - Chọn chuyển đổi 3 layout (Grid, Sidebar, List) trên Desktop.
  - Nhập ô tìm kiếm, click chọn danh mục, chọn trình độ. Kiểm tra xem nút "Xóa lọc" có xuất hiện và hoạt động đúng không.
  - Chuyển sang kích thước di động (Mobile Responsive), bấm mở Bottom Sheet lọc, kéo chỉ thị vuốt đóng, kiểm thử nút "Thiết lập lại" và "Áp dụng".

---

# VIII. Todo

- [ ] Sửa trang danh mục Bài viết [PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx) sang dùng `<SharedListLayout>`.
- [ ] Sửa trang Tài nguyên [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx) sang dùng `<SharedListLayout>` và tích hợp bộ lọc phần mềm.
- [ ] Sửa trang Khóa học [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx) sang dùng `<SharedListLayout>` và tích hợp bộ lọc trình độ, bộ lọc khóa học.
- [ ] Sửa trang Dịch vụ mặc định [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx) sang dùng `<SharedListLayout>`.
- [ ] Sửa trang Dịch vụ theo danh mục [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/ServicesPage.tsx) sang dùng `<SharedListLayout>`.
- [ ] Thực hiện chạy typecheck `bunx tsc --noEmit` để verify toàn dự án.
- [ ] Commit tất cả thay đổi lên git.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Cả 5 trang storefront được refactor hoàn chỉnh, hiển thị chính xác theo cấu trúc layout chuẩn của `SharedListLayout`.
2. Toàn bộ mã nguồn cũ vẽ layout riêng biệt ở 5 trang storefront này bị xóa bỏ hoàn toàn (không dùng fallback).
3. Không có lỗi biên dịch TypeScript (`tsc --noEmit` báo thành công).
4. Trải nghiệm thanh công cụ Desktop, thanh tìm kiếm (có nút xóa tìm kiếm nhanh), phân trang và Mobile Bottom Sheet hoạt động trơn tru, đồng bộ thiết kế 100%.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Lỗi TypeScript do kiểu dữ liệu generic khác nhau giữa các thực thể (Post, Resource, Course, Service).
- **Cách khắc phục**: Khai báo và ép kiểu dữ liệu an toàn tại hàm `renderItem`, đảm bảo khớp với schema của Convex DB.
- **Hoàn tác**: Hoàn tác các file về trạng thái commit gần nhất bằng cách chạy:
  `git checkout -- app/`

---

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa database schema hoặc API endpoints của Convex.
- Không sửa giao diện của trang chi tiết (Detail Page) hoặc trang Admin.
