# I. Primer

## 1. TL;DR kiểu Feynman
Trong file Excel Sapo, các sản phẩm khác nhau có thể xếp các thuộc tính theo thứ tự khác nhau. Ví dụ: Giày Nike chỉ có thuộc tính 1 là `"Size"`; Dép Yz Slides có thuộc tính 1 là `"Màu sắc"` và thuộc tính 2 là `"Size"`.
Hiện tại, hệ thống gán cứng tên thuộc tính cho tất cả sản phẩm theo thứ tự phát hiện chung. Điều này dẫn đến việc: ở dòng Dép Yz Slides, giá trị màu sắc `"Bone (Kem)"` (nằm ở cột thuộc tính 1) bị gán nhầm thành `"Size"`, còn giá trị kích cỡ `"44 |Us 10| 28.5 cm"` (nằm ở cột thuộc tính 2) lại bị gán nhầm thành `"Màu sắc"`.
Giải pháp là cập nhật cho từng biến thể tự mang theo **Tên thuộc tính tương ứng của nó** (ví dụ: biến thể 1 mang nhãn `"Màu sắc"`, biến thể 2 mang nhãn `"Size"`). Khi lưu vào database, backend Convex sẽ đọc nhãn của từng biến thể để xếp chúng vào đúng thuộc tính thực tế.

## 2. Elaboration & Self-Explanation
Hiện nay, cấu trúc `bulkVariantDoc` trong Convex mutation `upsertBulk` chỉ nhận `variantOption1` và `variantOption2` dưới dạng giá trị trơn (string). Backend tự lấy tên thuộc tính chung `opt1Name` và `opt2Name` truyền từ Client để tạo hoặc đối chiếu.
Nhưng do thứ tự thuộc tính trong Excel Sapo thay đổi động tùy sản phẩm:
- Sản phẩm A: Thuộc tính 1 = `"Size"` -> `variantOption1 = "36"`.
- Sản phẩm B: Thuộc tính 1 = `"Màu sắc"`, Thuộc tính 2 = `"Size"` -> `variantOption1 = "Bone (Kem)"`, `variantOption2 = "44"`.
Nếu dùng chung `optionNames = ["Size", "Màu sắc"]` phát hiện từ sản phẩm đầu tiên:
- Sản phẩm A: `variantOption1 ("36")` -> Map đúng vào `"Size"`.
- Sản phẩm B: `variantOption1 ("Bone (Kem)")` -> Map sai vào `"Size"`; `variantOption2 ("44")` -> Map sai vào `"Màu sắc"`.

Giải pháp triệt để:
a) Cập nhật Convex Validator `bulkVariantDoc` trong `convex/productsImport.ts` để nhận thêm 2 trường: `variantOption1Name: v.optional(v.string())` và `variantOption2Name: v.optional(v.string())`.
b) Cập nhật logic xử lý trong `upsertBulk` của Convex: Khi duyệt qua các biến thể, ưu tiên sử dụng `vData.variantOption1Name` hoặc `vData.variantOption2Name` (nếu có) làm tên thuộc tính khi gọi hàm `getOrCreateOptionValue(...)`.
c) Cập nhật interface `ParsedProductRecord` trong [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts) để các biến thể có thêm `variantOption1Name` và `variantOption2Name`.
d) Cập nhật adapter `sapo-thanshoes.adapter.ts`: Khi duyệt qua các dòng sản phẩm, trích xuất tên thuộc tính thực tế từ các cột `Thuộc tính 1` và `Thuộc tính 2` rồi gán trực tiếp vào từng biến thể:
   - `variantOption1Name: currentOpt1Name`
   - `variantOption2Name: currentOpt2Name`

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn có 2 ngăn tủ là **"Size giày"** và **"Màu sắc"**.
- **Lỗi hiện tại:** Người giao hàng mang đến 2 hộp quà. Hộp 1 (Giày Nike) chỉ ghi số `36`. Bạn quy ước "Hộp 1 là Size". Hộp 2 (Dép Yz) chứa: ngăn 1 ghi chữ `Đỏ`, ngăn 2 ghi số `44`. Do quy ước cứng nhắc "Ngăn 1 là Size, Ngăn 2 là Màu sắc", bạn bỏ chữ `Đỏ` vào tủ "Size giày" và số `44` vào tủ "Màu sắc". Kết quả là dữ liệu bị đảo lộn tai hại.
- **Giải pháp mới:** Người giao hàng dán nhãn trực tiếp lên từng ngăn của hộp quà. Ngăn chứa chữ `Đỏ` có nhãn "Màu sắc", ngăn chứa số `44` có nhãn "Size". Bạn chỉ việc đọc nhãn trên từng ngăn và bỏ đúng vào ngăn tủ tương ứng bất kể thứ tự của chúng trong hộp quà như thế nào.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã phân tích ảnh chụp màn hình quản trị của người dùng. Xác nhận các giá trị kích cỡ của Dép Yz Slides (như `"44 |Us 10| 28.5 cm"`, `"36-37 |Us 4| 22.5 cm"`) và Áo thun (như `"M - Đen"`) vẫn bị gán sai lệch vào thuộc tính **"Màu sắc"**.
- Đã chạy script phân tích chi tiết dữ liệu thực tế tại dòng 2042 (Dép Yz Slides) và dòng 2191 (Áo thun) trong file Excel Sapo.
- Xác nhận thứ tự các cột thuộc tính bị đảo lộn động giữa các sản phẩm:
  - Dòng 2 (Giày Nike): Thuộc tính 1 = `"Size"`.
  - Dòng 2042 (Dép Yz): Thuộc tính 1 = `"Màu sắc"`, Thuộc tính 2 = `"Size"`.
  - Dòng 2191 (Áo thun): Thuộc tính 1 = `"Mẫu"`, Thuộc tính 2 = `"Size"`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Hàm `upsertBulk` của Convex và client-side sử dụng mảng tên thuộc tính tĩnh chung cho tất cả sản phẩm, dẫn đến việc map sai lệch khi thứ tự thuộc tính của các sản phẩm khác nhau trong Excel bị hoán đổi.
- **Giả thuyết đối chứng:** Nếu không truyền tên thuộc tính trực tiếp cho từng biến thể, mà chỉ cố gắng sắp xếp mảng `optionNames` ở phía client, chúng ta sẽ không thể giải quyết được trường hợp trong cùng một file Excel có cả sản phẩm Giày (Size trước) và sản phẩm Dép (Màu trước Size sau). Việc truyền động nhãn thuộc tính cho từng biến thể là giải pháp duy nhất giải quyết được triệt để vấn đề này.

# IV. Proposal (Đề xuất)
1. Cập nhật `convex/productsImport.ts`:
   - Thêm `variantOption1Name: v.optional(v.string())` và `variantOption2Name: v.optional(v.string())` vào validator `bulkVariantDoc`.
   - Cập nhật logic `upsertBulk`: Sử dụng `vDoc = await getOrCreateOptionValue(vData.variantOption1Name || opt1Name, vData.variantOption1)` và tương tự cho option 2.
   - Thu thập danh sách `optionIdsToLink` cho sản phẩm cha dựa trên các options thực tế được tạo ra từ chính các biến thể của sản phẩm đó để đảm bảo liên kết chính xác.
2. Cập nhật `app/admin/products/actions/excel-actions.ts`:
   - Thêm `variantOption1Name?: string` và `variantOption2Name?: string` vào kiểu dữ liệu `variants` trong `ParsedProductRecord`.
3. Cập nhật `lib/excel/adapters/sapo-thanshoes.adapter.ts`:
   - Gán `variantOption1Name: currentOpt1Name || undefined` và `variantOption2Name: currentOpt2Name || undefined` cho từng biến thể khi parse Excel.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [productsImport.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productsImport.ts)
  - Thay đổi: Cập nhật validator arguments và logic xử lý thuộc tính động của biến thể trong mutation `upsertBulk`.
- `Sửa:` [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts)
  - Thay đổi: Mở rộng interface `ParsedProductRecord.variants` để chứa thêm tên thuộc tính 1 và 2.
- `Sửa:` [sapo-thanshoes.adapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/adapters/sapo-thanshoes.adapter.ts)
  - Thay đổi: Trích xuất và gán trực tiếp tên thuộc tính thực tế vào từng record biến thể khi parse.

# VI. Execution Preview (Xem trước thực thi)
1. Sửa file [productsImport.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productsImport.ts) để cập nhật validator và logic backend.
2. Sửa file [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts) để cập nhật kiểu dữ liệu.
3. Sửa file [sapo-thanshoes.adapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/adapters/sapo-thanshoes.adapter.ts) để gán tên option động cho từng biến thể.
4. Chạy `bunx tsc --noEmit` để typecheck toàn dự án.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy typecheck và đảm bảo dự án không gặp bất kỳ lỗi biên dịch nào.
- Bàn giao để người dùng thực hiện xóa sạch DB và import lại file Excel Sapo, xác nhận thuộc tính "Size", "Màu sắc", "Mẫu" được tạo lập và liên kết cực kỳ chuẩn xác với từng giá trị của từng sản phẩm.

# VIII. Todo
- [ ] Thay đổi file [productsImport.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/productsImport.ts)
- [ ] Thay đổi file [excel-actions.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/actions/excel-actions.ts)
- [ ] Thay đổi file [sapo-thanshoes.adapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/excel/adapters/sapo-thanshoes.adapter.ts)
- [ ] Thực hiện biên dịch dự án bằng TypeScript để kiểm tra static types.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Các giá trị kích cỡ của Yz Slides (`44 |Us 10| 28.5 cm`...) phải nằm trong thuộc tính `"Size"`.
- Các giá trị màu sắc của Yz Slides (`Bone (Kem)`...) phải nằm trong thuộc tính `"Màu sắc"`.
- Giá trị mẫu của Áo thun (`1`...) phải nằm trong thuộc tính `"Mẫu"`.
- Toàn bộ dự án biên dịch thành công không có lỗi type.
