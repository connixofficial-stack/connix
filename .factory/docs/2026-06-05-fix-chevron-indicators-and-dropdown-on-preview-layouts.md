# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Layout 3 (Allbirds) và Layout 4 (Dark Glass) ở trang Preview hiển thị thiếu menu con khi hover chuột, và Chevron (mũi tên chỉ xuống) của Layout 4 bị tĩnh (không tự động xoay 180 độ khi hover như các layout khác).
* **Giải pháp**:
  - Thêm tính năng hover cho các menu root của Layout 4 ở trang Preview (`HeaderMenuPreview.tsx`) để cập nhật trạng thái `hoveredItem`.
  - Cập nhật icon `ChevronDown` của Layout 4 ở trang Preview để có hiệu ứng xoay khi hover (`rotate-180`).
  - Thêm cấu trúc hiển thị menu dropdown (tương tự như Layout 3) cho Layout 4 ở trang Preview khi người dùng hover vào menu cấp 1 có chứa menu con.

## 2. Elaboration & Self-Explanation
Trong giao diện chỉnh sửa hệ thống (trang quản lý menu header), các layout Classic và Topbar có đầy đủ tính năng tương tác: khi hover vào một mục menu có các menu con, nó sẽ hiển thị một dropdown menu (dạng Mega hoặc Flyout tùy độ phức tạp) để quản trị viên có thể xem trước chính xác giao diện sẽ xuất hiện ngoài website.

Tuy nhiên, với hai layout mới là Allbirds và đặc biệt là Dark Glass:
* Layout Allbirds ở trang preview mặc dù đã có dropdown và chevron xoay, nhưng layout Dark Glass ở trang preview vẫn chỉ render một thẻ `a` đơn thuần mà không có bất kỳ bộ lắng nghe sự kiện chuột nào (`onMouseEnter`, `onMouseLeave`).
* Điều này dẫn đến việc khi quản trị viên hover chuột vào menu "Dark Glass" trên Preview, không có menu con nào được mở ra và mũi tên `ChevronDown` chỉ đứng im 100%, gây cảm giác tính năng bị lỗi hoặc chưa hoàn thiện.
* Chúng ta cần bổ sung wrapper `li` có `onMouseEnter` / `onMouseLeave` để cập nhật biến `hoveredItem` dùng chung, áp dụng class xoay `rotate-180` cho chevron, và render cụ thể các tầng dropdown menu con bên dưới.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  - Hiện tại, khi xem cấu trúc của `darkglass` ở `HeaderMenuPreview.tsx`:
    ```typescript
    // Hiện tại:
    <ChevronDown size={12} className="shrink-0" />
    ```
  - Sau khi sửa đổi:
    ```typescript
    // Thay đổi thành:
    <ChevronDown size={12} className={cn("transition-transform duration-200 shrink-0", hoveredItem === item._id && "rotate-180")} />
    ```
  - Đồng thời, bổ sung dropdown render ngay dưới thẻ `a` khi `hoveredItem === item._id`.
* **Phép ẩn dụ**: Giống như việc bạn đi mua một chiếc xe hơi có tính năng hiển thị gương tự động gập khi tắt máy. Ở phiên bản thực tế chạy ngoài đường thì gương gập bình thường, nhưng ở màn hình mô phỏng giới thiệu cho khách tại đại lý thì gương lại cứng ngắc không gập. Chúng ta cần nối lại dây điều khiển điện tử ở màn hình mô phỏng đó để khách hàng trải nghiệm đúng 100% tính năng của xe trước khi mua.

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra `Header.tsx` (giao diện site thực tế):
  - Cả Allbirds và Dark Glass đều đã được trang bị đầy đủ `ChevronDown` có rotate transition và hover dropdown menu.
* Đã kiểm tra `HeaderMenuPreview.tsx` (giao diện preview ở admin):
  - Layout Allbirds đã có `ChevronDown` xoay và dropdown menu preview.
  - Layout Dark Glass hoàn toàn bị thiếu logic hover, thiếu hiệu ứng xoay chevron và thiếu hoàn toàn dropdown menu con.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Root Cause (Nguyên nhân gốc)**:
  - Khi thiết kế layout `darkglass` trong trang Preview (`HeaderMenuPreview.tsx`), nhà phát triển chỉ render thẻ liên kết tĩnh (`a`) bên trong `renderDarkGlassNav()` mà quên không bọc logic `onMouseEnter`/`onMouseLeave` để lưu trạng thái hover, đồng thời bỏ sót việc render dropdown menu khi active.
* **Độ tin cậy nguyên nhân gốc**: High (100%). Đã xác minh qua mã nguồn thực tế tại [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx#L1643-L1676) hiển thị rõ cấu trúc menu tĩnh không có dropdown hay hover handler.

# IV. Proposal (Đề xuất)

* Chỉnh sửa hàm `renderDarkGlassNav()` bên trong `HeaderMenuPreview.tsx` để:
  1. Sử dụng sự kiện hover (`onMouseEnter`/`onMouseLeave`) của `li` bao ngoài để gọi `setHoveredItem(item._id)`.
  2. Áp dụng hiệu ứng xoay class `rotate-180` của Tailwind CSS cho icon `ChevronDown` của `darkglass` sử dụng `hoveredItem === item._id`.
  3. Render cấu trúc dropdown menu tương tự Allbirds bên trong `li` của `darkglass` khi `hoveredItem === item._id`, tuân thủ styling màu sắc của Dark Glass (nền tối bán trong suốt, text trắng, hover vàng).

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx)
  - Vai trò hiện tại: Trang preview hiển thị cấu trúc header menu trong trang quản lý.
  - Thay đổi: Cập nhật hàm `renderDarkGlassNav` để bổ sung hover state, dropdown container và xoay chevron.

# VI. Execution Preview (Xem trước thực thi)

1. Mở file [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx).
2. Tìm khối mã `renderDarkGlassNav` tại dòng 1643.
3. Thay thế thẻ `li` tĩnh hiện tại bằng thẻ `li` động có hook sự kiện chuột và menu dropdown con.
4. Lưu thay đổi và thực hiện chạy kiểm tra kiểu tĩnh.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy kiểm tra kiểu tĩnh của TypeScript:
  - `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

### Manual Verification
* Người dùng truy cập trang preview `/system/experiences/menu` trên trình duyệt:
  - Chọn layout **Dark Glass**.
  - Hover chuột vào các menu có menu con.
  - Xác nhận mũi tên Chevron chĩa xuống xoay ngược lên 180 độ một cách mượt mà.
  - Xác nhận dropdown menu xuất hiện với đúng style màu sắc tối (dark glass).

# VIII. Todo

- [ ] Sửa đổi hàm `renderDarkGlassNav` trong `HeaderMenuPreview.tsx`.
- [ ] Chạy kiểm tra TypeScript và lint.
- [ ] Commit thay đổi.
- [ ] Phát âm báo hoàn thành task `"Done, Sir."` qua loa hệ thống.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Pass**:
  - Khi xem trước menu với layout Dark Glass, các menu cấp 1 có con hiển thị icon `ChevronDown`.
  - Khi hover vào menu cấp 1 có con, `ChevronDown` xoay 180 độ và dropdown menu hiển thị bình thường.
  - Mã nguồn biên dịch thành công không có lỗi type.
* **Fail**:
  - Không có dropdown menu hiển thị khi hover hoặc Chevron bị đứng yên tĩnh.
  - Gây ra lỗi Typecheck khi build dự án.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Hầu như bằng không vì đây chỉ là code Preview ở admin dashboard và đã được verify logic tương tự bên ngoài site thực tế.
* **Hoàn tác**: Sử dụng `git checkout components/experiences/previews/HeaderMenuPreview.tsx` để khôi phục file cũ nếu phát sinh lỗi ngoài ý muốn.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc dữ liệu hoặc thay đổi giao diện thực tế của Header ngoài trang chính (vì trang chính đã hoạt động tốt).
