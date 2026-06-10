# Spec: One Product Type Per Category & Unified Product Taxonomy

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**:
  * Hiện tại, một danh mục sản phẩm (Category) có thể chọn gán nhiều Loại sản phẩm (Product Type) qua giao diện checkbox, dẫn đến việc không nhất quán thuộc tính bộ lọc của sản phẩm.
  * Ngoài ra, khi gán nhiều danh mục cho một sản phẩm, các danh mục đó có thể thuộc các Loại sản phẩm khác nhau, gây xung đột thuộc tính bộ lọc trên cùng một sản phẩm.
* **Mục tiêu**:
  * Giới hạn mỗi danh mục chỉ thuộc tối đa **1** loại sản phẩm (1-N).
  * Đảm bảo một sản phẩm khi thuộc về nhiều danh mục khác nhau thì tất cả các danh mục đó phải thuộc **cùng một kiểu sản phẩm** (đảm bảo tính nhất quán của bộ lọc thuộc tính).
* **Giải pháp UI**:
  * Chuyển đổi Checkbox thành Radio button ở trang tạo/sửa Danh mục để giới hạn 1 lựa chọn.
  * Thêm thông báo cảnh báo đỏ real-time và chặn lưu trên trang tạo/sửa Sản phẩm nếu các danh mục được gán có kiểu sản phẩm khác nhau.
* **Giải pháp Server**:
  * Cập nhật helper backend Convex để tự động dọn dẹp liên kết cũ khi gán danh mục sang kiểu sản phẩm mới.
  * Thêm validation ở backend Convex khi tạo/sửa sản phẩm để chặn lưu nếu phát hiện xung đột kiểu sản phẩm giữa các danh mục được gán.

## 2. Elaboration & Self-Explanation
Hiện nay, hệ thống cho phép một danh mục được chọn nhiều kiểu sản phẩm khác nhau. Tuy nhiên, mỗi kiểu sản phẩm lại đi kèm với các nhóm thuộc tính bộ lọc đặc thù riêng. Nếu một danh mục có nhiều kiểu sản phẩm, hệ thống sẽ bị rối khi gợi ý thuộc tính bộ lọc cho sản phẩm thuộc danh mục đó.
Hơn thế nữa, hệ thống cho phép một sản phẩm được gán vào nhiều danh mục cùng lúc (gồm danh mục chính và danh mục phụ). Nếu các danh mục này thuộc về các Loại sản phẩm khác nhau (ví dụ: Danh mục chính thuộc kiểu "Rượu vang", Danh mục phụ thuộc kiểu "Phụ kiện"), sản phẩm đó sẽ có cả các thuộc tính của Rượu vang (giống nho, nồng độ) và Phụ kiện (kích thước, chất liệu), gây mất nhất quán dữ liệu.
Vì vậy, ta cần thực hiện giải pháp kép:
a) Khống chế 1 danh mục chỉ được gán tối đa 1 kiểu sản phẩm trên giao diện Danh mục.
b) Khống chế 1 sản phẩm chỉ được gán vào các danh mục có cùng kiểu sản phẩm trên giao diện Sản phẩm.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  * Danh mục "Rượu vang hồng" chỉ được phép gán tối đa 1 kiểu sản phẩm duy nhất là "Rượu vang & sâm panh".
  * Sản phẩm "Vang Pháp Chateau" thuộc danh mục chính "Rượu vang hồng" (kiểu "Rượu vang & sâm panh"). Nó chỉ có thể được gán thêm danh mục phụ là "Vang Pháp nhập khẩu" (nếu danh mục này cũng thuộc kiểu "Rượu vang & sâm panh" hoặc không gán kiểu). Nếu người dùng cố gắng gán nó vào danh mục phụ "Hộp quà gỗ" (kiểu "Phụ kiện"), hệ thống sẽ báo lỗi và chặn không cho lưu.
* **Analogy đời thường**: Việc này tương tự như một học sinh (Sản phẩm) đăng ký các khóa học (Danh mục). Học sinh có thể đăng ký nhiều khóa học khác nhau, nhưng tất cả các khóa học đó phải thuộc cùng một khối chuyên môn học (Kiểu sản phẩm) - ví dụ cùng khối Tự nhiên hoặc cùng khối Xã hội, để tránh lịch học và chương trình thi (Thuộc tính bộ lọc) bị chồng chéo, xung đột với nhau.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã kiểm tra cấu trúc dữ liệu và mã nguồn hiện tại:
1. **Schema dữ liệu (`convex/schema.ts`)**:
   * Bảng trung gian `productCategoryTypes` quản lý mối quan hệ giữa danh mục sản phẩm (`categoryId`) và kiểu sản phẩm (`typeId`). Cấu trúc này hỗ trợ quan hệ nhiều-nhiều.
2. **Backend API (`convex/productCategories.ts`, `convex/productTypes.ts` & `convex/productsSmart.ts`)**:
   * `convex/productCategories.ts`: Chứa mutation `create`/`update` cùng helper `syncCategoryProductTypes` để đồng bộ mảng `productTypeIds` từ trang Category.
   * `convex/productTypes.ts`: Chứa mutation `create`/`update` cùng helper `syncProductCategoryTypes` để đồng bộ mảng `categoryIds` từ trang Product Type.
   * `convex/productsSmart.ts`: Chứa mutation `createProductWithVariants`/`updateProductWithVariants` để tạo và sửa sản phẩm.
3. **Frontend UI (`app/admin/categories`, `app/admin/product-types` & `app/admin/products`)**:
   * Trang edit/create danh mục: sử dụng checkboxes hiển thị danh sách kiểu sản phẩm.
   * Trang edit/create sản phẩm: sử dụng `CategoryTagsInput` hoặc `ProductCategoryCombobox` để gán danh mục chính và phụ cho sản phẩm.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Root Cause
Thiết kế ban đầu của hệ thống sử dụng quan hệ Nhiều-Nhiều thông qua bảng trung gian `productCategoryTypes` và thể hiện trên UI Category bằng Checkbox, cho phép một Danh mục liên kết đồng thời với nhiều Loại sản phẩm. Ngoài ra, hệ thống chưa có cơ chế kiểm tra tính đồng nhất về kiểu sản phẩm giữa danh mục chính và danh mục phụ của cùng một sản phẩm khi gán nhiều danh mục.

### Trả lời các câu hỏi Audit bắt buộc
1. **Triệu chứng quan sát được**: Ở trang tạo/sửa Danh mục sản phẩm, giao diện hiển thị danh sách checkbox cho phép tích chọn nhiều kiểu sản phẩm. Ở trang tạo/sửa Sản phẩm, người dùng có thể thoải mái gán các danh mục thuộc các kiểu sản phẩm khác nhau cho cùng một sản phẩm.
3. **Tái hiện ổn định**: Có, đây là thiết kế UI mặc định.
6. **Giả thuyết thay thế**: Liệu có nên thay đổi schema DB (bỏ bảng trung gian và thêm cột `productTypeId` vào bảng `productCategories`)?
   * *Độ tin cậy của giả thuyết thay thế*: Low. Việc đổi schema DB sẽ yêu cầu migrate dữ liệu cũ phức tạp và làm vỡ hàng loạt query/mutation đang tham chiếu tới `productCategoryTypes` trên toàn hệ thống, vi phạm nguyên tắc "thay đổi nhỏ, dễ rollback" và "DRY/KISS". Giải pháp duy trì bảng trung gian nhưng khống chế số lượng bản ghi gán ở mức tối đa là 1 mang lại độ an toàn và hiệu quả cao nhất.
8. **Tiêu chí pass/fail**:
   * Pass: UI Category hiển thị dạng Radio. Chỉ chọn được tối đa 1 kiểu. UI Product hiển thị cảnh báo đỏ và chặn lưu khi gán các danh mục khác kiểu sản phẩm. Backend chặn lưu thành công ở cả 2 đầu và DB không bị dư thừa dữ liệu.
   * Fail: UI vẫn cho phép chọn nhiều kiểu sản phẩm cho một danh mục. Hoặc sản phẩm lưu thành công mặc dù gán các danh mục thuộc các kiểu sản phẩm khác nhau.

*Độ tin cậy của Nguyên nhân gốc*: **High** (Dựa trên phân tích mã nguồn và logic nghiệp vụ do người dùng cung cấp).

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất triển khai các thay đổi sau:

### 1. Phía Giao diện Danh mục (Category UI)
* Thay thế thẻ `input type="checkbox"` bằng `input type="radio"` chung thuộc tính `name="productTypeId"`.
* Bổ sung một tùy chọn Radio ở đầu danh sách: "Không gán kiểu sản phẩm (Bỏ chọn)" để người dùng có thể xóa liên kết hiện tại của danh mục.
* Bổ sung nhãn hướng dẫn nghiệp vụ (microcopy) giúp người dùng hiểu rõ mỗi danh mục chỉ thuộc tối đa 1 kiểu sản phẩm.

### 2. Phía Giao diện Kiểu sản phẩm (Product Type UI)
* Giữ nguyên giao diện checkbox cho phép gán nhiều danh mục vào kiểu sản phẩm đó (phù hợp với logic 1 kiểu sản phẩm chứa nhiều danh mục).
* Thêm nhãn cảnh báo (microcopy) dưới phần gán danh mục để người dùng biết rằng nếu danh mục đang thuộc kiểu khác, nó sẽ được tự động chuyển sang kiểu này khi lưu.

### 3. Phía Giao diện Sản phẩm (Product UI)
* Sử dụng query `api.productTypes.listAssignedTypesForCategories` ở client để fetch thông tin kiểu sản phẩm của tất cả các danh mục được chọn (danh mục chính + phụ).
* Hiển thị cảnh báo đỏ ngay bên dưới phần chọn Danh mục nếu phát hiện các danh mục được chọn thuộc về các kiểu sản phẩm khác nhau.
* Chặn hành động submit (nút lưu) của form và hiển thị toast thông báo lỗi nếu tồn tại xung đột kiểu sản phẩm.

### 4. Phía Backend API (Convex)
* Cập nhật helper `syncProductCategoryTypes` trong [productTypes.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productTypes.ts): Trước khi insert bản ghi liên kết mới cho một danh mục, ta kiểm tra và xóa bỏ tất cả các bản ghi liên kết cũ của danh mục đó trong bảng `productCategoryTypes`.
* Thêm validation ở `syncCategoryProductTypes` trong [productCategories.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productCategories.ts) để ném lỗi nếu client cố tình gửi lên mảng `productTypeIds` có độ dài lớn hơn 1.
* Thêm validation trong mutation `createProductWithVariants` và `updateProductWithVariants` trong [productsSmart.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productsSmart.ts): kiểm tra nếu hệ thống bật `enableProductTypes`, các danh mục gán cho sản phẩm phải có cùng kiểu sản phẩm, nếu không sẽ ném lỗi chặn lưu.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI Components
1. **Sửa**: [edit/page.tsx (Categories)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/categories/%5Bid%5D/edit/page.tsx)
   * *Vai trò*: Trang chỉnh sửa danh mục sản phẩm.
   * *Thay đổi*: Thay checkbox chọn kiểu sản phẩm thành radio button, bổ sung tùy chọn "Không gán" ở đầu danh sách, và thêm microcopy hướng dẫn.
2. **Sửa**: [create/page.tsx (Categories)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/categories/create/page.tsx)
   * *Vai trò*: Trang tạo mới danh mục sản phẩm.
   * *Thay đổi*: Thực hiện thay đổi tương tự trang edit (chuyển sang radio button, bổ sung tùy chọn mặc định, và thêm microcopy).
3. **Sửa**: [edit/page.tsx (Product Types)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/%5Bid%5D/edit/page.tsx)
   * *Vai trò*: Trang chỉnh sửa kiểu sản phẩm.
   * *Thay đổi*: Bổ sung microcopy giải thích cơ chế tự động chuyển đổi danh mục khi được chọn.
4. **Sửa**: [create/page.tsx (Product Types)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/create/page.tsx)
   * *Vai trò*: Trang tạo mới kiểu sản phẩm.
   * *Thay đổi*: Bổ sung microcopy giải thích tương tự trang edit.
5. **Sửa**: [edit/page.tsx (Products)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/%5Bid%5D/edit/page.tsx)
   * *Vai trò*: Trang chỉnh sửa sản phẩm.
   * *Thay đổi*: Gọi query `listAssignedTypesForCategories`, thêm check conflict ở client, hiển thị cảnh báo đỏ và chặn submit form nếu có xung đột kiểu sản phẩm.
6. **Sửa**: [create/page.tsx (Products)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
   * *Vai trò*: Trang tạo mới sản phẩm.
   * *Thay đổi*: Thực hiện thay đổi tương tự trang edit sản phẩm (check conflict ở client, hiển thị cảnh báo và chặn submit).

### Backend Functions
7. **Sửa**: [productCategories.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productCategories.ts)
   * *Vai trò*: API Mutation/Query cho danh mục sản phẩm.
   * *Thay đổi*: Thêm validation vào helper `syncCategoryProductTypes` để đảm bảo mảng `productTypeIds` chỉ được chứa tối đa 1 ID.
8. **Sửa**: [productTypes.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productTypes.ts)
   * *Vai trò*: API Mutation/Query cho kiểu sản phẩm.
   * *Thay đổi*: Cập nhật helper `syncProductCategoryTypes` để xóa các liên kết cũ của danh mục với kiểu sản phẩm khác trước khi chèn liên kết mới.
9. **Sửa**: [productsSmart.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productsSmart.ts)
   * *Vai trò*: API Mutation/Query cho sản phẩm và biến thể.
   * *Thay đổi*: Thêm logic kiểm tra đồng nhất kiểu sản phẩm của tất cả danh mục được gán trước khi lưu sản phẩm.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Chỉnh sửa backend file [productTypes.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productTypes.ts) để xử lý logic xóa bỏ liên kết cũ của danh mục khi gán mới.
2. **Bước 2**: Chỉnh sửa backend file [productCategories.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productCategories.ts) để validate mảng gán kiểu sản phẩm có tối đa 1 phần tử.
3. **Bước 3**: Chỉnh sửa backend file [productsSmart.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productsSmart.ts) để kiểm tra tính đồng nhất kiểu sản phẩm của tất cả danh mục của sản phẩm.
4. **Bước 4**: Chỉnh sửa frontend file [edit/page.tsx (Categories)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/categories/%5Bid%5D/edit/page.tsx) và [create/page.tsx (Categories)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/categories/create/page.tsx) để chuyển checkbox thành radio button và thêm tùy chọn "Không gán".
5. **Bước 5**: Chỉnh sửa frontend file [edit/page.tsx (Product Types)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/%5Bid%5D/edit/page.tsx) và [create/page.tsx (Product Types)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/create/page.tsx) để bổ sung microcopy hướng dẫn.
6. **Bước 6**: Chỉnh sửa frontend file [edit/page.tsx (Products)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/%5Bid%5D/edit/page.tsx) và [create/page.tsx (Products)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx) để check conflict ở client, hiển thị cảnh báo đỏ và chặn submit form.
7. **Bước 7**: Kiểm tra tĩnh typescript compile (`bunx tsc --noEmit`) để đảm bảo không lỗi cú pháp.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy kiểm tra tĩnh TypeScript:
  ```powershell
  bunx tsc --noEmit
  ```

### Manual Verification
1. **Kiểm tra UI Category (Edit/Create)**:
   * Truy cập trang tạo hoặc sửa danh mục.
   * Xác nhận danh sách Kiểu sản phẩm được hiển thị với các nút Radio.
   * Xác nhận chỉ có thể chọn tối đa 1 kiểu.
   * Chọn thử "Không gán kiểu sản phẩm" và lưu, xác nhận liên kết cũ bị xóa sạch.
2. **Kiểm tra UI Product Type (Edit/Create)**:
   * Truy cập trang tạo hoặc sửa kiểu sản phẩm.
   * Thử gán một danh mục $C$ đang thuộc kiểu sản phẩm $A$ sang kiểu sản phẩm $B$.
   * Lưu lại và kiểm tra lại danh mục $C$ đó trong trang chỉnh sửa danh mục, xác nhận nó đã chuyển sang kiểu sản phẩm $B$ và không còn liên kết với $A$.
3. **Kiểm tra UI Product (Edit/Create) & Backend**:
   * Tạo/sửa sản phẩm. Chọn danh mục chính thuộc kiểu $A$.
   * Chọn thêm danh mục phụ thuộc kiểu $B$.
   * Xác nhận hệ thống hiển thị cảnh báo đỏ về việc xung đột kiểu sản phẩm.
   * Thử bấm nút Lưu, xác nhận hệ thống hiển thị toast lỗi và chặn lưu dữ liệu.
   * Backend Convex ném lỗi tương ứng nếu cố tình lưu thông qua API trực tiếp.

---

# VIII. Todo

- [ ] Cập nhật logic backend trong `convex/productTypes.ts` (helper `syncProductCategoryTypes`).
- [ ] Cập nhật logic backend trong `convex/productCategories.ts` (helper `syncCategoryProductTypes`).
- [ ] Cập nhật logic backend trong `convex/productsSmart.ts` (kiểm tra đồng nhất kiểu sản phẩm của các danh mục trước khi tạo/sửa sản phẩm).
- [ ] Sửa giao diện trang chỉnh sửa danh mục `app/admin/categories/[id]/edit/page.tsx`.
- [ ] Sửa giao diện trang tạo danh mục `app/admin/categories/create/page.tsx`.
- [ ] Thêm microcopy hướng dẫn trong giao diện chỉnh sửa kiểu sản phẩm `app/admin/product-types/[id]/edit/page.tsx`.
- [ ] Thêm microcopy hướng dẫn trong giao diện tạo kiểu sản phẩm `app/admin/product-types/create/page.tsx`.
- [ ] Cập nhật giao diện trang chỉnh sửa sản phẩm `app/admin/products/[id]/edit/page.tsx` (check conflict, hiển thị cảnh báo và chặn submit).
- [ ] Cập nhật giao diện trang tạo sản phẩm `app/admin/products/create/page.tsx` (check conflict, hiển thị cảnh báo và chặn submit).
- [ ] Chạy kiểm tra TypeScript (`bunx tsc --noEmit`).

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Giao diện chỉnh sửa/tạo Danh mục**:
  * Các tùy chọn kiểu sản phẩm hiển thị dưới dạng nút chọn duy nhất (Radio button).
  * Có nút Radio "Không gán kiểu sản phẩm" để bỏ chọn kiểu hiện tại.
* **Giao diện chỉnh sửa/tạo Sản phẩm**:
  * Hiển thị cảnh báo đỏ khi các danh mục được gán (chính + phụ) thuộc các kiểu sản phẩm khác nhau.
  * Vô hiệu hóa hoặc chặn lưu (toast báo lỗi) khi cố tình lưu sản phẩm có danh mục xung đột kiểu sản phẩm.
* **Đồng bộ hóa dữ liệu**:
  * Mỗi danh mục chỉ thuộc tối đa 1 kiểu sản phẩm trong cơ sở dữ liệu.
  * Tất cả các danh mục được gán của 1 sản phẩm bắt buộc phải có cùng kiểu sản phẩm (hoặc không gán kiểu).
* **TypeScript**: Không có lỗi biên dịch.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Nếu trước đây có dữ liệu cũ chứa một danh mục liên kết với nhiều kiểu sản phẩm, hoặc sản phẩm chứa các danh mục khác kiểu sản phẩm, khi người dùng mở trang sửa và lưu lại, hệ thống sẽ yêu cầu chỉnh sửa lại để hợp lệ. Điều này là hành vi mong muốn để làm sạch dữ liệu cũ không nhất quán.
* **Hoàn tác**: Sử dụng lệnh `git checkout` để khôi phục lại các file code frontend và backend về trạng thái ban đầu.

---

# XI. Out of Scope (Ngoài phạm vi)

* Thay đổi cấu trúc schema vật lý (như xóa bảng trung gian `productCategoryTypes`). Ta giữ nguyên cấu trúc schema hiện có để đảm bảo tính an toàn cao và tránh phải viết script di chuyển dữ liệu (data migration script) phức tạp làm gián đoạn hệ thống.
* Thay đổi cơ chế hiển thị bộ lọc thuộc tính ngoài client.

---

# XII. Open Questions (Câu hỏi mở)
*Không có.*
