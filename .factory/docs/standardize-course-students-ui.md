# Thiết kế lại trang Học viên Khóa học đồng bộ với hệ thống Admin

# I. Primer

## 1. TL;DR kiểu Feynman
Trang web quản lý học viên hiện tại giống như một căn phòng được thiết kế bằng một phong cách hoàn toàn khác biệt so với các căn phòng còn lại trong ngôi nhà Admin. Nó sử dụng khoảng cách quá rộng, thiếu chìa khóa bảo mật để vào cửa (`ModuleGuard`), các nút bấm và ô chọn kích thước không đều nhau tạo cảm giác lệch lạc, và khi tải dữ liệu thì chỉ có vòng quay tròn xoay xoay thô sơ thay vì bộ xương giả lập bảng (`Skeleton`) nhấp nháy mượt mà như các trang khác. Chúng ta sẽ "khoác áo mới" cho căn phòng này: thêm chìa khóa bảo mật, sửa lại kích thước các ô lọc cho bằng nhau, thay thế các ô số thống kê thô sơ thành các ô có biểu tượng (Icon) sinh động và hiệu ứng nhấp nháy khi tải, và thay vòng quay tải dữ liệu bằng các hàng bảng giả lập chuẩn mực.

## 2. Elaboration & Self-Explanation
Để đưa trang quản lý học viên về đúng chuẩn thiết kế chung của hệ thống Admin Dohy Studio, chúng ta cần phân tích cấu trúc của các trang quản trị chuẩn (như Quản lý khóa học, Quản lý bài viết) và áp dụng các mẫu thiết kế (Design Patterns) đó vào trang học viên.

Các điểm không đồng bộ chính bao gồm:
- **Bảo mật phân quyền:** Trang học viên chưa được bọc trong `<ModuleGuard>` của module `courses`.
- **Cấu trúc trang (Layout):** Khoảng cách dọc đang là `space-y-6 pb-20` (quá thưa thớt) thay vì `space-y-4` tiêu chuẩn. Mô tả chữ nhỏ bị thiếu lớp màu cho chế độ tối (Dark mode).
- **Bộ lọc tìm kiếm:** Nút "Xóa lọc" sử dụng kích thước nhỏ (`size="sm"` tương đương chiều cao `h-9`) trong khi ô chọn trạng thái (select box) và ô tìm kiếm đều cao `h-10`. Điều này làm lệch hàng ngang của bộ lọc.
- **Card Thống kê:** 3 khối thống kê (Học viên, Tiến độ, Đã hoàn thành) được dựng thô sơ bằng `CardContent p-4` thô ráp, thiếu các Icon minh họa trực quan và thiếu hiệu ứng nhấp nháy (`animate-pulse`) khi đang tải dữ liệu từ server.
- **Bảng và Trải nghiệm Tải dữ liệu (Loading UX):** Hiện tại bảng được bọc qua nhiều lớp thẻ div (`CardContent p-0` và `overflow-x-auto`) không cần thiết vì bản thân component `<Table>` đã hỗ trợ cuộn ngang sẵn. Khi dữ liệu đang tải, trang hiển thị một spinner quay tròn lớn nằm cô độc, làm gián đoạn bố cục bảng. Các trang chuẩn khác đều dựng sẵn khung bảng và render các hàng giả lập (skeleton rows) nhấp nháy để tạo cảm giác phản hồi nhanh và mượt mà hơn.

Chúng ta sẽ xử lý triệt để tất cả các vấn đề trên bằng cách viết lại cấu trúc file trang và component hiển thị danh sách học viên.

## 3. Concrete Examples & Analogies
- **Ví dụ về lệch UI:** Hãy tưởng tượng bạn xếp một chiếc hộp cao 10cm ngay cạnh một chiếc hộp cao 9cm trên cùng một mặt bàn phẳng, bạn sẽ lập tức nhận ra vết gồ ghề lệch lạc ở mép trên của chúng. Đó chính là những gì đang xảy ra với ô Chọn trạng thái (`h-10`) và nút Xóa lọc (`size="sm"` -> `h-9`). Khi ta bỏ `size="sm"` ở nút Xóa lọc, nó sẽ tự động trở về chiều cao mặc định `h-10` và thẳng hàng tăm tắp với ô Chọn trạng thái.
- **Ví dụ về Loading UX:** Khi bạn vào một nhà hàng, thay vì nhân viên bảo bạn "vui lòng đợi" và để bạn nhìn vào bức tường trống (tương ứng với Loading Spinner quay tròn), họ đưa cho bạn một thực đơn tạm thời và chỉ cho bạn thấy bố cục bàn ăn sẽ được dọn ra thế nào (tương ứng với Loading Skeleton). Việc hiển thị skeleton giúp người dùng biết cấu trúc dữ liệu sắp xuất hiện ở đâu, giảm cảm giác phải chờ đợi lâu.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Đường dẫn tệp tin:** 
  - Trang chính: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/students/page.tsx)
  - Component hiển thị: [CourseStudentsPanel.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseStudentsPanel.tsx)
- **Tình trạng kiểm tra:**
  - `page.tsx` sử dụng bố cục thô sơ, thiếu lớp bảo vệ `ModuleGuard`.
  - `CourseStudentsPanel.tsx` có các khối thống kê thiết kế đơn giản, bộ lọc bị lệch kích cỡ nút bấm, và phương thức loading chưa đồng bộ với skeleton của các trang thực thể khác.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

Trước khi đi đến nguyên nhân gốc, ta trả lời 5/8 câu hỏi cốt lõi:
1. **Triệu chứng quan sát được là gì?**
   - Trang `/admin/courses/students` có khoảng cách thưa thớt, không có guard bảo mật, nút Xóa lọc thấp hơn select box bên cạnh, các card thống kê thiếu icon sinh động, và bảng hiển thị spinner xoay tròn đơn giản thay vì skeleton rows như các trang quản lý khác.
2. **Có tái hiện ổn định không?**
   - Có, truy cập trực tiếp URL trang trên localhost luôn quan sát thấy các hiện tượng này.
3. **Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?**
   - Giả thuyết thay thế: Chỉ sửa style ở `page.tsx` và giữ nguyên component `CourseStudentsPanel`. Tuy nhiên, giả thuyết này bị loại bỏ vì các vấn đề về card thống kê, skeleton loading và nút lọc bị lệch đều nằm bên trong component `CourseStudentsPanel.tsx`. Do đó bắt buộc phải sửa cả hai file.
4. **Rủi ro nếu sửa sai nguyên nhân là gì?**
   - Rủi ro rất thấp, chủ yếu liên quan đến hiển thị sai lệch giao diện hoặc thiếu import biểu tượng từ `lucide-react`.
5. **Tiêu chí pass/fail sau khi sửa?**
   - **Pass:** Trang học viên hiển thị thống nhất với các trang admin khác: nút lọc cao bằng nhau, card thống kê có icon premium màu sắc hài hòa và có loading skeleton riêng, bảng hiển thị hàng skeleton nhấp nháy khi tải dữ liệu, trang được bảo vệ bởi `ModuleGuard`.
   - **Fail:** Giao diện vẫn lệch kích thước nút lọc, lỗi import icon, hoặc lỗi compile TypeScript.

---

# IV. Proposal (Đề xuất)

Chúng ta sẽ tiến hành nâng cấp toàn diện giao diện trang học viên thông qua các bước cụ thể:

### 1. Nâng cấp trang chính `page.tsx`
- Bọc toàn bộ nội dung trong `<ModuleGuard moduleKey="courses">`.
- Đổi container chính thành `space-y-4` và loại bỏ `pb-20`.
- Đồng bộ hóa class cho tiêu đề nhỏ hỗ trợ cả chế độ tối: `text-sm text-slate-500 dark:text-slate-400`.

### 2. Thiết kế lại `CourseStudentsPanel.tsx`
- **Card Thống Kê Premium:**
  - Sử dụng biểu tượng `Users` (xanh dương) cho Học viên, `TrendingUp` (xanh lá) cho Tiến độ trung bình, và `Award` (vàng hổ phách) cho Đã hoàn thành.
  - Tích hợp hiệu ứng skeleton nhấp nháy cho giá trị số trong card khi dữ liệu đang tải (`result === undefined`).
- **Khắc phục lệch nút bộ lọc:**
  - Bỏ `size="sm"` tại nút "Xóa lọc" để nó cao `h-10` bằng với select box.
- **Loading Skeleton cho Bảng:**
  - Loại bỏ spinner quay tròn (`Loader2` spinner).
  - Loại bỏ các thẻ div bọc ngoài bảng không cần thiết (`CardContent p-0` và `overflow-x-auto` lồng nhau).
  - Dựng cấu trúc bảng tĩnh, và khi `result === undefined`, render 5 hàng dữ liệu giả lập (skeleton rows) nhấp nháy mượt mà.
  - Xử lý render hàng thông báo trống khi dữ liệu đã tải xong và danh sách trống.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### a) [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/students/page.tsx)
- *Vai trò hiện tại:* Định nghĩa trang học viên khóa học, import panel hiển thị học viên.
- *Thay đổi:* Thêm `ModuleGuard` bọc trang, chuẩn hóa layout `space-y-4`, điều chỉnh class màu sắc phụ đề tương thích dark mode.

### b) [CourseStudentsPanel.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseStudentsPanel.tsx)
- *Vai trò hiện tại:* Chứa logic truy vấn học viên từ Convex và hiển thị bảng kèm bộ lọc và 3 khối thống kê.
- *Thay đổi:* Tải thêm icon từ `lucide-react`, thiết kế lại 3 card thống kê với icon màu sắc, chuẩn hóa kích thước nút Xóa lọc, loại bỏ spinner và thay thế bằng skeleton table rows khi tải dữ liệu, tối ưu hóa cấu trúc DOM của bảng trong Card.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc kỹ hai file nguồn để định vị chính xác vị trí thay đổi.
2. Thực hiện sửa đổi tệp `page.tsx` trước để bọc `ModuleGuard` và chuẩn hóa khoảng cách.
3. Thực hiện sửa đổi tệp `CourseStudentsPanel.tsx` để tối ưu hóa thiết kế card thống kê, nút bấm bộ lọc, và skeleton loading.
4. Tự review tĩnh mã nguồn sau khi sửa để đảm bảo không bị thiếu thẻ đóng hoặc lỗi type TypeScript.
5. Kích hoạt thông báo hoàn thành task bằng giọng nói.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Do quy tắc nghiêm cấm tự chạy build/lint, việc kiểm tra lỗi biên dịch sẽ được thực hiện gián tiếp qua hệ thống staged hooks khi commit hoặc dev server chạy ngầm.

### Manual Verification
- Người dùng truy cập trang `http://localhost:3000/admin/courses/students` và thực hiện:
  - Kiểm tra xem trang có hiển thị mượt mà không bị lệch nút bộ lọc nữa không.
  - Quan sát 3 card thống kê mới có icon đẹp mắt và có hiệu ứng nhấp nháy khi tải không.
  - Khi tải trang hoặc đổi bộ lọc, quan sát xem bảng hiển thị các hàng skeleton nhấp nháy thay vì spinner xoay tròn hay không.
  - Kiểm tra xem giao diện có hiển thị tốt trên cả Light mode và Dark mode hay không.

---

# VIII. Todo

- [ ] Sửa [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/students/page.tsx) để thêm `ModuleGuard` và chuẩn hóa header layout.
- [ ] Sửa [CourseStudentsPanel.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseStudentsPanel.tsx) để nâng cấp Card thống kê, nút Xóa lọc, và thêm table skeleton rows.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Giao diện nút bấm và select box của bộ lọc thẳng hàng, có cùng chiều cao (`h-10`).
- 3 Card thống kê có các biểu tượng trực quan, màu sắc hài hòa và hiển thị skeleton nhấp nháy khi đang tải.
- Bảng hiển thị 5 hàng skeleton nhấp nháy lúc tải dữ liệu. Bố cục bảng nằm trực tiếp trong Card và cuộn ngang mượt mà.
- Trang được bảo vệ bởi guard phân quyền `ModuleGuard`.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro rất thấp do đây chỉ là các thay đổi liên quan đến UI/UX hiển thị, không làm thay đổi luồng dữ liệu hay logic nghiệp vụ của Convex.
- Để hoàn tác, ta chỉ cần sử dụng lệnh `git checkout` đối với hai file bị sửa đổi.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi API truy vấn dữ liệu Convex `api.courses.listCourseStudentsAdmin`.
- Không thay đổi logic phân trang, logic tìm kiếm hay xử lý dữ liệu học viên trên server.

---

# XII. Open Questions (Câu hỏi mở)

*Không có.*
