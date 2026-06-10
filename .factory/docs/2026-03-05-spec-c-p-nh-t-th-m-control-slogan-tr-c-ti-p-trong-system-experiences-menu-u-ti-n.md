## Problem Graph
1. [Main] Bạn không thấy toggle/input slogan ở `/system/experiences/menu` vì hiện trạng chỉ consume từ `/admin/settings` <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] UI config menu chưa có control `slogan` + `sloganEnabled`
   1.2 [Sub] Luồng save `header_config` chưa ghi rõ quyền ưu tiên experience cho slogan
   1.3 [Sub] Cần rule fallback rõ ràng để tránh xung đột với `/admin/settings`

## Execution (with reflection)
1. Cập nhật schema config cho menu experience
   - File: `app/system/experiences/menu/page.tsx`
   - Thay đổi:
     - Bổ sung vào `DEFAULT_CONFIG.topbar`:
       - `sloganEnabled: true`
       - `slogan: ''`
     - Khi dựng `serverConfig`, merge `raw?.topbar` như hiện tại để đọc được dữ liệu đã lưu trong `header_config`.
   - Reflection: ✓ Đảm bảo state config có field để bind vào UI controls.

2. Thêm controls trực tiếp trong panel “Topbar & Search” của `/system/experiences/menu`
   - File: `app/system/experiences/menu/page.tsx`
   - Thay đổi:
     - Thêm `ToggleRow` mới: `label="Slogan topbar"` -> bind `config.topbar.sloganEnabled ?? true`.
     - Thêm `Input` mới cho text slogan -> bind `config.topbar.slogan ?? ''`.
     - Disable input khi toggle OFF.
   - Reflection: ✓ Đúng yêu cầu mới: có toggle + input ngay trong experience UI.

3. Áp dụng rule ưu tiên “hệ thống trải nghiệm”
   - File: `app/system/experiences/menu/page.tsx`
   - Thay đổi logic resolve preview:
     - `effectiveSloganEnabled = config.topbar.sloganEnabled ?? settingsTopbarSloganEnabled`
     - `effectiveSlogan = (config.topbar.slogan ?? '').trim() || settingsTopbarSlogan`
     - Truyền `effectiveSloganEnabled/effectiveSlogan` vào `previewConfig.topbar`.
   - File: `components/site/Header.tsx`
   - Thay đổi logic runtime site:
     - Khi đọc `header_config.topbar`, nếu có `slogan/sloganEnabled` thì dùng giá trị này trước.
     - Chỉ fallback về `/admin/settings` khi `header_config` thiếu hoặc rỗng.
   - Reflection: ✓ Khớp yêu cầu bạn: ưu tiên Experience.

4. Giữ preview hiển thị ở cả 3 layout
   - File: `components/experiences/previews/HeaderMenuPreview.tsx`
   - Trạng thái hiện đã render slogan cho `classic`, `topbar`, `allbirds`; giữ nguyên.
   - Chỉ rà soát lại điều kiện:
     - hiện khi `topbar.show && sloganEnabled && slogan.trim() !== ''`
     - mobile truncate 1 dòng.
   - Reflection: ✓ Đảm bảo đúng acceptance “cả 3 layout”.

5. Save behavior và tương thích dữ liệu cũ
   - File: `app/system/experiences/menu/page.tsx`
   - Thay đổi:
     - Trong `handleSave`, đảm bảo `configToSave.topbar` luôn chứa `sloganEnabled` và `slogan`.
     - Nếu toggle OFF vẫn giữ text slogan để bật lại không mất dữ liệu.
   - Reflection: ✓ UX tốt, tránh mất nội dung người dùng đã nhập.

6. Verification + commit
   - Chạy `bunx tsc --noEmit`.
   - Manual smoke:
     - `/system/experiences/menu`: thấy toggle + input, đổi giá trị preview cập nhật realtime.
     - Save xong F5 vẫn giữ.
     - Site header theo giá trị experience; nếu bỏ trống thì fallback settings.
   - Commit theo convention, include `.factory/docs`.

## Checklist acceptance
- [ ] `/system/experiences/menu` có **Toggle + Input** cho slogan topbar.
- [ ] Preview slogan hoạt động ở **classic + topbar + allbirds**.
- [ ] Nguồn dữ liệu slogan ưu tiên `header_config.topbar` (experience) hơn `/admin/settings`.
- [ ] Fallback về settings khi experience chưa set slogan.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Có commit local, không push.