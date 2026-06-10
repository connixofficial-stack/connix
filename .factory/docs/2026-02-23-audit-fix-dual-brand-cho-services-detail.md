## Problem Graph
1. [Main] Chuẩn hoá màu services-detail theo skill dual-brand <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Chưa có token engine `getServiceDetailColors` dùng chung preview + site
   1.2 [Sub] Trang `/system/experiences/services-detail` chỉ dùng `useBrandColor()` (thiếu secondary + mode sync)
   1.3 [Sub] Preview `ServiceDetailPreview` đang hardcode nhiều màu/opacity (`${brandColor}10`, `30`, gradient...) và chưa hỗ trợ dual đúng chuẩn
   1.4 [Sub] Site `/services/[slug]` (qua `ServiceDetailStyles.tsx`) còn hardcode slate/amber + inline brandColor, chưa đồng bộ với preview

## Execution (with reflection)
1. Tạo token engine mới cho services-detail
- File mới: `components/site/services/detail/_lib/colors.ts` (hoặc vị trí tương đương theo convention đang dùng).
- Tạo `getServiceDetailColors(primary, secondary, mode)` dùng OKLCH + APCA pipeline đúng skill:
  - Guard parse màu an toàn.
  - `resolveSecondaryForMode` (single => secondary = primary, dual => secondary hợp lệ hoặc fallback primary).
  - Sinh semantic tokens đầy đủ cho cả 3 layout (classic/modern/minimal): heading, badge, price, CTA bg/text, link, card bg/border, meta text, related item, quick-contact block, fallback thumbnail, decorative neutral-safe.
  - Loại bỏ opacity decorative `${color}XX`; thay bằng solid tint/shade token.
- Reflection: giải đúng ROOT CAUSE vì tạo single source of truth.

2. Audit + refactor Experience page `app/system/experiences/services-detail/page.tsx`
- Đổi `useBrandColor()` -> `useBrandColors()`.
- Thêm state: `brandColor`, `secondaryColor`, `colorMode` + `useEffect` sync đủ 3 giá trị từ settings (CoC).
- Thêm `ColorConfigCard` trong khối controls để chỉnh single/dual + 2 color pickers.
- Cập nhật `getPreviewProps()` truyền `brandColor`, `secondaryColor`, `colorMode` vào `ServiceDetailPreview`.
- Thay các accent hardcode tím (`#8b5cf6`) bằng `brandColor` hoặc token phù hợp để đồng bộ.
- Reflection: đảm bảo behavior F5 sync mode/màu từ settings giống các experience chuẩn.

3. Refactor Preview `components/experiences/previews/DetailPreview.tsx` (scope chỉ phần ServiceDetail)
- Mở rộng `ServiceDetailPreviewProps` có `secondaryColor`, `colorMode`.
- Inject `tokens = getServiceDetailColors(brandColor, secondaryColor, colorMode)` trong `ServiceDetailPreview`.
- Truyền `tokens` xuống `ClassicServicePreview`, `ModernServicePreview`, `MinimalServicePreview`.
- Thay toàn bộ hardcode màu/opacity/decor trong ServiceDetail preview bằng semantic tokens:
  - Badge, category, price, CTA, related card, links, border, hero decor, fallback thumb.
  - Giữ neutral adjacency cho nền/border khi dùng primary/secondary solid.
  - Text on solid dùng APCA-guard token.
- Reflection: preview dual/single nhất quán, không còn anti-pattern opacity decorative.

4. Refactor Site render `components/site/services/detail/ServiceDetailStyles.tsx`
- Thêm `tokens` vào `StyleProps` (giữ `brandColor` cho backward-compat nếu cần).
- Mỗi layout `ClassicStyle/ModernStyle/MinimalStyle` thay hardcode màu bằng tokens:
  - H1/heading, meta, category badge, price, CTA, quick-contact card, related cards/items, back link, prose link/border.
  - Loại bỏ `${brandColor}10/30/80` và hardcode slate/amber ở các điểm brand-sensitive theo mapping token.
- Cập nhật `FallbackServiceThumb`/`RelatedServiceThumb` để dùng token fallback nền/icon thay vì gradient opacity.
- Reflection: site dùng cùng token engine với preview => đồng bộ `/system/experiences/services-detail` và `/services/[slug]`.

5. Wire tokens tại nơi render site page services detail
- Tìm file route `/services/[slug]` đang gọi `ClassicStyle/ModernStyle/MinimalStyle`.
- Tạo `tokens` bằng `getServiceDetailColors(brandColors.primary, brandColors.secondary, brandColors.mode)`.
- Pass `tokens` vào tất cả style components.
- Reflection: hoàn tất single source of truth end-to-end.

6. Audit checklist bắt buộc (liệt kê và fix hết trong scope services-detail)
- Quét và fix toàn bộ:
  - hardcode color trong service-detail preview/site,
  - opacity decorative,
  - thiếu token semantic,
  - thiếu sync secondary/mode,
  - thiếu token cho text on solid/CTA/badge/related/quick-contact.
- Xuất ngắn gọn danh sách issue đã fix trong báo cáo cuối.

7. Validate + commit
- Chạy `bunx tsc --noEmit`.
- Commit toàn bộ thay đổi code với message theo style repo, ví dụ: `fix(services-detail): unify dual-brand tokens across preview and site`.
- Không push.

Nếu bạn duyệt plan này, mình sẽ implement ngay đúng phạm vi services-detail.