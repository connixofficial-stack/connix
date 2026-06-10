# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Tệp tin `app/(site)/_components/products/ProductsPage.tsx` hiện tại chứa hơn 3200 dòng mã nguồn. Linter tĩnh `oxlint` cảnh báo tệp quá dài (`File is too long to fit on the screen`) và nghi ngờ đây là tệp đã qua rút gọn (minified). Cấu trúc khổng lồ này gây cản trở việc đọc mã, bảo trì và tối ưu hiệu năng.
* **Giải pháp**: 
  1. Phân rã tệp tin khổng lồ này thành **5 mô-đun chức năng** nhỏ hơn trong cùng một thư mục.
  2. Gom nhóm thông minh: tạo các tệp chuyên biệt về Giao diện Trạng thái Chờ (`Skeletons.tsx`), Mô-đun bộ lọc (`FilterComponents.tsx`), Thẻ sản phẩm & Danh sách (`ProductCardComponents.tsx`), và Bố cục trang (`LayoutComponents.tsx`).
  3. Tệp tin chính `ProductsPage.tsx` chỉ giữ lại logic quản lý state, các Convex Queries / Mutations, điều hướng URL và render chính.
  4. Đảm bảo toàn bộ import/export hoạt động chính xác mà không thay đổi bất kỳ logic runtime hay UI nào.

## 2. Elaboration & Self-Explanation
Việc dồn toàn bộ logic nghiệp vụ (business logic) cùng với các component hiển thị (presentation components) vào một tệp tin duy nhất là một "anti-pattern" phổ biến trong phát triển React. Khi quy mô của bộ lọc thuộc tính và các kiểu layout (catalog, list, grid) mở rộng, tệp tin phình to vượt quá tầm kiểm soát.
* **Tệp Skeletons**: Giúp cô lập logic hiển thị trạng thái chờ tải của cả lưới sản phẩm và toàn bộ trang.
* **Tệp Filters**: Đóng gói logic phân tích khoảng giá dạng số (`parseNumericValue`), xử lý bộ lọc thuộc tính (`AttributeFilterGroupWidget`) và giao diện lọc động trên thiết bị di động (`MobileProductsFilters`).
* **Tệp ProductCard**: Tập hợp các hạt nhân hiển thị nhỏ hơn như các nút hành động (`ProductCardActions`), danh sách nhãn thuộc tính (`ProductAttributesBadges`), lưới sản phẩm (`ProductGrid`), danh sách sản phẩm (`ProductList`), và trạng thái rỗng (`EmptyState`).
* **Tệp Layouts**: Đóng gói các bộ khung hiển thị chính như Catalog (`CatalogLayout`), List (`ListLayout`) và helper phân trang (`generatePaginationItems`).
Sau khi phân tách, mỗi tệp tin chỉ còn từ 150 đến 800 dòng mã nguồn, đạt tiêu chuẩn sạch của kiến trúc mã nguồn hiện đại và giúp `oxlint` hoàn toàn thỏa mãn.

## 3. Concrete Examples & Analogies
* **Ẩn dụ**: Giống như việc đóng gói hành lý cho một chuyến đi dài. Thay vì dồn mọi thứ từ quần áo, giày dép, đồ vệ sinh cá nhân, thuốc men đến sách vở vào một chiếc vali khổng lồ duy nhất (khiến nó cực kỳ nặng, khóa kéo muốn đứt và rất khó tìm đồ), chúng ta phân loại và xếp chúng vào các túi nhỏ chuyên biệt (túi đựng đồ vệ sinh, túi quần áo, túi thuốc men). Chiếc vali lớn lúc này chỉ đóng vai trò chứa các túi nhỏ đó một cách ngăn nắp và khoa học.
* **Ví dụ code**:
  * *Trước*:
    ```typescript
    // ProductsPage.tsx
    export default function ProductsPage() { ... }
    function ProductsListSkeleton() { ... }
    function ProductCard() { ... }
    function CatalogLayout() { ... }
    ```
  * *Sau*:
    ```typescript
    // ProductsPage.tsx (vali chính)
    import { ProductsListSkeleton } from './Skeletons';
    import { CatalogLayout } from './LayoutComponents';
    export default function ProductsPage() { ... }
    ```

# II. Audit Summary (Tóm tắt kiểm tra)
* **Kích thước hiện tại**: `ProductsPage.tsx` có dung lượng ~152KB, chứa 3279 dòng.
* **Vấn đề cảnh báo**: `oxlint` báo cảnh báo `File is too long` mỗi lần chạy lint-check.
* **Mức độ tương thích**: 100% TypeScript. Các mô-đun được tách ra sẽ export đầy đủ kiểu dữ liệu và props để tệp chính import sử dụng trực tiếp.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Code base tích hợp thêm rất nhiều tính năng mới như: bộ lọc thuộc tính động (attribute filters), khoảng giá thông minh (range sliders), layout catalog sidebar, lookbook collection, và look-up SEO catch-all URLs. Tất cả đều được viết nối tiếp vào cuối file `ProductsPage.tsx`.
* **Giả thuyết đối chứng**: 
  * Nếu tiếp tục giữ nguyên tệp tin khổng lồ này, bất kỳ sự thay đổi nhỏ nào ở filter cũng có nguy cơ làm hỏng layout hoặc logic import/export do khó quản lý xung đột.
  * Nếu tách file quá nhỏ (vài chục dòng mỗi file), sẽ gây ra hiện tượng "fragmentation" (mã nguồn bị phân mảnh quá mức), khiến việc import trở nên cồng kềnh. Phương án chia thành 5 tệp chức năng là điểm cân bằng lý tưởng.

# IV. Proposal (Đề xuất)
Tiến hành phân rã tệp tin `ProductsPage.tsx` thành **5 tệp nguồn chuyên biệt** nằm trong cùng thư mục `app/(site)/_components/products/`:
1. `Skeletons.tsx`
2. `FilterComponents.tsx`
3. `ProductCardComponents.tsx`
4. `LayoutComponents.tsx`
5. `ProductsPage.tsx` (Tệp chính thu gọn)

# V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa đổi / Tách file:
1. `app/(site)/_components/products/ProductsPage.tsx`
   * *Mô tả vai trò*: Điểm đầu vào chính (entry-point) quản lý trạng thái, truy vấn dữ liệu từ Convex, điều phối bộ lọc URL và điều hướng.
   * *Thay đổi*: [Sửa] Cắt toàn bộ các component phụ, chỉ import chúng từ các file tương ứng và giữ lại component `ProductsPage` + `ProductsContent`.
2. `app/(site)/_components/products/Skeletons.tsx` [NEW]
   * *Mô tả vai trò*: Quản lý giao diện skeletons hiển thị trong thời gian tải dữ liệu.
   * *Thay đổi*: [Thêm] Chứa `ProductsListSkeleton` và `ProductsGridSkeleton`.
3. `app/(site)/_components/products/ProductCardComponents.tsx` [NEW]
   * *Mô tả vai trò*: Giao diện hiển thị sản phẩm chi tiết dạng card, grid, list và hành động mua sắm.
   * *Thay đổi*: [Thêm] Chứa `ProductCardActions`, `ProductAttributesBadges`, `ProductGrid`, `ProductList`, `EmptyState`, `ClearFiltersButton`.
4. `app/(site)/_components/products/FilterComponents.tsx` [NEW]
   * *Mô tả vai trò*: Giao diện và logic của bộ lọc thuộc tính, khoảng giá Radix UI Slider.
   * *Thay đổi*: [Thêm] Chứa `parseNumericValue`, `AttributeFilterGroupWidget`, `MobileProductsFilters`.
5. `app/(site)/_components/products/LayoutComponents.tsx` [NEW]
   * *Mô tả vai trò*: Bố cục tổng thể trang web (Catalog bên sidebar, Danh sách xếp ngang).
   * *Thay đổi*: [Thêm] Chứa `CatalogLayout`, `ListLayout` và `generatePaginationItems`.

# VI. Execution Preview (Xem trước thực thi)
1. Tạo 4 tệp tin mới với đầy đủ import thư viện và kiểu dữ liệu cần thiết từ Next.js, Convex, lucide-react.
2. Trích xuất code tương ứng từ tệp `ProductsPage.tsx` sang các tệp mới.
3. Sửa đổi `ProductsPage.tsx` để xóa các component con đã chuyển đi, thêm các dòng import tương ứng từ các tệp mới tạo.
4. Chạy `tsc --noEmit` để kiểm tra toàn bộ kiểu dữ liệu liên kết.
5. Chạy `oxlint` để xác nhận số lượng warnings giảm về 0.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit` để đảm bảo không bị lỗi import chéo hay thiếu kiểu dữ liệu props.
* **Kiểm tra linter**: Chạy `bunx oxlint --type-aware --type-check` để đảm bảo tệp `ProductsPage.tsx` không còn bị cảnh báo quá dài nữa.

# VIII. Todo
- [ ] Thiết lập và tạo file `Skeletons.tsx`
- [ ] Thiết lập và tạo file `ProductCardComponents.tsx`
- [ ] Thiết lập và tạo file `FilterComponents.tsx`
- [ ] Thiết lập và tạo file `LayoutComponents.tsx`
- [ ] Thu gọn và cập nhật `ProductsPage.tsx`
- [ ] Chạy linter & tsc verify

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* `oxlint` chạy thành công mà không còn bất kỳ cảnh báo nào về file quá dài.
* Dự án Next.js build bình thường, không có lỗi TypeScript.
* Không làm thay đổi hành vi hoạt động của giao diện sản phẩm.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi thiếu import hoặc sai tên props do số lượng component được di chuyển khá nhiều.
* **Hoàn tác**: Sử dụng `git checkout` để khôi phục tệp `ProductsPage.tsx` gốc nếu xảy ra lỗi biên dịch khó giải quyết.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic truy vấn database Convex hay cách xử lý router Next.js.
* Thiết kế lại giao diện CSS hay chỉnh sửa hành vi Responsive.
