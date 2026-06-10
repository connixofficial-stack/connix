# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Chứng chỉ hiện tại dù đã có cải tiến nhưng vẫn gặp nhiều lỗi về thiết kế mỹ thuật và trải nghiệm (UI/UX):
  - *Về giao diện*: Tên học viên bị lu mờ, tên khóa học bọc khung trông như nút bấm, con dấu và logo quá nhỏ, màu sắc tương phản kém, bố cục giữa bị loãng.
  - *Về trải nghiệm*: QR Code và ID chứng chỉ quá nhỏ khó quét, thiếu hướng dẫn xác thực, thông tin đơn vị cấp và loại chứng chỉ chưa đủ uy tín, chữ ký quá to chiếm chỗ.
* **Giải pháp**:
  1. **Quy hoạch phân cấp thị giác (Visual Hierarchy)**: Ép tên học viên thành to nhất và nổi bật nhất (size lớn, chữ hoa, màu Navy đậm). Bỏ khung xám bo góc của tên khóa học, đặt nó trang trọng trên dải dòng kẻ Gold.
  2. **Tăng nhận diện & Uy tín**: Tăng kích thước logo Dohy Academy và con dấu Verify (vẽ bằng SVG dập nổi răng cưa Gold hoàng gia). Thêm nhãn loại chứng chỉ "CHỨNG CHỈ HOÀN THÀNH KHOÁ HỌC - COURSE COMPLETION CERTIFICATE".
  3. **Tối ưu hóa các chi tiết kỹ thuật**: Tăng kích thước QR code, bổ sung nhãn hướng dẫn xác thực "Quét mã để xác thực trực tuyến". Thu nhỏ chữ ký và mã ID để cân đối không gian.
  4. **Tăng cường tương phản**: Chuyển tông màu Gold nhạt sang màu vàng đồng đậm cổ điển (Deep Bronze Gold) để hiển thị rõ ràng trên nền giấy ngà.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ tiến hành tái thiết kế toàn bộ bố cục mỹ thuật của tấm bằng để đạt chuẩn "Chuyên nghiệp & Trang trọng":
- **Quy hoạch Font chữ**: Đồng bộ font chữ hệ thống `Be Vietnam Pro` (sans-serif) làm font chủ đạo cho toàn bộ văn bản tiếng Việt để tránh lỗi chân chữ Serif và đồng bộ phong cách tối giản, hiện đại của Dohy Studio. Giữ font `Pinyon Script` uốn lượn bay bổng riêng cho phần chữ ký.
- **Huy hiệu dập nổi (Verified Embossed Seal)**: Chúng ta sẽ thiết kế một con dấu sáp vàng kim lớn ở vị trí trung tâm đáy. Con dấu sẽ có viền răng cưa tia hoa văn đối xứng dạng SVG, hiệu ứng đổ bóng sâu để tạo cảm giác nổi khối 3D thật sự ấn tượng.
- **Bố cục cân bằng khoảng trống**: Thay vì để khoảng trắng lớn ở giữa gây loãng, chúng ta sẽ tối ưu khoảng cách (line-height, margin), kéo dãn tên học viên và tên khóa học, thêm các họa tiết trang trí mảnh (thin gold dividers) làm vách ngăn nghệ thuật chia các phần thông tin rõ ràng.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Hãy so sánh giữa một tấm bằng đại học chính quy và một phiếu khảo sát. Phiếu khảo sát có nhiều ô chọn, nút bấm và chữ viết nhỏ lộn xộn. Tấm bằng đại học có tên bạn viết hoa thật to ở chính giữa bằng mực đậm, tên ngành học nằm trang trọng trên một dòng kẻ, logo trường đóng nổi dấu đỏ chói lọi ở dưới. Nhà tuyển dụng nhìn vào tấm bằng là thấy ngay TÊN BẠN và NGÀNH HỌC trước tiên.
* **Hình ảnh tương đồng**: Tấm bằng giống như một bức tranh nghệ thuật cổ điển. Khung tranh phải mảnh, hình ảnh trung tâm (Tên học viên) phải chiếm 60% sự chú ý của người xem, con dấu hoàng gia và chữ ký chỉ đóng vai trò bảo chứng thẩm mỹ ở góc dưới chứ không lấn át nhân vật chính.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file [CertificateCard.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CertificateCard.tsx):
  - Dòng 199: Tên học viên đang dùng font Cormorant 4xl/5xl nhưng chưa đủ độ tương phản và phân cấp nổi bật.
  - Dòng 209: Tên khóa học đang được bọc trong wrapper `bg-slate-50 border border-slate-100 rounded-lg inline-block`, gây cảm giác giống nút bấm.
  - Dòng 220: Phần footer chia 3 cột đều nhau dẫn đến con dấu ở giữa và QR code bên phải bị co cụm diện tích, khó quét.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Nguyên nhân gốc (Root Cause)
1. **Thiếu quy hoạch Typography & Hierarchy**: Việc kết hợp nhiều font chữ serif và sans-serif có độ dày mỏng tương tự nhau làm phân tán tiêu điểm thị giác của người xem.
2. **Thiết kế lặp lại UI Button**: Thói quen bọc các text quan trọng vào thẻ div có border/background màu xám nhạt làm vỡ tính chất trang trọng của một văn bản chứng chỉ.

---

# IV. Proposal (Đề xuất)

1. **Tái cấu trúc thiết kế Mỹ thuật (UI)**:
   - **Tên học viên**: Tăng size lên `text-4xl md:text-5xl font-black text-slate-900 tracking-wider uppercase drop-shadow-sm` sử dụng font `Be Vietnam Pro` để tạo điểm nhấn thị giác lớn nhất.
   - **Tên khóa học**: Loại bỏ khung xám và border bo góc. Đặt tên khóa học trong một dải phân cách mỏng, ví dụ: nằm giữa hai đường kẻ ngang màu vàng đồng mảnh (`border-y border-amber-650/20 py-3`).
   - **Loại chứng chỉ**: Bổ sung dòng nhãn "CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC" màu vàng đồng đậm ở trên tên học viên để định danh rõ ràng.
   - **Màu sắc**: Đổi mã màu Gold từ nhạt sang màu vàng đồng đậm (`#b58a55` hoặc `#a27b4c`) để nâng độ tương phản trên nền giấy ngà `#fdfbf7`.

2. **Cải tiến Trải nghiệm người dùng (UX)**:
   - **Con dấu sáp Verify**: Tăng kích thước (ví dụ `w-24 h-24`), vẽ họa tiết răng cưa SVG tỉ mỉ hơn, tạo màu gradient nổi bật và bóng đổ nhẹ.
   - **QR Code & ID**: Tăng kích thước QR code lên `w-16 h-16`, bổ sung dòng chữ hướng dẫn "Quét mã để xác thực chứng chỉ trực tuyến" cỡ chữ `8px` nằm gọn gàng phía dưới.
   - **Logo**: Tăng cỡ chữ logo "DOHY ACADEMY" ở header và thêm một biểu tượng SVG khiên học thuật (Academic Shield) màu Gold ở giữa để tăng nhận diện.

3. **Đồng bộ hóa layout hiển thị**:
   - Sử dụng chung component [CertificateCard.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CertificateCard.tsx) trên cả trang xem standalone và trang chi tiết khóa học, đảm bảo tính nhất quán 100% về mặt thiết kế.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa đổi**:
  - [CertificateCard.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CertificateCard.tsx): Tái cấu trúc CSS, nâng cấp thiết kế khung viền, chữ ký, con dấu và QR code.
  - [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/chung-nhan/[code]/page.tsx): Cập nhật giao diện nền trang standalone (nền tối để nổi bật bằng sáng rực).
  - [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx): Đảm bảo hiển thị tấm bằng khít kích thước container.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Cập nhật file [CertificateCard.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CertificateCard.tsx) để thay đổi toàn bộ bố cục bên trong tấm bằng (tên học viên, tên khóa học, con dấu, QR, logo).
2. **Bước 2**: Sửa đổi [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/chung-nhan/[code]/page.tsx) để tối ưu nền tối xám mịn của trang xem ảnh tách biệt.
3. **Bước 3**: Kiểm tra biên dịch TypeScript bằng `bunx tsc --noEmit`.
4. **Bước 4**: Kích hoạt âm báo hoàn thành task.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy `bunx tsc --noEmit` để đảm bảo không bị lỗi kiểu dữ liệu.

### Manual Verification
- Truy cập trang xem chứng nhận `/chung-nhan/CERT-XXXX`.
- Xác nhận:
  - Tên học viên là nội dung nổi bật nhất trên chứng chỉ.
  - Tên khóa học không còn nằm trong khung bo góc xám.
  - Con dấu verify to và sắc nét hơn.
  - QR Code hiển thị lớn hơn kèm dòng chữ hướng dẫn quét.
  - Logo Dohy Academy nổi bật có icon khiên học thuật đi kèm.
  - Tất cả các font chữ tiếng Việt đều dùng `Be Vietnam Pro` đồng bộ, sắc nét.
  - In ấn/Save as PDF giữ đúng tỷ lệ A4 ngang khít khao và ẩn các nút công cụ.

---

# VIII. Todo

- [ ] Cập nhật thiết kế trong [CertificateCard.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CertificateCard.tsx).
- [ ] Cập nhật nền tối trong [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/chung-nhan/[code]/page.tsx).
- [ ] Chạy `bunx tsc --noEmit` xác thực.
- [ ] Phát âm thanh báo Done.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Phân cấp thị giác rõ ràng: Tên người nhận nổi bật nhất -> Tên khóa học -> Loại chứng chỉ -> Logo -> Các thông tin phụ.
* Tên khóa học nằm trên dải phân cách dòng kẻ trang trọng, không dùng khung bo góc dạng nút bấm.
* Huy hiệu sáp và logo Dohy to hơn, thiết kế tinh xảo hơn.
* QR code lớn hơn và có nhãn hướng dẫn quét xác thực.
* Biên dịch TypeScript thành công 100%.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* Không có rủi ro về mặt logic Convex hay DB vì chỉ thay đổi UI.
* Có thể rollback qua `git checkout`.

---

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi logic cấp chứng chỉ trên Convex.
