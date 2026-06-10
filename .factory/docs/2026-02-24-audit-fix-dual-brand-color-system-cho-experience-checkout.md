## Mục tiêu
Chuẩn hóa toàn bộ màu của **checkout experience** theo skill `dual-brand-color-system` (OKLCH + APCA + 60-30-10 + single/dual), tạo `getCheckoutColors` làm single source of truth và đồng bộ tuyệt đối giữa **/system/experiences/checkout** (Preview) với **/(site) checkout render**.

## Problem Graph
1. [Main] Checkout chưa đồng bộ hệ màu chuẩn dual-brand <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Thiếu/không đầy đủ token system dùng chung preview + site
   1.2 Hardcode màu (brand/neutral), opacity decorative, mapping semantic chưa đủ
   1.3 Thiếu sync đầy đủ `primary/secondary/mode` và contract single/dual nhất quán

## Kế hoạch triển khai (trong đúng scope checkout)
1. **Đọc và chốt phạm vi file checkout**
   - Locate toàn bộ file liên quan checkout experience (system editor + preview + site render + layouts/sections của checkout).
   - Không đụng module ngoài checkout.

2. **Audit hiện trạng và lập checklist issue chi tiết**
   - Quét toàn bộ checkout scope để liệt kê: hardcode màu (`#...`, `text-slate-*`, `border-slate-*`, inline style), opacity decorative (`${color}15`, alpha overlays), chỗ thiếu tokens, thiếu sync mode/secondary, vi phạm color adjacency, vi phạm single-mode monochromatic.
   - Nhóm issue theo: Preview-only, Site-only, lệch Preview vs Site, Shared logic.

3. **Tạo/chuẩn hóa color engine `getCheckoutColors`**
   - Tạo hoặc refactor file `_lib/colors.ts` của checkout để có `getCheckoutColors(primary, secondary, mode)`.
   - Bên trong gồm:
     - Parse an toàn màu (safe parse OKLCH).
     - `resolveSecondaryForMode` (single => secondary=primary, dual => secondary hợp lệ/fallback primary).
     - Sinh tint/shade bằng OKLCH (clamp L/C hợp lý, không HSL).
     - APCA pipeline chuẩn (rgb tuple -> sRGBtoY -> APCAcontrast) + guard `ensureAPCATextColor` thực.
     - Token semantic đầy đủ cho checkout (heading, label, price/summary, input/focus, badge, button primary/secondary, divider, border, surfaces, meta text…).
   - Loại bỏ mọi logic màu duplicate nằm ngoài helper.

4. **Áp dụng tokens cho Experience Checkout Preview (/system)**
   - Chuẩn hóa state từ `useBrandColors()` gồm đủ `primary/secondary/mode` và sync đủ 3 giá trị trong `useEffect`.
   - Dùng `getCheckoutColors` để render toàn bộ phần preview.
   - Bỏ hardcode/opacity màu trong preview controls + preview content.
   - Đảm bảo UI single/dual đúng rule (single không dùng secondary semantics, dual hiển thị secondary đúng vai trò 10%).

5. **Áp dụng tokens cho Site Checkout render (/(site))**
   - Tại trang/section checkout site: generate tokens bằng **chính** `getCheckoutColors` với `primary/secondary/mode` từ settings.
   - Truyền `tokens` xuống tất cả layout/section con trong scope checkout.
   - Refactor toàn bộ nơi dùng inline brandColor/hardcoded neutral sang semantic tokens.
   - Xóa opacity decorative và thay bằng solid token theo anti-opacity rules.

6. **Đồng bộ Preview ↔ Site và fix toàn bộ issue tồn đọng đã liệt kê**
   - Đối chiếu từng semantic element giữa preview/site: heading, CTA chính-phụ, badge, input focus, summary card, trạng thái active/selected, text hierarchy.
   - Fix mismatch để 2 bên cùng mapping token và cùng behavior single/dual.

7. **Tự kiểm checklist bắt buộc theo skill**
   - Verify: OKLCH only, APCA guard chuẩn, 60-30-10 ở content state, color adjacency, badge token contract, anti AI-styling, anti opacity/shadow decorative.
   - Verify không còn hardcode màu trong checkout scope (bao gồm neutral hardcode theo yêu cầu của bạn).

8. **Validation + commit**
   - Chạy `bunx tsc --noEmit`.
   - Nếu pass: commit với message bạn chọn: `fix(checkout): apply dual-brand tokens for preview + site`.
   - Không push.

## Kết quả kỳ vọng
- Checkout có `getCheckoutColors` làm source duy nhất cho cả preview/site.
- Không còn hardcode màu + opacity decorative trong checkout scope.
- Single/dual mode đồng bộ đúng với settings, preview và site hiển thị nhất quán.