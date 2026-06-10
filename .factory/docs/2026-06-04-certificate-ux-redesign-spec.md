# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Chứng nhận hoàn thành khóa học hiện tại hiển thị thô sơ dưới dạng một khối thông tin đơn giản trong trang chi tiết khóa học, không thể tải về, không thể in ấn trang trọng và không thể mở ở tab mới để chia sẻ.
* **Giải pháp**:
  1. **Tạo trang chứng chỉ riêng**: Thêm đường dẫn công khai `/chung-nhan/[code]` (ví dụ `/chung-nhan/CERT-X-Y`) hiển thị toàn màn hình chứng chỉ thiết kế theo phong cách trang trọng cổ điển (Ivory/Gold).
  2. **Hỗ trợ tải về & In ấn (Print to PDF)**: Tích hợp nút "In / Tải chứng chỉ" gọi lệnh `window.print()` của trình duyệt. Sử dụng CSS Print `@media print` để căn lề khổ A4 ngang (Landscape) và ẩn các nút điều hướng, giúp xuất file PDF vector siêu nét không bị vỡ chữ.
  3. **Mã QR & Xác thực**: Tích hợp mã QR và mã xác nhận ở góc chứng chỉ để nhà tuyển dụng có thể quét và xác thực trực tuyến tính chính danh của chứng chỉ.
  4. **Nút liên kết**: Thay thế khối chứng chỉ cũ trên trang chi tiết bằng một preview đẹp mắt có nút "Mở chứng nhận chính thức" (mở tab mới `_blank`).

## 2. Elaboration & Self-Explanation
Chúng ta sẽ mở rộng cơ sở dữ liệu và ứng dụng để hỗ trợ tính năng cấp chứng nhận tiêu chuẩn chuyên nghiệp:
- **Tối ưu hóa Database (Convex)**: Thêm index `by_certificateCode` trên bảng `courseStudents`. Việc này giúp query tìm học viên và khóa học dựa trên mã chứng chỉ diễn ra tức thời khi người ngoài hoặc nhà tuyển dụng truy cập vào đường dẫn `/chung-nhan/[code]`.
- **Thiết kế trang trọng (Certificate Design)**: Chứng chỉ sẽ có thiết kế cổ điển pha lẫn hiện đại:
  - Khung viền kép hoa văn góc màu vàng kim (Gold ornate frame).
  - Tông nền màu ngà cổ điển (Classic Ivory/Cream).
  - Sử dụng Google Fonts (như `Cinzel` hoặc `Cormorant Garamond` cho tiêu đề serif sang trọng, kết hợp font `Be Vietnam Pro` cho nội dung tiếng Việt).
  - Huy hiệu Dohy Studio dạng tròn nổi 3D màu vàng kim ở giữa đáy.
  - Chữ ký viết tay của đại diện Dohy Studio bên cạnh.
  - Mã QR Code được sinh động từ URL của trang xác thực chứng chỉ.
- **Giải pháp xuất file PDF**: Sử dụng CSS Print là giải pháp sạch nhất và tối ưu nhất (Clean-by-construction) vì trình duyệt tự động render các phần tử văn bản dạng vector, giữ nguyên font chữ sắc nét khi xuất PDF, tốt hơn nhiều so với việc chụp ảnh canvas (bị mờ và vỡ hình) hoặc dùng thư viện JS nặng nề gây chậm trang.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như chứng chỉ của Coursera hay Udemy, khi bạn hoàn thành khóa học, bạn nhận được một đường link xác thực dạng `coursera.org/verify/12345`. Bạn có thể gửi link này cho nhà tuyển dụng hoặc đính kèm vào hồ sơ LinkedIn. Khi click vào sẽ mở ra một trang chứng chỉ khổ ngang cực kỳ trang trọng, có nút "Download PDF" để in ra treo tường hoặc lưu trữ.
* **Hình ảnh tương đồng**: Thay vì đưa cho học viên một mảnh giấy ghi tay "Bạn đã học xong", chúng ta in cho họ một tấm bằng đóng khung vàng mạ kim có dấu đỏ chói lọi, có chữ ký của hiệu trưởng và mã số chứng chỉ quốc gia để ai cũng có thể đối chiếu.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/schema.ts):
  - Bảng `courseStudents` lưu trữ `certificateCode` nhưng chưa được đánh index, cần thêm `.index("by_certificateCode", ["certificateCode"])`.
* Đã kiểm tra file [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx):
  - Dòng 294-336 hiển thị một block chứng nhận thô sơ dạng dải màu gradient của thương hiệu. Chúng ta sẽ thay thế nó bằng một preview có nút liên kết.
* Đã kiểm tra quy trình cấp mã chứng chỉ:
  - Mã chứng chỉ được tạo bằng hàm `buildCertificateCode` trong [courseEnrollment.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/courseEnrollment.ts) khi học viên hoàn thành 100% bài học.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Nguyên nhân gốc (Root Cause)
1. **Thiếu Route xác thực**: Trước đây hệ thống chưa có route hiển thị chứng chỉ công khai dạng `/chung-nhan/[code]`, do đó học viên chỉ có thể xem tiến độ và chứng chỉ nội bộ trong trang chi tiết khóa học.
2. **Hạn chế xuất bản**: Block hiển thị cũ không được tối ưu cho việc in ấn hoặc lưu trữ dưới dạng văn bản pháp lý / chứng chỉ chuyên nghiệp.

---

# IV. Proposal (Đề xuất)

1. **Thêm Index trong Schema Convex**:
   - Thêm `.index("by_certificateCode", ["certificateCode"])` vào bảng `courseStudents` trong [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/schema.ts).

2. **Viết Public Query trong Convex**:
   - Thêm query `getCertificateByCode` vào [courses.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courses.ts). Query này tìm kiếm `courseStudents` bằng mã code và join thông tin `customer.name`, `course.title`, `course.slug` để trả về phía client.

3. **Xây dựng trang chứng nhận `/chung-nhan/[code]/page.tsx`**:
   - Tạo trang Next.js dạng dynamic route tại `app/(site)/chung-nhan/[code]/page.tsx`.
   - Thiết kế chứng nhận khổ ngang tỉ lệ 1.414:1 (A4).
   - Thiết lập CSS Print để ẩn các nút điều hướng và tự động chuyển khổ in sang `landscape` khi người dùng nhấn "In chứng chỉ".
   - Tự động sinh mã QR xác thực trỏ đến chính URL của trang chứng chỉ đó qua API QR Code.

4. **Tập trung hóa nút mở rộng**:
   - Cập nhật [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx) để hiển thị một preview chứng chỉ sang trọng và nút "Mở chứng nhận chính thức" (`_blank`) trỏ đến `/chung-nhan/[code]`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Thêm mới**:
  - `app/(site)/chung-nhan/[code]/page.tsx`: Trang Next.js hiển thị và in ấn chứng chỉ chính thức.
* **Sửa đổi**:
  - [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/schema.ts): Thêm index cho bảng `courseStudents`.
  - [courses.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courses.ts): Thêm query API `getCertificateByCode`.
  - [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx): Tích hợp preview và nút liên kết chứng chỉ.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Cập nhật file [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/schema.ts) để khai báo index `by_certificateCode`.
2. **Bước 2**: Thêm query `getCertificateByCode` vào [courses.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courses.ts).
3. **Bước 3**: Tạo file `app/(site)/chung-nhan/[code]/page.tsx` với thiết kế hoa văn vàng kim cổ điển sang trọng, QR Code, chữ ký và nút in ấn CSS.
4. **Bước 4**: Thay đổi UI hiển thị chứng chỉ trong [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx) để bổ sung nút mở tab mới.
5. **Bước 5**: Kiểm tra biên dịch TypeScript bằng `bunx tsc --noEmit`.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy `bunx tsc --noEmit` để đảm bảo không bị lỗi kiểu dữ liệu.

### Manual Verification
- Đóng vai học viên đã hoàn thành khóa học, truy cập trang chi tiết khóa học.
- Xác nhận nút "Xem chứng nhận chính thức" hiển thị đúng và mở tab mới dạng `/chung-nhan/CERT-XXXX-YYYY` khi click.
- Trang chứng nhận tải đúng thông tin: Tên học viên, Tên khóa học, Ngày cấp, Mã chứng nhận và mã QR.
- Nhấn nút "In / Tải về chứng chỉ", giao diện in của trình duyệt hiện lên với khổ A4 ngang, căn giữa hoàn hảo và ẩn toàn bộ các nút điều hướng.

---

# VIII. Todo

- [ ] Thêm index `by_certificateCode` vào [schema.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/schema.ts)
- [ ] Thêm query `getCertificateByCode` vào [courses.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courses.ts)
- [ ] Tạo trang chứng nhận [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/chung-nhan/[code]/page.tsx)
- [ ] Tích hợp nút xem chứng chỉ vào [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx)
- [ ] Chạy `bunx tsc --noEmit` xác thực biên dịch
- [ ] Chạy âm thanh hoàn thành task.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Trang chứng chỉ hiển thị đúng tỷ lệ A4 ngang (Landscape) trên màn hình và khi in ấn.
* Thiết kế chứng chỉ trang trọng, cổ điển, có khung viền hoa văn vàng kim/navy, logo Dohy Studio, chữ ký, dấu đỏ và QR Code xác thực.
* Người dùng có thể in hoặc xuất ra tệp PDF vector sắc nét thông qua tính năng in của hệ thống.
* Nút "Xem chứng nhận chính thức" trên trang chi tiết khóa học mở tab mới (`target="_blank"`).

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi hiển thị font chữ serif trên một số máy khách khi in.
* **Giải pháp**: Nhúng font chữ Google Font trực tiếp bằng đường link CDN trong component để đảm bảo trình in ấn tải được font chữ.

---

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi logic tính toán phần trăm hoàn thành bài học của học viên.
* Không thiết kế lại hệ thống cấp chứng nhận tự động của Convex.
