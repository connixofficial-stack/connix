# I. Primer

## 1. TL;DR kiểu Feynman
Hiện tại, trên nền tối, viền của các nút bước chưa được bấm (chưa active) bị chìm hoàn toàn vào màu nền đen, làm cho người dùng khó thấy được các vòng tròn nút này. Chúng ta sẽ làm cho viền của các nút chưa active này sáng lên bằng cách sử dụng màu chủ đạo thương hiệu (màu vàng của DOHY) nhưng làm mờ đi một chút (opacity 25% - 30%). Điều này vừa giúp các nút nổi bật rõ ràng vừa tạo nên hiệu ứng thị giác hiện đại, đồng bộ.

## 2. Elaboration & Self-Explanation
Các nút bước công việc chưa được bấm (inactive) trong component `RenderCircular` hiện đang sử dụng biến `borderCol` để hiển thị màu viền. Khi hệ thống nhận diện màu chính sáng (như màu vàng), nền section sẽ tự động chuyển sang màu đen sẫm `#090d16`, và `borderCol` được thiết lập là `#1e293b` (màu xám tối). 
Trên nền đen sẫm, viền màu `#1e293b` bị mất đi độ tương phản cần thiết và chìm nghỉm, khiến các nút chưa active trông giống như không có viền.
Giải pháp là cập nhật lại thuộc tính `borderColor` cho các nút chưa active:
* Nếu nút đó đang active: Dùng màu chính thương hiệu `primaryColor` (vàng sáng 100%).
* Nếu nút đó chưa active (inactive):
  * Trong điều kiện nền tối (`isPrimaryLight` là true): Sử dụng màu chính thương hiệu được pha thêm độ mờ opacity (`${primaryColor}40` - tương đương khoảng 25% độ mờ).
  * Trong điều kiện bình thường khác: Dùng màu `borderCol` mặc định.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Hãy tưởng tượng các nút bước công việc giống như các trạm vũ trụ nhỏ đang bay quanh một hành tinh mẹ lớn (vòng tròn trung tâm). Hành tinh mẹ đã có một vành đai màu vàng phát sáng rực rỡ. Để các trạm vũ trụ nhỏ chưa hoạt động không bị biến mất vào khoảng không đen tối của vũ trụ, chúng ta cho chúng phát ra một quầng hào quang màu vàng nhạt hơn (màu vàng mờ). Chỉ khi trạm nào được kích hoạt (active), nó mới sáng rực lên màu vàng đậm 100%.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Vị trí code:** Thuộc tính `borderColor` của thẻ `button` (đại diện cho các bước) trong component `RenderCircular` tại tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* **Trạng thái hiện tại:** `borderColor: isActive ? primaryColor : borderCol` (dòng 1351).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc (Root Cause):** Màu viền `borderCol` (#1e293b) của nút chưa active quá tối so với nền đen sẫm `#090d16` dẫn tới mất tương phản hình ảnh.
* **Giả thuyết đối chứng (Counter-Hypothesis):** Nếu sử dụng màu chính thương hiệu làm mờ (`${primaryColor}40`), các nút này sẽ nổi rõ hình tròn viền bao quanh trên nền đen sẫm mà không làm ảnh hưởng đến độ tập trung của nút đang active.

---

# IV. Proposal (Đề xuất)
* Sửa đổi thuộc tính `borderColor` của nút bấm bước trong component `RenderCircular` (tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)) tại dòng 1351:
  * Từ: `borderColor: isActive ? primaryColor : borderCol`
  * Thành: `borderColor: isActive ? primaryColor : (isPrimaryLight ? `${primaryColor}40` : borderCol)`

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)
  * Vai trò: Chứa logic hiển thị layout Circular.
  * Thay đổi: Cập nhật màu viền động cho các nút bước chưa active.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
2. Tìm dòng 1351 bên trong thẻ `button` của `RenderCircular`.
3. Sửa đổi logic tính toán `borderColor`.
4. Chạy `bunx tsc --noEmit` để đảm bảo biên dịch thành công.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra kiểu tĩnh (TypeScript compile):** Chạy `bunx tsc --noEmit` để chắc chắn không phát sinh lỗi.
* **Kiểm tra trực quan (Visual check):** Xác nhận các nút bước chưa active (2, 3, 4, 5, 6) trên nền tối đã có viền màu vàng mờ rõ ràng và đẹp mắt.

---

# VIII. Todo
* [ ] Cập nhật logic `borderColor` cho nút bước trong component `RenderCircular` (tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)).
* [ ] Kiểm thử lỗi biên dịch TypeScript tĩnh (`bunx tsc --noEmit`).
* [ ] Phát giọng nói báo hiệu hoàn thành tác vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Nút chưa active hiển thị viền màu vàng mờ (`primaryColor` + opacity) trên nền tối.
* Không có lỗi TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có rủi ro nào vì đây chỉ là thay đổi CSS style inline cho thuộc tính màu viền.
* **Hoàn tác:** Sử dụng `git checkout` để khôi phục tệp.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi màu sắc của các layout khác.
