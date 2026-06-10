## Problem Graph
1. [Main] Đồng bộ màu Menu giữa Preview (`/system/experiences/menu`) và Site header/menu (`/(site)`) theo skill dual-brand <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Chưa có single source of truth token cho menu (`getMenuColors`) dùng chung preview/site
   1.2 [Sub] Có thể còn hardcode màu/opacity decor/thiếu APCA guard trong menu render
   1.3 [Sub] Sync mode/color (`primary`, `secondary`, `mode`) có thể chưa đầy đủ ở Experience menu
   1.4 [Sub] Site header/menu có thể chưa nhận tokens nên lệch màu với preview

## Execution (with reflection)
1. Audit code phạm vi menu (chỉ menu)
   - File mục tiêu chính: `app/system/experiences/menu/page.tsx`
   - Tìm toàn bộ nơi render site menu/header liên quan trong `app/(site)` và `components`.
   - Liệt kê issue theo nhóm: hardcode hex/tailwind color, `${color}XX` opacity decor, dùng `brandColor` inline thay token, thiếu `secondary/mode` sync.
   - Reflection: nếu phát hiện file ngoài menu, bỏ qua để giữ đúng scope.

2. Thiết kế và tạo token system `getMenuColors`
   - Tạo helper màu menu trong `_lib/colors.ts` (đặt cạnh module menu hiện có) với pipeline:
     - resolve secondary theo mode (`single => secondary=primary`, `dual => secondary hợp lệ else primary`)
     - parse/biến đổi màu bằng OKLCH (culori)
     - APCA guard cho text/icon trên nền solid (không truyền hex trực tiếp vào APCAcontrast)
   - Định nghĩa semantic tokens cho menu (ví dụ):
     - base/neutral: `background`, `surface`, `border`, `bodyText`, `mutedText`
     - primary usage (30%): `menuItemActiveBg`, `menuItemActiveText`, `ctaBg`, `ctaText`
     - secondary usage (10%): `menuSubLabel`, `badgeBg/border/text`, `decorAccent`
     - interactive: `hoverBg`, `focusRing`, `divider`
   - Reflection: token names giữ semantic, không ràng buộc style cụ thể để dễ map preview/site.

3. Refactor Experience Menu Preview dùng tokens 100%
   - `app/system/experiences/menu/page.tsx`:
     - Load default từ `useBrandColors()` với đủ `primary`, `secondary`, `mode`.
     - State init + `useEffect` sync đủ cả 3 giá trị.
     - Generate `tokens = getMenuColors(primary, secondary, mode)` bằng `useMemo`.
     - Thay toàn bộ màu hardcode/inline/opacity decor bằng token.
     - UI single mode: ẩn info secondary/accent balance theo rule skill.
   - Reflection: đảm bảo ColorConfigCard/controls vẫn hoạt động realtime, không đổi behavior ngoài màu.

4. Refactor Site header/menu render dùng cùng helper
   - Ở file render header/menu thuộc `app/(site)` hoặc `components`:
     - Load `useBrandColors()` (primary, secondary, mode) hoặc nhận từ parent hiện có.
     - Tạo `tokens = getMenuColors(...)` cùng helper với preview.
     - Bơm `tokens` qua props vào layout/menu component nếu cần.
     - Thay toàn bộ inline `brandColor`, hardcode màu, opacity decor bằng token tương ứng.
   - Reflection: giữ nguyên cấu trúc menu hiện tại, chỉ thay lớp màu để tránh mở rộng scope.

5. Re-audit sau fix (menu-only)
   - Quét lại các pattern vi phạm trong phạm vi menu:
     - `style={{ color: brandColor }}`, `style={{ backgroundColor: brandColor }}`
     - `${brandColor}..` opacity
     - hardcoded `text-slate-*`, `border-slate-*`, hex trực tiếp ở phần menu
   - Fix dứt điểm những điểm còn sót.
   - Reflection: chỉ sửa nơi thật sự là menu/header menu.

6. Validation bắt buộc
   - Chạy: `bunx tsc --noEmit`
   - Nếu fail: sửa lỗi type, chạy lại tới khi pass.

7. Commit (1 commit)
   - Commit message dự kiến: `fix(menu): apply dual-brand token system for experience and site header sync`
   - Không push.

## Deliverables
- Menu colors helper mới: `getMenuColors` (OKLCH + APCA + single/dual).
- Preview `/system/experiences/menu` dùng tokens hoàn toàn.
- Site header/menu dùng cùng tokens, đồng bộ màu với preview.
- Danh sách issue audit đã phát hiện và đã fix (trong summary cuối).