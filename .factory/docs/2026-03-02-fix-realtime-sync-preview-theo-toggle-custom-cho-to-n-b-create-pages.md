## Problem Graph
1. [Main] Toggle Custom OFF ở create pages chưa làm preview fallback realtime về `/admin/settings` <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] `ComponentFormWrapper` giữ `customState` riêng, còn mỗi create page lại đọc màu qua `useBrandColors('Type')` (hook instance khác) => 2 state tách rời.
   1.2 `setTypeColorOverride` chỉ chạy lúc submit nên preview trước submit không nhận state mới từ wrapper.

## Goal
- Khi bật/tắt hoặc đổi màu trong card custom: preview phải đổi realtime ngay trong cùng trang create.
- OFF => preview fallback system colors ngay lập tức.
- ON => preview dùng custom riêng của đúng type, độc lập giữa các type.

## Implementation Plan
1) Chuẩn hoá nguồn màu duy nhất tại create page (single source of truth)
- Mỗi create page tự gọi `useTypeColorOverrideState(COMPONENT_TYPE)` để lấy:
  - `customState`, `effectiveColors`, `showCustomBlock`, `setCustomState`, `systemColors`.
- Không dùng `useBrandColors('Type')` cho preview nữa.

2) Truyền custom state/control từ page xuống wrapper
- Mở rộng `ComponentFormWrapper` props (optional):
  - `customState`, `showCustomBlock`, `setCustomState`, `systemColors`.
- Nếu props được truyền vào => wrapper dùng props đó (không tự tạo hook state nội bộ).
- Nếu không truyền => giữ backward compatibility (wrapper tự dùng hook như hiện tại).

3) Đồng bộ submit contract trong wrapper
- Dùng đúng state nhận từ page để persist:
  - ON => ghi custom.
  - OFF => ghi system colors.
- Giữ guard type hợp lệ.

4) Rollout toàn bộ create pages
- Cập nhật tất cả `app/admin/home-components/create/*/page.tsx` (kể cả file dùng shared như `product-list/_shared.tsx`):
  - thêm `const COMPONENT_TYPE = 'X'`;
  - lấy `effectiveColors` từ `useTypeColorOverrideState(COMPONENT_TYPE)`;
  - truyền state/control vào `ComponentFormWrapper`;
  - preview đọc từ `effectiveColors`.
- Đảm bảo những file vừa thay đổi ngoài (`speed-dial/services/product-grid/clients`) cũng theo cùng contract.

5) Verification matrix (logic)
- Với từng page create tiêu biểu: Stats, CTA, Services, ProductGrid, Clients
  - Toggle OFF: preview đổi ngay về system colors (không chờ submit).
  - Toggle ON + đổi màu: preview đổi ngay theo custom.
  - Type A không ảnh hưởng Type B.

6) Validate + commit
- Chạy `bunx --no-install tsc --noEmit`.
- Commit kèm `.factory/docs` theo rule.

## Files trọng tâm
- `app/admin/home-components/create/shared.tsx`
- `app/admin/home-components/create/*/page.tsx`
- `app/admin/home-components/create/product-list/_shared.tsx`
- (không cần đổi backend resolver thêm cho bug realtime này, vì đã fix ở commit trước)

## Done criteria
- Ở `/admin/home-components/create/stats`, OFF là preview fallback ngay lập tức.
- Tất cả create pages có behavior realtime tương tự.
- Typecheck pass, không regress flow submit.