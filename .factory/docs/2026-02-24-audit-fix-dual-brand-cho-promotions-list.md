## Mục tiêu
- Audit và sửa toàn bộ màu cho `promotions-list` theo đúng skill `dual-brand-color-system`.
- Tạo `getPromotionsListColors(primary, secondary, mode)` làm nguồn màu duy nhất cho cả Preview + Site.
- Đồng bộ behavior single/dual, secondary và mode giữa `/system/experiences/promotions-list` và trang/section render tương ứng ở `/(site)`.

## Phạm vi
- Chỉ xử lý experience `promotions-list` và site render tương ứng.
- Không mở rộng sang experience khác.

## Kế hoạch triển khai chi tiết
1. **Audit code hiện tại (system + site)**
   - Định vị tất cả file liên quan đến `promotions-list` ở `app/system/experiences/*` và `app/(site)/*`.
   - Liệt kê đầy đủ các vấn đề: hardcode màu, dùng opacity `${color}XX`, thiếu token semantic, thiếu sync `secondary/mode`, mismatch preview-site, dùng `brandColor` inline thay vì token.

2. **Thiết kế token color system mới**
   - Tạo/chuẩn hóa file màu `_lib/colors.ts` cho promotions-list.
   - Implement `getPromotionsListColors(primary, secondary, mode)` theo skill:
     - Resolve secondary đúng mode (single => secondary=primary; dual => secondary hợp lệ hoặc fallback primary).
     - Sinh tint/shade bằng **OKLCH** (culori), có clamp an toàn.
     - Text/icon trên nền solid qua **APCA pipeline chuẩn** (`hex -> rgb -> sRGBtoY -> APCAcontrast`, dùng `Math.abs`).
     - Bảo đảm token semantic cho heading/body/meta/badge/button/input/card/filter/pagination/sidebar…
     - Tuân thủ anti-opacity và anti-AI styling rules.

3. **Refactor Preview (`/system/experiences/promotions-list`)**
   - Đảm bảo load default từ `useBrandColors()` gồm đủ `primary`, `secondary`, `mode`.
   - Đồng bộ state bằng `useEffect` cho cả 3 giá trị.
   - Dùng `ColorConfigCard` đúng pattern và truyền props preview đủ `brandColor`, `secondaryColor`, `colorMode`.
   - Thay toàn bộ màu inline/hardcode bằng token từ `getPromotionsListColors`.

4. **Refactor Site render tương ứng (`/(site)`)**
   - Site cũng load `useBrandColors()` và generate token bằng chính `getPromotionsListColors(...)`.
   - Truyền `tokens` vào tất cả layout/section component liên quan promotions-list.
   - Cập nhật signature các layout để nhận `tokens`.
   - Thay toàn bộ inline/hardcode/Tailwind hardcoded color sang token semantic.

5. **Đồng bộ và tự-fix toàn bộ tồn đọng trong scope**
   - Quét lại lần cuối để chắc chắn không còn:
     - `style={{ color/backgroundColor: brandColor }}` trực tiếp cho semantic element.
     - `${brandColor}15` / `${color}XX` decorative opacity.
     - Hardcode màu text/border/background trái token.
     - Lệch mode single/dual giữa preview và site.

6. **Validation & commit**
   - Chạy `bunx tsc --noEmit`.
   - Nếu lỗi: fix đến khi pass.
   - Commit toàn bộ thay đổi với message theo convention repo (không push).

## Kết quả mong đợi
- `promotions-list` có color system token hóa hoàn chỉnh theo OKLCH + APCA.
- Preview và Site hiển thị nhất quán khi đổi primary/secondary/mode.
- Không còn hardcode/opacity decor/thiếu sync trong phạm vi promotions-list.