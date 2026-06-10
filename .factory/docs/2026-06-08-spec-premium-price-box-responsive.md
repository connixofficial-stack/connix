# I. Primer

## 1. TL;DR kiểu Feynman
Khi xem trang chi tiết sản phẩm trên điện thoại, hộp hiển thị giá của layout Premium hiện tại đang trông rất lộn xộn (giá gốc và thông tin tiết kiệm bị dính sát nhau, badge đỏ bị cắt mất chữ, và có một khoảng trống vô duyên ở bên phải). 
Để giải quyết việc này, chúng ta sẽ chia đôi chiếc hộp giá này làm hai phần bằng một đường kẻ dọc mỏng tinh tế giống như các trang web cao cấp:
- Bên trái (rộng hơn): Hiển thị nhãn "GIÁ ƯU ĐÃI HÔM NAY", số tiền ưu đãi siêu to, và dòng chữ nhỏ báo số tiền tiết kiệm được.
- Bên phải (nhỏ hơn): Hiển thị nhãn "GIÁ GỐC", số tiền gốc gạch ngang và thẻ phần trăm giảm giá.
Thiết kế mới này sẽ tự động căn chỉnh hoàn hảo trên mọi màn hình điện thoại mà không lo bị lỗi tràn chữ hay lệch layout.

## 2. Elaboration & Self-Explanation
Mục tiêu là cải tiến Box Giá Premium (Premium Price Box) trong layout `PremiumStyle` của trang chi tiết sản phẩm (`ProductDetailPage.tsx` và `ProductDetailPreview.tsx`) để đạt được trải nghiệm visual premium trên mobile:
- **Cấu trúc chia 2 cột**: Thay vì xếp hàng ngang lộn xộn hoặc xếp dọc đơn thuần, Box Giá sẽ chia thành 2 phần bằng Grid (cột trái chiếm 8/12, cột phải chiếm 4/12) ngăn cách bởi đường kẻ dọc mỏng (`border-l`).
- **Căn chỉnh thông tin khoa học**:
  - Cột trái: Nhãn `GIÁ ƯU ĐÃI HÔM NAY ✨` ở trên, giá bán chính (`priceDisplay.label`) ở giữa (cỡ chữ to nổi bật), và text tiết kiệm (`Tiết kiệm... so với giá gốc`) ở dưới.
  - Cột phải: Nhãn `GIÁ GỐC` ở trên, giá gốc (`comparePrice`) gạch ngang ở giữa, và badge giảm giá (`-X%`) ở dưới. Các thông tin này xếp dọc để tránh xung đột không gian chiều ngang trên mobile.
- **Tính thích ứng động (Responsive & Data Fallback)**:
  - Nếu sản phẩm không có giảm giá (không có `comparePrice` hoặc `showSalePrice` tắt), cột trái tự động chiếm full width (`col-span-12`) và ẩn cột phải cùng đường kẻ dọc.
  - Màu sắc viền, nền, chữ được lấy hoàn toàn từ hệ thống `tokens` và `discountBadgeColors` có sẵn để đảm bảo đồng bộ 100% với màu thương hiệu động.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  - Sản phẩm A có giá bán 250.000đ và giá gốc 390.000đ (giảm 36%): Trên mobile, Box Giá chia đôi. Bên trái ghi "GIÁ ƯU ĐÃI HÔM NAY / 250.000đ / Tiết kiệm 140.000đ so với giá gốc". Bên phải ghi "GIÁ GỐC / 390.000đ / -36%". Giữa hai bên có vạch dọc mờ phân cách.
  - Sản phẩm B có giá 500.000đ không giảm giá: Bên trái ghi "GIÁ ƯU ĐÃI HÔM NAY / 500.000đ" chiếm trọn chiều ngang của Box Giá.
* **Analogy đời thường**: Giống như bảng so sánh giá tại quầy miễn thuế ở sân bay quốc tế. Bảng được chia làm hai cột rõ ràng: một bên là giá khuyến mãi hôm nay kèm thông báo bạn tiết kiệm được bao nhiêu, bên kia là giá gốc niêm yết và nhãn giảm giá. Cách chia cột này giúp khách hàng nắm bắt thông tin cực nhanh mà không bị rối mắt.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã định vị vị trí render Box Giá Premium trong:
  - Frontend: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx) dòng `3165-3203` inside component `PremiumStyle`.
  - Admin Preview: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx) dòng `1939-1972` inside component `ProductDetailPreview`.
* Phân tích cấu trúc render giá hiện tại:
  - Đang dùng cấu trúc flex-row/col đơn giản không chia cột, dẫn đến badge % giảm giá và giá gốc bị dính hoặc tràn chữ trên màn hình nhỏ.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Triệu chứng**: Giao diện giá Premium trên mobile bị lệch, badge "Tiết kiệm" bị cắt chữ và có khoảng trống thừa màu trắng ở bên phải (Hình 2).
* **Nguyên nhân gốc**: Code hiện tại của Box Giá Premium xếp tất cả thông tin giá gốc và badge giảm giá trên cùng một hàng ngang mà không chia cột, khi màn hình điện thoại hẹp, không gian chiều ngang không đủ dẫn đến tràn và cắt chữ.
* **Giả thuyết đối chứng**: Nếu chia đôi Box Giá thành 2 cột độc lập (Trái: Giá ưu đãi, Phải: Giá gốc và badge giảm giá) và cho các thông tin ở mỗi cột xếp dọc nhau, chúng ta sẽ loại bỏ hoàn toàn việc tranh chấp không gian chiều ngang, từ đó giải quyết triệt để lỗi tràn chữ và tạo ra giao diện cân đối, cao cấp (Hình 1).

---

# IV. Proposal (Đề xuất)
* Triển khai cấu trúc Grid 12 cột cho Box Giá Premium:
  - Cột trái: `col-span-8 pr-3 flex items-start gap-3` (kết hợp hỗ trợ icon trái `priceLeftIcon` mượt mà).
  - Cột phải: `col-span-4 pl-3 border-l space-y-1` với màu border là `tokens.divider`.
* Đồng bộ hoá thay đổi này trên cả file frontend và admin preview.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
* **[ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)**:
  - Vai trò hiện tại: Component chi tiết sản phẩm phía frontend.
  - Thay đổi: Thay thế đoạn render Box Giá Premium cũ (dòng 3165-3203) bằng cấu trúc Grid 12 cột chia đôi trái/phải responsive mượt mà.
* **[ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)**:
  - Vai trò hiện tại: Component giả lập preview chi tiết sản phẩm trong admin.
  - Thay đổi: Thay thế đoạn render Box Giá Premium cũ (dòng 1939-1972) tương ứng để đồng bộ trải nghiệm trực quan.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Đọc và chỉnh sửa phần render Box Giá Premium trong `PremiumStyle` của [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx).
2. **Bước 2**: Đọc và chỉnh sửa phần render Box Giá Premium trong `ProductDetailPreview` của [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx).
3. **Bước 3**: Chạy kiểm tra tĩnh và TypeScript typecheck toàn cục.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo không có lỗi kiểu dữ liệu (TypeScript type error) sau khi chỉnh sửa.

### Manual Verification
* Mở trang chi tiết sản phẩm trên trình duyệt, chuyển sang chế độ Responsive Mobile (kích thước màn hình < 768px), chọn layout Premium và kiểm tra:
  - Box Giá Premium phải có màu kem/xám nhạt và đường viền bo góc rõ ràng.
  - Box Giá phải được chia làm 2 cột: bên trái là Giá bán và text Tiết kiệm, bên phải là Giá gốc gạch ngang và badge giảm giá.
  - Badge giảm giá và dòng chữ tiết kiệm hiển thị đầy đủ, không bị tràn hay cắt chữ.
  - Nếu sản phẩm không có giảm giá, cột trái phải tự động co dãn chiếm 100% chiều rộng của Box Giá.

---

# VIII. Todo
- [ ] Xây dựng lại Box Giá Premium chia 2 cột trong [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx).
- [ ] Đồng bộ hoá Box Giá Premium chia 2 cột trong [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx).
- [ ] Chạy typecheck `bunx tsc --noEmit` toàn dự án.
- [ ] Chạy âm báo `"Done, Sir."` và báo cáo kết quả.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Box Giá Premium trên mobile phải hiển thị chia làm 2 cột cân đối như Hình 1.
* Không có hiện tượng cắt chữ ở badge giảm giá hay text tiết kiệm.
* Tự động ẩn cột phải và dãn rộng cột trái khi sản phẩm không có giảm giá.
* Toàn bộ dự án vượt qua kiểm tra TypeScript compile (`tsc --noEmit`).

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi CSS Grid trên một số kích thước màn hình quá nhỏ làm méo mó cột phải.
* **Giải quyết**: Sử dụng `col-span-8` và `col-span-4` kết hợp với padding và spacing tỉ lệ phần trăm, các text bên cột phải được xếp dọc để đảm bảo an toàn tuyệt đối.
* **Hoàn tác**: Sử dụng lệnh `git checkout` để rollback về commit gần nhất nếu phát hiện lỗi hiển thị nghiêm trọng.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi thiết kế của các layout khác (`classic`, `modern`, `minimal`) ngoài layout `premium`.
