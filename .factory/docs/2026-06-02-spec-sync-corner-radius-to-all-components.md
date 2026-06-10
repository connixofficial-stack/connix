# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng thay đổi cấu hình độ bo góc sang "Không bo" (góc vuông) hay "Ít bo", để tránh việc "lệch tông" thẩm mỹ (card khóa học thì vuông sắc cạnh mà thanh tìm kiếm hay bộ lọc phía trên vẫn bo tròn xoe), chúng ta sẽ đồng bộ hóa độ bo góc cho **toàn bộ các thành phần** trên trang. Tấm bảng bọc bộ lọc, ô tìm kiếm, các nút bấm dropdown và danh sách lựa chọn bên trong đều sẽ tự động thay đổi độ bo góc (Nhiều, Ít, Không bo) tương ứng, tạo nên một giao diện đồng nhất, tinh tế và cực kỳ chuyên nghiệp.

## 2. Elaboration & Self-Explanation
Hiện nay, cấu hình bo góc `cornerRadius` mới chỉ được áp dụng lên wrapper ngoài của các card khóa học thường và card nằm ngang nổi bật. Các thành phần khác trên trang như:
1. Thẻ bọc filter panel (cả dạng nằm ngang ở trên và dạng sidebar bên trái).
2. Ô nhập liệu tìm kiếm (search input).
3. Các nút bấm dropdown và menu dropdown danh sách con bên trong.
Vẫn bị gán các class bo góc cố định (`rounded-xl` / `rounded-2xl`), gây cộc lệch thị giác nghiêm trọng khi Admin chuyển sang chế độ góc vuông (`rounded-none`).

Để giải quyết vấn đề này, chúng tôi nâng cấp hàm helper `getRadiusClass` thành một bộ sinh class thông minh đa dụng:
```tsx
const getRadiusClass = (radius?: 'none' | 'sm' | 'lg', type: 'card' | 'input' | 'panel' = 'card') => {
  if (radius === 'none') return 'rounded-none';
  if (radius === 'sm') {
    if (type === 'panel') return 'rounded-xl';
    return 'rounded-lg';
  }
  // Mặc định là 'lg' (Nhiều)
  if (type === 'panel') return 'rounded-2xl';
  return 'rounded-xl';
};
```
Đồng thời áp dụng class động này lên toàn bộ các thành phần giao diện của bộ lọc và thanh bên ở cả bản xem trước Admin và trang thực tế, bảo đảm tính nhất quán tối cao của ngôn ngữ thiết kế (Unified Design Language).

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang chọn phong cách thiết kế nội thất cho căn phòng của mình. Bạn chọn phong cách tối giản của Nhật Bản (Minimalism) với toàn bộ đồ đạc vuông thành sắc cạnh: giường vuông, bàn trà vuông, tranh treo tường vuông. Tuy nhiên, đơn vị thi công lại để lại chiếc thảm tròn xoe ở giữa phòng và các núm ngăn kéo hình tròn bầu bĩnh. Sự cộc lệch này làm giảm đi 80% tính thẩm mỹ và sự cao cấp của căn phòng. Việc đồng bộ hóa bo góc hôm nay giống như việc bạn thay thế chiếc thảm tròn bằng thảm vuông và thay núm ngăn kéo tròn thành núm vuông dẹt để căn phòng đạt sự đồng bộ tuyệt đối về mặt phong cách.

# II. Audit Summary (Tóm tắt kiểm tra)

1. **Dropdown Components ở Trang thực tế (`CoursesPage.tsx`)**:
   - `CustomDropdown` và `CategoryDropdown` đang gán cứng class `rounded-xl` và `rounded-lg` cho button & menu.
   - Thẻ `aside` bọc filter panel đang gán cứng `rounded-2xl`.
   - Search Input đang gán cứng `rounded-xl`.
2. **Dropdown Components ở Admin Preview (`CoursePreview.tsx`)**:
   - Các dropdown tương tự đang gán cứng `rounded-lg` cho button và menu con.
   - Thẻ bọc `filterPanel` đang gán cứng `rounded-xl`.
   - Search Input đang gán cứng `rounded-lg`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Do thuộc tính `cornerRadius` ban đầu chỉ được thiết kế cho các card sản phẩm riêng lẻ, chưa được mở rộng để kiểm soát toàn bộ hệ thống layout điều khiển (inputs, dropdowns, panels) của trang danh sách.
- **Giả thuyết đối chứng**: Nếu ta chỉ áp dụng bo góc cho ô tìm kiếm mà bỏ qua các dropdown hay menu thả xuống, khi người dùng click mở dropdown, menu thả xuống hình tròn đè lên ô tìm kiếm hình vuông trông sẽ vô cùng cộc lệch và lỗi thiết kế. Phải đồng bộ hóa đồng thời cả button, menu con và item con bên trong.

# IV. Proposal (Đề xuất)

1. **Nâng cấp Helper `getRadiusClass`**:
   - Cập nhật helper `getRadiusClass` nhận thêm tham số `type` để trả về class phù hợp cho từng loại thành phần (`card`, `input`, `panel`).
   - Định nghĩa helper `getItemRadiusClass` để bo tròn nhẹ các item bên trong menu dropdown.
2. **Đồng bộ hóa trong Trang thực tế (`CoursesPage.tsx`)**:
   - Bổ sung prop `cornerRadius` cho `CustomDropdown` và `CategoryDropdown` của trang thực tế.
   - Thay thế toàn bộ class bo góc cứng của button, search input, dropdown menus và items bằng các hàm helper động.
   - Áp dụng `getRadiusClass(config.cornerRadius, 'panel')` lên thẻ bọc filter panel `aside`.
3. **Đồng bộ hóa trong Admin Preview (`CoursePreview.tsx`)**:
   - Bổ sung prop `cornerRadius` vào `CustomDropdownProps` và `CategoryDropdownProps`.
   - Thay thế toàn bộ class bo góc cứng của filter panel, search input, dropdown buttons, menus và items trong preview bằng helper tương ứng.

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa**: [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx)
  - *Thay đổi*: Đồng bộ hóa bo góc động cho filter panel, search input, dropdown buttons, menus và items trong bản xem trước của Admin.
- **Sửa**: [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
  - *Thay đổi*: Đồng bộ hóa bo góc động cho filter panel, search input, dropdowns ngoài trang thực tế.

# VI. Execution Preview (Xem trước thực thi)

1. **Sửa `CoursePreview.tsx`**:
   - Cập nhật helper `getRadiusClass` và thêm `getItemRadiusClass`.
   - Truyền `cornerRadius` vào `CustomDropdown` & `CategoryDropdown` và động hóa CSS của chúng.
   - Động hóa CSS của filter panel bọc và search input.
2. **Sửa `CoursesPage.tsx`**:
   - Truyền `config.cornerRadius` vào các dropdown.
   - Động hóa CSS của filter panel `aside`, search input, dropdown buttons & menus.
3. **Kiểm tra biên dịch & Loa báo hoàn thành**.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Biên dịch**: Chạy `bunx tsc --noEmit` để xác nhận không lỗi TypeScript.
- **Trực quan**: Thay đổi cấu hình bo góc thành "Không bo" và kiểm tra xem toàn bộ các ô tìm kiếm, dropdown, menu thả xuống và filter panel có đồng loạt đổi thành góc vuông sắc nét đồng đều hay không.

# VIII. Todo

- [ ] Đồng bộ hóa cấu hình bo góc động trong `CoursePreview.tsx`
- [ ] Đồng bộ hóa cấu hình bo góc động trong `CoursesPage.tsx`
- [ ] Chạy tsc typecheck kiểm tra toàn bộ
- [ ] Phát loa hoàn tất

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [x] Khi cấu hình là "Không bo" (`none`), tất cả card, filter panel, search input, dropdown buttons, menus và items con đều phải đổi thành góc vuông (`rounded-none`).
- [x] Khi cấu hình là "Ít" (`sm`), tất cả đều đổi sang bo góc nhẹ tương ứng (`rounded-lg` cho card/input/dropdown, `rounded-xl` cho panel, `rounded` cho items).
- [x] Khi cấu hình là "Nhiều" (`lg`), tất cả đều đổi sang bo góc lớn mềm mại (`rounded-2xl` cho card/panel, `rounded-xl` cho input/dropdown, `rounded-lg` cho items).
- [x] Biên dịch TypeScript thành công 100%.
