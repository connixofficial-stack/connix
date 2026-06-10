# Spec: Sửa vị trí và kích thước của Premium Advertisement Popup sát góc phải bên dưới

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề:** Popup quảng cáo kiểu mới (`centered-advertisement`) hiện tại đang hiển thị to bự và nằm ở chính giữa màn hình giống như các modal thông thường, chưa đúng với yêu cầu thực tế là một card quảng cáo nhỏ gọn nằm nép sát ở góc dưới bên phải màn hình.
* **Giải pháp:** Điều chỉnh lại vị trí hiển thị của popup này về góc dưới bên phải (bottom-right) và thu hẹp chiều rộng tối đa của nó xuống mức nhỏ gọn (320px) để tạo cảm giác thon thả, tinh tế như một widget quảng cáo góc phải.
* **Cách hoạt động:** Khi render style `centered-advertisement`, container overlay sẽ sử dụng class căn chỉnh `items-end justify-end` kèm theo lớp nền mờ mỏng nhẹ hơn, đồng thời card popup sẽ bị giới hạn chiều rộng ở mức `max-w-[320px]` và có khoảng cách hợp lý với mép màn hình.

### 2. Elaboration & Self-Explanation
Chúng ta cần thay đổi hai yếu tố cốt lõi của style `centered-advertisement`:
1. **Vị trí (Positioning):** Chuyển từ căn giữa màn hình (`items-center justify-center`) sang căn sát góc dưới bên phải (`items-end justify-end`). Để làm điều này, ta cập nhật biến `positionClass` trong `PopupOverlay` khi style là `centered-advertisement`. Đồng thời, giảm độ đậm của lớp overlay che phủ (`backgroundColor`) để phần giao diện trang web phía sau vẫn sáng rõ, làm nổi bật widget quảng cáo ở góc phải.
2. **Kích thước (Sizing):** Thay đổi class độ rộng tối đa của card trong `PopupCard` từ `max-w-md` (chiều rộng trung bình) thành `max-w-[320px]` (chiều rộng nhỏ gọn, thon đứng). Sự thay đổi này sẽ làm card thon gọn, vừa vặn trên cả mobile và desktop đúng như hình screenshot mô tả của khách hàng.

### 3. Concrete Examples & Analogies
* **Ví dụ:** Khi truy cập trang web rượu vang trên mobile, một card quảng cáo màu đỏ đô "Mua 4 tặng 2" nhỏ nhắn, bo góc tròn đẹp đẽ sẽ xuất hiện ở góc dưới bên phải màn hình, nằm đè lên một phần nội dung nhỏ nhưng không làm tối sầm toàn bộ trang web phía sau. Người dùng có thể dễ dàng đọc thông tin và ấn "XEM NGAY" hoặc nút "X" để tắt.
* **Đời thường:** Thay vì bạn treo một tấm bảng quảng cáo khổng lồ ngay chính giữa lối đi (Centered Modal), bạn đặt một standee quảng cáo nhỏ gọn, sang trọng ở góc lối đi bên phải (Bottom-right Widget). Khách hàng vẫn nhìn thấy thông điệp rõ ràng nhưng không bị chắn lối đi chính.

## II. Audit Summary (Tóm tắt kiểm tra)
* **Lĩnh vực ảnh hưởng:** Vị trí và kích thước hiển thị của style Popup `centered-advertisement`.
* **Tình trạng:** Hiện tại popup đang bị căn giữa và kích thước quá lớn.
* **File liên quan:**
  * `app/admin/home-components/popup/_components/PopupSectionShared.tsx`: Quản lý styles và CSS căn chỉnh.

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc):** Trong `PopupSectionShared.tsx`, biến `positionClass` chưa phân loại cho style `centered-advertisement`, dẫn tới nó mặc định rơi vào nhánh `items-center justify-center`. Đồng thời, độ rộng tối đa của card `PopupCard` đang để là `max-w-md` (quá rộng đối với card góc phải).
* **Độ tin cậy nguyên nhân gốc:** High (100% chính xác dựa trên cấu trúc CSS Tailwind của container và card).

## IV. Proposal (Đề xuất)
* **Bước 1:** Cập nhật `positionClass` trong `PopupOverlay`:
  ```typescript
  const positionClass = style === 'bottom-sheet'
    ? 'items-end justify-center'
    : style === 'side-panel'
      ? 'items-stretch justify-end'
      : style === 'centered-advertisement'
        ? 'items-end justify-end md:p-6 p-4'
        : 'items-center justify-center';
  ```
* **Bước 2:** Điều chỉnh nền mờ overlay nhẹ hơn khi dùng style này để tăng tính thẩm mỹ:
  ```typescript
  backgroundColor: style === 'centered-advertisement' ? 'rgba(2, 6, 23, 0.4)' : tokens.overlay,
  ```
* **Bước 3:** Cập nhật `PopupCard` khi `style === 'centered-advertisement'` để dùng `max-w-[320px]`.

## V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa: [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx)
* **Vai trò hiện tại:** Render giao diện Popup.
* **Thay đổi:** Cập nhật CSS định vị trí sát góc phải dưới và giới hạn chiều rộng card nhỏ gọn (320px).

## VI. Execution Preview (Xem trước thực thi)
1. Mở file `PopupSectionShared.tsx`.
2. Sửa `positionClass` và `backgroundColor` trong `PopupOverlay`.
3. Sửa `max-w-md` thành `max-w-[320px]` trong phần render `centered-advertisement` của `PopupCard`.

## VII. Verification Plan (Kế hoạch kiểm chứng)
### Manual Verification
* Mở giao diện website phía client.
* Xác nhận Popup "Premium Advertisement" hiển thị gọn gàng ở góc dưới bên phải màn hình, thon đứng đúng theo thiết kế widget góc phải.

## VIII. Todo
* [ ] Cập nhật file [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx).
* [ ] Kiểm tra lỗi build tĩnh bằng `bunx tsc --noEmit`.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Popup nằm sát góc dưới bên phải trên cả mobile và desktop.
* Chiều rộng tối đa của card là `320px`, các thành phần text, ảnh, nút co giãn vừa vặn, cân đối.
* Không có lỗi TypeScript.

## X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có.
* **Hoàn tác:** `git checkout app/admin/home-components/popup/_components/PopupSectionShared.tsx`.

## XI. Out of Scope (Ngoài phạm vi)
* Các style popup khác ngoài `centered-advertisement` không thay đổi vị trí.
