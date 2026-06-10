# I. Primer

## 1. TL;DR kiểu Feynman
Khi sử dụng màu mờ (opacity 25%), đường viền 2px của các nút bước nhỏ chưa active trông vẫn khá mỏng và mờ nhạt trên nền đen sâu. Để viền các nút này dày dặn và sắc nét lên hẳn theo đúng ý người dùng, chúng ta sẽ:
* Nâng độ dày viền (border width) từ 2px lên 3px cho cả vòng tròn lớn ở giữa và các nút nhỏ xung quanh.
* Tăng nhẹ độ hiển thị (opacity) của viền nút chưa active từ 25% lên 40% (mã màu `${primaryColor}66`).
Sự kết hợp này giúp các nét vẽ viền hiển thị rõ ràng, mạnh mẽ và đồng bộ hoàn hảo với nhau.

## 2. Elaboration & Self-Explanation
Do hiệu ứng tán xạ thị giác trên nền tối, các đường viền có màu mờ (translucent) thường tạo cảm giác mỏng hơn so với thực tế. Đó là lý do tại sao viền 2px màu vàng mờ của nút bước 6 trông vẫn rất mảnh so với viền 2px màu vàng sáng của vòng tròn lớn.
Để khắc phục triệt để và giúp các nút bước nhỏ hiển thị dày dặn, chúng ta sẽ:
* Thay đổi độ rộng viền `borderWidth` từ `2px` lên `3px` cho các nút bước nhỏ và vòng tròn lớn ở giữa.
* Tăng cường độ sáng của viền nút chưa hoạt động bằng cách thay đổi độ mờ từ `${primaryColor}40` (25% opacity) thành `${primaryColor}66` (40% opacity).
Điều này sẽ mang lại cảm quan đường nét vô cùng chắc chắn, cân đối và cao cấp cho toàn bộ sơ đồ quy trình Circular.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Giống như khi bạn dùng bút dạ quang để vẽ viền. Nếu bạn tô một nét mảnh và nhạt màu, nét vẽ đó sẽ dễ bị chìm trên nền giấy tối. Để nét vẽ nổi bật lên, bạn cần dùng ngòi bút to hơn (3mm thay vì 2mm) và tô đậm mực hơn một chút (tăng độ đậm của màu từ 25% lên 40%).

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Vị trí code:** 
  * Vòng tròn lớn ở giữa: Dòng 1317-1325 trong tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
  * Các nút bước nhỏ: Dòng 1345-1358 trong tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* **Trạng thái hiện tại:** Cả hai đều có `borderWidth: '2px'` và viền chưa active là `${primaryColor}40`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc (Root Cause):** Viền 2px kết hợp với độ mờ thấp (25%) khiến các đường nét của nút chưa active trông rất mỏng và chìm trên màn hình thực tế.
* **Giả thuyết đối chứng (Counter-Hypothesis):** Nâng viền lên 3px và opacity lên 40% sẽ làm cho viền của cả nút active và nút inactive hiển thị đầy đặn, rõ ràng và có độ dày thị giác tương đương nhau.

---

# IV. Proposal (Đề xuất)
* Cập nhật style inline của các phần tử trong component `RenderCircular` (tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)):
  * **Vòng tròn lớn trung tâm:** Đổi `borderWidth: '2px'` thành `borderWidth: '3px'`.
  * **Các nút bước nhỏ:**
    * Đổi `borderWidth: '2px'` thành `borderWidth: '3px'`.
    * Đổi `${primaryColor}40` thành `${primaryColor}66` (tăng opacity lên 40%).

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)
  * Vai trò: Chứa logic render layout Circular.
  * Thay đổi: Nâng `borderWidth` lên 3px và điều chỉnh opacity của viền nút bước chưa active.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
2. Sửa `borderWidth: '2px'` thành `borderWidth: '3px'` tại vòng tròn lớn và nút bấm bước.
3. Sửa `${primaryColor}40` thành `${primaryColor}66` ở phần borderColor của nút bấm.
4. Chạy `bunx tsc --noEmit` xác minh compile.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh:** Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.
* **Kiểm tra trực quan (Visual check):** Người dùng kiểm tra trực quan trên trình duyệt để đảm bảo viền bọc các nút bước nhỏ đã dày dặn, đậm đà và nổi bật rõ rệt.

---

# VIII. Todo
* [ ] Cập nhật `borderWidth` lên `3px` cho vòng tròn lớn trung tâm trong [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* [ ] Cập nhật `borderWidth` lên `3px` và nâng màu viền chưa active thành `${primaryColor}66` cho các nút bước nhỏ trong [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* [ ] Thực hiện kiểm tra lỗi biên dịch TypeScript (`bunx tsc --noEmit`).
* [ ] Phát âm thanh thông báo hoàn thành tác vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Viền vòng tròn lớn và viền các nút bước nhỏ hiển thị rõ với độ dày 3px.
* Viền nút chưa active hiển thị màu vàng mờ rõ ràng (40% opacity) trên nền tối.
* Không phát sinh lỗi TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có rủi ro nào vì đây chỉ là thay đổi CSS style độ rộng viền và màu viền.
* **Hoàn tác:** Sử dụng `git checkout` để rollback tệp.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi kích thước hoặc khoảng cách của các phần tử khác.
