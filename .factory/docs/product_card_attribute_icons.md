# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Hiện tại khi bật "Hệ thống Phân loại & Thuộc tính", danh sách sản phẩm chỉ hiển thị ảnh, tên và giá. Khách hàng muốn các thẻ sản phẩm (Product Card) hiển thị thêm các thông tin thuộc tính chính (như thương hiệu, quốc gia, giống nho, hương vị) kèm icon trực quan để dễ so sánh và nâng tầm thẩm mỹ của website giống các trang e-commerce cao cấp.
* **Giải pháp**: 
  1. Viết một query Convex mới `api.attributeTerms.getTermsForProducts` nhận vào danh sách ID sản phẩm đang hiển thị và trả về toàn bộ thông tin thuộc tính (gồm term name, slug, và group name, slug, code) của chúng trong 1 request duy nhất (tránh N+1 query).
  2. Ở client, nếu tính năng Phân loại được bật (`enableProductTypes` là `true`), ta chạy query này để lấy thuộc tính cho các sản phẩm hiện tại.
  3. Hiển thị các thuộc tính này dưới dạng các thẻ icon nhỏ gọn, tinh tế nằm dưới tiêu đề của mỗi Product Card trong cả hai layout Grid (Lưới) và List (Danh sách).
  4. Để tránh UI bị rối khi sản phẩm có quá nhiều thuộc tính, ta chỉ hiển thị tối đa 4 thuộc tính quan trọng nhất (như Thương hiệu, Xuất xứ, Giống nho, Hương vị) và giới hạn độ dài hiển thị.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ thực hiện giải pháp từ backend tới frontend:
* **Backend**:
  * Thêm query `getTermsForProducts` vào `convex/attributeTerms.ts`. Query này nhận mảng `productIds`. Với mỗi `productId`, nó sẽ tra cứu bảng liên kết `productAttributeTerms`, sau đó lấy chi tiết `attributeTerms` và `attributeGroups` tương ứng. Query được gộp (batching) tối ưu để trả về kết quả nhanh chóng.
* **Frontend**:
  * Tại `ProductsPage.tsx`, gọi query này:
    `const productsWithAttrs = useQuery(api.attributeTerms.getTermsForProducts, enableProductTypes && productIds.length > 0 ? { productIds } : "skip");`
  * Chuyển đổi kết quả thành một `Map<string, any[]>` để tra cứu O(1) theo `productId`.
  * Truyền Map này vào `ProductGrid` và `ProductList` (hoặc truyền qua props của component).
  * Trong mỗi Product Card, render danh sách các thuộc tính. Mỗi thuộc tính hiển thị kèm theo icon Lucide tương ứng dựa trên nhóm thuộc tính (ví dụ: code `brand` -> icon `Tag`, code `country` -> icon `MapPin`, code `grape` -> icon `Grape`, các group khác -> icon mặc định hoặc icon tương thích như `Soup` cho hương vị).
  * Tối ưu hóa UI/UX: Trên layout lưới điện thoại (Grid 2 cột), chỉ hiển thị tối đa 2 thuộc tính chính, dùng text-ellipsis và kích thước chữ nhỏ (text-[11px]) để tránh vỡ khung thẻ sản phẩm.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  Sản phẩm rượu vang Chateau Margaux 2019 sẽ hiển thị:
  * Nút có icon `Tag` màu đỏ rượu: Château Margaux (Thương hiệu)
  * Nút có icon `MapPin` màu đỏ rượu: Pháp (Xuất xứ)
  * Nút có icon `Grape` màu đỏ rượu: Cabernet Sauvignon, Merlot (Giống nho)
  * Nút có icon `Soup` hoặc `Wine` màu đỏ rượu: Cherry, vanilla (Hương vị)
* **Analogy đời thường**:
  Giống như nhãn mác (nutrition facts/label) trên chai rượu hay thực phẩm siêu thị, thay vì bắt khách hàng lật mặt sau đọc chữ li ti hoặc click vào trang chi tiết, ta đưa 3-4 thông số mấu chốt nhất (xuất xứ, nồng độ, thành phần chính) ra ngay mặt trước với icon sinh động để họ nhận biết chỉ trong 1 giây.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra `convex/attributeTerms.ts`: Hiện tại có hàm `getAssignedTermIds` cho đơn lẻ 1 `productId` nhưng không tối ưu cho danh sách sản phẩm (N+1 query).
* Đã kiểm tra `app/(site)/_components/products/ProductsPage.tsx`:
  * Có `ProductGrid` và `ProductList` là nơi vẽ danh sách sản phẩm.
  * Nhận `products` dạng mảng `ProductCardProps['product'][]`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Triệu chứng**: Thiếu thông tin thuộc tính hiển thị ở cấp danh sách sản phẩm, làm giảm trải nghiệm mua sắm nhanh.
* **Giả thuyết đối chứng**: Nếu load attributes riêng lẻ cho từng card e.g. dùng `useQuery` trong component con của từng Card, Next.js/Convex sẽ gửi hàng chục query nhỏ lên server làm chậm thời gian render ban đầu (FCP/LCP). Gộp query ở component cha là phương án tối ưu nhất.

# IV. Proposal (Đề xuất)
1. Thêm query `getTermsForProducts` vào `convex/attributeTerms.ts`.
2. Sửa `ProductsPage.tsx`:
   * Chạy query gộp lấy thuộc tính cho danh sách sản phẩm hiện tại.
   * Truyền map thuộc tính vào `ProductGrid` và `ProductList`.
   * Ở mỗi thẻ sản phẩm (Grid + List), render tối đa 4 thuộc tính (Thương hiệu, Quốc gia, Giống nho, Hương vị) với icon Lucide tương ứng:
     * Thương hiệu (code/slug: `brand` hoặc `thuong-hieu`...): `Tag` icon.
     * Quốc gia (code/slug: `country` hoặc `quoc-gia`...): `MapPin` icon.
     * Giống nho (code/slug: `grape` hoặc `giong-nho`...): `Grape` icon.
     * Mùi vị/Hương thơm (code/slug: `flavor` hoặc `huong-vi`...): `Soup` icon (như soup/chén súp/mùi vị ẩm thực).
   * Tạo CSS inline/Tailwind mượt mà, đồng bộ với tông màu đỏ vang `#9B2C3B` (hoặc `primaryColor` từ tokens).

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: `convex/attributeTerms.ts`
  * Thêm query `getTermsForProducts`.
* **Sửa**: `app/(site)/_components/products/ProductsPage.tsx`
  * Lấy và mapping dữ liệu thuộc tính sản phẩm.
  * Cập nhật `ProductGrid` và `ProductList` để render các chip thuộc tính dưới tiêu đề.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật `convex/attributeTerms.ts` với query gộp mới.
2. Cập nhật `ProductsPage.tsx` tích hợp query và logic render UI thuộc tính trên thẻ sản phẩm.
3. Chạy `bunx tsc --noEmit` để verify TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Type check**: Chạy `bunx tsc --noEmit` để đảm bảo code build thành công.
* **Manual Verification**:
  * Mở route `/ruou-vang-sam-panh` có bật Phân loại & Thuộc tính.
  * Kiểm tra dưới mỗi card sản phẩm hiển thị đúng các icon + tên thuộc tính (Thương hiệu, Quốc gia, Giống nho, Hương vị).
  * Kiểm tra trên mobile (giao diện lưới 2 cột) hiển thị gọn gàng, không bị vỡ hoặc lệch khung card.

# VIII. Todo
* [ ] Thêm query `getTermsForProducts` vào `convex/attributeTerms.ts`.
* [ ] Cập nhật `ProductsPage.tsx` để lấy dữ liệu thuộc tính và truyền vào `ProductGrid`/`ProductList`.
* [ ] Render các chip thuộc tính kèm icon Lucide dưới tiêu đề trong `ProductGrid` (Grid Card).
* [ ] Render các chip thuộc tính kèm icon Lucide dưới tiêu đề trong `ProductList` (List Row).
* [ ] Chạy type check bằng `bunx tsc --noEmit` để verify.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Thẻ sản phẩm hiển thị đầy đủ icon + text thuộc tính khi bật hệ thống Phân loại.
* UI cân đối, khoảng cách đều đặn, responsive tốt ở cả màn hình desktop và điện thoại di động (chỉ hiện các thông số chính yếu, giới hạn ký tự và ẩn bớt khi quá dài).
* Không có lỗi TypeScript.
