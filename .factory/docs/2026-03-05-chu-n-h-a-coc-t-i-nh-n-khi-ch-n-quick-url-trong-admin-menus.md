## Problem Graph
1. [Main] Nhãn menu chưa tự đồng bộ khi chọn URL từ popup gợi ý <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] `handleSelectQuickRoute` hiện chỉ set `url`, không set `label`
   1.2 [Sub] Chưa có contract rõ ràng giữa option quick route và nhãn mặc định cần áp dụng

## Execution (with reflection)
1. Solving 1.1.1 (bổ sung contract dữ liệu cho quick picker)
   - Thought: Cần truyền đầy đủ dữ liệu option (label/url/source/group) vào handler chọn.
   - Action: Trong `app/admin/menus/page.tsx`, đổi `handleSelectQuickRoute(url: string)` thành `handleSelectQuickRoute(option: QuickRouteOption)`.
   - Reflection: ✓ Cho phép dùng trực tiếp `option.label` để auto-sync nhãn.

2. Solving 1.1.2 (áp dụng CoC “chọn gợi ý => tự đổi nhãn”)
   - Thought: User chọn “Luôn tự ghi đè nhãn theo gợi ý”, nên logic phải deterministic.
   - Action: Trong cùng file, khi chọn option:
     - `handleUpdateField(targetId, 'url', option.url)`
     - `handleUpdateField(targetId, 'label', option.label)`
     - rồi đóng popup như hiện tại.
   - Reflection: ✓ Đúng kỳ vọng CoC, giảm thao tác tay.

3. Solving 1.2 (đảm bảo mapping nhãn theo yêu cầu)
   - Thought: User muốn category hiển thị “chỉ tên danh mục”, list hiển thị “Danh sách sản phẩm/bài viết/dịch vụ”.
   - Action: Giữ/chuẩn hóa nguồn dữ liệu `quickRouteOptions`:
     - Nhóm Module giữ label list hiện có trong `MODULE_SITE_ROUTE_CATALOG` (`Danh sách bài viết/sản phẩm/dịch vụ`).
     - Nhóm Danh mục giữ `label: category.name` (không thêm tiền tố).
   - Reflection: ✓ Đúng yêu cầu hiện tại, không phát sinh rule dư thừa (KISS/YAGNI).

4. Hoàn thiện UX consistency nhỏ
   - Thought: Tránh bug do button map vẫn truyền `url` string.
   - Action: Đổi chỗ gọi trong JSX từ `onClick={() => handleSelectQuickRoute(option.url)}` thành `onClick={() => handleSelectQuickRoute(option)}`.
   - Reflection: ✓ Type-safe, nhất quán handler mới.

5. Verify sau implement
   - Action:
     - Test tay trong `/admin/menus`:
       - Chọn danh mục sản phẩm/bài viết/dịch vụ => nhãn đổi đúng tên danh mục.
       - Chọn list `/products`, `/posts`, `/services` => nhãn thành “Danh sách ...”.
     - Chạy `bunx tsc --noEmit` theo rule repo.
   - Reflection: ✓ Đảm bảo không vỡ type + đúng UX mong muốn.

## Checklist chốt cho bạn
- [x] Chọn gợi ý URL sẽ tự ghi đè cả URL + Nhãn
- [x] Category hiển thị nhãn = tên danh mục
- [x] List hiển thị nhãn = “Danh sách ...”
- [x] Không mở rộng feature ngoài phạm vi yêu cầu