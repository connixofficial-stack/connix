# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Khi bạn chọn bộ lọc như Giống nho -> Merlot ở trang Tất cả sản phẩm, URL hiện tại là `/products?attr_giong-nho=merlot` rất xấu và không tốt cho SEO.
*   **Mong muốn:** URL phải đẹp giống như trang Loại sản phẩm, ví dụ: `/products/giong-nho/merlot`.
*   **Giải pháp:** 
    1. Cập nhật Convex backend (`ia.ts`) để nhận dạng tiền tố `products` giống như một `productTypeSlug` ảo.
    2. Cập nhật Next.js component (`ProductsPage.tsx`) để dựng URL SEO Catch-all bằng cách thay thế `typeSlug` thành `baseSlug` (nếu có loại sản phẩm thì dùng slug của nó, nếu không thì dùng `products`).
    3. Hỗ trợ cả trường hợp chọn Danh mục trên trang Tất cả sản phẩm, chuyển hướng sang dạng `/products/do-uong`.

## 2. Elaboration & Self-Explanation
Hiện tại, trang Tất cả sản phẩm (`/products`) và các trang Loại sản phẩm (`/[productTypeSlug]`) dùng chung component `ProductsPage.tsx`. Tuy nhiên, cơ chế định tuyến SEO đẹp (Catch-all URLs như `/[typeSlug]/[groupSlug]/[termSlug]`) chỉ được kích hoạt khi `productType` khác null.

Khi `productType` là null (trang `/products`), hệ thống rơi vào một nhánh xử lý riêng biệt là biến toàn bộ bộ lọc thành query parameters dạng `?attr_*=...`.

Chúng tôi sẽ hợp nhất hai luồng này bằng cách coi `'products'` chính là `baseSlug` đại diện cho trang Tất cả sản phẩm. Khi đó, đường dẫn SEO Catch-all sẽ tự động hoạt động cho cả `/products`. Ta cần cấu hình Convex resolver (`resolveProductLandingContext`) để phân giải chính xác các đường dẫn bắt đầu bằng `/products/` như `/products/giong-nho/merlot` hoặc `/products/do-uong` thay vì trả về `404 Not Found`.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể:**
    *   *Trước đây:* Lọc Giống nho "Merlot" tại trang Tất cả sản phẩm -> `/products?attr_giong-nho=merlot`
    *   *Sau khi sửa:* Lọc Giống nho "Merlot" tại trang Tất cả sản phẩm -> `/products/giong-nho/merlot`
    *   *Trước đây:* Chọn Danh mục "Đồ uống" tại trang Tất cả sản phẩm -> `/products?category=do-uong`
    *   *Sau khi sửa:* Chọn Danh mục "Đồ uống" tại trang Tất cả sản phẩm -> `/products/do-uong`
*   **Phép ẩn dụ:** Giống như một bưu tá (Next.js router) đang giao thư. Trước đây, bưu tá chỉ biết gửi thư vào hòm thư SEO đẹp nếu địa chỉ nhà có ghi rõ tên Chủ hộ (Product Type). Nếu không ghi tên (Tất cả sản phẩm), bưu tá sẽ dán tất cả thông tin bộ lọc bên ngoài phong bì rất mất thẩm mỹ. Sau khi sửa đổi, chúng ta tạo một danh hiệu mặc định là "Gia đình Products" cho các bức thư không ghi tên chủ hộ, giúp bưu tá vẫn bỏ thư vào hòm thư SEO đẹp một cách ngăn nắp.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Tệp kiểm tra:**
    *   [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts): Chứa hàm `resolveProductLandingContext` để phân giải các segment của URL Catch-all.
    *   [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx): Chứa hàm `navigateWithFilters` xử lý việc chuyển hướng URL khi bộ lọc thay đổi trên client.
    *   [[...slugs]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/[...slugs]/page.tsx): Trang Catch-all Next.js nhận dữ liệu ngữ cảnh từ Convex và render page.
*   **Trạng thái hiện tại:** Biên dịch TypeScript thành công, nhưng bộ lọc ở `/products` chưa dùng SEO Catch-all URL và backend chưa hỗ trợ phân giải `/products/...`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc (Root Cause):**
    1. Nhánh `if (enableProductTypes && !productType)` riêng biệt trong `navigateWithFilters` ép buộc trang `/products` dùng query params `?attr_*=...` thay vì SEO URLs.
    2. Hàm `resolveProductLandingContext` trong Convex backend chỉ hỗ trợ tìm kiếm `productTypes` thật từ database dựa trên segment đầu tiên. Vì không có loại sản phẩm nào có slug là `"products"`, nên bất kỳ URL có 2 hay 3 segments bắt đầu bằng `/products` (ví dụ `/products/giong-nho/merlot`) đều bị trả về `null` (dẫn tới 404).
*   **Độ tin cậy nguyên nhân gốc (Root Cause Confidence):** **High**
    *   *Lý do:* Đoạn mã trong `convex/ia.ts` và `ProductsPage.tsx` chứng minh rõ ràng cơ chế định tuyến Catch-all bị ngắt khi `productType` rỗng hoặc segment đầu tiên không khớp với bất kỳ `productTypes` nào trong database.

# IV. Proposal (Đề xuất)

## 1. Convex Backend (`convex/ia.ts`)
*   Cập nhật schema trả về của `resolveProductLandingContext`:
    *   Cho phép `productTypeId` trong `productTypeCategory` và `productTypeAttribute` là **optional**.
    *   Cho phép `productTypeSlug` trong `productTypeCategory` là **optional**.
*   Cập nhật logic `resolveProductLandingContext`:
    *   *Trường hợp 2 slugs (`slugs.length === 2`):* Nếu `typeSlug === "products"`, kiểm tra xem `subSlug` có phải là danh mục sản phẩm hợp lệ (`productCategories`) hay không. Nếu có, trả về context `productTypeCategory` với `productTypeSlug: "products"` và `productTypeId: undefined`.
    *   *Trường hợp 3 slugs (`slugs.length === 3`):* Nếu `typeSlug === "products"`, kiểm tra xem `groupSlug` và `termSlug` có phải là nhóm thuộc tính và giá trị thuộc tính hợp lệ hay không. Nếu có, trả về context `productTypeAttribute` với `productTypeSlug: "products"`, `productTypeId: undefined`.

## 2. Client Components (`ProductsPage.tsx`)
*   Xác định `baseSlug`:
    ```typescript
    const baseSlug = productType ? productType.slug : 'products';
    ```
*   Xóa bỏ hoàn toàn nhánh `if (enableProductTypes && !productType)` ở dòng 480-532.
*   Thay thế `typeSlug` thành `baseSlug` trong toàn bộ logic dựng đường dẫn SEO Catch-all phía dưới.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts)
*   *Vai trò:* Quản lý phân giải URL động thành ngữ cảnh hiển thị trang landing.
*   *Thay đổi:* Cập nhật schema trả về và bổ sung logic phân giải tiền tố ảo `"products"` cho 2 và 3 segments.

### Sửa: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
*   *Vai trò:* Hiển thị danh sách sản phẩm và xử lý tương tác bộ lọc trên client.
*   *Thay đổi:* Hợp nhất hàm `navigateWithFilters` sử dụng `baseSlug = productType ? productType.slug : 'products'` và dựng đường dẫn SEO chuẩn.

# VI. Execution Preview (Xem trước thực thi)
1.  **Cập nhật backend:** Chỉnh sửa schema và logic phân giải trong `convex/ia.ts`.
2.  **Cập nhật frontend:** Chỉnh sửa logic dựng URL trong `ProductsPage.tsx`.
3.  **Kiểm tra biên dịch:** Chạy `bunx tsc --noEmit` để đảm bảo code sạch lỗi TypeScript.
4.  **Xác minh runtime:** Người dùng chạy thử nghiệm thực tế trên môi trường localhost.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## Automated Tests / Type Checking
*   Chạy lệnh biên dịch tĩnh:
    ```bash
    bunx tsc --noEmit 2>&1 | Select-Object -First 10
    ```

## Manual Verification
*   Truy cập `/products`, chọn bộ lọc "Giống nho" -> "Merlot". Kiểm tra xem URL có tự động thay đổi thành `/products/giong-nho/merlot` và dữ liệu sản phẩm Merlot được tải chính xác không.
*   Chọn danh mục "Đồ uống" trên `/products`. Kiểm tra xem URL có chuyển thành `/products/do-uong` không.
*   Thử chọn nhiều thuộc tính (ví dụ Merlot và Cabernet Sauvignon). Kiểm tra xem URL có dạng `/products/giong-nho/merlot?attr_giong-nho=cabernet-sauvignon` không.

# VIII. Todo
- [ ] Cập nhật schema và logic trong [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts).
- [ ] Cập nhật hàm `navigateWithFilters` trong [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx).
- [ ] Thực hiện biên dịch tĩnh kiểm tra kiểu dữ liệu.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   Khi lọc 1 thuộc tính tại `/products`, URL thay đổi thành `/products/[groupSlug]/[termSlug]`.
*   Trang không bị trắng xóa hoặc báo lỗi 404 sau khi chuyển hướng URL SEO mới.
*   Bộ lọc thuộc tính vẫn lọc sản phẩm chính xác như trước.
*   TypeScript biên dịch thành công 100%.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   *Rủi ro:* Cấu trúc schema trả về của Convex bị thay đổi có thể ảnh hưởng tới các query cũ nếu không tương thích. Tuy nhiên, việc chuyển trường `productTypeId` thành `v.optional` là thay đổi mang tính mở rộng (widening) nên 100% an toàn và không gây xung đột.
*   *Hoàn tác:* Sử dụng `git checkout` để rollback file `convex/ia.ts` và `ProductsPage.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
*   Thay đổi cách thức truy vấn sản phẩm trong database của Convex (đã chạy tốt, giữ nguyên).
*   Thay đổi giao diện UI bộ lọc của trang `/products`.
