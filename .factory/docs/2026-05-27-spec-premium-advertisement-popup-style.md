# Spec: Triển khai style Popup mới 'Premium Advertisement'

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề:** Khách hàng muốn hiển thị một popup quảng cáo chuyên nghiệp cho sản phẩm rượu vang: có màu nền thương hiệu đỏ đô, họa tiết tia sáng mờ hướng từ tâm, tiêu đề chính ở trên, ảnh sản phẩm bo góc ở giữa, và nút CTA màu vàng cam nổi bật dưới cùng. Các style cũ chỉ có nền trắng và bố cục thông thường không đáp ứng được.
* **Giải pháp:** Tạo ra một style Popup mới mang tên `centered-advertisement` (Premium Advertisement). Đồng thời, cung cấp thêm tuỳ chọn đổi màu nền và vẽ họa tiết tia sáng xoay nhẹ (radial-beam pattern) để làm popup nổi bật hơn.
* **Cách hoạt động:** Admin có thể chọn style mới này trong danh sách preview. Khi chọn, hệ thống tự động đổi bố cục hiển thị và nếu đổi kiểu nền thành màu thương hiệu/gradient/pattern, chữ tự động chuyển sang màu trắng tương phản và nút chính đổi sang màu vàng hổ phách nổi bật.

### 2. Elaboration & Self-Explanation
Chúng ta sẽ bổ sung style mới mang tên `centered-advertisement` vào danh sách `PopupStyle` hiện có. Bố cục của style này khác với các style cũ (vốn chỉ đặt icon lên đầu rồi đến chữ và nút):
1. Phần tiêu đề và phụ đề (eyebrow, heading, description) được đưa lên trên cùng.
2. Ảnh quảng cáo/sản phẩm (`imageUrl`) nằm ở giữa và được bo góc mềm mại.
3. Nút bấm chính/phụ xếp chồng dọc nằm ở dưới cùng.

Đồng thời, ta giới thiệu trường cấu hình `backgroundMode` cho phép popup đổi từ nền trắng (`solid`) sang nền màu thương hiệu (`brand`), màu gradient thương hiệu (`gradient`), hoặc nền thương hiệu kèm họa tiết tia sáng xoay (`pattern`). Khi phát hiện nền tối, hệ thống tự động điều chỉnh màu sắc chữ sang màu tương phản cao (màu sáng) và màu nút bấm chính sang màu vàng hổ phách (`#f59e0b`) có chữ đen để nổi bật trên nền đỏ đô hoặc các màu thương hiệu tối khác.

### 3. Concrete Examples & Analogies
* **Ví dụ:** Admin tạo popup "Mua 4 tặng 2", chọn style "Premium Advertisement" và nền "Màu thương hiệu + Hoa văn". Ở ngoài trang chủ, popup hiện ra dạng một hộp thoại đỏ đô sang trọng, có các tia sáng mờ xoay chậm làm nền, ảnh chai rượu vang sắc nét ở giữa, và nút "XEM NGAY" màu vàng cam chói sáng thu hút người dùng click vào.
* **Đời thường:** Giống như một chiếc tủ kính trưng bày sản phẩm sang trọng trong cửa hàng rượu. Thay vì đặt chai rượu trên một cái kệ gỗ trắng đơn điệu (nền trắng modal cũ), bạn sơn màu đỏ nhung cho tủ, lắp đèn rọi chiếu tia sáng xung quanh chai rượu (radial beam) và dán một tấm biển chỉ dẫn màu vàng neon nổi bật (nút CTA vàng) để bất cứ ai đi ngang qua cũng phải dừng lại ngắm nhìn.

## II. Audit Summary (Tóm tắt kiểm tra)
* **Lĩnh vực ảnh hưởng:** Hệ thống Popup (Admin Form, Live Preview và Frontend client).
* **Tình trạng:** Thiếu style quảng cáo xếp chồng dọc sang trọng và tính năng đổi màu nền/thêm pattern.
* **File liên quan:**
  * `app/admin/home-components/popup/_types/index.ts`: Khai báo kiểu dữ liệu.
  * `app/admin/home-components/popup/_lib/constants.ts`: Định nghĩa danh sách style và normalize config.
  * `app/admin/home-components/popup/_components/PopupForm.tsx`: Giao diện Admin cấu hình Popup.
  * `app/admin/home-components/popup/_components/PopupSectionShared.tsx`: Render thực tế giao diện Popup.

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Yêu cầu phát triển:** Cần bổ sung tính năng mới mà không làm vỡ các popup cũ đang hoạt động.
* **Giải pháp cô lập:** Các popup cũ vẫn có `style` cũ và mặc định `backgroundMode` là `'solid'`, nên chúng sẽ hiển thị hoàn toàn bình thường không thay đổi. Chỉ khi admin chọn style mới hoặc đổi kiểu nền mới thì giao diện mới áp dụng.

## IV. Proposal (Đề xuất)
* Khai báo kiểu dữ liệu và hằng số mới.
* Thêm dropdown chọn kiểu nền trong `PopupForm.tsx`.
* Vẽ SVG họa tiết tia sáng mờ xoay nhẹ (`RadialBeamPattern`) trong `PopupSectionShared.tsx`.
* Cập nhật các component con `PopupText`, `PopupActions` để đảo màu tương thích nền tối.
* Viết cấu trúc render cho style `centered-advertisement`.

## V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa: [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_types/index.ts)
* **Vai trò hiện tại:** Định nghĩa các kiểu dữ liệu TypeScript cho Popup component.
* **Thay đổi:** Thêm `'centered-advertisement'` vào `PopupStyle` và định nghĩa type `PopupBackgroundMode`.

### Sửa: [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_lib/constants.ts)
* **Vai trò hiện tại:** Chứa giá trị mặc định và các hàm chuẩn hóa (normalize) config của Popup.
* **Thay đổi:** Thêm `'centered-advertisement'` vào `POPUP_STYLES` và cập nhật hàm normalize để xử lý `backgroundMode`.

### Sửa: [PopupForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupForm.tsx)
* **Vai trò hiện tại:** Form cấu hình các trường dữ liệu của Popup trong Admin.
* **Thay đổi:** Thêm select dropdown cho phép admin chọn kiểu nền của Popup.

### Sửa: [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx)
* **Vai trò hiện tại:** Chứa logic render thực tế và preview giao diện Popup.
* **Thay đổi:** Viết code hiển thị style mới `centered-advertisement`, hiệu ứng SVG tia sáng mờ xoay tròn, và logic đổi màu text/nút bấm khi nền tối.

## VI. Execution Preview (Xem trước thực thi)
1. Thêm kiểu dữ liệu trong `_types/index.ts`.
2. Khai báo style mới và normalize trong `_lib/constants.ts`.
3. Bổ sung select field Kiểu nền trong `PopupForm.tsx`.
4. Viết code SVG tia sáng và logic rẽ nhánh render mới trong `PopupSectionShared.tsx`.
5. Đảm bảo compiler TypeScript không báo lỗi.

## VII. Verification Plan (Kế hoạch kiểm chứng)
### Manual Verification
* Mở trang edit popup của home component trong admin.
* Chọn style mới "Premium Advertisement".
* Đổi nền thành "Màu thương hiệu + Hoa văn tia sáng" và xác nhận giao diện đổi sang màu đỏ đô kèm tia sáng mờ xoay, nút bấm chuyển thành màu vàng hổ phách nổi bật.

## VIII. Todo
* [ ] Cập nhật file `app/admin/home-components/popup/_types/index.ts`.
* [ ] Cập nhật file `app/admin/home-components/popup/_lib/constants.ts`.
* [ ] Cập nhật file `app/admin/home-components/popup/_components/PopupForm.tsx`.
* [ ] Cập nhật file `app/admin/home-components/popup/_components/PopupSectionShared.tsx`.
* [ ] Chạy `bunx tsc --noEmit` để kiểm chứng kiểu.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Popup hiển thị đúng style Premium Advertisement: Text ở trên, Ảnh ở giữa, Nút ở dưới.
* Họa tiết tia sáng xoay nhẹ mượt mà khi chọn kiểu nền `pattern`.
* Màu sắc tương phản tốt, không bị trùng màu nút chính với màu nền thương hiệu.
* TypeScript compile thành công.

## X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có rủi ro lớn vì các style cũ vẫn giữ nguyên.
* **Hoàn tác:** `git checkout` các file đã sửa đổi.

## XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic popup ở các trang khác ngoài trang chủ (trừ phi chúng dùng chung component `PopupSectionShared`).
