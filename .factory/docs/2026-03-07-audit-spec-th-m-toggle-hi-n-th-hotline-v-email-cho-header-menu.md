## Audit Summary
### Pre-Audit
- Evidence 1: `app/system/experiences/menu/page.tsx` hiện đã chuyển hotline/email sang read-only từ settings, nhưng chưa có toggle riêng để bật/tắt từng field.
- Evidence 2: `components/experiences/previews/HeaderMenuPreview.tsx` đang luôn render hotline/email nếu `displayTopbar.hotline/email` có giá trị, không có cờ `showHotline/showEmail`.
- Evidence 3: `components/site/Header.tsx` runtime cũng luôn render hotline/email nếu settings có dữ liệu, áp dụng ở cả 3 layout `classic`, `topbar`, `allbirds`.
- Evidence 4: Pattern hiện có trong topbar là các toggle độc lập như `show`, `sloganEnabled`, `showTrackOrder`; nên thêm `showHotline` và `showEmail` sẽ đồng nhất cấu trúc hiện tại.
- Evidence 5: User đã chốt:
  1) Toggle áp dụng **đồng bộ preview + runtime**, data vẫn lấy từ `/admin/setting`.
  2) UI toggle đặt cạnh `Slogan topbar` và `Theo dõi đơn`.

### Audit Questions
1. Triệu chứng: hotline/email hiện luôn hiện nếu settings có dữ liệu; expected là có thể bật/tắt từng field mà vẫn giữ single-source settings.
2. Phạm vi ảnh hưởng: Experience Menu editor, preview component, Header runtime cho cả 3 layout.
3. Tái hiện: ổn định; mở `/system/experiences/menu` thấy chưa có toggle hotline/email, còn preview/site luôn hiện khi settings có dữ liệu.
4. Mốc thay đổi gần nhất: vừa refactor bỏ `useSettingsData`, nên đây là bước hoàn thiện UX kiểm soát hiển thị.
5. Dữ liệu thiếu: không thiếu cho scope này; code path đã rõ.
6. Giả thuyết thay thế: chỉ cần 1 toggle chung contact info → bị loại vì user yêu cầu rõ “thêm 2 toggle hiển thị hotline, hiển thị email”.
7. Rủi ro fix sai: có thể làm preview/site lệch nhau nếu chỉ sửa 1 bên hoặc quên 1 layout.
8. Pass/fail: editor có 2 toggle mới; preview + runtime đồng bộ; dữ liệu vẫn lấy từ settings; typecheck pass.

## Root Cause Confidence
**High** — Root cause là config topbar hiện chỉ có toggle cho `show`, `sloganEnabled`, `showTrackOrder`, chưa có state hiển thị riêng cho hotline/email nên render path mặc định luôn show khi settings có dữ liệu.

## Problem Graph
1. [Main] Thiếu khả năng bật/tắt riêng hotline/email trong topbar <- depends on 1.1, 1.2, 1.3
   1.1 [Editor] Chưa có toggle cấu hình
   1.2 [Preview] Chưa có guard `showHotline/showEmail`
   1.3 [Runtime] 3 layout render trực tiếp từ settings
      1.3.1 [ROOT CAUSE] Topbar config thiếu cờ hiển thị hotline/email

## Execution (with reflection)
1. Solving 1.3.1
   - Thought: thêm 2 cờ cấu hình `showHotline`, `showEmail` là hướng KISS nhất, reuse đúng pattern sẵn có.
   - Action: mở rộng type/default config, lưu cùng `header_config.topbar`.
   - Reflection: ✓ Không đụng schema/settings backend, blast radius nhỏ.
2. Đồng bộ editor + preview + runtime
   - Thought: guard hiển thị phải dùng chung logic ở mọi layout để tránh lệch.
   - Action: derive `showTopbarHotline` và `showTopbarEmail` từ toggle + settings data.
   - Reflection: ✓ Đảm bảo parity preview/site.
3. Counter-hypothesis check
   - Giả thuyết đối chứng: dùng 1 toggle contact info chung cho gọn.
   - Loại vì không đáp ứng yêu cầu cụ thể “2 toggle”.

## Kế hoạch implement chi tiết
1. **File: `components/experiences/previews/HeaderMenuPreview.tsx`**
   - Mở rộng `HeaderMenuConfig.topbar` thêm:
     - `showHotline?: boolean`
     - `showEmail?: boolean`
   - Tạo derived booleans:
     - `showTopbarHotline = Boolean(displayTopbar.show && (displayTopbar.showHotline ?? true) && displayTopbar.hotline)`
     - `showTopbarEmail = Boolean(displayTopbar.show && (displayTopbar.showEmail ?? true) && displayTopbar.email)`
   - Thay mọi chỗ render hotline/email ở 3 layout `classic/topbar/allbirds` dùng 2 derived booleans này.
   - Giữ data source vẫn là `settingsPhone/settingsEmail` như hiện tại.

2. **File: `components/site/Header.tsx`**
   - Mở rộng `TopbarConfig` thêm `showHotline?: boolean`, `showEmail?: boolean`.
   - Thêm default trong `DEFAULT_CONFIG.topbar` để backward-compatible:
     - `showHotline: true`
     - `showEmail: true`
   - Tạo derived booleans runtime tương tự preview.
   - Áp dụng ở cả 3 layout `classic/topbar/allbirds` thay cho điều kiện render trực tiếp `topbarConfig.hotline/email`.

3. **File: `app/system/experiences/menu/page.tsx`**
   - Thêm default `showHotline: true`, `showEmail: true` vào `DEFAULT_CONFIG.topbar`.
   - Trong block `Topbar & Search`, thêm 2 `ToggleRow` mới đặt cạnh nhóm `Slogan topbar` / `Theo dõi đơn`:
     - `Hiển thị hotline`
     - `Hiển thị email`
   - 2 input read-only hotline/email vẫn giữ nguyên, chỉ để xem giá trị settings.
   - Khi build `previewConfig`, giữ nguyên topbar settings data nhưng truyền theo toggle mới.
   - Khi save, lưu 2 cờ mới cùng `header_config.topbar`; vẫn tiếp tục sanitize legacy fields `hotline/email/useSettingsData` như hiện tại.

4. **Tương thích dữ liệu cũ**
   - Config cũ chưa có `showHotline/showEmail` sẽ mặc định `true` nhờ DEFAULT_CONFIG.
   - Không cần migration DB.

5. **Verification**
   - Typecheck: `bunx tsc --noEmit`.
   - Repro manual:
     1) Mở `/system/experiences/menu`, xác nhận có 2 toggle mới.
     2) Tắt `Hiển thị hotline`: preview ẩn hotline, site runtime cũng ẩn hotline, email vẫn hiện nếu bật.
     3) Tắt `Hiển thị email`: preview/site ẩn email, hotline vẫn hiện nếu bật.
     4) Thử ở 3 layout `classic/topbar/allbirds` để xác nhận parity.

## Post-Audit
- Blast radius: nhỏ, chỉ trong topbar config/render path của Header Menu.
- Regression risk: thấp nếu sửa đồng bộ preview + runtime + editor.
- KISS/YAGNI/DRY: thêm đúng 2 cờ riêng, tái dùng pattern toggle sẵn có, không thêm nguồn dữ liệu mới.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`
- Manual repro trên `/system/experiences/menu` + site header ở 3 layout
- Pass criteria:
  - Có 2 toggle mới trong editor
  - Toggle ảnh hưởng đồng bộ preview + runtime
  - Hotline/email vẫn lấy từ `/admin/setting`
  - Không phát sinh lỗi TypeScript