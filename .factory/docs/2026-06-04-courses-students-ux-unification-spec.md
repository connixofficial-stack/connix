# Spec - Đồng bộ hóa giao diện danh sách học viên khóa học (UX Unification)

# I. Primer

## 1. TL;DR kiểu Feynman
Trang web quản lý học viên hiện tại trông rất khác so với trang quản lý sản phẩm và bài viết (nó giống như một bức tranh tự vẽ vụng về đặt cạnh các bức tranh in máy chuyên nghiệp). Chúng ta sẽ thay đổi nó bằng cách sử dụng các "mảnh ghép" (components) có sẵn của hệ thống, thêm ô tìm kiếm học viên và các nút bấm chuyển trang để quản trị viên sử dụng dễ dàng và quen thuộc hơn.

## 2. Elaboration & Self-Explanation
Hiện nay, trang `/admin/courses/students` sử dụng một bảng HTML thô sơ tự viết thủ công (`table`, `tr`, `td`), không sử dụng các component UI chuẩn của Admin (như `Table`, `TableHeader`, `TableRow`, `TableCell` từ thư mục `components/ui`). Điều này dẫn đến sự không nhất quán về giao diện: khoảng cách padding lệch, màu sắc đường viền không đồng bộ, và đặc biệt là thiếu các tính năng cơ bản như:
- Tìm kiếm học viên theo Tên, Email, hoặc Số điện thoại.
- Phân trang động (chỉ đang hiển thị cứng 100 học viên đầu tiên bằng dòng thông báo thô sơ).
- Trạng thái học viên dùng thẻ `span` tự viết CSS thay vì dùng component `Badge` chuẩn hệ thống.

Chúng ta sẽ sửa đổi backend Convex (hàm API lấy danh sách học viên) để hỗ trợ tìm kiếm học viên và đếm tổng số bản ghi. Sau đó, refactor toàn bộ giao diện bảng học viên sang cấu trúc Table chuẩn, tích hợp ô tìm kiếm có bộ đệm (debounce) và thanh phân trang đồng nhất với trang sản phẩm/bài viết.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể trong dự án:** Trang quản lý sản phẩm `/admin/products` và trang bài viết `/admin/posts` đều hiển thị một bảng dữ liệu màu xám-trắng tinh tế, có ô tìm kiếm lớn ở góc trên bên trái, các bộ lọc trạng thái dạng dropdown ở góc phải, và thanh phân trang bên dưới cho phép chọn số lượng sản phẩm mỗi trang (12, 20, 30, ...). Trang học viên khóa học sẽ được mặc áo mới giống hệt như vậy.
- **Ví dụ đời thường:** Giống như một chuỗi cửa hàng tiện lợi, tất cả các quầy thanh toán đều phải xếp hàng và có máy quét mã vạch giống nhau. Quầy bán vé học viên hiện tại lại dùng một chiếc bàn gỗ cũ và tính tiền bằng sổ tay ghi tay, cần phải thay thế bằng quầy tiêu chuẩn của chuỗi.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Từ việc kiểm tra file [CourseStudentsPanel.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseStudentsPanel.tsx) và so sánh với [page.tsx (posts)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/posts/page.tsx), chúng tôi phát hiện:
1. **Thiếu thống nhất UI/UX:** `CourseStudentsPanel` sử dụng thẻ `table` thuần của HTML với class CSS thủ công như `divide-y divide-slate-100` thay vì component `Table` được tối ưu hóa hiển thị cho cả chế độ Dark Mode và Light Mode.
2. **Thiếu tính năng tìm kiếm:** Không có ô nhập dữ liệu tìm kiếm, khiến admin không thể tra cứu học viên cụ thể khi số lượng học viên tăng lên.
3. **Phân trang thô sơ:** Backend query chỉ trả về tối đa 100 học viên đầu tiên mà không cho phép phân trang (chuyển sang trang 2, trang 3).
4. **Badge trạng thái không nhất quán:** Trạng thái "Đang học" và "Đã thu hồi" dùng style `bg-emerald-50 text-emerald-700` cứng, không đồng bộ với component `Badge` có màu sắc biến thể chuẩn (`variant="success"`, `variant="secondary"`).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc:** Trang quản lý học viên là một tính năng được thêm vào sau, người viết code ban đầu đã code nhanh (mì ăn liền) bằng cách viết thẻ HTML thô thay vì tuân theo chuẩn **Convention over Configuration** và sử dụng lại các UI components đã đăng ký sẵn trong hệ thống Admin.
- **Giả thuyết đối chứng:** Nếu chúng ta chỉ sửa CSS của thẻ `table` thô cho giống màu, giao diện trông sẽ đỡ lệch nhưng vẫn thiếu các tính năng cốt lõi (Tìm kiếm, Phân trang) và khi có thay đổi thiết kế chung của hệ thống Admin (ví dụ đổi font, đổi border radius), trang này sẽ lại bị lệch và tạo ra nợ kỹ thuật (technical debt). Việc refactor toàn diện sang UI components dùng chung là giải pháp triệt để duy nhất.

---

# IV. Proposal (Đề xuất)

### a) Nâng cấp API Convex (`convex/courses.ts`):
- Cập nhật hàm query `listCourseStudentsAdmin`:
  - Nhận thêm tham số `search?: string` (tùy chọn).
  - Tăng `fetchLimit` lên tối đa `2000` khi tìm kiếm để filter trong JS trước khi phân trang, tránh scan toàn bộ bảng `customers`.
  - Trả về thêm trường `totalCount: number` để client biết tổng số học viên khớp bộ lọc.
  - Cập nhật định nghĩa `returns` của query tương ứng.

### b) Refactor Giao diện Panel Học viên (`app/admin/courses/components/CourseStudentsPanel.tsx`):
- Import các components UI chuẩn: `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`, `Badge`, `Input`, `Button`.
- Tích hợp ô Tìm kiếm (Search Input) có chức năng debounce (trễ 300ms) để không spam DB query.
- Thay thế bảng HTML thô bằng các Table components chuẩn.
- Thay thế span trạng thái bằng component `Badge` (Đang học: `variant="success"`, Đã thu hồi: `variant="secondary"`).
- Thêm thanh phân trang ở cuối Card với các tùy chọn số lượng bản ghi mỗi trang (10, 20, 30, 50, 100) và tính toán trang hiện tại, tổng số trang dựa trên `totalCount`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa:** [courses.ts (Convex)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courses.ts): Cập nhật tham số nhận vào, logic tìm kiếm/đếm và kiểu dữ liệu trả về cho query `listCourseStudentsAdmin`.
- **Sửa:** [CourseStudentsPanel.tsx (Admin Component)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseStudentsPanel.tsx): Thay thế table thô bằng component UI chuẩn, thêm thanh tìm kiếm học viên và cụm phân trang động.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1 (Backend):** Sửa đổi query Convex `listCourseStudentsAdmin` trong `convex/courses.ts` để hỗ trợ lọc tìm kiếm học viên (tên, email, phone) và đếm tổng số bản ghi.
2. **Bước 2 (Frontend):** Sửa đổi `CourseStudentsPanel.tsx`:
   - Khai báo state cho `searchTerm`, `debouncedSearchTerm`, `currentPage`, `pageSize`.
   - Viết hook `useEffect` để cập nhật `debouncedSearchTerm` sau 300ms.
   - Gọi query Convex truyền thêm các tham số `search`, `limit`, `offset` (tính từ `currentPage` và `pageSize`).
   - Viết giao diện thanh tìm kiếm và bộ lọc trạng thái đặt trong phần header.
   - Refactor bảng hiển thị học viên bằng `Table` components hệ thống.
   - Viết giao diện phân trang (Pagination) ở cuối bảng giống hệt pattern trong trang sản phẩm.
3. **Bước 3 (Review tĩnh):** Kiểm tra kiểu dữ liệu, các edge case (không có học viên, đang tải dữ liệu).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests / Compile Checks
- Kiểm tra compile bằng cách chạy thử hoặc build tĩnh thông qua hệ thống commit hook của dự án.

### Manual Verification (Kiểm chứng thủ công trên giao diện)
1. Mở trang `/admin/courses/students` trên trình duyệt.
2. Kiểm tra xem giao diện bảng học viên có đồng bộ hoàn toàn về mặt mỹ thuật (font, border, shadow, hover row) với trang `/admin/products` hay không.
3. Nhập từ khóa tìm kiếm vào ô Search (ví dụ: tên học viên, email hoặc số điện thoại), đợi 300ms xem danh sách học viên cập nhật chính xác hay không.
4. Thay đổi số lượng học viên hiển thị trên mỗi trang (ví dụ chọn 10, 20) và bấm chuyển sang trang sau, kiểm tra xem dữ liệu được phân trang đúng hay không.
5. Kiểm tra badge trạng thái hiển thị đúng màu (xanh lá cho Đang học, xám cho Đã thu hồi).

---

# VIII. Todo

- [ ] Cập nhật query `listCourseStudentsAdmin` trong [courses.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courses.ts).
- [ ] Thay đổi giao diện và thêm các tính năng Search, Phân trang, UI Table trong [CourseStudentsPanel.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseStudentsPanel.tsx).

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [ ] Bảng danh sách học viên khóa học sử dụng hoàn toàn Table UI components chuẩn của Admin.
- [ ] Tích hợp ô Tìm kiếm học viên theo tên/email/phone hoạt động chính xác với debounce.
- [ ] Có thanh Phân trang đầy đủ tính năng: chọn size trang, tổng số học viên khớp bộ lọc, nút chuyển trang trước/sau.
- [ ] Trạng thái của học viên hiển thị dưới dạng `Badge` component chuẩn.
- [ ] Không còn thông báo cứng "Đang hiển thị 100 học viên đầu tiên".

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Khi số lượng học viên cực kỳ lớn (vượt quá 2000), việc filter bằng JS ở query Convex có thể bị chậm. Tuy nhiên, trong thực tế quản trị khóa học của studio, số lượng học viên active/revoked thường nằm trong khoảng vài trăm tới tối đa 1000, do đó mức giới hạn `2000` là rất an toàn và đảm bảo tốc độ phản hồi nhanh (<100ms).
- **Hoàn tác:** Nếu gặp lỗi, ta chỉ cần sử dụng `git checkout` để khôi phục lại 2 file bị ảnh hưởng về trạng thái trước đó.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi schema cơ sở dữ liệu (Database Schema) của bảng `courseStudents` hay `customers`.
- Không bổ sung thêm các tính năng xuất/nhập Excel cho học viên hay gửi email hàng loạt trong phạm vi task này.
