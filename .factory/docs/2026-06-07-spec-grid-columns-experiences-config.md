# I. Primer

## 1. TL;DR kiểu Feynman
Giống như việc bạn có các album ảnh trên điện thoại: Bạn muốn có thể dễ dàng chọn xem mỗi hàng hiển thị 3 ảnh hay 4 ảnh để trông đẹp mắt nhất. Chúng tôi sẽ thêm một cài đặt mới giúp bạn chọn hiển thị 3 cột hoặc 4 cột cho tất cả các trang danh sách (như Sản phẩm, Bài viết, Tài nguyên, Dự án, Dịch vụ, Khóa học) ngay trong trang quản trị.
* Nếu chọn hiển thị **4 cột**: Trên điện thoại và máy tính bảng sẽ hiện **2 cột** để vừa vặn, còn trên máy tính sẽ hiện **4 cột** rộng rãi.
* Nếu chọn hiển thị **3 cột**: Trên điện thoại sẽ hiện **1 cột** to rõ ràng, còn trên máy tính bảng và máy tính sẽ hiện **3 cột**.
Bạn cũng có thể nhanh chóng đổi và áp dụng số cột này cho tất cả các danh sách cùng một lúc bằng một nút bấm duy nhất trong trang cấu hình tổng quan.

## 2. Elaboration & Self-Explanation
Hiện tại, một số trang danh sách (như Tài nguyên và Khóa học) đã có cấu hình số cột (`gridColumns` mặc định là 3) nhưng chưa được áp dụng nhất quán cho tất cả các loại danh sách khác (Sản phẩm, Bài viết, Dịch vụ, Dự án). Hơn nữa, quy tắc phản hồi (Responsive) của lưới thẻ (Grid) chưa tối ưu:
- Giao diện danh sách bài viết hiện đang hiển thị cố định 2 cột trên Desktop khi dùng layout Sidebar, tạo cảm giác trống trải.
- Thiếu công cụ cấu hình nhanh số cột ở trang quản trị trung tâm `/system/experiences`.

Giải pháp của chúng tôi:
1. **Mở rộng cấu hình**: Thêm trường `gridColumns` (kiểu số: 3 hoặc 4) vào cấu hình của cả 6 loại danh sách trải nghiệm.
2. **Cập nhật UI Quản trị (Admin Editor)**:
   - Thêm nút cấu hình số cột cho từng trang editor chi tiết.
   - Thêm bộ chọn số cột nhanh và nút hành động đồng bộ hàng loạt (Bulk Action) tại trang quản trị trung tâm `/system/experiences` (tab Cấu hình nhanh danh sách) để đổi tất cả thành 3 cột hoặc 4 cột chỉ với một click.
3. **Cập nhật giao diện hiển thị (Storefront & Preview)**:
   - Khi `gridColumns === 4`: Sử dụng class CSS `grid-cols-2 lg:grid-cols-4` (Mobile/Tablet hiện 2 cột, Desktop hiện 4 cột).
   - Khi `gridColumns === 3`: Sử dụng class CSS `grid-cols-1 md:grid-cols-3` (Mobile hiện 1 cột, Tablet/Desktop hiện 3 cột).
   - Quy tắc này áp dụng cho cả layout Grid thông thường và layout Sidebar (cho lưới thẻ bên phải sidebar).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi bạn duyệt ảnh trên macOS Finder, bạn có một thanh trượt để chỉnh kích thước icon to/nhỏ. Kích thước to tương đương hiển thị 3 cột, kích thước nhỏ tương đương hiển thị 4 cột. Hệ thống sẽ tự động dồn hàng tùy thuộc vào việc bạn kéo thanh trượt đó.
* **Analogy**: Layout Grid giống như các hàng ghế trên máy bay. Máy bay thân rộng có thể xếp 4 ghế một hàng (2-2), còn máy bay nhỏ hơn xếp 3 ghế một hàng. Chúng ta cung cấp chiếc cần gạt cho cơ trưởng (Admin) để quyết định xếp 3 hay 4 ghế cho từng chuyến bay (trang danh sách).

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Các Experience Editor cần bổ sung cấu hình cột**:
  * [posts-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/posts-list/page.tsx)
  * [products-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/products-list/page.tsx)
  * [services-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/services-list/page.tsx)
  * [projects-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/projects-list/page.tsx)
* **Các Experience Editor đã có cấu hình cột (cần đồng bộ responsive)**:
  * [courses-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/courses-list/page.tsx)
  * [resources-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-list/page.tsx)
* **Quản trị trung tâm**:
  * [experiences/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx) (tab `layout_config`)
* **Các trang hiển thị Storefront thực tế**:
  * `/products`: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/products/ProductsPage.tsx)
  * `/posts`: [PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/posts/PostsPage.tsx)
  * `/resources`: [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx)
  * `/khoa-hoc`: [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/courses/CoursesPage.tsx)
  * `/projects`: [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/projects/page.tsx)
  * `/services`: [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/services/ServicesPage.tsx) (nếu có)

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Thiết kế grid trước đây dùng số cột cố định hoặc chỉ hỗ trợ 3 cột, không cho phép cấu hình 4 cột trên Desktop cho một số module như Bài viết, Sản phẩm, Dự án. Đồng thời, CSS responsive chưa chia tỷ lệ cột theo mong muốn của user (Desktop 4 -> Mobile/Tablet 2; Desktop 3 -> Mobile 1, Tablet 3).
* **Giả thuyết đối chứng**: Việc tích hợp cài đặt `gridColumns` động và áp dụng các class responsive tương ứng (`grid-cols-2 lg:grid-cols-4` cho 4 cột, `grid-cols-1 md:grid-cols-3` cho 3 cột) sẽ giải quyết triệt để vấn đề hiển thị trên các thiết bị, đem lại giao diện linh hoạt và cân đối.

---

# IV. Proposal (Đề xuất)

### a) Đồng bộ cấu hình Database & Admin Editor
1. Trong file quản trị trung tâm [experiences/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx):
   - Thêm state `localGridColumns` quản lý số cột của 6 danh sách.
   - Thêm UI Segmented Control chọn `3 Cột / 4 Cột` bên cạnh bộ chọn layout của từng hàng.
   - Thêm 2 nút bulk action ở đầu tab: "Đồng bộ 3 cột" và "Đồng bộ 4 cột".
   - Cập nhật hàm `handleSaveAll` để lưu trường `gridColumns` vào value của từng key setting tương ứng trong Convex.
2. Trong các trang editor chi tiết của từng module:
   - Thêm cấu hình `gridColumns` vào interface state/config của trang.
   - Hiển thị SelectRow "Số cột hiển thị" (3 cột hoặc 4 cột) trong thẻ thiết lập.
   - Truyền `gridColumns` vào component Preview tương ứng.

### b) Đồng bộ hiển thị Responsive trên Storefront & Preview
Tại tất cả các component render dạng Grid và Sidebar (cho cả Preview và Storefront thực tế):
- Thay thế class grid cứng bằng class động dựa vào `gridColumns`:
  - **Nếu `gridColumns === 4`**:
    - Sử dụng class: `grid grid-cols-2 lg:grid-cols-4 gap-5` (hoặc md:grid-cols-2 để giữ mobile & tablet là 2 cột).
  - **Nếu `gridColumns === 3` (mặc định)**:
    - Sử dụng class: `grid grid-cols-1 md:grid-cols-3 gap-5` (mobile hiển thị 1 cột dọc, tablet & desktop hiển thị 3 cột).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

#### [MODIFY] [experiences/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx)
* Thay đổi: Tích hợp cấu hình nhanh `gridColumns` cho 6 danh sách, thêm bulk action và Segmented Control chọn số cột cho từng module.

#### [MODIFY] [posts-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/posts-list/page.tsx)
* Thay đổi: Thêm `gridColumns` vào type config, default config, hàm normalize, control card thiết lập và preview element.

#### [MODIFY] [products-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/products-list/page.tsx)
* Thay đổi: Thêm cấu hình `gridColumns` vào editor UI tương tự posts-list.

#### [MODIFY] [services-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/services-list/page.tsx)
* Thay đổi: Thêm cấu hình `gridColumns` vào editor UI.

#### [MODIFY] [projects-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/projects-list/page.tsx)
* Thay đổi: Thêm cấu hình `gridColumns` vào editor UI.

#### [MODIFY] [courses-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/courses-list/page.tsx) & [resources-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-list/page.tsx)
* Thay đổi: Cập nhật component editor để đồng bộ hóa và truyền prop gridColumns xuống preview.

#### [MODIFY] [PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/posts/PostsPage.tsx)
* Thay đổi: Áp dụng CSS class động chia cột dựa trên cấu hình `gridColumns` (Grid layout & Sidebar layout).

#### [MODIFY] [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/products/ProductsPage.tsx)
* Thay đổi: Áp dụng CSS class động chia cột dựa trên cấu hình `gridColumns`.

#### [MODIFY] [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx)
* Thay đổi: Áp dụng CSS class động chia cột dựa trên cấu hình `gridColumns`.

#### [MODIFY] [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/courses/CoursesPage.tsx)
* Thay đổi: Áp dụng CSS class động chia cột dựa trên cấu hình `gridColumns`.

#### [MODIFY] [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/projects/page.tsx)
* Thay đổi: Áp dụng CSS class động chia cột dựa trên cấu hình `gridColumns`.

#### [MODIFY] [previews/PostsListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/PostsListPreview.tsx) (và các preview khác)
* Thay đổi: Cập nhật component render preview để hiển thị đúng số cột dựa trên tham số `gridColumns` truyền vào từ editor.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Cập nhật quản trị trung tâm `experiences/page.tsx`**:
   - Thêm state `localGridColumns`, binding vào UI, cập nhật hàm save.
2. **Cập nhật 6 trang editor chi tiết**:
   - Bổ sung trường cấu hình `gridColumns` và select UI hiển thị.
3. **Cập nhật các component Preview**:
   - Nhận prop `gridColumns` và áp dụng class grid động.
4. **Cập nhật 6 trang storefront thực tế**:
   - Thay các class Grid cứng bằng class động tuân thủ đúng quy tắc responsive của người dùng.
5. **Kiểm tra biên dịch**:
   - Chạy `bunx tsc --noEmit` để đảm bảo không phát sinh lỗi kiểu dữ liệu.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh biên dịch tĩnh TypeScript:
  `bunx tsc --noEmit`

### Manual Verification
1. Truy cập `http://localhost:3000/system/experiences`:
   - Chuyển sang tab "Cấu hình nhanh danh sách".
   - Kiểm tra xem có xuất hiện Segmented Control chọn 3 cột / 4 cột cho từng loại danh sách không.
   - Thử click nút bulk action "Tất cả 4 cột" và lưu lại.
2. Truy cập các trang storefront thực tế `/posts`, `/products`, `/projects`, `/resources` trên Desktop:
   - Xác nhận danh sách card hiển thị đúng 4 cột.
   - Thu nhỏ màn hình trình duyệt (chế độ Mobile/Tablet): Xác nhận danh sách hiển thị đúng 2 cột.
3. Thay đổi cấu hình sang 3 cột:
   - Xác nhận trên Desktop hiển thị 3 cột.
   - Trên Mobile hiển thị 1 cột, trên Tablet hiển thị 3 cột.

---

# VIII. Todo
- [ ] Cập nhật file quản trị trung tâm `app/system/experiences/page.tsx` hỗ trợ `gridColumns` và bulk actions.
- [ ] Cập nhật 6 trang editor chi tiết `/system/experiences/*` để bổ sung chọn cột.
- [ ] Cập nhật các component Preview để nhận diện và render theo `gridColumns`.
- [ ] Cập nhật class grid động ở các file storefront: `PostsPage.tsx`, `ProductsPage.tsx`, `ResourcesPage.tsx`, `CoursesPage.tsx`, `projects/page.tsx`.
- [ ] Chạy `bunx tsc --noEmit` để verify toàn bộ typecheck.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Cho phép chỉnh số cột (3 hoặc 4 cột) cho cả 6 loại danh sách ở trang cấu hình nhanh và trang editor chi tiết.
- Grid 4 cột: hiển thị 4 cột trên Desktop, 2 cột trên Mobile/Tablet.
- Grid 3 cột: hiển thị 3 cột trên Desktop/Tablet, 1 cột trên Mobile.
- Các thay đổi cấu hình được lưu thành công vào cơ sở dữ liệu và đồng bộ tức thì ra storefront.
- Typecheck thành công không lỗi.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi hiển thị CSS grid hoặc vỡ layout nếu class Tailwind không được biên dịch đúng hoặc ghi đè sai.
* **Hoàn tác**: Sử dụng `git checkout` để rollback các file storefront về trạng thái hoạt động tốt gần nhất.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi thiết kế layout Grid/Sidebar/List sang các dạng layout bento, magazine.
- Không thay đổi cấu hình trang chi tiết sản phẩm/bài viết.

---

# XII. Open Questions (Câu hỏi mở)
- *Không có câu hỏi mở nào.*
