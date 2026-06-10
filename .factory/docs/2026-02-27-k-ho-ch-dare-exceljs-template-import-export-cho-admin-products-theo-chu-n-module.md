## Problem Graph
1. [Main] Thêm ExcelJS cho Products Admin (file mẫu + import + export) mà không xung đột module <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Chưa có contract Excel thống nhất theo module fields/settings (schema cột, validate, xử lý duplicate)
   1.2 Thiếu backend query/mutation chuyên biệt cho export/import an toàn, có limit
   1.3 Thiếu UI flow ở `/admin/products` cho 3 tác vụ (Tải mẫu / Import / Export theo filter & toàn bộ)
   1.4 Thiếu quality gate chống xung đột (feature toggle, settings, pagination, duplicate policy)

## Execution (with reflection)
1. Solving 1.1.1 (Contract Excel chuẩn module)
   - Thought: Nếu không chốt contract trước sẽ lệch giữa template/import/export và dễ phá quy ước module.
   - Action:
     - Tạo `lib/products/excel-contract.ts` chứa:
       - Danh sách cột chuẩn: `name, slug, sku, categorySlug, price, salePrice, stock, status, image, description`.
       - Enum status mapping (`Active|Draft|Archived`) + label tiếng Việt.
       - Hàm normalize cell, parse number, parse status.
       - Rule áp dụng theo module fields/settings (ẩn/skip cột nếu field tắt).
     - Tạo `lib/products/excel-styles.ts`:
       - Header màu brand cam (fill/font/border/alignment), freeze row 1, auto filter.
       - Style cột tiền tệ, cột trạng thái, độ rộng cột.
       - Sheet `HDSD` (hướng dẫn) với legend màu + quy tắc import.
   - Reflection: ✓ Valid (KISS + DRY: dùng chung contract cho cả 3 chức năng).

2. Solving 1.2 (Backend Convex cho export/import)
   - Thought: Import/export không nên xử lý toàn bộ ở client; cần query/mutation rõ ràng, limit và duplicate policy.
   - Action:
     - Cập nhật `convex/products.ts`:
       - Thêm `listAdminExport` query: nhận filter hiện tại (`search, categoryId, status`) + `limit` (max 5000), trả field tối thiểu cho Excel.
       - Thêm `importFromExcelRows` mutation:
         - Input: mảng row đã parse + `duplicateMode='skip'` (theo yêu cầu).
         - Validate bắt buộc: `name, sku, slug, categorySlug, price`.
         - Batch resolve category theo slug (Map O(1), không query trong loop).
         - Check trùng SKU/slug: bỏ qua row trùng, gom báo cáo `created/skipped/errors`.
         - Dùng `create` logic tương thích hiện tại (status mặc định theo module setting nếu thiếu).
     - (Nếu cần tách gọn) tạo `convex/productsExcel.ts` và export API tương ứng.
   - Reflection: ✓ Valid (tuân thủ bandwidth: limit + batch lookup + tránh N+1).

3. Solving 1.3 (UI tại `/admin/products/page.tsx`)
   - Thought: Cần UX rõ cho 3 tác vụ nhưng không phá layout list hiện tại.
   - Action:
     - Thêm 4 controls cạnh nút “Thêm sản phẩm”:
       - `Tải file mẫu`
       - `Import Excel`
       - `Export theo bộ lọc`
       - `Export toàn bộ`
     - Thêm input file ẩn `.xlsx` + xử lý đọc file bằng `ExcelJS.Workbook().xlsx.load(arrayBuffer)`.
     - Import flow:
       - Parse sheet `Products` theo contract.
       - Gọi mutation `importFromExcelRows`.
       - Hiển thị toast summary: số tạo mới / số bỏ qua trùng / số lỗi.
     - Export flow (2 mode):
       - Mode filter: dùng đúng filter/search hiện tại.
       - Mode all: gọi query với limit 5000.
       - Dựng workbook ExcelJS có style màu + format tiền + trạng thái + ngày export.
     - Template flow:
       - Tạo workbook gồm `Products` (header + validation dropdown status + 1-2 dòng ví dụ) và `HDSD` (hướng dẫn chi tiết).
   - Reflection: ✓ Valid (đúng yêu cầu 3 vấn đề + 2 nút export).

4. Solving 1.4 (Integration với module, chống xung đột)
   - Thought: Module có feature/field/settings động; Excel phải tôn trọng các toggle này.
   - Action:
     - Reuse `listEnabledModuleFields` và `listModuleSettings` đã có trong trang Products.
     - Contract export/template chỉ bao gồm cột đang bật (trừ cột hệ thống bắt buộc).
     - Import bỏ qua dữ liệu cột đang tắt (không patch bừa).
     - Mapping category dùng `productCategories.listActive` để tránh id sai.
   - Reflection: ✓ Valid (an toàn theo module contract, không hardcode trái hệ thống).

## Ordered actions (file-level, implement được ngay)
1. Cài dependency: thêm `exceljs` vào `package.json`.
2. Tạo `lib/products/excel-contract.ts` (schema cột, parser, mapper, duplicate policy helpers).
3. Tạo `lib/products/excel-styles.ts` (header style, money format, validation, sheet hướng dẫn).
4. Cập nhật `convex/products.ts` (thêm `listAdminExport`, `importFromExcelRows` + validators).
5. Cập nhật `app/admin/products/page.tsx` (UI buttons + import/export/template handlers).
6. Đảm bảo typings API Convex cập nhật đúng usage ở trang.
7. Verify bắt buộc: `bunx tsc --noEmit`.
8. Commit 1 commit theo scope feature này (không push).

## Gate matrix
### Critical (phải pass)
- [ ] Contract cột Excel thống nhất giữa template/import/export.
- [ ] Import duplicate SKU/slug = skip row (không fail toàn bộ).
- [ ] Có đủ 2 chế độ export: theo filter + toàn bộ (limit 5000).
- [ ] Tôn trọng module fields/settings khi build cột.
- [ ] Không N+1 khi import (batch lookup category, check duplicate tối ưu).
- [ ] `bunx tsc --noEmit` pass.

### Non-critical (có thể warning)
- [ ] Auto width cột chưa hoàn hảo 100% mọi dữ liệu dài.
- [ ] Màu sắc Excel có thể hơi khác giữa Excel desktop và Google Sheets.

## Warnings + remediation note
- ExcelJS tăng bundle client: sẽ hạn chế bằng dynamic import (`await import('exceljs')`) trong handler để giảm ảnh hưởng initial load.
- Import lớn có thể chậm: đang giới hạn thực tế 5000 rows/lần và trả summary chi tiết để user chia batch nếu cần.

## Next-safe-step
Nếu bạn duyệt spec này, mình sẽ implement đúng các file trên, chạy `bunx tsc --noEmit`, rồi commit local 1 commit theo quy tắc dự án.