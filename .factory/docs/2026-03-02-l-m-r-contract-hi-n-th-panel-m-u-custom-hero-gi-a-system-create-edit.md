## Problem Graph
1. [Main] Panel `Màu custom Hero` bị ẩn ở Edit khi tắt custom trong Create.
   1.1 [ROOT CAUSE] Đang dùng chung 1 cờ `enabled` cho **2 nghĩa khác nhau**: (a) quyền hiển thị panel từ `/system/home-components`, (b) trạng thái ON/OFF custom tại create/edit.
   1.2 Edit Hero hiện check `showCustomBlock = Boolean(typeColorOverrides.Hero?.enabled)`, nên khi create lưu `enabled=false` thì panel biến mất.

## Contract đã chốt theo yêu cầu của bạn
- Nếu `/system/home-components` bật Hero custom thì:
  - Create Hero: luôn hiện cụm `Màu custom Hero`.
  - Edit Hero: luôn hiện cụm `Màu custom Hero`.
- Toggle OFF trong create/edit chỉ làm preview dùng màu system settings, **không được làm mất cụm UI**.

## Option A - Vá nhanh (không đổi schema)
1. `app/admin/home-components/hero/[id]/edit/page.tsx`
   - Đổi điều kiện `showCustomBlock` từ `override.enabled` sang `override tồn tại` (hoặc cờ tương đương chỉ đọc system).
2. `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`
   - Đổi `showCustomBlock` để không phụ thuộc `customState.enabled`.
3. `app/admin/home-components/create/hero/page.tsx`
   - Bỏ render tay `TypeColorOverrideCard`, dùng contract thống nhất qua wrapper + `useTypeColorOverrideState` đã có.
4. Verify logic preview:
   - OFF => `effectiveColors` phải fallback `system settings` realtime.
   - ON => dùng custom Hero.

**Nhược điểm**: Không tách nghĩa system-vs-runtime triệt để; có thể còn góc mơ hồ khi tắt ở trang System.

## Option B - Chuẩn hóa tách 2 cờ (Khuyến nghị)
1. `convex/homeComponentSystemConfig.ts`
   - Tách rõ:
     - `systemEnabled` (quyền hiển thị panel do `/system/home-components` quản lý)
     - `enabled` (runtime ON/OFF custom tại create/edit)
   - Cập nhật `getConfig`, `setTypeColorOverride`, `bulkSetTypeColorOverride` tương ứng.
2. `app/system/home-components/page.tsx`
   - Nút Custom/System chỉ đổi `systemEnabled` (không đụng runtime `enabled`).
3. `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`
   - `showCustomBlock = isSupportedType && systemEnabled`.
   - `effectiveColors` vẫn dựa trên runtime `enabled` (OFF => system colors).
4. `app/admin/home-components/hero/[id]/edit/page.tsx`
   - Dùng `useTypeColorOverrideState('Hero')` như create pages để bỏ state local trùng lặp, đảm bảo 1 nguồn dữ liệu.
5. `app/admin/home-components/create/hero/page.tsx`
   - Đồng bộ theo wrapper contract (không render card riêng), tránh double-submit `setTypeColorOverride`.
6. Chạy kiểm tra: `bunx --no-install tsc --noEmit`.

**Ưu điểm**: Đúng intent lâu dài, không tái diễn lỗi coupling create/edit/system.

## Checklist nghiệm thu
- [ ] System bật Hero custom => Create/Edit Hero luôn thấy panel.
- [ ] Tắt toggle custom trong Create/Edit => panel vẫn còn, preview dùng màu system.
- [ ] Bật lại toggle => preview quay về màu custom Hero.
- [ ] Không ảnh hưởng component type khác.

Nếu bạn đồng ý, mình triển khai theo **Option B (khuyến nghị)**.