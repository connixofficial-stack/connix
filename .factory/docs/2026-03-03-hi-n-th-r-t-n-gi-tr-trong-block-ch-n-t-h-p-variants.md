## Problem Graph
1. [Tên giá trị đang khó đọc trong block chọn tổ hợp] <- depends on 1.1, 1.2
   1.1 [Visual density cao: checkbox dồn 1 hàng, thiếu cấu trúc]
   1.2 [Label chưa được trình bày theo dạng chip/grid nên người dùng thấy “mớ checkbox”]

## Execution (with reflection)
1. Chuẩn hóa item hiển thị: checkbox + text label rõ ràng
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Mỗi value render thành 1 “chip item” có:
    - checkbox bên trái
    - text label bên phải (`value.label ?? value.value` để tránh rỗng)
  - Item có style trạng thái chọn/bỏ chọn rõ (border/bg/text).
  - Tăng khoảng cách, min-height, căn giữa theo trục dọc để dễ scan.
- Reflection: ✓ đúng format bạn chọn: checkbox + tên rõ ràng.

2. Đổi layout values sang grid responsive 2-3 cột
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Khối danh sách value từ `flex-wrap` sang grid:
    - mobile: 1 cột
    - md: 2 cột
    - xl: 3 cột
  - Mỗi ô giữ full width để text dài vẫn đọc được, không dồn thành 1 hàng icon.
- Reflection: ✓ xử lý tốt case nhiều màu/size (20+), không bị “mớ” checkbox.

3. Tăng khả năng nhận diện option/value
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Header mỗi option giữ `Đã chọn X/Y`.
  - Nếu label dài, dùng truncate + title native để hover thấy đầy đủ.
  - Giữ nút “Chọn tất cả / Bỏ chọn” như hiện tại.
- Reflection: ✓ thao tác nhanh nhưng vẫn đọc được tên đầy đủ.

4. Không đổi nghiệp vụ
- Giữ nguyên logic:
  - lọc tổ hợp theo các value đã tick
  - reset rows khi đổi bộ lọc
  - summary tổ hợp + cảnh báo thiếu chọn
- Reflection: ✓ chỉ cải thiện UX hiển thị, không ảnh hưởng flow tạo variants.

5. Kiểm thử
- Chạy: `bunx tsc --noEmit`.
- Test tay:
  - option ít value và nhiều value đều hiển thị tên rõ
  - grid responsive đúng 1/2/3 cột theo breakpoint
  - tick/bỏ tick vẫn lọc tổ hợp đúng

6. Commit
- `git status` + `git diff --cached` kiểm tra.
- Commit message đề xuất: `fix(products): improve option value labels in combination filter grid`
- Add kèm `.factory/docs` theo rule repo.

## Checklist
- [ ] Hiển thị rõ tên value cạnh checkbox
- [ ] Layout grid responsive 1/2/3 cột
- [ ] Không đổi logic lọc tổ hợp/reset rows
- [ ] `bunx tsc --noEmit` pass