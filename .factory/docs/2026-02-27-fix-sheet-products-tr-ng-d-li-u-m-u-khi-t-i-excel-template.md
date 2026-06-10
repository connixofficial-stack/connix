## Problem Graph
1. [Main] Sheet `Products` trong file mẫu Excel bị trống ví dụ <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Luồng tạo rows mẫu không đảm bảo dữ liệu được ghi thực sự vào worksheet ở mọi cấu hình cột
   1.2 [Verification gap] Chưa có kiểm tra tự động đảm bảo sheet template luôn có >= 1 dòng dữ liệu mẫu

## Execution (with reflection)
1. Solving 1.1.1 — Reproduce đúng bug và khoanh vùng
   - File: `app/admin/products/page.tsx`, `lib/products/excel-styles.ts`
   - Cách làm: tạo script/test nhỏ dùng chính `buildProductTemplateSheet(workbook, excelColumns)` với các tổ hợp cột (full + chỉ cột bật), rồi assert `worksheet.rowCount > 1` và kiểm tra giá trị 1-2 ô mẫu.
   - Reflection: nếu fail => xác nhận đúng lỗi ghi row; nếu pass => bug nằm ở flow download/runtime khác.

2. Solving 1.1.2 — Fix tối thiểu, đúng lỗi trống
   - File chính sửa: `lib/products/excel-styles.ts`
   - Thay đổi cụ thể:
     - Bổ sung guard sau khi add mẫu: nếu `sheet.rowCount <= 1` thì inject 1 dòng fallback theo đúng cột đang bật (không ép full cột).
     - Đảm bảo mapping theo `columns` hiện tại (đúng yêu cầu: giữ đúng cột đang bật).
     - Giữ nguyên style/validation hiện có, không refactor rộng.
   - Reflection: fix này không đổi contract import/export, chỉ chặn trường hợp template trống.

3. Solving 1.2 — Chốt kiểm tra tránh tái phát
   - File thêm/cập nhật test gần module products (theo cấu trúc hiện có, ưu tiên `lib/products/*` test).
   - Test case bắt buộc:
     - Có full cột -> có dữ liệu mẫu.
     - Chỉ cột bắt buộc + subset optional -> vẫn có dữ liệu mẫu.
   - Reflection: test tập trung đúng bug, không mở rộng scope.

4. Validate & commit
   - Chạy duy nhất: `bunx tsc --noEmit` (theo rule repo).
   - Rà `git diff --cached` + `git status` trước commit.
   - Commit message đề xuất: `fix(products): ensure excel template always includes product examples`.

Nếu anh duyệt spec này, em triển khai ngay theo đúng hướng “fix tối thiểu đúng lỗi trống”, không mở rộng thêm tính năng.