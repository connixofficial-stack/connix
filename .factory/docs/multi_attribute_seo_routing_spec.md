# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Khi bạn chọn nhiều giống nho (ví dụ: Merlot và Pinot Noir), hệ thống hiện tại chỉ đưa 1 giống nho lên URL SEO (`/products/giong-nho/merlot`) và đẩy giống nho thứ hai xuống query parameter dạng tồi tệ (`?attr_giong-nho=pinot-noir`). Điều này vừa không chuyên nghiệp vừa làm mất tính chất SEO URL của multi-select.
*   **Mong muốn:** Khi chọn nhiều giống nho trong cùng một nhóm, URL phải gộp chung chúng lại bằng dấu phẩy đẹp đẽ, ví dụ: `/products/giong-nho/merlot,pinot-noir`.
*   **Giải pháp:**
    1. Cập nhật frontend (`ProductsPage.tsx`): Khi dựng URL, nhóm các thuộc tính theo nhóm. Nếu có nhiều thuộc tính thuộc cùng một nhóm, gộp các slugs của chúng bằng dấu phẩy `,` trên SEO URL chính.
    2. Cập nhật frontend parsing: Khi parse `selectedAttributes` từ `props.attributeFilter.termSlug`, thực hiện split bằng dấu phẩy `,` để khôi phục toàn bộ các slugs đã chọn.
    3. Cập nhật backend (`convex/ia.ts`): Khi phân giải `termSlug` (ở đây có thể là chuỗi chứa dấu phẩy), tách ra và kiểm tra xem có khớp với các terms trong database hay không, tránh lỗi 404.

## 2. Elaboration & Self-Explanation
Hiện nay, cơ chế lọc thuộc tính cho phép người dùng cấu hình kiểu lọc là `multiple` (nhiều lựa chọn). Giao diện ngoài site thực cũng cho phép chọn nhiều lựa chọn thông qua checkbox hoặc custom dropdown select.

Tuy nhiên, hàm `navigateWithFilters` khi dựng URL chỉ lấy thuộc tính đầu tiên (`activeAttrs[0]`) làm primary URL chính, còn tất cả các thuộc tính tiếp theo đều bị ép xuống query parameters dưới dạng `attr_[groupSlug]=[termSlug]`. Điều này dẫn đến sự thiếu nhất quán nghiêm trọng đối với trường hợp chọn nhiều giá trị của **cùng một nhóm thuộc tính**.

Chúng tôi sẽ tái cấu trúc logic dựng URL bằng cách nhóm các active terms theo nhóm thuộc tính trước. 
- Nếu chỉ lọc trên **duy nhất 1 nhóm thuộc tính**, toàn bộ các term slugs được chọn sẽ được nối với nhau bằng dấu phẩy `,` và đặt làm segment thứ ba của SEO URL: `/[baseSlug]/[groupSlug]/[termSlug1,termSlug2]`.
- Nếu lọc trên **nhiều nhóm thuộc tính khác nhau**, nhóm đầu tiên sẽ làm SEO URL chính (nối bằng dấu phẩy), các nhóm khác sẽ được chuyển xuống query parameters.
- Backend Convex sẽ tiếp nhận chuỗi gộp dấu phẩy này, tách ra để tìm kiếm term đầu tiên làm đại diện đại biểu (cho SEO Metadata) và trả về chuỗi gốc chứa dấu phẩy để frontend khôi phục trạng thái bộ lọc.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể:**
    *   *Chọn 1 giống nho:* `/products/giong-nho/pinot-noir`
    *   *Chọn 2 giống nho:* `/products/giong-nho/pinot-noir,tempranillo` (đường dẫn cực kỳ tối ưu cho SEO).
    *   *Chọn 2 giống nho + 1 quốc gia:* `/products/giong-nho/pinot-noir,tempranillo?attr_quoc-gia=phap`
*   **Phép ẩn dụ:** Giống như bạn đi siêu thị mua táo và lê. Thay vì nhân viên thu ngân viết hóa đơn là "Giỏ hàng Táo" rồi dán một mảnh giấy nhớ bổ sung ghi "Có mua Lê" bên ngoài giỏ (dùng query parameter), nhân viên sẽ viết trực tiếp lên nhãn giỏ hàng một cách ngay ngắn: "Giỏ hàng: Táo & Lê" (dùng dấu phẩy ghép trong URL).

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Tệp kiểm tra:**
    *   [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts): Hàm `resolveProductLandingContext` phân giải URL Catch-all.
    *   [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx): Hàm `navigateWithFilters` dựng URL và `selectedAttributes` parsing từ props.
*   **Trạng thái hiện tại:** URL khi chọn nhiều giống nho bị phân mảnh thành một phần trên URL chính và một phần ở query params `?attr_giong-nho=...`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc (Root Cause):**
    1. Trong `ProductsPage.tsx`, hàm `navigateWithFilters` duyệt qua mảng phẳng `activeAttrs` và chỉ coi phần tử chỉ số `0` là primary, còn phần tử chỉ số `1` trở đi bị đẩy xuống query params mà không phân biệt chúng có cùng một nhóm thuộc tính hay không.
    2. Parsing logic của `selectedAttributes` chỉ gán trực tiếp `[props.attributeFilter.termSlug]` mà không split dấu phẩy.
    3. Backend Convex kiểm tra `termSlug` bằng phép so sánh bằng trực tiếp (`t.slug === termSlug`), dẫn tới không nhận diện được chuỗi chứa dấu phẩy `,` và trả về `null` (404).
*   **Độ tin cậy nguyên nhân gốc (Root Cause Confidence):** **High**
    *   *Lý do:* Rõ ràng việc so sánh trực tiếp chuỗi slug trong DB với chuỗi gộp dấu phẩy ở URL sẽ luôn thất bại nếu không split trước.

# IV. Proposal (Đề xuất)

## 1. Convex Backend (`convex/ia.ts`)
*   Trong `resolveProductLandingContext` (ở cả 2 nhánh `typeSlug === "products"` và `productType && productType.active` của `slugs.length === 3`):
    *   Tách `termSlug` bằng dấu phẩy `,` thành mảng `requestedSlugs`.
    *   Tìm term đầu tiên khớp với bất kỳ slug nào trong `requestedSlugs`:
        ```typescript
        const requestedSlugs = termSlug.split(",");
        const term = terms.find((t) => requestedSlugs.includes(t.slug));
        ```
    *   Trả về `termSlug` chính là chuỗi gốc chứa dấu phẩy (`termSlug`) để frontend có thể khôi phục đầy đủ.

## 2. Client Components (`ProductsPage.tsx`)
*   **Cập nhật `selectedAttributes` parsing:**
    ```typescript
    if (props.attributeFilter) {
      filters[props.attributeFilter.groupId] = props.attributeFilter.termSlug.split(',');
    }
    ```
*   **Tái cấu trúc `navigateWithFilters`:**
    *   Nhóm các `activeAttrs` theo nhóm thuộc tính (`groupSlug`).
    *   Xác định nhóm primary (nhóm đầu tiên).
    *   Đường dẫn SEO URL chính sẽ chứa toàn bộ các term slugs của nhóm primary này nối với nhau bằng dấu phẩy `,`:
        ```typescript
        path = `/${baseSlug}/${primaryGroup.slug}/${primaryGroup.termSlugs.join(',')}`;
        ```
    *   Các nhóm thuộc tính khác (nếu có) sẽ được chuyển xuống query parameters.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts)
*   *Vai trò:* Phân giải các segments URL Catch-all.
*   *Thay đổi:* Thay đổi logic so sánh `termSlug` thành so sánh tập hợp `requestedSlugs.includes(t.slug)` khi có dấu phẩy.

### Sửa: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
*   *Vai trò:* Quản lý state bộ lọc sản phẩm trên client.
*   *Thay đổi:* Thay đổi logic parse bộ lọc ban đầu và logic dựng URL trong `navigateWithFilters` hỗ trợ nối dấu phẩy.

# VI. Execution Preview (Xem trước thực thi)
1.  **Chỉnh sửa backend:** Thay đổi cách phân giải `termSlug` trong `ia.ts`.
2.  **Chỉnh sửa frontend:** Sửa đổi cơ chế parse filters và dựng URL nối dấu phẩy trong `ProductsPage.tsx`.
3.  **Kiểm tra biên dịch:** Chạy `bunx tsc --noEmit` để đảm bảo an toàn kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## Automated Tests / Type Checking
*   Chạy biên dịch tĩnh:
    ```bash
    bunx tsc --noEmit 2>&1 | Select-Object -First 10
    ```

## Manual Verification
*   Truy cập `/products`, chọn "Giống nho" -> "Pinot Noir". URL phải là `/products/giong-nho/pinot-noir`.
*   Chọn thêm "Tempranillo". URL phải tự động thay đổi thành `/products/giong-nho/pinot-noir,tempranillo`.
*   Tải lại trang (F5) tại `/products/giong-nho/pinot-noir,tempranillo`. Kiểm tra xem cả hai giống nho vẫn hiển thị trạng thái được chọn trên thanh bộ lọc và danh sách sản phẩm hiển thị chính xác.

# VIII. Todo
- [ ] Cập nhật logic phân giải dấu phẩy trong [ia.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/ia.ts).
- [ ] Cập nhật parsing logic và dựng URL trong [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx).
- [ ] Chạy biên dịch tĩnh TypeScript để kiểm tra kiểu dữ liệu.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   Khi chọn nhiều giá trị thuộc tính trong cùng một nhóm, URL có dạng `/[baseSlug]/[groupSlug]/[term1],[term2]`.
*   F5 refresh trang không làm mất bộ lọc và hiển thị chính xác trạng thái checkbox/select multiple.
*   TypeScript compile thành công 100%.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   *Rủi ro:* Cần đảm bảo hàm `.split(",")` không bị crash nếu `termSlug` rỗng hoặc không có dấu phẩy. Tuy nhiên, JavaScript `.split` luôn trả về một mảng có ít nhất 1 phần tử kể cả khi không có ký tự phân tách nên tuyệt đối an toàn.
*   *Hoàn tác:* Sử dụng `git checkout` để hoàn tác các file.

# XI. Out of Scope (Ngoài phạm vi)
*   Thay đổi cơ chế lưu trữ thuộc tính trong database.
