# SPECS: THÊM LAYOUT PREMIUM CHO CHI TIẾT SẢN PHẨM (BẢN CẬP NHẬT: DỮ LIỆU ĐỘNG & MÀU THƯƠNG HIỆU)

# I. Primer

## 1. TL;DR kiểu Feynman
Hãy tưởng tượng trang chi tiết sản phẩm giống như một chiếc kệ trưng bày rượu vang cao cấp trong một showroom sang trọng. Thay vì sơn cố định màu kệ hay dùng các chai rượu nhựa giả (hardcode), kệ Premium mới này sẽ **tự động đổi màu** theo tone màu chủ đạo của hãng (lấy từ Single/Dual brand color có sẵn) và **trưng bày rượu thật 100%** từ kho dữ liệu (database thực tế). 
Layout mới này mang lại vẻ ngoài đẳng cấp: ảnh phụ xếp dọc thời thượng, hộp giá mạ màu thương hiệu tinh tế, các thẻ Combo mua nhiều xếp song song thông minh, và các dải thông số kỹ thuật (Attributes) nằm ngang gọn gàng. Tất cả đều vận hành tự động và hòa hợp tuyệt đối với hệ thống phối màu hiện tại của website mà không hề chạm vào các layout cũ.

## 2. Elaboration & Self-Explanation
Yêu cầu cốt lõi được cập nhật: **Tuyệt đối không hardcode thông tin hay màu sắc tĩnh.** Giao diện Premium mới phải thích ứng động hoàn toàn:
1. **Màu sắc động theo Brand Color**: 
   * Không dùng các mã màu cố định (như `#8c1d24` hay `#fdfaf7`).
   * Tất cả màu sắc của chiếc hộp giá (Box giá), các thẻ Combo, viền của Attributes và các nút CTA đều phải được lấy trực tiếp từ object `tokens` (được sinh ra từ `brandColor`, `secondaryColor` và `colorMode` Single/Dual của hệ thống).
   * Ví dụ: 
     * Nền hộp giá: Sử dụng `tokens.surfaceMuted` pha mượt mà hoặc kết hợp với độ trong suốt nhẹ để tạo cảm giác sang trọng, viền mỏng lấy từ `tokens.border`.
     * Chữ giá và các điểm nhấn nổi bật: Dùng `tokens.priceColor` hoặc `tokens.primary`.
     * Nút bấm hành động (CTA): Dùng `primaryButtonColors.bg` và `primaryButtonColors.text`.
2. **Dữ liệu thực tế từ Database**:
   * Trên trang sản phẩm thật (`ProductDetailPage.tsx`), toàn bộ thông tin sản phẩm, danh mục sản phẩm, bộ lọc (Attributes), danh sách Combo ưu đãi, và các nút liên hệ MXH phải được truyền trực tiếp từ database qua props chứ không sử dụng mock data tĩnh.
   * Tự động ẩn các block tương ứng nếu dữ liệu từ database trả về trống (ví dụ: nếu sản phẩm không có combo -> tự động ẩn block Combo; nếu không có attributes -> ẩn block thông số kỹ thuật).

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: 
  * Nếu quản trị viên cấu hình trang web theo tone màu Đỏ Burgundy (Brand color) và Vàng Cát (Secondary color) ở chế độ Dual: Box giá của layout Premium sẽ tự động có nền champagne ấm áp mượt mà, chữ giá hiển thị màu Đỏ Burgundy sang trọng. Nếu ngày mai họ đổi màu chủ đạo trang web sang Xanh ngọc và Bạc, toàn bộ giao diện Premium sẽ tự động đổi tone màu theo mà lập trình viên không cần sửa một dòng CSS nào.
  * Khi khách hàng bấm vào một combo (ví dụ Combo 6 chai từ DB), hệ thống sẽ tự động cập nhật số lượng đặt mua bằng 6 trên chính giao diện thực tế.
* **Analogy đời thường**: Giống như một chiếc đèn thông minh tự động đổi màu theo ánh sáng tự nhiên của căn phòng. Đèn không tự phát ra một màu cố định (hardcode), mà nó cảm nhận môi trường (brand color tokens) để tỏa ra ánh sáng hài hòa nhất, đồng thời chiếu sáng vật thể thật (database thực tế) trong phòng.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra cơ chế phân phối màu sắc (styling tokens) trong `ProductDetailPage.tsx`:
  * Hệ thống sử dụng hàm `resolveProductDetailElementColor` và object `tokens` (được sinh ra động dựa trên `brandColor` và `secondaryColor`) để định cấu hình màu cho tất cả các thành phần.
  * Chúng ta sẽ bám chặt vào hệ thống tokens này để thiết kế màu sắc cho `PremiumStyle`.
* Đã kiểm tra cách binding dữ liệu thật trong `ProductDetailPage.tsx`:
  * Các biến như `product`, `variants`, `variantOptions`, `productAttributesMap`, `product.combos` chứa toàn bộ dữ liệu động thực tế từ Convex DB.
  * Giao diện Premium mới sẽ map trực tiếp vào các biến động này.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Giả thuyết A (Hardcode mã màu/CSS tĩnh)**: Viết CSS cứng cho layout Premium để hiển thị nhanh giống hệt ảnh mẫu.
  * *Hậu quả*: Khi admin thay đổi cấu hình màu thương hiệu của trang web, giao diện Premium sẽ bị lệch tone màu nghiêm trọng (ví dụ trang màu xanh lá nhưng box giá vẫn đỏ đô), tạo ra lỗi hiển thị thảm họa và cực kỳ lỏ.
* **Giả thuyết B (Recommend - Gắn kết chặt chẽ vào Tokens)**: Sử dụng các biến CSS động, Tailwind class kết hợp với `style={{ color: tokens.primary, backgroundColor: tokens.surfaceMuted }}`.
  * *Ưu điểm*: Đảm bảo giao diện Premium luôn hòa hợp 100% với màu sắc thương hiệu của từng cửa hàng, đáp ứng hoàn hảo yêu cầu tùy biến cao của hệ thống SaaS.

---

# IV. Proposal (Đề xuất)
1. **Tích hợp Token Màu sắc**:
   * Chiếc hộp giá (Box giá) sẽ có style:
     * `backgroundColor`: `tokens.surfaceMuted` (hoặc màu nhạt hài hòa được tính toán động).
     * `borderColor`: `tokens.border`.
     * Dòng chữ "Tiết kiệm..." và tiêu đề "GIÁ ƯU ĐÃI HÔM NAY": có màu sắc phối theo `tokens.priceColor` hoặc `tokens.primary`.
   * Thẻ Combo:
     * Card mặc định: Viền mỏng `tokens.border`, nền nhẹ `tokens.surface`.
     * Card Bán chạy (Best Seller): Viền và tag mạ màu thương hiệu nổi bật sử dụng `tokens.primary` hoặc `brandColor` để làm điểm nhấn thị giác đẳng cấp.
     * Sử dụng các icons từ `lucide-react` vẽ động hoàn toàn.
2. **Liên kết dữ liệu thực (Real Data Binding)**:
   * **Attributes Block**: Render động bằng cách duyệt qua `productAttributesMap.get(product._id)` của sản phẩm thật, map ra các thuộc tính và icon động.
   * **Combo Block**: Render động danh sách combo từ `product.combos` thực tế. Nút chọn combo sẽ có onClick cập nhật state `quantity` tương ứng với số chai của combo đó.
   * **Cam kết vàng & Banner chân trang**: Thiết kế có thể ẩn/hiện hoặc cấu hình động để tối ưu trải nghiệm.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
* **[page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx)**:
  * Vai trò hiện tại: Trang quản trị cấu hình trải nghiệm.
  * Thay đổi: Đăng ký style `'premium'` vào cấu hình mặc định và hệ thống lưu trữ động.
* **[ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)**:
  * Vai trò hiện tại: Component xử lý giao diện sản phẩm thật.
  * Thay đổi: Thêm component `<PremiumStyle />` mới hoàn chỉnh, **sử dụng 100% dữ liệu động từ props** (combos, attributes, rating) và **phối màu hoàn toàn từ brand color tokens**.
* **[ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)**:
  * Vai trò hiện tại: Component giả lập preview giao diện sản phẩm trong admin.
  * Thay đổi: Thêm render layout `'premium'` sử dụng màu sắc thương hiệu truyền vào động để preview chuẩn xác.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Đăng ký style `'premium'` vào core config tại `app/system/experiences/product-detail/page.tsx`.
2. **Bước 2**: Viết phần render layout `'premium'` trong admin preview `components/experiences/previews/ProductDetailPreview.tsx` sử dụng dynamic tokens.
3. **Bước 3**: Triển khai component `<PremiumStyle />` thực tế trong `app/(site)/_components/details/ProductDetailPage.tsx` kết nối trực tiếp với dynamic tokens và DB props.
4. **Bước 4**: Chạy typecheck và review tĩnh mã nguồn.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.

### Manual Verification
* Đổi màu thương hiệu trong trang cấu hình hệ thống (ví dụ từ Đỏ sang Xanh), sau đó kiểm tra xem layout Premium có tự động chuyển màu hài hòa theo tone mới chọn hay không.
* Bật/tắt các gói Combo trong DB và kiểm tra xem giao diện Premium có hiển thị/ẩn mượt mà và hoạt động click chọn combo có cập nhật đúng số lượng đặt mua hay không.

---

# VIII. Todo
- [x] Cập nhật tài liệu Spec Premium Layout (Đã thực hiện).
- [ ] Cập nhật tệp tin `page.tsx` đăng ký style `'premium'`.
- [ ] Xây dựng layout Premium động trong `ProductDetailPreview.tsx`.
- [ ] Xây dựng component `<PremiumStyle />` động trong `ProductDetailPage.tsx`.
- [ ] Typecheck và bàn giao.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* **TUYỆT ĐỐI KHÔNG HARDCODE MÀU SẮC**: Layout Premium đổi màu mượt mà theo cấu hình Single/Dual brand color của website.
* **KHÔNG HARDCODE THÔNG TIN**: Sử dụng dữ liệu thực tế từ database (Attributes, Combos, Categories).
* Thẻ Combo xếp song song tinh tế, click chọn combo tự động cập nhật số lượng mua.
* Thumbnail xếp dọc sang trọng bên cạnh ảnh chính ở màn hình desktop.
* Vượt qua toàn bộ kiểm tra TypeScript (`tsc --noEmit`).

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không lấy đúng token màu gây hiển thị sai màu.
* **Khắc phục**: Luôn tham chiếu trực tiếp tới đối tượng `tokens` truyền từ hook `getProductDetailColors`.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thiết kế lại các trang sản phẩm khác ngoài chi tiết sản phẩm.
