Bạn đúng, mình đã hiểu sai ý ở bản trước.

## Mục tiêu chốt lại
- Create (ví dụ Hero) khi mở lần đầu: **preview mặc định theo Settings**.
- **Không lock toggle/card custom** (vẫn bật/tắt/chỉnh được ngay).
- Nếu user bật custom khi type=0: preview đổi ngay và submit **lưu override ngay lần tạo đầu tiên**.

## Root cause hiện tại
- Mình đã thêm `lockCustomUntilTypeHasData` + `isCreateCustomLocked` vào `useTypeColorOverrideState` và dùng nó để:
  - ép `effectiveColors` fallback Settings,
  - disable card,
  - chặn `setTypeColorOverride` lúc submit create.
=> Đây là phần cần rollback có kiểm soát.

## Kế hoạch fix (tối thiểu, đúng scope)
1) **Rollback logic lock trong hook**
- File: `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`
- Thay đổi:
  - Bỏ `TypeColorOverrideOptions`, `lockCustomUntilTypeHasData`, query `listByType`, `isCreateCustomLocked`.
  - Khôi phục `effectiveColors` về contract chuẩn:
    - `showCustomBlock && customState.enabled` => dùng custom,
    - ngược lại fallback Settings.
  - Không expose `isCreateCustomLocked` nữa.

2) **Rollback wrapper create về hành vi không lock**
- File: `app/admin/home-components/create/shared.tsx`
- Thay đổi:
  - `useBrandColors(type)` quay lại `useTypeColorOverrideState(type).effectiveColors`.
  - `ComponentFormWrapper` bỏ prop `isCreateCustomLocked`.
  - `handleFormSubmit` bỏ điều kiện chặn, tức là nếu `showCustomBlock` thì vẫn gọi `setTypeColorOverride` như trước.
  - `TypeColorOverrideCard` bỏ `disabled` forced và bỏ dòng hint “Tạo ít nhất 1 component...”.

3) **Rollback wiring ở toàn bộ create pages (30 types)**
- Scope: tất cả file dưới `app/admin/home-components/create/**` (gồm `create/product-list/_shared.tsx`).
- Thay đổi đồng loạt:
  - Bỏ option `{ lockCustomUntilTypeHasData: true }` khi gọi `useTypeColorOverrideState(...)`.
  - Bỏ destructure `isCreateCustomLocked`.
  - Bỏ prop `isCreateCustomLocked={...}` truyền vào `ComponentFormWrapper`.

## Verify checklist
A. `/admin/home-components/create/hero` khi chưa có Hero:
- card custom vẫn thao tác được (toggle/mode/color).
- mặc định ban đầu nhìn theo Settings (khi enabled=false).

B. Type=0, user bật custom rồi submit create:
- override được lưu ngay lần tạo đầu.
- reload create Hero thấy trạng thái/màu custom đúng theo override.

C. Type đã có data:
- hành vi create giữ nguyên như contract hiện tại (không regression).

D. Kỹ thuật:
- chạy `bunx --no-install tsc --noEmit` pass.

## Git
- Stage đúng file + `.factory/docs`.
- Commit local (không push), message gợi ý:
  - `fix(home-components): restore create custom toggle behavior`