# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Hiện nay, khi truy cập trực tiếp vào `/products/giong-nho/` (đường dẫn chứa nhóm thuộc tính mà chưa chọn giá trị nào), trang web sẽ báo lỗi 404 vì hệ thống chưa nhận dạng được đường dẫn này.
*   **Mong muốn:** Khi vào `/products/giong-nho/`, trang web phải hiển thị trang Tất cả sản phẩm có tích hợp sẵn bộ lọc "Giống nho" hoạt động (chưa chọn term nào). Điều này giúp người dùng dễ dàng chia sẻ đường dẫn nhóm thuộc tính hoặc focus trực tiếp vào bộ lọc mong muốn.
*   **Giải pháp:**
    1. Cập nhật frontend (`ProductsPage.tsx`): Cho phép `termSlug` rỗng hoặc không có trong parsing logic.
    2. Cập nhật backend (`convex/ia.ts`): Nhận diện khi URL có 2 segments bắt đầu bằng `/products/` (hoặc `/[typeSlug]/`) và segment thứ hai khớp với slug của một nhóm thuộc tính, trả về context `productTypeAttribute` với các thông tin của term ở dạng optional.

## 2. Elaboration & Self-Explanation
Bộ lọc thuộc tính được tổ chức theo cấu trúc hình cây: Nhóm thuộc tính (Attribute Group) -> Các giá trị thuộc tính (Attribute Terms).

Khi người dùng lọc Merlot, URL là `/products/giong-nho/merlot`. Nhưng nếu người dùng chỉ truy cập `/products/giong-nho`, hệ thống coi segment thứ hai là danh mục sản phẩm (Category). Do `"giong-nho"` không phải là danh mục sản phẩm, hệ thống trả về 404.

Chúng tôi sẽ mở rộng cơ chế phân giải URL Catch-all (2 segments):
- Bước 1: Kiểm tra xem segment thứ hai có phải là Category không. Nếu có, xử lý như bình thường.
- Bước 2: Nếu không phải Category, kiểm tra xem có phải là một Nhóm thuộc tính (`attributeGroups`) hoạt động hay không.
- Nếu đúng, trả về context `productTypeAttribute` với `groupId`, `groupSlug`, `groupName` đầy đủ, còn `termId`, `termSlug`, `termName` sẽ được để trống (undefined).
- Frontend sẽ nhận cấu hình này, parse `selectedAttributes` rỗng cho nhóm thuộc tính đó và hiển thị trang danh sách sản phẩm bình thường.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể:**
    *   *Vào trang Nhóm thuộc tính:* `/products/giong-nho` -> Hiển thị trang Tất cả sản phẩm, bộ lọc Giống nho được kích hoạt (chưa chọn giống nào).
    *   *Vào trang Nhóm thuộc tính kèm loại:* `/ruou-vang/giong-nho` -> Hiển thị rượu vang, bộ lọc Giống nho được kích hoạt.
*   **Phép ẩn dụ:** Giống như bạn đi vào một hiệu sách lớn. Thay vì yêu cầu "Cho tôi cuốn sách của tác giả Nguyễn Nhật Ánh" (lọc giá trị cụ thể), bạn yêu cầu "Hãy dẫn tôi đến khu vực sách của các Tác giả Việt Nam" (lọc nhóm thuộc tính). Nhân viên hiệu sách (Next.js router) sẽ dẫn bạn đến đúng kệ sách đó, nơi bạn có thể thoải mái chọn lựa các tác giả khác nhau.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Tệp kiểm tra:**
    *   [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts): Hàm `resolveProductLandingContext` phân giải URL Catch-all.
    *   [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx): Hàm `selectedAttributes` parsing từ props.
*   **Trạng thái hiện tại:** URL `/products/giong-nho` bị báo 404 vì backend chưa phân giải được nhóm thuộc tính khi slugs có độ dài là 2.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc (Root Cause):**
    1. Trong `convex/ia.ts`, khi `slugs.length === 2`, hệ thống chỉ kiểm tra xem segment thứ hai có khớp với danh mục sản phẩm (`productCategories`) hoặc detail record hay không. Nó hoàn toàn bỏ qua khả năng segment thứ hai là một nhóm thuộc tính (`attributeGroups`).
    2. Cấu trúc schema trả về của `productTypeAttribute` bắt buộc phải có `termId`, `termSlug`, và `termName`.
*   **Độ tin cậy nguyên nhân gốc (Root Cause Confidence):** **High**
    *   *Lý do:* Rõ ràng không có logic phân giải nhóm thuộc tính khi slugs có độ dài là 2 nên trang luôn bị 404.

# IV. Proposal (Đề xuất)

## 1. Convex Backend (`convex/ia.ts`)
*   Cập nhật schema của `productTypeAttribute` trong `returns` của `resolveProductLandingContext`:
    *   Biến `termId`, `termSlug`, `termName` thành dạng `v.optional(...)`.
*   Cập nhật logic `resolveProductLandingContext` khi `slugs.length === 2`:
    *   *Trường hợp `typeSlug === "products"`:* Nếu segment thứ hai khớp với một nhóm thuộc tính hoạt động, trả về context `productTypeAttribute`.
    *   *Trường hợp `productType && productType.active`:* Nếu segment thứ hai khớp với một nhóm thuộc tính được gán cho loại sản phẩm này, trả về context `productTypeAttribute`.

## 2. Client Components (`ProductsPage.tsx`)
*   Cập nhật logic parse `selectedAttributes`:
    *   Nếu `props.attributeFilter` tồn tại nhưng `props.attributeFilter.termSlug` rỗng hoặc undefined, chỉ gán mảng rỗng `[]` cho nhóm thuộc tính đó thay vì crash hoặc gán lỗi.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts)
*   *Vai trò:* Phân giải các segments URL Catch-all.
*   *Thay đổi:* Cập nhật schema trả về và bổ sung logic phân giải nhóm thuộc tính cho 2 segments.

### Sửa: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
*   *Vai trò:* Quản lý state bộ lọc sản phẩm trên client.
*   *Thay đổi:* Thay đổi logic parse bộ lọc ban đầu để hỗ trợ termSlug rỗng an toàn.

### Sửa: [[...slugs]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/[...slugs]/page.tsx)
*   *Vai trò:* Xử lý render và SEO title/metadata.
*   *Thay đổi:* Cập nhật logic tạo title metadata và truyền props `termSlug` an toàn khi `resolvedContext.termSlug` rỗng/undefined.

# VI. Execution Preview (Xem trước thực thi)
1.  **Chỉnh sửa backend:** Thay đổi schema và logic phân giải trong `ia.ts`.
2.  **Chỉnh sửa frontend:** Chỉnh sửa `ProductsPage.tsx` và `[...slugs]/page.tsx` để hỗ trợ termSlug optional.
3.  **Kiểm tra biên dịch:** Chạy `bunx tsc --noEmit` để đảm bảo an toàn kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## Automated Tests / Type Checking
*   Chạy biên dịch tĩnh:
    ```bash
    bunx tsc --noEmit 2>&1 | Select-Object -First 10
    ```

## Manual Verification
*   Truy cập `/products/giong-nho`. Kiểm tra xem trang có hiển thị mượt mà không bị 404, và danh sách sản phẩm hiển thị đầy đủ.
*   Truy cập `/ruou-vang/giong-nho`. Kiểm tra xem trang có hoạt động chính xác.

# VIII. Todo
- [ ] Cập nhật schema và logic trong [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts).
- [ ] Cập nhật logic parse trong [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx).
- [ ] Cập nhật logic render trong [[...slugs]/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/[...slugs]/page.tsx).
- [ ] Chạy biên dịch tĩnh TypeScript để kiểm tra kiểu dữ liệu.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   Đường dẫn `/products/giong-nho` không bị 404, tải trang Tất cả sản phẩm thành công.
*   TypeScript compile thành công 100%.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   *Rủi ro:* Cần bảo đảm `termSlug` optional không gây lỗi crash ở các query Convex tải sản phẩm. Tuy nhiên, Convex query chỉ sử dụng `attributeTermIds` để lọc sản phẩm, mà `attributeTermIds` được tính toán dựa trên `selectedAttributes` (khi term rỗng thì `attributeTermIds` rỗng và không lọc gì cả), nên tuyệt đối an toàn.
*   *Hoàn tác:* Sử dụng `git checkout` để hoàn tác các file.

# XI. Out of Scope (Ngoài phạm vi)
*   Thay đổi cách lưu trữ thuộc tính trong database.
