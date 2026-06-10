## Problem Graph
1. [Main] Topbar cần slogan quản trị từ `/admin/settings` và có toggle bật/tắt, đồng bộ preview + site <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Chưa có settings key cho slogan + toggle trong data contract của module settings
   1.2 [Sub] `/admin/settings` chưa render input + switch cho 2 key mới
   1.3 [Sub] `/system/experiences/menu` chưa đọc/preview slogan từ settings (consume-only)
   1.4 [Sub] `components/site/Header.tsx` chưa render slogan slot theo rule desktop/mobile + empty-state

## Execution (with reflection)
1. Solving 1.1.1 – Mở rộng settings contract (ROOT CAUSE)
   - Thought: Theo CoC của repo, key mới nên đi qua module config để `/admin/settings` tự render theo fieldsData.
   - Action:
     - Cập nhật `lib/modules/configs/settings.config.ts`:
       - Thêm field `topbar_slogan_enabled` (type: boolean/toggle, group: `site`, default: true, label rõ nghĩa).
       - Thêm field `topbar_slogan` (type: text, group: `site`, default: chuỗi branding mẫu user đã nêu).
       - Gắn order gần các field branding để dễ quản trị.
     - Cập nhật seeder nếu cần (`convex/seeders/settings.seeder.ts`) để đảm bảo instance mới có key mặc định.
   - Reflection: ✓ Đúng KISS/YAGNI: chỉ thêm 2 key cần thiết, không tạo group mới.

2. Solving 1.2 – Hiển thị và lưu ở `/admin/settings`
   - Thought: Page settings đã có cơ chế generic render theo `fieldsData`, ưu tiên tái dùng thay vì custom form riêng.
   - Action:
     - Rà logic render trong `app/admin/settings/page.tsx` để xác nhận field boolean + text đã được hỗ trợ.
     - Nếu chưa hỗ trợ toggle boolean chuẩn UX, bổ sung nhánh render tối thiểu cho type boolean/switch.
     - Thêm guard UX nhỏ: khi `topbar_slogan_enabled = false` thì disable input `topbar_slogan` (không xoá dữ liệu).
   - Reflection: ✓ DRY: tận dụng pipeline save hiện có (`setMultiple`), không tạo API mới.

3. Solving 1.3 – Đồng bộ preview `/system/experiences/menu`
   - Thought: User muốn manage tại `/admin/settings`, nên trang experience chỉ đọc settings và render preview đúng thực tế.
   - Action:
     - Tại `app/system/experiences/menu/page.tsx`:
       - Query thêm 2 key settings bằng `api.settings.getByKey` hoặc lấy từ list hiện có (ưu tiên cách ít query hơn nếu đã có batch phù hợp).
       - Tạo giá trị resolved:
         - `resolvedTopbarSloganEnabled` (default true nếu chưa có key).
         - `resolvedTopbarSlogan` (trim string, fallback rỗng).
       - Truyền vào `HeaderMenuPreview` như phần của config/topbar runtime (consume-only, không tạo control mới ở trang này theo quyết định user).
   - Reflection: ✓ Đúng yêu cầu “toggle ở /admin/settings”, tránh trùng điểm cấu hình.

4. Solving 1.4 – Render ở site header + preview với layout rule đã chốt
   - Thought: Cần parity preview/site và không phá luồng hotline/email/actions hiện có.
   - Action:
     - Cập nhật type `HeaderMenuConfig` tại `components/experiences/previews/HeaderMenuPreview.tsx` (và nơi share type nếu có):
       - `topbar.sloganEnabled?: boolean`
       - `topbar.slogan?: string`
     - Cập nhật preview topbar render trong `HeaderMenuPreview.tsx`:
       - Điều kiện hiển thị slogan: `topbar.show && sloganEnabled && slogan.trim() !== ''`.
       - Desktop: slogan ở giữa; hotline/email giữ trái; actions giữ phải.
       - Mobile: slogan 1 dòng `truncate`.
       - Nếu toggle OFF hoặc slogan rỗng: ẩn hẳn slogan slot (không để khoảng trắng thừa).
     - Cập nhật site runtime `components/site/Header.tsx` y hệt logic trên để đảm bảo parity.
   - Reflection: ✓ Bám đúng acceptance: ẩn hẳn khi OFF/empty, không thêm animation/marquee.

5. Solving verification + commit flow theo rule repo
   - Thought: Rule dự án yêu cầu chỉ chạy TypeScript check khi có thay đổi code/TS.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Smoke check nhanh 3 route:
       - `/admin/settings` (sửa slogan + toggle, lưu thành công)
       - `/system/experiences/menu` (preview reflect dữ liệu settings)
       - Route site dùng `Header` (slogan đúng desktop/mobile, toggle OFF thì ẩn).
     - Commit 1 commit theo convention, kèm `.factory/docs` nếu có file mới/được chạm.
   - Reflection: ✓ Tuân thủ guideline local: không chạy lint dư thừa, không push.

## Quyết định đã chốt qua ASK USER (BMAD)
- Business goal: Branding gọn.
- Data source: Field mới `topbarSlogan` (thực thi bằng key snake_case theo convention: `topbar_slogan`).
- Toggle behavior: Bật/tắt toàn bộ slogan bar content.
- Empty state: OFF hoặc rỗng => ẩn hẳn.
- Toggle location: `/admin/settings`.
- Group settings: `site`.
- Desktop layout: slogan ở giữa.
- Mobile behavior: 1 dòng truncate.

## Checklist acceptance
- [ ] Có 2 key mới trong settings: `topbar_slogan_enabled`, `topbar_slogan`.
- [ ] `/admin/settings` chỉnh được slogan + toggle và lưu bền vững.
- [ ] `/system/experiences/menu` không có control mới cho slogan, chỉ consume settings.
- [ ] Preview và site render đồng nhất.
- [ ] Desktop slogan giữa; mobile 1 dòng truncate.
- [ ] Toggle OFF hoặc slogan rỗng: ẩn hẳn slogan, không tạo khoảng trắng.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Có commit local, không push.