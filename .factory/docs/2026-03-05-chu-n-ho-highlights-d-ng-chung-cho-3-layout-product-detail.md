## Problem Graph
1. [Main] Highlights chưa “dùng chung hoàn toàn” theo yêu cầu mới <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Settings còn chia toggle theo layout (classic vs modern/minimal)
   1.2 [Sub] UI card vẫn hiện tiêu đề “Highlights (Classic)” và control phân nhánh theo layout
   1.3 [Sub] Runtime site đang dùng `showClassicHighlights` cho Classic, `showHighlights` cho Modern/Minimal thay vì 1 cờ chung

## Execution (with reflection)
1. Chuẩn hoá schema/toggle thành 1 nguồn chung duy nhất
   - File: `app/system/experiences/product-detail/page.tsx`
   - Thay đổi:
     - Giữ **1 toggle chung** duy nhất ở `layouts.classic.showClassicHighlights` làm nguồn chính.
     - Bỏ phụ thuộc `showHighlights` trong `ModernLayoutConfig` và `MinimalLayoutConfig` (không còn toggle riêng).
     - `DEFAULT_CONFIG`: chỉ `classic.showClassicHighlights` điều khiển hiển thị highlights toàn bộ 3 layout.
     - `getPreviewProps()`: luôn map `showHighlights` từ `config.layouts.classic.showClassicHighlights` (không theo layout hiện tại).
   - Reflection: ✓ Đúng yêu cầu “1 toggle chung cho cả 3”.

2. Gộp UI settings để “cả 3 layout học theo Classic”
   - File: `app/system/experiences/product-detail/page.tsx`
   - Thay đổi:
     - Đổi title card từ `Highlights (Classic)` thành `Highlights`.
     - Trong card này luôn render **đầy đủ editor Classic** (toggle + list item icon/text + add/remove) cho mọi tab layout.
     - Không render toggle highlights ở nhánh Modern/Minimal nữa; chỉ giữ control riêng của chúng (`Hero Style`, `Content Width`).
     - `additionalSettings` tiếp tục sync `products_detail_classic_highlights_enabled` từ toggle chung để tương thích dữ liệu cũ.
   - Reflection: ✓ Chỗ chỉnh text/icon chỉ còn một nơi, đúng ý “chi tiết như Classic”.

3. Đồng bộ preview để 2 layout còn lại học theo Classic
   - File: `components/experiences/previews/ProductDetailPreview.tsx`
   - Thay đổi:
     - Giữ block `renderHighlights` dùng chung như hiện tại.
     - Block này hiển thị cho Classic/Modern/Minimal theo cùng `showHighlights` + cùng `classicHighlights` list.
     - Vị trí Modern/Minimal vẫn dưới CTA (như anh đã chốt).
   - Reflection: ✓ Preview 3 layout dùng chung data và cờ hiển thị.

4. Đồng bộ render site thật theo cấu hình chung
   - File: `app/(site)/products/[slug]/page.tsx`
   - Thay đổi:
     - `useProductDetailExperienceConfig()` chuẩn hoá `showHighlights` lấy từ nguồn chung (ưu tiên legacy + classic toggle), không lấy theo layout modern/minimal nữa.
     - `classicHighlightsEnabled` dùng trực tiếp cờ chung này cho cả 3 style.
     - `ClassicStyle`, `ModernStyle`, `MinimalStyle` đều nhận cùng highlights data và cùng cờ hiển thị; Modern/Minimal vẫn render dưới CTA qua `HighlightsGrid`.
   - Reflection: ✓ Render thật bám đúng settings chung, không lệch giữa layout.

5. Verification
   - Chạy `bunx tsc --noEmit`.
   - Kiểm tra `/system/experiences/product-detail`:
     - Card tên `Highlights` (không còn “Classic”).
     - Dù đang tab Classic/Modern/Minimal, vẫn chỉnh được icon/text trong cùng 1 nơi.
     - Toggle 1 lần, preview cả 3 layout cùng bật/tắt.
   - Kiểm tra `/products/[slug]`:
     - Cùng bộ icon/text xuất hiện ở 3 layout.
     - Modern/Minimal render highlights ở dưới CTA, giống preview.

## Checklist chốt
- [x] 1 toggle chung cho cả 3 layout.
- [x] 1 bộ data highlight (icon/text) dùng chung.
- [x] Bỏ label “Highlights (Classic)” -> `Highlights`.
- [x] Modern/Minimal preview + render học theo Classic hoàn toàn (về data và bật/tắt).