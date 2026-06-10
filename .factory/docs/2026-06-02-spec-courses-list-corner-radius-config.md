# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta sẽ thêm một nút cấu hình mới trong trang quản trị Admin để tùy chỉnh độ bo tròn các góc (Corner Radius) của các ô khóa học. Sẽ có 3 sự lựa chọn trực quan: "Nhiều" (bo tròn mềm mại như hiện tại - `rounded-2xl`), "Ít" (bo tròn nhẹ bằng một nửa hiện tại - `rounded-lg`), và "Không bo" (góc vuông sắc cạnh - `rounded-none`). Khi Admin thay đổi tùy chọn này ở bảng điều khiển, cả bản xem trước (Preview) và trang thực tế của học viên sẽ ngay lập tức thay đổi độ bo góc tương ứng.

## 2. Elaboration & Self-Explanation
Để tăng cường khả năng tùy biến giao diện cho Admin theo định hướng Dual-Brand / Custom Branding, chúng tôi đề xuất bổ sung cấu hình độ bo góc (`cornerRadius`) cho module Danh sách khóa học:
- **Lưu trữ cấu hình**: Thêm trường `cornerRadius` (kiểu `'none' | 'sm' | 'lg'`) vào database Convex thông qua setting `courses_list_ui`.
- **Bảng điều khiển Admin (`page.tsx`)**: Bổ sung dòng chọn cấu hình dạng Dropdown (`SelectRow`) cho độ bo góc với 3 tùy chọn:
  - Nhiều (Mặc định): `'lg'` tương ứng `rounded-2xl`.
  - Ít (Bằng một nửa): `'sm'` tương ứng `rounded-lg`.
  - Không bo góc: `'none'` tương ứng `rounded-none`.
- **Trang xem trước (`CoursePreview.tsx`) & Trang thực tế (`CoursesPage.tsx`)**: Tích hợp hàm helper `getRadiusClass(cornerRadius)` để động hóa class CSS bo tròn của các card khóa học thường và card nằm ngang nổi bật.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang chọn mua khung tranh để treo ảnh trong phòng khách. Có người thích khung tranh gỗ được mài bo góc tròn xoe rất dễ chịu, ấm cúng (bo góc Nhiều - `rounded-2xl`). Có người lại thích khung mài bo góc rất nhẹ, thanh lịch (bo góc Ít - `rounded-lg`). Và cũng có người thích phong cách tối giản, góc vuông chằn chặn sắc bén (Không bo - `rounded-none`). Việc thêm nút cấu hình này giống như việc bạn đưa cho gia chủ một chiếc hộp điều khiển cầm tay, bấm nút nào thì toàn bộ khung tranh trong nhà tự động đổi sang kiểu bo góc đó ngay lập tức.

# II. Audit Summary (Tóm tắt kiểm tra)

1. **Parser cấu hình (`useSiteConfig.ts`)**:
   - Kiểu `CoursesListConfig` dòng 336-345 và hook `useCoursesListConfig` dòng 352-380 hiện chưa hỗ trợ trường `cornerRadius`.
2. **Trang cấu hình Admin (`page.tsx`)**:
   - Interface `CoursesListExperienceConfig` và `DEFAULT_CONFIG` thiếu trường `cornerRadius`.
   - Khu vực "Danh sách" (dòng 151-163) chưa có nút `SelectRow` để cấu hình `cornerRadius`.
3. **Các file hiển thị (`CoursePreview.tsx` & `CoursesPage.tsx`)**:
   - Toàn bộ các card khóa học đang bị gán cứng class bo góc `rounded-2xl`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Module khóa học ban đầu được xây dựng với giao diện cứng theo preset bo tròn hiện đại `rounded-2xl`, chưa hỗ trợ tham số hóa (parameterization) cho thuộc tính bo góc để Admin tự do thay đổi theo nhận diện thương hiệu riêng.
- **Giả thuyết đối chứng**: Nếu ta chỉ chỉnh CSS bo góc tĩnh ở file `.css` chung, toàn bộ các thẻ trong dự án sẽ bị ảnh hưởng và Admin không thể chỉnh sửa linh hoạt từ trang quản trị. Giải pháp chuẩn là tích hợp thuộc tính này vào cấu hình động của module.

# IV. Proposal (Đề xuất)

1. **Nâng cấp `useSiteConfig.ts`**:
   - Bổ sung `cornerRadius: 'none' | 'sm' | 'lg'` vào kiểu `CoursesListConfig`.
   - Trong parser, lấy `cornerRadius: raw?.cornerRadius ?? 'lg'`.
2. **Nâng cấp Trang quản trị (`app/system/experiences/courses-list/page.tsx`)**:
   - Thêm `cornerRadius` vào config type và gán mặc định là `'lg'`.
   - Thêm `SelectRow` để chọn "Độ bo góc" trong cột "Danh sách".
3. **Động hóa CSS bo góc trong `CoursePreview.tsx`**:
   - Bổ sung prop `cornerRadius?: 'none' | 'sm' | 'lg'` vào `CoursesListPreviewProps` và gán mặc định là `'lg'`.
   - Định nghĩa hàm helper:
     ```tsx
     const getRadiusClass = (radius?: 'none' | 'sm' | 'lg') => {
       if (radius === 'none') return 'rounded-none';
       if (radius === 'sm') return 'rounded-lg';
       return 'rounded-2xl';
     };
     ```
   - Thay thế class cứng `rounded-2xl` bằng `getRadiusClass(cornerRadius)` cho `CourseCard` và `FeaturedCourseCard`.
4. **Động hóa CSS bo góc trong `CoursesPage.tsx`**:
   - Lấy `config.cornerRadius` từ hook cấu hình.
   - Áp dụng tương tự helper `getRadiusClass(config.cornerRadius)` cho các card khóa học.

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa**: [useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/experiences/useSiteConfig.ts)
  - *Thay đổi*: Khai báo kiểu và parse trường cấu hình `cornerRadius` từ DB Convex.
- **Sửa**: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/courses-list/page.tsx)
  - *Thay đổi*: Bổ sung control dropdown cho phép Admin thay đổi độ bo góc và truyền tham số vào Preview.
- **Sửa**: [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx)
  - *Thay đổi*: Nhận prop `cornerRadius` và động hóa class bo góc của các card xem trước.
- **Sửa**: [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
  - *Thay đổi*: Áp dụng class bo góc động từ cấu hình hệ thống lên các card thực tế.

# VI. Execution Preview (Xem trước thực thi)

1. **Sửa `useSiteConfig.ts`**: Thêm trường và parse giá trị.
2. **Sửa `page.tsx` (Admin Panel)**: Tích hợp SelectRow điều khiển.
3. **Sửa `CoursePreview.tsx`**: Thêm helper và áp dụng class động.
4. **Sửa `CoursesPage.tsx`**: Khai báo helper và áp dụng class động thực tế.
5. **Typecheck & Loa báo hoàn thành**.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Biên dịch**: Chạy `bunx tsc --noEmit` xác thực TypeScript.
- **Thử nghiệm**:
  - Mở `http://localhost:3000/system/experiences/courses-list`.
  - Thay đổi độ bo góc sang "Ít" hoặc "Không bo" xem card trong Preview có thay đổi lập tức hay không.
  - Nhấn Lưu và truy cập `/khoa-hoc` xem độ bo góc ngoài site thực tế có khớp chính xác hay không.

# VIII. Todo

- [ ] Cập nhật parser config ở `useSiteConfig.ts`
- [ ] Cập nhật bảng cấu hình Admin ở `app/system/experiences/courses-list/page.tsx`
- [ ] Đồng bộ hóa CSS bo góc trong `CoursePreview.tsx`
- [ ] Đồng bộ hóa CSS bo góc trong `CoursesPage.tsx`
- [ ] Chạy tsc typecheck kiểm tra toàn bộ
- [ ] Phát loa hoàn tất

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [x] Có nút "Độ bo góc" trong bảng điều khiển Admin với 3 tùy chọn: Nhiều, Ít, Không bo.
- [x] Đổi cấu hình bo góc cập nhật lập tức trên Preview.
- [x] Đổi cấu hình bo góc và Lưu thì cập nhật lập tức ngoài trang thực tế `/khoa-hoc`.
- [x] Độ bo góc Nhiều tương ứng `rounded-2xl`, Ít tương ứng `rounded-lg`, Không bo tương ứng `rounded-none`.
- [x] Không có lỗi biên dịch.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Thay đổi này cực kỳ an toàn, chỉ liên quan đến class CSS và truyền prop trong React. Hoàn tác nhanh gọn bằng git.
