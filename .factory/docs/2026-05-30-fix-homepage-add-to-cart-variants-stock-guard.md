# Spec: Fix Homepage Add to Cart and Buy Now Buttons for Products with Variants

# I. Primer

## 1. TL;DR kiểu Feynman
- Khi một sản phẩm có nhiều size (phiên bản - variants), số lượng hàng của từng size được quản lý riêng ở các "con" (variants), còn sản phẩm "cha" ở ngoài trang chủ có tồn kho mặc định là `0`.
- Trên trang chủ, khi người dùng click "Thêm vào giỏ" hoặc "Mua ngay", hệ thống chạy qua một chốt chặn kiểm tra: *"Nếu bật quản lý kho và tồn kho của sản phẩm <= 0 thì dừng lại không làm gì"*.
- Vì sản phẩm "cha" có tồn kho là `0`, chốt chặn này lập tức khóa lại, khiến người dùng click mà không thấy bất kỳ phản ứng nào.
- Cách sửa: Chỉ áp dụng chốt chặn tồn kho này cho các sản phẩm **không có phiên bản**. Với sản phẩm có phiên bản, hãy bỏ qua chốt chặn này để mở bảng chọn size (modal) lên, sau đó bên trong bảng chọn size mới kiểm tra xem size đó còn hàng hay không.

## 2. Elaboration & Self-Explanation
- Trong thiết kế cơ sở dữ liệu của hệ thống, khi một sản phẩm được cấu hình có nhiều phiên bản (`hasVariants: true`), số lượng tồn kho thực tế (`stock`) sẽ được lưu trữ tại từng record tương ứng trong bảng `productVariants`. Record sản phẩm chính trong bảng `products` chỉ đóng vai trò là thực thể cha và thường có giá trị `stock` mặc định là `0`.
- Gần đây, hệ thống tích hợp các nút bấm mua nhanh ("Thêm vào giỏ" / "Mua ngay") vào các layout sản phẩm ở trang chủ (như Bento, Magazine, Showcase, v.v.). Tuy nhiên, các hàm xử lý sự kiện click (`handleAddToCart`, `handleBuyNow`) lại được sao chép logic từ trang chi tiết sản phẩm cũ nhưng thiếu đi điều kiện phân biệt sản phẩm có phiên bản.
- Cụ thể, các hàm này bắt đầu bằng một guard check:
  ```typescript
  if (showStock && (product.stock ?? 0) <= 0) { return; }
  ```
  Khi tính năng quản lý kho được kích hoạt (`showStock` là `true`), các sản phẩm cha có phiên bản (với `product.stock` là `0`) sẽ bị rơi vào điều kiện này và hàm lập tức kết thúc (`return`), ngắt hoàn toàn tiến trình hiển thị modal chọn size (`setQuickAddTarget`).
- Hướng xử lý: Sửa đổi điều kiện chốt chặn tồn kho ở frontend. Chỉ thực hiện chặn click nếu sản phẩm đó **không có phiên bản** (`!product.hasVariants`). Với sản phẩm có phiên bản, click sẽ luôn đi tiếp để mở modal chọn phiên bản, nơi tồn kho của từng size con sẽ được kiểm tra một cách chính xác.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể trong dự án**: Sản phẩm *"Giày Adidas Yeezy 350 V2"* (`_id: "m17dtaa5mzabn174r2s4cw6ak987jay1"`) có trường `hasVariants: true` và `stock: 0` trong bảng `products`. Sản phẩm này có 10 phiên bản size hoạt động (từ size 36 đến 45), mỗi size có tồn kho từ 1 đến 5 đôi. Khi click nút "Thêm giỏ" ở trang chủ, vì `product.stock` của Yeezy 350 V2 là `0`, hàm `handleAddToCart` lập tức `return` mà không mở modal chọn size.
- **Ẩn dụ đời thường**: Bạn đến một cửa hàng giày để mua một đôi Adidas Yeezy. Bạn hỏi người bảo vệ ở cửa ra vào: *"Cửa hàng còn giày Yeezy không?"*. Người bảo vệ nhìn vào một danh sách tổng quát trống trơn (tồn kho cha = 0) và trả lời: *"Hết rồi, đi về đi"*, mặc dù trong kho thực tế vẫn còn đủ các size 39, 40, 41 do các nhân viên bán hàng bên trong quản lý. Đúng ra, người bảo vệ phải cho bạn vào trong cửa hàng (mở modal) để nhân viên kiểm tra đúng kích cỡ bạn cần.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Triệu chứng**: Click nút "Thêm giỏ" hoặc "Mua ngay" ở các product items trên trang chủ (layout ProductGrid, ProductList, CategoryProducts) không có phản ứng, không mở modal, không ghi nhận console error.
- **Dữ liệu thực tế (Convex)**: Đã kiểm tra qua `scratch/check_data.js` chạy trên Convex cloud, sản phẩm Yeezy 350 V2 (`m17dtaa5...`) có `hasVariants: true` và `stock: 0` trong bảng `products`, nhưng có 10 variants active trong bảng `productVariants` với `stock > 0`.
- **Mã nguồn frontend**: Các file component trang chủ và trang danh sách sản phẩm chứa logic `handleAddToCart` và `handleBuyNow` kiểm tra `showStock && product.stock <= 0` chặn cứng ngay đầu hàm đối với mọi sản phẩm, bao gồm sản phẩm có variants.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc (Root Cause)**: Do guard check stock ở frontend chặn cứng click của sản phẩm có variants vì `product.stock` của sản phẩm cha bằng `0`.
- **Độ tin cậy (Confidence)**: **High (Rất cao)**. Đã xác nhận qua mã nguồn và dữ liệu thực tế.
- **Giả thuyết đối chứng (Counter-Hypothesis)**: Liệu có phải do modal `QuickAddVariantModal` bị crash hoặc API lấy variants bị lỗi?
  - *Đối chứng*: Đã kiểm tra mã nguồn `QuickAddVariantModal.tsx`, khi `quickAddTarget` là `null` (mặc định ban đầu), component trả về `null` an toàn. Luồng thực thi bị ngắt ngay ở hàm handler của component cha (`handleAddToCart`) nên `quickAddTarget` chưa bao giờ được set khác `null`, do đó modal chưa từng được render để có cơ hội crash.

---

# IV. Proposal (Đề xuất)
- Cập nhật các hàm xử lý click `handleAddToCart` và `handleBuyNow` (và `handlePrimaryAction` nếu có) trong 4 file component frontend:
  - Chỉ áp dụng chốt chặn tồn kho `product.stock <= 0` khi sản phẩm **không có phiên bản** (`!product.hasVariants`).
  - Cụ thể: Thay đổi điều kiện từ `if (showStock && (product.stock ?? 0) <= 0)` thành `if (showStock && !product.hasVariants && (product.stock ?? 0) <= 0)`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI Components

#### [MODIFY] [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx)
- Vai trò hiện tại: Render grid sản phẩm ở trang chủ.
- Sửa: Cập nhật điều kiện check stock trong `handleAddToCart` và `handleBuyNow` để bỏ qua nếu sản phẩm có variants.

#### [MODIFY] [ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx)
- Vai trò hiện tại: Render list/carousel sản phẩm ở trang chủ.
- Sửa: Cập nhật điều kiện check stock trong `handleAddToCart` và `handleBuyNow` tương tự.

#### [MODIFY] [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
- Vai trò hiện tại: Render các section trang chủ (bao gồm CategoryProducts).
- Sửa: Cập nhật điều kiện check stock trong `handleAddToCart` và `handleBuyNow` của section `CategoryProductsSection` tương tự.

#### [MODIFY] [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductsPage.tsx)
- Vai trò hiện tại: Render trang danh sách sản phẩm `/products`.
- Sửa: Cập nhật điều kiện check stock trong `handleAddToCart`, `handleBuyNow` và `handlePrimaryAction` tương tự.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa file `ProductGridSection.tsx` tại vị trí các hàm `handleAddToCart` và `handleBuyNow`.
2. Đọc và chỉnh sửa file `ProductListSection.tsx` tại vị trí các hàm tương ứng.
3. Đọc và chỉnh sửa file `ComponentRenderer.tsx` tại vị trí các hàm tương ứng.
4. Đọc và chỉnh sửa file `ProductsPage.tsx` tại vị trí các hàm tương ứng.
5. Tiến hành review tĩnh và tự động kiểm tra lỗi cú pháp/kiểu dữ liệu (TypeScript compiler).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy `bunx tsc --noEmit` để đảm bảo các thay đổi không gây lỗi biên dịch TypeScript.

### Manual Verification
- Deploy/chạy môi trường dev và thực hiện click vào nút "Thêm vào giỏ" / "Mua ngay" trên sản phẩm có variants ở trang chủ (`http://localhost:3000/`) để xác nhận modal chọn size hiển thị thành công.
- Xác nhận nút của các sản phẩm không có variants vẫn hoạt động chính xác (hoặc bị chặn/disable nếu thực sự hết hàng).

---

# VIII. Todo
- [ ] Sửa file [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx)
- [ ] Sửa file [ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx)
- [ ] Sửa file [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
- [ ] Sửa file [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductsPage.tsx)

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- **Pass**: Người dùng click nút "Thêm giỏ" / "Mua ngay" của các sản phẩm có phiên bản ở trang chủ/trang danh sách thì modal `QuickAddVariantModal` hiển thị bình thường.
- **Pass**: Các sản phẩm không có phiên bản vẫn tuân thủ đúng logic quản lý kho (chặn click nếu hết hàng).
- **Pass**: Dự án biên dịch thành công mà không có lỗi TypeScript mới.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Rất thấp vì thay đổi chỉ nằm ở tầng logic điều hướng frontend, không thay đổi schema hay dữ liệu thực tế.
- **Hoàn tác**: Sử dụng git để rollback các file đã chỉnh sửa về trạng thái ban đầu nếu cần thiết.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa backend Convex (schema, mutations, queries).
- Không thay đổi thiết kế giao diện của modal chọn phiên bản.

---

# XII. Open Questions (Câu hỏi mở)
- *Không có.*
