# Spec: Sửa lỗi ReturnsValidationError trên query `products:getById`

## I. Primer

### 1. TL;DR kiểu Feynman
Khi ứng dụng web yêu cầu dữ liệu của một sản phẩm từ cơ sở dữ liệu (thông qua hàm `products:getById`), hệ thống Convex sẽ kiểm tra xem cấu trúc dữ liệu thực tế của sản phẩm đó có khớp hoàn toàn với cấu trúc (validator) được lập trình sẵn hay không. 
Hiện tại, dữ liệu thực tế của sản phẩm có chứa một số thông tin mới về chương trình mua kèm (combo) như `currentProductQty` (số lượng sản phẩm hiện tại trong combo mix), `syncId` (mã đồng bộ) và `isSynced` (trạng thái đồng bộ). Tuy nhiên, bộ kiểm tra (validator) trong file `convex/products.ts` lại chưa được cập nhật các trường này. Kết quả là hệ thống từ chối trả về dữ liệu và báo lỗi "Value does not match validator" (Giá trị không khớp với bộ kiểm tra). Để sửa, ta chỉ cần thêm các định nghĩa trường còn thiếu này vào bộ kiểm tra của file `convex/products.ts`.

### 2. Elaboration & Self-Explanation
Vấn đề cốt lõi nằm ở sự không đồng bộ giữa ba nơi định nghĩa cấu trúc dữ liệu của sản phẩm:
- Schema chính (`convex/schema.ts`) định nghĩa bảng `products` có chứa `combos` với đầy đủ các thuộc tính của cấu hình mix và đồng bộ (`currentProductQty`, `syncId`, `isSynced`).
- File mutation thông minh (`convex/productsSmart.ts`) cũng định nghĩa đầy đủ các trường này để tiếp nhận dữ liệu đầu vào khi tạo/cập nhật sản phẩm.
- Nhưng file query chính (`convex/products.ts`) - nơi chịu trách nhiệm trả dữ liệu về cho giao diện người dùng - lại sử dụng một định nghĩa cục bộ `comboItemDoc` bị thiếu các trường trên. 

Khi một sản phẩm được lưu với các trường combo mới (ví dụ như sản phẩm Yamazaki 12 Year Old trong báo cáo lỗi có `currentProductQty: 2.0`), hàm query `getById` lấy dữ liệu lên và đối chiếu với validator cục bộ `productDoc` (trỏ đến `comboItemDoc`). Do validator cục bộ này không cho phép các trường lạ, quá trình kiểm tra thất bại và ném ra lỗi runtime ở phía client.

### 3. Concrete Examples & Analogies
Hãy tưởng tượng validator giống như một chiếc máy quét an ninh ở cửa sân bay. Máy quét này được cài đặt danh sách các vật phẩm được phép mang lên máy bay.
- Ban đầu, danh sách cho phép chỉ có: "Tên combo", "Giá", "Loại", "Danh sách sản phẩm đi kèm".
- Sau đó, hãng hàng không cập nhật quy định mới (ở quầy bán vé và quầy ký gửi hành lý - tương đương `schema.ts` và `productsSmart.ts`), cho phép hành khách mang thêm "Số lượng sản phẩm chính trong combo" (`currentProductQty`) và "Thẻ đồng bộ" (`syncId`, `isSynced`).
- Tuy nhiên, nhân viên ở cửa an ninh (tương đương `products.ts`) chưa nhận được danh sách cập nhật này. Khi thấy hành khách mang theo "Số lượng sản phẩm chính" và "Thẻ đồng bộ", họ chặn hành khách lại vì coi đó là vật phẩm không hợp lệ, khiến hành khách không thể lên máy bay (lỗi `ReturnsValidationError`).
- Giải pháp: Cập nhật danh sách cho phép tại cửa an ninh (thêm 3 trường này vào validator của `products.ts`).

---

## II. Audit Summary (Tóm tắt kiểm tra)
- **Đã kiểm tra cấu trúc schema**: File [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/schema.ts#L319-L362) định nghĩa `combos` chứa đầy đủ `syncId`, `isSynced` và `mixConfig.currentProductQty`.
- **Đã kiểm tra validator trong mutation**: File [productsSmart.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/productsSmart.ts#L47-L86) định nghĩa `comboItemDoc` đồng bộ hoàn toàn với schema.
- **Đã phát hiện điểm lệch**: File [products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/products.ts#L46-L82) định nghĩa `comboItemDoc` thiếu `syncId`, `isSynced` ở cấp cao nhất của item, và thiếu `currentProductQty` trong `mixConfig`.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause Confidence**: **High** (Độ tin cậy tuyệt đối).
  - *Lý do*: Lỗi `ReturnsValidationError: Value does not match validator` chỉ ra chính xác giá trị thực tế của bản ghi product chứa `combos: [{ mixConfig: { currentProductQty: 2.0, ... } }]` trong khi Validator hiển thị trong log lỗi hoàn toàn không có trường này. Qua đối chiếu mã nguồn, `comboItemDoc` trong `convex/products.ts` thực sự thiếu định nghĩa trường này.
- **Giả thuyết đối chứng**: Liệu có phải dữ liệu bị ghi sai cấu trúc? 
  - *Phản bác*: Không, dữ liệu được ghi thông qua `productsSmart.ts` hoặc các logic mutation khác tuân theo đúng `schema.ts`. `currentProductQty` và `syncId` là các tính năng nghiệp vụ hợp lệ đã được thiết kế và lưu trữ thành công trong DB. Lỗi chỉ phát sinh ở bước kiểm tra đầu ra (output validation) của query do định nghĩa validator lỗi thời.

---

## IV. Proposal (Đề xuất)
Cập nhật định nghĩa hằng số `comboItemDoc` trong file [products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/products.ts) để bổ sung các trường:
1. Ở cấp cao nhất của `comboItemDoc`:
   - `syncId: v.optional(v.string())`
   - `isSynced: v.optional(v.boolean())`
2. Ở cấp `mixConfig` của `comboItemDoc`:
   - `currentProductQty: v.optional(v.number())`

---

## V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa:
- [convex/products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/products.ts): File chứa định nghĩa các query sản phẩm. Sửa đổi hằng số `comboItemDoc` ở đầu file để đồng bộ cấu trúc validator với database schema.

---

## VI. Execution Preview (Xem trước thực thi)
1. Đọc lại vùng code của `comboItemDoc` trong [convex/products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/products.ts#L46-L82).
2. Áp dụng công cụ chỉnh sửa file để thêm `syncId`, `isSynced` và `currentProductQty`.
3. Lưu file và chờ trình biên dịch TypeScript chạy kiểm tra lỗi cú pháp/kiểu (chạy tĩnh qua `bunx tsc --noEmit`).

---

## VII. Verification Plan (Kế hoạch kiểm chứng)
- **TypeScript Typecheck**:
  Chạy lệnh `bunx tsc --noEmit` ở thư mục dự án để đảm bảo các file code TypeScript của Convex và Next.js không phát sinh lỗi kiểu dữ liệu sau thay đổi.
- **Chạy Convex Code Generation**:
  Nếu cần, Convex sẽ tự động chạy code generation khi file `.ts` trong thư mục `convex` thay đổi để cập nhật định nghĩa API.

---

## VIII. Todo
- [ ] Chỉnh sửa file `convex/products.ts` cập nhật validator `comboItemDoc`.
- [ ] Kiểm tra lỗi biên dịch TypeScript bằng `bunx tsc --noEmit`.

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Hàm query `products:getById` chạy thành công không ném lỗi `ReturnsValidationError` đối với các sản phẩm có dữ liệu combo mix.
- Trình biên dịch TypeScript biên dịch thành công không có lỗi kiểu liên quan đến `products`.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Hầu như bằng 0 vì đây chỉ là nới lỏng validator đầu ra (adding optional fields) để khớp với dữ liệu thực tế đang có trong DB. Không làm ảnh hưởng đến dữ liệu cũ hay luồng ghi dữ liệu.
- **Hoàn tác**: Hoàn tác file `convex/products.ts` về phiên bản git trước đó (`git checkout convex/products.ts`).

---

## XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa database schema, không thay đổi cấu trúc bảng `products`.
- Không chỉnh sửa giao diện hiển thị của combo hay logic đồng bộ combo (vì các tính năng này hoạt động bình thường, lỗi chỉ do validator chặn hiển thị).
- Không tự ý chạy lint/unit test của dự án ngoài việc kiểm tra kiểu tĩnh (theo RULE[AGENTS.md]).
