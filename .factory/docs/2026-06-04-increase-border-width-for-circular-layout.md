# I. Primer

## 1. TL;DR kiểu Feynman
Người dùng muốn các đường viền (border) bao quanh vòng tròn lớn ở giữa và các nút bước nhỏ bên ngoài hiển thị đậm hơn, dày gấp đôi so với hiện tại. Chúng ta sẽ tăng độ dày viền từ 1 pixel lên thành 2 pixel. Việc này giúp toàn bộ khung sơ đồ quy trình hiển thị cực kỳ rõ ràng, cứng cáp và tạo hiệu ứng thiết kế sắc nét trên nền tối.

## 2. Elaboration & Self-Explanation
Mặc định, các thẻ div và button hiển thị viền sử dụng class `border` của Tailwind CSS (tương đương `border-width: 1px`). 
Khi hiển thị trên các giao diện có độ tương phản cao hoặc nền tối cyberpunk, viền 1px có xu hướng trông hơi mỏng manh và kém nổi bật từ xa.
Để tăng độ dày lên gấp 2-3 lần theo mong muốn của người dùng, chúng ta sẽ bổ sung thuộc tính inline style `borderWidth: '2px'` cho:
1. Vòng tròn lớn ở giữa (thẻ div hiển thị nội dung active).
2. Các nút tròn nhỏ hiển thị số bước công việc bên ngoài.
Điều này đảm bảo độ dày tăng lên 2px một cách đồng bộ và chính xác mà không làm vỡ bố cục đồ họa của sơ đồ.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Giống như khi bạn vẽ kỹ thuật, thay vì dùng bút kim nét mảnh 0.5mm vẽ nét bao quanh, bạn chuyển sang dùng bút vẽ kỹ thuật nét dày 1.0mm. Sự thay đổi nét vẽ này làm cho các hình khối chính của bản vẽ nổi bật lên hẳn và phân biệt rõ ràng với các chi tiết phụ xung quanh.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Vị trí code:**
  * Vòng tròn lớn ở giữa: Dòng 1317-1325 trong tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
  * Các nút bước nhỏ: Dòng 1345-1358 trong tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* **Trạng thái hiện tại:** Cả hai phần tử đều dùng viền 1px mặc định.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc (Root Cause):** Viền 1px quá mảnh làm giảm độ rõ ràng của sơ đồ hình tròn trên các màn hình có nền tối sâu.
* **Giả thuyết đối chứng (Counter-Hypothesis):** Nâng viền lên thành 2px sẽ làm cấu trúc sơ đồ nổi bật, mạnh mẽ và sang trọng hơn mà không làm giao diện bị thô.

---

# IV. Proposal (Đề xuất)
* Thêm thuộc tính `borderWidth: '2px'` vào trong block `style` inline của:
  * Vòng tròn lớn ở giữa (dòng 1323).
  * Các nút bước nhỏ (dòng 1355).

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)
  * Vai trò: Chứa component Render của layout Circular.
  * Thay đổi: Tăng `borderWidth` lên 2px cho vòng tròn lớn và các nút bước nhỏ.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
2. Thêm `borderWidth: '2px'` vào style inline của vòng tròn trung tâm.
3. Thêm `borderWidth: '2px'` vào style inline của nút bước công việc.
4. Lưu và chạy `bunx tsc --noEmit` để xác minh biên dịch thành công.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh:** Chạy `bunx tsc --noEmit` kiểm tra lỗi compile.
* **Kiểm tra trực quan (Visual check):** Người dùng xác nhận viền của vòng tròn lớn và các nút bước nhỏ đã dày dặn, sắc nét gấp đôi so với ban đầu.

---

# VIII. Todo
* [ ] Thêm `borderWidth: '2px'` cho vòng tròn lớn trung tâm trong [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* [ ] Thêm `borderWidth: '2px'` cho các nút bước nhỏ bao quanh trong [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* [ ] Kiểm tra lỗi biên dịch TypeScript (`bunx tsc --noEmit`).
* [ ] Phát âm thanh thông báo hoàn thành.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Viền vòng tròn lớn và viền các nút bước có độ dày hiển thị là 2px.
* Không phát sinh lỗi TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có rủi ro nào vì đây chỉ là thay đổi CSS style độ rộng viền.
* **Hoàn tác:** Sử dụng `git checkout` để rollback tệp.

---

# XI. Out of Scope (Ngoài phạm vi)
* Tăng kích thước font chữ hay thay đổi các thuộc tính bố cục định vị (positioning) của sơ đồ.
