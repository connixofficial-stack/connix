# Cấu hình bộ lọc khoảng giá nâng cao (Advanced Price Filter Configuration)

# I. Primer

## 1. TL;DR kiểu Feynman
* **Mục tiêu**: Nâng cấp bộ lọc giá ở trang danh sách sản phẩm storefront và admin preview. Hỗ trợ 4 chế độ: Tắt, Tự nhập (Từ - Đến), Dropdown thông minh (Smart Dropdown - tự động chia khoảng giá kiểu SaaS), và Slider 2 đầu (Range Slider).
* **Tối ưu hóa**: Lấy min/max price bằng cách đọc trực tiếp qua index của Convex `by_status_price`, độ phức tạp $O(1)$ thay vì quét toàn bộ database (full scan) giúp tiết kiệm băng thông tối đa.
* **Đồng bộ hóa**: Admin cấu hình như thế nào (ẩn, tự nhập, dropdown, slider) thì trang storefront và màn hình Preview trực tiếp ở Admin settings phải hiển thị chính xác như thế.

## 2. Elaboration & Self-Explanation
Hiện tại, trang danh sách sản phẩm storefront chỉ hỗ trợ bộ lọc giá dạng tự nhập (Từ - Đến) bằng ô input thô sơ. Chúng ta muốn tăng trải nghiệm người dùng (UX) bằng cách cung cấp nhiều tùy chọn lọc giá nâng cao:
* **Tắt (Disabled)**: Ẩn hoàn toàn bộ lọc giá khi shop không muốn hiển thị.
* **Tự nhập (Custom Input)**: Kiểu cũ nhập "Từ" và "Đến".
* **Dropdown thông minh (Smart Dropdown)**: Tự động chia nấc giá thông minh (tối đa 5 nấc) dựa trên khoảng giá thực tế của các sản phẩm có sẵn trong DB (ví dụ: Dưới 500k, 500k - 1M, 1M - 3M, 3M - 5M, Trên 5M) giúp người dùng click một chạm nhanh chóng.
* **Slider 2 đầu (Range Slider)**: Thanh trượt kéo từ min đến max của tiền sản phẩm để chọn khoảng mong muốn.

Để làm được điều này mà không gây quá tải cho database Convex (bảo vệ bandwidth của Convex), ta không được dùng `db.query("products").collect()` rồi tìm min/max trong JS. Thay vào đó, ta sử dụng index `by_status_price` có sẵn trên cột `["status", "price"]`. Nhờ index đã sắp xếp sẵn, phần tử đầu tiên (`first()`) chính là sản phẩm có giá thấp nhất, phần tử cuối cùng (qua việc đảo chiều sắp xếp `order("desc").first()`) chính là sản phẩm có giá cao nhất. Thao tác này chỉ cần đọc đúng 2 dòng dữ liệu nên đạt hiệu năng cực đại $O(1)$.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Nếu shop giày dép có giá sản phẩm thấp nhất là 150.000đ và cao nhất là 3.500.000đ:
    * Chế độ Dropdown thông minh sẽ tính toán và hiển thị các nấc giá: *Dưới 500.000đ*, *500.000đ - 1.000.000đ*, *1.000.000đ - 2.000.000đ*, *2.000.000đ - 3.000.000đ*, *Trên 3.000.000đ*.
    * Chế độ Slider sẽ cho phép kéo từ mốc 150.000đ đến 3.500.000đ.
  * Nếu shop trang sức cao cấp có giá thấp nhất là 5.000.000đ và cao nhất là 80.000.000đ:
    * Các nấc tự chia sẽ là: *Dưới 10.000.000đ*, *10.000.000đ - 20.000.000đ*, *20.000.000đ - 50.000.000đ*, *Trên 50.000.000đ*.
* **Phép ẩn dụ**: Việc lấy min/max price bằng index giống như bạn tìm cuốn sách mỏng nhất và dày nhất trong một thư viện đã được xếp sẵn theo độ dày từ trái qua phải. Bạn chỉ cần nhặt cuốn đầu tiên bên trái và cuốn cuối cùng bên phải (mất 2 giây), thay vì phải lật từng cuốn sách trong thư viện để đo độ dày (mất cả ngày).

# II. Audit Summary (Tóm tắt kiểm tra)
* Bảng `products` đã được định nghĩa trong [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/schema.ts) với index `by_status_price` gồm hai trường `["status", "price"]`.
* Cấu hình trải nghiệm được quản lý qua bảng `settings` với key `products_list_ui`.
* Trực quan hóa luồng logic bộ lọc giá:
```mermaid
flowchart TD
    A[User vào Storefront /products] --> B{Đọc cấu hình priceFilterMode}
    B -- Disabled --> C[Ẩn bộ lọc giá]
    B -- Custom --> D[Hiển thị 2 ô input Từ - Đến]
    B -- Smart Dropdown --> E[Fetch getPriceRangeStats O(1)]
    B -- Slider --> F[Fetch getPriceRangeStats O(1)]
    E --> G[Tính nấc giá thông minh]
    G --> H[Hiển thị Dropdown 5 nấc]
    F --> I[Hiển thị Range Slider từ Min đến Max]
    H -. Chọn nấc .-> J[Update URL query params minPrice/maxPrice]
    I -. Kéo slider .-> J
    D -. Nhập & Submit .-> J
    J --> K[Convex query list sản phẩm lọc theo minPrice/maxPrice]
```

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Yêu cầu nâng cấp**: Hệ thống hiện tại chỉ có một kiểu nhập khoảng giá thô sơ, chưa hỗ trợ bật tắt linh hoạt hay các kiểu lọc hiện đại (Dropdown thông minh SaaS, Slider 2 đầu).
* **Giả thuyết đối chứng**: Nếu ta tính toán min/max price tại runtime storefront bằng cách tải toàn bộ sản phẩm về để tìm giá trị biên, băng thông của Convex sẽ bị cạn kiệt nhanh chóng khi số lượng sản phẩm tăng lên. Do đó, việc tìm giá trị biên ở backend qua index $O(1)$ là bắt buộc và tối ưu nhất.

# IV. Proposal (Đề xuất)
1. **Convex Backend API**:
   * Thêm query `products:getPriceRangeStats` lấy sản phẩm có `price` thấp nhất và cao nhất có status là `Active` thông qua index `by_status_price`. Tính toán `minPrice` và `maxPrice` biên an toàn.
2. **Cấu hình UI Admin (`/system/experiences/products-list`)**:
   * Bổ sung trường `priceFilterMode?: 'disabled' | 'custom' | 'smart_dropdown' | 'slider'` vào cấu hình `products_list_ui`.
   * Thiết kế thêm một Control Card "Bộ lọc khoảng giá" trong trang quản trị cho phép chọn chế độ bộ lọc giá và lưu lại vào Convex.
3. **Admin Preview (`ProductsListPreview`)**:
   * Nhận thêm prop `priceFilterMode` và hiển thị đồng bộ giao diện bộ lọc giá trong preview: ẩn đi, ô input, dropdown các nấc giả lập, hoặc slider giả lập.
4. **Storefront UI (`LayoutComponents.tsx` & `ProductsPage.tsx`)**:
   * Đọc cấu hình `priceFilterMode` từ `useProductsListConfig()`.
   * Nếu ở chế độ `smart_dropdown` hoặc `slider`, gọi query `getPriceRangeStats` để nhận giá trị biên thực tế.
   * Xây dựng hàm helper `generateSmartPriceRanges(min, max)` chia khoảng giá tối đa thành 5 nấc thông minh kiểu SaaS.
   * Xây dựng custom component `DoubleRangeSlider` (Slider 2 đầu) gọn nhẹ, trực quan bằng HTML5/CSS hoặc thuần React để người dùng kéo trượt mượt mà.
   * Cập nhật URL query params `minPrice` & `maxPrice` tương ứng khi người dùng tương tác với dropdown hoặc slider để giữ nguyên cơ chế lọc của Convex query hiện tại.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [convex/products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/products.ts)
  * Thêm query `getPriceRangeStats` lấy khoảng giá biên tối thiểu/tối đa dùng index $O(1)$.
* **Sửa:** [lib/experiences/useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/experiences/useSiteConfig.ts)
  * Cập nhật type `ProductsListConfig` và parser để hỗ trợ trường `priceFilterMode`.
* **Sửa:** [app/system/experiences/products-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/products-list/page.tsx)
  * Thêm control UI "Bộ lọc khoảng giá" và truyền config `priceFilterMode` sang preview.
* **Sửa:** [components/experiences/previews/ListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ListPreview.tsx)
  * Bổ sung prop `priceFilterMode` và giả lập hiển thị bộ lọc giá tương ứng trong Preview (Desktop sidebar & Mobile filter).
* **Sửa:** [app/(site)/_components/products/LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/LayoutComponents.tsx)
  * Tích hợp cấu hình `priceFilterMode`.
  * Nhận dữ liệu từ `getPriceRangeStats` để render: Smart Dropdown hoặc Double Range Slider ở cả Desktop Sidebar và Mobile Drawer.
* **Sửa:** [app/(site)/_components/products/ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductsPage.tsx)
  * Nối cấu hình `priceFilterMode` từ hook truyền xuống `CatalogLayout`.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm Convex query `getPriceRangeStats` tối ưu index.
2. Thêm trường `priceFilterMode` vào site config và component admin.
3. Thực hiện sửa đổi UI admin và preview đồng bộ.
4. Cập nhật `LayoutComponents.tsx` viết các helper chia nấc thông minh và component Double Range Slider.
5. Kiểm tra typecheck tĩnh và chạy thử nghiệm.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit` để đảm bảo không có lỗi type.
* **Kiểm tra chức năng**:
  * Đổi cấu hình trong Admin sang "Tắt" -> Storefront và Admin Preview đều ẩn bộ lọc khoảng giá.
  * Đổi sang "Tự nhập" -> Hiện ô Từ - Đến như cũ.
  * Đổi sang "Dropdown thông minh" -> Tự tính toán chia nấc đẹp và click chọn lọc chuẩn theo URL params.
  * Đổi sang "Slider 2 đầu" -> Kéo trượt đổi khoảng giá mượt mà và cập nhật URL lọc chính xác.

# VIII. Todo
* [ ] Viết query `getPriceRangeStats` trong `convex/products.ts`.
* [ ] Cập nhật site config hook trong `lib/experiences/useSiteConfig.ts`.
* [ ] Cập nhật trang quản trị `/system/experiences/products-list/page.tsx`.
* [ ] Cập nhật file preview `components/experiences/previews/ListPreview.tsx`.
* [ ] Thiết kế và lập trình component Double Range Slider và Smart Dropdown trong `LayoutComponents.tsx`.
* [ ] Wiring toàn bộ dữ liệu ở storefront `ProductsPage.tsx` sang `CatalogLayout`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Bộ lọc khoảng giá đáp ứng đúng cấu hình từ admin một cách tức thời ở cả storefront thực tế và màn hình Preview trực tiếp ở Admin settings.
* Chế độ dropdown tự động tạo các nấc giá bo tròn đẹp dựa trên min/max thực tế.
* Chế độ slider cho phép trượt mượt mà, cập nhật URL query params và lọc sản phẩm tương ứng.
* API Convex lấy min/max price tuyệt đối không gây full scan DB (no full scan) nhờ index `by_status_price`.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi hiển thị CSS trên các kích thước màn hình nhỏ khi dùng Slider 2 đầu.
* **Xử lý**: Thiết kế slider dạng responsive, tương thích tốt với cả chuột và cảm ứng điện thoại (touch target đủ lớn). Nếu gặp lỗi nghiêm trọng, rollback cấu hình về chế độ `custom` (Tự nhập) hoặc `disabled`.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc cơ sở dữ liệu (schema) của bảng `products` hay `settings` (chúng ta chỉ lưu cấu hình bổ sung dưới dạng dynamic field trong config object của key `products_list_ui` mà không làm thay đổi cấu trúc bảng).
* Các tính năng lọc nâng cao khác ngoài khoảng giá sản phẩm.
