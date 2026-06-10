## Mục tiêu
Chuẩn hóa màu cho **duy nhất experience `account-orders`** theo skill `dual-brand-color-system`: OKLCH + APCA + 60-30-10 + single/dual, tạo `getAccountOrdersColors`, đồng bộ tuyệt đối Preview (`/system/experiences/account-orders`) và Site render tương ứng.

## Phạm vi thực hiện (không mở rộng)
- Chỉ chỉnh các file liên quan `account-orders` ở system experience + site page/section render tương ứng.
- Không đụng các experience khác.

## Kế hoạch triển khai chi tiết
1. **Audit cấu trúc account-orders (system + site)**
   - Xác định toàn bộ entry points: page, preview/layout components, site render components, color helpers hiện có.
   - Lập checklist lỗi theo skill: hardcode hex/tailwind màu, `${color}XX` opacity decor, thiếu token semantic, thiếu `tokens` prop ở layout, thiếu sync `secondary/mode`, lệch single/dual giữa preview và site.

2. **Thiết kế color engine mới cho account-orders**
   - Tạo/chuẩn hóa file `_lib/colors.ts` với `getAccountOrdersColors(primary, secondary, mode)`.
   - Áp dụng rule bắt buộc:
     - `resolveSecondaryForMode`: single => secondary=primary, dual => dùng secondary hợp lệ, fallback primary.
     - Dùng OKLCH để sinh tint/shade có clamp an toàn.
     - APCA pipeline chuẩn cho text/icon trên nền solid (`hex -> rgb -> sRGBtoY -> APCAcontrast`), guard bằng `ensureAPCATextColor`.
     - Semantic tokens đủ cho mọi phần tử account-orders (heading/body/meta/badge/button/input/border/surface/active/decor cần thiết).

3. **Refactor Experience Preview (`/system/experiences/account-orders`)**
   - Load màu từ `useBrandColors()` đầy đủ `primary + secondary + mode`.
   - State khởi tạo + `useEffect` sync đủ 3 giá trị theo convention trong skill.
   - Dùng `ColorConfigCard` để preview realtime và đúng behavior single/dual.
   - Thay toàn bộ hardcode/inline color bằng semantic tokens từ `getAccountOrdersColors`.
   - Đảm bảo UI single mode chỉ thể hiện đơn sắc, không hiển thị thông tin secondary không cần thiết.

4. **Refactor Site render account-orders (single source of truth)**
   - Site load `useBrandColors()` (primary/secondary/mode), tạo `tokens = getAccountOrdersColors(...)`.
   - Truyền `tokens` xuống mọi layout/section component account-orders liên quan.
   - Bổ sung `tokens` vào type/signature component thiếu.
   - Thay toàn bộ inline/hardcode màu bằng token semantic tương ứng để khớp preview.

5. **Quét hậu kiểm và fix triệt để trong account-orders**
   - Re-audit theo checklist:
     - Không còn hardcode màu (hex/tailwind) cho phần tử cần token.
     - Không còn `${brandColor}15`/opacity decor trái rule.
     - Không còn lệch mode/sync secondary.
     - Tokens phủ đủ các vùng UI chính.
   - Fix nốt tất cả issue phát hiện trong đúng scope.

6. **Validation & commit**
   - Chạy `bunx tsc --noEmit`.
   - Nếu lỗi: sửa đến khi pass.
   - Commit 1 commit đúng scope account-orders, message theo convention repo, không push.

## Kết quả bàn giao
- Danh sách issue audit đã phát hiện + đã fix trong account-orders.
- Hệ thống token `getAccountOrdersColors` dùng chung preview + site.
- Màu dual-brand đồng bộ giữa `/system/experiences/account-orders` và trang site render tương ứng.
- `bunx tsc --noEmit` pass và đã commit.