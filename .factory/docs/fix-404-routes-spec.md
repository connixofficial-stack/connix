# I. Primer

## 1. TL;DR kiểu Feynman
- Khi bấm Edit khóa học trong Admin hoặc vào trang chi tiết khóa học thực tế ngoài trang chủ, bạn nhận được lỗi 404 (Không tìm thấy trang).
- Nguyên nhân không phải do cơ sở dữ liệu hay do thiếu trang, mà là do lỗi biên dịch TypeScript (Typecheck Error) do các đường dẫn import tương đối (`../../` hoặc `../../../`) trong thư mục động như `[id]` hay `[...slugs]` bị chỉ định sai lệch hoặc không được resolve đúng cách.
- Giải pháp: Chuyển các đường dẫn tương đối bị lỗi này sang đường dẫn tuyệt đối dạng alias `@/` (ví dụ `@/app/admin/components/ui`) được cấu hình chuẩn trong `tsconfig.json`. Khi đó, Next.js sẽ biên dịch thành công và hiển thị các trang bình thường, không còn bị 404 nữa.

## 2. Elaboration & Self-Explanation
Khi Next.js cố gắng render các route động như `/admin/courses/[id]/edit` và `/[categorySlug]/[recordSlug]`, nó phải import các thành phần giao diện dùng chung như `ui.tsx`, `ImageUploader.tsx`, `LexicalEditor.tsx`, `CourseCurriculumEditor.tsx`, và `CourseDetailPage.tsx`.
Tuy nhiên, việc sử dụng các đường dẫn tương đối đi ngược lên nhiều cấp (`../../../components/ui`) bên trong các thư mục động lồng nhau dễ dẫn đến việc TypeScript và Next.js Bundler bị nhận diện sai thư mục gốc (hoặc bị nhầm lẫn với thư mục `components` ở root ngoài dự án thay vì `app/admin/components`).
Do Next.js 15+ có cơ chế tối ưu hóa build, bất kỳ lỗi import (TS2307) nào xảy ra ở một trang sẽ khiến trang đó không thể biên dịch thành công ở runtime và Next.js sẽ tự động trả về trang Lỗi 404 (Not Found).
Bằng cách chuẩn hóa toàn bộ các import này thành đường dẫn tuyệt đối sử dụng alias `@/`, chúng ta giải quyết triệt để vấn đề phân giải đường dẫn, giúp trình biên dịch Next.js hoạt động chính xác.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:**
  - *Trước:* Trong tệp [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx), dòng 17 import `../../../components/ui`. Trình biên dịch tìm kiếm tại `e:/NextJS/.../system_dohy/components/ui` vốn không tồn tại (ở root chỉ có `components` không có `ui`), dẫn đến báo lỗi `Cannot find module`.
  - *Sau:* Đổi thành `@/app/admin/components/ui`, chỉ định chính xác tệp `ui.tsx` nằm trong thư mục `app/admin/components/` của dự án mà không phụ thuộc vào vị trí của tệp gọi nó.
- **Hình ảnh đời thường:**
  - Việc dùng đường dẫn tương đối giống như bạn chỉ đường cho ai đó: "Đi thẳng qua 3 ngã rẽ rồi rẽ trái". Nếu người đó bắt đầu ở một điểm xuất phát khác (hoặc Next.js chuyển ngữ cảnh), họ sẽ đi lạc.
  - Dùng đường dẫn tuyệt đối alias `@/` giống như bạn đưa hẳn tọa độ GPS hoặc địa chỉ chính xác: "Số 10, Đường Admin, Quận App". Dù đứng ở bất cứ đâu, họ cũng tìm được chính xác địa chỉ cần đến.

# II. Audit Summary (Tóm tắt kiểm tra)

- **Trạng thái Convex DB:** Khóa học "KHOÁ HỌC KIẾN TRÚC NỘI THẤT." có trạng thái `Published` và liên kết đúng với danh mục `Khoá học AutoCAD` (slug: `khoa-hoc-autocad`). Query resolve và getBySlug trên CLI đều trả về dữ liệu thực tế chính xác.
- **Trạng thái Route Admin:** Cấu trúc thư mục route admin edit là `app/admin/courses/[id]/edit/page.tsx`, khớp với URL `/admin/courses/w1715qgq9w54jgfy3aq5602kfn87xkyd/edit`.
- **Trạng thái Compile:** Chạy `bunx tsc --noEmit` phát hiện lỗi `TS2307: Cannot find module` do import sai lệch đường dẫn tương đối ở cả trang admin edit và trang catch-all site detail.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc (Root Cause):**
  Lỗi import tương đối không hợp lệ (`../../../components/ui` thay vì `@/app/admin/components/ui` và `../_components/...` thay vì `@/app/(site)/_components/...`) trong các file route động dẫn đến lỗi biên dịch TypeScript (TS2307). Next.js chặn không render được route động này và trả về trang 404.
- **Giả thuyết đối chứng (Counter-Hypothesis):**
  - *Giả thuyết:* Do lỗi logic phân quyền Admin hoặc do trạng thái dữ liệu Convex (Draft/Archived).
  - *Đối chứng:* Logic `AdminAuthGuard` chỉ thực hiện redirect chứ không ném 404. Dữ liệu Convex của khóa học có status là `Published`, query trả về thành công trên CLI. Do đó, giả thuyết này bị loại trừ. Nguyên nhân duy nhất là lỗi import dẫn tới lỗi biên dịch route.

# IV. Proposal (Đề xuất)

- Chuyển đổi toàn bộ các relative import bị lỗi trong [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx) sang dùng absolute path alias `@/`.
- Chuyển đổi relative import của `CourseDetailPage` trong [[...slugs]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[...slugs]/page.tsx) sang `@/`.
- Đồng bộ hóa relative import của `CourseDetailPage` trong [[categorySlug]/[recordSlug]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/[recordSlug]/page.tsx) sang `@/`.
- Chạy typecheck tĩnh toàn dự án để đảm bảo không còn lỗi TS2307.

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Routing Components
- **Sửa:** [app/admin/courses/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx)
  - *Vai trò hiện tại:* Trang chỉnh sửa thông tin và lộ trình khóa học trong Admin.
  - *Thay đổi:* Sửa 4 dòng import tương đối sang alias `@/` (`@/app/admin/components/ui`, `@/app/admin/components/ImageUploader`, `@/app/admin/components/LexicalEditor`, và `@/app/admin/courses/components/CourseCurriculumEditor`).
- **Sửa:** [app/(site)/[...slugs]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[...slugs]/page.tsx)
  - *Vai trò hiện tại:* Trang bắt lỗi và điều phối hiển thị danh mục / chi tiết thực tế của site.
  - *Thay đổi:* Sửa import `CourseDetailPage` từ `../_components/...` sang `@/app/(site)/_components/...`.
- **Sửa:** [app/(site)/[categorySlug]/[recordSlug]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/[recordSlug]/page.tsx)
  - *Vai trò hiện tại:* Trang chi tiết hợp nhất cho sản phẩm/khóa học/bài viết theo cấu trúc `/[category]/[slug]`.
  - *Thay đổi:* Sửa import `CourseDetailPage` sang dạng alias `@/` tương tự để đồng bộ và an toàn.

# VI. Execution Preview (Xem trước thực thi)

1. Sửa file [app/admin/courses/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx).
2. Sửa file [app/(site)/[...slugs]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[...slugs]/page.tsx).
3. Sửa file [app/(site)/[categorySlug]/[recordSlug]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/[recordSlug]/page.tsx).
4. Thực hiện chạy typecheck tĩnh kiểm thử.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh typecheck `bunx tsc --noEmit` để xác nhận toàn bộ lỗi import TS2307 ở các file trên đã được khắc phục hoàn toàn.
- Kiểm tra log dev server nếu đang chạy xem có lỗi biên dịch nào khác phát sinh không.

### Manual Verification
- Người dùng truy cập lại trang sửa khóa học trong Admin: `http://localhost:3000/admin/courses/w1715qgq9w54jgfy3aq5602kfn87xkyd/edit` để xác nhận trang hiển thị bình thường.
- Người dùng truy cập lại trang chi tiết khóa học thực tế: `http://localhost:3000/khoa-hoc-autocad/khoa-hoc-kien-truc-noi-that` để kiểm tra hiển thị.

# VIII. Todo

- [ ] Cập nhật import trong `app/admin/courses/[id]/edit/page.tsx`
- [ ] Cập nhật import trong `app/(site)/[...slugs]/page.tsx`
- [ ] Cập nhật import trong `app/(site)/[categorySlug]/[recordSlug]/page.tsx`
- [ ] Chạy typecheck xác minh (`bunx tsc --noEmit`)
- [ ] Xóa bỏ file debug tạm thời `app/api/debug-courses/route.ts`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Lệnh `bunx tsc --noEmit` chạy không còn báo lỗi TS2307 ở 3 file chỉnh sửa.
- Trang sửa khóa học của Admin và trang chi tiết khóa học ngoài site hoạt động, không bị lỗi 404 của Next.js.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Không có rủi ro về mặt logic cơ sở dữ liệu vì thay đổi này thuần túy chỉ là thay đổi cú pháp import tương đương trong Next.js.
- **Hoàn tác:** Sử dụng Git checkout hoặc restore các file đã sửa về trạng thái cũ nếu cần.

# XI. Out of Scope (Ngoài phạm vi)

- Việc chỉnh sửa giao diện chi tiết hoặc các tính năng khác của khóa học không nằm trong phạm vi sửa lỗi 404 này.

# XII. Open Questions (Câu hỏi mở)
*(Không có)*
