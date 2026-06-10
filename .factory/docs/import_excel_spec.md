# Cải tiến UX/UI cho chức năng Import/Export Excel Sản phẩm (Schema-Driven)

## I. Primer
### 1. TL;DR kiểu Feynman
- **Vấn đề:** Hệ thống hiện tại có cấu hình rất linh hoạt (vật lý/digital, có/không có phiên bản, giá/tồn kho cấu hình theo cha hoặc con). Nếu xuất một file Excel tĩnh cố định với tất cả các cột, file sẽ trở thành một mớ rác khổng lồ, rối mắt và dễ nhập sai.
- **Giải pháp:** Xây dựng **Configuration-Driven Template Engine**. Trước khi xuất file, hệ thống đọc cấu hình hiện tại ở `modules/products` và `product-options` để quyết định "đắp" cột nào lên file Excel. Cột nào hệ thống đang tắt, cột đó sẽ biến mất khỏi file.
- **Lợi ích:** Trải nghiệm "Đo ni đóng giày" tuyệt đối. Hệ thống cấu hình thế nào thì file Excel tự động uốn theo thế đó. File gọn gàng, không có cột thừa, tính thực chiến cao.

### 2. Elaboration & Self-Explanation
Một hệ thống SaaS mạnh không bắt người dùng phải làm ngơ trước những cột vô giá trị. 
Giả sử hệ thống đang thiết lập: *Chỉ bán hàng Vật lý, Tồn kho tính theo từng Phiên bản, Giá tính theo từng Phiên bản.*
Khi đó, quá trình sinh file Excel (Template Generator) sẽ chạy qua một Rule Engine (Bộ quy tắc):
1. Thấy bán hàng Vật lý -> Bật cột Cân Nặng, Kích thước. Tắt cột Link tải, Serial (của Digital).
2. Thấy có sử dụng Phiên bản (Variants) -> Bật cấu trúc dòng Cha-Con.
3. Thấy Giá & Tồn kho cấu hình theo Phiên bản -> Các cột "Giá", "Tồn kho" sẽ có rule hướng dẫn ngầm: "Điền ở dòng Phiên bản, dòng Cha để trống".
Như vậy, File Excel là một chiếc bóng (reflection) phản chiếu chính xác 100% Cấu hình Database hiện thời.

### 3. Concrete Examples & Analogies
- **Ví dụ 1 (Hệ thống thiết lập Giá chung toàn SP, nhưng Tồn kho theo Variant):** Cột "Giá" trên Excel sẽ khóa ở các dòng con, bắt buộc điền ở dòng Cha. Cột "Tồn kho" ngược lại, khóa ở dòng Cha, bắt buộc điền ở các dòng Con. Dòng thứ 3 (Microcopy) sẽ tự động sinh chữ hướng dẫn: *"Chỉ điền ở dòng sản phẩm Cha"* hoặc *"Điền cho từng phiên bản"*.
- **Ví dụ 2 (Digital vs Physical):** Nếu bật bán cả hai, hệ thống sẽ chèn 1 cột là "Loại SP (Physical/Digital)". Nếu admin chọn "Digital" ở cột đó, các cột Cân nặng bên cạnh (dù có) cũng sẽ bị gạch xám không bắt buộc, trong khi cột Link Tải lại phát tín hiệu bắt buộc nhập.

## II. Audit Summary (Tóm tắt kiểm tra)
- **Tính năng cần đáp ứng:** Chức năng Import/Export Excel không phải là tĩnh, mà phụ thuộc hoàn toàn vào cấu hình tại `http://localhost:3000/system/modules/products` và `http://localhost:3000/admin/product-options`.
- **Độ phức tạp:** Các biến số cấu hình giao thoa lẫn nhau (Ví dụ: Digital + Có biến thể + Giá theo biến thể + Ảnh kế thừa từ SP cha).
- **Core Engine:** Cần một Builder Pattern trong Node.js (bằng `exceljs`) để ghép các cột (Column Blocks) dựa trên Config object đọc từ Convex.

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Vấn đề của Export tĩnh:** Nếu liệt kê hết mọi trường hợp (Cả vật lý, cả digital, cả giá cha, giá con) vào 1 file, số cột có thể lên tới 50 cột. Admin sẽ không biết phải điền cột nào bỏ cột nào.
- **Giả thuyết giải quyết:** Column Schema = Core Schema + [Conditional Schemas]. Ta chỉ sinh ra các cột phụ thuộc dựa trên cờ (flags) đang bật trong Cài đặt hệ thống. Nếu một tính năng tắt, Data validation và cột của tính năng đó hoàn toàn bay màu khỏi Excel.

## IV. Proposal (Đề xuất)
Xây dựng **Dynamic Excel Generator** với các Pipeline sau:

1. **Config Fetcher:** Khi admin bấm "Tải Template" hoặc "Export", API sẽ fetch toàn bộ cờ cài đặt:
   - `isPhysicalEnabled`, `isDigitalEnabled`, `digitalTypes`.
   - `hasVariants`.
   - `priceStrategy`: `PRODUCT_LEVEL` | `VARIANT_LEVEL`.
   - `inventoryStrategy`: `PRODUCT_LEVEL` | `VARIANT_LEVEL`.
   - `imageStrategy`: `INHERIT` | `OVERRIDE` | `MIXED`.

2. **Column Builder Pipeline:**
   - **Base:** Thêm `ID`, `SKU`, `Tên SP`, `Danh mục`.
   - **Type Rule:** Nếu `isPhysical` & `isDigital` cùng bật -> Thêm cột `Loại Sản Phẩm`. Nếu chỉ bật 1 cái -> Bỏ qua cột này, gán ngầm dưới backend.
   - **Pricing Rule:** Định vị trí cột "Giá" và sinh Microcopy (dòng 3) dựa theo `priceStrategy`.
   - **Image Rule:** Nếu `imageStrategy` là `INHERIT`, ở các dòng variant, ghi Microcopy: *"Trống = dùng ảnh Cha"*.

3. **Smart Parser (Khi Import upload lên):**
   - Backend cũng phải đọc lại Config hệ thống để đối chiếu với file upload.
   - Nếu file upload chứa cột Cân Nặng nhưng hệ thống hiện đang tắt bán Vật lý -> Báo lỗi hoặc tự động bỏ qua cột đó.
   - Xử lý mượt mà việc update chéo (Ghi đè giá con lên giá cha nếu config cho phép).

## V. Files Impacted (Tệp bị ảnh hưởng)
- **Tạo mới:** `lib/excel/product-schema-builder.ts` (Core engine quyết định cột nào được render dựa trên config).
- **Tạo mới:** `app/admin/products/actions/excel-actions.ts` (Server action).
- **Tạo mới/Sửa:** `convex/productConfigs.ts` hoặc các bảng lưu trữ cấu hình (Đảm bảo query lấy config là cực nhanh, O(1)).
- **Sửa:** `convex/products.ts` (Cập nhật logic `upsertBulk` dựa trên các ma trận cấu hình).

## VI. Execution Preview (Xem trước thực thi)
1. Xây dựng Type/Interface cho `ProductModuleConfig`.
2. Tạo hàm `buildExcelColumns(config: ProductModuleConfig)` trả về một mảng định nghĩa các cột cho `exceljs`.
3. Sinh file Excel: Vòng lặp quét mảng cột -> tạo Header 3 dòng tương ứng. 
4. Thêm Data Validation (Khóa ô, bôi màu xám) *cho từng ô cụ thể*. Ví dụ, ô "Giá" ở dòng Variant sẽ bị khóa (protect) và bôi xám nếu hệ thống bắt buộc giá đi theo SP Cha.

## VII. Verification Plan (Kế hoạch kiểm chứng)
Cần test tạo Template/Export qua 4 kịch bản (Scenario Testing):
- **Test 1:** Chỉ vật lý + Không Variant + Giá tĩnh. (File Excel cực kỳ đơn giản, siêu ngắn).
- **Test 2:** Chỉ Digital + Không Variant. (Xuất hiện cột link/serial, mất cột cân nặng).
- **Test 3:** Vật lý + Có Variant + Giá/Kho riêng theo Variant. (Xuất hiện pattern SKU Cha-Con, khóa ô Giá/Kho ở dòng cha).
- **Test 4 (Chaos):** Bật tất cả các module. (Hệ thống vẫn giữ được độ ngăn nắp nhờ nhóm Header dòng 1).

## VIII. Todo
- [ ] Định nghĩa `ProductModuleConfig` Interface sát với schema Cài đặt hiện tại.
- [ ] Cài đặt `exceljs`.
- [ ] Viết bộ quy tắc sinh cột (`Column Builder Engine`).
- [ ] Viết hàm Parse data linh động theo config hiện tại.
- [ ] Tích hợp UI và test với các mutation lưu data vào Convex.
- [ ] Chuyển spec này vào `.factory/docs/import_excel_spec.md`.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi thay đổi cài đặt hệ thống (bật/tắt bán Digital, bật/tắt Biến thể), file Template sinh ra phải tự động thêm/bớt cột tương ứng ngay lập tức.
- File vẫn đảm bảo tuân thủ thiết kế "3-Row Header", "Dictionary Sheet" (Từ điển), và "Upsert Engine".
- Row validation phải chính xác (Ví dụ: Không bắt nhập Cân nặng nếu dòng đó là hàng Digital).

## X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Khi Admin đã export một file lúc hệ thống ở cấu hình A. Sau đó Admin đổi cấu hình hệ thống sang B, rồi dùng file cũ (A) để import vào.
- **Giảm thiểu:** Parser phải so khớp version/danh sách cột của file so với cấu hình hiện tại. Nếu lệch logic quá mức, chặn Import và văng lỗi thân thiện: *"Cấu hình hệ thống đã thay đổi (bạn vừa bật tính năng X). Vui lòng tải lại Template mới để import."*

## XI. Out of Scope (Ngoài phạm vi)
- Import file CSV (Chỉ hỗ trợ `.xlsx`).

## XII. Open Questions (Câu hỏi mở)
> [!IMPORTANT]
> - Thiết lập `product-options` hiện tại được lưu ở Convex theo dạng Global Settings (Cấu hình toàn cục cho toàn hệ thống) hay là cấu hình ghi đè được trên từng Danh mục (Category-level settings)? Nếu là Category-level, engine này sẽ còn phải rẽ nhánh phức tạp hơn nữa.
> - Xin xác nhận: Việc xử lý "cấu hình A tải template, rồi đổi sang cấu hình B, rồi up file cũ" -> chặn ngay (Strict mode) hay là cố gắng tự merge (Lax mode)? (Khuyến cáo dùng Strict mode để an toàn data).
