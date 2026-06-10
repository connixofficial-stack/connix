# Spec: Sửa lỗi nút đóng X và bổ sung 10 kiểu phối nền màu chính/phụ cho Popup

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề:** 
  1. Click vào nút đóng X trên popup nhưng popup không tắt (nút X bị trơ).
  2. Khách hàng muốn có thêm nhiều lựa chọn phối màu nền đa dạng, đẹp mắt sử dụng cả màu chính và màu phụ của thương hiệu để làm quảng cáo thêm phần phong phú.
* **Giải pháp:**
  1. Tăng chỉ số xếp lớp (z-index) của nút đóng X lên `z-50` để đảm bảo nó nằm trên cùng, không bị phần tử nội dung che khuất.
  2. Bổ sung thêm 10 kiểu phối nền mới (tổng cộng 12 kiểu) cho phép kết hợp linh hoạt màu chính, màu phụ, gradient chuyển tiếp, gradient tối huyền bí, kính mờ thời thượng (glassmorphism) và phong cách tối sang trọng (dark aesthetic).

### 2. Elaboration & Self-Explanation
* **Sửa lỗi nút X:** Nút X trong card quảng cáo trước đó được render trước khối nội dung và có cùng `z-10`. Do quy tắc xếp lớp HTML, khối nội dung render sau đã che khuất nút X, làm mất tác dụng click của nút này. Chúng ta tăng z-index của `CloseButton` lên `z-50` để đưa nó lên trên cùng của card, sẵn sàng nhận sự kiện click.
* **10 Kiểu phối màu nền mới:** 
  Chúng ta mở rộng trường cấu hình `backgroundMode` để hỗ trợ 12 kiểu nền:
  1. `solid`: Nền trắng mặc định.
  2. `brand`: Nền màu chính thương hiệu.
  3. `secondary-solid`: Nền màu phụ thương hiệu.
  4. `gradient-brand-to-secondary`: Gradient màu chính sang màu phụ.
  5. `gradient-secondary-to-brand`: Gradient màu phụ sang màu chính.
  6. `gradient-brand-dark`: Gradient màu chính sang đen huyền bí.
  7. `gradient-secondary-dark`: Gradient màu phụ sang đen huyền bí.
  8. `pattern-sunburst`: Màu chính kết hợp họa tiết quạt mặt trời.
  9. `pattern-sunburst-secondary`: Màu phụ kết hợp họa tiết quạt mặt trời.
  10. `pattern-sunburst-gradient`: Gradient chính-phụ kết hợp họa tiết quạt mặt trời.
  11. `glassmorphism`: Hiệu ứng kính mờ trong suốt thời thượng.
  12. `dark-aesthetic`: Nền tối sang trọng (Slate-900).

### 3. Concrete Examples & Analogies
* **Ví dụ:** Admin vào cấu hình Popup, chọn kiểu nền là **Gradient Màu chính → Màu phụ**. Trên trang chủ, popup sẽ hiển thị dải màu chuyển tiếp mượt mà từ đỏ đô sang vàng đồng thương hiệu, nút đóng X trắng trơn góc phải hoạt động bình thường khi click.
* **Đời thường:** 
  1. Việc sửa nút X giống như bạn dán một lớp decal trong suốt đè lên trên nút bấm chuông cửa. Khách ấn vào decal thì chuông không kêu. Giải pháp là khoét lỗ decal hoặc đưa nút chuông lên trên cùng tấm decal để khách bấm trúng.
  2. Việc thêm 10 kiểu nền giống như bạn mua thêm 10 bộ cánh thời trang khác nhau cho manocanh. Thay vì chỉ có váy trắng và váy đỏ, giờ đây manocanh có thêm váy gradient, váy dạ hội tối màu, váy ren mờ... giúp cửa hàng lúc nào cũng mới mẻ và thu hút.

## II. Audit Summary (Tóm tắt kiểm tra)
* **Lĩnh vực ảnh hưởng:** Sự kiện đóng Popup và các kiểu phối màu nền của style `centered-advertisement`.
* **Tình trạng:** Nút X bị che khuất không click được; thiếu các tùy chọn phối màu nền sử dụng màu chính/phụ.
* **File liên quan:**
  * `app/admin/home-components/popup/_types/index.ts`: Định nghĩa kiểu nền mới.
  * `app/admin/home-components/popup/_lib/constants.ts`: Chuẩn hóa cấu hình nền mới.
  * `app/admin/home-components/popup/_components/PopupForm.tsx`: Thêm 10 option chọn nền trong dropdown Admin.
  * `app/admin/home-components/popup/_components/PopupSectionShared.tsx`: Cập nhật z-index nút đóng, logic phối màu nền và vẽ sunburst tương ứng.

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc):**
  * Nút X có `z-10` bị thẻ div chứa text quảng cáo có `relative z-10` đè lên do thẻ div render sau.
  * Dropdown cấu hình nền `backgroundMode` hiện tại mới chỉ có 4 tùy chọn cơ bản, chưa khai thác hết sự kết hợp giữa màu chính và màu phụ thương hiệu.
* **Độ tin cậy nguyên nhân gốc:** High (100% chính xác).

## IV. Proposal (Đề xuất)
* Thay đổi `z-10` thành `z-50` trong class của `CloseButton` component.
* Cập nhật type `PopupBackgroundMode` trong `_types/index.ts`.
* Cập nhật hàm chuẩn hóa và danh sách options trong `constants.ts` và `PopupForm.tsx`.
* Cập nhật `getPopupBackgroundStyle` và `isDarkBackground` trong `PopupSectionShared.tsx` để xử lý 12 kiểu nền mới.

## V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa: [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_types/index.ts)
* **Thay đổi:** Cập nhật enum `PopupBackgroundMode` chứa 12 giá trị nền.

### Sửa: [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_lib/constants.ts)
* **Thay đổi:** Cập nhật hàm `normalizePopupBackgroundMode` để xác thực 12 kiểu nền mới.

### Sửa: [PopupForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupForm.tsx)
* **Thay đổi:** Thêm 10 option nền mới vào thẻ `<select>` cấu hình kiểu nền.

### Sửa: [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx)
* **Thay đổi:** Tăng z-index nút đóng lên `z-50`, cập nhật logic render 12 kiểu nền mới và điều kiện hiển thị họa tiết sunburst.

## VI. Execution Preview (Xem trước thực thi)
1. Thêm các option trong `index.ts`, `constants.ts` và `PopupForm.tsx`.
2. Sửa CSS `z-10` thành `z-50` trong `CloseButton` của `PopupSectionShared.tsx`.
3. Cập nhật `getPopupBackgroundStyle` để trả về background chính xác cho từng mode nền.
4. Chạy compiler kiểm tra TypeScript.

## VII. Verification Plan (Kế hoạch kiểm chứng)
### Manual Verification
* Mở trang chủ client, bấm nút X trên Popup và xác nhận popup đóng lập tức.
* Vào admin cấu hình thử các kiểu nền mới (Gradient, Glassmorphism, Dark Aesthetic...) và kiểm tra hiển thị trong Preview xem có hoạt động chính xác không.

## VIII. Todo
* [ ] Cập nhật file [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_types/index.ts).
* [ ] Cập nhật file [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_lib/constants.ts).
* [ ] Cập nhật file [PopupForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupForm.tsx).
* [ ] Cập nhật file [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx).
* [ ] Kiểm tra lỗi build tĩnh bằng `bunx tsc --noEmit`.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Nút X hoạt động bình thường khi click.
* 12 kiểu nền hiển thị chính xác màu phối và hoa văn sunburst tương ứng.
* TypeScript compile thành công.

## X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có.
* **Hoàn tác:** `git checkout` các file đã sửa.
