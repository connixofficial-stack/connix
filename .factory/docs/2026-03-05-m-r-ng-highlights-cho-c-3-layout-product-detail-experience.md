## Problem Graph
1. [Main] Highlights hiện chỉ hoạt động đúng ở Classic <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Schema config chỉ có `showClassicHighlights`, thiếu toggle theo layout Modern/Minimal
   1.2 [Sub] Preview component chỉ render highlights cho nhánh `layoutStyle === 'classic'`
   1.3 [Sub] Site render (`app/(site)/products/[slug]/page.tsx`) chỉ truyền/đọc highlights cho `ClassicStyle`

## Execution (with reflection)
1. Solving 1.1 (schema + settings page)
   - Thought: Dùng chung 1 danh sách highlights nhưng toggle riêng từng layout để giữ đồng bộ dữ liệu + linh hoạt hiển thị.
   - Action:
     - File `app/system/experiences/product-detail/page.tsx`:
       - Mở rộng `ModernLayoutConfig`, `MinimalLayoutConfig` thêm field `showHighlights: boolean`.
       - `DEFAULT_CONFIG.layouts.modern/minimal` thêm `showHighlights: true`.
       - Trong `serverConfig` merge fallback cho dữ liệu cũ:
         - modern/minimal: ưu tiên `raw.layouts[layout].showHighlights`, fallback từ legacy/global nếu cần.
         - classic giữ `showClassicHighlights` để tương thích ngược.
       - Trong `getPreviewProps()`: thay `showClassicHighlights` thành cờ tổng quát theo layout hiện tại (vd `showHighlights`) nhưng vẫn tương thích prop cũ nếu chưa refactor xong.
       - Trong `renderLayoutSpecificControls()`:
         - Classic: giữ UI chỉnh list icon/text + toggle hiện có.
         - Modern/Minimal: thêm `ToggleRow` “Highlights” trước các control riêng (`heroStyle`/`contentWidth`).
       - Chuẩn hóa `additionalSettings` để legacy key `products_detail_classic_highlights_enabled` vẫn map từ classic toggle (không phá dữ liệu cũ).
       - `handleSave` lưu đầy đủ layout toggles mới vào `product_detail_ui.layouts`.
   - Reflection: ✓ Giải quyết được phần “setting có ở cả 3 layout” và vẫn giữ backward compatibility.

2. Solving 1.2 (preview)
   - Thought: Preview phải thấy ngay effect cho cả 3 layout, vị trí theo yêu cầu: dưới cụm CTA.
   - Action:
     - File `components/experiences/previews/ProductDetailPreview.tsx`:
       - Đổi props từ `showClassicHighlights` sang `showHighlights` (hoặc hỗ trợ cả 2 tạm thời để migration an toàn).
       - Tách khối highlights thành reusable fragment/helper dùng chung.
       - Classic: giữ vị trí hiện tại (đang dưới CTA).
       - Modern: chèn block highlights ngay sau cụm CTA buttons.
       - Minimal: chèn block highlights ngay sau cụm CTA buttons.
       - Dùng chung `classicHighlights` list; fallback default hiện có khi list rỗng.
   - Reflection: ✓ Đảm bảo parity preview giữa 3 layout, tránh duplicate logic.

3. Solving 1.3 (site render thực tế)
   - Thought: Cần truyền trạng thái highlights theo layout để render thật khớp preview/settings.
   - Action:
     - File `app/(site)/products/[slug]/page.tsx`:
       - Mở rộng type config runtime:
         - giữ `showClassicHighlights` cho legacy.
         - thêm `showHighlights` cho modern/minimal trong layout config đọc từ `product_detail_ui`.
       - Trong `useProductDetailExperienceConfig()`:
         - resolve `showHighlights` theo `layoutStyle`:
           - classic => ưu tiên `showClassicHighlights` cũ.
           - modern/minimal => đọc `layouts[layout].showHighlights`, fallback hợp lý.
       - Mở rộng `ExperienceBlocksProps` thêm `showHighlights` (hoặc pass prop riêng cho từng style).
       - Reuse renderer highlights dùng chung icon map + list data (`useClassicHighlights()`) cho:
         - `ModernStyle`: render dưới CTA section.
         - `MinimalStyle`: render dưới CTA section.
       - `ClassicStyle` giữ hành vi hiện có.
   - Reflection: ✓ Đảm bảo “render tương ứng” đúng yêu cầu, không chỉ preview.

4. Verification plan
   - Chạy typecheck: `bunx tsc --noEmit`.
   - Kiểm tra thủ công tại `/system/experiences/product-detail`:
     - Chuyển qua Classic/Modern/Minimal đều thấy toggle Highlights trong settings.
     - Modern/Minimal bật/tắt độc lập không ảnh hưởng nhau.
     - Danh sách highlights (icon/text) dùng chung khi đổi layout.
     - Preview 3 layout đều hiển thị highlights dưới CTA khi bật.
   - Kiểm tra site `/products/[slug]`:
     - 3 layout render đúng vị trí dưới CTA.
     - Toggle từng layout phản ánh đúng.
   - Commit sau khi pass typecheck, kèm `.factory/docs` nếu có thay đổi liên quan theo rule repo.

## Checklist chốt cho anh
- [x] Highlights có mặt ở **settings + preview + render** cho cả Classic/Modern/Minimal.
- [x] Dùng chung **1 danh sách highlights** (icon/text) cho 3 layout.
- [x] Mỗi layout có **toggle riêng**.
- [x] Vị trí Modern/Minimal: **ngay dưới CTA**.
- [x] Giữ tương thích dữ liệu cũ (legacy keys).