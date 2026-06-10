# I. Primer

## 1. TL;DR kiểu Feynman
Khi xem danh sách khóa học, nếu chọn bố cục "Nổi bật" (Masonry), thay vì hiển thị các ô vuông đều tăm tắp giống hệt chế độ "Lưới" (Grid) thông thường, chúng ta sẽ biến ô đầu tiên thành một tấm bảng tin lớn nằm ngang (Magazine Layout). Tấm bảng tin này sẽ chia đôi: bên trái hiển thị ảnh bìa nổi bật có kèm nhãn "Nổi bật" màu cam lấp lánh, bên phải là tiêu đề lớn, phần giới thiệu ngắn, thông tin giáo viên, thời lượng học và nút đăng ký. Cách làm này giúp học viên vừa vào trang là bị thu hút ngay bởi khóa học tiêu điểm, đồng thời tạo sự đồng bộ thẩm mỹ với các trang tin tức hay sản phẩm khác trong hệ thống.

## 2. Elaboration & Self-Explanation
Hiện tại, cả trang danh sách khóa học thực tế (`CoursesPage.tsx`) và Admin Preview (`CoursePreview.tsx`) đều có chế độ hiển thị "Nổi bật" (Masonry). Tuy nhiên, chế độ này hiện chỉ đơn thuần kéo rộng ô đầu tiên ra gấp đôi mà không hề thay đổi cấu trúc bên trong của ô đó. Việc này dẫn đến việc ảnh bìa bị kéo dẹt ra theo chiều ngang rất mất cân đối, chữ nghĩa loãng và không hề có điểm nhấn thị giác nào nổi bật so với chế độ Lưới (Grid) thông thường.

Để giải quyết triệt để "nợ kỹ thuật" thẩm mỹ này, chúng tôi đề xuất tái cấu trúc lại cách hiển thị của phần tử đầu tiên khi người dùng chọn chế độ "Nổi bật":
- Trên máy tính (Desktop/Tablet): Phần tử đầu tiên sẽ tự động chuyển sang dạng **nằm ngang (Flex-row)**. Ảnh bìa chiếm ~42% chiều rộng bên trái, giữ nguyên tỉ lệ và không bị méo mó. Phần thông tin chi tiết chiếm 58% bên phải, tận dụng khoảng trống rộng để hiển thị thêm mô tả ngắn (excerpt), thông tin giáo viên rõ ràng hơn và nút kêu gọi hành động (CTA) chuyên nghiệp.
- Trên điện thoại (Mobile): Tự động thu gọn về dạng **đứng (Flex-col)** truyền thống để đảm bảo vừa vặn màn hình nhỏ, nhưng vẫn giữ các khoảng cách đệm (padding) thoáng đãng, sang trọng.
Sự cải tiến này học hỏi trực tiếp từ cấu trúc Magazine cực kỳ thành công của trang tin tức/sản phẩm (`ListPreview.tsx`), giúp trải nghiệm thị giác của người dùng đồng bộ 100% trên toàn bộ hệ thống.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang đọc một tờ tạp chí công nghệ cao cấp. Chế độ "Lưới" giống như các trang mục lục phía sau, nơi mọi bài viết hay sản phẩm được xếp đều đặn thành các cột bằng nhau để người đọc dễ tra cứu. Trong khi đó, chế độ "Nổi bật" giống như trang bìa hoặc trang mở đầu của một chuyên mục lớn. Ở đó, biên tập viên sẽ dành một không gian rộng lớn, bố trí hình ảnh ấn tượng ở một bên và phần tóm tắt nội dung kèm tiêu đề lớn ở bên cạnh để người đọc ngay lập tức tập trung vào bài viết quan trọng nhất của số báo đó.

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã tiến hành rà soát cấu trúc hiển thị ở cả 2 môi trường:
1. **Admin Preview (`CoursePreview.tsx`)**:
   - Dòng 427-436 đang duyệt qua danh sách khóa học và render component `CourseCard`.
   - Đối với item đầu tiên (`index === 0`) trong layout `masonry`, hệ thống đang gán class `md:col-span-2` cho `CourseCard`.
   - Tuy nhiên, component `CourseCard` chỉ hỗ trợ bố cục dọc (`flex flex-col`), dẫn đến việc ảnh bìa kéo dẹt thô kệch.
2. **Trang thực tế (`CoursesPage.tsx`)**:
   - Dòng 434-478 đang duyệt danh sách khóa học thực tế qua thẻ `Link` nhóm `flex flex-col`.
   - Khi `layoutStyle === 'masonry'`, thẻ chứa ngoài cùng có class `md:col-span-2` nhưng bản thân thẻ `Link` vẫn giữ bố cục dọc, ảnh bìa bị kéo giãn ngang rộng lớn gây vỡ bố cục thị giác.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Do thiếu thiết kế riêng cho trường hợp phần tử nổi bật chiếm 2 cột (`md:col-span-2`). Cả Admin Preview và Trang thực tế đều tái sử dụng chung một cấu trúc thẻ dọc (`flex flex-col`) của card Lưới (Grid) thông thường cho card Nổi bật nằm ngang, dẫn đến hình ảnh bị kéo dãn phi thực tế và thông tin hiển thị nghèo nàn, lãng phí không gian màn hình ngang.
- **Giả thuyết đối chứng**: Nếu ta chỉ điều chỉnh CSS tỉ lệ ảnh (`object-cover`) mà vẫn giữ card dọc, ảnh sẽ bị cắt mất nhiều chi tiết và card trông vẫn rất trống trải vì chiều cao card không đổi nhưng chiều ngang quá rộng. Giải pháp duy nhất đạt hiệu quả thẩm mỹ cao cấp là tái cấu trúc card nổi bật thành dạng nằm ngang (`flex-row`) trên màn hình từ Tablet trở lên.

# IV. Proposal (Đề xuất)

1. **Ở phía Admin Preview (`CoursePreview.tsx`)**:
   - Tạo thêm component `FeaturedCourseCard` riêng biệt dành cho phần tử đầu tiên của layout `masonry`.
   - Thiết kế `FeaturedCourseCard` sử dụng `flex flex-col md:flex-row` để hiển thị ảnh/gradient bên trái (chiếm `md:w-[42%] min-h-[200px]`) và nội dung chi tiết bên phải.
   - Thêm phần mô tả ngắn giả lập đầy đặn cùng thông tin bài học/thời lượng rõ nét và nút CTA sang trọng.
2. **Ở phía Trang thực tế (`CoursesPage.tsx`)**:
   - Trong quá trình render danh sách `courseItems`, kiểm tra điều kiện `config.layoutStyle === 'masonry' && index === 0`.
   - Nếu thỏa mãn, render cấu trúc card nằm ngang đặc biệt sử dụng `Link` với class `flex flex-col md:flex-row md:col-span-2`.
   - Hiển thị đầy đủ ảnh thumbnail thực tế (sử dụng thuộc tính `object-cover` chuẩn), tiêu đề lớn, phần giới thiệu ngắn `course.excerpt`, thông tin chi tiết (giáo viên, thời lượng, số bài) và giá tiền kèm nút bấm chuyên nghiệp.
   - Với các phần tử sau (`index > 0`), giữ nguyên cấu trúc card Grid dọc như cũ để đảm bảo tính tương phản thị giác cực mạnh giữa phần tử "Nổi bật" và các phần tử thường.

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa**: [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx)
  - *Vai trò hiện tại*: Hiển thị xem trước danh sách khóa học trong trang quản trị cấu hình Admin.
  - *Thay đổi*: Thêm component `FeaturedCourseCard` nằm ngang cao cấp và tích hợp vào vị trí phần tử đầu tiên của layout `masonry`.
- **Sửa**: [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
  - *Vai trò hiện tại*: Trang danh sách khóa học chính thức hiển thị cho người dùng cuối.
  - *Thay đổi*: Tích hợp cấu trúc render card nổi bật nằm ngang (`flex flex-col md:flex-row md:col-span-2`) cho phần tử đầu tiên khi ở chế độ `masonry`, tối ưu hóa SEO và trải nghiệm di động.

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và chuẩn bị**: Xác thực lại các thuộc tính dữ liệu của đối tượng khóa học thực tế để đảm bảo không bị thiếu hoặc sai lệch tên biến khi render.
2. **Cập nhật Admin Preview (`CoursePreview.tsx`)**:
   - Thêm `FeaturedCourseCard` trước hàm `CoursesListPreview`.
   - Cập nhật nhánh render trong `CoursesListPreview` để dùng `FeaturedCourseCard` cho item đầu tiên của layout `masonry`.
3. **Cập nhật Trang thực tế (`CoursesPage.tsx`)**:
   - Cấu trúc lại vòng lặp `courseItems.map` để nhận thêm tham số `index`.
   - Áp dụng cấu trúc card ngang cho `index === 0` khi `config.layoutStyle === 'masonry'`.
4. **Kiểm tra biên dịch**: Chạy typecheck để xác nhận tính toàn vẹn 100% của mã nguồn TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Kiểm tra kiểu dữ liệu (Static Verification)**:
  - Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo không phát sinh bất kỳ lỗi cú pháp hay thiếu kiểu dữ liệu nào.
- **Kiểm tra trực quan (Manual Verification)**:
  - Kiểm tra trang xem thử admin tại `http://localhost:3000/system/experiences/courses-list` khi bật chế độ "Nổi bật" xem card đầu tiên có chuyển sang dạng nằm ngang sang trọng, hiển thị cân đối hay không.
  - Truy cập `/khoa-hoc` trên môi trường local để kiểm tra tính tương thích Responsive trên các thiết bị Mobile, Tablet và Desktop.

# VIII. Todo

- [ ] Tạo component `FeaturedCourseCard` trong file `CoursePreview.tsx`
- [ ] Tích hợp `FeaturedCourseCard` cho phần tử đầu tiên trong layout Masonry ở `CoursePreview.tsx`
- [ ] Thiết kế và tích hợp card nổi bật nằm ngang cho phần tử đầu tiên trong layout Masonry ở `CoursesPage.tsx`
- [ ] Chạy typecheck kiểm tra toàn hệ thống
- [ ] Kêu loa hoàn thành tác vụ

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [x] Card nổi bật đầu tiên trong bố cục Masonry phải chiếm trọn 2 cột (`md:col-span-2`) trên màn hình từ Tablet/Desktop trở lên.
- [x] Trên màn hình lớn, card nổi bật phải có bố cục nằm ngang (`flex-row`): Ảnh bìa/gradient chiếm bên trái, chữ nghĩa chi tiết chiếm bên phải.
- [x] Ảnh bìa không bị bóp méo, co dãn sai tỉ lệ (sử dụng `object-cover`).
- [x] Trên màn hình Mobile, card nổi bật tự động co về dạng dọc (`flex-col`) gọn gàng, không bị tràn viền hay lỗi layout.
- [x] Biên dịch TypeScript thành công không có lỗi.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- *Rủi ro*: Layout flex-row có thể bị vỡ nếu tiêu đề quá dài hoặc mô tả quá nhiều trên một số màn hình máy tính bảng nhỏ.
- *Khắc phục*: Sử dụng `line-clamp-2` cho mô tả ngắn, `line-clamp-2` cho tiêu đề và đặt điểm breakpoint từ `md:` (768px) để đảm bảo không gian hiển thị rộng rãi, an toàn.
- *Hoàn tác*: Sử dụng `git checkout` để rollback nhanh chóng các file đã sửa về trạng thái ổn định gần nhất.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào các logic API, cơ sở dữ liệu Convex hay các trang chi tiết khóa học.
- Không thay đổi các layout "Lưới" (Grid) và "Thanh bên" (Sidebar) đã hoàn thiện trước đó.
