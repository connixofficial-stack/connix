# I. Primer

## 1. TL;DR kiểu Feynman
Khi người quản trị bật module "Tài nguyên" (resources) trong hệ thống, họ mong muốn có thể dễ dàng thêm liên kết đến "Tất cả tài nguyên" hoặc các "Danh mục tài nguyên", hoặc từng "Tài nguyên chi tiết" vào thanh điều hướng (Menu) của trang web, giống như cách họ làm với Sản phẩm hay Bài viết. Hiện tại, trang quản lý Menu trong Admin (`/admin/menus`) chưa hỗ trợ module Tài nguyên này. Chúng ta sẽ giải quyết bằng cách:
1. Thêm một hàm truy vấn (query) trong backend Convex để lấy danh sách các tài nguyên đã xuất bản phục vụ cho việc chọn liên kết.
2. Cập nhật giao diện quản lý Menu ở frontend để hiển thị thêm các tùy chọn liên kết động liên quan đến Tài nguyên khi module này được bật.

## 2. Elaboration & Self-Explanation
Hiện nay, hệ thống có kiến trúc module động. Khi bật các module như `posts`, `products`, `services`, `courses`, `projects`, trang quản lý Menu (`/admin/menus`) sẽ tự động quét các module đang hoạt động (`enabledModules`) và đưa ra các liên kết gợi ý (Quick Routes) tương ứng:
- Liên kết danh sách (ví dụ: Tất cả bài viết, Tất cả sản phẩm).
- Liên kết danh mục (ví dụ: Danh mục sản phẩm A, Danh mục bài viết B).
- Liên kết chi tiết (ví dụ: Chọn một sản phẩm hoặc bài viết cụ thể).

Tuy nhiên, module `resources` (Tài nguyên) dù đã được định nghĩa trong hệ thống dữ liệu (bảng `resources` và `resourceCategories`), nhưng trang quản lý Menu chưa được đấu nối. Việc này khiến quản trị viên không thể chọn nhanh hoặc tạo menu tự động (Smart Menu) chứa các tài nguyên.
Ta sẽ tiến hành khai báo thêm cấu hình cho `resources` vào danh mục route, lấy dữ liệu danh mục tài nguyên đang hoạt động thông qua `resourceCategories`, và bổ sung một API query mới `listResourcesForPicker` ở phía Convex để lấy danh sách tài nguyên chi tiết. Sau đó đấu nối các phần này vào giao diện quản trị Menu.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Khi quản trị viên mở hộp thoại chọn liên kết nhanh (Quick Picker) trên giao diện Menu, họ chọn tab "Chi tiết". Trước đây họ chỉ thấy các tab con như "Bài viết chi tiết", "Sản phẩm chi tiết", v.v. Sau khi cập nhật, khi module "Tài nguyên" được bật, họ sẽ thấy thêm tab "Tài nguyên chi tiết", khi click vào sẽ hiển thị danh sách các tài nguyên (ví dụ: "Ebook Hướng dẫn lập trình", "Template Website Portfolio") kèm ô tìm kiếm để họ click chọn và thêm vào menu chỉ với 1 click.
- **Analogy (Phép ví von):** Menu giống như một bảng mục lục của một cuốn sách. Hệ thống module giống như các chương sách có thể viết thêm. Trước đây, cuốn sách có chương viết về sản phẩm, dự án, bài viết, và mục lục đã được thiết kế các ngăn đựng sẵn để điền tiêu đề các trang đó vào. Bây giờ chúng ta viết thêm chương "Tài nguyên" mới, chúng ta cần làm thêm một ngăn đựng tương ứng trên trang mục lục để người đọc có thể dễ dàng tra cứu và dẫn tới các trang tài nguyên đó.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file `lib/ia/route-mode.ts`: Định nghĩa kiểu `RoutableModuleKey` và các hàm tạo đường dẫn (`buildModuleListPath`, `buildCategoryPath`, `buildDetailPath`) đã hỗ trợ sẵn key `'resources'`.
- Đã kiểm tra Convex API: `api.resourceCategories.listActive` đã tồn tại và sẵn sàng hoạt động để lấy danh mục tài nguyên.
- Đã kiểm tra bảng `resources` trong `convex/schema.ts`: Có trường `status` (với các giá trị `Published`, `Draft`, `Archived`) và trường `categoryId` (liên kết với `resourceCategories`), phù hợp để xây dựng bộ lọc tìm kiếm tài nguyên.
- Trang quản lý menu tại `app/admin/menus/page.tsx` sử dụng cấu hình tĩnh `MODULE_SITE_ROUTE_CATALOG` và state `selectedModule` nhưng đang thiếu `'resources'`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Sự thiếu sót trong việc khai báo và đấu nối module `'resources'` vào trang quản lý menu `app/admin/menus/page.tsx` và thiếu API `listResourcesForPicker` trong file `convex/menus.ts`.
- **Giả thuyết đối chứng:** Nếu chỉ bật module mà không thêm khai báo và API picker, quản trị viên vẫn có thể copy link thủ công của tài nguyên (ví dụ `/resources/my-resource`) để dán vào trường URL tự do. Tuy nhiên cách này rất dễ sai sót, giảm trải nghiệm người dùng (UX) trầm trọng và không tận dụng được tính năng Smart Menu Builder tự động tạo cây menu theo module bật.

# IV. Proposal (Đề xuất)
1. **Phía Backend (Convex):**
   - Sửa tệp [menus.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/menus.ts): Định nghĩa thêm query `listResourcesForPicker` tương tự các module khác để tìm kiếm và trả về danh sách tài nguyên có status là `"Published"`.
2. **Phía Frontend (Admin UI):**
   - Sửa tệp [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/menus/page.tsx):
     - Bổ sung `'resources'` vào danh mục liên kết tĩnh `MODULE_SITE_ROUTE_CATALOG`.
     - Thêm `resourceCategories` qua query `api.resourceCategories.listActive`.
     - Thêm state và query `detailResources` sử dụng API mới `listResourcesForPicker`.
     - Cập nhật danh sách loại chi tiết `detailModuleOptions` để thêm tùy chọn "Tài nguyên chi tiết".
     - Bổ sung logic hiển thị kết quả và sự kiện click chọn cho tài nguyên trong hộp thoại Quick Picker.
     - Cập nhật giải thuật đề xuất menu thông minh `smartMenuPlan` để tự động đưa "Tài nguyên" và các danh mục tài nguyên con vào danh sách gợi ý khi module này được bật.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [menus.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/menus.ts): Bổ sung API `listResourcesForPicker` để frontend lấy danh sách tài nguyên phục vụ việc liên kết.
- **Sửa:** [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/menus/page.tsx): Cập nhật giao diện menu builder để tích hợp module tài nguyên vào danh sách liên kết nhanh, liên kết chi tiết và tính năng gợi ý thông minh (Smart Menu).

# VI. Execution Preview (Xem trước thực thi)
1. Định nghĩa và export hàm `listResourcesForPicker` trong `convex/menus.ts`.
2. Khai báo các biến trạng thái, query và config cho module `resources` trong Component `MenuItemsEditor` của `app/admin/menus/page.tsx`.
3. Đấu nối render các tab và danh sách tài nguyên trong hộp thoại Quick Picker.
4. Tích hợp tài nguyên vào logic Smart Menu đề xuất tự động.
5. Thực hiện verify tĩnh bằng cách đọc lại mã nguồn để đảm bảo không lỗi cú pháp hoặc kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Vì quy tắc cấm tự chạy build/lint, chúng ta sẽ tự thực hiện rà soát tĩnh (Static Review) cẩn thận về kiểu dữ liệu (TypeScript) trước khi hoàn tất.

### Manual Verification
- Quản trị viên truy cập http://localhost:3000/admin/menus.
- Bật module Resources tại http://localhost:3000/system/modules/resources.
- Quay lại trang Menus, bấm sửa Header Menu.
- Mở hộp thoại Quick Picker (Thêm liên kết nhanh):
  - Kiểm tra xem trong tab "Module" có xuất hiện "Tất cả tài nguyên" hay không.
  - Kiểm tra xem trong tab "Danh mục" có xuất hiện các danh mục tài nguyên đang hoạt động hay không.
  - Kiểm tra xem trong tab "Chi tiết" -> chọn "Tài nguyên chi tiết", có hiển thị danh sách tài nguyên đã xuất bản và hỗ trợ tìm kiếm hay không.
  - Bấm chọn thử một tài nguyên và kiểm tra xem liên kết có tự động điền đúng định dạng (ví dụ: `/resource-category-slug/resource-slug`) hay không.
  - Bấm "Gợi ý thông minh" (Smart Menu) xem tài nguyên có được đề xuất tự động vào cây menu tương ứng hay không.

# VIII. Todo
- [ ] Viết API `listResourcesForPicker` trong `convex/menus.ts`.
- [ ] Thêm liên kết tài nguyên vào `MODULE_SITE_ROUTE_CATALOG` trong `app/admin/menus/page.tsx`.
- [ ] Truy vấn dữ liệu `resourceCategories` và `detailResources` trong `app/admin/menus/page.tsx`.
- [ ] Đăng ký `'resources'` vào tập hợp các module chi tiết khả dụng `detailModuleOptions` và `selectedModule` type.
- [ ] Cập nhật UI render danh sách tài nguyên chi tiết và xử lý sự kiện khi chọn trong Quick Picker.
- [ ] Cập nhật giải thuật `smartMenuPlan` hỗ trợ đề xuất tài nguyên.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang `/admin/menus` tải bình thường không gặp bất kỳ lỗi runtime hay lỗi render nào.
- Khi module `resources` được bật, các menu item cho tài nguyên (tất cả tài nguyên, danh mục tài nguyên, tài nguyên chi tiết) hiển thị đầy đủ trong Quick Picker.
- Khi bấm chọn một tài nguyên chi tiết, URL của menu item được tạo ra khớp với cấu trúc đường dẫn thực tế (ví dụ: `/category-slug/resource-slug`).
- Khi tắt module `resources` trong cấu hình module hệ thống, các tùy chọn liên quan đến tài nguyên tự động ẩn đi trong trang quản lý menu (đảm bảo tính động và nhất quán).

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Lỗi type check do sai sót định nghĩa kiểu dữ liệu trong React state hoặc Convex query.
- **Hoàn tác:** Sử dụng Git để khôi phục lại trạng thái cũ của `convex/menus.ts` và `app/admin/menus/page.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào cách hiển thị menu thực tế ngoài trang chủ (layout frontend), chỉ chỉnh sửa trang quản lý Menu trong admin.
- Không thay đổi schema cơ sở dữ liệu hay thực hiện bất kỳ hoạt động migration dữ liệu nào.
