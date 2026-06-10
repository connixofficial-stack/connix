# I. Primer

## 1. TL;DR kiểu Feynman
Giao diện quản lý "Sản phẩm theo danh mục" (Category Products) cho phép bật/tắt nút "Thêm vào giỏ" và "Mua ngay". Tuy nhiên, phần xem trước (Preview) ở trang admin và trang web thực tế (Storefront) chưa đồng bộ điều kiện bán hàng (`saleMode`). Nếu hệ thống đang cấu hình bán hàng dạng "Liên hệ" hoặc "Affiliate", ta không được hiển thị các nút này. Hơn nữa, trên giao diện chỉnh sửa Admin, Preview cần hiển thị chính xác các nút khi được tích chọn ở chế độ bán hàng "Giỏ hàng" (Cart). Chúng ta sẽ thêm điều kiện kiểm tra `saleMode === 'cart'` vào cả Form cấu hình, Preview và Storefront để đảm bảo tính đồng bộ và chính xác tuyệt đối.

## 2. Elaboration & Self-Explanation
Hệ thống có 3 chế độ bán hàng (`saleMode`):
- `cart`: Bán hàng trực tiếp qua giỏ hàng. Cần hiển thị các nút "Thêm vào giỏ" và "Mua ngay".
- `contact`: Khách mua hàng bằng cách liên hệ. Không có giỏ hàng, ẩn các nút mua.
- `affiliate`: Bán qua link liên kết. Không có giỏ hàng, ẩn các nút mua.

Hiện tại, cả storefront (`ComponentRenderer.tsx`) và admin preview (`CategoryProductsPreview.tsx`) chỉ kiểm tra thuộc tính cấu hình `config.showAddToCartButton !== false` mà hoàn toàn bỏ qua việc kiểm tra `saleMode`. Điều này dẫn đến:
1. Khi cấu hình hệ thống là `contact` hoặc `affiliate`, các nút mua hàng vẫn xuất hiện nếu admin tích chọn.
2. Ngược lại, ở trang Preview admin, mặc dù đã tích chọn hiển thị nút bấm nhưng do chưa liên kết logic đồng bộ, hoặc do kẹt cache ở phía user nên nút bấm chưa hiển thị.
3. Form cấu hình admin vẫn hiển thị các checkbox bật/tắt nút bấm này ngay cả khi hệ thống đang ở chế độ `contact` hoặc `affiliate` (lẽ ra phải ẩn đi).

Hướng xử lý:
- Truyền tham số `saleMode` từ trang cha vào component `CategoryProductsForm` và `CategoryProductsPreview`.
- Tại Form, chỉ hiển thị phần cấu hình nút bấm khi `saleMode === 'cart'`.
- Tại Preview và Storefront, điều kiện để hiển thị nút bấm sẽ là: `saleMode === 'cart' && config.showAddToCartButton !== false`.

## 3. Concrete Examples & Analogies
Tưởng tượng bạn đang thiết kế bảng hiệu cho một cửa hàng.
- Nếu cửa hàng bán đồ ăn tự chọn qua quầy (tương đương `cart`), bảng hiệu cần có nút "Thêm khay" và "Thanh toán ngay".
- Nếu cửa hàng chỉ trưng bày sản phẩm để giới thiệu rồi bảo khách liên hệ hotline (tương đương `contact`), bảng hiệu không nên có nút "Thêm khay" vì cửa hàng làm gì có khay hay máy tính tiền ở đó.
Việc hiển thị nút bấm trong chế độ giới thiệu sản phẩm giống như đặt một máy thanh toán tự động vô dụng ở giữa showroom trưng bày chỉ để ngắm, gây bối rối cho khách hàng và người quản lý.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- Tập tin [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx) đang sử dụng component `ProductCardActions` để hiển thị nút mua trong Preview. Tuy nhiên, nó không kiểm tra `saleMode === 'cart'`.
- Tập tin [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx) (storefront) cũng không kiểm tra `saleMode === 'cart'` trước khi render `ProductCardActions` cho component `CategoryProducts`.
- Tập tin [CategoryProductsForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsForm.tsx) hiển thị các checkbox cấu hình nút bấm vô điều kiện, không phụ thuộc vào `saleMode`.
- Dự án compile sạch sẽ, không có lỗi TypeScript.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng**: Khi cấu hình nút bấm được bật trên form admin, Preview không hiển thị nút bấm (do code cũ chưa được compile/reload hoặc do thiếu đồng bộ logic `saleMode`).
- **Nguyên nhân gốc**: Code storefront và preview của `category-products` chưa tích hợp điều kiện kiểm tra `saleMode === 'cart'` vào biến `showAddToCartButton` và `showBuyNowButton`, đồng thời Form admin chưa ẩn đi các trường cấu hình này khi `saleMode` của hệ thống không phải là `cart`.
- **Độ tin cậy nguyên nhân gốc**: High (Cao) - Logic code hiện tại phản ánh rõ việc bỏ sót kiểm tra biến này ở các component liên quan đến `category-products`.

---

# IV. Proposal (Đề xuất)
1. **Sửa Form admin (`CategoryProductsForm.tsx`)**:
   - Nhận prop `saleMode?: string`.
   - Chỉ render block cấu hình nút bấm nếu `saleMode === 'cart'`.
2. **Sửa Trang Edit admin (`page.tsx`)**:
   - Query `saleMode` từ database Convex thông qua api `getModuleSetting`.
   - Truyền `saleMode` vào `CategoryProductsForm`.
3. **Sửa Preview admin (`CategoryProductsPreview.tsx`)**:
   - Cập nhật logic gán biến:
     ```tsx
     const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
     const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
     ```
   - Xóa bỏ thẻ `div` debug config đã thêm tạm trước đó.
4. **Sửa Storefront (`ComponentRenderer.tsx`)**:
   - Cập nhật logic gán biến cho component `CategoryProducts`:
     ```tsx
     const showAddToCartButton = saleMode === 'cart' && config.showAddToCartButton !== false;
     const showBuyNowButton = saleMode === 'cart' && config.showBuyNowButton !== false;
     ```

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI & Admin Components
- [CategoryProductsForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsForm.tsx): Nhận prop `saleMode` và ẩn các checkbox cấu hình nếu `saleMode !== 'cart'`.
- [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx): Ràng buộc hiển thị nút mua theo `saleMode === 'cart'` và dọn dẹp code debug.
- [page.tsx (Edit Category Products)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/[id]/edit/page.tsx): Query `saleMode` từ Convex DB và truyền vào Form.

### Storefront Components
- [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx): Ràng buộc hiển thị nút mua trên site thực theo `saleMode === 'cart'`.

---

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật type định nghĩa prop trong `CategoryProductsForm.tsx`.
2. Bọc cụm checkbox cấu hình nút bấm trong `CategoryProductsForm.tsx` bằng điều kiện `saleMode === 'cart'`.
3. Query `saleMode` trong `page.tsx` (Edit) và truyền vào `CategoryProductsFormProps`.
4. Cập nhật biến `showAddToCartButton` và `showBuyNowButton` trong `CategoryProductsPreview.tsx` để kết hợp điều kiện `saleMode === 'cart'`.
5. Loại bỏ thẻ debug config ở cuối file `CategoryProductsPreview.tsx`.
6. Cập nhật biến `showAddToCartButton` và `showBuyNowButton` trong phần render `CategoryProducts` của `ComponentRenderer.tsx`.
7. Chạy typecheck `bunx tsc --noEmit` để đảm bảo không phát sinh lỗi TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh**: Đảm bảo dự án build thành công bằng `bunx tsc --noEmit`.
- **Đồng bộ**: Kiểm tra xem các thay đổi đã đồng bộ chính xác giữa Form, Preview và Storefront.

---

# VIII. Todo
- [ ] Cập nhật [CategoryProductsForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsForm.tsx)
- [ ] Cập nhật [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/[id]/edit/page.tsx)
- [ ] Cập nhật [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx)
- [ ] Cập nhật [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
- [ ] Chạy kiểm tra compile TypeScript
- [ ] Git commit các thay đổi

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Chế độ bán hàng không phải `cart` -> Không hiển thị cấu hình nút bấm trên Form Admin và ẩn nút trên Preview/Storefront.
- Chế độ bán hàng là `cart` -> Hiển thị cấu hình trên Form. Nút mua hàng trên Preview/Storefront tuân thủ chính xác tích chọn của admin.
- Không có lỗi compile TypeScript.
