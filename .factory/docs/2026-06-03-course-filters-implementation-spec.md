# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Chúng ta cần thêm tính năng "Bộ lọc khóa học" (ví dụ: các phần mềm như AutoCAD, 3DS Max...) để liên kết với các khóa học và cho phép người dùng lọc các khóa học này ở trang danh sách ngoài site thực.
* **Cách giải quyết**:
  1. Thêm một tùy chọn (Feature) trong phần cài đặt module Khóa học để cho phép Bật/Tắt tính năng bộ lọc này.
  2. Tạo 2 bảng mới trong cơ sở dữ liệu: `courseFilters` (lưu danh sách bộ lọc/phần mềm có icon ảnh upload) và `courseFilterAssignments` (lưu liên kết giữa Khóa học và Bộ lọc).
  3. Viết các API CRUD cho bộ lọc và API liên kết với Khóa học.
  4. Tạo giao diện quản lý bộ lọc trong Admin (nằm cùng nhóm sidebar của Khóa học) và tích hợp phần chọn bộ lọc vào form thêm/sửa Khóa học.
  5. Cập nhật trang danh sách khóa học và chi tiết khóa học ở site thực để hiển thị và lọc theo các phần mềm/bộ lọc này.

## 2. Elaboration & Self-Explanation
Hiện tại hệ thống có quản lý danh mục (Category) khóa học và trình độ học (Level) nhưng chưa có cơ chế lọc tự do theo các nhãn công cụ/phần mềm đi kèm (ví dụ như AutoCAD, Vray, 3DS Max). Để thực hiện điều này một cách linh hoạt mà không bị giới hạn cứng vào một loại dữ liệu, chúng ta thiết kế một thực thể chung gọi là **Bộ lọc khóa học (Course Filters)**.
* Khi quản trị viên bật tính năng này trong cấu hình module Khóa học (`/system/modules/courses`), menu quản lý "Bộ lọc khóa học" sẽ xuất hiện trong sidebar Admin.
* Quản trị viên có thể thêm các bộ lọc, đặt tên, viết slug, và upload một icon đặc trưng cho bộ lọc đó (học theo pattern upload logo bằng `SettingsImageUploader`).
* Khi thêm/sửa một khóa học, admin sẽ thấy một phần chọn "Phần mềm liên quan" (hoặc Bộ lọc liên quan) hiển thị dưới dạng các badge có thể tắt/mở nhanh chóng và liên kết nhiều bộ lọc cùng lúc với khóa học.
* Ngoài trang web chính (storefront) và trang preview: Trang danh sách khóa học sẽ hiển thị thêm một khu vực lọc theo phần mềm/công cụ. Người dùng click chọn phần mềm nào thì danh sách khóa học sẽ được cập nhật tương ứng. Trên từng thẻ khóa học (Course Card) và trang chi tiết khóa học, các logo của phần mềm liên kết sẽ được hiển thị nhỏ nhắn, sắc nét giúp tăng tính nhận diện và chuyên nghiệp.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khóa học "Lộ trình Next.js thực chiến" có thể liên kết với các công cụ/bộ lọc: `Next.js`, `TailwindCSS`, `Convex`. Khóa học "Thiết kế nội thất 3D chuyên sâu" liên kết với: `3DS Max`, `VRAY`, `Photoshop`. Khi học viên click vào bộ lọc `VRAY` trên trang chủ, hệ thống sẽ tự động lọc ra tất cả các khóa học có sử dụng Vray.
* **Analogy (Phép ẩn dụ đời thường)**: Giống như đi siêu thị mua đồ ăn. Thực phẩm được chia theo "Danh mục" (e.g. Rau củ, Thịt cá) và "Nhãn hiệu/Thành phần phụ" (e.g. Organic, Không gluten, Cay). Việc thêm bộ lọc khóa học giống như ta dán thêm các nhãn thành phần phụ này lên sản phẩm để khách hàng dễ dàng tìm kiếm theo nhu cầu đặc thù của họ.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Trang cấu hình Module**: `app/system/modules/courses/page.tsx` sử dụng config `coursesModule` từ `lib/modules/configs/courses.config.ts`.
* **Sidebar Admin**: `app/admin/components/Sidebar.tsx` lấy danh sách các module đang active và render các subItems cho Khóa học.
* **Form Thêm/Sửa Khóa học**: `app/admin/courses/create/page.tsx` và `app/admin/courses/[id]/edit/page.tsx` xử lý luồng tạo và cập nhật khóa học thông qua Convex.
* **Storefront Pages**: `app/(site)/_components/courses/CoursesPage.tsx` (trang danh sách) và `app/(site)/_components/courses/CourseDetailPage.tsx` (trang chi tiết) hiển thị khóa học.
* **Cơ sở dữ liệu (Convex)**: Schema hiện tại định nghĩa tại `convex/schema.ts` chưa có bảng cho bộ lọc khóa học.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause**: Yêu cầu là một tính năng hoàn toàn mới, cần mở rộng schema cơ sở dữ liệu và tích hợp E2E từ quản trị (Admin) đến hiển thị ngoài trang chủ (Storefront). Do đó, ta cần bổ sung cấu trúc dữ liệu n-n giữa Khóa học và Bộ lọc, xây dựng các API CRUD, cập nhật giao diện Admin form và tích hợp component lọc vào trang Storefront.
* **Độ tin cậy của giải pháp**: **High**. Việc sử dụng các bảng liên kết n-n (`courseFilterAssignments`) tương tự như cách dự án đang làm với `courseCategoryAssignments` giúp tận dụng tối đa các pattern code sẵn có (KISS & DRY) và đảm bảo tính an toàn cho dữ liệu cũ (Clean-by-construction).

# IV. Proposal (Đề xuất)

### 1. Database Schema (`convex/schema.ts`)
Thêm bảng `courseFilters` và bảng liên kết `courseFilterAssignments`:
```typescript
  courseFilters: defineTable({
    active: v.boolean(),
    description: v.optional(v.string()),
    name: v.string(),
    order: v.number(),
    slug: v.string(),
    icon: v.optional(v.string()),
    iconStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  })
    .index("by_slug", ["slug"])
    .index("by_active_order", ["active", "order"])
    .index("by_order", ["order"]),

  courseFilterAssignments: defineTable({
    courseId: v.id("courses"),
    filterId: v.id("courseFilters"),
    createdAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_filter", ["filterId"])
    .index("by_course_filter", ["courseId", "filterId"]),
```

### 2. Convex Backend APIs (`convex/courseFilters.ts`)
Viết file API mới chứa các hàm CRUD bộ lọc khóa học và quản lý liên kết:
* **Queries**:
  * `listAll`: lấy tất cả bộ lọc (cho trang Admin).
  * `listActive`: lấy các bộ lọc đang hoạt động (cho trang Storefront).
  * `listByCourse`: lấy danh sách các bộ lọc đã liên kết của một khóa học.
  * `listAssignmentsByCourses`: lấy danh sách liên kết cho nhiều khóa học cùng lúc (tránh lỗi N+1 khi load trang danh sách khóa học).
* **Mutations**:
  * `create`: tạo bộ lọc mới với name, slug, icon, active, order.
  * `update`: cập nhật bộ lọc.
  * `remove`: xóa bộ lọc và cascade xóa các liên kết trong `courseFilterAssignments`.

### 3. Đồng bộ hóa cấu hình Module (`lib/modules/configs/courses.config.ts`)
Thêm feature `enableCourseFilters` vào `coursesModule`:
```typescript
    { key: 'enableCourseFilters', label: 'Bộ lọc khóa học', icon: Filter, enabled: false }
```
*(Import `Filter` từ `lucide-react`)*

### 4. Admin Navigation Sidebar (`app/admin/components/Sidebar.tsx`)
* Sử dụng query `getModuleFeature` để kiểm tra feature `enableCourseFilters` của module `courses`.
* Nếu active, thêm subItem `Bộ lọc khóa học` (trỏ tới `/admin/courses/filters`) vào nhóm `Khóa học`.

### 5. Admin Manage Course Filters Page (`app/admin/courses/filters/page.tsx`)
Xây dựng trang quản lý bộ lọc sử dụng Table, Search, và một Dialog/Modal để Thêm/Sửa nhanh trực tiếp (inline) để tối ưu hóa trải nghiệm admin và giữ code đơn giản. Tích hợp upload hình ảnh qua `SettingsImageUploader` học từ pattern `/admin/settings/general`.

### 6. Giao diện Thêm/Sửa Khóa học (`app/admin/courses/create/page.tsx` & `[id]/edit/page.tsx`)
* Fetch danh sách active filters.
* Hiển thị section chọn "Phần mềm liên quan" (giống như hình ảnh thiết kế người dùng cung cấp) với nút bấm "Chọn phần mềm" mở một Popover/Dropdown đa chọn, và hiển thị các badge có icon ảnh và nút "x" để xóa liên kết.
* Truyền danh sách `filterIds` vào các mutation `create` và `update` khóa học để đồng bộ trong DB.

### 7. Trang hiển thị và bộ lọc tại Storefront (`app/(site)/_components/courses/CoursesPage.tsx` & `CourseDetailPage.tsx`)
* **CoursesPage**:
  * Lấy trạng thái feature `enableCourseFilters`.
  * Nếu bật, render bộ lọc "Phần mềm liên quan" ở Sidebar hoặc Topbar (các badge tròn nhỏ tinh tế, khi click sẽ kích hoạt lọc).
  * Cập nhật query `listPublishedWithOffset` để lọc theo `filterId` nếu người dùng chọn.
  * Trên từng `CourseCard`, hiển thị các logo phần mềm nhỏ phía dưới/trên tiêu đề khóa học.
* **CourseDetailPage**:
  * Hiển thị một dòng "Phần mềm sử dụng" hoặc "Phần mềm liên quan" chứa các logo phần mềm trong phần thông tin khóa học (trang chi tiết).

# V. Files Impacted (Tệp bị ảnh hưởng)
### Schema / Backend Layer
* `Sửa:` [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/schema.ts): Định nghĩa thêm 2 bảng `courseFilters` và `courseFilterAssignments`.
* `Thêm:` [courseFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courseFilters.ts): Cung cấp các API CRUD cho bộ lọc và quản lý liên kết.
* `Sửa:` [courses.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courses.ts): Cập nhật query `listPublishedWithOffset` để hỗ trợ lọc theo phần mềm; cập nhật mutation `create` / `update` để đồng bộ filter assignments.

### Config / Common Layer
* `Sửa:` [courses.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/modules/configs/courses.config.ts): Thêm feature `enableCourseFilters` để bật/tắt bộ lọc ở system modules.

### Admin UI Layer
* `Sửa:` [Sidebar.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/Sidebar.tsx): Tự động hiển thị subitem "Bộ lọc khóa học" khi feature được bật.
* `Thêm:` [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/filters/page.tsx): Trang CRUD bộ lọc khóa học trong admin với dialog tạo/sửa tích hợp uploader hình ảnh.
* `Sửa:` [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx): Thêm trường chọn "Phần mềm liên quan" vào form tạo khóa học.
* `Sửa:` [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx): Thêm trường chọn "Phần mềm liên quan" vào form sửa khóa học và load dữ liệu đã lưu.

### Storefront UI Layer
* `Sửa:` [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx): Tích hợp hiển thị bộ lọc phần mềm ở sidebar/topbar và các icon phần mềm trên thẻ khóa học.
* `Sửa:` [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx): Hiển thị danh sách phần mềm liên quan ở trang chi tiết khóa học.
* `Sửa:` [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx): Cập nhật mockup hiển thị bộ lọc và logo phần mềm trên preview để nhất quán với system experiences.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật `convex/schema.ts` để thêm 2 bảng cơ sở dữ liệu mới.
2. Thêm file API `convex/courseFilters.ts` và tích hợp các logic xử lý.
3. Đăng ký feature `enableCourseFilters` trong `lib/modules/configs/courses.config.ts`.
4. Cập nhật `convex/courses.ts` để nhận thêm `filterIds` khi tạo/cập nhật và xử lý lọc khóa học.
5. Cập nhật `app/admin/components/Sidebar.tsx` để hiển thị menu quản lý bộ lọc.
6. Viết trang `app/admin/courses/filters/page.tsx` quản lý bộ lọc khóa học.
7. Cập nhật form admin tạo/sửa khóa học (`create/page.tsx`, `[id]/edit/page.tsx`) để hiển thị box chọn phần mềm.
8. Cập nhật trang danh sách khóa học và trang chi tiết ở site thực (`CoursesPage.tsx`, `CourseDetailPage.tsx`) để hiển thị bộ lọc và thẻ logo.
9. Cập nhật trang preview trải nghiệm khóa học (`CoursePreview.tsx`) để hiển thị mock bộ lọc tương ứng.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated & Manual Verification
1. Truy cập `http://localhost:3000/system/modules/courses`, kiểm tra xem feature checkbox "Bộ lọc khóa học" có hiển thị hay không -> Bật checkbox này.
2. Kiểm tra sidebar của Admin xem có xuất hiện menu con "Bộ lọc khóa học" trong nhóm "Khóa học" hay không.
3. Nhấp vào "Bộ lọc khóa học", thêm thử một số phần mềm (ví dụ: AutoCAD 2D, 3DS Max, Chaos Vantage) kèm theo upload logo ảnh. Kiểm tra xem danh sách hiển thị đúng tên, slug và ảnh preview hay không.
4. Đi tới trang tạo hoặc sửa một khóa học bất kỳ, kiểm tra xem section "Phần mềm liên quan" có hiển thị đúng giao diện badge + logo + nút xóa hay không. Chọn liên kết 2-3 phần mềm và lưu lại.
5. Truy cập trang danh sách khóa học storefront (`/khoa-hoc`). Kiểm tra xem:
   - Các logo phần mềm có hiển thị trên card khóa học hay không.
   - Bộ lọc phần mềm có hiển thị ở sidebar/topbar lọc hay không. Thử click lọc theo từng phần mềm xem danh sách có cập nhật chính xác hay không.
6. Vào trang chi tiết khóa học storefront (`/khoa-hoc/[slug]`), kiểm tra xem danh sách phần mềm liên quan có hiển thị đúng logo và tên hay không.

# VIII. Todo
* [ ] Cập nhật schema Convex trong `convex/schema.ts`
* [ ] Tạo file API Convex `convex/courseFilters.ts`
* [ ] Cập nhật module definition trong `lib/modules/configs/courses.config.ts`
* [ ] Sửa mutation `create` và `update` trong `convex/courses.ts` để đồng bộ filter assignments
* [ ] Cập nhật logic query `listPublishedWithOffset` và `countPublished` trong `convex/courses.ts` để lọc theo `filterId`
* [ ] Cập nhật `app/admin/components/Sidebar.tsx` hiển thị menu quản lý bộ lọc
* [ ] Tạo trang quản trị bộ lọc khóa học `app/admin/courses/filters/page.tsx`
* [ ] Cập nhật form admin tạo khóa học `app/admin/courses/create/page.tsx`
* [ ] Cập nhật form admin sửa khóa học `app/admin/courses/[id]/edit/page.tsx`
* [ ] Cập nhật trang danh sách khóa học site thực `app/(site)/_components/courses/CoursesPage.tsx`
* [ ] Cập nhật trang chi tiết khóa học site thực `app/(site)/_components/courses/CourseDetailPage.tsx`
* [ ] Cập nhật file preview trải nghiệm `components/experiences/previews/CoursePreview.tsx`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Tính năng bộ lọc khóa học có thể bật/tắt động thông qua cấu hình module khóa học tại `/system/modules/courses`.
* Khi tắt: Sidebar admin ẩn menu bộ lọc; form thêm/sửa khóa học ẩn trường chọn phần mềm; storefront ẩn các bộ lọc phần mềm và logo trên card.
* Khi bật: Sidebar hiện menu quản lý bộ lọc; admin có thể CRUD bộ lọc có ảnh upload; form thêm/sửa khóa học cho phép chọn nhiều phần mềm liên kết; storefront hiển thị bộ lọc hoạt động và lọc chính xác danh sách khóa học.
* Giao diện chọn phần mềm trong trang edit/create khóa học phải trùng khớp với thiết kế người dùng gửi (nút chọn phần mềm, các badge có ảnh icon nhỏ và nút đóng `x`).
* Không xảy ra lỗi type (TypeScript) khi build dự án.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có rủi ro về mất mát dữ liệu do các thay đổi dữ liệu hoàn toàn là thêm mới (bảng mới, trường tùy chọn mới).
* **Rollback**: Có thể rollback nhanh bằng cách xóa các bảng mới thêm trong schema và khôi phục các file code cũ thông qua Git.

# XI. Out of Scope (Ngoài phạm vi)
* Trang bài học ở site thực (lesson detail) không cần hiển thị danh sách phần mềm này (theo đúng yêu cầu của người dùng).
* Không xây dựng bộ lọc đa tầng phức tạp (chỉ cần lọc theo từng phần mềm đơn lẻ).
* Không thay đổi thiết kế cốt lõi của các module khác.
