# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề 1**: Trang chỉnh sửa khóa học bị lỗi giao diện (lỗi lồng thẻ `<button>` trong `<button>`). Lý do là thẻ đóng `</button>` của tab "Lộ trình học" bị đặt nhầm sau tab "Học viên", làm trình duyệt hiểu lầm và báo lỗi Console.
* **Vấn đề 2**: Nút chọn phần mềm hiện tại ở dạng Popup/Popover thô sơ và không đồng bộ với phong cách chung của website (trong khi các trang khác như cài đặt SEO sử dụng ô nhập dạng Tag đẹp mắt và tiện lợi hơn).
* **Giải pháp**: 
  1. Vá lỗi thẻ đóng `</button>` cho tab "Lộ trình học".
  2. Tạo mới một component `CourseFilterTagsInput` bắt chước phong cách Tag của SEO settings: hiển thị các phần mềm đã chọn như các thẻ badge nằm trong một hộp nhập liệu, nhấp vào ô nhập liệu sẽ xổ ra danh sách để tìm kiếm và chọn nhanh phần mềm có sẵn, có phân nhóm rõ ràng.

## 2. Elaboration & Self-Explanation
Khi Next.js render trang chỉnh sửa khóa học, nó gặp phải lỗi cấu trúc HTML không hợp lệ do cấu trúc tab lồng nhau:
```html
<button>Lộ trình học <button>Học viên</button></button>
```
Cấu trúc này làm vỡ DOM tree khi React cố gắng đồng bộ (hydration) giữa server và client, dẫn đến lỗi Console. Chúng ta sẽ cô lập và sửa lại thẻ đóng `</button>` đúng vị trí.

Đối với bộ lọc phần mềm (Filter values), giao diện cũ sử dụng một danh sách các badge nằm rời rạc bên trên và một nút bấm mở Popover ở dưới. Điều này làm tăng số lần nhấp chuột của quản trị viên và làm giao diện trông chắp vá. Chúng ta sẽ thay thế nó bằng một component `CourseFilterTagsInput` đồng bộ hóa với component `CategoryTagsInput` (ở [AdditionalCategoriesSelect.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/AdditionalCategoriesSelect.tsx)):
- Gom toàn bộ phần hiển thị badge và phần kích hoạt chọn vào trong một khung nhập liệu (box) duy nhất.
- Khi người dùng click vào box hoặc gõ tìm kiếm, một dropdown chứa các phần mềm có sẵn phân theo nhóm (ví dụ: Blender, AutoCAD, Revit...) sẽ hiện ra bên dưới.
- Người dùng có thể lọc nhanh phần mềm bằng cách gõ ký tự vào ô tìm kiếm, chọn bằng cách click và xóa bằng cách nhấn dấu `x` trên badge.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như khi bạn viết email, ô điền người nhận "To:" cho phép bạn gõ tên, hiện ra gợi ý từ danh bạ, và hiển thị các địa chỉ đã chọn thành các khối (tag) nhỏ có thể xóa nhanh bằng dấu `x`. Bạn không cần phải bấm một nút "Thêm người nhận" riêng để mở ra một hộp thoại checkbox phức tạp rồi mới chọn.
* **Hình ảnh tương đồng**: Giao diện cũ giống như việc bạn có một chiếc hộp trống và một nút bấm bên cạnh. Bấm nút mới mở ra ngăn kéo để chọn đồ bỏ vào hộp. Giao diện mới gộp luôn nút bấm và ngăn kéo vào trong chiếc hộp đó, bạn chỉ cần click trực tiếp vào hộp để chọn đồ.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx):
  - Lỗi cấu trúc tab nằm ở dòng 464-499. Tab "curriculum" bị thiếu thẻ đóng `</button>` ngay sau chữ "Lộ trình học", dẫn đến việc bao bọc luôn tab "students" bên trong nó.
  - Phần chọn bộ lọc cũ sử dụng component `Popover` và render danh sách badge rời rạc, làm phân tán trải nghiệm người dùng.
* Đã kiểm tra file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx):
  - Giao diện chọn bộ lọc phần mềm cũng sử dụng mô hình Popover checkbox rời rạc tương tự và cần được đồng bộ sang component mới.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Nguyên nhân gốc (Root Cause)
1. **Console Hydration Error**: Lỗi thẻ mở `<button>` không có thẻ đóng tương ứng ở tab "Lộ trình học", khiến cú pháp React JSX lồng thẻ con `<button>` (Học viên) vào bên trong thẻ cha `<button>` (Lộ trình học).
2. **UX Debt ở bộ lọc**: Thiết kế chọn bộ lọc khóa học bị tách biệt giữa khối hiển thị (badges) và khối hành động (button mở popover), làm giảm tính tinh gọn và tăng độ trễ tương tác.

### Giả thuyết đối chứng (Counter-Hypothesis)
* Liệu có phải lỗi do Shadcn Popover gây ra? Không, popover chỉ hiển thị lỗi nếu ta lồng các phần tử tương tác (như lồng `<Button>` vào trong `<PopoverTrigger>` mà không dùng thuộc tính `asChild`). Tuy nhiên, lỗi chính được React chỉ ra nằm chính xác ở dòng tab switcher (dòng 487).

---

# IV. Proposal (Đề xuất)

1. **Sửa lỗi cấu trúc JSX tab switcher**:
   - Chỉnh sửa [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx) dòng 485-499 để đóng thẻ `button` cho tab "Lộ trình học" trước khi mở tab "Học viên".
   
2. **Xây dựng component `CourseFilterTagsInput`**:
   - Tạo file [CourseFilterTagsInput.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/CourseFilterTagsInput.tsx) kế thừa logic của `CategoryTagsInput`.
   - Component này nhận vào danh sách các filter values hoạt động, nhóm chúng theo danh mục filter cha để hiển thị đẹp mắt trong danh sách gợi ý xổ xuống.
   - Hỗ trợ ô tìm kiếm nhanh (filter qua tên phần mềm).
   - Hiển thị badge có kèm icon nhỏ của phần mềm để đảm bảo tính trực quan sinh động.

3. **Thay thế và Tích hợp**:
   - Sử dụng component mới này thay thế cho cụm Popover cũ ở cả trang chỉnh sửa khóa học ([page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx)) và trang tạo khóa học ([page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx)).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Thêm mới**:
  - [CourseFilterTagsInput.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/CourseFilterTagsInput.tsx): Component giao diện nhập tag bộ lọc phần mềm mới.
* **Sửa đổi**:
  - [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx): Sửa lỗi thẻ button lồng nhau và thay đổi UI chọn bộ lọc phần mềm.
  - [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx): Thay đổi UI chọn bộ lọc phần mềm để đồng bộ giao diện.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Tạo component [CourseFilterTagsInput.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/CourseFilterTagsInput.tsx) có các chức năng tìm kiếm, phân nhóm theo filter cha, hiển thị badge phần mềm có icon và nút xóa.
2. **Bước 2**: Sửa lỗi cú pháp tab switcher trong [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx) dòng 487.
3. **Bước 3**: Tích hợp `CourseFilterTagsInput` vào tab "Thông tin chung" của trang edit khóa học.
4. **Bước 4**: Tích hợp `CourseFilterTagsInput` vào trang tạo khóa học.
5. **Bước 5**: Chạy `bunx tsc --noEmit` để xác thực toàn dự án không bị lỗi TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh `bunx tsc --noEmit` để đảm bảo biên dịch Next.js và Convex hoạt động hoàn hảo không bị lỗi type.

### Manual Verification
- Truy cập trang chỉnh sửa khóa học để kiểm tra xem lỗi console hydration đã biến mất.
- Kiểm tra hoạt động của ô chọn bộ lọc:
  - Hiển thị đầy đủ phần mềm đã chọn.
  - Nhấp vào ô nhập hiển thị danh sách gợi ý phân theo nhóm rõ ràng.
  - Tìm kiếm phần mềm hoạt động chính xác.
  - Xóa phần mềm bằng cách click dấu `x` trên badge hoặc chọn lại từ dropdown hoạt động bình thường.
  - Lưu lại khóa học thành công và dữ liệu phần mềm liên quan được cập nhật trên DB.

---

# VIII. Todo

- [ ] Sửa lỗi thẻ button lồng nhau tại [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx).
- [ ] Tạo file component [CourseFilterTagsInput.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/CourseFilterTagsInput.tsx).
- [ ] Tích hợp [CourseFilterTagsInput.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/CourseFilterTagsInput.tsx) vào trang chỉnh sửa khóa học.
- [ ] Tích hợp [CourseFilterTagsInput.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/CourseFilterTagsInput.tsx) vào trang tạo khóa học.
- [ ] Chạy kiểm thử tĩnh `bunx tsc --noEmit`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Không còn lỗi console `In HTML, <button> cannot be a descendant of <button>`.
* Giao diện chọn bộ lọc phần mềm hiển thị dạng TagInput đồng bộ với phong cách thiết kế của hệ thống.
* Việc thêm, xóa bộ lọc hoạt động mượt mà và lưu chính xác vào CSDL Convex khi nhấn nút lưu ở footer.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Lỗi TypeScript do kiểu dữ liệu của các filter values.
* **Hoàn tác**: Sử dụng `git checkout` để rollback về commit gần nhất nếu phát hiện lỗi nghiêm trọng.

---

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi schema của Convex hay cấu trúc của các bảng filter.
* Không thiết kế lại các tab khác ngoài tab Thông tin chung của Course.
