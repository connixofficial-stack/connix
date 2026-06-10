## Problem Graph
1. [Main] Tạo trung tâm quản trị Home Components tại `/system/home-components` <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Thiếu nơi cấu hình tập trung cho catalog Home Component (ẩn/hiện ở create)
   1.2 [ROOT CAUSE] Chưa có cơ chế override màu theo component type (khác `/admin/settings`)
   1.3 [Sub] Chưa có kết nối runtime giữa System config và Admin create/edit
   1.4 [Sub] Chưa có reset-default khi seed/module enable để đảm bảo “full hiện”

## Execution (with reflection)
1. Solving 1.1.1 — Data contract cho Home Component System Config
- **File tạo mới**: `convex/homeComponentSystemConfig.ts`
- **Dùng settings table hiện tại** (không đổi schema):
  - `group: "home_components"`, `key: "create_hidden_types"`, `value: string[]`
  - `group: "home_components"`, `key: "type_color_overrides"`, `value: Record<string, { enabled: boolean; mode: 'single'|'dual'; primary: string; secondary: string }>`
- Query/mutation:
  - `getConfig()` trả object đã normalize (missing => default full/không custom)
  - `setCreateVisibility({ hiddenTypes })`
  - `setTypeColorOverride({ type, enabled, mode, primary, secondary })` (pilot dùng type=`Hero`)
  - `bulkSetTypeColorOverride({ types, enabled })` (chỉ apply type được hỗ trợ custom; giai đoạn này: Hero)
- Validate màu theo skill dual-brand-color-system:
  - single => secondary resolve = primary (monochromatic)
  - dual => secondary invalid thì fallback safe
- Reflection: ✓ Không ảnh hưởng dữ liệu homeComponents hiện có, mở rộng tốt cho các type sau.

2. Solving 1.1.2 — Trang `/system/home-components` + điều hướng sidebar system
- **File tạo mới**: `app/system/home-components/page.tsx`
- **File sửa**: `app/system/layout.tsx`
  - Thêm menu sidebar: `/system/home-components`
  - Cập nhật `getPageName()` để hiển thị đúng tiêu đề
- **File sửa**: `app/system/i18n/translations.ts`
  - Thêm label sidebar/page title cho Home Components
- UI trang system:
  - Danh sách tất cả `COMPONENT_TYPES` (reuse từ `app/admin/home-components/create/shared.tsx` để tránh lệch)
  - Cột `Hiện ở Create` + toggle từng dòng
  - Bulk action: `Hiện tất cả`, `Ẩn các mục đã chọn`
  - Khối pilot Hero:
    - Toggle `Bật màu custom cho Hero`
    - Chọn mode `single|dual`
    - Color picker `primary`, `secondary` (secondary disable khi single)
    - Preview swatch và cảnh báo basic nếu màu quá gần
- Reflection: ✓ Đúng yêu cầu “gom 1 chỗ”, vẫn KISS vì chỉ pilot custom sâu cho Hero.

3. Solving 1.3 — Kết nối vào `/admin/home-components/create` (ẩn UI, không block chức năng)
- **File sửa**: `app/admin/home-components/create/page.tsx`
- Lấy config từ `api.homeComponentSystemConfig.getConfig`
- Filter card list theo `hiddenTypes`
- Chỉ ẩn card UI tại trang create; route trực tiếp `/admin/home-components/create/[type]` vẫn hoạt động bình thường.
- Reflection: ✓ Đúng yêu cầu “không block chức năng, chỉ ẩn UI”.

4. Solving 1.3 — Pilot Hero edit dùng custom màu theo type
- **File sửa**: `app/admin/home-components/hero/[id]/edit/page.tsx`
- Lấy `type_color_overrides.Hero`
- Resolve màu hiệu lực:
  - Nếu custom enabled: dùng màu/mode Hero override
  - Nếu custom off: dùng hệ thống (`useBrandColors` từ settings)
- Thêm toggle trong màn edit Hero:
  - `Dùng màu custom cho Hero` (ON => cấu hình riêng, OFF => theo hệ thống)
  - Cho phép chỉnh mode single/dual + màu khi custom ON
- Save logic:
  - Save component data như cũ (`homeComponents.update`)
  - Save override config qua `homeComponentSystemConfig.setTypeColorOverride`
- Reflection: ✓ Đúng yêu cầu “ở edit có toggle dùng chung hệ thống hay custom riêng”.

5. Solving 1.4 — Default full khi module/seed wizard
- **File sửa**: `components/data/SeedWizardDialog.tsx`
  - Khi hoàn tất wizard: set `create_hidden_types = []`, reset `type_color_overrides` về default (Hero custom off)
- **File sửa**: `convex/admin/modules.ts`
  - Khi bật module `homepage` (`enabled=true`): ensure `create_hidden_types=[]` (admin full, không ẩn)
- Reflection: ✓ Đảm bảo đúng yêu cầu mặc định tương lai khi mở module hoặc chạy seed wizard.

6. Verify & quality gate
- Chạy typecheck: `bunx tsc --noEmit`
- Test tay luồng chính:
  - `/system/home-components`: toggle 1 + bulk ẩn/hiện
  - `/admin/home-components/create`: list ẩn/hiện đúng
  - Hero edit: bật custom -> đổi mode/màu -> preview đổi theo
  - Hero edit: tắt custom -> quay về màu hệ thống
  - Seed wizard/module homepage enable -> create list full hiện lại

## File dự kiến thay đổi
- `convex/homeComponentSystemConfig.ts` (new)
- `app/system/home-components/page.tsx` (new)
- `app/system/layout.tsx`
- `app/system/i18n/translations.ts`
- `app/admin/home-components/create/page.tsx`
- `app/admin/home-components/hero/[id]/edit/page.tsx`
- `components/data/SeedWizardDialog.tsx`
- `convex/admin/modules.ts`

## Checklist chốt (dễ verify)
- [ ] Có menu `/system/home-components` trong sidebar system
- [ ] Có toggle đơn + bulk để ẩn/hiện type ở create
- [ ] `/admin/home-components/create` chỉ ẩn UI, không chặn route trực tiếp
- [ ] Hero có custom override theo type + toggle về dùng màu hệ thống
- [ ] Single mode luôn monochromatic (secondary=primary)
- [ ] Seed wizard + bật homepage module => admin full (không ẩn)
- [ ] `bunx tsc --noEmit` pass

Nếu bạn duyệt spec này, mình sẽ implement đúng phạm vi trên (pilot Hero, lưu theo type, menu system riêng).