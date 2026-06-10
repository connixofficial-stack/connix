## Audit Summary
### Pre-Audit (evidence đã có)
- Evidence 1: `app/system/experiences/menu/page.tsx` đang có toggle `Dùng settings liên hệ` + input `Hotline/Email` editable, và disable theo `config.topbar.useSettingsData`.
- Evidence 2: `components/experiences/previews/HeaderMenuPreview.tsx` đang merge hotline/email theo điều kiện `config.topbar.useSettingsData`.
- Evidence 3: `components/site/Header.tsx` (runtime site thật) cũng merge hotline/email theo `useSettingsData`; mặc định `useSettingsData: false`.
- Evidence 4: `slogan` đang được load read-only từ `site_tagline` (settings) và chỉ có toggle hiển thị (`sloganEnabled`) — đúng pattern user muốn áp cho hotline/email.
- Evidence 5: User đã chốt 2 quyết định:
  1) Hotline/email trong editor: **Read-only như slogan**.
  2) Legacy data: **Luôn render từ settings, bỏ dùng field cũ**.

### Audit Questions (đủ điều kiện, gồm #1 #3 #6 #8)
1. Triệu chứng: UI editor + runtime đang cho 2 nguồn dữ liệu hotline/email (config riêng vs settings), expected là 1 nguồn chuẩn `/admin/setting`.
2. Phạm vi ảnh hưởng: Experience Menu (Topbar/Search), Header preview và Header site runtime.
3. Tái hiện: ổn định; chỉ cần mở `/system/experiences/menu` thấy toggle + input hotline/email.
4. Mốc thay đổi gần nhất: không xác định chính xác commit gây ra, nhưng code path hiện tại cho thấy thiết kế dual-source.
5. Dữ liệu thiếu: không thiếu cho scope này; đã đủ evidence từ 3 file chính.
6. Giả thuyết thay thế: lỗi chỉ ở preview, không ở runtime → bị loại vì `components/site/Header.tsx` cũng phụ thuộc `useSettingsData`.
7. Rủi ro fix sai: có thể làm mất hiển thị hotline/email nếu đọc sai key settings.
8. Pass/fail: không còn toggle/input editable hotline/email; preview + site luôn lấy `contact_phone/contact_email` từ settings; typecheck pass.

## Root Cause Confidence
**High** — Do kiến trúc hiện tại dùng dual-source cho hotline/email (`header_config.topbar.*` và `settings contact`) thông qua cờ `useSettingsData`, dẫn tới vi phạm CoC và không đồng nhất với pattern slogan (single-source từ settings).

## Problem Graph
1. [Main] CoC violation do hotline/email có 2 nguồn <- depends on 1.1, 1.2, 1.3
   1.1 [Editor] Có toggle + input riêng cho hotline/email
   1.2 [Preview] Logic merge theo `useSettingsData`
   1.3 [Runtime] Header thật cũng merge theo `useSettingsData`
      1.3.1 [ROOT CAUSE] Mô hình dữ liệu topbar giữ field contact cục bộ + cờ chọn nguồn

## Execution (with reflection)
1. Solving 1.3.1 (single-source settings cho contact)
   - Thought: bỏ hẳn dependency `useSettingsData` và field contact cục bộ khỏi render path.
   - Action: chuẩn hóa đọc hotline/email trực tiếp từ settings ở editor preview + runtime.
   - Reflection: ✓ Khớp yêu cầu “luôn luôn dùng /admin/setting”.
2. Đồng bộ UI/UX theo slogan
   - Thought: hotline/email chỉ hiển thị read-only trong editor.
   - Action: thay input editable thành input/label disabled + text helper nguồn dữ liệu.
   - Reflection: ✓ CoC rõ ràng, dễ hiểu cho user vận hành.
3. Counter-hypothesis check
   - Giả thuyết đối chứng: giữ fallback về config cũ khi settings trống để an toàn.
   - Loại vì user đã chốt “Luôn render từ settings, bỏ dùng field cũ”.

## Kế hoạch implement chi tiết (single-pass, không chia phase)
1. **File: `app/system/experiences/menu/page.tsx`**
   - Bỏ `topbar.useSettingsData` khỏi `DEFAULT_CONFIG`.
   - Ở block **Topbar & Search**:
     - Xoá `ToggleRow label="Dùng settings liên hệ"`.
     - Đổi `Hotline` và `Email` thành read-only (giống slogan), giá trị lấy từ `settingsPhone`/`settingsEmail`.
     - Không còn editable state cho hotline/email tại experience.
   - Ở `handleSave`:
     - Sanitize `topbar` trước khi lưu: loại các field legacy `useSettingsData`, `hotline`, `email` khỏi payload `header_config` để tránh nhiễu cấu hình về sau.
   - Giữ `sloganEnabled` như hiện tại (đúng yêu cầu “làm giống slogan”).

2. **File: `components/experiences/previews/HeaderMenuPreview.tsx`**
   - Cập nhật type `HeaderMenuConfig.topbar`: bỏ `useSettingsData`; giữ `sloganEnabled/show/showTrackOrder`.
   - Bỏ nhánh `if (config.topbar.useSettingsData)`.
   - `displayTopbar` luôn map hotline/email từ props `settingsPhone/settingsEmail` (single-source settings cho preview).

3. **File: `components/site/Header.tsx`**
   - Cập nhật `TopbarConfig` + `DEFAULT_CONFIG`: bỏ `useSettingsData`.
   - Bỏ logic merge conditional theo `useSettingsData`.
   - `topbarConfig` runtime luôn dùng `contactSettings` (`contact_phone`, `contact_email`) cho phần hiển thị topbar.
   - Không dùng lại `config.topbar.hotline/email` để render nữa (tuân theo quyết định legacy-data).

4. **Tương thích dữ liệu cũ (không migration bắt buộc)**
   - Không cần migration DB: dữ liệu cũ trong `header_config.topbar` vẫn tồn tại nhưng bị ignore bởi render path mới.
   - Các lần save mới sẽ tự “làm sạch” dần nhờ sanitize ở step 1.

5. **Verify & commit (theo rule repo)**
   - Chạy `bunx tsc --noEmit`.
   - Repro manual:
     - `/system/experiences/menu`: không còn toggle “Dùng settings liên hệ”; hotline/email chỉ read-only.
     - Preview topbar hiển thị hotline/email lấy từ settings contact.
     - Site header thực tế đồng nhất với preview.
   - Commit (không push), và add kèm `.factory/docs` nếu có thay đổi theo rule.

## Post-Audit (blast radius / regression / complexity)
- Blast radius: gói trong experience menu + header preview + header site (không chạm data model/convex schema).
- Regression risk: thấp-vừa, chủ yếu ở hiển thị topbar contact; đã có checklist repro trực tiếp.
- KISS/YAGNI/DRY: chuyển về single-source, giảm condition/toggle thừa, ít branch hơn.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`.
- Functional repro:
  1) Update `contact_phone/contact_email` trong `/admin/setting`.
  2) Mở `/system/experiences/menu` xác nhận field hotline/email read-only và phản ánh đúng settings.
  3) Mở site (Header thực) xác nhận hotline/email khớp settings.
- Pass criteria: không còn toggle cũ; không còn render-path phụ thuộc `useSettingsData`; TS không lỗi.