# I. Primer

## 1. TL;DR kiểu Feynman
Thay vì hiển thị kiểu "nửa vời" (ô đầu tiên to nằm ngang, các ô sau nhỏ vuông xếp bên dưới) gây lộn xộn thị giác, khi người dùng chọn chế độ "Nổi bật" (Masonry), chúng ta sẽ biến toàn bộ danh sách khóa học thành một hàng dài các tấm bảng ngang đều đặn (List Layout). Mỗi khóa học sẽ chiếm trọn một hàng, chia đôi: ảnh bên trái, chữ bên phải. Chỉ những khóa học thực sự được đánh dấu nổi bật mới có nhãn cam lấp lánh. Cách làm này giúp trang web hiển thị vô cùng gọn gàng, đồng đều và cực kỳ sang trọng.

## 2. Elaboration & Self-Explanation
Sau khi đánh giá phản hồi thực tế và hình ảnh giao diện, bố cục "1 to nằm ngang, các cái sau nhỏ xếp ô vuông" (Magazine style lai Masonry) làm cho visual của trang danh sách bị mất cân đối nghiêm trọng. Khoảng trống bên dưới ô ngang lớn bị chia nhỏ thành các ô lưới dọc tạo cảm giác đứt gãy thị giác ("đừng có 1 rồi 2 mệt vl").

Để đem lại thiết kế tối ưu nhất, chúng tôi đề xuất chuyển đổi chế độ "Nổi bật" thành **chế độ Danh sách ngang đồng đều (Unified List Layout)**:
- **Cấu trúc hàng**: Toàn bộ danh sách khóa học hiển thị dưới dạng grid 1 cột (`grid-cols-1`). Mỗi khóa học chiếm trọn 100% chiều rộng của container.
- **Bố cục card ngang**: Tất cả các khóa học đều render dạng nằm ngang (`flex-row` từ màn hình Tablet trở lên): Ảnh/gradient bên trái chiếm ~42% chiều rộng, thông tin và nút CTA bên phải chiếm 58% còn lại.
- **Badge Nổi bật động**: Nhãn "Nổi bật" màu cam chỉ hiển thị trên những khóa học thực sự có thuộc tính `featured === true`, đảm bảo tính đúng đắn của dữ liệu thay vì tự động gán cho mọi card.
Sự đồng đều này tạo nên một nhịp điệu thị giác mượt mà, chuyên nghiệp và thoáng đãng bậc nhất.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang đi xem triển lãm tranh. Bố cục cũ giống như việc treo một bức tranh khổ lớn nằm ngang ở trên, rồi ngay phía dưới lại treo lố nhố hai bức tranh khổ nhỏ đứng cạnh nhau. Bố cục này khiến mảng tường trông rất lộn xộn và chắp vá. Việc thay đổi sang chế độ Danh sách ngang lần này giống như việc treo tất cả các bức tranh theo cùng một kích thước khổ lớn nằm ngang thẳng hàng từ trên xuống dưới. Người xem đi qua sẽ thấy vô cùng ngăn nắp, dễ chịu và cảm nhận được sự sang trọng của toàn bộ phòng triển lãm.

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã kiểm tra lại cấu trúc JSX hiện tại:
1. **Admin Preview (`CoursePreview.tsx`)**:
   - Class grid khi `layoutStyle === 'masonry'` là `'grid gap-5 md:grid-cols-2'`.
   - Vòng lặp map chỉ render `FeaturedCourseCard` cho `index === 0`, các phần tử sau render `CourseCard` thường.
   - Component `FeaturedCourseCard` đang hiển thị cứng badge "Nổi bật" cho mọi đối tượng.
2. **Trang thực tế (`CoursesPage.tsx`)**:
   - Class grid khi `layoutStyle === 'masonry'` là `'grid gap-5 md:grid-cols-2'`.
   - Chỉ render card ngang `Link` cho `index === 0`, các phần tử sau render card Grid dọc.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Do thiết kế ban đầu cố gắng lai tạo giữa Magazine layout (phần tử đầu nổi bật) với Masonry grid (các phần tử sau xếp lưới), dẫn đến sự lệch tông về mặt thị giác trên một container lưới 2 cột. Các ô Grid dọc chật chội đứng cạnh/ở dưới một ô ngang quá rộng tạo cảm giác đứt gãy layout.
- **Giả thuyết đối chứng**: Nếu ta chỉ chỉnh kích thước các ô Grid dọc to lên, bố cục vẫn sẽ bị lệch vì ô đầu tiên chiếm 2 cột vẫn có tỉ lệ hoàn toàn khác. Việc chuyển toàn bộ danh sách sang grid 1 cột (`grid-cols-1`) và áp dụng card ngang đồng nhất là giải pháp triệt để và thẩm mỹ nhất.

# IV. Proposal (Đề xuất)

1. **Đồng bộ hóa class Grid**:
   - Cả trong `CoursesPage.tsx` và `CoursePreview.tsx`, khi `layoutStyle === 'masonry'`, đổi class grid thành `'grid gap-5 grid-cols-1'`.
2. **Đồng bộ hóa vòng lặp render**:
   - Thay đổi logic kiểm tra: Nếu `layoutStyle === 'masonry'` (hoặc `config.layoutStyle === 'masonry'`), render **toàn bộ** các phần tử trong danh sách dưới dạng card nằm ngang.
3. **Động hóa Badge "Nổi bật" màu cam**:
   - Trong `FeaturedCourseCard` của `CoursePreview.tsx`, bọc badge "Nổi bật" trong câu điều kiện `{course.featured && (...)}`.
   - Trong trang thực tế `CoursesPage.tsx`, bọc badge "Nổi bật" trong câu điều kiện `{course.featured && (...)}` chuẩn xác.

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa**: [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx)
  - *Thay đổi*: Đổi class grid Masonry thành 1 cột và render tất cả khóa học bằng `FeaturedCourseCard` có check `course.featured`.
- **Sửa**: [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
  - *Thay đổi*: Đổi class grid Masonry thành 1 cột và render tất cả khóa học bằng cấu trúc card nằm ngang đồng đều.

# VI. Execution Preview (Xem trước thực thi)

1. **Sửa `CoursePreview.tsx`**:
   - Cập nhật điều kiện check `course.featured` trong `FeaturedCourseCard`.
   - Đổi grid class Masonry thành `'grid gap-5 grid-cols-1'`.
   - Sửa vòng map để render `FeaturedCourseCard` cho tất cả item khi ở chế độ `masonry`.
2. **Sửa `CoursesPage.tsx`**:
   - Đổi grid class Masonry thành `'grid gap-5 grid-cols-1'`.
   - Sửa vòng map tương tự để render card ngang cho toàn bộ danh sách khi ở chế độ `masonry`.
3. **Typecheck & Biên dịch**: Chạy oxlint/tsc để đảm bảo 100% an toàn.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Biên dịch**: Chạy `bunx tsc --noEmit` để xác thực TypeScript.
- **Trực quan**: Kiểm tra Admin Editor và Site thực tế xem toàn bộ danh sách ở chế độ Nổi bật đã chuyển sang dạng hàng ngang đều đặn, thoáng đãng hay chưa.

# VIII. Todo

- [ ] Sửa hiển thị badge nổi bật động trong `FeaturedCourseCard` ở `CoursePreview.tsx`
- [ ] Cập nhật grid class và vòng lặp render trong `CoursePreview.tsx`
- [ ] Cập nhật grid class và vòng lặp render trong `CoursesPage.tsx`
- [ ] Chạy typecheck và loa báo hoàn thành

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [x] Khi bật chế độ Nổi bật (Masonry), toàn bộ danh sách khóa học phải hiển thị dưới dạng card ngang 100% chiều rộng.
- [x] Grid của chế độ Nổi bật phải là 1 cột (`grid-cols-1`).
- [x] Chỉ những khóa học nào có thuộc tính `featured === true` mới hiển thị badge "Nổi bật" màu cam.
- [x] Không có lỗi typecheck.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Không có rủi ro lớn vì đây là thay đổi hoàn toàn về mặt CSS và phân nhánh render JSX. Hoàn tác dễ dàng qua Git.
