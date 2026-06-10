# I. Primer

## 1. TL;DR kiểu Feynman
Người dùng đã phát hiện ra rằng giao diện xem trước (Preview) trong trang quản trị Admin và giao diện trang web thực tế của học viên trông chưa hoàn toàn giống nhau. Để giải quyết việc này, chúng ta sẽ thực hiện một cuộc "đồng bộ hóa" toàn diện: thay đổi bo góc của các ô từ sắc nhọn (`rounded-xl`) sang bo tròn mềm mại (`rounded-2xl`), tăng khoảng đệm lề cho thoáng (`p-5`), thêm phần giới thiệu ngắn và tên giáo viên giống hệt trang thực tế, đồng thời gỡ bỏ chiếc nút "Xem khóa học" thừa thãi ở các ô thường để hai bên khớp nhau 100%.

## 2. Elaboration & Self-Explanation
Hiện tại, đang tồn tại những điểm không nhất quán (nợ kỹ thuật visual) giữa component xem trước `CoursePreview.tsx` và trang thực tế `CoursesPage.tsx`:
1. **Thiếu trường dữ liệu**: Mock data trong `CoursePreview.tsx` thiếu trường mô tả ngắn (`excerpt`) và tên giáo viên (`instructorName`), dẫn đến giao diện xem trước trông trống trải và thiếu thông tin.
2. **Sai lệch cấu trúc Card thường**: Card thường trong Preview hiển thị nút bấm "Xem khóa học" chật chội ở góc dưới bên phải, trong khi trang thực tế chỉ hiển thị dòng học phí đơn giản.
3. **Sai lệch Spacing & Bo góc**: Preview đang dùng bo góc `rounded-xl` và đệm lề `p-4`, trong khi trang thực tế dùng bo góc hiện đại `rounded-2xl` và đệm lề `p-5`.
4. **Tiêu đề lớn không nhất quán**: Preview hiển thị tiêu đề mặc định là "Khóa học nổi bật", trong khi site thực hiển thị là "Khóa học".
Chúng tôi sẽ tiến hành sửa đổi `CoursePreview.tsx` để đồng bộ hóa hoàn toàn các yếu tố visual này, đảm bảo những gì quản trị viên nhìn thấy trong trang cấu hình khớp chính xác 100% với trải nghiệm thực tế của người dùng cuối.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang thiết kế một căn hộ mẫu cho khách hàng xem trước trên máy tính trước khi xây dựng thực tế. Căn hộ mẫu trên màn hình (Preview) có lắp đặt một chiếc tủ bếp rất to và bo góc vuông vức, nhưng khi xây dựng thực tế (Site thực), bạn lại dùng một chiếc tủ bếp nhỏ hơn, bo góc tròn mềm mại và không có tay nắm. Sự sai lệch này khiến khách hàng cảm thấy bối rối và thiếu tin tưởng. Việc đồng bộ hóa hôm nay giống như việc chỉnh sửa lại bản vẽ 3D trên máy tính sao cho từng góc bo, tay nắm và màu sắc khớp chuẩn xác với căn hộ thực tế ngoài đời.

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã so sánh chi tiết và phát hiện các điểm sai lệch cụ thể sau:
- **Mock Data**: `MOCK_COURSES` trong `CoursePreview.tsx` chỉ có 7 trường cơ bản, thiếu `excerpt` và `instructorName`.
- **Tiêu đề lớn**: Dòng 462 trong `CoursePreview.tsx` hiển thị `"Khóa học nổi bật"` thay vì `"Khóa học"`.
- **Card thường (`CourseCard` ở Preview)**:
  - Class bọc ngoài thiếu hiệu ứng hover chuyển động `transition hover:-translate-y-1 hover:shadow-md cursor-pointer group`.
  - Bo góc dùng `rounded-xl` thay vì `rounded-2xl`.
  - Padding dùng `p-4` thay vì `p-5`.
  - Thiếu tag `<p className="line-clamp-2 text-sm text-slate-500">{course.excerpt}</p>`.
  - Meta info thiếu icon `UserRound` và tên giáo viên.
  - Footer hiển thị nút bấm "Xem khóa học" sai lệch so với site thực.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Do file `CoursePreview.tsx` được phát triển độc lập từ trước như một bản mock gọn nhẹ, chưa được cập nhật đồng bộ các chi tiết tinh chỉnh visual, dữ liệu mở rộng (`excerpt`, `instructorName`) và hiệu ứng tương tác (`hover`, `group`) khi trang thực tế `CoursesPage.tsx` được nâng cấp và tối ưu hóa.
- **Giả thuyết đối chứng**: Nếu chỉ thêm dữ liệu mà không chỉnh sửa cấu trúc card thường (như việc bỏ nút CTA thừa và tăng padding), giao diện xem trước trông vẫn sẽ "lệch tông" và chật chội hơn nhiều so với thực tế do sự khác biệt về mật độ thông tin.

# IV. Proposal (Đề xuất)

1. **Cập nhật Mock Data**: Bổ sung các trường `excerpt` và `instructorName` vào cả 4 đối tượng trong `MOCK_COURSES`.
2. **Cập nhật tiêu đề trang mặc định**: Đổi `"Khóa học nổi bật"` thành `"Khóa học"` khi danh mục là `"Tất cả"`.
3. **Đồng bộ hóa `CourseCard` thường**:
   - Thêm class hover, đổi bo góc thành `rounded-2xl` và padding thành `p-5`.
   - Bổ sung hiển thị `excerpt` và tên giáo viên kèm icon `UserRound` tương ứng.
   - Loại bỏ nút bấm "Xem khóa học" ở footer, chỉ hiển thị mức giá với font đậm căn lề trái như trang thực tế.
4. **Đồng bộ hóa `FeaturedCourseCard`**:
   - Thay đổi bo góc thành `rounded-2xl`.
   - Cập nhật sử dụng trường `course.excerpt` từ mock data thay vì dòng chữ hardcoded cũ.
   - Bổ sung hiển thị tên giáo viên kèm icon `UserRound`.

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa**: [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx)
  - *Vai trò hiện tại*: Cung cấp giao diện xem trước trực quan cho Admin.
  - *Thay đổi*: Đồng bộ hóa toàn bộ mock data, cấu trúc card, bo góc, spacing, meta info và tiêu đề lớn động để khớp 100% với trang thực tế.

# VI. Execution Preview (Xem trước thực thi)

1. **Cập nhật `MOCK_COURSES`**: Thay thế mảng dữ liệu giả lập cũ bằng mảng mới đầy đủ trường.
2. **Cập nhật `CourseCard`**: Thay đổi cấu trúc trả về của JSX để tương thích hoàn hảo với `CoursesPage.tsx`.
3. **Cập nhật `FeaturedCourseCard`**: Tinh chỉnh visual và gán biến động cho mô tả & giáo viên.
4. **Cập nhật Tiêu đề**: Đổi giá trị text mặc định trong `CoursesListPreview`.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Kiểm tra kiểu dữ liệu (Static Verification)**:
  - Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo kiểu dữ liệu an toàn, không có trường mock nào bị khai báo sai.
- **Kiểm tra trực quan (Manual Verification)**:
  - Mở trang Admin editor `http://localhost:3000/system/experiences/courses-list` và so sánh trực quan với trang thực tế `/khoa-hoc` ở mọi chế độ Responsive.

# VIII. Todo

- [ ] Cập nhật `MOCK_COURSES` trong `CoursePreview.tsx`
- [ ] Đồng bộ cấu trúc và CSS của `CourseCard` trong `CoursePreview.tsx`
- [ ] Tinh chỉnh thông tin hiển thị của `FeaturedCourseCard` trong `CoursePreview.tsx`
- [ ] Cập nhật tiêu đề mặc định trong `CoursesListPreview`
- [ ] Chạy typecheck xác nhận thành công
- [ ] Kêu loa báo hoàn tất task

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [x] Card thường ở Preview phải sử dụng bo góc `rounded-2xl` và đệm lề `p-5` giống site thực.
- [x] Card thường ở Preview phải hiển thị tóm tắt ngắn (`excerpt`) và tên giáo viên.
- [x] Card thường ở Preview không được hiển thị nút "Xem khóa học" màu tím ở bên phải mức giá.
- [x] Tiêu đề lớn mặc định của Preview phải hiển thị "Khóa học" thay vì "Khóa học nổi bật".
- [x] Không có lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- *Rủi ro*: Có thể bị lỗi typecheck nếu cấu trúc Mock Course trong preview bị thay đổi kiểu dữ liệu mà không khớp với các component nội bộ.
- *Khắc phục*: Bảo đảm định nghĩa kiểu dữ liệu của `FeaturedCourseCard` và `CourseCard` sử dụng `typeof MOCK_COURSES[number]` chuẩn xác.
- *Hoàn tác*: Khôi phục file `CoursePreview.tsx` về trạng thái commit gần nhất qua Git.
