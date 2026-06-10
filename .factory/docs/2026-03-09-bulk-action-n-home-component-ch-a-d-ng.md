## Audit Summary
- **Observation**:
  - `app/system/home-components/page.tsx` đã có bảng type + chọn nhiều + action `Ẩn đã chọn`, dữ liệu ẩn lưu qua `api.homeComponentSystemConfig.setCreateVisibility` (setting `create_hidden_types`).
  - `app/admin/home-components/create/page.tsx` đang lọc danh sách type theo `systemConfig.hiddenTypes`, nên hidden type sẽ biến mất khỏi trang tạo.
  - `app/admin/home-components/page.tsx` chưa có trạng thái “type đang dùng/không dùng”; chỉ thao tác trên từng item.
  - `convex/homeComponents.ts` đã có `getStats()` trả `typeBreakdown` (count theo type), đủ để xác định **type chưa dùng = count = 0**.
- **Inference**:
  - Thiếu 1 bulk action tự động “ẩn các type chưa tạo lần nào”, và thiếu badge/trạng thái rõ ràng ở `/system/home-components` để admin biết type nào đang không dùng.
- **Decision (theo yêu cầu đã chốt)**:
  - Thêm bulk action ở `/system/home-components`: **Ẩn tất cả type chưa dùng (count=0)**.
  - Giữ phạm vi: chỉ ẩn khỏi `/admin/home-components/create` + hiển thị trạng thái rõ trong `/system/home-components`.

## Root Cause Confidence
- **High**.
- Lý do: dữ liệu cần thiết đã sẵn (`COMPONENT_TYPES`, `getStats().typeBreakdown`, `hiddenTypes`) nhưng UI/logic chưa ghép lại thành action tự động theo tiêu chí “unused=count=0”. Không cần đổi schema DB.

## Đề xuất triển khai chi tiết (actionable)
1. **Sửa `app/system/home-components/page.tsx`**
   - Thêm query `const stats = useQuery(api.homeComponents.getStats)`.
   - Tính `typeCountMap` từ `stats.typeBreakdown` (map type -> count).
   - Xác định `unusedTypes = componentTypes.filter(t => (typeCountMap[t.value] ?? 0) === 0).map(t => t.value)`.
   - Thêm bulk action button mới (cạnh `Ẩn đã chọn`):
     - Label: `Ẩn type chưa dùng`.
     - Disabled khi không có unused type.
     - Handler `handleHideUnusedTypes`:
       - `nextHidden = union(hiddenTypes, unusedTypes)`.
       - Gọi `setCreateVisibility({ hiddenTypes: nextHidden })`.
       - Toast thành công/thất bại rõ ràng.
   - Thêm cột/indicator trạng thái sử dụng trong từng dòng:
     - Badge `Đang dùng (n)` khi count > 0.
     - Badge `Chưa dùng` khi count = 0.
   - Giữ nguyên behavior cũ (`Ẩn đã chọn`, `Bật custom đã chọn`, toggle từng type).

2. **Tinh chỉnh UX nhỏ để “đánh dấu rõ” ở system page**
   - Dòng summary trên toolbar: hiển thị `X type chưa dùng` để admin nhận biết nhanh.
   - Không thay đổi route/contract API hiện tại.

3. **Không đổi `convex/homeComponentSystemConfig.ts` và schema**
   - Tái sử dụng hoàn toàn `hiddenTypes` hiện có để giảm rủi ro, rollback dễ.

## Counter-Hypothesis đã loại trừ
- Có thể định nghĩa “không dùng” theo `active=false` toàn bộ item, nhưng user đã chốt rõ: **count=0**.
- Có thể thêm mutation mới ở backend để hide unused trực tiếp, nhưng chưa cần thiết vì frontend đã đủ dữ liệu + mutation set visibility đã có.

## Verification Plan
- **Static review**:
  - Kiểm tra type-safety cho map count, null/undefined khi `stats` chưa load.
  - Đảm bảo `hiddenTypes` union không trùng lặp.
  - Đảm bảo không ảnh hưởng các action hiện có.
- **Typecheck**:
  - Chạy `bunx tsc --noEmit` (theo rule repo, vì có đổi code TS/TSX).
- **Repro thủ công (tester)**:
  1. Vào `/system/home-components`, xác nhận thấy badge `Chưa dùng` cho type count=0.
  2. Bấm `Ẩn type chưa dùng` -> toast success.
  3. Vào `/admin/home-components/create`, xác nhận các type count=0 đã bị ẩn.
  4. Type có count>0 vẫn hiển thị bình thường.

Nếu anh duyệt spec này, em sẽ triển khai đúng phạm vi trên và commit thay đổi.