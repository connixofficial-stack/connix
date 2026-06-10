Chuẩn, mình bổ sung yêu cầu bulk action vào spec như sau.

## Problem Graph
1. [Main] Chuẩn hoá `/system/home-components` thành table quản trị nhanh, 1 khối duy nhất <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] UI đang tách 2 card, chưa đúng mô hình records/table
   1.2 [ROOT CAUSE] Thiếu thao tác bulk cho các record đã chọn
   1.3 [ROOT CAUSE] Hero edit chưa đồng bộ vị trí + behavior custom theo system + CoC secondary

## Execution (with reflection)
1. Refactor `/system/home-components` về 1 bảng records
- **File**: `app/system/home-components/page.tsx`
- Bỏ layout tách “Hiển thị ở create” và “Chế độ màu custom (Pilot)”
- Dùng 1 table duy nhất với cột:
  - `STT`
  - `Tên home-component`
  - `Action`
- Mỗi row có checkbox chọn record.
- Reflection: ✓ Đúng yêu cầu table-first, dễ scan dữ liệu.

2. Action per-row đúng 2 thao tác
- **File**: `app/system/home-components/page.tsx`
- Trong cột Action, mỗi row có 2 toggle:
  - Toggle A: `Ẩn/Hiện` trên `/admin/home-components/create`
  - Toggle B: `System/Custom` cho nguồn màu của component đó
- Scope pilot màu thực thi cho Hero; các type khác giữ trạng thái disabled/read-only “chưa hỗ trợ” để tránh hiểu nhầm.
- Reflection: ✓ Khớp yêu cầu “chỉ bảng + action là đủ, không chỉnh màu ở system”.

3. Bổ sung bulk actions cho record đã chọn (yêu cầu mới)
- **File**: `app/system/home-components/page.tsx`
- Ở đầu bảng (toolbar phía trên header cột), thêm **2 bulk action** áp dụng cho `selectedRows`:
  - Bulk 1: `Ẩn đã chọn` (set hiddenTypes)
  - Bulk 2: `Bật custom đã chọn` (set custom enabled)
- Nút disabled khi chưa chọn record nào.
- Giữ selected count để admin thấy phạm vi thao tác.
- Reflection: ✓ Đúng yêu cầu thao tác nhanh với selected records.

4. Hero edit: đặt khối custom sát preview + ẩn khi system OFF
- **File**: `app/admin/home-components/hero/[id]/edit/page.tsx`
- Di chuyển block “Màu custom cho Hero” sang cột preview (ngay trên preview).
- Nếu Hero đang ở `System` từ `/system/home-components`:
  - Ẩn block custom trong Hero edit.
  - Hero dùng màu hệ thống hoàn toàn.
- Nếu Hero ở `Custom`:
  - Hiển thị block custom và cho chỉnh như hiện tại.
- Reflection: ✓ Khớp góp ý vị trí và hành vi ẩn trong admin.

5. CoC: Single -> Dual auto gợi ý secondary đẹp
- **File**: `app/admin/home-components/hero/[id]/edit/page.tsx`
- Khi chuyển mode `single -> dual`:
  - Auto secondary bằng **analogous(+30°)** từ primary.
  - Nếu `deltaE < 20`, fallback complementary để đảm bảo tách biệt.
- Chỉ auto tại thời điểm chuyển mode; nếu admin tự sửa secondary thì giữ nguyên.
- Reflection: ✓ Convention over Configuration, giảm thao tác tay.

6. Dữ liệu/config giữ nguyên kiến trúc hiện tại
- **Files**:
  - `convex/homeComponentSystemConfig.ts` (chỉ chỉnh nhẹ nếu cần cho bulk/system-custom)
  - `app/admin/home-components/create/page.tsx` (giữ filter hiddenTypes như đang chạy tốt)
- Không thêm schema mới, vẫn dùng settings group `home_components`.
- Reflection: ✓ KISS, không phá tương thích.

7. Verify
- `bunx tsc --noEmit`
- Check tay:
  - Table 1 khối, có checkbox + 2 bulk actions ở đầu bảng
  - Row action chạy đúng 2 toggle
  - Bulk action chỉ áp dụng selected rows
  - Hero System => custom block ẩn khỏi Hero edit
  - Hero Custom => custom block hiện sát preview
  - Single -> Dual auto secondary theo analogous + guard

## File dự kiến sửa
- `app/system/home-components/page.tsx`
- `app/admin/home-components/hero/[id]/edit/page.tsx`
- (Có thể) `convex/homeComponentSystemConfig.ts`

## Checklist chốt
- [ ] Trang `/system/home-components` chỉ còn 1 table records
- [ ] Cột gồm STT / Tên home-component / Action
- [ ] Mỗi row có 2 toggle: Ẩn/Hiện + System/Custom
- [ ] Có checkbox chọn record
- [ ] Có đúng 2 bulk actions cho selected records ở đầu bảng
- [ ] Không còn chỉnh màu/mode trực tiếp tại system page
- [ ] Hero edit: block custom sát preview
- [ ] Hero edit: block custom ẩn khi system toggle = OFF
- [ ] Single -> Dual auto secondary theo Analogous + deltaE guard
- [ ] `bunx tsc --noEmit` pass