## Problem Graph
1. [Main] Audit + sửa màu wishlist theo dual-brand-color-system <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [Read & map code luồng wishlist system/site] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Chưa có single source of truth token cho wishlist (Preview/Site lệch nhau)
   1.2 [Audit violations theo SKILL rules]
   1.3 [Thiết kế & cài getWishlistColors]
   1.4 [Refactor Preview + Site dùng tokens]
   1.5 [Validate + commit đúng scope]

## Execution (with reflection)
1. Solving 1.1.1...
- Thought: Cần xác định đúng tất cả file wishlist ở `/system/experiences/wishlist` và `(site)` render tương ứng trước khi sửa.
- Action: Quét route/file wishlist, tìm nơi đang dùng `brandColor`, hardcode màu, opacity `${color}XX`, thiếu `mode/secondary` sync.
- Reflection: ✓ Valid nếu lập được bản đồ đầy đủ Preview + Site components/layouts liên quan wishlist.

2. Solving 1.2...
- Thought: Audit phải bám đúng checklist SKILL (OKLCH/APCA/60-30-10/single-dual/sync).
- Action: Lập danh sách issue cụ thể theo nhóm: hardcode, anti-opacity, thiếu token semantic, thiếu `tokens` prop ở layout, thiếu sync `primary-secondary-mode` từ settings.
- Reflection: ✓ Valid khi mọi issue được định danh theo file + dòng logic cần đổi, không mở rộng scope ngoài wishlist.

3. Solving 1.3...
- Thought: Tạo 1 helper trung tâm `getWishlistColors(primary, secondary, mode)` để làm single source of truth cho cả Preview và Site.
- Action:
  - Tạo/chuẩn hóa file `_lib/colors.ts` cho wishlist.
  - Dùng OKLCH để sinh tint/shade (có guard parse an toàn).
  - Dùng APCA pipeline đúng chuẩn (`hex -> rgb -> sRGBtoY -> APCAcontrast`) cho text/icon trên nền solid.
  - Implement `resolveSecondaryForMode`: single => secondary=primary; dual => dùng secondary hợp lệ, fallback primary.
  - Xuất bộ semantic tokens đủ dùng cho heading/subtitle/badge/button/input/card/border/meta/decor theo 60-30-10.
- Reflection: ✓ Valid khi helper không còn HSL/no-op APCA và đảm bảo single mode monochromatic strict.

4. Solving 1.4...
- Thought: Đồng bộ màu chỉ đúng khi Preview và Site cùng consume tokens từ `getWishlistColors`.
- Action:
  - Refactor `/system/experiences/wishlist` để state màu load + sync đủ 3 giá trị `primary/secondary/mode` từ settings.
  - Áp dụng tokens cho toàn bộ Preview render (loại bỏ hardcode/inline màu sai chuẩn).
  - Refactor site wishlist page/section `(site)` để generate tokens bằng cùng helper và pass `tokens` vào các layout components.
  - Thêm `tokens` prop vào signature mọi layout wishlist liên quan và thay toàn bộ màu inline/Tailwind hardcode sang token semantic.
  - Fix các vi phạm anti-opacity/adjacency (đặc biệt badge/decor/border).
- Reflection: ✓ Valid khi đổi màu ở settings phản ánh nhất quán Preview = Site cho cả single và dual mode.

5. Solving 1.5...
- Thought: Theo rule repo, chỉ cần chạy `bunx tsc --noEmit` trước commit cho thay đổi code TS.
- Action:
  - Chạy `bunx tsc --noEmit`, xử lý lỗi nếu có.
  - Review git diff + git status, stage chỉ file wishlist liên quan code (không gồm untracked docs).
  - Commit 1 commit scoped wishlist (không push).
- Reflection: ✓ Valid khi typecheck pass, commit thành công, và chỉ chứa thay đổi trong scope wishlist.

## Output cam kết sau khi implement
- Danh sách đầy đủ issue đã audit + trạng thái fix.
- `getWishlistColors` hoạt động đúng OKLCH + APCA + single/dual.
- Preview và Site wishlist đồng bộ token màu hoàn toàn.
- Đã chạy `bunx tsc --noEmit` và tạo commit chỉ gồm file wishlist.