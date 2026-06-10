## Mục tiêu
Audit và sửa đúng **scope cart** để preview `/system/experiences/cart` và site render cart đồng bộ màu theo skill dual-brand-color-system (OKLCH + APCA + 60-30-10 + single/dual), tạo `getCartColors`, fix toàn bộ hardcode/opacity/missing token/sync mode-secondary.

## Problem Graph
1. Cart color system chưa chuẩn <- 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT] Thiếu single source token cho cart (`getCartColors`)
   1.2 Experience cart chưa sync đủ `primary/secondary/mode`
   1.3 Site cart còn hardcode/opacity hoặc chưa dùng token
   1.4 Mapping 60-30-10 + APCA cho text/badge/icon chưa đầy đủ

## Kế hoạch thực thi (sau khi bạn duyệt)
1. **Locate chính xác file cart (chỉ cart trực tiếp)**
   - Mở route `/system/experiences/cart` để xác định file page + preview components + current color helper.
   - Mở route site cart tương ứng trong `app/(site)` và các layout/section con trực tiếp của cart.

2. **Audit toàn bộ vấn đề màu trong cart (liệt kê trước, rồi sửa)**
   - Quét các điểm vi phạm trong file cart: hardcode hex/tailwind màu, `${color}xx` opacity decor, inline `brandColor`, thiếu token prop, thiếu APCA guard, missing single/dual resolve.
   - Lập checklist issue theo nhóm: `hardcode`, `opacity`, `missing token`, `preview-site mismatch`, `mode/secondary sync`.

3. **Tạo `getCartColors` trong cart color lib**
   - Implement helper chuẩn skill bằng OKLCH + APCA pipeline:
     - parse màu an toàn,
     - `resolveSecondaryForMode` (single=>secondary=primary, dual=>secondary hợp lệ/fallback primary),
     - token semantic cho cart (heading, body, meta, badge bg/border/text, button primary/secondary, input/cart surface/border, states active/focus, icon accents),
     - APCA guard cho text/icon trên nền solid,
     - đảm bảo color adjacency + anti-opacity rules.
   - Token naming ưu tiên rõ semantic theo cart, không dùng màu inline.

4. **Refactor Experience Preview cart dùng token 100%**
   - Ở `/system/experiences/cart`: load `useBrandColors()` và init/sync đủ `primary`, `secondary`, `mode` (không hardcode).
   - Preview render dùng `getCartColors(...)` và thay toàn bộ màu inline/hardcode bằng token.
   - Bảo đảm UI single mode chỉ hiển thị logic monochromatic; dual mode mới dùng secondary.

5. **Refactor Site cart render đồng bộ với preview**
   - Ở route `app/(site)` cart: generate token bằng **cùng** `getCartColors(...)`.
   - Truyền `tokens` vào các section/layout cart trực tiếp (nếu có) và thay toàn bộ inline/hardcode/opacity bằng token.
   - Đảm bảo cùng input màu => preview và site ra màu giống nhau.

6. **Self-audit lần 2 và fix dứt điểm trong scope cart**
   - Quét lại file cart để chắc chắn không còn:
     - hardcode màu,
     - opacity decorative `${color}xx`,
     - thiếu token mapping,
     - thiếu sync mode/secondary,
     - lệch preview-site.
   - Chỉ sửa trong cart, không lan scope.

7. **Validate + commit**
   - Chạy `bunx tsc --noEmit`.
   - Nếu lỗi, fix đến khi pass.
   - Commit 1 lần duy nhất với message mô tả fix dual-brand cart theo skill.

## Kết quả bàn giao
- Cart có `getCartColors` làm nguồn màu duy nhất.
- Preview `/system/experiences/cart` và site cart đồng bộ màu single/dual.
- Các issue hardcode/opacity/missing token/sync mode-secondary trong cart được liệt kê và đã fix hết.
- `bunx tsc --noEmit` pass + đã commit (không push).