# Đặc tả thiết kế: Cải tiến logic sinh mã SKU tự động theo danh mục chính và tối ưu hóa số thứ tự

# I. Primer

## 1. TL;DR kiểu Feynman
* **Cách các SaaS lớn xử lý**: Khi sản phẩm có nhiều danh mục (1 chính, nhiều phụ), hệ thống sẽ chỉ lấy danh mục chính làm gốc để sinh tiền tố SKU. Danh mục phụ không được dùng để đặt mã để tránh SKU bị hỗn loạn.
* **Mã viết tắt dễ hiểu**: Danh mục "Vang đỏ" sẽ sinh ra tiền tố "VD", "Bia thủ công" sinh ra "BTC" bằng cách lấy chữ cái đầu của các từ.
* **Số thứ tự riêng cho từng loại**: Thay vì đếm số thứ tự theo tổng tất cả sản phẩm trong toàn hệ thống (khiến chai vang đầu tiên bị nhảy lên số 3, số 5), hệ thống sẽ đếm riêng cho từng loại. Chai vang đỏ đầu tiên sẽ bắt đầu từ số `0001`, chai thứ hai là `0002`. Chai vang trắng đầu tiên cũng sẽ bắt đầu từ `0001` một cách độc lập.
* **Giới hạn 4 chữ số**: Định dạng số thứ tự sẽ gồm 4 chữ số (ví dụ: `0001` đến `9999`) để đáp ứng đúng quy mô tối đa 9.999 sản phẩm của khách hàng.
* **Khóa cứng tính năng nhập tay SKU**: Để tránh admin tự nhập sai định dạng hoặc trùng lặp mã SKU, ô nhập SKU tại trang tạo mới và chỉnh sửa sản phẩm sẽ được **khóa cứng (disabled)**. Mã SKU sẽ hoàn toàn do hệ thống sinh tự động dựa trên thuật toán tối ưu.

## 2. Elaboration & Self-Explanation
Hiện tại, khi admin tạo sản phẩm, trường SKU (Mã gốc SKU / Prefix) được tự động gợi ý qua API `api.productsSmart.generateSmartSku` của Convex. Hàm này thực hiện:
1. Lấy tên danh mục chính được chọn (ví dụ "Vang đỏ"), viết tắt các ký tự đầu thành tiền tố `"VD"`.
2. Truy vấn tổng số lượng sản phẩm của cả hệ thống thông qua bảng thống kê `productStats` (key `"total"`), giả sử tổng là $N$.
3. Gợi ý SKU dạng `${Prefix}-${(N+1).toString().padStart(3, "0")}` (ví dụ: `VD-003`).

Cơ chế này có hai điểm hạn chế lớn:
* **Nhảy số thứ tự**: Nếu hệ thống có 2 sản phẩm khác (ví dụ: 2 chai bia), tổng số sản phẩm $N = 2$. Khi tạo chai vang đỏ đầu tiên, số thứ tự sẽ bị lấy là $N+1 = 3$ (sinh ra `VD-003`). Điều này phi logic vì đây mới là chai vang đỏ đầu tiên, đáng lẽ phải là `VD-0001`.
* **Định dạng 3 chữ số**: Chỉ cho phép chạy từ `001` đến `999`. Với nhu cầu thực tế của cửa hàng (dưới 10.000 sản phẩm), cần định dạng 4 chữ số (`0001` đến `9999`).

**Giải pháp tối ưu từ các hệ thống SaaS lớn (Shopify, Haravan, Sapo):**
* SKU được sinh theo tiền tố của danh mục chính (Primary/Canonical Category) để giữ đúng cấu trúc phân loại. Các danh mục phụ (như "Bán chạy", "Khuyến mãi") chỉ đóng vai trò phân loại phụ trên website storefront, không dùng để sinh SKU.
* Để đếm số thứ tự tăng dần cho từng tiền tố (ví dụ: `VD`), hệ thống sẽ thực hiện truy vấn cơ sở dữ liệu tìm SKU lớn nhất hiện tại có cấu trúc `${Prefix}-XXXX`.
* Trong Convex, để tránh việc quét toàn bộ cơ sở dữ liệu (full table scan) dễ gây lỗi giới hạn đọc (read limits), chúng ta sẽ thực hiện một truy vấn khoảng (range query) sử dụng index `by_sku` trên trường `sku` của bảng `products` từ `${Prefix}-0000` đến `${Prefix}-9999`. Range query này cực kỳ nhanh vì dùng chỉ mục, chỉ lấy các sản phẩm có cùng tiền tố, từ đó tìm ra số thứ tự lớn nhất hiện tại (`maxNum`) và sinh số tiếp theo là `maxNum + 1`.
* **Vô hiệu hóa chỉnh sửa SKU ở Frontend**: Trường nhập SKU tại trang tạo mới và chỉnh sửa sẽ bị khóa cứng (`disabled={true}`) để đảm bảo tính nhất quán của dữ liệu SKU tự sinh, ngăn chặn hoàn toàn các lỗi gõ sai hoặc cố tình nhập sai định dạng của quản trị viên.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Chưa có sản phẩm nào có SKU bắt đầu bằng `VD-`. Khi tạo sản phẩm "Rượu Vang Đỏ F" thuộc danh mục chính "Vang đỏ":
    * Tiền tố sinh ra từ danh mục là `"VD"`.
    * Hệ thống quét các SKU hiện có từ `VD-0000` đến `VD-9999` -> Kết quả trống -> `maxNum = 0`.
    * Gợi ý SKU hiển thị dạng read-only trên form: `VD-0001`.
  * Sau đó, hệ thống đã có 2 chai vang đỏ là `VD-0001` và `VD-0002`, và 1 chai bia là `B-0001`. Khi tạo chai vang đỏ thứ ba:
    * Tiền tố sinh ra từ danh mục là `"VD"`.
    * Hệ thống quét các SKU hiện có từ `VD-0000` đến `VD-9999` -> Tìm thấy `VD-0001` và `VD-0002` -> `maxNum = 2`.
    * Gợi ý SKU hiển thị dạng read-only trên form: `VD-0003`.
* **Ẩn dụ đời thường**: Hãy tưởng tượng một thư viện xếp sách lên kệ. Thay vì cho phép người mượn hoặc thủ kho tự ý viết mã số dán lên gáy sách (dễ gây trùng lặp hoặc gõ sai quy tắc), hệ thống quản lý thư viện sẽ tự động sinh mã số gáy sách theo kệ (ví dụ kệ Toán là `T-0001`, `T-0002`, kệ Văn là `V-0001`) và in trực tiếp ra nhãn dán mà không cho phép bất kỳ ai sửa đổi bằng tay.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Tệp backend**: `convex/productsSmart.ts`
  * Hàm `generateUniqueSmartSku(ctx, name, categoryId, ignoreProductId)` hiện đang lấy `baseCount` từ `productStats` key `"total"`.
  * Hậu tố (suffix) đang được định dạng cứng là `padStart(3, "0")`.
* **Tệp frontend**:
  * Trang tạo sản phẩm: `app/admin/products/create/page.tsx`
    * Trường `<Input>` của SKU đang mở cho người dùng gõ tay (`value={sku}`, `onChange`).
  * Trang sửa sản phẩm: `app/admin/products/[id]/edit/page.tsx`
    * Trường `<Input>` của SKU tương tự đang cho phép người dùng chỉnh sửa.
* **Chỉ mục (Index) hỗ trợ**:
  * Bảng `products` đã có index `by_sku` trên trường `sku`. Định dạng lưu trữ SKU là chuỗi văn bản (string).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Độ tin cậy nguyên nhân gốc**: High
  * **expected**: Hệ thống tự động gợi ý mã SKU có tiền tố viết tắt từ danh mục chính, số thứ tự bắt đầu từ `0001` và tăng dần riêng biệt cho từng tiền tố. Người dùng không cần tự gõ tay và ô nhập SKU được khóa cứng để đảm bảo tính nhất quán.
  * **actual**: Số thứ tự ở hậu tố SKU đang được tính dựa trên tổng số lượng toàn bộ sản phẩm trong hệ thống và pad 3 chữ số. Đồng thời frontend vẫn mở trường nhập SKU cho phép admin tự sửa đổi tay.

---

# IV. Proposal (Đề xuất)

1. **Sửa đổi cơ chế sinh số thứ tự (Suffix)**:
   * Sửa hàm `generateUniqueSmartSku` trong `convex/productsSmart.ts`:
     * Sinh tiền tố `prefix` từ tên danh mục chính (hoặc tên sản phẩm) như cũ.
     * Thực hiện truy vấn khoảng trên index `by_sku` của Convex để lấy các SKU bắt đầu bằng `prefix` đó:
       ```typescript
       const startSku = `${prefix}-0000`;
       const endSku = `${prefix}-9999`;
       const existingProducts = await ctx.db
         .query("products")
         .withIndex("by_sku", (q) => q.gte("sku", startSku).lte("sku", endSku))
         .collect();
       ```
     * Duyệt qua danh sách `existingProducts`, trích xuất số thứ tự từ SKU (cắt bỏ phần tiền tố và dấu `-`), parse sang kiểu số nguyên, tìm ra giá trị lớn nhất `maxNum`.
     * Đặt `baseCount = maxNum + 1`.
     * Thay đổi độ rộng của hậu tố (suffix) từ 3 chữ số thành 4 chữ số: `padStart(4, "0")`.
     * Thực hiện vòng lặp kiểm tra trùng lặp (tối đa 500 lần thử) tương tự logic cũ để đảm bảo tính an toàn.

2. **Khóa trường nhập SKU ở giao diện (Frontend)**:
   * **Trong trang `create/page.tsx`**:
     * Thêm thuộc tính `disabled={true}` vào thẻ `<Input>` của SKU.
     * Sửa placeholder của ô SKU thành `"Mã SKU được hệ thống tự động sinh..."`.
     * Bổ sung dòng chú thích nhỏ bên dưới: `"Mã SKU được sinh tự động dựa trên danh mục chính và số thứ tự độc lập."`
   * **Trong trang `[id]/edit/page.tsx`**:
     * Thêm thuộc tính `disabled={true}` vào thẻ `<Input>` của SKU.
     * Sửa placeholder tương tự để admin biết SKU này đã được chốt và không được phép chỉnh sửa sau khi tạo.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [productsSmart.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productsSmart.ts)
  * Sửa logic tìm số thứ tự lớn nhất trong hàm `generateUniqueSmartSku` bằng range query trên index `by_sku`.
  * Sửa độ dài padding của suffix từ 3 chữ số sang 4 chữ số.
* **Sửa**: [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  * Thêm thuộc tính `disabled` vào input SKU và sửa mô tả hiển thị.
* **Sửa**: [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx)
  * Thêm thuộc tính `disabled` vào input SKU và sửa mô tả hiển thị.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Cập nhật backend [productsSmart.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productsSmart.ts)**:
   * Thay thế logic lấy `baseCount` bằng range query trên index `by_sku`.
   * Cập nhật `padStart(3, "0")` thành `padStart(4, "0")`.
2. **Cập nhật frontend [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)**:
   * Khóa trường SKU bằng `disabled` và cập nhật thông tin hiển thị.
3. **Cập nhật frontend [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx)**:
   * Khóa trường SKU bằng `disabled` và cập nhật thông tin hiển thị.
4. **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit` để đảm bảo không lỗi cú pháp hay kiểu dữ liệu.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm thử tự động (TypeScript Check)
- Chạy lệnh `bunx tsc --noEmit` để kiểm tra tính hợp lệ về kiểu dữ liệu.

### Kiểm thử thủ công (Tester thực hiện ở runtime)
1. **Xác minh không cho phép chỉnh sửa**:
   * Vào trang tạo hoặc trang sửa sản phẩm, kiểm tra xem ô nhập SKU có bị mờ và không cho gõ phím chỉnh sửa (disabled) hay không.
2. **Xác minh chai vang đỏ đầu tiên**:
   * Nhập tên sản phẩm: "Rượu Vang Đỏ F Negroamaro Ý 750ml".
   * Chọn danh mục chính là "Vang đỏ" (chưa có sản phẩm nào thuộc danh mục này trong DB).
   * Kiểm tra xem SKU hiển thị ở ô disabled có phải là `VD-0001` hay không.
3. **Xác minh chai vang đỏ thứ hai**:
   * Tạo sản phẩm thứ nhất với SKU `VD-0001`.
   * Tạo sản phẩm thứ hai cùng danh mục "Vang đỏ", kiểm tra xem SKU tự động hiển thị có phải là `VD-0002` hay không.
4. **Xác minh tính độc lập**:
   * Tạo sản phẩm thuộc danh mục "Vang trắng", kiểm tra xem SKU có bắt đầu độc lập bằng `VT-0001` hay không.

---

# VIII. Todo

- [ ] Tạo file spec đặc tả kỹ thuật và lưu tại `.factory/docs/product_sku_generation_spec.md`. (Đã thực hiện)
- [ ] Cập nhật logic sinh SKU trong hàm `generateUniqueSmartSku` ở [convex/productsSmart.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productsSmart.ts).
- [ ] Khóa trường SKU trên giao diện tạo sản phẩm ở [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx).
- [ ] Khóa trường SKU trên giao diện sửa sản phẩm ở [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx).
- [ ] Chạy kiểm tra tĩnh TypeScript bằng `bunx tsc --noEmit`.
- [ ] Commit thay đổi và phát âm báo hoàn thành `Done, Sir.`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. **Khóa cứng input SKU**: Admin không thể chỉnh sửa giá trị SKU bằng tay trên giao diện.
2. **Sinh SKU theo tiền tố danh mục chính**: Tiền tố được viết tắt tự động từ danh mục chính được chọn (ví dụ: "Vang đỏ" -> "VD").
3. **Đếm số tăng dần độc lập**: Số thứ tự đằng sau SKU phải được đếm riêng theo từng tiền tố danh mục, không tính gộp chung toàn hệ thống.
4. **Định dạng 4 chữ số**: Hậu tố SKU phải được đệm đủ 4 chữ số (ví dụ: `0001` thay vì `001` hay `01`).
5. **Không lỗi hiệu năng**: Tìm kiếm số lớn nhất bằng range query trên chỉ mục `by_sku` để tránh lỗi giới hạn đọc của Convex.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Không có rủi ro lớn do việc sinh mã SKU tự động chỉ là đề xuất ở giao diện tạo sản phẩm (admin vẫn có thể tự gõ tay đè lên).
* **Hoàn tác**: Sử dụng `git checkout` để rollback tệp `convex/productsSmart.ts` nếu xảy ra lỗi logic không mong muốn.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi schema của bảng `products` hay `attributeGroups`.
* Không làm ảnh hưởng đến mã SKU của các sản phẩm cũ đã có trong cơ sở dữ liệu.
