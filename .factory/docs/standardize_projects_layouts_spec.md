# I. Primer

## 1. TL;DR kiểu Feynman
Trang danh sách dự án (`/projects`) đang có sự không đồng bộ trong cách hoạt động của 3 kiểu hiển thị (Grid, Sidebar, List). Ví dụ: ở kiểu "Grid" thì biến mất hẳn bộ lọc Danh mục trên máy tính; còn ở kiểu "List" thì tự dưng lại xuất hiện thanh bên (Sidebar) chiếm diện tích dù không cần thiết. Để giải quyết, ta sẽ tổ chức lại:
- Kiểu **Grid** & **List**: Bộ lọc danh mục được đưa lên thanh ngang phía trên (dạng danh sách lựa chọn thả xuống - dropdown), không dùng thanh bên.
- Kiểu **Sidebar**: Danh mục được đưa vào thanh bên dọc bên trái, thanh ngang phía trên chỉ giữ ô tìm kiếm và bộ lọc sắp xếp để tránh dư thừa.
- Ở **Điện thoại (Mobile)**: Cả 3 kiểu đều dùng chung nút bấm mở bộ trượt đáy (Bottom Sheet) để chọn danh mục mượt mà.

## 2. Elaboration & Self-Explanation
Hiện tại trong cấu hình hệ thống, người dùng có thể cấu hình layout hiển thị cho trang danh sách dự án thông qua 3 kiểu layout chính: `grid`, `sidebar` và `list`. Tuy nhiên, code hiện tại ở [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx) đang tự xử lý logic bố cục theo cách không nhất quán với trang bài viết (`posts`):
- Layout `grid` chỉ hiển thị ô tìm kiếm và bộ lọc sắp xếp trên thanh Desktop Toolbar, làm người dùng Desktop không có cách nào lọc theo danh mục.
- Layout `list` lại render cả thanh bên lọc danh mục, thay vì hiển thị dạng rộng tràn trang với thanh bộ lọc ngang trên đầu như layout `grid`.

Giải pháp là đồng bộ hóa hành vi hiển thị bộ lọc danh mục:
- Tách `desktopToolbar` hiện tại thành hàm `renderDesktopToolbar(showCategorySelect: boolean)`.
- Khi `showCategorySelect` là `true` (dành cho layout `grid` và `list`), render thêm một thẻ `<select>` chứa danh sách các danh mục dự án ngay cạnh ô tìm kiếm.
- Điều chỉnh hàm `renderContent()` của trang `/projects` chia thành 3 nhánh xử lý rõ rệt cho 3 layout, đảm bảo layout `list` không hiển thị thanh bên `sidebarFilter` nữa mà hiển thị giống layout `grid` nhưng sử dụng card nằm ngang `ListCard` thay vì `GridCard`.

## 3. Concrete Examples & Analogies
Giống như việc sắp xếp nội thoát trong một siêu thị:
- Kiểu **Grid (Kệ mở)**: Tất cả sản phẩm xếp theo ô vuông, bảng phân loại treo ngay phía trên kệ để khách dễ chọn nhóm hàng.
- Kiểu **Sidebar (Khu vực chuyên biệt)**: Có một dãy hành lang phân loại ở bên trái dẫn vào các gian hàng bên phải. Trên kệ bên phải chỉ cần ghi thông tin tìm kiếm/giá cả của gian hàng đó.
- Kiểu **List (Bảng danh sách)**: Các sản phẩm được liệt kê theo hàng dài xếp từ trên xuống dưới, bảng phân loại cũng treo ngay phía trên đầu để người dùng dễ nhìn.
Việc bố trí lộn xộn (ví dụ kệ mở nhưng lại bắt đi vòng sang lối đi bên trái mới chọn được danh mục) làm trải nghiệm người dùng bị đứt gãy.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **File kiểm tra:** [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)
- **Hành vi hiện tại:**
  - `layoutStyle === 'grid'`: Không có select dropdown để lọc danh mục trên Desktop.
  - `layoutStyle === 'list'`: Hiển thị `sidebarFilter` bên trái và danh sách card dòng ngang bên phải.
  - `layoutStyle === 'sidebar'`: Hiển thị `sidebarFilter` bên trái và danh sách card dạng lưới bên phải.
- **Hành vi mong muốn:**
  - `grid` và `list` không dùng sidebar dọc, đưa category filter lên toolbar ngang trên đầu dạng dropdown `<select>`.
  - `sidebar` dùng sidebar dọc bên trái làm bộ lọc category, toolbar ngang bên phải không hiển thị select category nữa.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc:** Logic phân chia render của 3 layout trong hàm `renderContent()` của [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx) đang gộp chung layout `sidebar` và `list` vào cùng một cấu trúc return có chứa `{sidebarFilter}`, trong khi layout `grid` lại bị tách riêng và thiếu đi select dropdown chọn danh mục trên Desktop Toolbar.
- **Giả thuyết đối chứng:** Nếu ta tách biệt hoàn toàn 3 khối logic render cho `grid`, `list`, và `sidebar` trong `renderContent()`, đồng thời truyền tham số điều khiển việc hiển thị dropdown category select vào toolbar ngang, bố cục của trang `/projects` sẽ trở nên hoàn toàn nhất quán với trang `/posts` và giải quyết được vấn đề thiếu bộ lọc danh mục ở layout `grid` trên Desktop.

---

# IV. Proposal (Đề xuất)

1. Thay thế biến `desktopToolbar` bằng hàm `renderDesktopToolbar(showCategorySelect: boolean)` hỗ trợ hiển thị dropdown chọn danh mục khi `showCategorySelect` là `true`.
2. Sửa đổi logic render trong `renderContent()` thành 3 nhánh `if` rõ ràng tương ứng với 3 giá trị của `layoutStyle`:
   - `grid`: Gọi `renderDesktopToolbar(true)`, không render `sidebarFilter`, render `GridCard` dạng lưới.
   - `list`: Gọi `renderDesktopToolbar(true)`, không render `sidebarFilter`, render `ListCard` dạng hàng dọc.
   - `sidebar`: Render layout flex 2 cột, cột trái là `sidebarFilter`, cột phải chứa `renderDesktopToolbar(false)` và `GridCard` dạng lưới.
3. Giữ nguyên bộ lọc Bottom Sheet ở mobile hoạt động đồng nhất cho cả 3 layout.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)
- **Vai trò hiện tại:** Trang public hiển thị danh sách các dự án (portfolio) của hệ thống.
- **Thay đổi:** Tách biến `desktopToolbar` thành hàm `renderDesktopToolbar(showCategorySelect)`, cập nhật hàm `renderContent()` để phân tách render 3 layout rõ ràng và đồng bộ hóa bố cục lọc danh mục.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc kỹ file [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx) để xác định vị trí của `desktopToolbar` và `renderContent()`.
2. Dùng công cụ `replace_file_content` hoặc `multi_replace_file_content` để thay thế `desktopToolbar` và chỉnh sửa hàm `renderContent()`.
3. Chạy `bunx tsc --noEmit` để đảm bảo không có lỗi type compile TypeScript.
4. Git commit thay đổi kèm file spec này.
5. Phát âm báo hoàn thành "Done, Sir."

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh kiểm tra biên dịch dự án:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

### Manual Verification
- Kiểm tra trực quan trên trình duyệt (tester/user thực hiện):
  - Khi cấu hình layout là `grid`: Trang hiển thị toolbar có ô Tìm kiếm, dropdown Danh mục, dropdown Sắp xếp. Không có sidebar bên trái.
  - Khi cấu hình layout là `list`: Trang hiển thị giống layout `grid` nhưng các dự án hiển thị dạng card dòng ngang (`ListCard`). Không có sidebar bên trái.
  - Khi cấu hình layout là `sidebar`: Trang hiển thị thanh bên lọc danh mục ở bên trái. Vùng bên phải hiển thị toolbar chỉ có Tìm kiếm & Sắp xếp, phía dưới là grid các dự án.

---

# VIII. Todo

- [ ] Sửa đổi [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx) để định nghĩa `renderDesktopToolbar` và tổ chức lại `renderContent`.
- [ ] Chạy kiểm tra compile TypeScript.
- [ ] Thực hiện Git commit lưu trữ thay đổi.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Layout `grid` trên Desktop có dropdown lọc danh mục hiển thị trên thanh công cụ ngang.
2. Layout `list` trên Desktop không hiển thị sidebar lọc danh mục dọc bên trái, thay vào đó hiển thị dropdown lọc danh mục trên thanh công cụ ngang giống layout `grid`.
3. Layout `sidebar` giữ nguyên sidebar lọc danh mục dọc bên trái, thanh công cụ bên phải chỉ chứa ô Tìm kiếm và Sắp xếp (không hiển thị dropdown lọc danh mục dư thừa).
4. Cả 3 layout biên dịch thành công không gây lỗi TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Lỗi import hoặc sai lệch type khi map dữ liệu từ list config.
- **Hoàn tác:** Dùng `git restore app/(site)/projects/page.tsx` để quay lại trạng thái trước khi sửa đổi.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa database schema của dự án.
- Không thay đổi thiết kế của trang chi tiết dự án.
- Không thay đổi code của các module khác như `products`, `posts`.
