# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề 1 (Đếm sai & Lọc sai)**: 
  * Khi đếm số lượng sản phẩm của từng danh mục trong trang cấu hình Admin, hệ thống chỉ đếm theo trường `categoryId` chính của sản phẩm đó. Khi tính năng đa danh mục được bật, các liên kết danh mục phụ nằm trong bảng `productCategoryAssignments` hoàn toàn bị bỏ qua, dẫn đến hiển thị sai lệch nghiêm trọng (ví dụ Samba chỉ đếm ra `1` nhưng thực tế có `10`).
  * Ngoài storefront thực tế, khi chọn danh mục Samba, hệ thống lại load 50 sản phẩm phẳng mới nhất rồi tự lọc thủ công ở client thay vì query trực tiếp theo danh mục ở database, làm mất đi các sản phẩm được gán phụ qua assignments.
* **Vấn đề 2 (UI lỗi thời)**: Bộ chọn và lọc danh mục ở cả giao diện cấu hình Admin, danh sách sản phẩm Admin và trang storefront `/products` đều dùng thẻ `<select>` thô sơ hoặc dàn hàng ngang các nút Badge, không hỗ trợ tìm kiếm hay cuộn thông minh, gây khó khăn lớn khi số lượng danh mục tăng lên.
* **Giải pháp**:
  a) Sửa đổi Convex query `countActiveByCategory` để đếm chính xác cả danh mục chính và phụ bằng thuật toán Map O(1) tối ưu.
  b) Chuyển storefront `ProductGridSection.tsx` sang sử dụng Convex query chuyên biệt `listProductsForCategories` giúp query trực tiếp từ database thay vì tự lọc ở client.
  c) Cải tiến toàn bộ bộ chọn danh mục ở 3 nơi thành component **Combobox Searchable Dropdown Premium** với đầy đủ chức năng: gõ tìm kiếm nhanh, cuộn mượt mà, chọn/bỏ chọn trực quan kèm hiển thị chính xác số lượng sản phẩm.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ chia nhỏ và xử lý vấn đề theo hai hướng chính:
* **Tính đúng đắn của dữ liệu (Data Integrity)**:
  * Trong Convex DB, một sản phẩm có thể thuộc một danh mục chính (`product.categoryId`) và nhiều danh mục phụ thông qua bảng liên kết nhiều-nhiều `productCategoryAssignments`.
  * Hàm đếm cũ chỉ duyệt qua bảng `products` và gom nhóm theo `p.categoryId`. Để sửa lỗi này, chúng ta sẽ viết lại `countActiveByCategory` để tải tất cả sản phẩm Active và toàn bộ các gán danh mục trong `productCategoryAssignments`. Sử dụng một JS Map để ánh xạ sản phẩm sang trạng thái Active theo độ phức tạp O(1). Với mỗi assignment của sản phẩm Active, nếu category được gán khác với category chính, ta sẽ cộng thêm 1 vào lượt đếm của danh mục đó.
  * Ngoài storefront thực tế, chúng ta sẽ cấu hình lại component `<ProductGridSection>` để query sản phẩm thông qua Convex API `api.products.listProductsForCategories` thay vì load 50 sản phẩm phẳng `listPublicResolved` rồi tự filter thủ công ở client. Việc này đảm bảo sản phẩm được lấy trực tiếp từ database và bao gồm đầy đủ cả sản phẩm chính lẫn sản phẩm phụ gán qua assignments.
* **Trải nghiệm giao diện (UI/UX Redesign)**:
  * Chúng ta sẽ tự xây dựng component **Combobox/Searchable Select** dựa trên các component UI có sẵn như `Input`, `Popover`, `ScrollArea` và `Button`.
  * Ở **ProductGridForm.tsx** (Admin Form): Bộ chọn danh mục dạng badge dàn hàng ngang sẽ được thay thế bằng một bộ multi-select Combobox. Người dùng click vào, gõ tìm kiếm danh mục, tích chọn các danh mục mong muốn, các danh mục đã chọn sẽ hiển thị thành badge ngay bên dưới để dễ dàng xóa nhanh.
  * Ở **ProductsListPage.tsx** (Admin Products List) và **ProductsPage.tsx** (Storefront): Thẻ `<select>` mặc định của HTML sẽ được thay thế bằng một single-select Combobox tìm kiếm và cuộn mượt mà, tăng tính thẩm mỹ cao cấp cho toàn bộ trang web.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * *Danh mục Samba*: Có 1 đôi giày có category chính là "Samba", và 9 đôi giày khác có category chính là "Adidas" nhưng được gán phụ vào danh mục "Samba".
  * *Hệ thống cũ*: 
    * Khi đếm: Chỉ quét qua bảng sản phẩm thấy 1 đôi Samba -> Hiện `Samba (1)`.
    * Ngoài storefront: Load 50 sản phẩm mới nhất, lọc ra các sản phẩm có category chính là Samba -> Chỉ ra 1 đôi Samba chính chủ. 9 đôi gán phụ bị mất tích hoàn toàn.
  * *Hệ thống mới*:
    * Khi đếm: Quét qua bảng sản phẩm thấy 1 đôi Samba chính chủ + quét bảng assignments thấy 9 đôi gán phụ hoạt động -> Cộng lại hiển thị `Samba (10)`.
    * Ngoài storefront: Query trực tiếp từ DB toàn bộ sản phẩm thuộc Samba -> Hiển thị đầy đủ 10 đôi Samba trơn tru.
* **Hình ảnh tương tự đời thường**: Hãy tưởng tượng một thư viện sách.
  * *Hệ thống cũ*: Thủ thư chỉ đếm sách dựa trên nhãn dán ở gáy sách (danh mục chính). Nếu cuốn sách "Lịch sử thế giới" (gáy sách ghi Lịch sử) được xếp thêm vào ngăn "Sách bán chạy" (gán phụ), thủ thư sẽ không bao giờ đếm được nó khi tìm sách bán chạy. Đồng thời, muốn tìm sách gì thì người đọc phải tự lật từng cuốn trong 50 cuốn mới nhất thay vì tra cứu danh mục chính xác từ máy tính.
  * *Hệ thống mới*: Thủ thư sử dụng một sổ cái thông minh ghi nhận toàn bộ các ngăn mà cuốn sách được xếp vào. Khi bạn cần tìm sách bán chạy, máy tính sẽ chỉ đúng ngăn đó và hiển thị toàn bộ sách, kèm ô tìm kiếm nhanh giúp bạn gõ từ khóa tìm cuốn sách mình cần ngay lập tức.

# II. Audit Summary (Tóm tắt kiểm tra)
* **convex/products.ts** (`countActiveByCategory`):
  * Chỉ đếm theo `p.categoryId` (dòng 2611-2616). Không quét bảng `productCategoryAssignments`.
* **components/site/ProductGridSection.tsx** (Storefront Product Grid):
  * Chế độ `category` sử dụng `api.products.listPublicResolved` limit 50 để tự filter ở client (dòng 209, 272).
  * Bộ lọc sản phẩm theo tab sử dụng `p.categoryId === activeTabId` (dòng 320) làm mất các sản phẩm gán phụ.
* **app/admin/home-components/product-grid/_components/ProductGridForm.tsx**:
  * Chọn danh mục hiển thị dạng badge dàn hàng ngang thô sơ, không có ô tìm kiếm (dòng 422-449).
* **app/admin/products/page.tsx**:
  * Bộ lọc danh mục sử dụng thẻ `<select>` HTML mặc định (dòng 471).
* **app/(site)/_components/products/ProductsPage.tsx**:
  * Bộ lọc danh mục trên Desktop sử dụng thẻ `<select>` HTML mặc định (dòng 1286-1300).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence**: **High** (Độ tin cậy cực cao).
* **Nguyên nhân gốc**:
  1. Convex query đếm thiếu liên kết phụ trong `productCategoryAssignments`.
  2. Storefront ProductGrid tự filter client trên tập dữ liệu phẳng 50 sản phẩm thay vì query trực tiếp theo danh mục ở database.
  3. UI bộ lọc danh mục sử dụng select thô sơ và không hỗ trợ tìm kiếm/cuộn.
* **Giả thuyết đối chứng**: Việc sửa đổi Convex query đếm và tách storefront sang sử dụng `listProductsForCategories` sẽ giải quyết triệt để lỗi lệch dữ liệu Samba (1 vs 10). Việc tích hợp component Combobox sử dụng Popover + Input sẽ giải quyết triệt để trải nghiệm tìm kiếm danh mục.

# IV. Proposal (Đề xuất)

## 1. Sửa Convex Query
* Cập nhật `countActiveByCategory` trong `convex/products.ts` để gộp đếm chính xác từ cả danh mục chính và phụ thông qua Map O(1) hiệu năng cao.

## 2. Sửa storefront ProductGridSection.tsx
* Khi `selectionMode === 'category'`, đổi `productsData` sang query `api.products.listProductsForCategories` truyền `categoryTabIds`.
* Sửa đổi logic `allProducts` để nhận trực tiếp danh sách sản phẩm đã được lọc chính xác từ DB mà không cần filter client thủ công.

## 3. Tích hợp Combobox Searchable Select Premium tại 3 nơi
* **Nơi 1: ProductGridForm.tsx**:
  * Chuyển bộ chọn danh mục sang dạng Combobox Multi-select sử dụng `Popover`, `Input` tìm kiếm, và `ScrollArea` để cuộn mượt mà các danh mục (lọc theo từ khóa gõ).
  * Hiển thị danh sách các badge danh mục đã chọn ngay bên dưới kèm nút xóa nhanh `X`.
* **Nơi 2: app/admin/products/page.tsx**:
  * Thay thế `<select>` lọc danh mục bằng một single-select Combobox tìm kiếm cao cấp, cuộn mượt mà và có nút xóa lọc trực tiếp.
* **Nơi 3: app/(site)/_components/products/ProductsPage.tsx**:
  * Thay thế `<select>` lọc danh mục trên Desktop bằng một single-select Combobox tìm kiếm sang trọng đồng bộ 100% với giao diện chung.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/products.ts) - Cập nhật Convex query đếm sản phẩm `countActiveByCategory`.
* **Sửa**: [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx) - Thay đổi query và logic gộp sản phẩm theo danh mục tối ưu ngoài storefront.
* **Sửa**: [ProductGridForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridForm.tsx) - Thay thế bộ chọn danh mục thô bằng Combobox Multi-select tìm kiếm + cuộn.
* **Sửa**: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/page.tsx) - Thay thế select lọc danh mục ở trang danh sách sản phẩm admin bằng Combobox Search.
* **Sửa**: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductsPage.tsx) - Thay thế select lọc danh mục ở storefront bằng Combobox Search đồng bộ.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật Convex query `countActiveByCategory` trong `convex/products.ts`.
2. Sửa logic query và resolve sản phẩm trong `components/site/ProductGridSection.tsx`.
3. Triển khai component Combobox Multi-select tìm kiếm trong `ProductGridForm.tsx`.
4. Triển khai component Combobox Single-select lọc trong `app/admin/products/page.tsx`.
5. Triển khai component Combobox Single-select lọc trong `app/(site)/_components/products/ProductsPage.tsx`.
6. Thực hiện phân tích tĩnh TypeScript (`tsc --noEmit`) để kiểm tra toàn bộ mã nguồn.
7. Phát âm thanh báo Done.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit` để đảm bảo kiểu dữ liệu TypeScript hoàn toàn đồng nhất.
* **Xác minh số lượng đếm**: Truy cập trang cấu hình Home Component `ProductGrid`, xác nhận danh mục Samba hiển thị chính xác số lượng sản phẩm `Samba (10)` thay vì `Samba (1)`.
* **Xác minh hiển thị storefront**: Truy cập storefront thực tế, chọn tab Samba, xác nhận hiển thị đầy đủ 10 sản phẩm thay vì trống rỗng (Empty State).
* **Xác minh UI bộ lọc Combobox**:
  * Trong Admin Form: Nhấp chọn danh mục, gõ tìm kiếm "Samba" để kiểm tra tính năng lọc gõ. Tích chọn, xác nhận badge hiển thị bên dưới. Xóa badge, xác nhận cập nhật chính xác.
  * Trong Admin Products & Storefront `/products`: Nhấp bộ lọc danh mục, gõ tìm kiếm "Samba", chọn danh mục, xác nhận danh sách sản phẩm được lọc tương ứng.

# VIII. Todo
- [ ] Chỉnh sửa Convex query đếm `countActiveByCategory` tại `convex/products.ts`.
- [ ] Cập nhật logic query storefront tại `components/site/ProductGridSection.tsx`.
- [ ] Thiết kế và tích hợp Combobox Multi-select trong `app/admin/home-components/product-grid/_components/ProductGridForm.tsx`.
- [ ] Thiết kế và tích hợp Combobox lọc trong `app/admin/products/page.tsx`.
- [ ] Thiết kế và tích hợp Combobox lọc trong `app/(site)/_components/products/ProductsPage.tsx`.
- [ ] Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 15` để kiểm chứng.
- [ ] Phát âm thanh hoàn thành task `"Done, Sir."`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Số lượng sản phẩm hiển thị trong Admin Form khớp chính xác 100% với số lượng thực tế trong danh mục (bao gồm cả danh mục phụ gán qua assignments).
* Storefront hiển thị đầy đủ sản phẩm của danh mục Samba khi click tab Samba.
* Bộ lọc chọn danh mục ở 3 nơi hoạt động trơn tru: hỗ trợ gõ tìm kiếm (search), cuộn mượt mà (ScrollArea) và chọn nhanh chóng.
* Hệ thống build hoàn tất không phát sinh bất kỳ lỗi TypeScript nào.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Thấp. Sửa đổi Convex query chỉ cải tiến phần logic đếm an toàn. Thay đổi UI chỉ sử dụng các component có sẵn của React/Tailwind.
* **Hoàn tác**: Sử dụng `git checkout` để rollback các file bị ảnh hưởng về trạng thái trước đó.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic phân trang, sorting nâng cao hay các logic nghiệp vụ khác của sản phẩm.
* Tác động đến các module bài viết (posts) hay dịch vụ (services) ngoài phạm vi yêu cầu.
