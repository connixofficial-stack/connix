## Problem Graph
1. [Main] Gallery edit chưa tuân thủ dual-brand-color-system <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Route/File mapping]
      1.1.1 [ROOT CAUSE] URL `/admin/home-components/gallery/[id]/edit` đang render từ `app/admin/home-components/gallery/[id]/edit/page.tsx`, nhưng chưa có layer validation/harmony/accessibility nào.
   1.2 [Color architecture]
      1.2.1 [ROOT CAUSE] GalleryPreview hiện dùng `brandColor` rất ít, nhận `secondary` nhưng ignore (`secondary: _secondary`) => vi phạm Element-Level rules + imbalance (gần primary-only hoặc neutral-only tùy style).
      1.2.2 [ROOT CAUSE] TrustBadgesPreview đang secondary-dominant (nhiều `${secondary}..` inline), heading h2 vẫn neutral thay vì primary.
   1.3 [Anti AI-styling compliance]
      1.3.1 [ROOT CAUSE] Có nhiều opacity/shadow/blur decorative (`bg-black/95`, `${secondary}15`, shadow lớn inline, hover transform mạnh) chưa đúng strict rules v11.x.
   1.4 [Single Source of Truth]
      1.4.1 [ROOT CAUSE] Chưa có `_lib/colors.ts` cho Gallery để chuẩn hóa palette + APCA; preview style đang tự tính màu rải rác inline.

## Execution (with reflection)
1. Solving 1.1.1 (mapping + scope)
   - Thought: Khóa đúng phạm vi theo URL user đưa.
   - Action: Dùng route tương ứng `app/admin/home-components/gallery/[id]/edit/page.tsx` và 2 preview component liên quan.
   - Reflection: ✓ Valid.

2. Solving 1.4.1 (single source of truth trước)
   - Thought: Muốn fix đúng skill thì phải gom màu vào helper dùng chung.
   - Action:
     - Tạo `app/admin/home-components/gallery/_lib/colors.ts` với:
       - `safeParseOklch`, `resolveSecondaryForMode` (single=>primary, dual=>secondary/fallback harmony),
       - `getHarmonyStatus`, `getAccessibilityScore`,
       - `getGalleryPalette(primary, secondary, mode)` trả về token: `surface/bg/border/heading/accent/iconBg/iconFg/badge`.
     - Chuyển GalleryPreview + TrustBadgesPreview sang dùng token, bỏ màu inline hardcode phân tán.
   - Reflection: ✓ Đây là gốc để xử lý đồng thời consistency + accessibility.

3. Solving 1.2.x (color distribution + element-level)
   - Thought: Áp 60-30-10 ở content state, đảm bảo heading/CTA/action dùng primary, subtitle/badge dùng secondary.
   - Action:
     - GalleryPreview:
       - Dùng `brandColor` cho heading/tương tác chính (+N chip chính, active state, icon chính).
       - Dùng secondary cho label/subtle accent (badge phụ, viền phụ, dot phụ).
       - Bỏ pattern ignore secondary.
     - TrustBadgesPreview:
       - H2 chuyển sang primary (theo rule bắt buộc).
       - Giảm secondary-heavy ở border/foreground; đưa neutral cho nền/card body.
       - Chỉ giữ secondary cho accent element đủ lớn (badge, subtitle, secondary action).
   - Reflection: ✓ Sửa được lệch phân phối hiện tại (Gallery 5/95 và TrustBadges secondary-dominant).

4. Solving 1.3.1 (anti AI-styling)
   - Thought: Skill cấm decorative opacity/shadow nặng, nên chuyển sang flat + border rõ.
   - Action:
     - Loại bỏ/giảm các lớp `bg-black/95`, `${color}XX` decorative, shadow lớn inline, hover nâng mạnh.
     - Chuẩn hóa sang border 1px solid + `shadow-sm` tối thiểu khi cần functional.
     - Giữ hover nhẹ chỉ cho state-change có ý nghĩa.
   - Reflection: ✓ Đồng bộ enterprise/flat UI, mobile-first ổn định hơn.

5. Solving 1.1.1 + validation gating trong edit page
   - Thought: Skill v11.4 yêu cầu check harmony only in dual mode + accessibility luôn check.
   - Action:
     - Trong `gallery/[id]/edit/page.tsx`, thêm color mode/harmony state từ config (fallback hợp lý) và validate trước save:
       - `if (mode==='dual' && harmonyTooSimilar) block save`
       - `if (accessibility failing) block save`
     - UI warning/hint theo mode:
       - single: ẩn warning harmony/secondary info
       - dual: hiển thị deltaE + cảnh báo nếu cần.
     - Thêm pristine/hasChanges để Save disabled khi chưa đổi.
   - Reflection: ✓ Khớp safety rules S2, S3 và single-mode rules.

## Spec thay đổi chi tiết theo file
1. `app/admin/home-components/gallery/_lib/colors.ts` (new)
   - Implement util OKLCH/APCA/harmony/token palette cho gallery + trust-badges preview.
   - Export helper typed rõ ràng để 2 preview dùng chung.

2. `app/admin/home-components/gallery/_components/GalleryPreview.tsx`
   - Bỏ `secondary: _secondary`; dùng thật sự secondary qua palette helper.
   - Thay màu inline bằng token.
   - Chuẩn lại heading/primary action theo element rules.
   - Giảm opacity/shadow/hover decorative theo anti AI-styling.

3. `app/admin/home-components/gallery/_components/TrustBadgesPreview.tsx`
   - Chuyển toàn bộ màu rải rác sang palette helper.
   - H2 -> primary, subtitle/badge -> secondary, nền/body -> neutral.
   - Giảm secondary overuse ở border/text nhỏ.

4. `app/admin/home-components/gallery/[id]/edit/page.tsx`
   - Thêm mode + harmony/accessibility validation trước submit.
   - Harmony gate chỉ chạy khi dual mode.
   - Thêm dirty-state parity cho nút lưu (disabled khi pristine, reset sau save thành công).

## Expected outcome sau khi sửa
- Gallery không còn ignore secondary và không lệch màu cực đoan.
- TrustBadges không còn secondary-dominant quá mức; heading primary đúng chuẩn.
- Tuân thủ v11.4 cho single/dual validation.
- Render/preview color logic thống nhất từ 1 nguồn (_lib/colors.ts), dễ bảo trì và tránh regressions.