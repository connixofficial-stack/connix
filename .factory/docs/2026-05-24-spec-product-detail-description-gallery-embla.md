# I. Primer

## 1. TL;DR kiểu Feynman

- Trang chi tiết sản phẩm đang có 3 layout: Classic, Modern, Minimal.
- Mô tả sản phẩm dài nên không nên nằm chật trong cột info; cả 3 layout nên đưa mô tả xuống dưới khu top để rộng hơn.
- SKU là thông tin vận hành/admin, không cần hiện cho khách hàng.
- Hai setting ảnh không lỗi trong case sản phẩm không có gallery; khi có nhiều ảnh thì cần carousel đẹp, vuốt mượt.
- Gallery nhiều ảnh nên dùng Embla API để sync ảnh chính, thumbnail, prev/next và lightbox.
- Lightbox nên dùng React Portal để không bị nhốt trong preview/admin container và tránh UI nổi lồi lên trên modal.

## 2. Elaboration & Self-Explanation

Vấn đề chính là UI contract của product detail chưa thống nhất. Minimal đang xử lý mô tả tốt hơn vì mô tả nằm dưới vùng thông tin chính, có nhiều không gian để đọc. Classic hiện vẫn nhét mô tả trong cột phải, nên khi description dài sẽ bị bí và khó đọc.

Về ảnh, setting “Hiển thị toàn bộ ảnh sản phẩm dưới mô tả” và “Nhấn ảnh chính để mở xem ảnh lớn” chỉ có tác dụng khi sản phẩm thật sự có ảnh gallery. Với sản phẩm chỉ có ảnh chính hoặc không có thumbnail/gallery, việc không thấy section ảnh hoặc lightbox là behavior hợp lý.

Khi sản phẩm có nhiều ảnh, gallery nên có state rõ ràng: ảnh hiện tại là ảnh nào, có thể bấm prev không, có thể bấm next không. Embla API phù hợp vì hỗ trợ vuốt mượt, điều khiển carousel và đồng bộ state. Repo đã có `embla-carousel-react` và `embla-carousel-fade` trong `package.json`, nên không cần thêm dependency.

## 3. Concrete Examples & Analogies

Ví dụ: sản phẩm `nike-air-force-1-07-giay-sneaker-nam-nu` có description dài. Với Classic, description nằm cạnh ảnh/giá/CTA nên đọc bị chật. Sau fix, Classic cũng đưa description xuống dưới giống Minimal để người đọc có không gian ngang rộng hơn.

Analogy: SKU giống mã kho nội bộ trên thùng hàng; nhân viên kho cần, khách mua giày thì không cần thấy trên trang bán hàng.

# II. Audit Summary (Tóm tắt kiểm tra)

- Public route `http://localhost:3000/giay-nike/nike-air-force-1-07-giay-sneaker-nam-nu` đi qua `app/(site)/[categorySlug]/[recordSlug]/page.tsx`.
- UI chính nằm ở `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`.
- Classic render mô tả trong cột product info ở khoảng `ProductDetailPage.tsx:2176-2178`.
- Modern render mô tả ở section dưới top grid ở khoảng `ProductDetailPage.tsx:2709-2744`.
- Minimal render mô tả ở section dưới top grid ở khoảng `ProductDetailPage.tsx:3211-3245`.
- SKU đang hiện ở public UI:
  - Classic: `ProductDetailPage.tsx:2020`.
  - Minimal: `ProductDetailPage.tsx:3199-3202`.
- Lightbox đã có guard `enableImageLightbox && images.length > 0`, nên case không có gallery thì không mở là hợp lý.
- `ProductImageLightbox` hiện render `fixed inset-0 z-[70]` trực tiếp trong cây component, nên có rủi ro bị containing block/z-index khi nằm trong preview/admin container.
- `ProductDetailPreview.tsx` vẫn có preview SKU ở khoảng `ProductDetailPreview.tsx:1295-1299`, cần đồng bộ preview với site public.
- File duplicate cần chú ý: `app/(site)/products/[slug]/page.tsx` có logic tương tự, nếu còn được route dùng thì cần đồng bộ để tránh drift.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High.**

Nguyên nhân gốc là layout public chưa thống nhất vị trí mô tả và còn render SKU theo field module. Không phải lỗi setting ảnh trong case sản phẩm không có gallery.

## 2. Counter-Hypothesis (Giả thuyết đối chứng)

- Giả thuyết “setting ảnh không được tôn trọng” bị loại trừ cho case hiện tại vì sản phẩm không có thumbnail/gallery đủ để hiển thị hoặc mở lightbox.
- Nếu một sản phẩm có `images.length > 1` mà vẫn không vuốt/lightbox được thì đó là lỗi khác cần repro bằng sản phẩm có gallery thật.
- Giả thuyết “nên giữ SKU vì có config `enabledFields.has('sku')`” không phù hợp với yêu cầu product owner hiện tại. Quyết định là không hiện SKU ở public detail; không xóa schema/field admin trong scope này.
- Giả thuyết “redirect 301 route `/products/[slug]` luôn tốt hơn sửa duplicate” chỉ đúng nếu chứng minh route cũ không còn là canonical hoặc có đủ `categorySlug` để redirect an toàn. Chưa đủ evidence để coi redirect là mặc định trong scope fix này.

# IV. Proposal (Đề xuất)

## 1. Chuẩn hóa description section cho Classic / Modern / Minimal

- Tạo hoặc chuẩn hóa shared render block cho mô tả sản phẩm.
- Render block này dưới top product grid ở cả 3 layout.
- Nội dung gồm `preContent`, `description`, category suffix, `postContent`.
- Giữ `ExpandableProductDescriptionBlock` cho phần text dài.
- Section nằm trong vùng rộng dưới top grid, nhưng phần text nên giới hạn readability bằng `max-w-3xl` hoặc `max-w-4xl` thay vì kéo từng dòng tới toàn bộ `max-w-6xl`.
- Không thêm sidebar/widget mới trong scope này để tránh mở rộng ngoài yêu cầu; nếu cần cột phụ sau này thì làm bằng spec riêng.

## 2. Không hiện SKU ở public product detail

- Gỡ render SKU khỏi Classic và Minimal public UI.
- Không thêm setting mới vì business rule rõ: SKU dành cho admin, không dành cho end user.
- Không đụng schema/backend.
- Không xóa field `sku`, không xóa config module, không đổi dữ liệu sản phẩm.
- Preview experience cũng phải không render SKU để tránh preview khác site public.

## 3. Tách toàn bộ ảnh sản phẩm khỏi vùng collapse mô tả

- `ProductDescriptionImages` nên nằm dưới `ExpandableProductDescriptionBlock`.
- Nếu `showAllProductImagesSection === true` và `images.length > 0`, hiển thị toàn bộ ảnh dưới mô tả.
- Nếu không có gallery, không render section ảnh.

## 4. Gallery nhiều ảnh dùng Embla API

- Với sản phẩm có `images.length > 1`, dùng Embla API cho gallery ảnh chính.
- Dùng dependency đã có sẵn: `embla-carousel-react@^8.6.0`; không cài thêm package.
- Quản lý state:
  - `selectedIndex`
  - `canScrollPrev`
  - `canScrollNext`
- Nút prev/next chỉ enabled hoặc visible khi:
  - `canScrollPrev === true`
  - `canScrollNext === true`
- Khi click thumbnail, gọi Embla scroll tới ảnh tương ứng.
- Khi user vuốt ảnh chính, đồng bộ lại thumbnail active.
- Khi bấm prev/next, cập nhật `selectedIndex` theo Embla selected snap.
- Lightbox mở đúng ảnh hiện tại theo `selectedIndex`.
- Khi đổi ảnh trong lightbox rồi đóng, carousel chính bên ngoài phải sync về ảnh cuối cùng user đang xem.
- Trên mobile, ưu tiên swipe; nút prev/next nên ẩn bằng `hidden md:flex` hoặc chỉ hiện khi thiết kế mobile thật sự cần.
- Container carousel phải có `aspect-ratio`/frame size cố định trước hydrate để tránh layout shift (CLS).
- Áp dụng class Embla cơ bản từ đầu: viewport overflow hidden, container flex, slide `min-w-0 shrink-0 grow-0 basis-full`.
- Nếu chỉ có 0 hoặc 1 ảnh, không khởi tạo UI prev/next dư thừa.

## 5. Lightbox dùng React Portal để tránh lỗi layering trong admin preview

- Cập nhật `ProductImageLightbox` để render modal qua `createPortal(..., document.body)` sau khi mounted ở client.
- Mục tiêu: `position: fixed` luôn bám viewport thật, không bị nhốt bởi transform/transition/preview frame.
- Tăng z-index modal lên mức an toàn hơn, ví dụ `z-[9999]`, để che được floating widgets, admin preview controls và dev indicator khi xem ảnh.
- Giữ keyboard handling hiện có: `Escape`, `ArrowLeft`, `ArrowRight`.
- Khi `open === false`, không mount portal content.

## 6. Route legacy `/products/[slug]`

- Không mặc định xóa route hoặc redirect 301 trong scope fix này vì cần evidence SEO/canonical trước.
- Nếu route legacy vẫn được dùng, đồng bộ behavior hoặc tốt hơn là extract shared component để tránh copy-paste.
- Redirect 301 chỉ triển khai khi xác nhận được mapping chắc chắn từ `slug` sang `/{categorySlug}/{recordSlug}` và không phá các URL đã index.

# V. Files Impacted (Tệp bị ảnh hưởng)

## UI public chính

- Sửa: `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`
  - Vai trò hiện tại: render 3 style Classic / Modern / Minimal cho product detail public.
  - Thay đổi: chuẩn hóa description xuống dưới top grid, bỏ SKU public, tách ảnh khỏi collapse, thêm Embla state cho gallery nhiều ảnh.

## Preview experience

- Sửa: `components/experiences/previews/ProductDetailPreview.tsx`
  - Vai trò hiện tại: render preview cho `/system/experiences/product-detail`.
  - Thay đổi: bỏ SKU khỏi preview, đồng bộ lightbox/gallery behavior với site public.

## Lightbox shared

- Sửa: `components/site/products/detail/_components/ProductImageLightbox.tsx`
  - Vai trò hiện tại: modal xem ảnh lớn dùng cho site và preview.
  - Thay đổi: render qua React Portal, tăng z-index an toàn, giữ keyboard navigation.

## UI public duplicate / legacy

- Sửa: `app/(site)/products/[slug]/page.tsx`
  - Vai trò hiện tại: route product detail cũ có logic gần giống route category/record.
  - Thay đổi: đồng bộ behavior nếu route này vẫn còn được dùng; cân nhắc extract shared component hoặc redirect 301 sau khi có evidence.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại `ProductDetailPage.tsx` để xác định block duplicate giữa 3 layout.
2. Tách helper/shared component cho description section.
3. Chuyển Classic sang render description dưới top grid giống Modern/Minimal.
4. Xóa SKU khỏi public render.
5. Di chuyển `ProductDescriptionImages` ra ngoài collapsed description.
6. Tích hợp Embla API cho gallery nhiều ảnh, gồm selected index, prev/next state, aspect ratio chống CLS.
7. Cập nhật lightbox dùng Portal và sync ngược index từ lightbox về carousel.
8. Đồng bộ preview product-detail, nhất là SKU/lightbox/gallery.
9. Đồng bộ file duplicate nếu cần.
10. Tự review tĩnh: null-safety, data thiếu ảnh, 1 ảnh, nhiều ảnh, mobile/desktop.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Không chạy lint/build theo rule repo.
- Nếu có thay đổi TS/TSX, chạy:
  - `bunx tsc --noEmit 2>&1 | Select-Object -First 10`
- Manual QA bởi tester:
  - Sản phẩm không có gallery: không hiện section ảnh, không mở lightbox.
  - Sản phẩm có nhiều ảnh: vuốt ảnh chính mượt, thumbnail active sync, prev/next đúng trạng thái.
  - Lightbox trong `/system/experiences/product-detail` phủ toàn viewport, không bị UI preview/admin/floating widget lồi lên.
  - Đổi ảnh trong lightbox rồi đóng: gallery ngoài sync đúng ảnh.
  - Classic/Modern/Minimal: description đều nằm dưới top grid.
  - Public product detail: không còn SKU.

# VIII. Todo

- [ ] Chuẩn hóa description section cho 3 layout.
- [ ] Bỏ SKU khỏi public product detail.
- [ ] Tách all-images section khỏi collapsed description.
- [ ] Thêm Embla carousel state cho gallery nhiều ảnh.
- [ ] Chống layout shift cho Embla bằng aspect ratio/container CSS ổn định.
- [ ] Chuyển lightbox sang React Portal và sync index ngược về gallery.
- [ ] Đồng bộ preview product-detail không hiện SKU.
- [ ] Đồng bộ route duplicate nếu còn dùng.
- [ ] Typecheck theo command giới hạn output.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Classic, Modern, Minimal đều hiển thị mô tả dưới top product section.
- Mô tả dài đọc rộng rãi hơn, không bị nhét trong cột info của Classic.
- Public product detail không hiển thị SKU.
- Setting “Hiển thị toàn bộ ảnh sản phẩm dưới mô tả” chỉ hiển thị khi có ảnh gallery thật.
- Setting “Nhấn ảnh chính để mở xem ảnh lớn” chỉ mở khi có ảnh thật.
- Sản phẩm có nhiều ảnh vuốt mượt bằng Embla.
- Prev/next disabled hoặc hidden đúng ở ảnh đầu/cuối.
- Prev/next ẩn trên mobile nếu không có thiết kế mobile riêng; mobile ưu tiên swipe.
- Thumbnail active luôn sync sau click thumbnail, vuốt ảnh chính hoặc bấm prev/next.
- Lightbox mở đúng ảnh đang active.
- Đổi ảnh trong lightbox rồi đóng thì carousel ngoài vẫn giữ đúng ảnh vừa xem.
- Lightbox phủ toàn viewport qua Portal và không bị admin preview/floating UI đè lên.
- Carousel không gây layout shift rõ rệt trước/sau hydrate vì có aspect ratio cố định.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro: thay đổi layout Classic có thể làm spacing khác hiện tại.
- Rủi ro: route duplicate nếu không đồng bộ có thể gây behavior khác nhau giữa `/products/[slug]` và `/{categorySlug}/{recordSlug}`.
- Rủi ro: bỏ SKU public có thể làm admin config `showSku` không còn phản ánh public detail; chấp nhận theo yêu cầu product owner, không xóa config/schema trong scope này.
- Rủi ro: redirect 301 route legacy nếu làm vội có thể ảnh hưởng SEO/URL đã index; không làm nếu chưa có evidence mapping/canonical.
- Rollback: revert các thay đổi trong `ProductDetailPage.tsx` và `products/[slug]/page.tsx`; không có schema/data migration.

# XI. Out of Scope (Ngoài phạm vi)

- Không đổi schema sản phẩm.
- Không thêm setting mới cho SKU.
- Không sửa dữ liệu sản phẩm thật.
- Không thay đổi admin product form.
- Không thêm sidebar/wigdet phụ cho description trong scope này.
- Không triển khai redirect 301 route legacy nếu chưa được xác nhận riêng.
