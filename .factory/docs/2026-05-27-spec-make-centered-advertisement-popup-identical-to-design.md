# Spec: Chuẩn hóa Premium Advertisement Popup giống hệt thiết kế mẫu

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề:** Giao diện popup "Premium Advertisement" mới tạo nhìn vẫn chưa giống hình mẫu thực tế của khách hàng (ảnh bị vuông, nút đóng X có nền tròn viền đỏ trông "lỏ", họa tiết tia sáng nét đứt xoay không giống các mảng quạt màu đỏ đô).
* **Giải pháp:** Cải tiến toàn diện các chi tiết giao diện của style `centered-advertisement`:
  * Đổi ảnh sản phẩm từ hình chữ nhật bo góc thành hình bầu dục (oval) đứng có viền mờ sang trọng.
  * Thay họa tiết tia sáng mảnh bằng họa tiết mảng hình quạt mặt trời (Sunburst Pattern) tỏa ra từ tâm.
  * Bỏ nền tròn và viền đỏ của nút đóng "X", chuyển thành icon X trắng trơn tinh tế.
  * Hỗ trợ xuống dòng và tự động đổi chữ bọc trong dấu `*` thành màu vàng gạch chân (ví dụ: `*CÓ HẠN*`).

### 2. Elaboration & Self-Explanation
Để đạt được thiết kế chuẩn xác như ảnh chụp thực tế từ điện thoại của khách hàng, chúng ta cần tinh chỉnh sâu hơn về mặt CSS và cấu trúc JSX:
1. **Ảnh Oval:** Ta áp dụng `rounded-full aspect-[3/4] w-[190px] object-cover` để biến ảnh sản phẩm thành hình bầu dục đứng hoàn hảo, bổ sung viền trắng mờ `border-2 border-white/10` để ảnh nổi bật trên nền đỏ.
2. **Họa tiết Sunburst:** Thay vì các đường line mảnh xoay tròn, ta dùng SVG vẽ 12 mảng hình quạt tam giác tỏa ra từ tâm card với opacity thấp để tạo họa tiết nền chìm sâu lắng.
3. **Nút đóng tối giản:** Khi card có nền tối, nút đóng X sẽ ẩn hoàn toàn border và background, chỉ hiển thị icon X màu trắng mảnh nằm gọn ở góc phải.
4. **Định dạng mô tả:** Thêm thuộc tính CSS `whitespace-pre-wrap` để nhận diện ký tự xuống dòng `\n`. Viết một hàm parse đơn giản để nhận diện chữ nằm trong dấu `*` (ví dụ: `*CÓ HẠN*`) và render nó thành thẻ `<span>` có màu vàng hổ phách và gạch chân.

### 3. Concrete Examples & Analogies
* **Ví dụ:** Admin điền mô tả là `Thời gian - Sản phẩm\n*CÓ HẠN*`. Khi hiển thị, popup sẽ xuống dòng đúng chỗ và chữ "CÓ HẠN" sẽ có màu vàng gạch chân. Ảnh chai rượu vang sẽ tự động biến thành hình bầu dục đứng có viền mỏng mờ tinh tế.
* **Đời thường:** Giống như bạn đang trang trí lại một khung tranh. Thay vì đóng một cái khung gỗ dày cộp màu trắng với cái móc treo màu đỏ lòe loẹt, bạn đổi sang dùng khung kính không viền tối giản (nút X trơn), cắt bức ảnh thành hình bầu dục nghệ thuật (ảnh oval) và lót một tấm giấy nền có hoa văn tia nắng sang trọng (sunburst). Khung tranh lập tức trở nên vô cùng cao cấp.

## II. Audit Summary (Tóm tắt kiểm tra)
* **Lĩnh vực ảnh hưởng:** Giao diện chi tiết của style Popup `centered-advertisement`.
* **Tình trạng:** Các chi tiết thiết kế chưa tương thích hoàn toàn với hình ảnh mẫu.
* **File liên quan:**
  * `app/admin/home-components/popup/_components/PopupSectionShared.tsx`: Quản lý hiển thị chính của Popup.

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc):**
  * Họa tiết tia sáng cũ (`RadialBeamPattern`) dùng các đường thẳng nét đứt xoay, khác với các mảng quạt mặt trời (Sunburst) tĩnh.
  * Ảnh sản phẩm đang dùng `rounded-2xl` của hình chữ nhật thay vì `rounded-full` của hình oval.
  * Nút đóng `CloseButton` chưa có nhánh xử lý riêng cho nền tối nên vẫn dùng style mặc định có viền và nền trắng đục.
  * Chưa có logic phân tích định dạng văn bản (parse text) cho mô tả.
* **Độ tin cậy nguyên nhân gốc:** High (100% chính xác dựa trên so sánh trực quan từng chi tiết trong screenshot).

## IV. Proposal (Đề xuất)
* **Định nghĩa `SunburstPattern`** thay thế cho `RadialBeamPattern`.
* **Sửa `CloseButton`** ẩn nền/viền và hiển thị icon X màu trắng khi `isDarkBg = true`.
* **Thêm hàm `parseDescription`** nhận diện `*text*` để đổi màu vàng và gạch chân.
* **Cập nhật JSX của style `centered-advertisement`** trong `PopupCard` để dùng ảnh bầu dục (`rounded-full aspect-[3/4]`), áp dụng `whitespace-pre-wrap` và hàm parse mô tả.

## V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa: [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx)
* **Vai trò hiện tại:** Chịu trách nhiệm render Popup.
* **Thay đổi:** Cải tiến thiết kế của style Premium Advertisement (ảnh oval, họa tiết sunburst, nút X trơn trắng, text highlight màu vàng gạch chân).

## VI. Execution Preview (Xem trước thực thi)
1. Thay `RadialBeamPattern` bằng `SunburstPattern` dùng SVG vẽ mảng quạt tỏa ra từ tâm.
2. Thêm hàm `parseDescription` xử lý regex `*text*`.
3. Cập nhật component `CloseButton` nhận `isDarkBg`.
4. Sửa JSX render trong `PopupCard` cho style `centered-advertisement`.

## VII. Verification Plan (Kế hoạch kiểm chứng)
### Manual Verification
* Mở trang chủ client, xác nhận popup "Mua 4 tặng 2" hiển thị giống hệt screenshot: ảnh hình oval có viền mỏng, nền đỏ đô có quạt mặt trời tỏa ra từ tâm, nút đóng X trắng trơn và chữ "CÓ HẠN" màu vàng gạch chân.

## VIII. Todo
* [ ] Cập nhật file [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx).
* [ ] Kiểm tra lỗi build tĩnh bằng `bunx tsc --noEmit`.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Ảnh sản phẩm hiển thị dạng bầu dục đứng, có viền mờ nhẹ.
* Nền card chứa họa tiết mảng hình quạt tỏa ra từ tâm.
* Nút đóng X màu trắng tinh tế, không có vòng tròn nền hay viền.
* Mô tả hỗ trợ xuống dòng và highlight chữ vàng gạch chân khi bọc trong dấu `*`.
* TypeScript build pass.

## X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có.
* **Hoàn tác:** `git checkout app/admin/home-components/popup/_components/PopupSectionShared.tsx`.
