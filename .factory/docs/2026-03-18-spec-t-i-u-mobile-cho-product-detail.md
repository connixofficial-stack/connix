## Audit Summary
- Observation: Mobile product detail hiện tại quá dài và thiếu ưu tiên thị giác, đặc biệt ở vùng đầu trang.
  - Screenshot `00_28_01.png`: breadcrumb cao, khoảng trắng lớn, ảnh chính cách trang quá xa, thumbnail strip chiếm thêm 1 block chiều cao.
  - Screenshot `00_28_22.png`: quá nhiều ảnh phụ dạng list dưới ảnh chính, làm đẩy tên + giá + CTA xuống sâu; thông tin chính không vào được trong first viewport.
  - Screenshot `00_27_50.png`: spacing đầu trang còn dày; giá, CTA, trust badges, tình trạng đang tách thành nhiều block khiến scan chậm.
- Observation: User goal rất rõ: trên mobile phải ưu tiên “thấy hết phần quan trọng càng sớm càng tốt”, giảm scroll vô nghĩa, nhưng vẫn cho user biết có nhiều ảnh và cho phép vuốt mượt.
- Research evidence:
  - Baymard cho thấy mobile product page cần hierarchy thật gọn; breadcrumb nên giữ vai trò định hướng nhưng phải tiết chế để không chiếm không gian đầu màn hình.
  - Với mobile gallery, pattern hiệu quả là ảnh chính lớn + swipe + indicator gọn; không nên nhồi thumbnail list đầy đủ vì tốn chiều cao mà ít giá trị hơn thao tác vuốt.
- User decisions đã chốt qua AskUser:
  - Gallery mobile: `1/8 overlay + vuốt ngang`
  - Breadcrumb mobile: `Chỉ hiện danh mục cuối + tên SP`
  - Giá/tồn kho: `Chỉ giá, tồn kho đưa xuống action`

## Root Cause Confidence
**High** — Root cause không nằm ở thiếu dữ liệu hay layout desktop, mà ở việc mobile đang reuse quá nhiều cấu trúc “desktop thinking”: breadcrumb đầy đủ, thumbnail list hiển thị thẳng, spacing rộng, và thông tin quan trọng bị chia nhỏ thành nhiều block. Evidence: 3 screenshot + code hiện tại trong `app/(site)/products/[slug]/page.tsx` đang render thumbnail row trên mobile cho cả 3 layout và breadcrumb/spacing chưa có cơ chế mobile-first đủ mạnh.

## Proposal
### Mục tiêu UX
- Đưa ảnh chính + tên + giá + CTA lên cao hơn trong first viewport mobile.
- Ẩn thumbnail list trên mobile để tiết kiệm chiều cao.
- Vẫn cho người dùng biết còn nhiều ảnh bằng indicator ngắn gọn.
- Vuốt gallery mượt, không cần ảnh phụ lộ ra dưới ảnh chính.
- Giảm text và spacing tối đa nhưng vẫn rõ nghĩa.

### Quy tắc mobile đề xuất
#### 1) Mobile gallery: bỏ thumbnail strip, thay bằng swipe + overlay count
- Ẩn hoàn toàn thumbnail strip trên mobile ở cả `classic`, `modern`, `minimal`.
- Ảnh chính trở thành vùng gallery swipe ngang trực tiếp.
- Overlay count đặt gọn trong ảnh, ví dụ `1/8`, ở góc phải dưới hoặc phải trên, nền mờ nhẹ để dễ đọc.
- Swipe phải mượt bằng native horizontal pan/snap; không thêm control thừa.
- Nếu chỉ có 1 ảnh: ẩn luôn overlay count.

#### 2) Mobile breadcrumb: rút còn 2 tầng
- Chỉ hiện: `Danh mục cuối > Tên SP`.
- Giảm font xuống mức `text-[11px]` hoặc `text-xs`, giảm gap icon/ngăn cách.
- Giảm top/bottom padding mạnh để breadcrumb chỉ còn vai trò định vị, không tranh không gian với ảnh sản phẩm.
- Không wrap nhiều dòng nếu có thể; tên sản phẩm truncate 1 dòng ở breadcrumb.

#### 3) Giảm spacing đầu trang mạnh
- Giảm khoảng cách giữa:
  - header → breadcrumb
  - breadcrumb → gallery
  - gallery → title/price
- Ảnh chính mobile nên gần mép nội dung hơn, bỏ cảm giác “khối ảnh bị thả xuống quá sâu”.
- Các section sau title cũng giảm vertical rhythm theo hướng compact-first.

#### 4) Giá và tình trạng: tối giản hóa hierarchy
- Dòng trên chỉ giữ **giá** (vd `Giá liên hệ` hoặc giá tiền).
- Trạng thái tồn kho không đứng thành block riêng lớn ngay dưới nữa.
- Thay vào đó, đưa tồn kho xuống vùng action dưới dạng microcopy/chip ngắn, ví dụ:
  - `Còn hàng`
  - `Sắp hết`
  - `Hết hàng`
- Mục tiêu: title + giá scan trong 1 nhịp nhìn, không bị chia cắt bởi text phụ.

#### 5) CTA/action row gọn hơn
- Gom quantity + CTA theo layout compact hơn trên mobile.
- Nếu sale mode là `contact`, ưu tiên CTA chính nổi bật, quantity có thể giảm visual weight.
- Trust badges vẫn giữ nhưng thu nhỏ padding/gap để không chiếm quá nhiều chiều cao.

### File-level implementation plan
1. `app/(site)/products/[slug]/page.tsx`
   - Tạo mobile gallery behavior chung cho 3 layout:
     - swipeable main image
     - overlay `current/total`
     - ẩn thumbnail rail/strip ở mobile
   - Rút gọn breadcrumb mobile còn category cuối + product name.
   - Giảm padding/margin ở các wrapper mobile quanh breadcrumb, gallery, title, price.
   - Refactor khối price/stock để chỉ giữ giá ở line chính; stock chuyển xuống action/meta compact.
   - Tinh gọn trust badges và action spacing ở mobile.

2. Nếu cần, tách helper nhỏ dùng chung
   - `MobileGalleryIndicator`
   - `useSwipeGallery` hoặc carousel logic tối giản ngay trong file nếu scope nhỏ hơn.
- Ưu tiên thay đổi nhỏ, không thêm library mới nếu không cần.

3. `components/experiences/previews/ProductDetailPreview.tsx`
   - Mirror đúng contract mobile mới để preview khớp site thật.
   - Ẩn thumbnail list trên mobile preview.
   - Thêm overlay `1/8` trên ảnh preview mobile.
   - Điều chỉnh spacing preview mobile để phản ánh layout compact hơn.

### Expected behavior sau khi làm
- Mobile vào trang là thấy nhanh: ảnh chính lớn, breadcrumb gọn, title + giá sát hơn.
- Không còn dải ảnh phụ dài dưới ảnh chính trên mobile.
- User biết có nhiều ảnh nhờ badge `1/8`, và vuốt ngang trực tiếp trên ảnh.
- Giá hiển thị rõ, tồn kho lùi xuống vùng action/meta ngắn gọn.
- Tổng chiều cao phần “hero” mobile giảm đáng kể.

### Counter-hypothesis đã loại trừ
- “Giữ thumbnail mobile nhưng thu nhỏ lại”: Low confidence, vì vẫn tốn chiều cao đáng kể và không phục vụ goal “thấy full phần chính trong màn hình”.
- “Ẩn luôn mọi tín hiệu còn ảnh khác”: Low confidence, vì user sẽ không discover được swipe.
- “Ẩn breadcrumb hoàn toàn”: không hợp quyết định user; đồng thời mất định hướng category path.

## Verification Plan
- Static review:
  - Soát điều kiện mobile-only để desktop/tablet không bị ảnh hưởng ngoài scope.
  - Soát state gallery khi swipe và cập nhật overlay `current/total`.
  - Soát layout title/price/action để information density tăng nhưng vẫn không bị chật.
- Typecheck:
  - Chạy `bunx tsc --noEmit` sau khi sửa TS/TSX.
- Repro checklist cho tester:
  1. Mobile với nhiều ảnh: không còn thumbnail strip dưới ảnh, có overlay `1/N`, vuốt ngang đổi ảnh mượt.
  2. Mobile với 1 ảnh: không hiện overlay count.
  3. Breadcrumb mobile chỉ còn category cuối + tên sản phẩm, không chiếm nhiều chiều cao.
  4. Title + giá xuất hiện sớm hơn trong viewport đầu.
  5. Tồn kho nằm ở action/meta compact, không còn thành block tách rời lớn.
  6. Desktop vẫn giữ behavior đã chốt trước đó.

Nếu anh duyệt spec này, tôi sẽ triển khai theo đúng hướng: **mobile compact-first, bỏ ảnh phụ hiển thị trực tiếp, dùng swipe + overlay count, giảm mạnh spacing và rút gọn hierarchy phần đầu trang**.