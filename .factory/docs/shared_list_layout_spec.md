# I. Primer

## 1. TL;DR kiểu Feynman
Hiện tại, mỗi trang danh sách storefront (Bài viết, Dự án, Tài nguyên, Khóa học, Dịch vụ) đang tự viết mã giao diện (UI code) cho 3 kiểu bố cục: Grid (Lưới), Sidebar (Cột lọc bên trái), và List (Thẻ ngang). Điều này dẫn đến sự không nhất quán về khoảng cách, kích thước font chữ, bo góc (Corner Radius) và trải nghiệm bộ lọc trên thiết bị di động.
Chúng ta sẽ lấy thiết kế 3 layout chuẩn của trang Sản phẩm làm thước đo, trừu tượng hóa nó thành một thành phần dùng chung duy nhất có tên là `SharedListLayout`. Sau đó, chúng ta thay thế mã giao diện của cả 5 trang trên bằng cách gọi `SharedListLayout` và truyền vào các tham số (props) tương ứng (mảng dữ liệu, hàm render card riêng, v.v.). Việc này giúp giao diện toàn hệ thống đồng bộ 100% và dùng chung một nguồn mã duy nhất (Single Source of Truth).

## 2. Elaboration & Self-Explanation
Việc duy trì các giao diện danh sách riêng lẻ cho từng module dẫn đến các vấn đề sau:
- **Lặp mã nguồn (Code Duplication)**: Các tính năng như phân trang, bộ lọc tìm kiếm, thanh công cụ desktop, thanh kéo chỉ thị (Drag Handle) và Bottom Sheet lọc trên mobile bị lặp lại ở 5-6 file khác nhau.
- **Thiếu nhất quán (Inconsistency)**: Khoảng cách padding, cỡ chữ của PageHeader, bo góc viền của các card, và hành vi kéo/chạm ở thiết bị di động không đồng đều giữa các trang.
- **Khó bảo trì (Maintenance Overhead)**: Khi muốn nâng cấp trải nghiệm (ví dụ: cải tiến hiệu ứng mở Bottom Sheet trên mobile), chúng ta phải chỉnh sửa thủ công ở tất cả các trang module.

**Giải pháp**:
Xây dựng component `<SharedListLayout>` nhận kiểu dữ liệu generic `<T>` đại diện cho phần tử danh sách. Component này sẽ chịu trách nhiệm vẽ toàn bộ khung bố cục (Grid/Sidebar/List), thanh công cụ Desktop Toolbar, bộ lọc Mobile Bottom Sheet, phân trang và trạng thái trống (Empty State). Mỗi trang module cụ thể chỉ cần lo phần truy vấn dữ liệu từ Convex DB, quản lý các state lọc/sort, và truyền hàm `renderItem(item: T)` để tự render card sản phẩm/dự án/bài viết của mình.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng một chuỗi cửa hàng cà phê nổi tiếng. Thay vì mỗi cửa hàng tự thiết kế quầy thanh toán, kệ trưng bày menu và bảng chỉ dẫn theo ý thích của quản lý chi nhánh (làm khách hàng thấy bối rối khi đổi quán), tổng công ty sẽ cung cấp một bộ module quầy kệ chuẩn hóa duy nhất. Cửa hàng ở Hà Nội hay TP.HCM chỉ việc lắp đặt bộ quầy kệ chuẩn đó và đặt các sản phẩm đặc trưng của mình lên trên. Khách hàng đi đâu cũng cảm thấy quen thuộc, đồng bộ và chuyên nghiệp.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Vị trí kiểm tra**: Các trang danh sách storefront công khai bao gồm `/projects`, `/posts`, `/resources`, `/khoa-hoc` (courses), và `/services`.
- **Hành vi hiện tại**: 
  - Mỗi trang tự quản lý cấu trúc layout riêng lẻ.
  - Các class bo góc, padding, font size không hoàn toàn đồng bộ.
  - Cách triển khai Bottom Sheet lọc ở mobile và Desktop Toolbar có sự sai lệch nhỏ về thiết kế.
- **Hành vi mong muốn**: 
  - Tất cả 5 trang chuyển sang dùng chung component `<SharedListLayout>`.
  - Đồng bộ hóa 100% UI/UX theo tiêu chuẩn thiết kế cao cấp (Apple Premium).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Do lịch sử phát triển, các trang storefront được clone code từ nhau rồi chỉnh sửa ad-hoc, dẫn tới phân mảnh giao diện (UI fragmentation) và thiếu một component trừu tượng hóa layout ở cấp hệ thống.
- **Giả thuyết đối chứng**: Nếu ta gom toàn bộ mã nguồn xử lý 3 layout (Grid, Sidebar, List) cùng toolbar và mobile bottom sheet từ trang Sản phẩm (module hoàn thiện nhất) thành `<SharedListLayout>`, ta sẽ loại bỏ được hơn 60% code giao diện lặp ở các trang con, đồng thời tự động đồng bộ hóa mọi thay đổi giao diện về sau chỉ tại một nơi duy nhất.

---

# IV. Proposal (Đề xuất)

### 1. Tạo component `<SharedListLayout>`
Tạo file [SharedListLayout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/shared/SharedListLayout.tsx) hỗ trợ các props sau:
```typescript
interface SharedListLayoutProps<T> {
  // Dữ liệu và trạng thái tải
  items: T[];
  totalCount?: number;
  isLoading: boolean;
  unit?: string; // Ví dụ: "dự án", "bài viết", "tài nguyên"
  
  // Cấu hình giao diện
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns?: number; // 3 hoặc 4 cột
  cornerRadius?: 'none' | 'sm' | 'lg';
  
  // Thanh tìm kiếm
  showSearch?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  
  // Sắp xếp
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOptions: { value: string; label: string }[];
  
  // Bộ lọc chung
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  
  // Hàm hiển thị
  renderItem: (item: T, index: number) => React.ReactNode;
  renderSkeleton: () => React.ReactNode;
  emptyMessage?: string;
  
  // Dropdown bộ lọc tùy biến (lắp ghép linh hoạt)
  renderToolbarFilters?: () => React.ReactNode; // Hiện ở Desktop Toolbar
  renderSidebarFilters?: () => React.ReactNode; // Hiện ở Desktop Sidebar (chỉ khi dùng layoutStyle === 'sidebar')
  renderMobileFilters?: (closeSheet: () => void) => React.ReactNode; // Hiện ở Mobile Bottom Sheet
  
  // Phân trang / Cuộn vô hạn
  paginationNode?: React.ReactNode;
  infiniteScrollTriggerNode?: React.ReactNode;
  
  // Tùy biến tiêu đề trang (Page Header)
  headerTitle?: string;
  headerDescription?: string;
}
```

### 2. Tiến hành Refactor các trang storefront
- **Dự án**: Thay thế code trong [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx).
- **Bài viết**: Thay thế code trong [PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx) và [PostsPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx).
- **Tài nguyên**: Thay thế code trong [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx).
- **Khóa học**: Thay thế code trong [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx).
- **Dịch vụ**: Thay thế code trong [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx) và [ServicesPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/ServicesPage.tsx).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### [NEW] [SharedListLayout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/shared/SharedListLayout.tsx)
- **Vai trò hiện tại**: Chưa tồn tại.
- **Thay đổi**: Tạo mới component dùng chung, tích hợp 3 layout, toolbar desktop, bottom sheet lọc mobile và PageHeader căn giữa.

### [MODIFY] [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)
- **Vai trò hiện tại**: File trang danh sách dự án storefront.
- **Thay đổi**: Loại bỏ code vẽ layout thủ công, chuyển sang gọi component `<SharedListLayout>`.

### [MODIFY] [PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx)
- **Vai trò hiện tại**: File trang danh sách bài viết storefront.
- **Thay đổi**: Thay thế import layout cũ bằng `<SharedListLayout>`.

### [MODIFY] [PostsPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx)
- **Vai trò hiện tại**: Trang danh sách bài viết theo danh mục.
- **Thay đổi**: Áp dụng tương tự `<SharedListLayout>`.

### [MODIFY] [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)
- **Vai trò hiện tại**: Trang danh sách tài nguyên storefront.
- **Thay đổi**: Loại bỏ code vẽ layout thủ công, chuyển sang gọi component `<SharedListLayout>`.

### [MODIFY] [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
- **Vai trò hiện tại**: Trang danh sách khóa học storefront.
- **Thay đổi**: Loại bỏ code vẽ layout thủ công, chuyển sang gọi component `<SharedListLayout>`.

### [MODIFY] [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx)
- **Vai trò hiện tại**: Trang danh sách dịch vụ storefront.
- **Thay đổi**: Loại bỏ code vẽ layout thủ công, chuyển sang gọi component `<SharedListLayout>`.

### [MODIFY] [ServicesPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/ServicesPage.tsx)
- **Vai trò hiện tại**: Trang danh sách dịch vụ theo danh mục.
- **Thay đổi**: Áp dụng tương tự `<SharedListLayout>`.

---

# VI. Execution Preview (Xem trước thực thi)

1. Tạo file [SharedListLayout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/shared/SharedListLayout.tsx) với code layout hoàn chỉnh dựa trên products list layout.
2. Refactor trang [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx) để kiểm chứng tính hoạt động và độ tương thích của component dùng chung.
3. Lần lượt refactor các trang: Bài viết, Tài nguyên, Khóa học, Dịch vụ.
4. Chạy lệnh typecheck `bunx tsc --noEmit` để đảm bảo toàn hệ thống không phát sinh lỗi biên dịch.
5. Tiến hành commit các thay đổi và file spec.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy typecheck: `bunx tsc --noEmit` để đảm bảo code sạch lỗi TypeScript.

### Manual Verification
- Kiểm tra các trang trên môi trường local (localhost:3000):
  - Click chuyển đổi qua lại cả 3 layout (Grid, Sidebar, List) xem có hiển thị chuẩn không.
  - Kiểm tra bộ lọc danh mục và ô tìm kiếm trên Desktop.
  - Thu nhỏ trình duyệt về mobile, mở thử Bottom Sheet bộ lọc, kiểm tra Drag Handle và nút "Áp dụng", "Thiết lập lại".

---

# VIII. Todo

- [ ] Tạo component [SharedListLayout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/shared/SharedListLayout.tsx).
- [ ] Thay thế layout trong [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx).
- [ ] Thay thế layout trong [PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx) và [PostsPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx).
- [ ] Thay thế layout trong [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx).
- [ ] Thay thế layout trong [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx).
- [ ] Thay thế layout trong [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx) và [ServicesPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/ServicesPage.tsx).
- [ ] Chạy tsc --noEmit.
- [ ] Thực hiện Git commit.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Cả 5 trang storefront (`/projects`, `/posts`, `/resources`, `/khoa-hoc`, `/services`) hiển thị đồng bộ 100% về mặt thiết kế (spacing, font size, padding, layout).
2. Trải nghiệm lọc trên thiết bị di động đồng nhất dưới dạng Bottom Sheet vuốt kéo từ đáy lên với đầy đủ Drag Handle và Sticky Footer Action Bar.
3. Toàn bộ mã nguồn biên dịch thành công (không có lỗi typecheck).

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Lỗi kiểu dữ liệu (TypeScript type errors) khi truyền card component khác nhau vào generic type `<T>`.
- **Biện pháp khắc phục**: Khai báo prop generic chặt chẽ và để các trang con tự chịu trách nhiệm định nghĩa layout card riêng qua `renderItem(item: T)`.
- **Hoàn tác**: Sử dụng lệnh `git restore` để đưa các file về trạng thái trước chỉnh sửa.

---

# XI. Out of Scope (Ngoài phạm vi)

- Chỉnh sửa trang chi tiết của các thực thể (chỉ làm việc trên trang danh sách).
- Thay đổi cấu trúc cơ sở dữ liệu Convex.
