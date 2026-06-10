## Plan ngắn gọn (đúng scope product-detail)

## Problem Graph
1. [Main] Product-detail chưa tuân thủ dual-brand-color-system <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Thiếu single source of truth `getProductDetailColors` dùng chung preview + site
   1.2 [Sub] Experience page đang hardcode `brandColor` (`#06b6d4`), chưa sync `primary/secondary/mode` từ settings
   1.3 [Sub] Nhiều hardcode màu/opacity/decor và chưa map semantic tokens đầy đủ ở preview + `/products/[slug]`

## Execution (with reflection)
1. Tạo helper token mới cho product-detail
   - File mới: `app/system/experiences/product-detail/_lib/colors.ts` (hoặc vị trí chuẩn đang dùng cho experiences nếu repo đã có pattern tương tự).
   - Export `getProductDetailColors(primary, secondary, mode)` + utility bắt buộc theo skill:
     - `resolveSecondaryForMode` (single=>primary, dual=>secondary valid/fallback primary)
     - parse màu an toàn (safe parse), OKLCH tint/shade, clamp
     - APCA pipeline chuẩn (`hex -> rgb tuple -> sRGBtoY -> APCAcontrast`, dùng `Math.abs`)
     - `getAPCATextColor` + `ensureAPCATextColor` guard thật (không no-op)
   - Token semantic gồm tối thiểu: heading/productName, price, badge set (category/discount), addToCart/buyNow (+text), variant selected ring, thumbnail active border, link/back link, body/meta/neutral text, card/surface/border/input/focus.
   - Reflection: giải được root cause 1.1 (single source of truth).

2. Sửa Experience editor `/system/experiences/product-detail`
   - File: `app/system/experiences/product-detail/page.tsx`.
   - Thêm `useBrandColors()`; state local đầy đủ `brandColor`, `secondaryColor`, `colorMode` và `useEffect` sync cả 3 từ settings (đúng skill 6.1).
   - Thêm `ColorConfigCard` để override preview realtime.
   - `getPreviewProps()` truyền đủ `brandColor`, `secondaryColor`, `colorMode` (bỏ hardcode `#06b6d4`).
   - Accent UI trong controls dùng `brandColor` hiện tại thay hardcode.
   - Reflection: fix 1.2, đảm bảo CoC + single/dual behavior.

3. Refactor `ProductDetailPreview` dùng tokens 100%
   - File: `components/experiences/previews/ProductDetailPreview.tsx`.
   - Nhận thêm props `secondaryColor`, `colorMode`; gọi `getProductDetailColors(...)` để lấy `tokens`.
   - Thay toàn bộ màu hardcode/inline quan trọng bằng token (bao gồm các layout classic/modern/minimal, badge, CTA, link, active states, variant/chip selected, thumbnail border).
   - Loại các anti-pattern:
     - `${brandColor}10`, `${brandColor}15`, ring/shadow decorative màu brand
     - hardcode `text-slate-*`, `bg-red-*` tại vùng semantic cần brand token
   - Giữ neutral cho adjacency quanh solid primary/secondary.
   - Reflection: preview tuân thủ OKLCH + APCA + 60-30-10 + anti-opacity.

4. Refactor site `/products/[slug]` đồng bộ tokens với preview
   - File: `app/(site)/products/[slug]/page.tsx`.
   - Đổi `useBrandColor()` -> `useBrandColors()` để lấy `primary/secondary/mode`.
   - Tạo `tokens = useMemo(() => getProductDetailColors(primary, secondary, mode), [primary, secondary, mode])`.
   - Truyền `tokens` vào toàn bộ layout components liên quan (`ClassicStyle`, `ModernStyle`, `MinimalStyle`, và các sub-sections có màu).
   - Update signature các component để bắt buộc có `tokens` prop.
   - Thay inline/hardcode màu còn tồn đọng bằng token; đồng bộ cùng map semantic như preview.
   - Reflection: fix 1.3 và đảm bảo preview ≡ site render.

5. Quét tồn đọng rồi tự fix dứt điểm trong đúng scope product-detail
   - Quét các pattern trong 3 file scope trên: `brandColor`, `${color}xx`, `text-slate-*`/`border-slate-*` tại semantic points, `bg-red-*` badge cứng, missing token usage, missing mode/secondary sync.
   - Sửa toàn bộ issue tìm thấy; không mở rộng ra experience khác.

6. Verify + commit
   - Chạy `bunx tsc --noEmit`.
   - Commit 1 lần với message dạng: `fix(product-detail): apply dual-brand token system for preview and site sync`.

## Danh sách vấn đề đã audit (sẽ fix trong implement)
- `app/system/experiences/product-detail/page.tsx`:
  - Hardcode `brandColor: '#06b6d4'` trong preview props.
  - Nhiều `accentColor="#06b6d4"`.
  - Chưa có state `secondaryColor` + `colorMode`, chưa sync từ settings.
- `components/experiences/previews/ProductDetailPreview.tsx`:
  - Chỉ có `brandColor`, không có secondary/mode.
  - Hardcode nhiều màu semantic (`text-slate-*`, `bg-red-*`, button/price/badge/heading...).
  - Có decorative opacity/shadow dựa trên brand ở variant (`boxShadow`, ring theo brand).
  - Chưa có token contract cho badge bg/border/text theo APCA.
- `app/(site)/products/[slug]/page.tsx`:
  - Đang dùng `useBrandColor()` (single màu), thiếu secondary/mode.
  - Chưa có `getProductDetailColors`, chưa pass `tokens` vào layouts.
  - Nhiều inline màu + hardcode (`${brandColor}10`, borderColor brand, text-slate*, bg-red*...) chưa đồng bộ preview.

Nếu bạn duyệt plan này, mình sẽ implement ngay, chạy `bunx tsc --noEmit`, rồi commit đúng scope product-detail.