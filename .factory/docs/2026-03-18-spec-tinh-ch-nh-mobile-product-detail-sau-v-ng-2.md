## Audit Summary
- Observation: Vuốt gallery mobile đang mượt ở mức gesture nhưng khi đổi slide có cảm giác giựt/FOUC.
  - Evidence: `app/(site)/products/[slug]/page.tsx:973` đang dùng `scrollTo({ behavior: 'smooth' })` mỗi khi `selectedIndex` đổi, đồng thời `onScroll` lại tiếp tục cập nhật state. Đây là pattern dễ tạo vòng đồng bộ 2 chiều giữa native scroll và React state.
  - Preview cũng đang dùng pattern mobile carousel riêng tại `components/experiences/previews/ProductDetailPreview.tsx:165`, nên nếu chỉ sửa site thì preview sẽ lệch behavior.
- Observation: Category và stock hiện đang tách làm 2 block khác nhau.
  - Evidence:
    - Classic: category badge ở `page.tsx:1354`, stock status ở `page.tsx:1462`.
    - Modern: category badge ở `page.tsx:1765`, stock status ở `page.tsx:1873`.
    - Minimal: breadcrumb/category riêng, stock status ở action block `page.tsx:2164`.
- Observation: Title + price trên mobile vẫn hơi lớn và spacing giữa các block đầu trang còn rộng hơn mục tiêu mới.
  - Evidence:
    - Classic title/price: `page.tsx:1363`, `page.tsx:1372`
    - Modern title/price: `page.tsx:1779`, `page.tsx:1788`
    - Minimal title/price: `page.tsx:2098+` và khối price ngay dưới.
- User decisions đã chốt:
  - Category + stock: cùng 1 dòng ngay trên tên sản phẩm.
  - Swipe fix: giữ smooth nhưng debounce state.

## Root Cause Confidence
**High** — Có 2 root cause chính:
1. Gallery mobile bị giựt vì đang có cơ chế sync hai chiều giữa `scrollTo(..., smooth)` và `onScroll -> onSelect`, khiến state thay đổi trong lúc animation native chưa ổn định.
2. Phần đầu trang mobile chưa đủ compact vì metadata, title, price và spacing vẫn tách thành nhiều nhịp thị giác hơn cần thiết.

Counter-hypothesis đã loại trừ:
- Không phải do thiếu ảnh/loading data vì preview tĩnh vẫn có thể tái hiện cảm giác giựt với cùng pattern scroll.
- Không phải do desktop rail vì lỗi chỉ xuất hiện ở mobile carousel path.

## Proposal
### 1) Fix swipe mượt nhưng không giựt
Áp dụng cho site và preview.

- Giữ gesture swipe ngang + smooth.
- Bỏ pattern cập nhật state liên tục ở mỗi `scroll` frame.
- Thay bằng debounce/settle detection:
  - `onScroll` chỉ ghi nhận vị trí hiện tại.
  - Sau một khoảng ngắn không còn scroll (ví dụ 80–120ms), mới tính slide active và `setSelectedIndex`.
- Chỉ gọi `scrollTo({ behavior: 'smooth' })` khi chuyển slide từ nguồn không phải native swipe (ví dụ click thumbnail desktop hoặc sync programmatic thực sự cần thiết).
- Với mobile swipe thuần, ưu tiên để native scroll hoàn tất rồi mới sync state, tránh fight giữa animation và state update.

Kỳ vọng:
- Không còn cảm giác flash/jump khi vuốt qua ảnh mới.
- Overlay count cập nhật ổn định sau khi swipe settle.

### 2) Gộp category + stock thành 1 meta row ngay trên tên SP
Áp dụng cho mobile ở cả 3 layout, preview mirror tương ứng.

- Tạo một meta row compact ngay trên title gồm:
  - category badge/text
  - stock status dạng chip/dot text
- Row này dùng spacing nhỏ hơn hiện tại, ưu tiên 1 dòng, wrap mềm nếu text dài.
- Stock không nằm tách riêng dưới action nữa trên mobile.
- Desktop giữ nguyên behavior hiện tại để không mở rộng scope.

Kỳ vọng:
- User nhìn phát thấy ngay context + tình trạng trước khi đọc title.
- Giảm 1 block chiều cao phía dưới action.

### 3) Giảm title + price thêm 1 nấc trên mobile
Áp dụng cho mobile, desktop giữ nguyên.

Đề xuất scale:
- Classic:
  - title từ `text-2xl` -> `text-xl`
  - price từ `text-2xl` -> `text-xl`
- Modern:
  - title từ `text-2xl` -> `text-xl` hoặc `text-[22px]`
  - price từ `text-2xl` -> `text-xl`
- Minimal:
  - title từ `text-2xl` -> `text-xl`
  - price từ `text-xl` -> `text-lg` hoặc giảm weight/gap nhẹ hơn nếu cần giữ prominence

Nguyên tắc:
- Chỉ mobile giảm 1 nấc.
- Vẫn giữ title > price > meta về hierarchy.

### 4) Giảm spacing thêm “kha khá” ở hero mobile
Tập trung giảm các khoảng sau:
- breadcrumb -> gallery
- gallery -> meta row
- meta row -> title
- title -> rating/price
- price -> variants/action

Cách làm:
- Giảm `space-y-*`, `mb-*`, `py-*`, `gap-*` ở mobile-only wrappers.
- Không nén desktop/tablet.
- Ưu tiên giảm đều thay vì dồn mạnh vào một chỗ để tránh layout bị bí.

### 5) Mirror preview đúng contract mới
File: `components/experiences/previews/ProductDetailPreview.tsx`
- PreviewMobileCarousel cũng chuyển sang debounce settle logic tương tự site.
- Meta row mobile = category + stock cùng dòng trên title.
- Title/price/spacing giảm cùng thang với site thật.

## File-level implementation plan
1. `app/(site)/products/[slug]/page.tsx`
   - Refactor `MobileImageCarousel` để bỏ state sync trực diện trong `onScroll`.
   - Dùng debounce settle để cập nhật active index sau swipe.
   - Tách/ghép lại meta row mobile: category + stock trên cùng một dòng ngay trên title.
   - Giảm font-size mobile cho title/price.
   - Giảm spacing mobile tại hero/info block.

2. `components/experiences/previews/ProductDetailPreview.tsx`
   - Refactor `PreviewMobileCarousel` theo cùng cơ chế settle/debounce.
   - Mirror meta row mới.
   - Mirror typography + spacing mới.

## Verification Plan
- Static review:
  - Soát rằng debounce không làm mất sync index khi swipe nhanh nhiều ảnh.
  - Soát desktop/tablet không bị ảnh hưởng behavior ngoài scope.
  - Soát row category + stock không đè nhau khi text dài.
- Typecheck:
  - Chạy `bunx tsc --noEmit` sau khi sửa.
- Repro checklist cho tester:
  1. Swipe mobile qua nhiều ảnh liên tiếp không còn flash/jump khó chịu.
  2. Overlay count đổi ổn định sau khi swipe dừng.
  3. Category + stock nằm cùng 1 dòng ngay trên title ở mobile.
  4. Title + price nhỏ hơn 1 nấc so với bản hiện tại.
  5. Tổng chiều cao hero mobile gọn hơn rõ rệt.
  6. Desktop và tablet giữ behavior hiện có.

Nếu anh duyệt, em sẽ sửa đúng 3 ý này, không mở rộng scope thêm.