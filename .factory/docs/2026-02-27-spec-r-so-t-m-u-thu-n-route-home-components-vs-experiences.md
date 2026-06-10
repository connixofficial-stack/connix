## Problem Graph
1. Liệt kê đầy đủ mâu thuẫn route và mapping <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Route public sản phẩm đang dùng song song 2 chuẩn `/products/[slug]` và `/san-pham/[slug]`
   1.2 Danh mục Home Components (/admin/home-components) nhiều loại hơn tập Experiences (/system/experiences)
   1.3 Thiếu bảng mapping rõ ràng loại nào thuộc Home Component, loại nào thuộc Experience

## Execution (with reflection)
1. Chuẩn hóa nguồn dữ liệu để liệt kê (read-only):
   - File chính: `app/admin/home-components/create/shared.tsx` (nguồn truth cho tất cả type Home Component).
   - File chính: `app/system/experiences/page.tsx` (nguồn truth cho danh sách Experience).
   - File route public: `app/(site)/products/page.tsx`, `app/(site)/products/[slug]/page.tsx`.
   - File render link sản phẩm trong home-components: `components/site/ComponentRenderer.tsx`, `components/site/ProductListSection.tsx`.
   - Reflection: ✓ đủ nguồn để đối chiếu, không cần sửa code.

2. Xuất danh sách FULL Home Components:
   - Liệt kê 29 type hiện có từ `COMPONENT_TYPES` (value + route + label).
   - Đánh dấu nhóm liên quan sản phẩm: `ProductCategories`, `ProductList`, `ProductGrid`, `CategoryProducts`.
   - Reflection: ✓ đáp ứng yêu cầu “liệt kê các home-component ra hết”.

3. Xuất danh sách FULL Experiences:
   - Liệt kê 15 mục từ mảng `experiences` trong `app/system/experiences/page.tsx`.
   - Đánh dấu các mục liên quan sản phẩm: `products-list`, `product-detail`, cùng các experience phụ thuộc e-commerce (`cart`, `wishlist`, `checkout`, `promotions-list`, ...).
   - Reflection: ✓ có đủ tập để so sánh chênh lệch.

4. Liệt kê mâu thuẫn route sản phẩm (nhóm A):
   - Chỉ ra route canonical hiện có trong app router: `/products/[slug]`.
   - Chỉ ra các vị trí trong `components/site/ComponentRenderer.tsx` vẫn hardcode `/san-pham/${slug}`.
   - Chỉ ra các vị trí dùng `/products/${slug}` trong `components/site/ProductListSection.tsx` và `app/system/experiences/product-detail/page.tsx`.
   - Kết luận mâu thuẫn: cùng luồng “chi tiết sản phẩm” đang render link bằng 2 prefix khác nhau.
   - Reflection: ✓ bám đúng issue user nêu.

5. Liệt kê mâu thuẫn danh sách admin vs experiences (nhóm B):
   - So sánh set Home Components (29) với set Experiences (15).
   - Nhóm lệch 1: các type có ở Home Components nhưng không có Experience cấu hình riêng (ví dụ: `Hero`, `Stats`, `Partners`, `About`, `Footer`, `Team`, ...).
   - Nhóm lệch 2: các Experience hành vi mua hàng (`cart`, `checkout`, `wishlist`, `account-*`, `menu`) không có đối tượng tương ứng trong Home Components list.
   - Nhóm lệch 3: naming chưa đồng nhất (`ProductList` vs `products-list`, `Services` vs `services-detail`, ...).
   - Reflection: ✓ thể hiện rõ “lệch giữa /admin/home-components với /system/experiences”.

6. Định dạng output bàn giao:
   - Phần 1: Bảng “Toàn bộ Home Components”.
   - Phần 2: Bảng “Toàn bộ Experiences”.
   - Phần 3: Bảng “Mâu thuẫn Route Sản phẩm” (file + dòng + route cũ/mới).
   - Phần 4: Bảng “Mâu thuẫn Mapping Admin vs Experiences” (thiếu/không đối ứng/lệch tên).
   - Không sửa mã nguồn ở bước này; chỉ báo cáo đầy đủ để bạn quyết định bước fix sau.
   - Reflection: ✓ đúng phạm vi liệt kê, chưa implement fix.