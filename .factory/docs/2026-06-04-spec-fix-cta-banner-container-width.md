# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng chọn chế độ "Giới hạn chiều rộng gọn gàng" (Max-w-7xl) cho Banner, họ muốn cả cái dải Banner màu nền thương hiệu phải co nhỏ lại ở giữa màn hình và được bo góc xinh xắn. Nhưng hiện tại, Banner luôn kéo dài hết 100% chiều ngang màn hình bất kể chọn chế độ nào.
Chúng ta sẽ sửa lại Banner thành hai trường hợp:
- Nếu chọn "Mở rộng toàn chiều ngang" (Full width): Banner sẽ trải dài 100% chiều ngang màn hình không bo góc (như cũ).
- Nếu chọn "Giới hạn chiều rộng gọn gàng" (Max-w-7xl): Banner sẽ co lại thành một chiếc card đẹp đẽ có màu nền thương hiệu, căn giữa trang, bo góc mềm mại và có khoảng cách an toàn với các phần tử khác.

## 2. Elaboration & Self-Explanation
Trong component `CTASectionShared`, layout `banner` đang đặt màu nền thương hiệu `tokens.sectionBg` trực tiếp ở thẻ `section` ngoài cùng (chiếm 100% viewport width). Thẻ `div` bên trong tuy có class `containerWidthClassName` để co nội dung về `max-w-7xl`, nhưng do màu nền đã bị gán ở ngoài cùng nên dải Banner trông vẫn luôn rộng tràn màn hình.
Để giải quyết, chúng ta tách layout `banner` thành 2 trạng thái hiển thị dựa trên giá trị của `containerWidth`:
- `isFullWidth = true`: Giữ nguyên cấu trúc gán màu nền lên thẻ `section` ngoài cùng.
- `isFullWidth = false` (tương ứng với `max-7xl`): Chuyển màu nền `tokens.sectionBg`, viền `tokens.sectionBorder` và bo góc `radiusClassNames.card` vào thẻ `div` bên trong. Thẻ `section` ngoài cùng đóng vai trò tạo khoảng cách đệm (padding) bên ngoài.

## 3. Concrete Examples & Analogies
- **Ví dụ thực tế**: Khi chỉnh sửa CTA ở trang quản trị, chọn chế độ `Max-w-7xl` sẽ thu hẹp chiều rộng của dải màu Banner vàng ấm thành một khối hộp rộng tối đa `1280px` căn giữa trang, bo tròn các góc. Chọn `Full width` sẽ đưa Banner trở lại dải màu tràn viền hai bên màn hình.
- **Analogy**: Giống như một bức tranh treo tường. Chế độ Full width giống như việc sơn toàn bộ bức tường bằng màu vàng (Banner tràn viền). Chế độ Max-w-7xl giống như việc đóng khung bức tranh vàng đó và treo gọn gàng ở giữa bức tường trắng (khối Banner co lại).

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp kiểm tra**: [CTASectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_components/CTASectionShared.tsx)
- **Hiện trạng**: Dòng 140-160 đang render layout `banner` với màu nền gán tĩnh vào `section` bọc ngoài, bất kể `containerWidth` có cấu hình thế nào.
- **Kết quả**: Banner không thay đổi chiều rộng nền khi chuyển đổi giữa `Max-w-7xl` và `Full width`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Gán màu nền `tokens.sectionBg` lên phần tử ngoài cùng `section` (vốn có thuộc tính block rộng 100% mặc định) thay vì gán linh hoạt dựa theo giá trị cấu hình `containerWidth`.
- **Giả thuyết đối chứng**: Nếu chia nhánh render cho Banner (gán màu nền lên `section` khi full-width, gán lên `div` bên trong kèm bo góc khi max-7xl), Banner sẽ tôn trọng cấu hình chiều rộng của người dùng và hiển thị chính xác.

# IV. Proposal (Đề xuất)
- Sửa đổi layout `banner` trong file [CTASectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_components/CTASectionShared.tsx):
  - Kiểm tra `isFullWidth` bằng hàm `normalizeCTAContainerWidth(config.containerWidth) === 'full'`.
  - Nếu `isFullWidth === true`: Render section tràn màn hình (như code cũ).
  - Nếu `isFullWidth === false`: Render section có nền trong suốt, chứa div bên trong rộng tối đa `max-w-7xl mx-auto`, mang màu nền `tokens.sectionBg`, bo góc và viền tương ứng.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [CTASectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_components/CTASectionShared.tsx)
  - Vai trò hiện tại: Render giao diện cho tất cả các layout của CTA Component.
  - Thay đổi: Cập nhật cấu trúc JSX/TSX của layout `banner` để phản hồi chính xác với cấu hình `containerWidth`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa file [CTASectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_components/CTASectionShared.tsx).
2. Kiểm tra typecheck và Oxlint xem dự án có biên dịch bình thường không.
3. Xác nhận kết quả.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit`.
- **Kiểm tra trực quan**: Thay đổi tùy chọn chiều rộng giữa "Max-w-7xl" và "Full width" trên trang edit/create CTA để xác nhận dải Banner co/giãn chính xác theo yêu cầu.

# VIII. Todo
- [ ] Thay đổi cấu trúc JSX của layout `banner` trong file `CTASectionShared.tsx`.
- [ ] Chạy typecheck và oxlint kiểm tra tính đúng đắn của mã nguồn.
- [ ] Phát âm báo hoàn thành tác vụ.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi chọn "Giới hạn chiều rộng gọn gàng" (Max-w-7xl), Banner co lại thành card rộng tối đa `7xl` ở giữa trang, có bo góc.
- Khi chọn "Mở rộng toàn chiều ngang" (Full width), Banner trải rộng 100% màn hình, không bo góc ở hai bên mép.
- Không có lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Thấp, không ảnh hưởng đến logic dữ liệu, chỉ thay đổi cấu trúc hiển thị CSS/HTML của Banner layout.
- **Hoàn tác**: Hoàn tác file `CTASectionShared.tsx` về trạng thái git trước đó.

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi logic màu sắc đã sửa từ task trước.
- Thay đổi cấu trúc các layout khác.
