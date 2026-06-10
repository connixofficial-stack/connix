## Problem Graph
1. [Main] Nâng cấp file Excel mẫu ở `/admin/products` để admin dễ nhập với đầy đủ case thực tế <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Sheet `Products` hiện chỉ có 1 dòng ví dụ, chưa bao quát nhiều tình huống
   1.2 Chưa có sheet lỗi mẫu tách biệt để admin nhận diện dữ liệu sai
   1.3 `HDSD` chưa mô tả rõ bộ case mẫu + cách dùng sheet lỗi

## Execution (with reflection)
1. Solving 1.1.1 (Mở rộng case hợp lệ trong sheet Products)
   - Thought: Bạn muốn đầy đủ case hợp lệ gồm: chuẩn, khuyến mãi, bản nháp, lưu trữ, không ảnh, mô tả dài.
   - Action:
     - Sửa `lib/products/excel-styles.ts`:
       - Đổi `addExampleRow` thành `addExampleRows`.
       - Tạo 6 dòng mẫu hợp lệ (không thêm cột mới):
         1) Active chuẩn (đủ dữ liệu)
         2) Active có `salePrice`
         3) Draft
         4) Archived
         5) Không có ảnh (`image` rỗng)
         6) Mô tả dài (nhiều câu)
       - Giữ format/validation hiện tại.
   - Reflection: ✓ Valid (đúng yêu cầu, không thay contract import).

2. Solving 1.2 (Thêm sheet lỗi mẫu riêng, không ảnh hưởng import thật)
   - Thought: Bạn chọn “sheet riêng + ghi chú trong HDSD”, đây là cách an toàn nhất.
   - Action:
     - Trong `lib/products/excel-styles.ts`, thêm `buildErrorSampleSheet(workbook, columns)`:
       - Sheet tên `LOI_MAU`.
       - Header giống `Products` để dễ đối chiếu.
       - Thêm 5-6 dòng sai điển hình: thiếu SKU, giá không hợp lệ, status sai, categorySlug không tồn tại, slug trùng format xấu...
       - Tô màu nền đỏ nhạt cho cell lỗi + comment ngắn ở cột lỗi.
       - Thêm cảnh báo ở dòng đầu: “Sheet này chỉ để tham khảo, không dùng import”.
     - Cập nhật flow tải template trong `app/admin/products/page.tsx` để gọi thêm `buildErrorSampleSheet`.
   - Reflection: ✓ Valid (tách biệt rõ dữ liệu lỗi, tránh admin import nhầm).

3. Solving 1.3 (Nâng cấp sheet HDSD)
   - Thought: HDSD cần đóng vai trò bản đồ điều hướng cho admin.
   - Action:
     - Cập nhật `buildGuideSheet` trong `lib/products/excel-styles.ts`:
       - Bổ sung mục “Bộ case mẫu trong Products”.
       - Bổ sung mục “Cách đọc LOI_MAU” và cảnh báo không import sheet này.
       - Bổ sung checklist trước import (SKU/Slug unique, categorySlug tồn tại, price là số...).
   - Reflection: ✓ Valid (giảm sai sót vận hành cho admin).

## Ordered actions (file-level)
1. Update `lib/products/excel-styles.ts`:
   - thêm nhiều dòng case hợp lệ trong `Products`.
   - thêm builder cho sheet `LOI_MAU`.
   - mở rộng `HDSD` theo bộ case + lỗi mẫu.
2. Update `app/admin/products/page.tsx`:
   - khi tải template, tạo thêm `LOI_MAU` cùng `Products` và `HDSD`.
3. Verify: `bunx tsc --noEmit`.
4. Commit local 1 commit (không push).

## Gate matrix
### Critical
- [ ] Template có đủ 6 case hợp lệ theo yêu cầu.
- [ ] Có sheet `LOI_MAU` riêng để minh hoạ lỗi.
- [ ] `HDSD` ghi rõ mục đích từng sheet và cảnh báo không import `LOI_MAU`.
- [ ] Không thêm cột mới trong `Products`.
- [ ] `bunx tsc --noEmit` pass.

### Non-critical
- [ ] Tối ưu màu/highlight để đọc tốt trên cả Excel desktop và Google Sheets.

## Next-safe-step
Nếu bạn duyệt, mình sẽ implement đúng 2 file trên, chạy typecheck, rồi commit local ngay.