# Spec: Sửa lỗi click nút Popup không tắt (nút nhảy link #)

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề:** Khi người dùng click vào nút chính hoặc nút phụ của popup (ví dụ: nút "Tôi đủ 18 tuổi" có link là `#`), popup không tự đóng lại mà trang web chỉ đứng yên.
* **Nguyên nhân:** Hệ thống chuẩn hóa tất cả các link trống thành `#`. Khi render ở giao diện, bất kỳ nút nào có link khác rỗng (bao gồm cả `#`) đều bị ép render thành thẻ liên kết `<a>` hướng tới link đó mà không hề có sự kiện đóng popup. Nút bấm thực tế chỉ đóng được khi link hoàn toàn trống, nhưng cơ chế chuẩn hóa đã chặn trường hợp này.
* **Giải pháp:** Nếu link của nút là `#` hoặc trống, hệ thống sẽ render nút đó dưới dạng thẻ `<button>` thông thường kèm theo sự kiện click để đóng popup (`onClose`).

### 2. Elaboration & Self-Explanation
Trong component hiển thị nút bấm của popup (`PopupActions`), logic kiểm tra xem nút bấm có chứa liên kết hay không dựa vào điều kiện `config.primaryButtonLink.trim().length > 0`. 
Tuy nhiên, hàm chuẩn hóa dữ liệu `normalizePopupLink` luôn tự động chuyển các chuỗi liên kết trống thành ký tự `#`. Do đó, điều kiện trên luôn luôn đúng, dẫn đến việc các nút bấm luôn được hiển thị dưới dạng thẻ liên kết `<a>` với `href="#"` mà không có trình xử lý sự kiện `onClick` để gọi hàm đóng popup `onClose()`.
Chúng ta sẽ thay đổi điều kiện xác định nút liên kết: chỉ coi nút bấm là một liên kết thực sự chuyển trang khi đường dẫn của nó khác rỗng và khác ký tự `#`. Nếu là ký tự `#` hoặc rỗng, ta sẽ hiển thị nó dưới dạng thẻ `<button>` thực hiện hành động đóng popup.

### 3. Concrete Examples & Analogies
* **Ví dụ:** Nút "Tôi đủ 18 tuổi" cấu hình link là `#`. Khi chưa sửa, trình duyệt render `<a href="#">Tôi đủ 18 tuổi</a>`. Click vào chỉ làm màn hình cuộn lên đầu trang chứ không đóng popup. Sau khi sửa, trình duyệt render `<button onClick={onClose}>Tôi đủ 18 tuổi</button>`, click vào sẽ đóng popup ngay lập tức.
* **Đời thường:** Giống như một chiếc công tắc trên tường. Bình thường ấn công tắc thì đèn tắt (đóng popup). Nhưng người ta lại dán một tờ giấy hướng dẫn ghi "Xem thêm tại đây" lên trên công tắc. Khi bạn ấn vào, bạn chỉ chạm vào tờ giấy quảng cáo (link `#`) chứ không bấm trúng nút công tắc thực tế phía dưới. Giải pháp là bóc tờ giấy đó đi khi nó không có nội dung thực tế để bạn bấm trực tiếp vào công tắc.

## II. Audit Summary (Tóm tắt kiểm tra)
* **Lĩnh vực ảnh hưởng:** Hành vi click nút trên Popup ở client.
* **Tình trạng:** Nút bấm chính/phụ có link `#` không thể đóng popup khi được click.
* **File liên quan:**
  * `app/admin/home-components/popup/_components/PopupSectionShared.tsx`: Chứa component `PopupActions` quản lý các nút bấm và hành vi click.

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc):** Trong `PopupSectionShared.tsx`, hai biến kiểm tra:
  ```tsx
  const hasPrimaryLink = config.primaryButtonLink.trim().length > 0;
  const hasSecondaryLink = config.secondaryButtonLink.trim().length > 0;
  ```
  luôn nhận giá trị `true` do hàm chuẩn hóa dữ liệu ở backend/frontend ép các link trống thành `#`. Điều này khiến cấu trúc JSX luôn chọn render thẻ `<a>` thay vì thẻ `<button onClick={onClose}>`.
* **Độ tin cậy nguyên nhân gốc:** High (100% chính xác dựa trên phân tích logic nhánh rẽ của thẻ JSX).

## IV. Proposal (Đề xuất)
* Thay đổi định nghĩa `hasPrimaryLink` và `hasSecondaryLink` trong component `PopupActions`:
  ```tsx
  const hasPrimaryLink = config.primaryButtonLink.trim().length > 0 && config.primaryButtonLink !== '#';
  const hasSecondaryLink = config.secondaryButtonLink.trim().length > 0 && config.secondaryButtonLink !== '#';
  ```
  Điều này đảm bảo nếu liên kết được cấu hình là `#` thì nút bấm sẽ hoạt động như một nút đóng popup thông thường.

## V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa: [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx)
* **Vai trò hiện tại:** Quản lý cấu trúc giao diện và hành vi chạy thực tế của Popup ở cả trang quản trị (preview) và ngoài client.
* **Thay đổi:** Cập nhật điều kiện lọc link của nút bấm trong component `PopupActions` để nhận biết link `#` là nút đóng popup.

## VI. Execution Preview (Xem trước thực thi)
1. Xác định vị trí component `PopupActions` trong file `PopupSectionShared.tsx`.
2. Thay đổi định nghĩa `hasPrimaryLink` và `hasSecondaryLink` để loại trừ trường hợp bằng `#`.

## VII. Verification Plan (Kế hoạch kiểm chứng)
### Manual Verification
* Truy cập trang chủ client hoặc trang preview popup trong admin.
* Cấu hình link nút chính là `#`.
* Click vào nút chính, xác nhận popup đóng lại bình thường.

## VIII. Todo
* [ ] Sửa file [PopupSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/popup/_components/PopupSectionShared.tsx) theo đề xuất.
* [ ] Kiểm tra build tĩnh TypeScript bằng `bunx tsc --noEmit`.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Click nút chính/phụ có liên kết là `#` sẽ đóng popup ngay lập tức.
* Các liên kết thực sự chuyển trang (ví dụ: `/products`, `https://google.com`) vẫn chuyển hướng bình thường khi được click.
* Build TypeScript thành công.

## X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Thấp, không ảnh hưởng đến các thành phần khác.
* **Hoàn tác:** `git checkout` khôi phục file `PopupSectionShared.tsx`.

## XI. Out of Scope (Ngoài phạm vi)
* Thay đổi schema database của Popup.
