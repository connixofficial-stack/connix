# Spec: Sửa lỗi hiển thị sản phẩm theo danh mục và thêm 4 nút sinh nhanh Category Products

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề chính**: 
  - Khi xem trang danh mục ngoài giao diện (client), hệ thống hiển thị cả sản phẩm phụ (Secondary Category) từ bảng liên kết `productCategoryAssignments`.
  - Nhưng trong trang quản lý danh mục ở Admin và phần Preview lúc cấu hình Homepage Component `CategoryProducts`, hệ thống chỉ lọc bằng so sánh đơn giản `p.categoryId === id` (chỉ lấy danh mục chính - Primary Category) trên 100 sản phẩm ngẫu nhiên lấy từ DB. Do đó xảy ra tình trạng: ngoài web thấy 9 sản phẩm, trong admin chỉ thấy 4 sản phẩm, và trong component tạo sản phẩm theo danh mục lại thấy 0 sản phẩm.
* **Giải pháp**:
  - Viết các query Convex tối ưu để lấy và đếm sản phẩm trực tiếp từ DB cho từng danh mục cụ thể (gồm cả liên kết chính và liên kết phụ).
  - Tích hợp 4 nút sinh nhanh cực kỳ tiện lợi vào form admin: 4 danh mục nhiều SP nhất, 4 danh mục mới nhất, danh mục có sản phẩm > 0, và tất cả mọi danh mục.

## 2. Elaboration & Self-Explanation
* **Bản chất kỹ thuật**:
  - Quan hệ sản phẩm - danh mục được lưu trữ theo 2 cơ chế song song: cột `categoryId` trên bảng `products` (danh mục chính) và bảng trung gian `productCategoryAssignments` (quan hệ nhiều - nhiều, chứa cả danh mục phụ).
  - Ở client side, khi lấy sản phẩm theo danh mục, Convex sử dụng helper `mergeProductsByCategoryAssignments` để gộp sản phẩm từ cả 2 nguồn này.
  - Tuy nhiên, trang Chỉnh sửa danh mục ở Admin (`admin/categories/[id]/edit`) lại tải tất cả sản phẩm (tối đa 100 do `listAll` giới hạn) rồi lọc bằng `p.categoryId === id` trên client. Tương tự, trang cấu hình Homepage Component `category-products` tải 100 sản phẩm ngẫu nhiên rồi phân phối về các section bằng so sánh JS `p.categoryId === section.categoryId`. Nếu sản phẩm nằm ngoài top 100 hoặc được gán qua danh mục phụ, nó biến mất hoàn toàn ở Admin.
* **Hướng xử lý**:
  - Thay vì tải toàn bộ sản phẩm rồi lọc ở client JS (vi phạm nguyên tắc băng thông DB), chúng ta tạo query `listProductsByCategoryForAdmin` và `listProductsForCategories` trong Convex. Khi lấy sản phẩm cho nhiều danh mục để preview Homepage Component, query sẽ nhân bản sản phẩm ảo tương ứng với từng danh mục được yêu cầu (đối với sản phẩm gán phụ) giúp client-side filter của component preview hoạt động 100% chính xác mà không cần refactor giao diện.
  - Thêm query `listActiveCategoriesWithProductCounts` đếm chuẩn xác tổng sản phẩm (chính + phụ) của mỗi danh mục, làm nguồn dữ liệu đáng tin cậy để sinh nhanh.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  - Giả sử sản phẩm "Giày Nike Air Max 1 Black" có danh mục chính là "Nike" (`categoryId`) và danh mục phụ là "Max 1" (nằm trong `productCategoryAssignments`).
  - Khi vào trang `/max-1` ngoài web, hệ thống tìm trong `productCategoryAssignments` thấy đôi giày này nên hiển thị (tổng cộng 9 đôi).
  - Khi vào trang Chỉnh sửa danh mục "Max 1" trong Admin, hệ thống lọc `p.categoryId === max1_id` -> không khớp vì danh mục chính của nó là "Nike" -> Chỉ hiển thị 4 đôi giày khác có danh mục chính là "Max 1".
  - Khi cấu hình Homepage Component `category-products` cho danh mục "Max 1", hệ thống tải 100 sản phẩm. Nếu đôi giày nằm ngoài top 100 hoặc do lọc JS chỉ so sánh `p.categoryId` -> Hiển thị 0 sản phẩm.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Trang Category ngoài Web**: Hoạt động đúng, gộp sản phẩm chính và phụ qua Convex helper.
* **Trang Admin Edit Category**: Hiển thị sai số lượng sản phẩm do filter client-side trên tập 100 bản ghi của `listAll`.
* **Trang Admin Create/Edit CategoryProducts**: Preview bị trống (0 sản phẩm) do filter client-side trên tập 100 bản ghi của `listPublicResolved` và không nhận diện sản phẩm thuộc danh mục phụ.
* **Tính năng Sinh nhanh**: Chưa được tích hợp cho `CategoryProducts` Homepage Component.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc)**:
  1. Trang Chỉnh sửa danh mục Admin và Component Preview lọc sản phẩm thuộc danh mục bằng so sánh JS tĩnh `p.categoryId === categoryId` trên Client.
  2. Dữ liệu đầu vào cho bộ lọc Client bị giới hạn cứng ở 100 sản phẩm (`listAll` và `listPublicResolved` giới hạn 100).
  3. Thiếu query đếm sản phẩm chính xác (chính + phụ) cho danh mục hoạt động để hỗ trợ sinh nhanh.
* **Counter-Hypothesis (Giả thuyết đối chứng)**:
  - Nếu chỉ tăng giới hạn `limit` của `listAll` lên 5000, trang chỉnh sửa admin có thể hiển thị đủ nhưng cực kỳ tốn băng thông, tải chậm và vẫn không hiển thị được sản phẩm được gán phụ qua bảngassignments. Vì vậy, bắt buộc phải filter ở DB thông qua các query chuyên dụng.

# IV. Proposal (Đề xuất)
* **a) Viết 3 Query Convex mới**:
  - `listProductsByCategoryForAdmin`: lấy chính xác sản phẩm thuộc danh mục (chính + phụ) cho Admin Edit Category.
  - `listProductsForCategories`: lấy sản phẩm thuộc danh sách danh mục (nhân bản sản phẩm ảo tương ứng với `categoryId` để tương thích client-side filter).
  - `listActiveCategoriesWithProductCounts`: đếm chính xác sản phẩm của từng danh mục active.
* **b) Tích hợp vào Admin Pages**:
  - Cập nhật trang Edit Category Admin để dùng query mới.
  - Cập nhật trang Create/Edit `CategoryProducts` để truyền danh sách `categoryIds` đang chọn vào query preview.
* **c) Thêm 4 nút Sinh nhanh**:
  - Thêm giao diện sinh nhanh tiện dụng trong `CategoryProductsForm.tsx` với 4 chế độ:
    - 4 danh mục nhiều SP nhất.
    - 4 danh mục mới nhất.
    - Tất cả danh mục có sản phẩm > 0.
    - Tất cả mọi danh mục.

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. Convex Backend Layer
* **Sửa: [products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/products.ts)**
  - Thêm query `listProductsByCategoryForAdmin` lấy toàn bộ sản phẩm (Active/Draft/Archived) thuộc danh mục cụ thể (cả chính và phụ).
  - Thêm query `listProductsForCategories` lấy sản phẩm Active thuộc danh sách danh mục cụ thể, tự động nhân bản ảo trường `categoryId` tương ứng để tương thích client-side filter.
* **Sửa: [productCategories.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productCategories.ts)**
  - Thêm query `listActiveCategoriesWithProductCounts` đếm tổng sản phẩm Active (chính + phụ) cho mỗi danh mục active, kèm thời gian tạo `_creationTime`.

### 2. Admin UI Layer
* **Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/categories/%5Bid%5D/edit/page.tsx)**
  - Thay thế `productsData` và logic filter client bằng cách gọi trực tiếp `api.products.listProductsByCategoryForAdmin`.
* **Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/create/category-products/page.tsx)**
  - Thay thế `api.products.listPublicResolved` bằng `api.products.listProductsForCategories` truyền danh sách `categoryIds` đang chọn.
  - Thay thế `api.productCategories.listActive` bằng `api.productCategories.listActiveCategoriesWithProductCounts`.
* **Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/%5Bid%5D/edit/page.tsx)**
  - Đồng bộ tương tự trang create để đảm bảo parity giữa màn hình tạo mới và chỉnh sửa component.
* **Sửa: [CategoryProductsForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsForm.tsx)**
  - Tích hợp 4 nút sinh nhanh danh mục sản phẩm (4 danh mục nhiều SP nhất, 4 danh mục mới nhất, danh mục có SP > 0, tất cả danh mục) ngay trên đầu phần "Các section danh mục" khi `selectionMode === 'real'`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `convex/products.ts` để thêm 2 queries mới.
2. Đọc và chỉnh sửa `convex/productCategories.ts` để thêm query thống kê đếm sản phẩm.
3. Cập nhật trang chỉnh sửa danh mục admin `app/admin/categories/[id]/edit/page.tsx`.
4. Cập nhật trang tạo/sửa Homepage Component `category-products` và form `CategoryProductsForm.tsx`.
5. Đánh giá tĩnh code (static code review), kiểm tra kiểu dữ liệu TypeScript.
6. Commit thay đổi.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra Giao diện Admin Edit Category**: Đảm bảo tab "Sản phẩm thuộc danh mục" của danh mục "Max 1" hiển thị chính xác 9 sản phẩm (giống ngoài web).
* **Kiểm tra Preview CategoryProducts**: Chọn danh mục "Max 1" trong form, đảm bảo preview hiển thị đầy đủ sản phẩm thay vì trống trơn (0 sản phẩm).
* **Kiểm tra tính năng Sinh nhanh**: Click lần lượt 4 nút sinh nhanh, kiểm tra xem các section được sinh tự động đúng logic yêu cầu.

# VIII. Todo
* [ ] Thêm query `listProductsByCategoryForAdmin` vào `convex/products.ts`
* [ ] Thêm query `listProductsForCategories` vào `convex/products.ts`
* [ ] Thêm query `listActiveCategoriesWithProductCounts` vào `convex/productCategories.ts`
* [ ] Cập nhật trang `app/admin/categories/[id]/edit/page.tsx`
* [ ] Cập nhật trang `app/admin/home-components/create/category-products/page.tsx`
* [ ] Cập nhật trang `app/admin/home-components/category-products/[id]/edit/page.tsx`
* [ ] Cập nhật component `app/admin/home-components/category-products/_components/CategoryProductsForm.tsx`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* **Tiêu chí 1**: Số lượng sản phẩm của danh mục trong trang Edit Category khớp chính xác 100% với số lượng sản phẩm ngoài Web (đều là 9 đôi).
* **Tiêu chí 2**: Homepage Component preview hiển thị đúng sản phẩm thuộc danh mục được chọn (bao gồm cả sản phẩm chính và phụ).
* **Tiêu chí 3**: 4 nút sinh nhanh hoạt động trơn tru, tạo ra tối đa 4 sections (đối với top 4) hoặc đầy đủ sections với `itemCount = 4` mặc định.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi TypeScript do kiểu dữ liệu không khớp.
* **Hoàn tác**: Sử dụng Git Rollback hoặc phục hồi các file từ commit cũ nếu có lỗi nghiêm trọng xảy ra.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic hiển thị sản phẩm ngoài trang chủ hoặc trang danh mục client-side (chỉ sửa preview và admin).
