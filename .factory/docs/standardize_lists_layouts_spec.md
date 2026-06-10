# I. Primer

## 1. TL;DR kiểu Feynman
Hãy tưởng tượng trang web của chúng ta có 6 loại danh sách khác nhau: Sản phẩm, Bài viết, Tài nguyên, Khóa học, Dịch vụ và Dự án. Trước đây, mỗi danh sách được thiết kế một kiểu, có cái có sidebar bộ lọc bên trái, có cái có bộ lọc phía trên, có cái lại có bố cục dạng ô gạch không nhất quán.
Mục tiêu của kế hoạch này là đưa tất cả 6 trang danh sách này về **cùng một tiêu chuẩn thiết kế** gồm 3 kiểu bố cục (layouts):
1. **Grid (Lưới):** Không có sidebar bộ lọc bên trái. Bộ lọc và thanh tìm kiếm được đặt gọn gàng ở trên cùng, bên dưới là lưới các thẻ nội dung.
2. **Sidebar (Thanh bên):** Có sidebar bộ lọc và danh mục bên trái (chiếm ~280px trên máy tính), bên phải là lưới các thẻ nội dung.
3. **List (Danh sách):** Có sidebar bộ lọc bên trái giống Sidebar layout, nhưng bên phải hiển thị các thẻ dạng dòng nằm ngang (ảnh bên trái, tiêu đề và mô tả ở giữa, nút hành động bên phải) để tận dụng chiều rộng màn hình.

Đồng thời, chúng ta sẽ thêm một tab "Cấu hình danh sách" tại trang quản trị Trải nghiệm `/system/experiences` để người quản trị có thể thay đổi nhanh bố cục của cả 6 trang danh sách này tại một nơi duy nhất.

## 2. Elaboration & Self-Explanation
Việc thiết kế không nhất quán giữa các trang danh sách làm giảm trải nghiệm người dùng (UX) và gây khó khăn trong việc phát triển/bảo trì code (DX). Hiện tại, trang danh sách sản phẩm (`products-list`) đang có thiết kế chuẩn chỉnh nhất với đầy đủ 3 chế độ: Grid, Sidebar (Catalog) và List.
Chúng ta sẽ lấy `products-list` làm chuẩn mực, tiến hành refactor code của 5 trang danh sách còn lại:
- **Posts (Bài viết)**
- **Resources (Tài nguyên)**
- **Courses (Khóa học)**
- **Services (Dịch vụ)**
- **Projects (Dự án)**

Quá trình này bao gồm:
- Chuẩn hóa kiểu dữ liệu cấu hình trong Convex và Client.
- Đồng bộ hóa các file Page quản trị trong `/system/experiences/*` để cung cấp 3 tùy chọn: Grid, Sidebar, List.
- Cập nhật các component Preview trong editor để hiển thị đúng 3 chế độ.
- Sửa lại các trang site public (`/posts`, `/resources`, `/courses`, `/services`, `/projects`) để đọc cấu hình `layoutStyle` và render đúng giao diện.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Khi người dùng truy cập trang danh sách Tài nguyên (`/resources`):
  - Nếu cấu hình là **Grid**: Bộ lọc danh mục sẽ hiển thị dưới dạng dropdown/chips nằm ngang phía trên. Bên dưới hiển thị lưới 3 cột các thẻ tài nguyên.
  - Nếu cấu hình là **Sidebar**: Sidebar bên trái sẽ chứa ô tìm kiếm, danh mục tài nguyên, bộ lọc phần mềm. Bên phải hiển thị lưới 3 cột các thẻ tài nguyên.
  - Nếu cấu hình là **List**: Sidebar bên trái vẫn hiển thị bộ lọc. Nhưng bên phải, thay vì hiển thị lưới 3 cột, mỗi tài nguyên sẽ trải dài thành một dòng ngang (ảnh tài nguyên hình chữ nhật bên trái, ở giữa là tiêu đề/mô tả/badge phần mềm, bên phải là nút "Xem tài nguyên" nổi bật).

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã tiến hành kiểm tra cấu trúc của 6 trang danh sách và trang trải nghiệm:
1. **Products List:** Đã hoàn thiện 3 layout (Grid, Sidebar, List) cả ở trang preview admin, trang site public (`ProductsPage.tsx`), và file layout components (`LayoutComponents.tsx`). Đây là golden standard.
2. **Posts List:** Có 3 layout dạng `fullwidth` (tương ứng Grid), `sidebar` (tương ứng List), `magazine` (tương ứng Magazine). Cần refactor lại để hỗ trợ chuẩn `grid`, `sidebar` (sidebar trái + lưới phải), `list` (sidebar trái + danh sách ngang phải).
3. **Resources List:** Hỗ trợ `grid`, `sidebar`, `masonry`. Cần đổi `masonry` thành `list`.
4. **Courses List:** Hỗ trợ `grid`, `sidebar`, `masonry`. Cần đổi `masonry` thành `list`.
5. **Services List:** Hỗ trợ `grid`, `sidebar`, `masonry` (magazine). Cần đổi thành `grid`, `sidebar`, `list`.
6. **Projects List:** Hiện tại chỉ hiển thị Grid dạng lưới 3 cột cố định ngoài site. Cần refactor để hỗ trợ `grid` (top filters), `sidebar` (sidebar trái + lưới phải), `list` (sidebar trái + danh sách ngang phải).
7. **Experiences Hub Page (`app/system/experiences/page.tsx`):** Chỉ hiển thị danh sách các card trải nghiệm. Chưa có tab cấu hình chung cho các trang danh sách.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Vấn đề thiết kế:** Các trang danh sách được phát triển ở các thời điểm khác nhau bởi các yêu cầu khác nhau, dẫn tới sự phân mảnh layout (`fullwidth`, `masonry`, `magazine`, `grid`, `sidebar`).
* **Giải pháp nhất quán:** Chúng ta sẽ định nghĩa lại kiểu dữ liệu `ListLayoutStyle = 'grid' | 'sidebar' | 'list'` làm chuẩn chung cho tất cả các lists. Để không làm lỗi cấu hình cũ đã lưu của người dùng trong Convex DB, tại hook `useSiteConfig.ts` chúng ta sẽ tự động map các giá trị cũ sang chuẩn mới:
  - `fullwidth` -> `grid`
  - `magazine` -> `list`
  - `masonry` -> `list` (hoặc `grid` tùy thuộc logic cũ)

---

# IV. Proposal (Đề xuất)

### 1. Chuẩn hóa cấu hình ở Client Hook (`lib/experiences/useSiteConfig.ts`)
* Cập nhật các config types và helper của `posts_list_ui`, `resources_list_ui`, `courses_list_ui`, `services_list_ui`, `projects_list_ui` để trả về `layoutStyle: 'grid' | 'sidebar' | 'list'`.
* Map giá trị cũ sang giá trị mới để bảo toàn dữ liệu.

### 2. Thiết kế lại giao diện hiển thị danh sách dạng Dòng Ngang (List Chế độ)
Chúng ta sẽ tạo các component thẻ ngang (Horizontal Card) cho từng thực thể phù hợp phong cách MacBook (Calm Flat UI):
* **Posts (Bài viết):** Sử dụng thiết kế thẻ ngang hiện tại của `SidebarLayout`.
* **Resources (Tài nguyên):** Ảnh bên trái (aspect-video, w-48 shrink-0), nội dung ở giữa (danh mục, giá, tiêu đề, mô tả ngắn, phần mềm), nút "Xem chi tiết →" bên phải hoặc góc dưới.
* **Courses (Khóa học):** Ảnh bên trái, ở giữa là tiêu đề, mô tả, badge cấp độ, số bài học, thời lượng, bên phải là nút hành động.
* **Services (Dịch vụ):** Tương tự tài nguyên.
* **Projects (Dự án):** Ảnh bên trái, thông tin dự án, khách hàng, mô tả ở giữa.

### 3. Đồng bộ hóa các Trang Quản Trị Trải Nghiệm
Sửa đổi các file `/system/experiences/[name]-list/page.tsx`:
* Thay đổi `LAYOUTS` / `LAYOUT_STYLES` thành 3 options: Grid, Sidebar, List.
* Đảm bảo preview hiển thị đúng layoutStyle tương ứng.

### 4. Thêm Tab "Cấu hình danh sách" tại Trang Quản trị Trải nghiệm (`app/system/experiences/page.tsx`)
* Thêm tab "Cấu hình danh sách" bên cạnh bộ lọc phụ.
* Khi chọn tab này, render một bảng/danh sách cấu hình trực quan cho 6 trang danh sách, cho phép chọn nhanh layoutStyle (`Grid`, `Sidebar`, `List`), số lượng item mỗi trang, kiểu phân trang và nút Save chung.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. Cấu hình & Hooks chung
* `[MODIFY] useSiteConfig.ts` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/experiences/useSiteConfig.ts)
  - Sửa đổi kiểu dữ liệu trả về của các hook list config để đồng bộ 3 layout: `'grid' | 'sidebar' | 'list'`.
  - Viết logic map các giá trị legacy an toàn.

### 2. Quản trị & Preview
* `[MODIFY] ListPreview.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ListPreview.tsx)
  - Cập nhật `PostsListPreview` để hỗ trợ layout `grid`, `sidebar`, `list`.
* `[MODIFY] ResourcePreview.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx)
  - Cập nhật `ResourcesListPreview` hỗ trợ layout `list` thay vì `masonry`.
* `[MODIFY] CoursePreview.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx)
  - Cập nhật `CoursesListPreview` hỗ trợ layout `list` thay vì `masonry`.
* `[MODIFY] ServicesListPreview.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ServicesListPreview.tsx)
  - Cập nhật `ServicesListPreview` hỗ trợ layout `list` thay vì `masonry`.
* `[MODIFY] ProjectPreview.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ProjectPreview.tsx)
  - Cập nhật `ProjectsListPreview` hỗ trợ layout `grid`, `sidebar`, `list`.

### 3. Các trang Experiences Editor
* `[MODIFY] posts-list/page.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/posts-list/page.tsx)
* `[MODIFY] resources-list/page.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-list/page.tsx)
* `[MODIFY] courses-list/page.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/courses-list/page.tsx)
* `[MODIFY] services-list/page.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/services-list/page.tsx)
* `[MODIFY] projects-list/page.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/projects-list/page.tsx)
  - Refactor layout tabs và select inputs về chuẩn: Grid, Sidebar, List.

### 4. Các trang hiển thị public (Storefront)
* `[MODIFY] PostsPage.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx)
* `[MODIFY] ResourcesPage.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)
* `[MODIFY] CoursesPage.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
* `[MODIFY] ServicesPage.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx)
* `[MODIFY] projects/page.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)
  - Render layout tương ứng dựa trên cấu hình: `grid`, `sidebar`, `list`.

### 5. Trang Hub Trải nghiệm
* `[MODIFY] experiences/page.tsx` (file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx)
  - Thêm tab "Cấu hình danh sách".
  - Triển khai form chỉnh sửa layout nhanh cho 6 trang danh sách.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Giai đoạn 1: Chuẩn hóa Config & Hooks:** Chỉnh sửa `useSiteConfig.ts` để map các layouts cũ và định nghĩa kiểu dữ liệu thống nhất.
2. **Giai đoạn 2: Refactor public storefront pages:**
   - Cập nhật `PostsPage.tsx` để hỗ trợ Grid (fullwidth), Sidebar (sidebar + grid), List (sidebar + list).
   - Cập nhật `ResourcesPage.tsx`, `CoursesPage.tsx`, `ServicesPage.tsx` để hỗ trợ render List layout (sử dụng horizontal cards).
   - Refactor `projects/page.tsx` để hỗ trợ Sidebar và List layouts mới (hiện tại chỉ có grid).
3. **Giai đoạn 3: Cập nhật các trang Admin Editor & Previews:**
   - Thay đổi các config tab trong các trang editor.
   - Cập nhật các preview component để hiển thị đúng giao diện mô phỏng 3 layouts.
4. **Giai đoạn 4: Triển khai Tab Cấu hình nhanh:**
   - Cập nhật `app/system/experiences/page.tsx` để thêm tab cấu hình và form tương ứng.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Dự án sử dụng OXlint và TypeScript. Chúng ta sẽ tin tưởng vào oxlint và build check tự động của Git hook khi commit.

### Manual Verification
- Mở trình duyệt truy cập `http://localhost:3000/system/experiences` để test tab "Cấu hình danh sách". Thay đổi bố cục thử nghiệm cho bài viết và tài nguyên.
- Kiểm tra các trang storefront tương ứng ngoài public để xác nhận giao diện đổi tương thích:
  - `/products`
  - `/posts`
  - `/resources`
  - `/khoa-hoc` (hoặc `/courses`)
  - `/services`
  - `/projects`

---

# VIII. Todo

- [ ] Sửa đổi `useSiteConfig.ts` để chuẩn hóa các layout hooks.
- [ ] Chỉnh sửa `PostsPage.tsx` ngoài public site và `PostsListPreview`.
- [ ] Chỉnh sửa `ResourcesPage.tsx` ngoài public site và `ResourcesListPreview`.
- [ ] Chỉnh sửa `CoursesPage.tsx` ngoài public site và `CoursesListPreview`.
- [ ] Chỉnh sửa `ServicesPage.tsx` ngoài public site và `ServicesListPreview`.
- [ ] Chỉnh sửa `projects/page.tsx` ngoài public site và `ProjectsListPreview`.
- [ ] Đồng bộ hóa các file Page quản trị trong `/system/experiences/*`.
- [ ] Cập nhật trang Hub Trải nghiệm `/system/experiences/page.tsx` để thêm tab cấu hình danh sách.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Tất cả 6 trang danh sách đều có tùy chọn cấu hình `layoutStyle` gồm 3 giá trị: `grid`, `sidebar`, `list`.
- Giao diện ngoài public hiển thị đúng bố cục khi thay đổi cấu hình.
- Chế độ `list` trên mọi trang hiển thị bài viết/tài nguyên/khóa học/dịch vụ/dự án theo dạng hàng ngang (horizontal cards) nhất quán.
- Tab "Cấu hình danh sách" hoạt động trơn tru, hiển thị đầy đủ 6 danh sách và lưu cấu hình thành công vào Convex DB.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Cấu hình cũ của khách hàng bị mất hoặc không tương thích.
* **Giải pháp:** Logic chuẩn hóa trong `useSiteConfig.ts` sẽ tự động map các giá trị legacy nên không làm ảnh hưởng đến các cấu hình cũ đã lưu. Nếu cần hoàn tác, chỉ cần checkout lại các file đã sửa qua Git.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi thiết kế của các trang Chi tiết (Detail pages).
* Không thay đổi các chức năng cốt lõi của từng module (mua hàng, tải tài nguyên, lọc thuộc tính đặc thù).
