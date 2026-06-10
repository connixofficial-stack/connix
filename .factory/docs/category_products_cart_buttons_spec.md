# Cấu hình hiển thị nút Cart và đồng bộ giao diện CategoryProducts

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Các nút thêm giỏ hàng và mua ngay trong phần Sản phẩm theo danh mục (`CategoryProducts`) đang hiển thị không đồng bộ, chữ viết hoa (`uppercase`) làm tốn diện tích gây tràn nút, và các tùy chọn cài đặt giỏ hàng vẫn hiện ra trong admin/giao diện ngay cả khi chế độ mua hàng đã chuyển sang liên hệ hoặc affiliate.
* **Cách giải quyết**:
  1. Loại bỏ các icon và lớp CSS `uppercase`, `tracking-wider` ở các nút. Chỉ hiển thị chữ lowercase `"thêm giỏ"` và `"mua ngay"`.
  2. Điều chỉnh kích thước font-size và khoảng đệm (padding) của nút thật gọn gàng, tự động scale theo thiết bị và bố cục (ví dụ: `grid-2` hoặc mobile thì thu nhỏ font xuống `text-[10px] xs:text-[11px] sm:text-xs`).
  3. Ở cả trang admin edit và trang hiển thị ngoài site (storefront), các tùy chọn cài đặt và các nút này chỉ xuất hiện khi chế độ mua hàng của module sản phẩm đang bật là giỏ hàng (`saleMode === 'cart'`).

## 2. Elaboration & Self-Explanation
Chúng ta đang xây dựng một tính năng tối ưu trải nghiệm mua sắm nhanh cho trang web. Hệ thống hỗ trợ 3 chế độ mua hàng (saleMode):
* `cart`: Mua hàng qua giỏ hàng và thanh toán trực tuyến.
* `contact`: Liên hệ để mua hàng (không có giỏ hàng).
* `affiliate`: Liên kết tiếp thị (chuyển hướng sang sàn TMĐT).

Vì vậy, việc hiển thị các nút "Thêm vào giỏ" và "Mua ngay" chỉ có ý nghĩa khi và chỉ khi hệ thống đang hoạt động ở chế độ `cart`. Nếu ở chế độ `contact` hay `affiliate`, việc hiện các nút này hay hiển thị form cấu hình chúng trong Admin là dư thừa và làm bối rối người quản trị lẫn khách hàng.

Đồng thời, diện tích hiển thị trên các thẻ sản phẩm (product card) của các layout sáng tạo như Bento (ô nhỏ hover), Magazine, Showcase hay Wine Grid rất hạn chế. Nếu chữ quá dài hoặc viết hoa (`THÊM GIỎ`), chữ sẽ bị xuống dòng (rớt dòng) trông rất mất thẩm mỹ. Bằng cách chuyển sang dạng viết thường gọn gàng (`thêm giỏ`, `mua ngay`), tắt bỏ icon và điều chỉnh font-size/padding co giãn thông minh, giao diện sẽ trở nên cân đối, cao cấp và không bao giờ bị rớt dòng.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Trên điện thoại có màn hình hẹp (375px), một thẻ sản phẩm chia đôi cột chỉ rộng khoảng 170px. Nếu nút bấm chứa chữ `"THÊM VÀO GIỎ HÀNG"` viết hoa kèm icon xe đẩy, chữ chắc chắn sẽ bị xuống 2 dòng, làm nút bị phình to và che khuất thông tin khác. Nhưng nếu chuyển thành `"thêm giỏ"` viết thường, cỡ chữ `10px`, nút sẽ nằm gọn gàng trên 1 dòng duy nhất, vừa mắt và tinh tế.
* **Ẩn dụ đời thường**: Giống như việc bạn đi xe máy vào ngày nắng, bạn không cần bật cần gạt mưa. Cần gạt mưa (nút giỏ hàng) chỉ nên xuất hiện và hoạt động khi trời mưa (chế độ mua hàng qua giỏ hàng).

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã kiểm tra 4 file cốt lõi trong hệ thống:
1. [ProductCardActions.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx):
   - Đang dùng `uppercase` và `tracking-wider` trên thẻ `span` bên trong button.
   - Chữ đang hiển thị là `"thêm giỏ"` và `"mua ngay"` nhưng bị viết hoa do class CSS.
   - Font size của `span` con đang ghi đè lên `button` cha chưa tối ưu.
2. [CategoryProductsForm.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsForm.tsx):
   - Đã bọc cấu hình nút giỏ hàng bằng check `isCartMode` từ Convex query (`saleModeSetting?.value === 'cart'`). Rất chính xác.
3. [CategoryProductsPreview.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx):
   - Phần preview admin đã đồng bộ check `saleMode === 'cart'` khi render `ProductCardActions`.
4. [ComponentRenderer.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx):
   - Giao diện storefront của `CategoryProductsSection` chưa kiểm tra điều kiện `saleMode === 'cart'` trước khi hiển thị nút, mà chỉ đọc config thô từ DB. Điều này dẫn tới lỗi hiển thị nút giỏ hàng ở storefront ngay cả khi module sản phẩm đã tắt chế độ giỏ hàng.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc (Root Cause)**: Giao diện hiển thị ngoài trang chủ (storefront) trong `ComponentRenderer.tsx` chưa đồng bộ hóa logic kiểm tra chế độ bán hàng (`saleMode === 'cart'`), và các class CSS trong `ProductCardActions.tsx` vẫn sử dụng `uppercase` kèm `tracking-wider` dẫn đến việc chữ bị phóng to quá cỡ trên các layout chật hẹp, làm mất đi tính gọn gàng tối giản và gây nguy cơ rớt dòng.
* **Giả thuyết đối chứng (Counter-Hypothesis)**: Nếu chỉ sửa CSS ở component dùng chung `ProductCardActions.tsx` mà không sửa logic ở `ComponentRenderer.tsx`, các nút giỏ hàng vẫn sẽ xuất hiện ở storefront khi website chuyển sang chế độ Liên hệ/Affiliate, làm sai lệch luồng nghiệp vụ. Do đó, bắt buộc phải giải quyết cả hai nơi.

---

# IV. Proposal (Đề xuất)

1. **Sửa đổi [ProductCardActions.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx)**:
   - Loại bỏ hoàn toàn class `uppercase` và `tracking-wider` trong các nút.
   - Đồng bộ cỡ chữ trực tiếp từ button cha xuống con, hoặc bỏ thẻ `span` bên trong và viết text trực tiếp trong `button` với các class font-size tinh gọn:
     - Chế độ Compact (bố cục `grid-2` hoặc Mobile): `text-[10px] xs:text-[11px] sm:text-xs px-1 py-1 sm:py-1.5`
     - Chế độ Normal: `text-[11px] xs:text-xs sm:text-sm px-2.5 py-1.5 sm:py-2`
   - Đảm bảo có `whitespace-nowrap` trên toàn bộ text.
2. **Sửa đổi [ComponentRenderer.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)**:
   - Trong `CategoryProductsSection`, cập nhật định nghĩa:
     ```typescript
     const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
     const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
     ```
   - Nhờ đó, tất cả các layout (grid, carousel, cards, bento, magazine, showcase, wine-grid) kế thừa bên dưới sẽ tự động ẩn nút mua hàng khi website không chạy chế độ `'cart'`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [ProductCardActions.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx)
  * Vai trò hiện tại: Render các nút bấm hành động trên card sản phẩm ở storefront và preview.
  * Thay đổi: Tinh chỉnh text viết thường `"thêm giỏ"` và `"mua ngay"`, tối ưu lại font size co giãn thông minh không rớt dòng, loại bỏ class uppercase/tracking-wider.
* **Sửa**: [ComponentRenderer.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
  * Giao diện storefront hiển thị danh sách sản phẩm theo danh mục.
  * Thay đổi: Đồng bộ hóa điều kiện `saleMode === 'cart'` cho các nút giỏ hàng và mua ngay ngoài trang chủ.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và chỉnh sửa `ProductCardActions.tsx` để đồng bộ font-size và loại bỏ class in hoa.
2. Đọc và chỉnh sửa `ComponentRenderer.tsx` tại vị trí dòng 3881 để tích hợp kiểm tra `saleMode === 'cart'`.
3. Tự review tĩnh và đảm bảo các import, types đều chính xác.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

* **Kiểm tra tĩnh**: Chạy typecheck qua trình kiểm lỗi tích hợp của Git Hook lúc commit.
* **Kiểm tra nghiệp vụ**:
  - Giao diện Admin/Form: Khi đổi chế độ bán hàng sang `contact`/`affiliate`, form cấu hình nút giỏ hàng trong `CategoryProducts` phải biến mất. Khi ở chế độ `cart`, form xuất hiện đầy đủ.
  - Giao diện Storefront: Khi ở chế độ `contact`/`affiliate`, không có nút bấm nào xuất hiện trên card sản phẩm. Khi ở chế độ `cart`, các nút "thêm giỏ" và "mua ngay" hiển thị chữ viết thường cực kỳ gọn gàng trên 1 dòng, không rớt dòng ở bất kỳ layout nào (kể cả Bento hover, Showcase, Wine Grid).

---

# VIII. Todo

- [ ] Chỉnh sửa file [ProductCardActions.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx) để đồng bộ text lowercase và co giãn font-size.
- [ ] Chỉnh sửa file [ComponentRenderer.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx) tại `CategoryProductsSection` để tích hợp check `saleMode === 'cart'`.
- [ ] Đánh giá và xác nhận giao diện hiển thị gọn gàng, đẹp mắt và cao cấp.
- [ ] Kích hoạt âm báo PowerShell hoàn thành nhiệm vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Nút mua hàng trên card sản phẩm hiển thị chính xác chữ `"thêm giỏ"` và `"mua ngay"` ở dạng chữ viết thường (lowercase). Không có icon đi kèm.
* Toàn bộ chữ trên nút không bao giờ bị rớt dòng ở mọi layout và kích thước màn hình thử nghiệm. Khoảng cách (spacing) giữa các nút và viền nút gọn gàng, tinh tế.
* Các tùy chọn cấu hình nút giỏ hàng trong admin và storefront chỉ xuất hiện khi `saleMode === 'cart'`.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Thay đổi component dùng chung `ProductCardActions.tsx` có thể ảnh hưởng đến các danh sách sản phẩm khác. Tuy nhiên, component này được thiết kế để render nút hành động trên card, việc tối ưu kích thước nút và chuyển sang chữ thường giúp tăng tính thẩm mỹ đồng bộ cho toàn bộ hệ thống.
* **Hoàn tác**: Sử dụng lệnh `git checkout` đối với các file đã chỉnh sửa nếu có bất kỳ lỗi không mong muốn nào phát sinh.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi hành động click hoặc tích hợp thêm tính năng mới cho giỏ hàng ngoài yêu cầu tối ưu hiển thị của người dùng.
