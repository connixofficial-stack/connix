## Problem Graph
1. [Main] Sheet `Products` nhìn như trống dù đã có dữ liệu mẫu <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] `addStatusValidation` chạy trước, tạo cell tới row 5001 làm 6 dòng ví dụ bị add xuống cuối sheet
   1.2 [Quality gap] Test hiện chưa khóa chặt điều kiện “row 2 phải có dữ liệu ví dụ” trong mọi cấu hình cột

## Execution (with reflection)
1. Sửa thứ tự xử lý theo best practice (write data trước, validation sau)
   - File: `lib/products/excel-styles.ts`
   - Đổi flow trong `buildProductTemplateSheet` thành:
     - `styleHeaderRow` → `autoFilter` → `applyNumberFormats` → `addExampleRowsAtTop` → `addStatusValidation`
   - Reflection: đảm bảo dữ liệu business (6 ví dụ) luôn xuất hiện ngay sau header, validation chỉ là lớp bổ sung.

2. Ghim cứng vị trí ví dụ ở đầu sheet
   - File: `lib/products/excel-styles.ts`
   - Đổi `addExampleRows` sang chèn tại row 2 (ví dụ `insertRows(2, ...)` hoặc set row index tường minh), thay vì `addRow` nối cuối.
   - Giữ mapping theo `columns` đang bật (đúng yêu cầu của anh).
   - Reflection: kể cả sau này ai đổi thứ tự gọi hàm, dữ liệu mẫu vẫn ở đúng vị trí đầu sheet.

3. Cập nhật test để bắt đúng bug thật
   - File: `lib/products/__tests__/excel-styles.test.ts`
   - Bổ sung/siết assert:
     - `sheet.getRow(2)` phải có `name` khác rỗng.
     - `sheet.getRow(7)` vẫn có dữ liệu (đủ 6 case mẫu).
     - test cho full cột và subset cột.
   - Reflection: test sẽ fail ngay nếu ví dụ bị đẩy xuống sâu (row 5002+).

4. Validate & commit
   - Chạy `bunx tsc --noEmit` theo rule repo.
   - Rà soát `git diff --cached` + `git status` trước commit.
   - Commit message đề xuất: `fix(products): keep excel template examples at top rows`.

Nếu anh duyệt, em triển khai ngay đúng plan này, không mở rộng thêm phạm vi.