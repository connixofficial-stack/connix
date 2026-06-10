# I. Primer

## 1. TL;DR kiểu Feynman
Người dùng muốn viền của vòng tròn lớn ở giữa sơ đồ quy trình sử dụng màu chính thương hiệu (màu vàng của DOHY) thay vì dùng màu xám tối/màu mặc định hiện tại. Việc này giúp sơ đồ trông nổi bật, có điểm nhấn rõ nét và đồng bộ hơn với toàn bộ thiết kế thương hiệu.

## 2. Elaboration & Self-Explanation
Hiện tại, đường viền của vòng tròn lớn ở giữa trong component `RenderCircular` (giao diện Circular Process Layout) đang sử dụng giá trị `borderCol`. Giá trị này được tính toán động dựa vào theme màu chính sáng hay tối, nhưng thường trả về các màu trung tính dịu mắt (như `#1e293b` hoặc màu viền thẻ mặc định). 
Điều này làm cho đường viền vòng tròn lớn bị mờ nhạt và kém nổi bật trên nền tối. 
Để giải quyết yêu cầu, chúng ta sẽ đổi trực tiếp thuộc tính `borderColor` của vòng tròn lớn từ `borderCol` sang `primaryColor` (màu chính của thương hiệu, ví dụ màu vàng thương hiệu của DOHY).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Hãy tưởng tượng bạn đang vẽ một sơ đồ tư duy trên bảng đen. Thay vì dùng phấn màu xám nhạt khó thấy để vẽ vòng tròn trung tâm kết nối các ý tưởng, bạn chuyển sang dùng phấn màu vàng neon nổi bật (màu chủ đạo của thương hiệu). Việc này giúp người xem ngay lập tức định vị được ranh giới của sơ đồ và tập trung vào nội dung bên trong.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Vị trí code:** Đường viền vòng tròn lớn nằm ở thẻ `div` bao bọc thông tin bước hoạt động (`activeIndex`) trong component `RenderCircular` tại tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* **Trạng thái hiện tại:** `borderColor` đang nhận giá trị `borderCol`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc (Root Cause):** Thuộc tính `borderColor` của vòng tròn trung tâm lớn đang gán cho `borderCol` (màu viền trung tính) khiến nó hiển thị chìm và không làm nổi bật được khối quy trình hình tròn.
* **Giả thuyết đối chứng (Counter-Hypothesis):** Nếu đổi sang dùng màu chính thương hiệu `primaryColor`, đường viền sẽ sáng lên và thể hiện rõ cấu trúc vòng tròn, đồng bộ với màu sắc của icon check và nút bước hiện hoạt (active).

---

# IV. Proposal (Đề xuất)
* Sửa đổi thuộc tính `borderColor` của vòng tròn trung tâm trong component `RenderCircular` (dòng 1320 trong tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)) từ `borderCol` thành `primaryColor`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)
  * Vai trò: Chứa component `RenderCircular` dùng để render giao diện quy trình dạng vòng tròn.
  * Thay đổi: Đổi `borderColor: borderCol` thành `borderColor: primaryColor` cho vòng tròn lớn.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
2. Tìm dòng 1320 bên trong `RenderCircular`.
3. Sửa `borderColor: borderCol` thành `borderColor: primaryColor`.
4. Chạy `bunx tsc --noEmit` để xác minh TypeScript biên dịch thành công.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra kiểu dữ liệu tĩnh (TypeScript compiler):** Chạy `bunx tsc --noEmit` để chắc chắn không phát sinh lỗi biên dịch.
* **Kiểm tra trực quan (Visual check):** Người dùng xem giao diện Circular trên môi trường Preview hoặc Homepage, kiểm tra xem viền vòng tròn lớn ở giữa đã đổi sang màu chính thương hiệu (ví dụ màu vàng) chưa.

---

# VIII. Todo
* [ ] Sửa `borderColor` của vòng tròn lớn ở giữa trong component `RenderCircular` (tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)).
* [ ] Thực hiện kiểm tra lỗi biên dịch TypeScript tĩnh (`bunx tsc --noEmit`).
* [ ] Phát giọng nói báo hiệu hoàn thành tác vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Viền vòng tròn lớn ở giữa sử dụng màu thương hiệu `primaryColor`.
* Không có lỗi TypeScript phát sinh.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Thay đổi cực nhỏ chỉ liên quan đến thuộc tính style CSS inline, không ảnh hưởng đến bất kỳ luồng xử lý logic hay state nào của component.
* **Hoàn tác:** Sử dụng `git checkout` hoặc hoàn tác thủ công để khôi phục thuộc tính `borderColor` về `borderCol`.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi màu viền của các nút bước nhỏ không active hoặc các thành phần khác.
