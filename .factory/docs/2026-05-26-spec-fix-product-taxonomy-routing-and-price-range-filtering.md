# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề 1:** Khi bật "Bật hệ thống Phân loại & Thuộc tính", ở trang danh sách sản phẩm `/products` chung, nếu người dùng click vào một danh mục (ví dụ "Vang đỏ") thì hệ thống luôn trỏ tới URL cũ `/products?category=vang-do`. Thực tế, nếu danh mục đó thuộc một phân mục / nhóm sản phẩm (Product Type) cụ thể (ví dụ "Rượu vang & sâm panh" - `ruou-vang-sam-panh`), nó phải điều hướng tới URL đẹp tương ứng là `/ruou-vang-sam-panh/vang-do`.
* **Vấn đề 2:** Khi truy cập các route khoảng giá đẹp của một phân mục cụ thể (ví dụ `/ruou-sakesojuumeshu/duoi-500k`), hệ thống lại hiển thị sản phẩm của cả các phân mục khác (như Rượu mạnh, Phụ kiện) có giá dưới 500k. Điều này là do ở Frontend, khi có bộ lọc giá hoạt động, biến lọc `queryProductTypeId` bị chuyển thành `undefined`, khiến Convex query backend không lọc theo phân mục.
* **Cách giải quyết:**
  * **Giải pháp 1:** Ở Frontend, tải danh sách mapping giữa Category và Product Type (`listAssignedTypesForCategories`). Khi điều hướng filter, kiểm tra xem category được chọn có thuộc phân mục nào không. Nếu có, tự động dùng slug phân mục đó làm `baseSlug` để dựng URL đẹp (`/ruou-vang-sam-panh/vang-do`). Nếu không, giữ nguyên URL fallback `/products?category=vang-do`.
  * **Giải pháp 2:** Sửa Frontend để luôn truyền `props.productTypeId` vào `queryProductTypeId` bất kể có bộ lọc nào (giá, category, attribute) đang hoạt động, đảm bảo query Convex backend lọc chính xác sản phẩm thuộc phân mục hiện tại.

## 2. Elaboration & Self-Explanation
Trong hệ thống thương mại điện tử hiện tại, khi toggle "Bật hệ thống Phân loại & Thuộc tính" được kích hoạt, các đường dẫn URL đẹp chuẩn SEO được xây dựng dựa trên sự kết hợp giữa **Phân mục / Loại sản phẩm (Product Type)** làm gốc và các bộ lọc phụ (Category, Price Range, Attributes).

Ở vấn đề thứ nhất, khi người dùng đang duyệt `/products` (trang chung không thuộc phân mục nào), menu Sidebar hiển thị tất cả các danh mục. Khi họ click chọn "Vang đỏ", do trang hiện tại không có `productType`, logic dựng URL ở client mặc định fallback về đường dẫn dạng query param `/products?category=vang-do`. Tuy nhiên, "Vang đỏ" là danh mục đã được admin gán cụ thể cho phân mục "Rượu vang & sâm panh" (`ruou-vang-sam-panh`). Để tối ưu SEO và trải nghiệm người dùng, hệ thống phải tự động nhận diện mối quan hệ này để trỏ sang `/ruou-vang-sam-panh/vang-do`. Chúng ta sẽ giải quyết bằng cách tải mapping `productCategoryTypes` ở client và dùng phân mục gán với danh mục để tính toán `effectiveProductTypeSlug` nhằm dựng URL đẹp.

Ở vấn đề thứ hai, khi truy cập `/ruou-sakesojuumeshu/duoi-500k`, trang catch-all sẽ render component `<ProductsPage productTypeId="sake_id" priceRangeFilter={...} />`. Tuy nhiên, trong component `ProductsPage`, logic gán `queryProductTypeId` được viết:
`const hasConcreteFilter = activeCategory || attributeFilter || minPrice || maxPrice;`
`const queryProductTypeId = hasConcreteFilter ? undefined : props.productTypeId;`
Đoạn code này triệt tiêu `productTypeId` khi có bất kỳ filter cụ thể nào hoạt động. Khi `productTypeId` trở thành `undefined`, Convex backend sẽ không nhận được constraint loại sản phẩm, dẫn đến việc lấy sản phẩm của mọi phân mục có giá dưới 500k. Chúng ta sẽ loại bỏ hoàn toàn logic triệt tiêu này, giữ nguyên `queryProductTypeId = props.productTypeId` để Convex thực hiện lọc đúng phân mục bằng index `by_type_status_effectivePrice`.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:**
  * Khách hàng click vào danh mục "Vang đỏ" (được gán với loại rượu vang): Hệ thống tự động chuyển hướng sang `/ruou-vang-sam-panh/vang-do` thay vì `/products?category=vang-do`.
  * Khách hàng click vào danh mục "Bao bì hộp quà rượu" (danh mục chung không thuộc phân mục cụ thể nào): Hệ thống giữ nguyên `/products?category=bao-bi-hop-qua-ruou`.
  * Truy cập `/ruou-sakesojuumeshu/duoi-500k`: Trang chỉ hiển thị các chai rượu Sake/Soju có giá dưới 500k. Các chai rượu mạnh (như Cognac, Chivas) có giá dưới 500k sẽ không được xuất hiện ở đây.
* **Hình ảnh ẩn dụ:**
  * **Vấn đề 1:** Khách hàng đứng ở sảnh chính siêu thị và nói "Tôi muốn tìm Vang đỏ". Người hướng dẫn viên thông minh (Frontend) biết rõ vang đỏ nằm ở khu chuyên biệt "Rượu vang & Sâm panh", nên thay vì chỉ khách nhìn xung quanh sảnh chính, người hướng dẫn đưa khách trực tiếp tới quầy "Rượu vang & Sâm panh > Vang đỏ".
  * **Vấn đề 2:** Khách hàng đi vào phòng trưng bày "Rượu Sake & Soju" và yêu cầu "Cho tôi xem các chai dưới 500k". Người bán hàng nhầm lẫn (Frontend triệt tiêu loại sản phẩm) lại đi gom tất cả các chai bia, chai rượu mạnh giá rẻ từ phòng khác mang vào phòng Sake để giới thiệu cho khách. Điều đúng đắn là chỉ giới thiệu Sake/Soju dưới 500k ngay tại phòng đó.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Tệp `app/(site)/_components/products/ProductsPage.tsx`:**
  * Có `categories` được load qua query `api.productCategories.listActive`.
  * Có `enableProductTypes` là toggle kiểm tra bật hệ phân loại.
  * Logic điều hướng bộ lọc `navigateWithFilters` xử lý việc chuyển hướng URL.
  * Hiện tại chưa có mapping giữa categories và product types ở client nên không biết category nào thuộc product type nào khi đang ở trang `/products`.
  * Biến `queryProductTypeId` đang bị triệt tiêu bằng `undefined` khi có filter (`minPrice`, `maxPrice`, v.v.), làm hỏng logic lọc của Convex query.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc 1 (Điều hướng sai):**
  * Trong `navigateWithFilters`, việc dựng `baseSlug` chỉ dựa trên `productType` hiện tại của trang (`productType ? productType.slug : 'products'`). Nếu đang ở trang `/products` chung, `productType` là `undefined`, nên `baseSlug` luôn là `'products'`, dẫn đến URL param `/products?category=vang-do`.
  * **Giả thuyết đối chứng:** Nếu lấy mapping category - product type từ DB, xác định được category được gán với phân mục nào, ta có thể dùng slug của phân mục đó làm `baseSlug`, từ đó dựng thành công URL `/ruou-vang-sam-panh/vang-do` chuẩn SEO.
* **Nguyên nhân gốc 2 (Lọc sai khoảng giá phân mục):**
  * Logic triệt tiêu `queryProductTypeId` ở Frontend:
    `const hasConcreteFilter = Boolean(activeCategory) || attributeTermIds.length > 0 || minPrice !== undefined || maxPrice !== undefined;`
    `const queryProductTypeId = hasConcreteFilter ? undefined : props.productTypeId;`
    Khiến Convex backend nhận `productTypeId = undefined` when lọc giá, mất đi constraint phân mục.
  * **Giả thuyết đối chứng:** Nếu gỡ bỏ `hasConcreteFilter` và gán thẳng `queryProductTypeId = props.productTypeId`, Convex backend sẽ nhận được đúng `productTypeId` và lọc chính xác bằng index `by_type_status_effectivePrice`.

---

# IV. Proposal (Đề xuất)

* **Giải pháp thực hiện:**
  1. **Tải Mapping Category - Product Type ở Frontend:**
     * Thêm query `useQuery(api.productTypes.listAssignedTypesForCategories, ...)` trong `ProductsContent` để lấy danh sách product types được gán cho các categories active.
     * Tạo một `categoryToTypeMap` (Map từ `categoryId` -> `{ slug: string, name: string }`) để tra cứu O(1).
  2. **Cập nhật logic `navigateWithFilters`:**
     * Xác định `assignedType = targetCategoryId ? categoryToTypeMap.get(targetCategoryId) : null`.
     * Xác định `effectiveProductTypeSlug = assignedType ? assignedType.slug : (productType ? productType.slug : null)`.
     * Nếu có `effectiveProductTypeSlug`, dựng URL đẹp theo slug đó (ví dụ `/${effectiveProductTypeSlug}/${category.slug}`).
     * Nếu không có, fallback về `/products?category=slug`.
  3. **Khắc phục triệt tiêu `productTypeId`:**
     * Đổi `const queryProductTypeId = hasConcreteFilter ? undefined : props.productTypeId;` thành `const queryProductTypeId = props.productTypeId;` để giữ nguyên phân mục lọc.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Public Pages
* `Sửa:` [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  * Thêm query `api.productTypes.listAssignedTypesForCategories` để tải mappings.
  * Sửa logic `navigateWithFilters` để tự động chọn `effectiveProductTypeSlug` dựa vào category được chọn.
  * Loại bỏ logic triệt tiêu `queryProductTypeId` khi có bộ lọc hoạt động.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1 (Đọc & Phân tích):** Rà soát kỹ lưỡng file `ProductsPage.tsx` tại vị trí khai báo queries và logic điều hướng để chuẩn bị sửa đổi.
2. **Bước 2 (Chèn query mapping):** Viết logic useQuery load mapping category - product type.
3. **Bước 3 (Cập nhật logic tạo URL):** Cập nhật `navigateWithFilters` để sử dụng `effectiveProductTypeSlug`.
4. **Bước 4 (Cập nhật logic filter backend):** Sửa đổi `queryProductTypeId = props.productTypeId`.
5. **Bước 5 (Kiểm tra TypeScript & Clean code):** Chạy `bunx tsc --noEmit` để đảm bảo code biên dịch hoàn hảo.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để xác nhận không có lỗi kiểu dữ liệu TypeScript.

### Manual Verification
* **Test Case 1 (Điều hướng từ trang chung):**
  * Truy cập `/products`.
  * Click vào danh mục "Vang đỏ" (đã được gán cho Rượu vang & Sâm panh).
  * Kỳ vọng: URL chuyển đổi thành `/ruou-vang-sam-panh/vang-do` và chỉ hiển thị rượu vang đỏ.
  * Click vào danh mục "Phụ kiện" (chưa được gán cho phân mục nào).
  * Kỳ vọng: URL chuyển thành `/products?category=phu-kien` và chỉ hiển thị phụ kiện.
* **Test Case 2 (Lọc khoảng giá phân mục):**
  * Truy cập `/ruou-sakesojuumeshu/duoi-500k`.
  * Kỳ vọng: Chỉ hiển thị rượu sake/soju dưới 500k. Tuyệt đối không hiển thị rượu vang đỏ hay rượu mạnh dưới 500k.
  * Truy cập `/ruou-manh/duoi-500k`.
  * Kỳ vọng: Chỉ hiển thị rượu mạnh dưới 500k.

---

# VIII. Todo
- [ ] Khai báo và sử dụng query `api.productTypes.listAssignedTypesForCategories` trong component `ProductsContent` của `ProductsPage.tsx`.
- [ ] Tạo `categoryToTypeMap` sử dụng `useMemo` từ kết quả query.
- [ ] Sửa đổi logic `navigateWithFilters` trong `ProductsPage.tsx` để chọn `effectiveProductTypeSlug` dựa vào category được chọn.
- [ ] Sửa đổi `queryProductTypeId` để luôn giữ nguyên `props.productTypeId`.
- [ ] Chạy `bunx tsc --noEmit` kiểm tra lỗi compile.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Tiêu chí 1:** Khi ở `/products` và bật hệ phân loại, click vào danh mục có gán phân mục thì điều hướng tới URL đẹp dạng `/{productTypeSlug}/{categorySlug}`. Click vào danh mục không gán phân mục thì điều hướng tới `/products?category={categorySlug}`.
* **Tiêu chí 2:** Khi truy cập URL khoảng giá phân mục cụ thể như `/ruou-sakesojuumeshu/duoi-500k`, chỉ hiển thị sản phẩm của đúng phân mục đó có mức giá tương ứng, không bị trộn sản phẩm phân mục khác vào.
* **Tiêu chí 3:** Biên dịch TypeScript thành công không có lỗi.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Khi danh sách categories quá lớn, query `listAssignedTypesForCategories` có thể làm tăng nhẹ số lượng DB reads ở Frontend.
* **Giải pháp phòng ngừa:** Query này đã được Convex tối ưu hóa bằng index, và chỉ chạy một lần khi component load nên tác động là không đáng kể. Nếu có vấn đề, chỉ cần revert file `ProductsPage.tsx` về trạng thái ban đầu bằng Git.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc dữ liệu hoặc schema của Convex backend.
* Thay đổi logic hiển thị admin panel.

---

# XII. Open Questions (Câu hỏi mở)
* (Không có câu hỏi mở nào).
