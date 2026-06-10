# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Hiện tại cấu hình Dark Mode ở trang Header Menu (`/system/experiences/menu`) chỉ cho phép ẩn/hiện nút Dark Mode (`showDarkModeToggle`), trong khi cấu hình chế độ tối mặc định cho cả web (`site_dark_mode`) lại nằm khuất ở tab "Chế độ tối" trong trang `/system/experiences`. Điều này gây bất tiện và rời rạc trong trải nghiệm quản trị.
* **Giải pháp**: Tích hợp tuỳ chọn cấu hình chế độ mặc định cả web (Sáng / Tối / Theo hệ thống) ngay dưới tuỳ chọn "Nút Dark Mode ở site thực" tại trang Header Menu. Đồng thời đồng bộ việc lưu trữ cài đặt này vào Convex DB settings.

## 2. Elaboration & Self-Explanation
* Trang quản trị Header Menu `/system/experiences/menu` đóng vai trò là nơi thiết lập các thành phần hiển thị trên Header (như logo, menu, search, cart, và nút bật/tắt chế độ tối ở site thực).
* Tuy nhiên, chế độ giao diện mặc định của toàn trang (Sáng, Tối, hoặc System) quyết định trạng thái hiển thị ban đầu khi người dùng truy cập. Việc tách biệt hai cấu hình này sang hai nơi khác nhau khiến người dùng bối rối khi tìm kiếm cách thiết lập theme mặc định.
* Giải pháp là:
  1. Trong trang quản trị `/system/experiences/menu`: Truy vấn thêm key cài đặt `site_dark_mode` từ Convex DB.
  2. Hiển thị một điều khiển dạng Select Box (`SelectRow`) dưới toggle "Nút Dark Mode ở site thực" để cho phép chọn nhanh giao diện mặc định (Sáng / Tối / Hệ thống).
  3. Khi bấm Lưu, cập nhật song song cấu hình Header (`header_config`) và cấu hình Giao diện mặc định (`site_dark_mode`) qua `setMultipleSettings` của Convex.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Khi quản trị viên đang ở trang Header Menu, họ bật "Nút Dark Mode ở site thực" và đồng thời muốn cài đặt trang web mặc định hiển thị "Chế độ tối" cho người dùng mới. Họ có thể chọn ngay "Chế độ tối (Dark)" từ select box bên dưới và lưu lại. Client (site thực) khi tải trang sẽ tự động áp dụng class `dark` làm theme mặc định nhưng vẫn hiển thị nút để khách truy cập có thể tự do chuyển sang chế độ sáng nếu muốn.
* **Hình ảnh đời thường**: Việc này giống như một bảng điều khiển ánh sáng cho hội trường. Thay vì bạn phải ra cửa chính để bật/tắt công tắc nguồn (chọn chế độ mặc định), rồi đi vào phòng kỹ thuật để bật/tắt nút điều khiển từ xa (ẩn/hiện nút toggle theme), nay chúng tôi đưa cả hai công tắc này đặt cạnh nhau trên một bảng điều khiển tập trung để bạn dễ dàng quản lý.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Giao diện cấu hình Header Menu**: [app/system/experiences/menu/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/menu/page.tsx)
  - Hiện tại chỉ query `header_style`, `header_config` cùng các cài đặt liên quan khác, hiển thị toggle `showDarkModeToggle`.
  - Chưa query và mutate key `site_dark_mode`.
* **Cài đặt theme mặc định của website**: [lib/get-settings.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/get-settings.ts)
  - Key `site_dark_mode` đã được khai báo và normalize đầy đủ, nhận các giá trị `'light' | 'dark' | 'system'`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Thiết kế ban đầu đặt cấu hình `site_dark_mode` trong tab độc lập ở trang Experiences tổng, trong khi trang thiết lập Header Menu lại chỉ chứa toggle hiển thị nút chuyển đổi. Hai cấu hình này có sự liên quan logic cao nhưng giao diện quản trị chưa tích hợp chúng cùng một chỗ.
* **Giả thuyết đối chứng**: Việc tích hợp cấu hình `site_dark_mode` vào trang Header Menu không làm ảnh hưởng đến tab cấu hình "Chế độ tối" ở trang Experiences tổng, do cả hai đều thao tác trên cùng một key Convex DB (`site_dark_mode`). Việc lưu trữ sẽ đồng bộ ở cả hai nơi.

# IV. Proposal (Đề xuất)
1. **Truy vấn thêm cài đặt `site_dark_mode` ở trang Header Menu**:
   - Sử dụng `useQuery(api.settings.getByKey, { key: 'site_dark_mode' })` để lấy giá trị hiện tại.
2. **Quản lý state cho chế độ tối mặc định**:
   - Tạo state `localDarkMode` để quản lý thay đổi tạm thời trên giao diện trước khi lưu.
3. **Cập nhật nút Lưu**:
   - Theo dõi sự thay đổi của `localDarkMode` so với giá trị trong DB để kích thái hoạt động cho nút lưu (`hasChanges`).
   - Cập nhật mutation `setMultipleSettings` để lưu đồng thời cả `header_style`, `header_config` và `site_dark_mode`.
4. **Bổ sung UI chọn Giao diện mặc định**:
   - Sử dụng `SelectRow` để hiển thị ngay dưới ToggleRow "Nút Dark Mode ở site thực".

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [app/system/experiences/menu/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/menu/page.tsx)
  - Vai trò: Trang cấu hình giao diện Header Menu.
  - Thay đổi: Query `site_dark_mode`, thêm state `localDarkMode` và tích hợp UI điều khiển `SelectRow` vào sidebar điều khiển bên trái, dưới toggle `showDarkModeToggle`. Cập nhật hàm `handleSave` để gửi key `site_dark_mode` về DB khi người dùng nhấn Lưu.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm truy vấn `site_dark_mode` và khai báo state `localDarkMode` trong [app/system/experiences/menu/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/menu/page.tsx).
2. Tích hợp `siteDarkModeSetting` vào kiểm tra `isLoading`, `hasChanges`, và logic đồng bộ state ban đầu.
3. Chèn `SelectRow` cấu hình "Giao diện mặc định" vào khối JSX của Control Card "Hiển thị".
4. Bổ sung việc lưu key `site_dark_mode` vào hàm `handleSave`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **TypeScript**: Chạy `bunx tsc --noEmit` thủ công trong terminal của Agent để xác minh không lỗi kiểu.
* **Manual**:
  - Truy cập `/system/experiences/menu`.
  - Thay đổi tùy chọn "Giao diện mặc định" (ví dụ từ Light sang Dark hoặc System) và xác nhận nút Lưu chuyển sang trạng thái kích hoạt (Active).
  - Bấm Lưu, tải lại trang để đảm bảo giá trị đã được ghi vào DB.
  - Kiểm tra site thực (ngoài trang chủ) để xem giao diện mặc định có thay đổi tương ứng hay không.

# VIII. Todo
- [ ] Thêm truy vấn và state cho `site_dark_mode` trong [app/system/experiences/menu/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/menu/page.tsx).
- [ ] Tích hợp kiểm tra thay đổi `localDarkMode` vào logic `hasChanges` và `handleSave`.
- [ ] Render `SelectRow` cấu hình theme mặc định dưới toggle "Nút Dark Mode ở site thực".
- [ ] Đảm bảo typecheck dự án hoạt động chính xác.
- [ ] Chạy lệnh phát âm thông báo hoàn thành task.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Trang `/system/experiences/menu` hiển thị tuỳ chọn cấu hình "Giao diện mặc định" ngay dưới toggle "Nút Dark Mode ở site thực".
* Tuỳ chọn có 3 giá trị: "Chế độ sáng (Light)", "Chế độ tối (Dark)", "Theo hệ thống (System)".
* Thay đổi tuỳ chọn này sẽ cho phép Lưu. Bấm Lưu thành công sẽ cập nhật lại giá trị trên cơ sở dữ liệu.
* Site thực sẽ tự động thay đổi theme mặc định theo cấu hình vừa được lưu.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có rủi ro lớn vì `site_dark_mode` là một cấu hình tĩnh và đã được xử lý an toàn phía public (`SiteProviders`).
* **Hoàn tác**: Rollback file bằng git checkout.
