## Problem Graph
1. [Main] Featured bị rớt bố cục khi nhiều item, card +N không nằm vị trí cuối ổn định
   1.1 [ROOT CAUSE] Grid đang render theo số item động, không khóa số ô cố định
   1.2 [Sub] Thiếu placeholder slot khi item ít, dẫn tới lệch hàng/cột giữa breakpoint

## Execution (with reflection)
1. Khóa layout cố định cho tất cả breakpoint
   - File: `app/admin/home-components/partners/_components/PartnersFeaturedShared.tsx`
   - Logic mới:
     - Card lớn: luôn lấy item đầu tiên (slot 1).
     - Card nhỏ: hiển thị tối đa 5 item tiếp theo (slots 2..6).
     - Slot 7: ô cuối cố định cho `+N` khi còn dư item.
   - Reflection: ✓ đảm bảo đúng rule “1 lớn + 5 nhỏ + 1 +N” mọi breakpoint.

2. Quy tắc count và phân bổ item
   - Tính:
     - `featured = items[0]`
     - `smallVisible = items.slice(1, 6)` (tối đa 5)
     - `remaining = max(0, items.length - 6)`
   - Render vùng grid nhỏ luôn đủ 6 ô:
     - 5 ô đầu: dữ liệu thật hoặc ô trống placeholder.
     - Ô thứ 6 (cuối):
       - nếu `remaining > 0` => hiện `+N`.
       - nếu `remaining === 0` => placeholder trống (theo yêu cầu “bỏ trống ô cuối”).
   - Reflection: ✓ ô cuối luôn ổn định, không rớt layout.

3. Responsive nhưng giữ cùng cấu trúc
   - Áp dụng cùng cấu trúc trên mobile/tablet/desktop, chỉ đổi kích thước tile/gap để không quá chật.
   - Không đổi schema/config.
   - Reflection: ✓ đúng yêu cầu “mọi breakpoint”.

4. Tương tác ô +N
   - Ô `+N` giữ trạng thái tĩnh, không click.
   - Reflection: ✓ đúng lựa chọn “Không click”.

5. Đồng bộ preview và site
   - Vì preview/site dùng chung `PartnersFeaturedShared`, chỉnh 1 file là đồng bộ 100%.
   - Reflection: ✓ tránh mismatch mới.

6. Validation + commit
   - Chạy `bunx tsc --noEmit`.
   - Commit chỉ file Featured shared.
   - Commit message đề xuất: `fix(partners): stabilize featured grid with fixed +N slot`

## Phạm vi
- Chỉ style `featured` của Partners.
- Không ảnh hưởng marquee/badge/carousel/grid.
- Giữ compat data 100%.