# I. Primer

## 1. TL;DR kiểu Feynman
* **Lỗi Preview**: Khi cấu hình xếp nút ngang (Grid 2), preview ở Experiences vẫn xếp dọc (Stack). Lý do là component preview `<ProductsListPreview>` và `<ProductDetailPreview>` chưa nhận hoặc chưa được truyền prop `cartButtonsLayout` từ trang cấu hình.
* **Lọc saleMode**: Trường "Bố cục nút" chỉ hiển thị ở cấu hình Experiences khi chế độ bán hàng (`saleMode`) của module sản phẩm là bán hàng qua giỏ hàng (`'cart'`). Nếu là aff hay liên hệ, trường này sẽ ẩn đi.
* **Ẩn ở trang Create**: Các checkbox bật/tắt nút mua và chọn bố cục nút chỉ hiển thị ở trang **Edit** của Home-Components (như `product-list`, `product-grid`, `category-products`), tuyệt đối ẩn ở các trang **Create** tương ứng.
* **Sắp xếp khoa học**: Các checkbox và select nút mua được đưa vào chung SubSection "Cài đặt hiển thị", không ghép chung lộn xộn với các cài đặt nguồn dữ liệu hay nằm trơ trọi ở cuối form.

## 2. Elaboration & Self-Explanation
Hệ thống cửa hàng hỗ trợ 3 chế độ bán hàng (`saleMode`): giỏ hàng (`cart`), liên hệ (`contact`), và liên kết (`affiliate`). Khi chế độ bán hàng là giỏ hàng, storefront sẽ hiển thị các nút "Thêm vào giỏ" và "Mua ngay" trên thẻ sản phẩm và trang chi tiết sản phẩm. Admin có thể tùy biến bố cục của 2 nút này xếp dọc (Stack) hoặc xếp ngang (Grid 2).

Tuy nhiên, trong trang quản lý Trải nghiệm (Experiences) ở Admin, khi thay đổi bố cục nút từ Stack sang Grid 2, giao diện mô phỏng (preview) không thay đổi theo vì các lập trình viên trước quên truyền biến cấu hình `cartButtonsLayout` vào các component preview tương ứng. Đồng thời, cấu hình bố cục nút này chỉ có ý nghĩa khi `saleMode === 'cart'`, nên nếu hệ thống đang ở chế độ liên hệ hoặc affiliate, trường cấu hình này cần ẩn đi để tránh gây bối rối cho quản trị viên.

Về phía Home-Components trên trang chủ, các nút giỏ hàng và mua ngay chỉ nên cấu hình khi edit (nơi đã có dữ liệu thật), không hiển thị ở trang Create để giữ giao diện tạo mới tinh gọn. Đồng thời, do đây là các tùy chọn về mặt hiển thị giao diện, chúng phải được nhóm chung vào section "Cài đặt hiển thị" thay vì nằm lộn xộn ở phần cấu hình nguồn dữ liệu hoặc cuối trang.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Tại trang cấu hình `http://localhost:3000/system/experiences/products-list`, khi chọn bố cục nút là "Xếp ngang (Grid 2)", khung preview bên dưới phải lập tức cập nhật nút "Thêm vào giỏ" và "Mua ngay" nằm song song với nhau trên cùng một hàng. Nếu chuyển sang trang cấu hình module sản phẩm và đổi chế độ bán hàng thành "Liên hệ", quay lại trang trải nghiệm sẽ không còn thấy tùy chọn "Bố cục nút" nữa.
* **Hình ảnh tương đồng**: Giống như việc bạn đi mua ô tô, nếu bạn chọn phiên bản số sàn, đại lý sẽ không hiển thị tùy chọn cấu hình "lẫy chuyển số trên vô lăng" (vì nó không tương thích). Các tùy chọn nâng cao này cũng chỉ xuất hiện ở bước điều chỉnh chi tiết (Edit) chứ không xuất hiện ở bước chọn mẫu xe ban đầu (Create).

# II. Audit Summary (Tóm tắt kiểm tra)

* **Trang Experiences**:
  * Trang Danh sách: [products-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/products-list/page.tsx) render `<ProductsListPreview>` nhưng không truyền `cartButtonsLayout`.
  * Trang Chi tiết: [product-detail/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/product-detail/page.tsx) render `<ProductDetailPreview>` qua hàm `getPreviewProps()`, cũng không truyền `cartButtonsLayout`.
* **Components Preview**:
  * [ListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ListPreview.tsx): Định nghĩa `ProductsListPreview` và `ProductsListPreviewProps` thiếu trường `cartButtonsLayout`.
  * [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx): Định nghĩa `ProductDetailPreviewProps` thiếu trường `cartButtonsLayout`.
* **Cấu hình Home-Components**:
  * `ProductListForm.tsx`: Render các checkbox nút mua cứng ở cuối file mà không kiểm tra callback ẩn/hiện, nằm sai section (nằm trong section nguồn dữ liệu).
  * `ProductGridForm.tsx`: Render các checkbox nút mua ở cuối file, nằm ngoài các SubSection.
  * `CategoryProductsForm.tsx`: Đã nằm đúng SubSection "Cài đặt hiển thị" và đã tự ẩn ở trang Create do có check callback.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc 1 (Lỗi Preview)**: Thiếu việc truyền prop và nhận prop `cartButtonsLayout` xuyên suốt từ trang trải nghiệm (`page.tsx`) xuống component preview (`ListPreview.tsx`, `ProductDetailPreview.tsx`) và xuống layout render nút thực tế.
* **Nguyên nhân gốc 2 (Lọc saleMode)**: Chưa đọc setting `saleMode` từ DB Convex trong trang trải nghiệm để làm điều kiện ẩn/hiện select cấu hình bố cục nút.
* **Nguyên nhân gốc 3 (Trang Create vs Edit của Home-Components)**: `ProductListForm.tsx` render cứng các checkbox nút mua mà không kiểm tra sự tồn tại của các hàm callback điều khiển. Cấu hình nút ở `ProductListForm` và `ProductGridForm` chưa được đưa vào trong `HomeComponentDisplaySettingsSection` ở trang Edit.
* **Giả thuyết đối chứng**: Nếu chỉ sửa preview ở Experiences mà không sửa ở Home-Components, người dùng vẫn sẽ thấy preview bị lỗi khi cấu hình các home-components. Do đó cần đồng bộ hóa toàn bộ preview.

# IV. Proposal (Đề xuất)

1. **Trang Experiences**:
   * Truy vấn Convex setting `saleMode` của module `products` ở cả 2 trang `products-list/page.tsx` và `product-detail/page.tsx`.
   * Thêm điều kiện `saleMode === 'cart'` để hiển thị SelectRow "Bố cục nút".
   * Đảm bảo truyền `cartButtonsLayout` vào prop của các component preview.
2. **Components Preview**:
   * Cập nhật `ListPreview.tsx` and `ProductDetailPreview.tsx` để nhận và áp dụng style `grid-2` (xếp ngang 2 cột) cho các nút giỏ hàng và mua ngay khi cấu hình được bật.
3. **Cấu hình Home-Components**:
   * Chuyển block cấu hình nút mua hàng ra khỏi `ProductListForm.tsx`, đưa vào `HomeComponentDisplaySettingsSection` ở trang Edit (`product-list/[id]/edit/page.tsx`).
   * Chuyển block cấu hình nút mua hàng trong `ProductGridForm.tsx` vào làm children của `HomeComponentDisplaySettingsSection` ở đầu form, bọc trong kiểm tra callback để tự ẩn ở trang Create.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
* [products-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/products-list/page.tsx): Lấy `saleMode` từ Convex, ẩn/hiện SelectRow bố cục nút và truyền prop vào preview.
* [product-detail/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/product-detail/page.tsx): Lấy `saleMode` từ Convex, ẩn/hiện SelectRow bố cục nút và truyền prop vào preview qua `getPreviewProps()`.
* [ListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ListPreview.tsx): Nhận prop `cartButtonsLayout` và áp dụng grid layout cho nút của `ProductCard`.
* [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx): Nhận prop `cartButtonsLayout` và áp dụng layout xếp ngang cho các nút ở classic, modern, minimal và premium layouts.
* [ProductListForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/_components/ProductListForm.tsx): Xóa phần render checkbox nút mua ở cuối file.
* [product-list/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/[id]/edit/page.tsx): Thêm phần render checkbox nút mua vào trong `HomeComponentDisplaySettingsSection`.
* [ProductGridForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridForm.tsx): Di chuyển phần cấu hình nút mua vào trong `HomeComponentDisplaySettingsSection`.

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và chỉnh sửa trang Trải nghiệm** (`products-list/page.tsx` và `product-detail/page.tsx`).
2. **Cập nhật các component preview** (`ListPreview.tsx` và `ProductDetailPreview.tsx`) để nhận diện và render đúng layout xếp ngang.
3. **Cập nhật form cấu hình Home-Components** (`ProductListForm.tsx`, `product-list/[id]/edit/page.tsx`, `ProductGridForm.tsx`) để chuyển cấu hình nút mua vào section hiển thị, đồng thời ẩn ở trang Create.
4. **Chạy Typecheck tĩnh** để đảm bảo không lỗi compilation.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Hướng dẫn kiểm chứng:
* Truy cập `http://localhost:3000/system/experiences/products-list` và thay đổi "Bố cục nút" sang "Xếp ngang (Grid 2)". Xác nhận preview đổi sang xếp ngang.
* Thay đổi cấu hình bán hàng của module `products` sang "Liên hệ" hoặc "Affiliate" và quay lại trang trải nghiệm. Xác nhận trường "Bố cục nút" đã biến mất.
* Truy cập trang tạo mới Home-Component: `http://localhost:3000/admin/home-components/create/product-list`, `product-grid`, `category-products`. Xác nhận các checkbox cấu hình nút mua hàng không xuất hiện.
* Truy cập trang Edit tương ứng của các Home-Component trên. Xác nhận các checkbox xuất hiện nằm gọn gàng trong section "Cài đặt hiển thị".

# VIII. Todo

- [ ] Sửa file `app/system/experiences/products-list/page.tsx`
- [ ] Sửa file `app/system/experiences/product-detail/page.tsx`
- [ ] Sửa file `components/experiences/previews/ListPreview.tsx`
- [ ] Sửa file `components/experiences/previews/ProductDetailPreview.tsx`
- [ ] Sửa file `app/admin/home-components/product-list/_components/ProductListForm.tsx`
- [ ] Sửa file `app/admin/home-components/product-list/[id]/edit/page.tsx`
- [ ] Sửa file `app/admin/home-components/product-grid/_components/ProductGridForm.tsx`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Khung Preview ở Experiences hiển thị đúng kiểu xếp ngang (Grid 2) của các nút.
* Ẩn cấu hình bố cục nút khi `saleMode !== 'cart'`.
* Các checkbox cấu hình nút chỉ xuất hiện khi Edit Home-Component, ẩn hoàn toàn khi Create.
* Các checkbox cấu hình nút nằm đúng trong section "Cài đặt hiển thị".

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Lỗi TypeScript do thiếu prop hoặc sai kiểu dữ liệu.
* **Hoàn tác**: Sử dụng `git checkout` để khôi phục lại các file bị sửa đổi nếu xảy ra lỗi biên dịch nghiêm trọng.

# XI. Out of Scope (Ngoài phạm vi)

* Sửa đổi logic giỏ hàng hoặc thanh toán thực tế của storefront.
* Cấu hình các home-component khác không chứa sản phẩm (như blog, dịch vụ).
