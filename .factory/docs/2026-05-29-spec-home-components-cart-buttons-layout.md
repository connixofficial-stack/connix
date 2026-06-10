# Spec: Cấu hình hiển thị nút Thêm vào giỏ & Mua ngay (Grid 2) và tích hợp các Home-Components

# I. Primer

## 1. TL;DR kiểu Feynman
* **Mục tiêu chính**: Cho phép hiển thị nút "Thêm vào giỏ hàng" và "Mua ngay" theo kiểu **ngang hàng (2 cột - Grid 2)** hoặc **xếp dọc (1 cột - Stack)** động từ cài đặt hệ thống.
* **Áp dụng ở đâu?**: Trang danh sách sản phẩm, Trang chi tiết sản phẩm và các cấu phần trang chủ có chứa sản phẩm (Product List, Product Grid, Category Products).
* **Nếu có nhiều phiên bản (Size/Màu) thì sao?**: Khi bấm thêm/mua từ danh sách/trang chủ, thay vì chuyển sang trang chi tiết làm phiền người dùng, một Modal nhỏ (Quick Add Variant Modal) sẽ hiện lên ngay lập tức để người dùng chọn nhanh Size/Màu và thêm hàng cực kỳ mượt mà.
* **Cấu hình thế nào?**: Admin có thể chọn bố cục nút (xếp dọc hoặc ngang) trong Experiences cho trang danh sách/chi tiết, và cấu hình trực tiếp trên từng cấu phần trang chủ (Home Components) thông qua trang quản trị Admin.

## 2. Elaboration & Self-Explanation
Chúng ta đang cải tiến trải nghiệm mua hàng bằng cách cho phép hiển thị các nút "Thêm vào giỏ" và "Mua ngay" ngang hàng nhau (Grid 2).
Hiện tại hệ thống đang hardcode bố cục xếp dọc cho trang danh sách và trang chi tiết sản phẩm. Ở các cấu phần trang chủ (home-components) thì hoàn toàn chưa có các nút này (chỉ có link "Xem chi tiết").
Việc này sẽ được giải quyết bằng cách:
1. **Lưu trữ cấu hình**: Thêm cấu hình `cartButtonsLayout` (với hai giá trị `stack` và `grid-2`) vào các cài đặt trải nghiệm `products_list_ui` và `product_detail_ui`.
2. **Cập nhật Giao diện (Storefront)**:
   * Sửa component `ProductCardActions` tại trang danh sách để hỗ trợ layout Grid 2.
   * Sửa trang chi tiết sản phẩm (cả 3 style: Classic, Modern, Minimal) để hỗ trợ layout Grid 2.
3. **Cập nhật Cấu phần Trang chủ (Home Components)**:
   * Cập nhật các form editor (`ProductListForm`, `ProductGridForm`, `CategoryProductsForm`) tại trang quản trị Admin để cung cấp cấu hình bật/tắt hiển thị nút và bố cục nút.
   * Cập nhật storefront rendering (`ProductListSection`, `ProductGridSection`, `CategoryProductsSection`) để lấy các thuộc tính này từ config, render component `ProductCardActions` và tích hợp `QuickAddVariantModal` khi sản phẩm có nhiều phiên bản.
   * Làm rõ rằng cấu phần `product-categories` chỉ là hiển thị danh mục, không hiển thị trực tiếp item sản phẩm, nên các tuỳ chọn nút sẽ không hiển thị trên storefront cho cấu phần này.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi khách hàng truy cập bằng điện thoại di động (Mobile First), hai nút xếp dọc sẽ chiếm nhiều diện tích màn hình trên mỗi card sản phẩm và đẩy thông tin khác xuống dưới. Khi chuyển sang Grid 2 (2 nút nằm song song), thẻ sản phẩm sẽ gọn gàng hơn rất nhiều, hiển thị cân đối và tăng tính thẩm mỹ rõ rệt.
* **Trực giác đời thường**: Hãy tưởng tượng một quầy thanh toán nhanh tại siêu thị. Thay vì bắt khách hàng phải đi sâu vào từng quầy nhỏ trong góc (Trang chi tiết) chỉ để lấy đúng size giày của họ, siêu thị đặt một máy quét và chọn nhanh size ngay tại sảnh chính (Quick Add Modal). Chọn xong là bỏ vào giỏ hàng ngay lập tức.

---

# II. Audit Summary (Tóm tắt kiểm tra)

1. **Về cấu hình trải nghiệm (Experiences)**:
   * Cài đặt danh sách sản phẩm lấy dữ liệu từ `products_list_ui` ([useProductsListConfig](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/experiences/useSiteConfig.ts#L170)).
   * Cài đặt chi tiết sản phẩm lưu trong key `product_detail_ui` và được cấu hình tại trang [app/system/experiences/product-detail/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/product-detail/page.tsx).
   * Đều đang thiếu thuộc tính `cartButtonsLayout` để chọn cấu hình dọc hay ngang.

2. **Về hiển thị nút ngoài Storefront**:
   * Component [ProductCardActions](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductsPage.tsx#L1578) đang hardcode layout `grid-cols-1 gap-2` (xếp dọc).
   * Khối nút tại trang chi tiết [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx#L2228) cũng đang xếp dọc dưới dạng `flex-col gap-2` cho cả 3 style (Classic, Modern, Minimal).

3. **Về Home-Components**:
   * Các form editor trong admin như [ProductListForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/_components/ProductListForm.tsx), [ProductGridForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridForm.tsx), và [CategoryProductsForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsForm.tsx) đang không có các tuỳ chọn cấu hình nút giỏ hàng.
   * Giao diện storefront rendering của chúng như `ProductListSection.tsx`, `ProductGridSection.tsx`, `ComponentRenderer.tsx` (CategoryProductsSection) chỉ render link "Xem chi tiết", hoàn toàn chưa hiển thị các nút mua hàng.
   * Cấu phần `product-categories` chỉ hiển thị danh mục sản phẩm. Việc người dùng chọn ảnh đại diện từ một sản phẩm nào đó không làm thay đổi bản chất nó là danh mục, nên không cần hiển thị nút mua hàng tại đây.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Root Cause (Nguyên nhân gốc)**: Hệ thống trước đây chỉ thiết kế mặc định các nút mua hàng xếp dọc để tương thích với giao diện Mobile bản đầu tiên, và chưa tích hợp bộ nút tương tác trực tiếp lên các cấu phần của trang chủ.
* **Giả thuyết đối chứng**: Việc mở rộng cấu hình `cartButtonsLayout` dạng `'stack' | 'grid-2'` là hoàn toàn tương thích ngược, không gây ảnh hưởng xấu tới cơ sở dữ liệu (Database Schema) vì Convex lưu cấu hình dạng `v.any()` và ta sẽ xử lý fallback mặc định về `'stack'` ở code frontend.

---

# IV. Proposal (Đề xuất)

Chúng ta sẽ tiến hành triển khai theo các đề xuất sau:

1. **Định nghĩa cấu hình trong Experiences**:
   * Bổ sung trường `cartButtonsLayout` vào kiểu dữ liệu `ProductsListConfig` và `ProductDetailConfig`.
   * Cập nhật trang quản trị `app/system/experiences/products-list/page.tsx` và `app/system/experiences/product-detail/page.tsx` để cung cấp tuỳ chọn Bố cục nút (Xếp dọc / Song song).

2. **Cập nhật Giao diện Storefront (Trang danh sách & Chi tiết)**:
   * Chỉnh sửa component `ProductCardActions` tại trang danh sách để tự động chuyển đổi class CSS từ `grid-cols-1` sang `grid-cols-2` khi layout là `grid-2`.
   * Cập nhật code render của các style Classic, Modern, Minimal tại `ProductDetailPage.tsx` để chuyển đổi layout của các nút Add to Cart và Buy Now sang ngang hàng nhau.

3. **Tích hợp các Cấu phần Trang chủ (Home-Components)**:
   * **Cập nhật các Form Editor trong Admin**:
     * Bổ sung các điều khiển (Toggles/Select) cho `showAddToCartButton`, `showBuyNowButton`, `cartButtonsLayout` vào `ProductListForm.tsx`, `ProductGridForm.tsx` và `CategoryProductsForm.tsx`.
   * **Cập nhật storefront render**:
     * Cập nhật các file `ProductListSection.tsx`, `ProductGridSection.tsx` và đoạn render `CategoryProductsSection` tại `ComponentRenderer.tsx` để nhận các cấu hình này từ config.
     * Render component `ProductCardActions` động dưới mỗi product card tương ứng.
     * Tích hợp component `QuickAddVariantModal` (có sẵn) vào các component trang chủ này để khi click nút mua/thêm của sản phẩm có nhiều phiên bản, hệ thống sẽ mở modal popup chọn size/color cực kỳ mượt mà.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. Trải nghiệm danh sách sản phẩm (Products List Experience)
* **Sửa**: [lib/experiences/useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/experiences/useSiteConfig.ts)
  * Thêm trường `cartButtonsLayout?: 'stack' | 'grid-2'` vào interface `ProductsListConfig` và hàm normalize.
* **Sửa**: [app/system/experiences/products-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/products-list/page.tsx)
  * Thêm phần hiển thị cấu hình `cartButtonsLayout` trong form cài đặt admin.
* **Sửa**: [app/(site)/_components/products/ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductsPage.tsx) và [app/(site)/[categorySlug]/_components/ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/_components/ProductsPage.tsx)
  * Cập nhật component `ProductCardActions` sử dụng dynamic class dựa trên `cartButtonsLayout`.

### 2. Trải nghiệm chi tiết sản phẩm (Product Detail Experience)
* **Sửa**: [app/system/experiences/product-detail/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/product-detail/page.tsx)
  * Thêm trường `cartButtonsLayout` vào cấu hình và render UI lựa chọn bố cục dọc/ngang.
* **Sửa**: [app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
  * Cập nhật render các nút ở 3 layout (Classic, Modern, Minimal) để áp dụng layout ngang hàng.

### 3. Cấu hình Admin của các Home-Components
* **Sửa**: [app/admin/home-components/product-list/_components/ProductListForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/_components/ProductListForm.tsx)
  * Thêm các controls cấu hình: bật/tắt nút Add to Cart, Buy Now và Bố cục nút.
* **Sửa**: [app/admin/home-components/product-grid/_components/ProductGridForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridForm.tsx)
  * Thêm các controls cấu hình tương tự.
* **Sửa**: [app/admin/home-components/category-products/_components/CategoryProductsForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsForm.tsx)
  * Thêm các controls cấu hình tương tự.

### 4. Giao diện Storefront của các Home-Components
* **Sửa**: [components/site/ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx)
  * Lấy cấu hình nút từ config, render `ProductCardActions` dưới thẻ sản phẩm, tích hợp modal chọn phiên bản `QuickAddVariantModal`.
* **Sửa**: [components/site/ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx)
  * Tích hợp nút và modal chọn phiên bản tương tự.
* **Sửa**: [components/site/ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
  * Tích hợp nút và modal chọn phiên bản tương tự trong hàm `CategoryProductsSection`.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Cập nhật Schema & Admin UI của Experiences**:
   * Chỉnh sửa file config và giao diện quản trị của trang danh sách và chi tiết để hỗ trợ thêm trường chọn bố cục nút.
2. **Cập nhật Storefront PDP & PLP**:
   * Triển khai code CSS Tailwind và React JSX để áp dụng bố cục Grid 2 cho các nút hành động ngoài storefront.
3. **Mở rộng các Form Editor của Home Components**:
   * Thêm các trường cấu hình trực quan vào form admin của 3 component: Product List, Product Grid, Category Products.
4. **Tích hợp các nút mua hàng ngoài Trang chủ**:
   * Cập nhật storefront code của các home component này để render các nút hành động, đồng thời thêm states quản lý modal `QuickAddVariantModal` khi sản phẩm có nhiều phiên bản.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### 1. Kiểm tra trên Admin Dashboard
* Truy cập `/system/experiences/products-list` và `/system/experiences/product-detail` để kiểm tra tuỳ chọn Bố cục nút hiển thị đúng, lưu được giá trị vào cơ sở dữ liệu.
* Truy cập trang tạo mới/chỉnh sửa các Home-components (`/admin/home-components`) và kiểm tra các cấu hình bật/tắt nút, bố cục nút hoạt động tốt.

### 2. Kiểm tra ngoài Storefront (Giao diện người dùng)
* Truy cập `/products` để kiểm tra 2 nút xếp ngang hàng nhau (Grid 2) khi cài đặt là `grid-2`, và xếp dọc khi cài đặt là `stack`.
* Truy cập trang chi tiết sản phẩm và xác minh tương tự.
* Truy cập trang chủ để kiểm tra các nút xuất hiện dưới các card sản phẩm thuộc cấu phần trang chủ.
* **Kiểm tra luồng phiên bản**:
  * Click nút thêm giỏ hàng/mua ngay ở sản phẩm không có phiên bản -> Thêm ngay vào giỏ hàng hoặc đưa thẳng đến checkout (mượt mà).
  * Click ở sản phẩm có phiên bản -> Modal Quick Add hiện lên cho phép chọn Size/Màu sắc.

---

# VIII. Todo

- [ ] Sửa `lib/experiences/useSiteConfig.ts` và các trang quản trị `/system/experiences` để hỗ trợ cấu hình `cartButtonsLayout`.
- [ ] Cập nhật `ProductCardActions` tại `ProductsPage.tsx` và trang chi tiết `ProductDetailPage.tsx` sang layout Grid 2 động.
- [ ] Sửa form editor trong admin cho Product List, Product Grid, và Category Products.
- [ ] Cập nhật render storefront của các Home-Components để hiển thị bộ nút và tích hợp `QuickAddVariantModal` cho sản phẩm nhiều phiên bản.
- [ ] Thực hiện static review và test thử nghiệm.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Giao diện**: Khi chọn chế độ hiển thị `grid-2`, hai nút "Thêm vào giỏ" và "Mua ngay" phải xếp song song ngang hàng nhau, không bị lệch hoặc chồng chéo lên nhau.
* **Đồng bộ trang chủ**: Các cấu phần trang chủ (`product-list`, `product-grid`, `category-products`) hiển thị đúng các nút theo cấu hình riêng của từng component.
* **Xử lý phiên bản**: Mọi sản phẩm có thuộc tính phiên bản (hasVariants) đều kích hoạt Modal chọn nhanh phiên bản (Quick Add) khi click mua từ bên ngoài, hoạt động mượt mờ không lỗi.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Thay đổi ở `ComponentRenderer.tsx` (file cực kỳ lớn ~305KB) có thể gây lỗi cú pháp nếu sửa không cẩn thận.
* **Biện pháp giảm thiểu**: Chỉ chỉnh sửa tối thiểu bên trong hàm `CategoryProductsSection` (dòng 3741), không chỉnh sửa các thành phần khác của file.
* **Rollback**: Hoàn tác các file đã sửa về phiên bản git gần nhất.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi hoặc thêm bảng dữ liệu mới vào cơ sở dữ liệu Convex.
* Cấu phần `product-categories` chỉ hiển thị danh mục sản phẩm (không hiển thị trực tiếp item sản phẩm ngoài trang chủ), nên các tuỳ chọn nút thêm giỏ hàng/mua ngay không áp dụng tại storefront cho cấu phần này.

---

# XII. Open Questions (Câu hỏi mở)

* *Hiện tại chưa có câu hỏi nào chưa rõ.*
