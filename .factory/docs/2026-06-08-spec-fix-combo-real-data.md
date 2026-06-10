# I. Primer

## 1. TL;DR kiểu Feynman
- Khi quản trị viên cấu hình combo giảm giá theo % (ví dụ: mua 2 giảm 8%) mà không nhập giá cố định, trang web thực tế hiển thị chữ "Liên hệ" vì code cũ chỉ biết đọc giá cố định từ database.
- Đồng thời, giao diện thực tế trông lệch lạc và thô so với thiết kế gốc: nút chọn bị lệch, các chữ không căn giữa đều, badge "Bán chạy" đè lên chữ, và header tab phía trên bị bo góc tròn rời rạc không liền mạch với khung.
- Giải pháp: Tự động tính toán giá combo và số tiền tiết kiệm từ phần trăm giảm giá/quà tặng của Convex DB. Căn chỉnh lại CSS tuyệt đối: đưa nút radio sang bên trái absolute, căn giữa toàn bộ chữ, đưa badge "Bán chạy" lên mép trên viền, che khít tab tiêu đề vào viền khung ngoài.

## 2. Elaboration & Self-Explanation
Hệ thống quản lý sản phẩm hỗ trợ tạo các chương trình combo mua nhiều (Standard combo và Mix combo) với các hình thức ưu đãi khác nhau như giảm giá theo phần trăm (`discount_percent`), giảm giá theo số tiền cụ thể (`discount_amount`), hoặc tặng sản phẩm (`gift_self`, `gift_other`). Tuy nhiên, do logic hiển thị ở giao diện Premium chi tiết sản phẩm chỉ đọc trường `combo.price` cố định từ database, nên khi admin cấu hình giảm % (trường `price` để trống), hệ thống rơi vào trạng thái fallback hiển thị chữ "Liên hệ" và tính sai số tiền tiết kiệm. 

Bên cạnh đó, về mặt UI/UX:
- Phần padding bên trái quá rộng (`pl-14`) khiến khối chữ nội dung bị đẩy lệch sang phải.
- Nút radio rỗng thiếu màu sắc thương hiệu và không có dấu check `✓` rõ ràng.
- Khung header tab nhô lên phía trên bị bo góc ở cả 4 góc nên trông tách rời khỏi container thay vì liền mạch với đường viền.
Chúng ta sẽ viết hàm helper giải quyết bài toán tính toán giá, và chỉnh sửa cấu trúc CSS grid/flex để giao diện đẹp, cân xứng như mockup Ảnh 1.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Sản phẩm rượu vang Passion có giá gốc 590.000đ. Khi admin cấu hình combo "MUA 2 CHAI GIẢM 8%":
  - Giá trị gốc của 2 chai: 590.000 x 2 = 1.180.000đ.
  - Số tiền giảm (8%): 1.180.000 x 0.08 = 94.400đ.
  - Giá combo thực tế: 1.180.000 - 94.400 = 1.085.600đ.
  - Số tiền tiết kiệm thực tế: 94.400đ.
  - Giá trung bình mỗi chai: 1.085.600 / 2 = 542.800đ.
  - *Hiện tại*: Hiển thị "Liên hệ", tiết kiệm 1.180.000đ (sai lệch nghiêm trọng).
  - *Sau khi sửa*: Hiển thị "1.085.600đ", tiết kiệm "94.400đ", chi tiết mỗi chai "~542.800đ".

- **Phép ẩn dụ đời thường**: Nó giống như việc siêu thị treo bảng "Mua 3 tặng 1" nhưng máy quét mã vạch ở quầy thu ngân không tự tính được giá tổng mà bắt nhân viên phải gõ tay giá của combo đó. Nếu nhân viên quên gõ, khách hàng sẽ thấy giá là "Liên hệ" và hóa đơn ghi tiết kiệm bằng đúng giá trị của 4 chai rượu (tặng miễn phí toàn bộ).

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Giao diện combo card hiển thị "Liên hệ", nút chọn và badge lệch lạc, header tab lơ lửng, viền thô cứng trên môi trường thực tế.
- Mức độ ảnh hưởng: Ảnh hưởng trực tiếp đến trải nghiệm người dùng mua hàng ở trang chi tiết sản phẩm (layout Premium).
- Tệp tin liên quan: 
  - [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)
  - [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Độ tin cậy nguyên nhân gốc**: High (100%).
- **Nguyên nhân chính**:
  1. Thiếu logic tính toán giá động (`combo.price` và `savingAmount`) dựa trên `rewardType` (`discount_percent`, `discount_amount`, `gift_self`, `gift_other`) trong loop render combo card.
  2. Bố cục CSS căn lề của card dùng padding lệch trái (`pl-14 pr-5`) thay vì absolute nút radio và căn giữa khối chữ còn lại.
  3. Badge "Bán chạy" được định vị lệch xuống dưới đè lên nội dung thay vì căn chỉnh nằm đè lên viền trên.
  4. Header tab của box combo được bo góc tròn xung quanh và không căn chỉnh `left: -1px` để nối liền mạch với viền ngoài container.
  5. Viền card thay đổi độ dày (`border` vs `border-2`) gây ra hiện tượng layout shift nhẹ khi chọn qua lại.

# IV. Proposal (Đề xuất)
1. Xây dựng hàm helper tính toán giá combo thực tế (`resolvedComboPrice`), số tiền tiết kiệm (`resolvedSavingAmount`), số chai thực tế nhận được (`totalBottles`), và giá trung bình mỗi chai (`avgPricePerBottle`) dựa trên cấu hình standard/mix combo từ DB.
2. Tái cấu trúc CSS của Combo Box Container:
   - Đặt tab tiêu đề nổi ở `left: -1px`, `top: -16px` và `borderRadius: '12px 16px 24px 0px'` để hòa nhập mượt mà vào viền ngoài.
3. Tái cấu trúc CSS của Combo Card:
   - Áp dụng `border-2` cố định cho cả card được chọn và không được chọn, chỉ thay đổi màu viền (`tokens.border` vs `activeColor`) để tránh layout shift.
   - Badge "Bán chạy" đặt absolute ở `right-4 -top-2.5` và bo góc 4px gọn gàng.
   - Nút radio đặt absolute ở `left-4 top-1/2 -translate-y-1/2`, khi chọn sẽ tô đặc màu `activeColor` kèm dấu tick `✓` trắng. Khi không chọn thì hiện vòng tròn rỗng viền màu `activeColor` nhạt.
   - Nội dung chữ căn giữa tuyệt đối bằng cách dùng padding `pl-12 pr-12` (hoặc `pl-12 pr-6`) và đặt flex-col items-center.
   - Footer card phủ kín chiều rộng phía dưới, căn giữa toàn bộ icon và text, đồng bộ màu nền nhạt.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx): Cập nhật hàm render combo trong `PremiumStyle` (dữ liệu thật).
- `Sửa:` [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx): Cập nhật tương tự cho phần preview tĩnh để hiển thị đồng bộ.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm hàm helper tính toán giá combo chi tiết ngay trong component `PremiumStyle` của `ProductDetailPage.tsx`.
2. Áp dụng các thay đổi CSS về border, padding, radio button, badge bán chạy, và footer trong file thực tế.
3. Sao chép và đồng bộ giao diện tĩnh của combo card trong file preview `ProductDetailPreview.tsx`.
4. Kiểm tra biên dịch TypeScript (`bunx tsc --noEmit`).

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo không có lỗi kiểu dữ liệu.
- Commit toàn bộ thay đổi.
- Phát âm báo thành công.

# VIII. Todo
- [ ] Implement resolved combo calculation helper in `ProductDetailPage.tsx`.
- [ ] Redesign Carousel Combo Card layout in `ProductDetailPage.tsx`.
- [ ] Sync static preview mockup in `ProductDetailPreview.tsx`.
- [ ] Run typescript checks.
- [ ] Speak "Done, Sir.".

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Hiển thị đúng giá combo tính động (không còn chữ "Liên hệ" khi có chiết khấu).
- Số tiền tiết kiệm hiển thị chuẩn xác theo công thức tính toán.
- Giao diện khớp mockup Ảnh 1: tab nổi mượt, chữ căn giữa, nút radio có dấu tick, badge bán chạy nằm trên viền.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro lỗi compile TypeScript nếu sửa thiếu dấu ngoặc. Cần rà soát kỹ lưỡng.
- Rollback: `git checkout -- app/(site)/_components/details/ProductDetailPage.tsx components/experiences/previews/ProductDetailPreview.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào trang admin sửa đổi dữ liệu gốc trong Convex DB.
- Không thay đổi hành vi thêm vào giỏ hàng hoặc thanh toán của combo.
