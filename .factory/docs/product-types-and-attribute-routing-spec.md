# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề:** Khi bật "Bật hệ thống Phân loại & Thuộc tính", admin cần quản lý Loại sản phẩm và Thuộc tính lọc tối ưu hơn (ẩn trường "Thứ tự", thêm Icon Picker, chọn màu nhanh, cấu hình các nấc giá bán). Về mặt SEO, URL loại sản phẩm phải chuyển sang `/{loại sản phẩm slug}`, URL danh mục thành `/{loại sản phẩm slug}/{danh mục slug}` và URL nấc giá thành `/{loại sản phẩm slug}/duoi-500k`, còn URL lọc thuộc tính là `/{loại sản phẩm slug}/{nhóm thuộc tính slug}/{giá trị thuộc tính slug}`. Chi tiết sản phẩm vẫn giữ nguyên URL cũ.
* **ĐIỀU KIỆN TIÊN QUYẾT (FEATURE TOGGLE BẢO VỆ):** Mọi sự thay đổi về URL/Routing động và UI hiển thị phía Client chỉ được kích hoạt **KHI VÀ CHỈ KHI** toggle "Bật hệ thống Phân loại & Thuộc tính" (`enableProductTypes === true`) được bật. Khi tắt, website tự động phục hồi cấu trúc URL danh mục/sản phẩm truyền thống an toàn 100%.
* **Giải pháp thiết kế chuẩn hóa (KISS & Anti-Conflict):**
  * **Kế hoạch di cư Route:** Thay thế hoàn toàn route cũ `app/(site)/[categorySlug]` bằng một Route Catch-all duy nhất `app/(site)/[...slugs]/page.tsx` để tránh xung đột Next.js ở runtime/buildtime.
  * **Nguồn Truth Loại sản phẩm:** `products.productTypeId` là nguồn truth duy nhất xác định sản phẩm thuộc loại nào; pivot `productCategoryTypes` chỉ dùng để hiển thị và xác thực danh mục thuộc loại sản phẩm.
  * **Chống trùng slug (Slug Collision):** Bổ sung validation kiểm tra trùng slug giữa Loại sản phẩm, Danh mục, Nhóm/Giá trị thuộc tính và Nấc giá khi CRUD ở Admin.
  * **Giá hiệu lực (Effective Price):** Thêm trường `effectivePrice` vào bảng `products` (tự động tính từ `salePrice ?? price` hoặc min variant price) và thêm index `by_type_status_effectivePrice` để lọc khoảng giá cực nhanh và chuẩn xác.
  * **URL Lọc thuộc tính (Multi-Filter):** URL SEO đẹp chỉ dành cho 1 filter chính làm canonical. Nếu người dùng chọn lọc thêm thuộc tính phụ, các thuộc tính phụ đó sẽ tự động đính kèm dưới dạng query params (ví dụ: `/ruou-manh/xuat-xu/phap?attr_nong-do=40`).

## 2. Elaboration & Self-Explanation
Để loại bỏ hoàn toàn rủi ro xung đột route động của Next.js (che mờ hoặc lỗi build/runtime), chúng ta sẽ thực hiện một đợt di cư sạch sẽ: xóa thư mục route `app/(site)/[categorySlug]` (bao gồm cả `[categorySlug]/page.tsx` và `[categorySlug]/[recordSlug]/page.tsx`) và gộp toàn bộ logic xử lý URL vào route catch-all duy nhất `app/(site)/[...slugs]/page.tsx`.

Khi người dùng truy cập một link bất kỳ, mảng `slugs` (1 đến 3 phần tử) sẽ được truyền vào Next.js page.
Tại đây, Convex resolver hợp nhất `api.ia.resolveProductLandingContext` sẽ thực hiện phân tích tuần tự cực kỳ chặt chẽ:
1. **Kiểm tra toggle:** Nếu `enableProductTypes === false`, resolver lập tức bỏ qua toàn bộ logic phân loại và chuyển sang giải quyết `slugs` theo cơ chế Category/Detail truyền thống.
2. **Nếu toggle bật (`enableProductTypes === true`):**
   * **Mảng 1 phần tử `[typeSlug]`:** Kiểm tra xem `typeSlug` có khớp với Loại sản phẩm nào không. Nếu có, trả về ngữ cảnh Loại sản phẩm. Nếu không, fallback về post/product/service category truyền thống.
   * **Mảng 2 phần tử `[typeSlug, subSlug]`:**
     * Tra cứu Loại sản phẩm `typeSlug`.
     * Nếu tìm thấy:
       * Kiểm tra xem `subSlug` có phải là Danh mục sản phẩm được gán dưới Loại sản phẩm đó không (thông qua bảng `productCategoryTypes`). Nếu phải, trả về ngữ cảnh Loại + Danh mục.
       * Kiểm tra xem `subSlug` có khớp với slug của Nấc giá nào thuộc Loại sản phẩm đó không (trong mảng `priceRanges`). Nếu khớp, trả về ngữ cảnh Loại + Nấc giá.
       * Nếu không phải cả hai, fallback kiểm tra xem có phải là trang Chi tiết sản phẩm của Category `typeSlug` và sản phẩm `subSlug` không (giữ nguyên URL detail cũ).
   * **Mảng 3 phần tử `[typeSlug, groupSlug, termSlug]`:** Xác thực Loại sản phẩm `typeSlug`, Nhóm thuộc tính `groupSlug` và Giá trị thuộc tính `termSlug`. Nếu đúng, trả về ngữ cảnh Loại + Thuộc tính lọc.
3. **Redirect & Canonical:** Cấu hình thẻ `<link rel="canonical">` trỏ về đúng URL đẹp tương ứng, và cấu hình tự động redirect 301 từ các URL cũ (như `/type/ruou-vang`) sang URL mới (`/ruou-vang`) để tránh duplicate SEO.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể về Phân giải & Xử lý URL:**
  * Truy cập `/ruou-vang` -> `slugs = ["ruou-vang"]`. resolver nhận diện là Loại sản phẩm. Hiển thị trang Loại sản phẩm rượu vang.
  * Truy cập `/ruou-vang/vang-do` -> `slugs = ["ruou-vang", "vang-do"]`. resolver xác nhận danh mục `vang-do` thuộc loại `ruou-vang`. Hiển thị trang Rượu vang đỏ.
  * Truy cập `/ruou-vang/duoi-500k` -> `slugs = ["ruou-vang", "duoi-500k"]`. resolver xác nhận `duoi-500k` là nấc giá của `ruou-vang`. Hiển thị sản phẩm rượu vang có `effectivePrice <= 500000`.
  * Truy cập `/ruou-vang/ruou-vang-chateau-x` -> `slugs = ["ruou-vang", "ruou-vang-chateau-x"]`. resolver xác định `ruou-vang-chateau-x` không phải danh mục hay nấc giá của loại `ruou-vang`, do đó fallback về trang Chi tiết sản phẩm Rượu Vang Chateau X.
  * Truy cập `/ruou-vang/xuat-xu/phap?attr_nong-do=40` -> `slugs = ["ruou-vang", "xuat-xu", "phap"]`. resolver xác định thuộc tính lọc Xuất xứ Pháp, kèm theo query lọc phụ nồng độ 40.
* **Hình ảnh ẩn dụ:** Hệ thống routing giống như một nhân viên lễ tân thông minh tại sảnh siêu thị. Khi khách hàng nói "Rượu vang, vang đỏ" hoặc "Rượu vang, dưới 500k", lễ tân sẽ dẫn họ ngay đến đúng quầy. Nhưng nếu khách nói "Rượu vang, Rượu Vang Chateau X" (không phải tên kệ hàng hay khoảng giá, mà là tên chai rượu cụ thể), lễ tân biết ngay đây là chai rượu cần lấy và đưa trực tiếp chai rượu đó cho khách hàng. Mọi thứ được xử lý tập trung bởi một người duy nhất, không lo bị chồng chéo thông tin.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Hiện trạng cấu trúc:**
  * Next.js route hiện tại có `app/(site)/[categorySlug]/page.tsx` và `app/(site)/[categorySlug]/[recordSlug]/page.tsx`. Việc gộp toàn bộ vào `app/(site)/[...slugs]/page.tsx` là giải pháp sạch sẽ nhất để ngăn chặn rủi ro build-time shadow route.
  * Schema Convex của `products` có trường `price` và `salePrice`, nhưng chưa có trường `effectivePrice` tính sẵn. Cần bổ sung trường này để tối ưu hóa hiệu năng truy vấn khoảng giá của Convex DB.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Rủi ro lớn đã xác định & Giải pháp đối chứng:**
  * **Routing Collision:** Chạy song song route dynamic và catch-all sẽ fail ở Next.js. Giải pháp đối chứng: Xóa route dynamic cũ, gộp 100% vào Catch-all Route duy nhất.
  * **Price Range Semantics:** Quét JS để lọc giá theo `salePrice ?? price` sẽ gây read amplification và quá tải Convex. Giải pháp đối chứng: Lưu trữ trường tính sẵn `effectivePrice` vào database và tạo index `by_type_status_effectivePrice`.
  * **Slug Collision:** Trùng lặp slug làm hỏng tính đúng đắn của resolver. Giải pháp đối chứng: Bổ sung validation unique slug nghiêm ngặt ở Admin.

---

# IV. Proposal (Đề xuất)

* **Giải pháp cụ thể:**
  1. **Admin UX/UI:**
     * Ẩn ô nhập "Thứ tự" trên form. Tự động tính toán order ở backend.
     * Thêm Icon Picker và Swatch chọn màu nhanh vào form Attribute Groups.
     * Thêm giao diện CRUD Nấc giá (Price Ranges) dạng Array (Tên, Slug, minPrice, maxPrice) và Gán danh mục sản phẩm vào form Edit Loại sản phẩm.
     * **Slug Validator:** Validate slug Loại sản phẩm không trùng danh mục/ reserved routes. Validate slug Nấc giá không trùng với slug danh mục được gán trong loại đó.
  2. **DB Schema & Relations:**
     * Thêm bảng pivot `productCategoryTypes` vào `convex/schema.ts` với đầy đủ indexes.
     * Thêm cột `priceRanges` vào bảng `productTypes` trong `convex/schema.ts`.
     * Thêm cột `effectivePrice` vào bảng `products` trong `convex/schema.ts`.
     * Thêm index `by_type_status_effectivePrice` (`["productTypeId", "status", "effectivePrice"]`) vào bảng `products`.
     * **Effective Price Auto-calculation:** Mỗi khi tạo/cập nhật sản phẩm hoặc variant, backend Convex mutation tự động tính `effectivePrice = min(variant.salePrice ?? variant.price)` hoặc `salePrice ?? price` và cập nhật vào record.
  3. **SEO Catch-all Routing:**
     * Tạo file route catch-all `app/(site)/[...slugs]/page.tsx` và xóa bỏ thư mục route cũ `app/(site)/[categorySlug]`.
     * Viết query `api.ia.resolveProductLandingContext` trong `convex/ia.ts` để phân giải mảng slugs.
     * Hỗ trợ generateMetadata đầy đủ trên Catch-all Route để tối ưu SEO thẻ canonical, title, description.
     * Cập nhật event click lọc trong `ProductsPage.tsx` để điều hướng URL SEO đẹp cho filter chính, các filter phụ giữ dưới dạng query params.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Admin Pages
* `Sửa:` [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/create/page.tsx) - Ẩn input order; Thêm Icon Picker & Swatch màu.
* `Sửa:` [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/[id]/edit/page.tsx) - Ẩn input order; Thêm Icon Picker & Swatch màu.
* `Sửa:` [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/create/page.tsx) - Ẩn input order.
* `Sửa:` [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/[id]/edit/page.tsx) - Ẩn input order; Thêm CRUD Price Ranges (Nấc giá), Chọn gán danh mục sản phẩm, và Slug unique validator.
* `Thêm:` `app/admin/attribute-groups/_lib/iconRegistry.ts` - Đăng ký 200 icon Lucide thông dụng.

### Server / Convex Backend
* `Sửa:` [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/schema.ts) - Thêm bảng `productCategoryTypes`, cột `priceRanges` vào `productTypes`, cột `effectivePrice` vào `products`, và các indexes liên quan.
* `Sửa:` [products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/products.ts) - Tự động tính toán `effectivePrice` khi insert/update; Hỗ trợ các tham số `productTypeId`, `minPrice`, `maxPrice` trong public list queries.
* `Sửa:` [productTypes.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productTypes.ts) - Cập nhật mutations lưu `priceRanges`, quản lý pivot `productCategoryTypes` theo toggle `enableMultipleCategories` (1-N hoặc N-N); Bổ sung query `getBySlug`.
* `Sửa:` [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts) - Bổ sung query hợp nhất `resolveProductLandingContext`.

### Public Client Route
* `Xóa:` `app/(site)/[categorySlug]/page.tsx` và `app/(site)/[categorySlug]/[recordSlug]/page.tsx` (Di cư an toàn).
* `Thêm:` `app/(site)/[...slugs]/page.tsx` - Route Catch-all duy nhất xử lý toàn bộ SEO dynamic URLs.
* `Sửa:` [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/[categorySlug]/_components/ProductsPage.tsx) - Tích hợp bộ lọc nấc giá; Cập nhật logic điều hướng URL SEO đẹp cho filter chính.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1 (Backend):** Cập nhật `schema.ts`, triển khai `effectivePrice` calculation trong `products.ts`, thêm `resolveProductLandingContext` vào `ia.ts`. Chạy backfill data nếu cần thiết (không cần vì ta sẽ tính toán realtime khi record thay đổi hoặc dùng script nhỏ).
2. **Bước 2 (Admin UI):** Tạo `iconRegistry.ts`, tích hợp Icon & Color Picker, CRUD nấc giá & gán danh mục sản phẩm vào trang edit/create của admin.
3. **Bước 3 (Public Route Migration):** Xóa folder `app/(site)/[categorySlug]`, tạo file Catch-all route `[...slugs]/page.tsx`.
4. **Bước 4 (Client UI Update):** Cập nhật `ProductsPage.tsx` để hỗ trợ nấc giá, SEO Filter routing.
5. **Bước 5 (TypeScript Validation):** Chạy `bunx tsc --noEmit` để đảm bảo compile hoàn hảo.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` kiểm tra kiểu dữ liệu TypeScript.
* Chạy **Test Matrix** trên môi trường local cho các trường hợp:
  * `enableProductTypes` On/Off.
  * Dynamic URLs 1, 2, 3 levels (loại, danh mục con, nấc giá, thuộc tính lọc, chi tiết sản phẩm).
  * Kiểm tra xem các trang tĩnh như `/about`, `/contact` có bị catch-all route chiếm quyền không (Xác nhận: Không bị chiếm quyền).

---

# VIII. Todo
- [ ] Bổ sung bảng `productCategoryTypes` và trường `priceRanges` vào `productTypes` trong `convex/schema.ts`.
- [ ] Bổ sung trường `effectivePrice` và index `by_type_status_effectivePrice` vào `products` trong `convex/schema.ts`.
- [ ] Bổ sung query `getBySlug` vào `convex/productTypes.ts`.
- [ ] Thêm query `resolveProductLandingContext` vào `convex/ia.ts`.
- [ ] Cập nhật `listPublishedPaginated`, `listPublishedWithOffset` và `countPublished` trong `convex/products.ts` để lọc theo `productTypeId`, `minPrice`, `maxPrice`.
- [ ] Cập nhật logic auto-calculate `effectivePrice` khi insert/update/patch sản phẩm hoặc variant trong `convex/products.ts` và `convex/productVariants.ts`.
- [ ] Tạo file registry `app/admin/attribute-groups/_lib/iconRegistry.ts`.
- [ ] Sửa trang `app/admin/attribute-groups/create/page.tsx` và `edit/page.tsx`.
- [ ] Sửa trang `app/admin/product-types/create/page.tsx` và `edit/page.tsx` (thêm CRUD Price Ranges và gán Danh mục).
- [ ] Xóa folder `app/(site)/[categorySlug]`.
- [ ] Tạo file route catch-all `app/(site)/[...slugs]/page.tsx` tích hợp generateMetadata.
- [ ] Cập nhật component `app/(site)/[categorySlug]/_components/ProductsPage.tsx`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Tiêu chí 1 (Admin UX):** Ẩn hoàn toàn input order; Form Edit của Loại sản phẩm cho phép CRUD các nấc giá và gán danh mục thành công.
* **Tiêu chí 2 (Mối quan hệ DB):**
  * Khi `enableMultipleCategories` bật: gán danh mục cho Loại sản phẩm A sẽ tự động xóa liên kết của danh mục đó với Loại sản phẩm cũ (nếu có).
  * Khi tắt: Cho phép danh mục thuộc nhiều Loại sản phẩm.
* **Tiêu chí 3 (SEO Link & Filter):** Các đường dẫn `/ruou-vang-sam-panh`, `/ruou-vang-sam-panh/vang-do`, `/ruou-vang-sam-panh/duoi-500k`, `/ruou-manh/xuat-xu/phap` hoạt động chính xác, render đúng sản phẩm và tối ưu SEO.
* **Tiêu chí 4 (Feature Toggle Bảo vệ):** Khi **TẮT** toggle "Bật hệ thống Phân loại & Thuộc tính" -> Website tự động phục hồi cấu trúc dynamic URL category và sản phẩm truyền thống 100% không có lỗi.
* **Tiêu chí 5 (Compile):** `bunx tsc --noEmit` compile thành công không có lỗi.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Xung đột URL với các static routes.
* **Giải pháp phòng ngừa:** Next.js ưu tiên static routes cao hơn nên các trang `/about`, `/contact` luôn được bảo vệ an toàn. Mọi logic phân loại được toggle bảo vệ tuyệt đối.

---

# XI. Out of Scope (Ngoài phạm vi)
* Tích hợp lọc SEO nâng cao cho các trang không thuộc sản phẩm (ví dụ bài viết, dịch vụ).

---

# XII. Open Questions (Câu hỏi mở)
* (Không có câu hỏi mở nào).
