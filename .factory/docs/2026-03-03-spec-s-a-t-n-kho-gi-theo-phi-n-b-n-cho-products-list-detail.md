## Problem Graph
1. [Sai nguồn dữ liệu hiển thị tồn kho/giá trên site] <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Backend products query chưa tổng hợp từ variants theo module settings]
   1.2 [Products list (/products) đang render trực tiếp product.stock & product.price/salePrice]
   1.3 [Product detail (/products/[slug]) khi chưa chọn variant vẫn dùng product.stock & product.price/salePrice]
   1.4 [Sort theo giá chưa phản ánh “giá thấp nhất variant còn hàng”]

## Execution (with reflection)
1. Thêm helper đọc settings variants trong `convex/products.ts`
   - Action:
     - Tạo helper query setting cho module `products`:
       - `variantEnabled` (boolean)
       - `variantPricing` (`product|variant`)
       - `variantStock` (`product|variant`)
     - Default fallback giữ như hiện tại (`false`, `variant`, `variant`) để backward-compatible.
   - Reflection: ✓ Có 1 nguồn truth cho toàn bộ public queries.

2. Thêm hàm aggregate theo biến thể (DB-side, không để UI tự đoán)
   - Action:
     - Trong `convex/products.ts`, tạo hàm nội bộ (vd `resolveProductDisplayFromVariants`) nhận danh sách product ids.
     - Batch query variants theo từng product (Promise.all), chỉ lấy variant `Active`.
     - Theo rule bạn chốt:
       - Tồn kho tổng = SUM(stock) của variant Active.
       - Giá thấp nhất = MIN(effectivePrice) từ variant Active **còn hàng** (`stock > 0`), với effectivePrice = `salePrice ?? price`.
     - Trả về map `{ productId -> { derivedStock, derivedPrice, derivedBasePrice?, derivedSalePrice? } }`.
     - Quy ước hiển thị giá để tương thích UI hiện tại:
       - `price = derivedPrice` (giá thanh toán thấp nhất)
       - `salePrice = undefined` để tránh hiển thị discount % sai do không có “giá gốc” đồng nhất.
   - Reflection: ✓ Đúng nguyên tắc, tránh “hết hàng giả” và giá sai ngữ nghĩa.

3. Áp aggregate vào các public queries đang cấp dữ liệu cho site
   - Files: `convex/products.ts`
   - Action:
     - `listPublishedPaginated`
     - `listPublishedWithOffset`
     - `searchPublished`
     - `getBySlug`
     - (khuyến nghị thêm) `listFeatured`, `listRecent`, `listPopular` để đồng nhất toàn site.
   - Rule áp dụng:
     - Chỉ khi `variantEnabled && variantStock === 'variant'` thì override `stock` từ tổng variants.
     - Chỉ khi `variantEnabled && variantPricing === 'variant'` thì override `price/salePrice` theo biến thể.
     - Các mode còn lại giữ nguyên dữ liệu product gốc.
   - Reflection: ✓ Fix tại backend giúp mọi UI consumer tự đúng, không vá từng component.

4. Cập nhật sort theo giá trong `listPublishedWithOffset` + `searchPublished`
   - Action:
     - Với `sortBy: price_asc|price_desc`, sort theo giá đã resolve (sau khi aggregate), không sort theo field product gốc.
   - Reflection: ✓ Tránh trường hợp list hiển thị giá A nhưng thứ tự theo giá B.

5. Cập nhật product detail logic chọn stock/price mặc định
   - File: `app/(site)/products/[slug]/page.tsx`
   - Action:
     - Giữ logic khi **đã chọn variant**: dùng selectedVariant như hiện tại.
     - Khi **chưa chọn variant**:
       - `stockValue` lấy từ product.stock (đã được backend aggregate khi bật variantStock=variant).
       - `displayPrice` lấy từ product.price (đã aggregate khi variantPricing=variant).
     - Đảm bảo không tự tính lại ở client để tránh lệch với backend.
   - Reflection: ✓ Client chỉ render, backend quyết định nghiệp vụ.

6. Cập nhật schema SEO metadata cho detail nếu đang dùng price/stock gốc
   - File: `app/(site)/products/[slug]/layout.tsx`
   - Action:
     - Dữ liệu lấy từ `api.products.getBySlug` đã được aggregate nên metadata price/inStock tự đúng; chỉ cần verify các field dùng trong JSON-LD không còn giả định product.stock gốc.
   - Reflection: ✓ SEO/product schema đồng bộ thực tế bán hàng.

7. Edge cases cần xử lý rõ
   - Nếu không có variant Active nào:
     - `derivedStock = 0`.
     - Giá fallback về product.price hiện có (để không null UI), nhưng trạng thái vẫn hết hàng.
   - Nếu có variant Active nhưng tất cả stock=0:
     - `derivedStock = 0`.
     - Giá fallback về product.price (hoặc min giá trên Active nếu muốn hiển thị tham chiếu) — chọn fallback product.price để nhất quán và đơn giản.
   - Reflection: ✓ Không crash, hành vi predictable.

8. Checklist xác nhận sau implement
   - `/system/modules/products`: bật `variantEnabled`, set `variantStock=variant`, `variantPricing=variant`.
   - `/products`:
     - card không còn “Hết hàng” sai khi variants còn stock.
     - giá card bằng giá thấp nhất từ variant Active còn hàng.
     - sort giá asc/desc đúng theo giá đang hiển thị.
   - `/products/[slug]`:
     - mặc định hiển thị tồn kho tổng variants Active.
     - mặc định hiển thị giá thấp nhất variant Active còn hàng.
     - chọn variant cụ thể vẫn override đúng giá/tồn kho của variant đó.

## Best-practice chốt nhanh
- Dồn business rule vào Convex query (server truth), tránh tản mạn ở client.
- Chỉ aggregate cho đúng điều kiện settings để không phá mode “theo sản phẩm”.
- Batch đọc variants và map theo productId để tránh N+1 nặng phía client.

Nếu bạn duyệt spec này, mình sẽ implement đúng theo các bước trên.