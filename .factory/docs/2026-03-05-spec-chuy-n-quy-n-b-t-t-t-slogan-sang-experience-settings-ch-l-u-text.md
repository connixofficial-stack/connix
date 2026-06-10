## Problem Graph
1. [Main] Đồng bộ đúng ý bạn: `/admin/settings` chỉ quản lý text slogan, còn bật/tắt nằm ở `/system/experiences/menu` <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `/admin/settings` vẫn đang dùng key `topbar_slogan_enabled` để disable input
   1.2 [Sub] `/system/experiences/menu` hiện cho phép edit text slogan (không đúng yêu cầu read-only)
   1.3 [Sub] Runtime header vẫn có fallback bật/tắt từ settings thay vì chỉ từ experience

## Execution (with reflection)
1. Gỡ quyền bật/tắt khỏi `/admin/settings`
   - File: `app/admin/settings/page.tsx`
   - Thay đổi:
     - Xóa logic `sloganEnabled`/`isSloganDisabled` đang dựa trên `form.topbar_slogan_enabled`.
     - Input `topbar_slogan` luôn editable trong admin (vì admin chỉ lưu text nguồn).
   - Reflection: ✓ Khớp yêu cầu “admin chỉ lưu text”.

2. Loại `topbar_slogan_enabled` khỏi danh sách field settings (không render ở admin)
   - Files:
     - `convex/seed.ts`
     - `convex/seeders/settings.seeder.ts`
   - Thay đổi:
     - Bỏ record settings key `topbar_slogan_enabled`.
     - Bỏ field config `topbar_slogan_enabled` trong module fields.
   - Reflection: ✓ “Bỏ hẳn, không dùng nữa” đúng lựa chọn bạn đã chốt.

3. Chuyển `/system/experiences/menu` thành nơi duy nhất điều khiển bật/tắt
   - File: `app/system/experiences/menu/page.tsx`
   - Thay đổi:
     - Giữ `ToggleRow` `Slogan topbar` (source of truth).
     - Sửa field “Nội dung slogan” thành input disabled/read-only, value lấy trực tiếp từ settings (`topbar_slogan`), bỏ `onChange` edit.
     - Bỏ state/logic edit `config.topbar.slogan`; chỉ dùng `config.topbar.sloganEnabled` cho trải nghiệm.
     - Khi save: chỉ persist `topbar.sloganEnabled` vào `header_config.topbar` (không persist slogan text tại experience).
   - Reflection: ✓ Đúng yêu cầu “experiences chỉ xem text, không edit”.

4. Cập nhật rule preview trong experience
   - File: `app/system/experiences/menu/page.tsx`
   - Thay đổi:
     - `effectiveSlogan = settings.topbar_slogan.trim()`
     - `effectiveSloganEnabled = config.topbar.sloganEnabled ?? true`
     - Truyền vào preview config để render.
     - Nếu text rỗng thì preview ẩn slogan dù toggle ON.
   - Reflection: ✓ Khớp rule empty-state bạn chọn.

5. Cập nhật runtime site header
   - File: `components/site/Header.tsx`
   - Thay đổi:
     - Text slogan luôn lấy từ `settings.topbar_slogan`.
     - Bật/tắt slogan chỉ lấy từ `header_config.topbar.sloganEnabled` (default true nếu chưa có).
     - Không đọc `settings.topbar_slogan_enabled` nữa.
   - Reflection: ✓ Tách vai trò rõ: admin=text, experience=toggle.

6. Giữ preview ở cả 3 layout
   - File: `components/experiences/previews/HeaderMenuPreview.tsx`
   - Thay đổi: không đổi cấu trúc render chính; chỉ đảm bảo input từ bước 4 vẫn điều khiển `classic + topbar + allbirds`.
   - Reflection: ✓ Đúng acceptance đã chốt trước đó.

7. Verification + commit
   - Chạy: `bunx tsc --noEmit`.
   - Smoke test:
     - `/admin/settings`: có `topbar_slogan` text, không có toggle bật/tắt slogan.
     - `/system/experiences/menu`: có toggle slogan + ô text read-only từ settings.
     - Toggle OFF => ẩn slogan cả preview/site; toggle ON + text rỗng => vẫn ẩn.
   - Commit local và include `.factory/docs` theo rule repo.

## Checklist acceptance
- [ ] `/admin/settings` chỉ còn quản lý text slogan.
- [ ] Không còn `topbar_slogan_enabled` ở admin/settings contract.
- [ ] `/system/experiences/menu` có toggle bật/tắt slogan.
- [ ] “Nội dung slogan” ở experience là read-only, load từ settings.
- [ ] Nếu text rỗng thì slogan luôn ẩn.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Có commit local, không push.