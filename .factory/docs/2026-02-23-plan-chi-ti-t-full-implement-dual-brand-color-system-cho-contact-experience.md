## Problem Graph
1. [Main] `/system/experiences/contact` chưa tuân thủ đầy đủ skill `dual-brand-color-system` ở cả config + render <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Trang experience chưa dùng nguồn màu chuẩn từ settings (`primary`, `secondary`, `mode`)
   1.2 [Sub] UI controls/preview đang hardcode `#6366f1` nên không phản ánh brand thật
   1.3 [Sub] Chưa có ColorConfigCard để override màu realtime theo chuẩn Experiences Color Config
   1.4 [Sub] Luồng props render xuống `ContactPreview` chưa đủ dữ liệu dual-mode

## Execution (with reflection)
1. Solving 1.1 — chuẩn hoá color state theo settings (file: `app/system/experiences/contact/page.tsx`)
- Thought: Skill 6.1 yêu cầu load + sync đủ 3 giá trị từ settings.
- Action:
  - Import hook màu brand hiện dùng chung trong project (ưu tiên `useBrandColors`).
  - Khởi tạo state local:
    - `brandColor` từ `brandColors.primary`
    - `secondaryColor` từ `brandColors.secondary || ''`
    - `colorMode` từ `brandColors.mode || 'single'`
  - Thêm `useEffect` sync cả 3 state khi settings đổi: deps gồm `brandColors.primary`, `brandColors.secondary`, `brandColors.mode`.
- Reflection: ✓ Đây là phần cốt lõi để contact experience tự động nhận cấu hình màu global.

2. Solving 1.2 — thay toàn bộ hardcode màu ở controls bằng source-of-truth state (file: `page.tsx`)
- Thought: Cần đồng bộ UI editor với màu hiện hành, không để hardcode.
- Action:
  - Thay `accentColor="#6366f1"` trong `ToggleRow` → `accentColor={brandColor}`.
  - Thay `LayoutTabs.accentColor="#6366f1"` → `accentColor={brandColor}`.
  - Thay `ExampleLinks.color="#6366f1"` → `color={brandColor}`.
  - Rà soát các điểm màu literal tương tự trong file và thay bằng `brandColor`/state màu tương ứng.
- Reflection: ✓ Đảm bảo cùng một màu điều phối toàn trang editor.

3. Solving 1.3 — thêm ColorConfigCard vào control area (file: `page.tsx`)
- Thought: Skill bắt buộc có UI single/dual + picker để preview override realtime.
- Action:
  - Tìm component `ColorConfigCard` đang dùng ở experience khác để tái sử dụng đúng convention.
  - Thêm 1 `ControlCard` (hoặc card tương đương theo pattern hiện có) trong grid `Thiết lập hiển thị` để render `ColorConfigCard`.
  - Wire đầy đủ handlers:
    - `onPrimaryChange` → set `brandColor`
    - `onSecondaryChange` → set `secondaryColor`
    - `onModeChange` → set `colorMode`
  - Truyền giá trị hiện tại vào card: `primary`, `secondary`, `mode`.
  - Áp rule single-mode:
    - Khi `mode='single'`, UI không hiển thị info phụ/secondary không cần thiết.
- Reflection: ✓ Hoàn thiện compliance mục 6.1 trong skill cho layer Experience.

4. Solving 1.4 — chuẩn hoá render implement ở trang tương ứng qua props đầy đủ (files: `page.tsx` + component preview liên quan)
- Thought: User yêu cầu rõ phần “render implement ở trang tương ứng”; cần làm rõ luồng từ config -> preview render.
- Action:
  - Ở `page.tsx`, cập nhật chỗ gọi `<ContactPreview ... />` để truyền thêm:
    - `brandColor={brandColor}`
    - `secondaryColor={secondaryColor}`
    - `colorMode={colorMode}`
  - Mở component `ContactPreview` (và file style/layout con nếu có) để:
    - cập nhật type/interface props nhận đủ 3 trường màu
    - resolve màu theo mode (single: secondary fallback primary; dual: dùng secondary hợp lệ)
    - đảm bảo các layout contact (form-only/with-map/with-info) cùng dùng luồng màu mới
  - Nếu `ContactPreview` đã có helper màu riêng, chỉ cần nối đúng props + fallback logic, không thêm logic dư.
- Reflection: ✓ Đây là phần trực tiếp “render implement tại trang tương ứng”, tránh chỉ dừng ở control panel.

5. Compliance pass theo checklist skill cho phạm vi Contact Experience
- Thought: Chốt tuân thủ nhưng không over-scope.
- Action:
  - Verify trong route contact experience:
    - Có load settings colors + sync 3 values
    - Có ColorConfigCard
    - Không còn hardcoded `#6366f1` ở các controls chính
    - Preview nhận đủ 3 props màu và phản ánh mode
  - Giữ KISS/YAGNI: chỉ can thiệp phần color-config và render flow liên quan.
- Reflection: ✓ Đúng phạm vi user yêu cầu review + plan fix để full implement.

6. Validation gate sau implement
- Action: chạy `bunx tsc --noEmit` (theo rule repo).
- Nếu fail: fix toàn bộ lỗi type phát sinh bởi thay đổi props/state, chạy lại đến khi pass.

7. Commit local sau khi pass typecheck
- Action:
  - `git status`
  - `git diff --cached` (sau khi stage) để soát secret/sensitive data
  - commit message tập trung lý do: chuẩn hoá contact experience theo dual-brand skill
  - không push.

## File-level change plan (step-by-step actionable)
1. `app/system/experiences/contact/page.tsx`
- Thêm import hook brand colors và (nếu cần) import `ColorConfigCard`.
- Thêm local states: `brandColor`, `secondaryColor`, `colorMode`.
- Thêm `useEffect` sync 3 state theo settings.
- Thay các hardcoded accent colors (`#6366f1`) bằng state màu.
- Chèn `ColorConfigCard` vào khu vực controls.
- Truyền đầy đủ props màu vào `ContactPreview`.

2. `components/experiences/...` file chứa `ContactPreview` (xác định path thực tế khi implement)
- Mở rộng props interface để nhận `secondaryColor`, `colorMode`.
- Cập nhật logic resolve màu theo mode + fallback hợp lệ.
- Đảm bảo cả 3 layout contact dùng cùng luồng resolve này.

3. (Nếu có) file helper màu của Contact preview
- Chỉ chỉnh nếu cần để gom logic resolve secondary theo mode ở 1 nơi.
- Tránh tạo helper mới nếu project đã có helper chuẩn dùng chung.

## Definition of Done
- `/system/experiences/contact` load mặc định đúng `primary/secondary/mode` từ settings.
- Có thể đổi single/dual và màu ngay trên trang experience, preview đổi realtime.
- Tất cả layout contact trong preview phản ánh đúng mode màu.
- Không còn hardcode `#6366f1` tại các điểm điều khiển/preview chính của trang này.
- `bunx tsc --noEmit` pass.
- Có commit local, không push.