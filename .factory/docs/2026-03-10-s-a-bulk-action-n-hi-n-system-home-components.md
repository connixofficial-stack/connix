## Audit Summary
- Observation:
  - `app/system/home-components/page.tsx` hiện chỉ có bulk action `Ẩn đã chọn`; logic `handleHideSelected` luôn union `hiddenTypes + selectedTypes`, nên chỉ ẩn thêm chứ không thể hiện lại.
  - Toggle từng dòng đã có qua `toggleHiddenType`, nhưng bulk action chưa có nhánh ngược để bỏ ẩn.
  - User xác nhận mong muốn: **tách 2 nút riêng `Ẩn đã chọn` và `Hiện đã chọn`**, không dùng 1 nút toggle chung.
- Inference:
  - Root cause nằm ở thiết kế bulk action một chiều, không phải ở Convex schema/API vì `setCreateVisibility({ hiddenTypes })` đã đủ để hỗ trợ cả ẩn lẫn hiện.
- Decision:
  - Giữ API hiện tại, chỉ sửa UI + derive state để có 2 hành vi rõ ràng: ẩn selected và hiện selected.

## Root Cause Confidence
- High — evidence trực tiếp ở `app/system/home-components/page.tsx`: `handleHideSelected` chỉ thêm selected vào `hiddenTypes`, không có hàm loại selected ra khỏi `hiddenTypes`.

## Proposal
1. Sửa `app/system/home-components/page.tsx`.
   - Giữ nút `Ẩn đã chọn` nhưng thêm guard/label disabled hợp lý.
   - Thêm nút mới `Hiện đã chọn` cạnh `Ẩn đã chọn`.
   - Tạo `selectedHiddenTypes` và `selectedVisibleTypes` từ `selectedTypes` + `hiddenTypeSet` để:
     - `Ẩn đã chọn` chỉ enable khi có ít nhất 1 item selected đang hiện.
     - `Hiện đã chọn` chỉ enable khi có ít nhất 1 item selected đang ẩn.
2. Thêm handler mới:
   - `handleShowSelected` => `nextHidden = hiddenTypes.filter(type => !selectedSet.has(type))`, rồi gọi `setCreateVisibility({ hiddenTypes: nextHidden })`.
   - Toast rõ ràng cho case hiện thành công/thất bại.
3. Tinh chỉnh bulk UX nhỏ:
   - Giữ selected state hiện tại, không tự clear sau action để user thao tác liên tiếp ẩn/hiện nhanh.
   - Có thể hiển thị text phụ kiểu `Đã chọn X mục, đang ẩn Y` nếu cần để tránh mơ hồ; chỉ làm nếu code hiện tại đã có chỗ phù hợp, không mở rộng scope.
4. Không đổi backend/schema.
   - `convex/homeComponentSystemConfig.ts` không cần sửa vì mutation hiện tại đã nhận full `hiddenTypes` list.

## Counter-Hypothesis
- Không chọn phương án 1 nút toggle bulk vì user đã chốt tách 2 nút riêng để tránh mixed-state khó hiểu.
- Không thêm mutation mới `showSelected/hideSelected` vì chưa cần; frontend đã đủ dữ liệu và current API đủ expressive.

## Verification Plan
- Static review:
  - Kiểm tra `selectedTypes = []` thì cả 2 nút disabled.
  - Kiểm tra selected chỉ gồm item đang ẩn => chỉ `Hiện đã chọn` enable.
  - Kiểm tra selected chỉ gồm item đang hiện => chỉ `Ẩn đã chọn` enable.
  - Kiểm tra selected mixed => cả 2 nút cùng enable và mỗi nút xử lý đúng subset tương ứng.
- Typecheck:
  - Chạy `bunx tsc --noEmit` vì có thay đổi TSX.
- Repro cho tester:
  1. Chọn vài item đang hiện, bấm `Ẩn đã chọn` => các item chuyển sang hidden.
  2. Chọn lại các item đó, bấm `Hiện đã chọn` => các item hiện lại.
  3. Chọn hỗn hợp item ẩn + hiện => mỗi nút chỉ tác động đúng nhóm tương ứng, không đảo sai toàn bộ.
  4. Kiểm tra trang `/admin/home-components/create` phản ánh đúng hidden state sau từng action.