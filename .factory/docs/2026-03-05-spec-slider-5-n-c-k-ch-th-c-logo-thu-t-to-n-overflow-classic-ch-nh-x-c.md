## Problem Graph
1. [Main] Header Menu Experience cần thêm control kích thước logo + sửa overflow Classic còn vào More khi vẫn dư chỗ
   1.1 [Sub] Chưa có cấu hình logo-size dùng chung cho Classic/Topbar/Allbirds
      1.1.1 [ROOT CAUSE] `HeaderMenuConfig` chưa có token kích thước logo và UI editor chưa có control tương ứng
   1.2 [Sub] Thuật toán overflow hiện tại còn bảo thủ nên visible item ít hơn khả năng thực
      1.2.1 [ROOT CAUSE] Cách tính đang dựa đo tuần tự và reserve chưa đủ động theo action area thực tế tại từng thời điểm

## Execution (with reflection)
1. Thêm cấu hình logo-size dạng slider 5 nấc (áp dụng toàn bộ layout)
   - Thought: Bạn chọn “cả Classic + Topbar + Allbirds” + dùng slider 5 nấc cho tiện.
   - Action:
     - File `components/experiences/previews/HeaderMenuPreview.tsx`
       - Mở rộng `HeaderMenuConfig` thêm `logoSizeLevel: 1 | 2 | 3 | 4 | 5`.
       - Tạo map size token theo level (ví dụ):
         - L1: nhỏ hơn hiện tại
         - L2: hiện tại (default)
         - L3/L4/L5: tăng dần nhẹ
       - Dùng token này để render badge/logo image cho cả Classic/Topbar/Allbirds (desktop + mobile parity).
     - File `components/site/Header.tsx`
       - Mở rộng `HeaderConfig` thêm `logoSizeLevel?: 1|2|3|4|5`.
       - `DEFAULT_CONFIG.logoSizeLevel = 2` (mặc định bằng hiện tại).
       - Áp token size tương ứng khi render logo ở 3 layout.
     - File `app/system/experiences/menu/page.tsx`
       - `DEFAULT_CONFIG` thêm `logoSizeLevel: 2`.
       - Merge backward compatibility: `raw?.logoSizeLevel ?? 2`.
       - Thêm control slider 5 nấc trong “Hiển thị” (hoặc block Classic nếu muốn gần brand controls):
         - min=1, max=5, step=1.
         - Label phụ theo nấc: “Nhỏ hơn / Mặc định / Lớn 1 / Lớn 2 / Lớn 3”.
       - Save vào `header_config` cùng các field khác.
   - Reflection: ✓ Đáp ứng đúng yêu cầu UX control đơn giản, không thêm complexity không cần thiết.

2. Thiết kế thuật toán overflow Classic chính xác (site + preview)
   - Thought: Bạn yêu cầu “đo thực tế + binary search + reserved action width động”.
   - Action:
     - Áp dụng cho Classic desktop ở cả:
       - `components/site/Header.tsx`
       - `components/experiences/previews/HeaderMenuPreview.tsx`
     - Thuật toán đề xuất:
       1) Đo chính xác bằng DOM refs:
          - `containerWidth` của vùng nav.
          - `itemWidths[]` của toàn bộ root items (measurement layer).
          - `moreWidth` (nếu cần More).
          - `actionsWidth` động: search/cart/cta đang bật và chiều rộng thực tế của chúng.
          - `brandBlockWidth` động: phụ thuộc logoSizeLevel + showBrandName.
       2) Tính `availableNavWidth = headerRowWidth - brandBlockWidth - actionsWidth - safetyGap`.
       3) Binary search tìm `k` lớn nhất sao cho:
          - `sum(itemWidths[0..k-1]) + (k < n ? moreWidth : 0) <= availableNavWidth`.
       4) `visibleRootItems = first k`, còn lại vào More.
       5) Chỉ hiển thị More khi `k < n`.
     - Re-calc trigger:
       - `ResizeObserver` trên container, brand block, action block, measure layer.
       - Re-run khi đổi: `logoSizeLevel`, `showBrandName`, `cta.show`, `search.show`, số lượng menu root.
   - Reflection: ✓ Loại bỏ trường hợp “còn chỗ mà vẫn vào More”, đúng ưu tiên của bạn.

3. Đồng bộ parity preview = site thật
   - Thought: Tránh lệch hành vi giữa trang cấu hình và runtime.
   - Action:
     - Dùng cùng công thức tính `availableNavWidth` và cùng binary-search strategy.
     - Đồng bộ default + mapping logo-size tokens.
   - Reflection: ✓ Tránh bug “preview khác site thật”.

4. Cập nhật UX trong trang `/system/experiences/menu`
   - Action:
     - Thêm slider 5 nấc ngay gần toggle Tên thương hiệu/CTA.
     - Thêm hint ngắn: “Logo lớn + bật brand name + CTA sẽ giảm không gian menu trước khi More”.

5. Validation trước commit
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Test thủ công các case chính ở Classic desktop (site + preview):
       - Case A: brand name ON, CTA ON, logo L5.
       - Case B: brand name OFF, CTA OFF, logo L1.
       - Case C: thay đổi slider 1→5 liên tục, kiểm tra More xuất hiện/biến mất hợp lý.
       - Case D: resize viewport lớn/nhỏ, bảo đảm không “nhảy More sai”.
     - Commit local + add `.factory/docs` theo rule.

## Checklist
- [ ] Có slider 5 nấc `logoSizeLevel` trong experience menu
- [ ] Áp dụng logo-size cho Classic + Topbar + Allbirds
- [ ] Classic desktop dùng thuật toán đo thực tế + binary search + reserved action width động
- [ ] Fix áp dụng cho cả site thật và preview
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit đầy đủ (kèm `.factory/docs`)