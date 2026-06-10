# Spec: Nâng cấp giao diện Popup ảnh phiên bản sản phẩm (V2)

# I. Primer

## 1. TL;DR kiểu Feynman
Giao diện tải ảnh cho từng phiên bản sản phẩm sẽ được nâng cấp tối đa dựa trên phản hồi của người dùng:
- Loại bỏ hoàn toàn phần "Thư viện ảnh sản phẩm" (ảnh gốc của sản phẩm) vì không cần thiết.
- Nếu phiên bản đã có ảnh, hiển thị ảnh hiện tại đó to và rõ ràng ở trung tâm popup.
- Cho phép thay thế ảnh cũ bằng cách kéo thả tệp trực tiếp hoặc click chọn ảnh mới.
- Sắp xếp lại chân trang (Footer) đối xứng: nút xóa ảnh (đỏ) bên trái, các nút thao tác bên phải.

## 2. Elaboration & Self-Explanation
Theo phản hồi mới nhất, việc hiển thị toàn bộ Thư viện ảnh sản phẩm trong popup phiên bản là dư thừa và gây rối rắm. Thay vào đó, khi phiên bản đã được gán ảnh, admin cần xem lại chính xác bức ảnh hiện tại của phiên bản đó ngay bên trong Dialog.
Chúng ta sẽ thiết kế lại logic hiển thị trong Dialog của `VariantImageCell`:
- **Trường hợp đã có ảnh (`value` !== undefined):** Hiển thị khối preview ảnh hình vuông `w-44 h-44 mx-auto` bo tròn góc, hiển thị sắc nét ảnh hiện tại. Ngay dưới ảnh hiện tại là một vùng Dropzone dẹt (`p-3`) hỗ trợ kéo thả tệp hoặc click chọn tệp mới để thay thế nhanh.
- **Trường hợp chưa có ảnh:** Hiển thị vùng Dropzone kéo thả nét đứt kích thước lớn (`p-8`) trực quan với icon và hướng dẫn rõ ràng.
- Các tính năng phụ như Dán ảnh từ Clipboard (Ctrl+V) và dán link URL trực tiếp được bố trí gọn gàng phía dưới.
- Footer được định nghĩa flex-row đối xứng để nút "Xóa ảnh" (màu đỏ) nằm độc lập bên trái, nút "Cắt/Sửa" và "Đóng" nằm bên phải.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Khi chỉnh sửa phiên bản "Màu sắc: Hồng", nếu admin đã tải ảnh cho phiên bản này, Dialog sẽ hiển thị bức ảnh chiếc áo thun hồng to rõ ràng ở chính giữa. Admin có thể bấm nút "Cắt / Sửa" để chỉnh ảnh đó hoặc kéo tệp ảnh mới thả vào thanh bên dưới để ghi đè.
- **Analogy:** Giống như một khung ảnh trên bàn làm việc. Nếu đã có ảnh trong khung, khung ảnh sẽ hiển thị bức ảnh đó thật đẹp mắt, kèm theo một khe nhỏ bên dưới để bạn đút ảnh mới vào thay thế. Nếu khung đang trống, nó sẽ hiển thị một bảng hướng dẫn mời bạn đặt ảnh vào.

# II. Audit Summary (Tóm tắt kiểm tra)
- Kiểm tra file [inline-matrix-builder.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/connix/app/admin/products/components/inline-matrix-builder.tsx).
- Dialog hiện tại hiển thị thư viện ảnh sản phẩm cồng kềnh và thiếu phần hiển thị trực tiếp ảnh hiện tại của phiên bản.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Logic Dialog cũ tập trung vào việc cho chọn ảnh từ gallery gốc nhưng bỏ qua việc hiển thị ảnh hiện tại của chính phiên bản đó, dẫn đến trải nghiệm người dùng không trực quan.
- **Giả thuyết đối chứng:** Loại bỏ gallery gốc và thay bằng khối preview ảnh hiện tại của phiên bản khi `value` tồn tại sẽ cải thiện 100% độ rõ ràng của giao diện.

# IV. Proposal (Đề xuất)
- Cập nhật JSX của Dialog trong `VariantImageCell`:
  1. Loại bỏ prop `galleryImages` khỏi các hiển thị trong Dialog.
  2. Bổ sung khối render ảnh hiện tại (`value`) với khung preview `w-44 h-44` bo góc khi có ảnh.
  3. Bổ sung Dropzone dạng dẹt (`p-3`) cho trường hợp thay thế ảnh, và Dropzone lớn (`p-8`) cho trường hợp chưa có ảnh.
  4. Giữ nguyên tính năng paste clipboard và URL ở phần tùy chọn phụ.
  5. Căn chỉnh chân trang đối xứng.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [inline-matrix-builder.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/connix/app/admin/products/components/inline-matrix-builder.tsx)
  - Thay đổi cấu trúc hiển thị Dialog của component `VariantImageCell`.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh sửa code Dialog trong file `inline-matrix-builder.tsx`.
2. Chạy `tsc` để kiểm tra lỗi kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy biên dịch TypeScript tĩnh:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

# VIII. Todo
- [x] Lập spec thiết kế mới cho popup.
- [ ] Chỉnh sửa giao diện Dialog trong `inline-matrix-builder.tsx`.
- [ ] Chạy kiểm tra TypeScript (`tsc`).
- [ ] Chạy lệnh thông báo hoàn thành qua PowerShell.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Không còn hiển thị "Thư viện ảnh sản phẩm" (gallery gốc) trong Dialog.
- Nếu phiên bản đã có ảnh, hiển thị khung ảnh preview `w-44 h-44` ở giữa Dialog.
- Dropzone thay đổi ảnh/tải ảnh mới hoạt động trơn tru với kéo thả chuột.
- Footer đối xứng hoàn hảo.
- Biên dịch TypeScript thành công.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Không có rủi ro logic, hoàn tác qua Git dễ dàng.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa backend hay các API lưu trữ.
