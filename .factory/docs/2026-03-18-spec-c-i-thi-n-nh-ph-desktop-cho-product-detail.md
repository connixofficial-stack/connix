## Audit Summary
- Observation: Ở cả 3 layout desktop, gallery ảnh phụ đang xử lý chưa nhất quán và chưa KISS khi số ảnh tăng.
  - `classic`: ảnh phụ đang xếp dọc toàn bộ cột trái, dễ kéo layout quá dài khi nhiều ảnh. Evidence: screenshot `00_00_00.png`; code `components/experiences/previews/ProductDetailPreview.tsx` đoạn layout `classic` đang chỉ render grid 4 ảnh trong preview, nhưng route thật đang cho list dọc dài.
  - `modern`: ảnh phụ là hàng ngang scroll tay, thiếu affordance rõ ràng khi overflow. Evidence: screenshot `00_02_56.png`; code preview đang dùng `flex gap-2 overflow-x-auto`.
  - `minimal`: ảnh phụ nằm hàng ngang/dọc nhưng không có cơ chế phân biệt rõ ít ảnh vs nhiều ảnh. Evidence: screenshot `00_02_38.png`; code preview đang `slice(0, 3)` nên không phản ánh case nhiều ảnh thật.
- Observation: User expectation đã rõ: nhiều ảnh thì dùng mũi tên; ít ảnh thì ẩn control để giữ KISS.
- Research evidence:
  - Baymard chỉ ra việc truncate gallery thumbnails khiến 50–80% user bỏ sót ảnh bổ sung, nên không nên “cắt cụt mà không có affordance”.
  - Baymard cũng nhấn mạnh thumbnails vẫn là pattern mạnh để biểu diễn ảnh bổ sung; vấn đề là cách overflow phải rõ ràng.
- Decision: Dùng một gallery behavior thống nhất cho desktop ở cả 3 layout: chỉ hiện thumbnail rail tĩnh khi ít ảnh, và chuyển sang rail có điều hướng mũi tên khi vượt ngưỡng.

## Root Cause Confidence
**High** — Vấn đề chính không phải thiếu ảnh hay thiếu thumbnail, mà là thiếu quy tắc overflow rõ ràng và thiếu affordance điều hướng khi số ảnh phụ vượt sức chứa desktop. Evidence đến từ 3 screenshot + code preview hiện tại đang render mỗi layout theo kiểu riêng (`grid`, `overflow-x-auto`, `slice(0,3)`) nên UX bị lệch và không scale khi nhiều ảnh.

## Proposal
### Mục tiêu UX
- KISS khi ít ảnh.
- Rõ affordance khi nhiều ảnh.
- Đồng nhất hành vi ở cả `classic`, `modern`, `minimal` trên desktop.

### Quy tắc hiển thị đề xuất
#### 1) Desktop thumbnail behavior chung
- Nếu `imageCount <= visibleSlotsDesktop`: hiển thị thumbnail strip bình thường, **không hiện mũi tên, không hiện scrollbar**.
- Nếu `imageCount > visibleSlotsDesktop`: hiển thị **mũi tên prev/next** ở 2 đầu strip và chỉ show đúng số slot nhìn thấy.
- Không dùng list dọc kéo quá dài cho desktop nữa.
- Có state active thumbnail rõ bằng border/ring mạnh hơn ảnh còn lại.

#### 2) Ngưỡng theo layout
- `classic`: rail dọc bên trái, `visibleSlotsDesktop = 6`
- `modern`: rail ngang dưới ảnh chính, `visibleSlotsDesktop = 5`
- `minimal`: rail ngang dưới ảnh chính hoặc dọc cạnh ảnh tùy breakpoint lớn, `visibleSlotsDesktop = 6`

Lý do: giữ đặc trưng bố cục từng layout, nhưng thống nhất logic overflow.

#### 3) Điều hướng khi nhiều ảnh
- Mũi tên chỉ hiện khi overflow.
- Click mũi tên dịch theo “page” nhỏ (ví dụ 1–2 thumbnail hoặc 1 viewport strip), không autoplay.
- Ẩn/disable mũi tên ở đầu/cuối danh sách.
- Có thể thêm text nhỏ kiểu `3/10` nếu cần, nhưng mặc định ưu tiên tối giản, chỉ thêm nếu code hiện tại cần rõ trạng thái hơn.

#### 4) KISS rules
- 1–5/6 ảnh: chỉ thumbnail, không arrows.
- >5/6 ảnh: có arrows.
- Không thêm dot pagination.
- Không thêm hover animation phức tạp.
- Không thêm lightbox trong scope này.

### File-level implementation plan
1. `components/experiences/previews/ProductDetailPreview.tsx`
   - Tạo helper/gallery subcomponent dùng chung cho desktop thumbnail rail.
   - Chuẩn hóa props theo `orientation`, `visibleSlots`, `showArrowsWhenOverflow`.
   - Cập nhật cả 3 layout preview để phản ánh đúng behavior mới.
   - Với preview data, tăng `PREVIEW_IMAGES` hoặc mock thêm ảnh để test case overflow thật trong editor.

2. Tìm component gallery của route thật `/products/[slug]` tương ứng và áp cùng contract
   - Đọc route thật từ codebase rồi sửa component gallery dùng ở site render, không chỉ preview.
   - Chuẩn hóa logic `hasOverflow`, `canScrollPrev`, `canScrollNext`, `visible thumbnails`.
   - Với `classic`, thay list dọc dài bằng viewport cố định + arrows khi vượt ngưỡng.

3. Giữ parity preview = site
   - Preview và UI thật dùng cùng một ruleset/ngưỡng để tránh lệch giữa `/system/experiences/product-detail` và trang sản phẩm thật.

### Expected behavior sau khi làm
- Classic desktop: nếu ít ảnh, cột thumbnail gọn; nếu nhiều ảnh, cột thumbnail có prev/next, không kéo dài page.
- Modern desktop: nếu ít ảnh, hàng thumbnail sạch; nếu nhiều ảnh, hàng thumbnail có arrows rõ ràng thay vì bắt user tự đoán là có thể scroll.
- Minimal desktop: vẫn tối giản, nhưng khi nhiều ảnh sẽ có arrows thay vì nhồi ảnh hoặc cắt cụt.

### Counter-hypothesis đã loại trừ
- “Chỉ cần cho overflow-x auto là đủ”: Low confidence, vì affordance yếu; screenshot modern hiện đã cho thấy người dùng khó nhận biết còn ảnh bên phải.
- “Luôn hiện arrows kể cả ít ảnh”: không hợp KISS, tạo noise thị giác vô ích.
- “Chỉ cắt bớt thumbnail và thêm +N”: Baymard cho thấy truncate dễ làm user bỏ sót ảnh, nên không recommend cho gallery chính.

## Verification Plan
- Static review:
  - Soát logic điều kiện `imageCount <= visibleSlots` và `> visibleSlots` cho cả 3 layout.
  - Soát state đầu/cuối để arrows disable đúng.
  - Soát parity preview/site để không lệch behavior.
- Typecheck:
  - Chạy `bunx tsc --noEmit` sau khi có thay đổi TS/TSX.
- Repro checklist thủ công cho tester:
  1. Với 3 ảnh: không có arrows ở cả 3 layout desktop.
  2. Với 8–10 ảnh: arrows xuất hiện, thumbnail không làm layout dài bất thường.
  3. Ảnh active đổi đúng khi click thumbnail hoặc điều hướng.
  4. Layout desktop không xuất hiện scrollbar thumbnail lộ liễu ngoài ý muốn.
  5. Tablet/mobile không bị ảnh hưởng ngoài scope desktop.

Nếu bạn duyệt spec này, tôi sẽ triển khai theo đúng rule: **ít ảnh thì ẩn controls, nhiều ảnh thì hiện mũi tên rõ ràng, áp đồng nhất cho cả 3 layout**.