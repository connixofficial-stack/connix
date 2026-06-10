# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề 1 (Combo Admin cồng kềnh)**: Danh sách combo trong trang Admin edit sản phẩm quá dài, khiến việc kéo thả (DnD) để đổi vị trí cực kỳ khó khăn.
  * *Giải pháp*: Thêm tính năng **thu gọn/mở rộng** (toggle collapse) cho mỗi combo. Mặc định khi tải trang sẽ thu gọn tất cả combo lại thành các dòng tiêu đề mỏng (~48px), chỉ mở ra khi bấm nút hoặc click tiêu đề. Khi thu gọn, kéo thả DnD sẽ siêu nhanh và mượt mà.
* **Vấn đề 2 (Popover Icon quá ít)**: Popover icon Zalo/Sđt chỉ có 14 icon, quá đơn điệu.
  * *Giải pháp*: Mở rộng mảng icon lên **210+ icon** Lucide thiết thực, phân bổ theo 5 cột đẹp mắt, sắp xếp theo thứ tự phổ biến giảm dần.
* **Vấn đề 3 (Giao diện Combo Site thực chật chội)**: Chữ combo quá nhỏ, bị cắt layout và có dòng chữ mô tả cứng `"Tiết kiệm tối đa khi mua gói"` làm rác UI.
  * *Giải pháp*: Tăng kích thước chữ của combo card lên `text-[11px]` hoặc `text-xs font-bold`. Loại bỏ hoàn toàn dòng mô tả hardcode này (chỉ hiển thị nếu admin thực sự điền description), giúp không gian thoáng đãng.
* **Vấn đề 4 (Xoay icon Zalo)**: Icon kế nút Zalo đang bị xoay lệch `rotate-[320deg]`, làm cho mọi icon động khi được chọn đều bị xiên lệch rất xấu.
  * *Giải pháp*: Bỏ hẳn class xoay này, hiển thị icon thẳng tự nhiên.
* **Vấn đề 5 (Tải cấu hình chung)**: Admin phải nhập tay link Zalo/Sđt mà không biết số hệ thống là gì.
  * *Giải pháp*: Thêm nút **"Tải từ cấu hình chung"** kế bên ô nhập. Click một cái sẽ tự động load Zalo/SĐT từ settings hệ thống điền thẳng vào ô.
* **Vấn đề 6 (Padding nút CTA quá lớn ở Mobile)**: Padding đứng và ngang lớn khiến text bị rớt dòng ở mobile.
  * *Giải pháp*: Giảm padding và căn lề nút CTA trên mobile giúp text luôn nằm gọn trên 1 dòng duy nhất.

## 2. Elaboration & Self-Explanation
Việc thiết kế trải nghiệm quản trị (Admin UX) cần tuân thủ triệt để nguyên tắc **Clarity > Decoration**. Khi form của mỗi gói combo chứa đến 10 inputs khác nhau, chiều cao card có thể lên tới 400px. Khi kéo thả card cao 400px, trình duyệt sẽ bị cuộn (scroll) liên tục gây mất định vị. Bằng cách áp dụng cơ chế "Thu gọn thông minh" (Accordion), ta gom toàn bộ thông tin chi tiết vào bên dưới và chỉ chừa lại thanh tiêu đề mỏng 48px chứa các thông tin tóm tắt cốt lõi. Lúc này, 5 combo chỉ chiếm vỏn vẹn 250px chiều cao màn hình, giúp thao tác kéo thả sắp xếp thứ tự diễn ra trong nháy mắt.

Ở phía giao diện khách hàng (Client UI/UX), vẻ đẹp cao cấp đến từ sự tinh giản và vừa vặn. Loại bỏ các dòng mô tả hardcode không cần thiết, gia tăng độ rộng cột của các thẻ combo Carousel, tăng nhẹ font size tên combo và giảm padding của hai nút CTA trên Mobile sẽ giúp toàn bộ khối mua hàng trở nên cực kỳ thanh thoát, cao cấp, không còn hiện tượng chật chội hay tràn chữ xuống dòng.

## 3. Concrete Examples & Analogies
* **Ví dụ về Accordion trong Combo**: Tưởng tượng bạn đang sắp xếp các cuốn sách dày 500 trang trên giá sách. Nếu bạn mở toang từng trang sách ra, việc di chuyển chúng rất vướng víu. Cơ chế thu gọn giống như việc đóng cuốn sách lại, ta chỉ nhìn thấy phần gáy sách gọn gàng (tiêu đề, giá, tay cầm Grip). Lúc này bạn xếp gáy sách cực kỳ dễ dàng. Khi cần đọc chi tiết, bạn chỉ cần lật mở cuốn sách đó ra.
* **Ví dụ về Tải cấu hình chung**: Khi admin thiết lập nút Zalo, thay vì phải đi hỏi bộ phận kỹ thuật xem "SĐT Zalo của công ty là số nào nhỉ?" rồi gõ tay vào, admin chỉ cần click nút "Tải từ cấu hình chung". Hệ thống lập tức điền `"0912345678"` vào ô. Admin có thể bấm lưu luôn hoặc sửa thành số cá nhân nếu muốn.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã kiểm tra kỹ các khu vực code liên quan:
1. **Admin Product Edit Form (`app/admin/products/[id]/edit/page.tsx`)**:
   - Combo card được render trực tiếp thông qua vòng lặp `combos.map` không có cơ chế collapse.
   - Cần bổ sung state `collapsedCombos` và toggle UI.
2. **Experiences Config Admin (`app/system/experiences/product-detail/page.tsx`)**:
   - `PREMIUM_ICON_OPTIONS` đang được khai báo tĩnh với 14 phần tử.
   - Thiếu nút bấm tải từ cấu hình chung ở khu vực input `zaloUrl` và `phoneUrl`.
3. **Product Detail Site (`app/(site)/_components/details/ProductDetailPage.tsx`)**:
   - Nút Zalo đang hardcode xoay: `rotate-[320deg]`.
   - Có dòng chữ hardcode: `combo.description || 'Tiết kiệm tối đa khi mua gói'`.
   - Cỡ chữ combo card tiêu đề `text-[9px]` quá nhỏ.
   - Nút CTA mobile padding đứng/ngang quá lớn.
4. **Product Detail Preview (`components/experiences/previews/ProductDetailPreview.tsx`)**:
   - Tương tự như site thực, cần sửa hardcode xoay icon Zalo và mô tả combo.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Triệu chứng A (Kéo thả khó)**: Khi danh sách combo dài, card combo cao khiến thao tác DnD khó kiểm soát.
  - *Nguyên nhân*: Card combo luôn ở trạng thái mở rộng (expanded).
  - *Giả thuyết đối chứng*: If we provide a collapse toggle and collapse all combos by default when the page loads, the combo card height will reduce by 80%, making DnD incredibly lightweight.
* **Triệu chứng B (Chật chội, chữ nhỏ, rớt dòng)**: Combo card chật chội, nút CTA mobile rớt dòng, icon Zalo xoay xiên.
  - *Nguyên nhân*: Hardcode class xoay icon, padding nút CTA quá lớn ở mobile, và hardcode dòng mô tả combo.
  - *Giả thuyết đối chứng*: Removing icon rotation, decreasing mobile padding for CTA buttons, hiding default description, and slightly increasing combo title font size will make the UI incredibly spacious and elegant.

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất triển khai các giải pháp sau:

## 1. Cơ chế Toggle Thu gọn Combo (Admin)
* Khai báo state `collapsedCombos` dạng `Record<number, boolean>` trong `ProductEditContent`. Mặc định khi tải trang, tất cả các combo có sẵn đều được thu gọn (`collapsed = true`).
* Khi thu gọn: Card combo chỉ hiển thị một thanh bar mỏng:
  - Grip kéo thả, label loại combo (Standard/Mix), Tên combo hiện tại, Giá combo.
  - Nút Chevron để bấm đóng/mở rộng. Bấm vào toàn bộ vùng header (trừ nút xóa và grip) cũng sẽ toggle trạng thái đóng/mở rộng.
  - Ẩn toàn bộ form inputs bên dưới.
* Khi mở rộng: Hiển thị đầy đủ form chi tiết như hiện tại.

## 2. Nút "Tải từ cấu hình chung" & 210+ Icons (Experiences Admin)
* Thay thế `PREMIUM_ICON_OPTIONS` bằng việc import `* as LucideIcons` và map danh sách `POPULAR_ICON_NAMES` gồm 210+ icon được sắp xếp khoa học theo mức độ phổ biến.
* Thêm nút "Tải từ cấu hình chung" nhỏ gọn bên cạnh ô nhập Zalo Link và Gọi tư vấn. Nút này sẽ đọc từ query `systemSettingsForSocial` đã có sẵn để tự động điền giá trị.

## 3. Tối ưu hóa UI/UX Combo & CTA (Site thực & Preview)
* Bỏ class xoay `rotate-[320deg]` trên icon Zalo.
* Sửa text mô tả combo mặc định: Loại bỏ hoàn toàn chữ hardcode `"Tiết kiệm tối đa khi mua gói"`. Chỉ render thẻ mô tả nếu `combo.description` thực sự tồn tại.
* Tăng cỡ chữ tên combo lên `text-[11px]` hoặc `text-xs font-semibold` và điều chỉnh lại padding/flex-basis của combo card để tránh bị cắt.
* Giảm padding của 2 nút CTA trên mobile: Thay vì padding ngang dọc lớn, ta sử dụng padding nhỏ hơn (`py-2.5 px-2` ở mobile) để text luôn nằm gọn trên 1 dòng duy nhất.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Admin Component Layer
1. **[MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/%5Bid%5D/edit/page.tsx)**
   * *Vai trò*: Trang quản trị chỉnh sửa sản phẩm.
   * *Thay đổi*: Thêm state `collapsedCombos` và xây dựng UI Accordion thu gọn thông minh cho danh sách Combo.
2. **[MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx)**
   * *Vai trò*: Trang quản trị trải nghiệm sản phẩm.
   * *Thay đổi*: Bổ sung 210+ Lucide icon sắp xếp thứ tự phổ biến; Thêm nút "Tải từ cấu hình chung" cho Zalo và Phone inputs.

### Client UI / Site Component Layer
3. **[MODIFY] [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/details/ProductDetailPage.tsx)**
   * *Vai trò*: Trang chi tiết sản phẩm site thực.
   * *Thay đổi*: Bỏ xoay icon Zalo; Loại bỏ hardcode mô tả combo; Tăng font size combo card; Giảm padding nút CTA trên mobile.
4. **[MODIFY] [ProductDetailPreview.tsx](file:///components/experiences/previews/ProductDetailPreview.tsx)**
   * *Vai trò*: Component Preview.
   * *Thay đổi*: Đồng bộ bỏ xoay icon Zalo, loại bỏ hardcode mô tả, và tối ưu padding nút CTA trên mobile tương ứng.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Giai đoạn 1**: Cập nhật admin edit `page.tsx` để triển khai toggle thu gọn/mở rộng combo card.
2. **Giai đoạn 2**: Cập nhật system experiences `page.tsx` để nâng cấp 200+ icons Lucide động và thêm các nút "Tải từ cấu hình chung" cho SĐT/Zalo.
3. **Giai đoạn 3**: Cập nhật site thực `ProductDetailPage.tsx` tối ưu hóa kích thước combo, bỏ xoay icon, bỏ hardcode mô tả, và tinh chỉnh padding nút CTA mobile.
4. **Giai đoạn 4**: Đồng bộ hoá file preview `ProductDetailPreview.tsx`.
5. **Giai đoạn 5**: Tiến hành tự kiểm tra tĩnh (tsc) và review chất lượng.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Static compilation check
* Chạy `bunx tsc --noEmit` toàn dự án Next.js để xác minh không có bất kỳ lỗi biên dịch nào.

### Manual Verification
1. **Kiểm tra Admin**:
   - Truy cập trang chỉnh sửa sản phẩm, kiểm chứng xem các combo có mặc định thu gọn mỏng đẹp không.
   - Click vào tiêu đề combo để mở rộng form chi tiết.
   - Thực hiện kéo thả các combo đã thu gọn, xác nhận thao tác DnD diễn ra cực kỳ mượt mà, dễ chịu.
2. **Kiểm tra Cấu hình Experiences**:
   - Mở Grid Icon Picker của nút Zalo, xác nhận lưới 5 cột chứa hơn 200 icon Lucide phổ biến sắp xếp hợp lý.
   - Click nút "Tải từ cấu hình chung", xác nhận input tự động điền SĐT/Zalo hệ thống.
3. **Kiểm tra Site thực**:
   - Xác nhận icon Zalo không bị xoay xiên.
   - Xác nhận combo card không còn dòng chữ cứng `"Tiết kiệm tối đa khi mua gói"`.
   - Xác nhận font chữ combo card to rõ hơn và không bị cắt.
   - Xác nhận 2 nút CTA trên mobile hiển thị gọn gàng trên 1 dòng duy nhất, không bị tràn chữ xuống dòng.

---

# VIII. Todo

- [ ] Triển khai Accordion toggle thu gọn combo card trong `app/admin/products/[id]/edit/page.tsx`.
- [ ] Bổ sung mảng 210+ icons Lucide và nút "Tải từ cấu hình chung" trong `app/system/experiences/product-detail/page.tsx`.
- [ ] Bỏ xoay icon Zalo, bỏ hardcode mô tả combo, tối ưu kích thước chữ combo card và padding CTA mobile trong `app/(site)/_components/details/ProductDetailPage.tsx`.
- [ ] Đồng bộ hóa các thay đổi UI trên trong `components/experiences/previews/ProductDetailPreview.tsx`.
- [ ] Chạy `bunx tsc --noEmit` cục bộ để verify chất lượng.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Accordion Combo**: Combo card mặc định thu gọn khi tải trang, click tiêu đề mở ra, kéo thả DnD siêu dễ.
* **210+ Icons Grid**: Popover picker hiển thị 5 cột đẹp mắt, chứa >200 icon Lucide sắp xếp từ phổ biến giảm dần.
* **Load Fallback Link**: Nút "Tải từ cấu hình chung" điền đúng Zalo/Sđt hệ thống.
* **Icon Straightness**: Icon Zalo hiển thị thẳng đứng tự nhiên.
* **Spacious Combo UI**: Không còn dòng chữ hardcode mô tả combo. Font chữ combo card to rõ hơn.
* **CTA Single Line**: Cả hai nút CTA trên mobile hiển thị gọn gàng trên 1 dòng duy nhất.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* Không thay đổi schema database; các thuộc tính cấu hình được lưu tự động dạng JSON. An toàn tuyệt đối.

---

# XI. Out of Scope (Ngoài phạm vi)
* Không can thiệp vào các logic thanh toán hoặc cấu hình khác ngoài phạm vi được chỉ định.
