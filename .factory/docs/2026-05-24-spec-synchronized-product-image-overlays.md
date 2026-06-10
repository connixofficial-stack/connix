# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề:** Hiện tại watermark (hình + chữ) và khung viền sản phẩm được tích hợp rời rạc ở nhiều nơi (trang chi tiết, danh sách sản phẩm, trang chủ...). Khi hiển thị trên các container ảnh có kích thước và tỷ lệ khác nhau (ảnh chính to, ảnh phụ nhỏ, card sản phẩm bento, carousel...), watermark và khung bị lệch tỉ lệ, font chữ bị to quá cỡ hoặc lồi ra ngoài rất mất thẩm mỹ.
  * *Đặc biệt:* Khoảng cách thưa (gap) giữa các chữ watermark lặp lại đang bị code cứng tĩnh (`gap-8`), khiến cho ở ảnh nhỏ khoảng cách này bị quá rộng, rời rạc, làm nát layout chữ.
* **Giải pháp:** Tạo ra một component dùng chung duy nhất tên là `ProductImageWithOverlay.tsx`. Component này sẽ đóng gói: Ảnh sản phẩm + Khung viền (Frame) + Watermark (chữ + hình).
* **Cơ chế scale đồng bộ như một bức ảnh duy nhất:** 
  * Wrapper của component dùng chung này sẽ bắt buộc thiết lập `container-type: inline-size` (Container Queries).
  * Tất cả các thành phần overlay bên trong (Khung viền, Watermark hình, Watermark chữ, khoảng cách thưa chữ) đều được định nghĩa kích thước **hoàn toàn bằng đơn vị tỷ lệ tương đối** so với chiều rộng container (`%`, `cqw`, `em`).
  * Khung viền: `width: 100%` (ôm khít theo container).
  * Watermark hình: `width: X%` (tỷ lệ thuận theo container).
  * Watermark chữ: `fontSize: calc(Y * 0.25cqw)` (tỉ lệ thuận theo container).
  * Khoảng cách thưa chữ: `gap: 1.5em` (co giãn cơ học tuyệt đối theo font-size).
  * **Kết quả:** Dù ảnh to rộng 1000px hay thu nhỏ về 50px, toàn bộ cụm (Ảnh + Khung + Watermark) sẽ co giãn đồng bộ cơ học tuyệt đối như thể tất cả đã được gộp (flatten) thành **một bức ảnh duy nhất**!
* **Tối ưu hóa DB:** Cho phép truyền dữ liệu config từ cấp cha xuống component con, giảm số lượng query Convex từ N+1 xuống còn 2 query duy nhất cho toàn trang.

## 2. Elaboration & Self-Explanation
Chúng ta đang xây dựng một cơ chế hiển thị hình ảnh sản phẩm cực kỳ cao cấp cho hệ thống ThanShoes. Khi khách hàng bật chức năng khung viền hoặc watermark, các lớp phủ này cần được "dán" lên trên bề mặt ảnh sản phẩm.
Tuy nhiên, ảnh sản phẩm xuất hiện ở khắp mọi nơi trên trang web với nhiều kích cỡ khác nhau:
- **To:** Ảnh phóng to khi click xem (Lightbox), ảnh banner lớn.
- **Vừa:** Ảnh sản phẩm chính ở trang chi tiết, ảnh trong card danh sách sản phẩm.
- **Nhỏ:** Ảnh phụ/thumbnail, các liên kết liên quan, giỏ hàng.

Để đạt được sự nhất quán tuyệt đối, chúng ta không thể sử dụng bất kỳ một đơn vị tĩnh (`px`, `rem`, `pt`) nào cho các lớp phủ overlay. Nếu dùng đơn vị tĩnh, khi ảnh thu nhỏ lại, các phần tử tĩnh sẽ bị lệch tỉ lệ so với ảnh và lồi ra ngoài.
Bằng cách chuyển đổi toàn bộ hệ thống tọa độ và kích thước của Khung viền, Watermark hình, Watermark chữ, và khoảng cách thưa chữ sang **hệ tọa độ tương đối độc lập** dựa trên chiều rộng container (`inline-size` Container Queries):
1. **Aspect Ratio (Tỷ lệ khung hình):** Tự động đồng bộ theo cấu hình hệ thống (Square, 9:16, 3:4, 4:3, 16:9) để container ôm khít ảnh.
2. **Container Queries & Relative Units:** Dùng `container-type: inline-size` kết hợp đơn vị `cqw` cho font-size và đơn vị `em` cho gap. Khi font-size co giãn theo độ rộng container, `gap` (tính bằng `em`) cũng tự động giãn nở tỷ lệ thuận 100% theo font-size đó.
3. **Mô phỏng 1 bức ảnh duy nhất (Flattened Image):** Nhờ cơ chế này, tỉ lệ diện tích hiển thị và khoảng cách tương đối giữa ảnh sản phẩm, khung viền và watermark luôn luôn giữ nguyên một hằng số bất biến. Khi container thay đổi kích thước, cả cụm co giãn đồng bộ cơ học hoàn hảo giống hệt như một bức ảnh SVG vector hoặc một bức ảnh PNG duy nhất được scale to/nhỏ bằng CSS.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:**
  - Nếu font-size của watermark chữ ở ảnh chính to là `24px`, với `gap: 1.5em`, khoảng cách giữa các từ sẽ là `36px`.
  - Khi ảnh thu nhỏ thành thumbnail phụ, font-size tự động co xuống còn `8px`, khoảng cách `gap: 1.5em` cũng tự động co lại chỉ còn `12px`. Sự co giãn này diễn ra đồng bộ, mượt mà và giữ nguyên tỷ lệ thẩm mỹ.
* **Analogy (Ví dụ đời thường):**
  - Hãy tưởng tượng bạn có một tấm ảnh đã được in sẵn khung viền và đóng dấu watermark lên đó từ trước (một bức ảnh duy nhất). Khi bạn phóng to hay thu nhỏ bức ảnh đó trên máy tính, cả khung viền và dấu watermark đều to nhỏ theo đúng tỉ lệ 1:1 không bao giờ bị lệch. Cơ chế dùng Container Queries (`inline-size`) và đơn vị relative (`cqw`, `em`) của chúng ta hoạt động chính xác giống như cách máy tính hiển thị bức ảnh in sẵn đó.

# II. Audit Summary (Tóm tắt kiểm tra)

* **Hiện trạng cấu trúc:**
  - `components/shared/ProductImageWatermarkOverlay.tsx` đang có `className="w-full overflow-hidden inline-flex justify-center gap-8"` khiến khoảng cách chữ bị cố định `gap-8` (~32px).
  - Cần chuyển đổi thành style động `gap: '1.5em'` để co giãn theo font-size.
* **Rủi ro:** Sử dụng Tailwind gap class tĩnh sẽ phá vỡ tính đồng bộ scale của text. Chuyển sang CSS inline style với đơn vị `em` là phương pháp an toàn và chính xác nhất.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Độ tin cậy nguyên nhân gốc:** High (Độ tin cậy cao)
* **Nguyên nhân chính:** Do thuộc tính thưa chữ watermark lặp lại sử dụng class tĩnh `gap-8` của Tailwind CSS thay vì đơn vị tương đối `em` phụ thuộc vào `font-size`.
* **Giả thuyết đối chứng:** Nếu tiếp tục sử dụng Tailwind gap tĩnh, chúng ta không thể kiểm soát được khoảng cách khi font-size thay đổi động qua Container Queries. Việc chuyển đổi sang CSS inline style `gap: '1.5em'` là bắt buộc để đồng bộ hóa 100%.

# IV. Proposal (Đề xuất)

1. **Sửa `ProductImageWatermarkOverlay.tsx`:** Thay thế `gap-8` tĩnh bằng inline style `gap: '1.5em'`.
2. **Tạo Shared Component mới:** `ProductImageWithOverlay.tsx` bọc ảnh, khung và watermark với Container Queries.
3. **Cấu trúc lại các nơi hiển thị ảnh:** Thay thế các đoạn render ảnh thủ công ở storefront và admin preview.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Shared
* **[NEW]** [ProductImageWithOverlay.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/shared/ProductImageWithOverlay.tsx): Shared component cốt lõi bọc ảnh + overlay.
* **[MODIFY]** [ProductImageWatermarkOverlay.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/shared/ProductImageWatermarkOverlay.tsx): Sửa khoảng cách `gap` thành `1.5em` động và xuất thêm interface cấu hình.

### Site Storefront
* **[MODIFY]** [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/%28site%29/%5BcategorySlug%5D/%5BrecordSlug%5D/_components/ProductDetailPage.tsx): Sửa đổi hiển thị ảnh sản phẩm chính và danh sách thumbnail phụ.
* **[MODIFY]** [ProductImageLightbox.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/products/detail/_components/ProductImageLightbox.tsx): Sửa đổi ảnh trong lightbox.
* **[MODIFY]** [ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx): Thay thế render ảnh của toàn bộ các style.
* **[MODIFY]** [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/%28site%29/%5BcategorySlug%5D/_components/ProductsPage.tsx): Tích hợp component mới vào danh sách sản phẩm.
* **[MODIFY]** [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx): Đồng bộ hóa hiển thị ảnh cho các khối giao diện động.

### Admin Preview Pages
* **[MODIFY]** [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx): Đồng bộ hiển thị preview ảnh trong admin.
* **[MODIFY]** [ProductListSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/_components/ProductListSectionShared.tsx): Đồng bộ hiển thị preview trong quản trị.

# VI. Execution Preview (Xem trước thực thi)

1. **Cập nhật `ProductImageWatermarkOverlay.tsx`:** Chuyển `gap` sang `1.5em`.
2. **Tạo component dùng chung:** `ProductImageWithOverlay.tsx` trong `components/shared/`.
3. **Refactor cấu trúc render:** Quét và thay thế các thẻ render ảnh thủ công bằng `ProductImageWithOverlay`.
4. **Kiểm tra kiểu dữ liệu:** Chạy lệnh `bunx tsc --noEmit`.
5. **Commit:** Lưu trữ các thay đổi vào Git.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo không có lỗi type check trên toàn dự án.

### Manual Verification
* Truy cập trang chủ, trang category, trang chi tiết sản phẩm, mở thử Lightbox và kiểm tra visual hiển thị của khung viền & watermark ở tất cả các kích thước ảnh khác nhau (ảnh chính, ảnh phụ nhỏ, related cards...).
* Đặc biệt kiểm tra xem khoảng cách chữ watermark có co giãn đều đặn theo size chữ hay không.

# VIII. Todo
- [ ] Khai báo và xuất type cấu hình watermark + Sửa `gap` thành `1.5em` động trong `ProductImageWatermarkOverlay.tsx`
- [ ] Tạo file `components/shared/ProductImageWithOverlay.tsx`
- [ ] Refactor `ProductDetailPage.tsx`
- [ ] Refactor `ProductImageLightbox.tsx`
- [ ] Refactor `ProductListSection.tsx`
- [ ] Refactor `ProductsPage.tsx`
- [ ] Refactor `ComponentRenderer.tsx`
- [ ] Refactor các tệp Preview trong Admin (`CategoryProductsPreview.tsx`, `ProductListSectionShared.tsx`)
- [ ] Chạy kiểm thử TypeScript `bunx tsc --noEmit`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Pass:**
  1. Watermark chữ và hình hiển thị đồng đều, cân đối ở mọi vị trí render ảnh sản phẩm trên storefront (từ ảnh chính siêu to cho đến ảnh phụ mini).
  2. Khoảng cách (gap) của chữ lặp lại co giãn hoàn toàn tỉ lệ thuận theo font-size của chữ.
  3. Khung viền ôm khít theo tỉ lệ khung hình (Aspect Ratio) được định nghĩa mà không bị lồi hay tràn lệch.
  4. Không tạo ra thêm các query dư thừa (N+1 queries) nhờ cơ chế truyền config từ component cha xuống.
  5. Build & type check thành công không cảnh báo.
* **Fail:** Watermark chữ bị giãn cách thưa thớt khổng lồ ở ảnh nhỏ, chữ bị tràn, lồi khung, hoặc build lỗi.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Thay đổi hàng loạt file render ảnh có thể làm sai lệch style CSS ở một số layout đặc biệt nếu class Tailwind không tương thích.
* **Hoàn tác:** Sử dụng Git revert để khôi phục nhanh về trạng thái commit ổn định trước đó.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic xử lý hình ảnh phía máy chủ (Cloudinary/Convex upload). Chỉ tập trung xử lý UI hiển thị phía Client.
