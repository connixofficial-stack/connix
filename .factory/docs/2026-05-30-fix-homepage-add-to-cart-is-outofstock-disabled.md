# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn đi mua giày trên mạng, có những đôi giày có nhiều kích cỡ (size) khác nhau. Trong kho hệ thống, đôi giày "cha" được ghi nhận số lượng tồn kho là 0 (vì số lượng thực tế nằm ở từng đôi size 39, size 40 cụ thể). 
Trước đây, lập trình viên viết code rằng: "Nếu số lượng giày cha bằng 0 thì nút 'Thêm giỏ' và 'Mua ngay' sẽ bị khóa cứng (disabled) lại không cho bấm". 
Vì thế, khách hàng thấy nút bị mờ đi và click bao nhiêu lần cũng không có tác dụng. 
Giải pháp là chúng ta phải sửa lại điều kiện khóa nút: "Chỉ khóa nút khi giày KHÔNG CÓ kích cỡ (không có variants) và số lượng bằng 0. Nếu giày có nhiều kích cỡ, nút phải luôn mở để khách hàng bấm chọn size".

## 2. Elaboration & Self-Explanation
Trong cấu trúc dữ liệu của dự án này, sản phẩm được chia thành 2 loại:
- Sản phẩm đơn giản (không có phân loại/variants): Số lượng tồn kho được lưu trực tiếp tại thuộc tính `stock` của sản phẩm cha. Nếu `stock <= 0`, sản phẩm hết hàng thật sự.
- Sản phẩm có phân loại (hasVariants = true): Số lượng tồn kho của sản phẩm cha mặc định bằng `0` hoặc không phản ánh đúng thực tế, vì tồn kho thực sự được lưu ở các biến thể variants con (ví dụ: size S còn 5 chiếc, size M còn 2 chiếc).
Hiện tại, ở tầng hiển thị (frontend), biến `isOutOfStock` đang được tính toán đơn giản là:
`const isOutOfStock = showStock && product.stock <= 0;` (hoặc `product.stock <= 0` ở trang tìm kiếm).
Điều này dẫn đến hệ quả là mọi sản phẩm có phân loại đều bị coi là hết hàng ngay từ màn hình danh sách, khiến thuộc tính `disabled={isOutOfStock}` được áp dụng vào thẻ `<button>`. Trình duyệt sẽ chặn toàn bộ sự kiện click chuột (`onClick`) vào nút này, khiến các logic mở modal chọn size hay điều hướng đến trang chi tiết đã viết ở commit trước không thể chạy được.
Chúng ta cần nới lỏng điều kiện kiểm tra `isOutOfStock` này: Chỉ xem là hết hàng khi và chỉ khi sản phẩm đó **không có variants** (`!product.hasVariants`) và đồng thời có `stock <= 0`.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: 
  Sản phẩm "Giày Sneaker Adidas" có `hasVariants = true` and `stock = 0`.
  - *Hiện tại*: `isOutOfStock` trả về `true` vì `stock = 0 <= 0`. Nút "Thêm giỏ" bị `disabled`, khách hàng không click được.
  - *Đề xuất*: `isOutOfStock` trả về `false` vì có `hasVariants = true`. Nút "Thêm giỏ" ở trạng thái hoạt động (enabled). Khi click, khách hàng sẽ được đưa tới trang chi tiết hoặc mở modal để chọn size giày thích hợp.
- **Phép so sánh đời thường**: 
  Giống như bạn đến một quầy bánh ngọt. Người bán xếp một hộp bánh mẫu trống rỗng ra ngoài (số lượng bánh trong hộp mẫu là 0). Nhưng thực tế trong tủ kính phía sau có rất nhiều vị bánh khác nhau (vị dâu, vị trà xanh). Nếu bạn chỉ nhìn hộp mẫu trống không mà bỏ đi (coi như hết hàng) thì rất đáng tiếc. Bạn phải mở hộp mẫu ra hoặc hỏi người bán (bấm chọn size) để lấy vị bánh cụ thể.

# II. Audit Summary (Tóm tắt kiểm tra)
- Trạng thái hiện tại: Đã sửa xử lý click (`handleAddToCart`, `handleBuyNow`) nhưng chưa sửa chốt chặn `disabled={isOutOfStock}` ở HTML `<button>`.
- Các khu vực bị ảnh hưởng:
  1. `app/(site)/_components/products/ProductCardComponents.tsx` (Component `ProductCardActions` hiển thị nút cho danh sách sản phẩm)
  2. `app/(site)/_components/products/ProductCardComponents.tsx` (Component `ProductList` hiển thị nút dạng list lớn)
  3. `app/(site)/search/page.tsx` (Component `ProductSearchCardActions` và phần danh sách sản phẩm tìm kiếm dạng list)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Thuộc tính `disabled` trong HTML chặn các hành động tương tác chuột. Việc đặt `disabled={product.stock <= 0}` cho cả sản phẩm có phân loại đã vô hiệu hóa hoàn toàn nút bấm trên giao diện.
- **Giả thuyết đối chứng**: Nếu ta chỉ loại bỏ `disabled` cho tất cả sản phẩm thì sao? -> Sẽ dẫn tới việc sản phẩm không có variants hết hàng thật sự cũng bấm được nút, khi đó gọi API thêm vào giỏ hàng sẽ bị lỗi backend hoặc lỗi trải nghiệm người dùng. Do đó, chỉ loại bỏ `disabled` khi `product.hasVariants === true`.

# IV. Proposal (Đề xuất)
Cập nhật cách tính toán `isOutOfStock` và các điều kiện disable nút ở frontend:
- Với các component trong `ProductCardComponents.tsx`:
  - Thay đổi `isOutOfStock` thành `showStock && !product.hasVariants && product.stock <= 0`.
  - Thay đổi điều kiện disable trong `ProductList` (dạng danh sách) thành `showStock && !product.hasVariants && product.stock <= 0`.
- Với trang tìm kiếm `search/page.tsx`:
  - Trong `ProductSearchCardActions`: đổi `isOutOfStock` thành `!product.hasVariants && product.stock <= 0`.
  - Trong `handleBuyNow`: đổi chốt chặn `if (product.stock <= 0) return;` thành `if (!product.hasVariants && product.stock <= 0) return;`.
  - Trong phần render danh sách kết quả tìm kiếm: đổi `product.stock <= 0` thành `!product.hasVariants && product.stock <= 0`.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Nhóm UI Components

#### [MODIFY] [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductCardComponents.tsx)
- Vai trò hiện tại: Cung cấp các khối giao diện cho card sản phẩm ở trang danh sách và trang chủ.
- Sửa đổi: Cập nhật biến `isOutOfStock` và các nút trong component `ProductList` để không disable sản phẩm có variants.

#### [MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/search/page.tsx)
- Vai trò hiện tại: Trang tìm kiếm sản phẩm của website.
- Sửa đổi: Cập nhật biến `isOutOfStock` trong các component phụ, hàm `handleBuyNow` và khối JSX hiển thị nút dạng danh sách tìm kiếm.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `ProductCardComponents.tsx`.
2. Đọc và chỉnh sửa `app/(site)/search/page.tsx`.
3. Kiểm tra kiểu dữ liệu TypeScript tĩnh qua `bunx tsc --noEmit`.
4. Xác nhận hoạt động qua môi trường thực tế (tester sẽ thực hiện hoặc kiểm tra runtime).
5. Thực hiện commit các thay đổi.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo code biên dịch sạch lỗi.

### Manual Verification
- Truy cập vào trang chủ hoặc trang tìm kiếm.
- Kiểm tra các sản phẩm có size/màu sắc (hasVariants = true): Nút "Thêm giỏ" và "Mua ngay" phải hiển thị sáng lên (không bị disable), hover có hiệu ứng và click hoạt động bình thường.
- Kiểm tra sản phẩm đơn giản hết hàng (nếu có): Nút phải bị mờ và không thể click.

# VIII. Todo
- [ ] Cập nhật logic `isOutOfStock` trong component `ProductCardActions` tại [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductCardComponents.tsx).
- [ ] Cập nhật điều kiện `disabled` cho các nút ở component `ProductList` tại [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductCardComponents.tsx).
- [ ] Cập nhật logic `isOutOfStock` trong component `ProductSearchCardActions` tại [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/search/page.tsx).
- [ ] Sửa chốt chặn tồn kho trong `handleBuyNow` tại [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/search/page.tsx).
- [ ] Cập nhật điều kiện `disabled` và kiểu dáng nút trong danh sách kết quả tìm kiếm tại [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/search/page.tsx).
- [ ] Chạy kiểm tra TypeScript compile tĩnh.
- [ ] Thực hiện commit Git và phát âm báo hoàn thành.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Code vượt qua kiểm tra compile tĩnh không có lỗi (`tsc --noEmit`).
- Người dùng có thể click thành công nút "Thêm giỏ" và "Mua ngay" đối với mọi sản phẩm có variants trên trang chủ và trang tìm kiếm.
- Sản phẩm hết hàng thực sự vẫn hiển thị "Hết hàng" và bị disable.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- *Rủi ro*: Logic `hasVariants` có thể bị undefined ở một số sản phẩm cũ nếu dữ liệu không nhất quán.
- *Biện pháp giảm thiểu*: Sử dụng toán tử check an toàn `!product.hasVariants` (nếu không có trường này thì coi như là sản phẩm thường và kiểm tra tồn kho bình thường).
- *Rollback*: Sử dụng lệnh `git checkout -- <file_path>` để hoàn tác các chỉnh sửa nếu có lỗi nghiêm trọng xảy ra.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa database hay backend Convex.
- Không thay đổi thiết kế giao diện chính của trang chủ hoặc trang tìm kiếm.
