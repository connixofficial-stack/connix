# Spec Fix: Đồng bộ cấu hình hiển thị danh sách sản phẩm (Admin vs Site thực) & QA Debt Report

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Cấu hình trang danh sách sản phẩm ở admin (ẩn nút Thêm giỏ, nút Yêu thích, ẩn danh mục rỗng) không đồng bộ ra site thực công cộng. Lý do là vì hook `useProductsListConfig()` ở frontend và logic xử lý loading/fallback của client component bị bất đồng bộ, khiến client hiển thị theo giá trị mặc định (`true`) thay vì lấy từ cấu hình database thực tế. Đồng thời, cấu trúc mã nguồn đang chứa nhiều "dead code" (mã nguồn dư thừa không sử dụng) gây gánh nặng bảo trì.
* **Cách sửa**: 
  * Đồng bộ lại hook `useProductsListConfig` để xử lý trạng thái loading chuẩn xác.
  * Cập nhật logic lọc danh mục rỗng tại backend Convex để kiểm tra đúng trạng thái hoạt động của sản phẩm.
  * Dọn dẹp các tệp tin dư thừa không sử dụng để tối ưu hóa hiệu năng và dung lượng mã nguồn.

## 2. Elaboration & Self-Explanation
Hệ thống trải nghiệm (Experiences) cho phép admin bật/tắt động các nút tương tác (Wishlist, Add to Cart, Buy Now) trên danh sách sản phẩm. Khi cấu hình thay đổi, dữ liệu được ghi vào bảng `settings` của Convex dưới key `products_list_ui`. 
Tại site thực `/products`, component `ProductsPage` sử dụng hook `useProductsListConfig` để lấy cấu hình này. 
Tuy nhiên:
* **Lỗi logic loading**: Khi hook chưa lấy xong dữ liệu từ Convex (trạng thái `undefined`), nó trả về cấu hình mặc định (tất cả nút đều bật - `true`). Quá trình re-render sau khi load xong không cập nhật chính xác do hydration mismatch hoặc logic dependency trong component không phản ứng kịp.
* **Lỗi danh mục rỗng**: Logic ẩn danh mục rỗng (`hideEmptyCategories`) phụ thuộc vào truy vấn `listNonEmptyCategoryIds`. Nếu logic đếm sản phẩm hoạt động sai (ví dụ không lọc sản phẩm đã bị ẩn/xóa), danh mục rỗng vẫn được tính là có sản phẩm và hiển thị ngoài client.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Admin cấu hình tắt nút "Wishlist" vì cửa hàng không muốn dùng tính năng này. Hệ thống lưu thành công `showWishlistButton: false` xuống database. Nhưng khi khách hàng truy cập `/products`, trong 0.5 giây đầu tiên khi trang đang tải cấu hình, hệ thống trả về giá trị mặc định là `true` và vẽ nút Wishlist ra màn hình. Khi tải xong cấu hình thực tế, do lỗi hydration hoặc thiếu cập nhật state, nút này vẫn nằm lỳ ở đó và khách hàng vẫn bấm được.
* **Hình ảnh đời thường**: Giống như một nhà hàng treo biển hiệu điện tử ngoài cửa. Khi mất điện hoặc đang khởi động (trạng thái Loading), biển mặc định hiển thị dòng chữ "Mở cửa" (Default true). Ngay cả khi quản lý đã bấm nút "Đóng cửa" trong hệ thống điều khiển, tấm biển vẫn bị treo ở trạng thái "Mở cửa" khiến khách hàng hiểu lầm.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Trạng thái Git**: Nhánh `master` đang sạch, không có thay đổi chưa commit.
* **Trạng thái Database**:
  * Tài liệu `products_list_ui` trong Convex đang lưu đúng giá trị:
    * `showWishlistButton: false`
    * `showPromotionBadge: false`
    * `showAddToCartButton: true` (ở Admin switch hiển thị OFF nhưng DB vẫn lưu `true` do sự sai lệch của biến `canUseCart` lúc lưu).
  * Trạng thái module: `wishlist` đang bị vô hiệu hóa (`enabled: false`), `cart` và `orders` đang kích hoạt (`enabled: true`).
* **Vấn đề Technical/Design/UX Debt**:
  * Tồn tại tệp tin `app/(site)/[categorySlug]/_components/ProductsPage.tsx` có dung lượng ~85KB hoàn toàn là dead code do route dynamic `/[categorySlug]` đã import trực tiếp trang `/products` dùng chung.
  * Khối "Module liên quan" ở trang cấu hình hiển thị Admin đang hiển thị trùng lặp: Render song song cả link module chính `ExperienceModuleLink` lẫn chi tiết tính năng `ModuleFeatureStatus` cho cùng một thực thể (ví dụ: Giỏ hàng, Đơn hàng) gây rối mắt.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Root Cause Confidence: High

* **Nguyên nhân gốc (Root Cause)**:
  1. **Lỗi logic loading**: Client component tại site thực render ngay lập tức khi hook `useProductsListConfig` trả về default config (trong lúc `useQuery` đang loading). Khi load xong, state client không đồng bộ re-render hoặc bị mismatch hydration làm đóng băng giao diện.
  2. **Lỗi `hideEmptyCategories`**: Query `listNonEmptyCategoryIds` trong Convex quét toàn bộ sản phẩm hoạt động nhưng chưa lọc kỹ các sản phẩm có status là `"Draft"` hoặc bị xóa tạm thời, dẫn đến việc danh mục không có sản phẩm mở bán vẫn hiển thị trên thanh sidebar.
  3. **Lỗi đồng bộ Admin Save**: Hàm `beforeSaveTransform` trong admin ép trạng thái nút dựa trên module `canUseCart` nhưng logic check module này tại admin page bị lệch so với site thực.

* **Giả thuyết đối chứng (Counter-Hypothesis)**: Nếu chỉ sửa hiển thị ở CSS mà không đồng bộ logic hook backend, khi mạng chậm hoặc load lần đầu, client vẫn bị giật layout (Flickering UI) từ trạng thái đầy đủ nút sang ẩn nút. Do đó bắt buộc phải đồng bộ hóa trạng thái loading tại cả hook và UI component.

---

# IV. Proposal (Đề xuất)

1. **Sửa hook `useProductsListConfig`**: Trả về thêm cờ `isLoading` để client component hiển thị skeleton hoặc trì hoãn render các nút chức năng cho đến khi cấu hình được tải xong hoàn toàn.
2. **Sửa logic Convex `listNonEmptyCategoryIds`**: Chỉ đếm các sản phẩm có `status: "Active"`.
3. **Dọn dẹp dead code**: Xóa bỏ tệp tin dư thừa `app/(site)/[categorySlug]/_components/ProductsPage.tsx`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/experiences/useSiteConfig.ts) - Cập nhật hook `useProductsListConfig` để trả về cờ `isLoading` và đồng bộ hóa logic fallback.
* **Sửa**: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductsPage.tsx) - Thêm check loading cấu hình trước khi render các nút hành động nhằm tránh flickering.
* **Sửa**: [productCategories.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productCategories.ts) - Lọc sản phẩm `"Active"` trong logic đếm danh mục không rỗng.
* **Xóa**: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/_components/ProductsPage.tsx) - Loại bỏ tệp dead code.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc & Phân tích**: Rà soát kỹ mảng dependencies trong `useMemo` của các hook config.
2. **Cập nhật backend**: Chỉnh sửa query đếm sản phẩm trong danh mục của Convex.
3. **Cập nhật frontend**: Đồng bộ hook `useProductsListConfig` và sửa UI render tại `ProductsPage.tsx` storefront.
4. **Dọn dẹp**: Xóa file dead code.
5. **Kiểm tra tĩnh**: Chạy Oxlint và TypeScript compiler để xác minh không có lỗi linter.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kế hoạch kiểm chứng: Typecheck và manual check
* **Kiểm tra tự động**: Chạy kiểm tra kiểu tĩnh (Static Typecheck) để bảo đảm không lỗi import sau khi xóa file dead code:
  `bunx tsc --noEmit`
* **Kiểm tra thủ công**:
  1. Vào admin tắt nút "Yêu thích" và "Thêm giỏ hàng", nhấn **Lưu**.
  2. Tải lại trang `/products` ngoài site thực, xác minh các nút tương ứng đã biến mất hoàn toàn.
  3. Tạo một danh mục mới không có sản phẩm nào, xác minh danh mục đó không xuất hiện trên thanh sidebar.

---

# VIII. Todo
- [ ] Chỉnh sửa Convex backend `convex/productCategories.ts` để lọc sản phẩm `"Active"`.
- [ ] Cập nhật `lib/experiences/useSiteConfig.ts` bổ sung `isLoading` vào hook `useProductsListConfig`.
- [ ] Cập nhật `app/(site)/_components/products/ProductsPage.tsx` để xử lý trạng thái loading cấu hình.
- [ ] Xóa bỏ file dead code `app/(site)/[categorySlug]/_components/ProductsPage.tsx`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* **Đạt**: Ngoài site thực `/products` hiển thị giao diện các nút và danh mục khớp 100% với cấu hình thiết lập trong admin. Không bị giật nút khi tải lại trang.
* **Không đạt**: Vẫn hiển thị nút "Wishlist" khi module wishlist tắt hoặc config tắt.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi import nếu tệp dead code vẫn bị chỉ định ở đâu đó.
* **Hoàn tác**: Sử dụng `git checkout` để rollback nhanh các tệp frontend về trạng thái trước khi chỉnh sửa.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thiết kế lại giao diện card sản phẩm hoặc chỉnh sửa CSS của trang chi tiết sản phẩm.

---

# XII. Open Questions (Câu hỏi mở)
* Không có câu hỏi mở.

---

# XIII. QA Tickets (Nợ kỹ thuật & Trải nghiệm)

Dưới đây là danh sách các Debt & Issues được tổng hợp dưới dạng các Ticket QA chi tiết để theo dõi và xử lý:

### 🎫 TICKET-001: Technical Debt - Dead Code Clean-up
* **Loại**: Technical Debt (Nợ kỹ thuật)
* **Vấn đề**: File [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/_components/ProductsPage.tsx) nặng ~85KB là tệp tin chết, trùng lặp hoàn toàn với trang danh sách sản phẩm dùng chung nhưng không được dọn dẹp.
* **Giải pháp**: Tiến hành xóa bỏ tệp tin này và cập nhật lại toàn bộ đường dẫn import liên quan nếu có.
* **Tiêu chí nghiệm thu**: Dự án build thành công và không còn tệp tin này trong git tree.

### 🎫 TICKET-002: Design & UX Debt - Trùng lặp liên kết module tại cấu hình Admin
* **Loại**: Design & UX Debt (Nợ thiết kế & Trải nghiệm)
* **Vấn đề**: Giao diện admin phần "Module liên quan" render cả `ExperienceModuleLink` lẫn `ModuleFeatureStatus` cho cùng một thực thể (Giỏ hàng, Đơn hàng, Yêu thích) làm thừa thãi thông tin.
* **Giải pháp**: Hợp nhất hoặc ẩn các dòng trạng thái dư thừa, chỉ giữ lại một đại diện liên kết duy nhất có chứa trạng thái bật/tắt.
* **Tiêu chí nghiệm thu**: Giao diện admin "Module liên quan" chỉ hiển thị tối đa 1 dòng cho mỗi module (Giỏ hàng, Đơn hàng, Khuyến mãi, Wishlist).

### 🎫 TICKET-003: Usability Issue - Hydration Flickering khi tải cấu hình site thực
* **Loại**: Usability Issue (Lỗi khả dụng)
* **Vấn đề**: Trạng thái loading của config trải nghiệm khiến các nút bấm bị giật (từ hiện nút sang ẩn nút) khi load trang `/products` do client render trước khi nhận được dữ liệu DB.
* **Giải pháp**: Đưa trạng thái `isLoading` vào skeleton render. Trì hoãn hiển thị cho tới khi `useProductsListConfig` trả về giá trị thực tế.
* **Tiêu chí nghiệm thu**: Khách hàng F5 không thấy các nút chớp tắt (flicker).

### 🎫 TICKET-004: Functional Bug - Ẩn danh mục rỗng không hoạt động chính xác
* **Loại**: Functional Bug (Lỗi chức năng)
* **Vấn đề**: Tùy chọn "Ẩn danh mục rỗng" không hoạt động do backend Convex trả về cả những danh mục chứa sản phẩm ở trạng thái `"Draft"` hoặc `"Archived"`.
* **Giải pháp**: Cập nhật logic `listNonEmptyCategoryIds` để chỉ đếm sản phẩm có trạng thái `"Active"`.
* **Tiêu chí nghiệm thu**: Danh mục không có sản phẩm đang hoạt động bán sẽ không xuất hiện trên thanh sidebar site thực.

### 🎫 TICKET-005: Design & UX Debt - Lệch layout Sidebar storefront so với Preview admin
* **Loại**: Design & UX Debt (Nợ thiết kế & Trải nghiệm)
* **Vấn đề**: Layout Sidebar ngoài storefront (`CatalogLayout` và `ListLayout`) không đồng bộ với Preview trong trang quản trị. Ô Tìm kiếm hiển thị sai vị trí (Toolbar ngang thay vì Sidebar bên trái) và các bộ lọc hiển thị không đúng định dạng khung viền box.
* **Giải pháp**:
  * Truyền cấu hình `showSearch` và `showCategories` vào `CatalogLayout` và `ListLayout`.
  * Đưa ô Tìm kiếm vào Sidebar bên trái trên desktop, ẩn ô tìm kiếm ở Toolbar ngang trên desktop (chỉ hiện trên mobile).
  * Định dạng lại danh sách Danh mục ở Sidebar theo dạng khung viền box giống Preview admin.
* **Tiêu chí nghiệm thu**: Giao diện Sidebar storefront khớp với giao diện Preview trong trang quản trị `/system/experiences/products-list`.
