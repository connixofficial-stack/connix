## Problem Graph
1. [Main] Site render Hero chưa dùng custom color từ hệ thống Home Components <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] `components/site/ComponentRenderer.tsx` chỉ dùng `useBrandColors()` toàn cục (site settings), không đọc `homeComponentSystemConfig.typeColorOverrides` theo type
   1.2 [Sub] Hero edit UI còn verbose ở phần info màu trong preview

## Root-cause đã xác nhận
- `HomePageClient` render bằng `api.homeComponents.listActive` -> `ComponentRenderer`.
- Trong `ComponentRenderer`, mọi type (bao gồm Hero) lấy màu từ `useBrandColors()` (global settings), **không có nhánh đọc override Hero** từ `api.homeComponentSystemConfig.getConfig`.
- Vì vậy: preview/edit dùng custom đúng, nhưng site render vẫn theo global color => mismatch.

## Execution (with reflection)
1. Đồng bộ nguồn màu cho site render Hero theo override system
- **File**: `components/site/ComponentRenderer.tsx`
- Thêm query `useQuery(api.homeComponentSystemConfig.getConfig)` trong `ComponentRenderer`.
- Resolve màu hiệu lực cho Hero:
  - Nếu `typeColorOverrides.Hero.enabled = true` -> dùng override (`primary`, `secondary`, `mode`).
  - Nếu `enabled = false` hoặc chưa có -> fallback `useBrandColors()` hiện tại.
- Chỉ áp dụng cho `type === 'Hero'`, các type khác giữ nguyên behavior hiện có (KISS).
- Reflection: ✓ Fix đúng root-cause, không lan rộng phạm vi ngoài Hero.

2. Chuẩn hoá resolve secondary theo CoC cho site (tránh runtime sai màu)
- **File**: `components/site/ComponentRenderer.tsx`
- Khi mode single => secondary = primary.
- Khi mode dual mà secondary invalid/rỗng => fallback như logic hiện có (ưu tiên ổn định runtime).
- Reflection: ✓ Đồng bộ với rule đang dùng ở admin/edit.

3. Tối giản mạnh UI “Màu custom cho Hero” ở edit
- **File**: `app/admin/home-components/hero/[id]/edit/page.tsx`
- Giữ block custom sát preview (đã đúng), nhưng làm gọn:
  - Giảm text mô tả thừa.
  - Ẩn các dòng verbose kiểu “Màu chính: #... / Màu phụ: #... / Màu phụ áp dụng cho...”.
- Nguồn gây verbose hiện nằm ở preview info panel.

4. Thay vị trí info màu bằng panel gọn (khi custom bật)
- **Files**:
  - `app/admin/home-components/hero/_components/HeroPreview.tsx`
  - `app/admin/home-components/_shared/components/ColorInfoPanel.tsx`
- Thay phần info màu hiện tại trong HeroPreview bằng `ColorInfoPanel` bản gọn:
  - Chỉ còn swatch + nhãn rất ngắn, bỏ đoạn mô tả dài.
  - Khi custom OFF ở system -> panel không render (vì block custom đã ẩn theo logic hiện tại).
- Reflection: ✓ UI ngắn gọn, ít chữ như yêu cầu.

5. Verify
- `bunx tsc --noEmit`
- Test tay:
  - Bật custom Hero ở `/system/home-components` -> đổi màu ở Hero edit -> site homepage Hero đổi theo đúng custom.
  - Tắt custom Hero ở `/system/home-components` -> Hero edit ẩn block custom, site quay lại màu hệ thống.
  - Preview vẫn khớp site render.

## File dự kiến sửa
- `components/site/ComponentRenderer.tsx` (fix root cause chính)
- `app/admin/home-components/hero/_components/HeroPreview.tsx` (rút gọn info màu)
- `app/admin/home-components/_shared/components/ColorInfoPanel.tsx` (compact variant)
- `app/admin/home-components/hero/[id]/edit/page.tsx` (cleanup text nhỏ nếu còn dư)

## Checklist chốt
- [ ] Site Hero render đúng màu custom khi Hero custom bật
- [ ] Site Hero fallback đúng màu hệ thống khi custom tắt
- [ ] Không còn mismatch Preview vs Site cho Hero color
- [ ] Khối màu custom ở Hero edit gọn, ít chữ
- [ ] `bunx tsc --noEmit` pass