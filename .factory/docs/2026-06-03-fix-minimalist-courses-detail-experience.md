# I. Primer

## 1. TL;DR kiểu Feynman
- Trang chi tiết khóa học có 3 kiểu giao diện: Cổ điển (Classic), Hiện đại (Modern), và Tối giản (Minimalist).
- Trước đây, giao diện "Tối giản" được thiết kế ẩn đi cột bên phải (aside sidebar), dẫn đến việc thiếu mất phần "Đăng ký khóa học" (Sticky CTA) và danh sách "Khóa học liên quan".
- Người dùng yêu cầu giao diện "Tối giản" cũng phải hiển thị nút đăng ký và các khóa học liên quan (cùng danh mục) giống như 2 giao diện kia.
- Giải pháp: Kích hoạt hiển thị cột bên phải (aside sidebar) cho cả giao diện Tối giản trong cả code Xem trước (Preview) và code chạy thực tế (Site).

## 2. Elaboration & Self-Explanation
Trang chi tiết khóa học (`courses-detail`) cho phép người quản trị cấu hình 3 phong cách thiết kế khác nhau (layout style) để hiển thị thông tin khóa học đến học viên. 
Tuy nhiên, trong quá trình lập trình ban đầu, phong cách "Tối giản" (Minimalist) đã bị cấu hình cứng là chỉ hiển thị 1 cột duy nhất ở giữa màn hình (thông qua biến `isMinimal` ẩn đi cột `aside`). Quyết định thiết kế này vô tình làm biến mất 2 thành phần quan trọng đối với trải nghiệm chuyển đổi (conversion) và giữ chân người dùng (retention):
- **Khung đăng ký học (Sticky CTA):** Nơi học viên xem học phí và nhấn nút đăng ký khóa học.
- **Khóa học liên quan (Related Courses):** Danh sách các khóa học khác có cùng danh mục với khóa học hiện tại, giúp học viên dễ dàng chuyển hướng sang các khóa học khác cùng chủ đề.

Để giải quyết, chúng ta cần loại bỏ các điều kiện hạn chế `!isMinimal` đối với khung sidebar ở cả file Component hiển thị trên trang thực tế (`CourseDetailPage.tsx`) và Component hiển thị trong trang quản trị cấu hình (`CoursePreview.tsx`). Điều này giúp cấu trúc trang thống nhất dạng 2 cột cho cả 3 layout, đảm bảo mọi layout đều cung cấp đầy đủ khả năng đăng ký và khám phá khóa học liên quan.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Khi học viên truy cập vào một khóa học như "Lộ trình Next.js thực chiến" (thuộc danh mục Frontend) dưới giao diện Tối giản, họ sẽ thấy nội dung học ở cột bên trái, và ở cột bên phải sẽ thấy khung giá tiền "2.900.000đ" kèm nút "Đăng ký học", ngay dưới đó là danh sách các khóa học cùng danh mục Frontend như "React căn bản" hay "TypeScript nâng cao".
- **Hình ảnh so sánh:** Giống như một cuốn sách hướng dẫn du lịch. Dù bạn chọn phiên bản thiết kế "Cổ điển" với nhiều hình ảnh màu mè, hay phiên bản "Tối giản" chỉ tập trung vào chữ viết sạch sẽ, thì ở trang cuối hoặc lề trang vẫn bắt buộc phải có thông tin "Cách đặt vé xe" và "Các địa điểm tham quan lân cận" để người đọc có thể hành động tiếp. Việc thiếu đi những thứ này khiến người đọc bị "kẹt" lại không biết làm gì tiếp theo.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file code preview: [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx) dòng 739 và 765 đang chặn hiển thị cột bên nếu `isMinimal` là true.
- Đã kiểm tra file code thực tế: [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx) dòng 148 và 195 cũng đang chặn hiển thị cột bên nếu `isMinimal` là true.
- Cơ chế lấy khóa học liên quan (`relatedCourses`) thông qua API Convex `api.courses.searchPublished` đã được lọc theo `categoryId` (cùng danh mục khóa học), do đó chỉ cần hiển thị cột bên là danh sách này tự động xuất hiện chính xác.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Logic phân nhánh layout `isMinimal ? '' : 'lg:grid-cols-[minmax(0,1fr)_320px]'` và điều kiện ẩn component `{!isMinimal && <aside>...` trong code đang ngăn cản giao diện Tối giản hiển thị cột bên phải.
- **Giả thuyết đối chứng:** Nếu ta loại bỏ kiểm tra `isMinimal` tại các vị trí này và áp dụng cấu trúc 2 cột đồng nhất, giao diện Tối giản sẽ hiển thị đầy đủ thông tin đăng ký và khóa học liên quan mà không ảnh hưởng tới logic hiển thị khác.

# IV. Proposal (Đề xuất)
- Loại bỏ điều kiện check `isMinimal` để ẩn `<aside>` trong [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx) và [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx).
- Cập nhật class CSS của container chính từ `isMinimal ? '' : 'lg:grid-cols-[minmax(0,1fr)_320px]'` thành `lg:grid-cols-[minmax(0,1fr)_320px]` cố định cho tất cả các layout.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Frontend Components
#### [MODIFY] [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx)
- Vai trò hiện tại: Cung cấp giao diện xem trước (preview) cho các layout chi tiết khóa học trong trang quản trị cấu hình.
- Thay đổi: Xóa bỏ điều kiện chặn `isMinimal` để hiển thị sidebar đăng ký và khóa học liên quan trong layout Tối giản.

#### [MODIFY] [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx)
- Vai trò hiện tại: Trang chi tiết khóa học thực tế hiển thị cho học viên trên site.
- Thay đổi: Xóa bỏ điều kiện chặn `isMinimal` để hiển thị sidebar đăng ký và khóa học liên quan trong layout Tối giản trên môi trường thực tế.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh sửa file [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx): cập nhật grid layout và hiển thị `<aside>`.
2. Chỉnh sửa file [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx): cập nhật grid layout và hiển thị `<aside>`.
3. Kiểm tra tĩnh code xem có lỗi cú pháp hay kiểu dữ liệu không.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Manual Verification
- Truy cập trang cấu hình trải nghiệm: `http://localhost:3000/system/experiences/courses-detail`.
- Chuyển đổi giữa 3 Tab Layout: Cổ điển (Classic), Hiện đại (Modern), Tối giản (Minimalist).
- Xác minh rằng ở cả 3 Tab, khung Đăng ký khóa học và Khóa liên quan đều hiển thị đầy đủ và đẹp mắt ở cột bên phải.

# VIII. Todo
- [ ] Chỉnh sửa [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx) để mở hiển thị sidebar cho layout minimal.
- [ ] Chỉnh sửa [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx) để mở hiển thị sidebar cho layout minimal.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout "Tối giản" (minimal) hiển thị khung Đăng ký khóa học ở cột bên phải.
- Layout "Tối giản" (minimal) hiển thị danh sách Khóa học liên quan cùng danh mục ở cột bên phải.
- Trải nghiệm thống nhất giữa giao diện Xem trước trong Admin và trang Site thực tế.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Thay đổi CSS grid có thể làm vỡ layout trên màn hình nhỏ nếu không xử lý responsive tốt (tuy nhiên class `lg:grid-cols-[minmax(0,1fr)_320px]` đã có breakpoint `lg:`, trên màn hình nhỏ hơn sẽ tự động xếp chồng 1 cột nên cực kỳ an toàn).
- **Hoàn tác:** Dùng `git checkout` để khôi phục lại trạng thái ban đầu của 2 file bị sửa đổi.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi thiết kế chung của các component con trong sidebar.
- Không cấu hình thêm các logic lọc khóa học liên quan phức tạp khác ngoài danh mục hiện tại.
