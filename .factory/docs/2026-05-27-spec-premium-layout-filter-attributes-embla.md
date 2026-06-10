# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**:
  * Phần "THÔNG TIN CHI TIẾT SẢN PHẨM" ở layout Premium đang dùng dữ liệu ảo (hardcoded) trong Preview và hiển thị sai key ở site thực (dẫn đến không hiện gì hoặc lỗi). Các layout khác cũng thiếu hiển thị attributes trong Preview.
  * Khi có nhiều thuộc tính lọc, giao diện bị vỡ hoặc quá dài. Người dùng muốn hiển thị tối đa: Desktop 6 items, Tablet 4 items, Mobile 3 items. Nếu vượt quá số này, dùng Embla Carousel để trượt ngang mượt mà kèm nút bấm qua lại (Prev/Next), nếu không vượt thì ẩn Embla và nút đi cho gọn.
* **Giải pháp**:
  * Gộp các thuộc tính lọc thực tế theo `groupId`, lấy icon tương ứng từ Lucide (sử dụng `getAttributeIconComponent` có sẵn).
  * Ở Preview: Lấy dữ liệu sản phẩm mẫu thật đầu tiên (qua hook `useExampleProduct` sẵn có) và query attributes của nó để render demo trong Preview cho tất cả các layout (Classic, Modern, Minimal, Premium).
  * Viết component trượt attributes thông minh cho layout Premium: Đo độ rộng màn hình/dựa trên prop `device`, nếu số lượng vượt giới hạn sẽ kích hoạt Embla Carousel + hiện nút điều khiển. Nếu ít hơn giới hạn, chỉ render Grid tĩnh thông thường và ẩn mớ Embla + nút đi.

## 2. Elaboration & Self-Explanation
Hệ thống hiện tại có module `products` hỗ trợ cấu hình "Loại sản phẩm" (Product Type) với các "Nhóm thuộc tính" (Attribute Groups) và "Giá trị thuộc tính" (Attribute Terms). Ví dụ: Nhóm "THƯƠNG HIỆU" có giá trị "Vedovato" và icon "Wine".
Ở site thực, các thuộc tính này được gộp và hiển thị qua component `ProductAttributesBadges`. Tuy nhiên:
a) Trong layout Premium ở site thực, phần hiển thị attributes bị lỗi key (truy cập `attr.attributeName` thay vì `attr.group.name`), khiến dữ liệu thật không lên được.
b) Trong Preview, cả 4 layout đều hiển thị dữ liệu tĩnh cũ kỹ, không phản ánh cấu hình thực tế của shop.
c) Chưa có giải pháp phản hồi giao diện linh hoạt (Responsive) cho số lượng thuộc tính lớn ở Premium layout.
Chúng ta sẽ tạo ra một bộ gộp dữ liệu chuẩn xác từ `productAttributesMap`, rồi viết logic phân chia số lượng hiển thị linh hoạt. Sử dụng thư viện `embla-carousel-react` đã được cài đặt sẵn trong dự án để điều hướng trượt ngang khi danh sách thuộc tính dài quá giới hạn cho phép ở từng loại thiết bị.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Sản phẩm "Rượu vang Ý" có 8 thuộc tính lọc: Thương hiệu (Wine), Xuất xứ (Globe), Nồng độ (Flame), Dung tích (GlassWater), Giống nho (Grape), Màu sắc (Palette), Vùng (MapPin), Năm sản xuất (Calendar).
  * Trên Desktop (Giới hạn 6): 8 > 6 nên sẽ kích hoạt Embla Carousel. Người dùng thấy 6 ô thuộc tính xếp ngang thẳng hàng, góc trên bên phải có 2 nút `<` và `>`. Click `>` sẽ trượt sang để xem 2 thuộc tính còn lại.
  * Trên Mobile (Giới hạn 3): 8 > 3 nên cũng kích hoạt Embla. Người dùng vuốt hoặc click nút để trượt qua lại xem hết 8 thuộc tính.
  * Nếu sản phẩm chỉ có 3 thuộc tính (Thương hiệu, Xuất xứ, Nồng độ): Cả Desktop, Tablet và Mobile đều không vượt giới hạn tương ứng (6, 4, 3). Lúc này, giao diện tự động ẩn nút trượt và render Grid tĩnh 3 cột thông thường, cực kỳ tối giản và gọn gàng.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Tệp hiện tại**:
  * [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx): Chứa logic render site thực của cả 4 layout (bao gồm Premium).
  * [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx): Chứa logic render preview trong trang admin config.
  * [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx): Trang cấu hình Admin, nơi chuẩn bị props và gọi `ProductDetailPreview`.
* **Phát hiện**:
  * File `ProductDetailPage.tsx` đã import `useEmblaCarousel` và `getAttributeIconComponent` nhưng layout Premium chưa tận dụng để render attributes thực tế mà render sai key.
  * File `ProductDetailPreview.tsx` chưa nhận dữ liệu thực của attributes nên đang render dữ liệu cứng.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Độ tin cậy nguyên nhân gốc**: High.
  * *Triệu chứng*: Dữ liệu attributes không lên ở site thực, preview hiển thị cứng dữ liệu mẫu, không có trượt ngang responsive.
  * *Nguyên nhân*: Thiếu logic gộp attributes và thiếu tích hợp Embla Carousel cho danh sách attributes ở cả site thực và preview.

# IV. Proposal (Đề xuất)
1. **Tại `app/system/experiences/product-detail/page.tsx`**:
   * Sử dụng `useExampleProduct` để lấy sản phẩm mẫu thật đầu tiên.
   * Lấy `productTerms` thực tế của sản phẩm mẫu này thông qua query `api.attributeTerms.getTermsForProducts`.
   * Truyền `demoAttributes={exampleProductTerms}` và `productTypeId={exampleProduct?.productTypeId}` vào props của `ProductDetailPreview`.
2. **Tại `components/experiences/previews/ProductDetailPreview.tsx`**:
   * Nhận thêm props `demoAttributes` và `productTypeId`.
   * Định nghĩa component `PreviewAttributesBadges` để render badges thuộc tính (có icon thực tế) cho 3 layout Classic, Modern, Minimal ở Preview.
   * Cập nhật Premium layout: Sử dụng logic gộp attributes thực tế.
   * Tích hợp `useEmblaCarousel` để trượt ngang mượt mà khi số lượng vượt giới hạn (3 mobile, 4 tablet, 6 desktop).
3. **Tại `app/(site)/_components/details/ProductDetailPage.tsx`**:
   * Cập nhật PremiumStyle: Sửa lại logic render `rawAttributes` ở chân trang.
   * Áp dụng logic gộp attributes thực tế tương tự.
   * Tích hợp `useEmblaCarousel` và logic kiểm tra viewport (mobile, tablet, desktop) để tự động bật/tắt carousel và controls Prev/Next tương ứng khi vượt quá số lượng.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx)
  * Lấy `exampleProduct` và query `productTerms` tương ứng, chuyển tiếp sang preview qua props `demoAttributes` và `productTypeId`.
* **Sửa**: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)
  * Thêm `demoAttributes` vào props.
  * Thêm sub-component `PreviewAttributesBadges` để hiển thị attributes trong preview của Classic, Modern, Minimal.
  * Cập nhật Premium layout dùng attributes thực tế và Embla Carousel tự điều chỉnh theo giới hạn của từng thiết bị.
* **Sửa**: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)
  * Sửa phần hiển thị attributes của PremiumStyle: Gộp attributes thực tế và tích hợp Embla Carousel với tính năng auto-hidden khi số lượng không vượt quá giới hạn thiết bị.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `page.tsx` để lấy dữ liệu thực tế và truyền sang.
2. Cập nhật `ProductDetailPreview.tsx` để nhận dữ liệu, hiển thị badges có icon trong Preview cho 3 layout, và viết Embla carousel cho Premium preview.
3. Cập nhật `ProductDetailPage.tsx` để sửa lỗi hiển thị attributes ở Premium site thực và tích hợp Embla carousel thông minh tương ứng.
4. Chạy typecheck tĩnh và sửa các lỗi type (nếu có).

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra TypeScript**: Chạy `bunx tsc --noEmit` để đảm bảo không lỗi biên dịch.
* **Xác minh trực quan (Tester/User)**:
  * Truy cập `/system/experiences/product-detail` để verify Preview:
    * Chuyển đổi giữa các layout Classic/Modern/Minimal: attributes demo của sản phẩm mẫu xuất hiện sinh động kèm icon thật.
    * Chuyển sang Premium layout:
      * Nhìn phần "THÔNG TIN CHI TIẾT SẢN PHẨM": attributes được render bằng dữ liệu thực.
      * Khi đổi kích thước thiết bị (Desktop / Tablet / Mobile):
        * Nếu attributes vượt quá 6 (Desktop), 4 (Tablet), 3 (Mobile) -> Embla carousel hoạt động, hiển thị 2 nút Prev/Next.
        * Nếu không vượt quá -> Carousel chuyển thành Grid tĩnh, ẩn hoàn toàn nút Prev/Next.

# VIII. Todo
- [ ] Cập nhật `app/system/experiences/product-detail/page.tsx`
- [ ] Cập nhật `components/experiences/previews/ProductDetailPreview.tsx`
- [ ] Cập nhật `app/(site)/_components/details/ProductDetailPage.tsx`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* [x] Sửa lỗi hiển thị dữ liệu ảo trong Premium layout thành dữ liệu thực tế có gộp nhóm và lấy icon Lucide chuẩn xác.
* [x] Preview hiển thị demo attributes có icon cho cả 4 layout (Classic, Modern, Minimal, Premium) lấy từ sản phẩm mẫu đầu tiên của DB.
* [x] Carousel trượt thông minh ở Premium layout: tự động bật Embla + hiện nút Prev/Next khi vượt quá giới hạn thiết bị (Desktop > 6, Tablet > 4, Mobile > 3), ẩn sạch sẽ khi không vượt quá.
* [x] TypeScript build sạch sẽ 100% không lỗi.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi Embla Carousel khi init nếu DOM chưa sẵn sàng.
* **Giải quyết**: Sử dụng kiểm tra an toàn `emblaApi` và wrap các cập nhật trạng thái trong `useEffect`.

# XI. Out of Scope (Ngoài phạm vi)
* Thiết kế lại giao diện admin chỉnh sửa bộ lọc.
