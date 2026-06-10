# QA Tickets – Experiences Search

## Problem Graph
1. [Main] QA tickets cho /system/experiences/search <- depends on 1.1, 1.2
   1.1 [Sub] Đối chiếu Search experience với các experience khác
   1.2 [Sub] Kiểm tra module/status & liên kết trang chủ (site)

## Execution (with reflection)
1. Solving 1.1
   - Thought: So sánh UI/feature trong [search page](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/search/page.tsx) với posts/products/services list.
   - Action: Đọc [posts list](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/posts-list/page.tsx), [products list](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/products-list/page.tsx), [services list](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/services-list/page.tsx).
   - Reflection: ✓ Valid
2. Solving 1.2
   - Thought: Tìm liên kết module + trạng thái module + trang chủ.
   - Action: Đọc [ExperienceModuleLink](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/experiences/ExperienceModuleLink.tsx), [home page](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/%28site%29/page.tsx).
   - Reflection: ✓ Valid

## QA Tickets (DARE)
1) **[Search] Thiếu Example Links/CTA như các list experiences** (Priority: Medium)
   - **D**: Search experience không có “Link xem thử” như posts/products/services list.
   - **A**: So với [posts list](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/posts-list/page.tsx) và [products list](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/products-list/page.tsx) có ExampleLinks.
   - **R**: QA: kiểm tra UX điều hướng từ experience -> site preview thiếu.
   - **E**: Cân nhắc thêm ExampleLinks (search page URL) hoặc chỉ rõ “chưa có trang search site”.

2) **[Search] Không phản ánh trạng thái module trong toggle (chưa disable)** (Priority: High)
   - **D**: Toggle Filters/Sorting/Result count không bị disable theo module (posts/products/services) như list pages.
   - **A**: [products list](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/products-list/page.tsx) disable theo module enabled; search không.
   - **R**: QA: bật/tắt module nhưng experience vẫn cho chỉnh, gây lệch.
   - **E**: Đề xuất disable theo module liên quan hoặc hiển thị trạng thái.

3) **[Search] Không có liên kết “Module & liên kết”/status chi tiết** (Priority: Medium)
   - **D**: Search chỉ hiển thị 3 module link, không có status chi tiết (module feature status) như products list.
   - **A**: [products list](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/products-list/page.tsx) có ModuleFeatureStatus.
   - **R**: QA: thiếu thông tin trạng thái làm khó xác định nguyên nhân.
   - **E**: Thêm status module/feature liên quan (search, filters).

4) **[Search] Không có cấu hình pagination hoặc “postsPerPage” như list** (Priority: Medium)
   - **D**: Search config chỉ có result display, filters, sorting, count.
   - **A**: List experiences có paginationType & postsPerPage (posts/products/services).
   - **R**: QA: có thể thiếu parity tính năng với list trải nghiệm.
   - **E**: Xác định requirement: search có cần pagination hay không.

5) **[Search] Preview không dùng brandColor từ setting** (Priority: Medium)
   - **D**: Search preview dùng hard-coded brandColor "#14b8a6".
   - **A**: List pages dùng brandColor từ setting.
   - **R**: QA: preview có thể không phản ánh theme.
   - **E**: Đề xuất lấy site_brand_color cho preview.

6) **[Search] Không có liên kết/khai báo liên quan trang chủ** (Priority: Low)
   - **D**: Search experience không chỉ ra vị trí xuất hiện ở trang chủ.
   - **A**: [home page](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/%28site%29/page.tsx) render components, nhưng search không có mapping.
   - **R**: QA: unclear “giao diện tương ứng ở trang chủ”.
   - **E**: Xác nhận search experience có component home hay không; nếu có, thêm link.

7) **[Search] Không có đồng bộ với site route search** (Priority: High)
   - **D**: Không thấy route site /search trong app (site).
   - **A**: Không có file under app/(site)/search.
   - **R**: QA: config có thể không apply anywhere.
   - **E**: Xác nhận requirement: có cần trang search site hay không.

8) **[Search] Thiếu mô tả về module phụ thuộc trong UI** (Priority: Low)
   - **D**: Search page không mô tả phụ thuộc module posts/products/services theo layout.
   - **A**: Các list pages có hint/notes rõ hơn + module link/feature.
   - **R**: QA: user khó hiểu feature hoạt động với module nào.
   - **E**: Thêm hint mô tả dependency.

9) **[Search] Không có trạng thái loading module** (Priority: Medium)
   - **D**: `isLoading` chỉ dựa vào `experienceSetting === undefined`, không chờ `postsModule`, `productsModule`, `servicesModule`.
   - **A**: `products-list` và `services-list` chờ đầy đủ module query trong điều kiện loading.
   - **R**: QA: render module link có thể undefined trong loading.
   - **E**: Cân nhắc `isLoading = experienceSetting === undefined || postsModule === undefined || productsModule === undefined || servicesModule === undefined`.

10) **[Search] Không có layout option sync với legacy keys** (Priority: Low)
   - **D**: Posts list có legacy key sync; search không.
   - **A**: [posts list](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/experiences/posts-list/page.tsx) sync posts_list_style.
   - **R**: QA: nếu có legacy config, search không migrate.
   - **E**: Xác nhận legacy keys, nếu có thì migrate.

11) **[Search] Thiếu hook useSearchFilterConfig trong useSiteConfig.ts** (Priority: Medium)
   - **D**: Chưa có hook đọc `search_filter_ui` ở `lib/experiences/useSiteConfig.ts`.
   - **A**: Các experience khác đều có hook tương ứng (`usePostsListConfig`, `useProductsListConfig`, `useServicesListConfig`, ...).
   - **R**: QA: khó tái sử dụng cấu hình Search ở site layer, dễ dẫn tới config “lưu được nhưng không dùng”.
   - **E**: Bổ sung `useSearchFilterConfig` để chuẩn hóa pattern đọc config.

12) **[Search] Thiếu export useSearchFilterConfig trong lib/experiences/index.ts** (Priority: Low)
   - **D**: Nếu thêm hook mới nhưng không export tại `lib/experiences/index.ts` thì các nơi dùng qua barrel import sẽ không truy cập được.
   - **A**: `index.ts` đang export các hook site config khác, riêng Search chưa có.
   - **R**: QA: dễ tạo inconsistency giữa API public của module experiences.
   - **E**: Export hook mới tại `lib/experiences/index.ts`.

13) **[Search] Thiếu dark mode class cho tiêu đề chính** (Priority: Low)
   - **D**: Tiêu đề `h1` ở trang Search chưa có `text-slate-900 dark:text-slate-100` như các trang list khác.
   - **A**: `posts-list` đã có đầy đủ class cho dark mode text.
   - **R**: QA: UI không đồng nhất giữa light/dark mode.
   - **E**: Bổ sung class dark mode cho tiêu đề chính.
