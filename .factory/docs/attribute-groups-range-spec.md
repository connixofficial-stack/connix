# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề:** 
  1. Người dùng muốn bộ lọc có khả năng lọc theo khoảng/dải giá trị số (ví dụ: Dung tích chai rượu từ 10ml đến 1000ml), điều này hiện chưa có trong tuỳ chọn "Kiểu lọc".
  2. Kiểu hiển thị "Màu sắc" (Color) không còn cần thiết cho nhóm thuộc tính nữa và cần được loại bỏ để tránh gây loãng giao diện.
* **Giải pháp:**
  1. Cập nhật các select dropdown trong form `create` và `edit` để:
     - Thêm tuỳ chọn "Khoảng giá trị (Range)" vào "Kiểu lọc".
     - Loại bỏ tuỳ chọn "Màu sắc (Color/Hình ảnh)" khỏi "Kiểu hiển thị".
  2. Bổ sung giao diện giả lập Range Slider động, cực kỳ đẹp mắt vào Live Preview (`AttributeGroupPreview.tsx`). Khi admin chọn kiểu lọc là `range`, preview sẽ lập tức hiển thị một thanh kéo trượt dải số từ 10ml đến 1000ml cho phép kéo trượt trực quan.

## 2. Elaboration & Self-Explanation
* **Bỏ Màu sắc:** Ta chỉ cần xoá thẻ `<option value="color">` khỏi danh sách "Kiểu hiển thị" ở cả hai trang tạo mới và chỉnh sửa.
* **Thêm Range:**
  - Ta thêm `<option value="range">Khoảng giá trị (Range)</option>` vào phần "Kiểu lọc".
  - Trong `AttributeGroupPreview.tsx`, ta xây dựng một dải lọc giả lập thông minh: Nếu `filterType === 'range'`, hệ thống Live Preview sẽ hiển thị một thanh trượt (Dual Range Slider) mô phỏng tuyệt đẹp.
  - Chúng ta sẽ dùng thẻ `<input type="range">` hoặc giả lập bằng CSS để admin có thể kéo trượt và nhìn thấy con số dung tích (ví dụ: `75ml - 750ml`) cập nhật tức thời theo tay kéo.

## 3. Concrete Examples & Analogies
* **Ví dụ:** 
  * Khi admin chọn Kiểu lọc là **Khoảng giá trị (Range)**: Box xem trước Live Preview lập tức chuyển sang hiển thị tiêu đề "Dung tích chai rượu" kèm theo một thanh kéo trượt nằm ngang. Có hai đầu kéo đại diện cho mức Min (ví dụ: 10ml) và Max (ví dụ: 1000ml). Khi admin kéo thử, con số hiển thị bên trên sẽ nhảy động theo (ví dụ: `Dung tích chọn: 150ml - 750ml`).
  * Điều này tương tự như việc bạn mua sắm trên các trang thương mại điện tử lớn (như Amazon hoặc Tiki), khi bạn muốn tìm sản phẩm trong tầm giá từ 100k đến 500k, bạn sẽ dùng ngón tay kéo thanh trượt giá thay vì phải tích chọn từng ô giá trị nhỏ lẻ.

---

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng tôi đã rà soát và xác định các khu vực cần sửa đổi:
1. `app/admin/attribute-groups/create/page.tsx`:
   - Xoá `<option value="color">` trong phần Kiểu hiển thị.
   - Thêm `<option value="range">` trong phần Kiểu lọc.
2. `app/admin/attribute-groups/[id]/edit/page.tsx`:
   - Thực hiện hai thay đổi tương tự trang Create.
3. `app/admin/attribute-groups/_components/AttributeGroupPreview.tsx`:
   - Loại bỏ hoàn toàn UI và logic xử lý kiểu hiển thị `color`.
   - Bổ sung UI giả lập thanh kéo Slider cho kiểu lọc `range`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc:** Cấu hình thuộc tính ban đầu thiếu khả năng hỗ trợ lọc khoảng số (dải số liên tục) và chứa kiểu chọn màu sắc dư thừa cho nhóm thuộc tính.
* **Độ tin cậy nguyên nhân gốc:** **High** (Xác nhận qua yêu cầu trực tiếp của người dùng về việc lọc dung tích rượu từ 10ml - 100ml).
* **Giả thuyết đối chứng:** Việc tích hợp thanh trượt kéo trượt trực quan ngay trong live preview sẽ giúp admin hiểu lập tức cơ chế hoạt động của kiểu lọc `range` mà không cần tài liệu giải thích phức tạp.

---

# IV. Proposal (Đề xuất)
1. **Frontend Form (Create & Edit):**
   * Cập nhật select element của `filterType`:
     ```html
     <option value="single">Một lựa chọn (Single)</option>
     <option value="multiple">Nhiều lựa chọn (Multiple)</option>
     <option value="range">Khoảng giá trị (Range)</option>
     ```
   * Xoá option `color` khỏi select element của `inputType`.
2. **Component Preview (`AttributeGroupPreview.tsx`):**
   * Xoá logic `mockOptions.color` và phần render màu sắc.
   * Thêm state nội bộ để lưu trữ khoảng giá trị trượt (ví dụ: `rangeValue = [100, 750]`).
   * Khi `filterType === 'range'`, hiển thị một giao diện Slider cao cấp:
     - Dùng thanh kéo slider giả lập (có text hiển thị Min/Max động).
     - Cho phép admin tương tác kéo thanh trượt để thay đổi giá trị.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [app/admin/attribute-groups/create/page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/create/page.tsx)
* **Thay đổi:** Cập nhật các select options cho Kiểu lọc (thêm range) và Kiểu hiển thị (bỏ màu sắc).

### Sửa: [app/admin/attribute-groups/[id]/edit/page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/[id]/edit/page.tsx)
* **Thay đổi:** Cập nhật các select options tương tự trang Create.

### Sửa: [app/admin/attribute-groups/_components/AttributeGroupPreview.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/_components/AttributeGroupPreview.tsx)
* **Thay đổi:** Xoá giao diện chọn màu sắc, bổ sung giao diện Slider trượt cho bộ lọc dải số `range`.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Cập nhật Preview:** Bổ sung Slider trượt mượt mà vào `AttributeGroupPreview.tsx` và dọn dẹp phần hiển thị màu sắc cũ.
2. **Cập nhật Form Create & Edit:** Cập nhật các dropdown chọn kiểu lọc và kiểu hiển thị.
3. **TypeScript Validation:** Chạy `bunx tsc --noEmit`.
4. **Thông báo:** Kích hoạt âm báo hoàn thành `Done, Sir.`

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **TypeScript Check:** `bunx tsc --noEmit` phải vượt qua thành công sạch lỗi ở các file thay đổi.
* **Kiểm tra trực quan:**
  1. Truy cập trang chỉnh sửa nhóm thuộc tính.
  2. Dropdown Kiểu hiển thị không còn dòng "Màu sắc".
  3. Dropdown Kiểu lọc có thêm dòng "Khoảng giá trị (Range)".
  4. Chọn Kiểu lọc "Khoảng giá trị (Range)": Preview lập tức biến đổi sang giao diện thanh kéo Slider. Kéo thử thanh trượt để kiểm tra con số dung tích cập nhật động.

---

# VIII. Todo
- [ ] Cập nhật `AttributeGroupPreview.tsx` (xoá color, thêm giao diện range slider).
- [ ] Chỉnh sửa select options trong `app/admin/attribute-groups/create/page.tsx`.
- [ ] Chỉnh sửa select options trong `app/admin/attribute-groups/[id]/edit/page.tsx`.
- [ ] Chạy `bunx tsc --noEmit` kiểm tra TypeScript.
- [ ] Phát âm báo hoàn thành tác vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Form Create & Edit phản ánh đúng các tuỳ chọn Kiểu lọc (có range) và Kiểu hiển thị (không có color).
* Live Preview hiển thị thanh kéo Slider hoạt động trơn tru khi chọn kiểu lọc `range`.
* Build TypeScript sạch lỗi.
