# Walkthrough - Khắc phục lỗi Lưu cài đặt "Bật watermark sản phẩm"

Chúng ta đã khắc phục triệt để lỗi không lưu được cấu hình "Bật watermark sản phẩm" khi người dùng nhấn nút lưu cài đặt trong giao diện quản trị Admin (`/admin/settings/advanced`).

## Thay đổi đã thực hiện

### 1. Giao diện Cài đặt Admin
#### [SettingsPageShell.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/settings/_components/SettingsPageShell.tsx)
* **Khởi tạo mặc định**: Đã thêm gán mặc định cho `enable_product_watermark = false` khi load dữ liệu cấu hình từ DB để đảm bảo không bị `undefined`.
* **Đăng ký Save Key**: Đã thêm `'enable_product_watermark'` vào mảng `watermarkKeys` trong hàm `handleSave`. Khi bấm Lưu, trường này sẽ được ghi nhận và gửi xuống Convex DB.
* **Xử lý kiểu dữ liệu**: Cập nhật logic parse giá trị khi lưu. Nếu khoá là `enable_product_watermark`, giá trị sẽ được lưu dưới dạng chuỗi `'true'` hoặc `'false'` khớp với cấu trúc Convex settings hiện tại.
* **Cập nhật UI Checkbox**: Sửa thuộc tính `checked` của Checkbox Bật watermark từ so sánh nghiêm ngặt `form.enable_product_watermark === true` sang hỗ trợ cả dạng chuỗi: `form.enable_product_watermark === true || form.enable_product_watermark === 'true'`. Điều này khắc phục lỗi checkbox bị trống sau khi F5 do lệch kiểu dữ liệu từ DB gửi lên.

### 2. Logic hiển thị Storefront
#### [ProductImageWatermarkOverlay.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/shared/ProductImageWatermarkOverlay.tsx)
* **Đọc cấu hình an toàn**: Sửa logic gán `globalEnabled` để so sánh cả kiểu chuỗi `'true'` và boolean `true`. Điều này giúp storefront nhận diện chính xác trạng thái hoạt động của watermark toàn cục kể cả khi dữ liệu trả về từ DB dưới dạng chuỗi.

---

## Kết quả kiểm chứng

### Kiểm tra tĩnh (Static Verification)
* Chúng ta đã chạy kiểm tra kiểu TypeScript tĩnh thành công bằng lệnh:
  `bunx tsc --noEmit`
* Kết quả: Thành công 100%, không có bất kỳ lỗi biên dịch nào.

---

## Hướng dẫn kiểm tra thủ công cho Người dùng
1. Truy cập trang cấu hình nâng cao: `http://localhost:3000/admin/settings/advanced`.
2. Chuyển sang tab **Watermark**.
3. Tích chọn **Bật watermark sản phẩm**.
4. Nhấn nút **Lưu cài đặt** ở góc dưới màn hình.
5. F5 (tải lại trang). Hãy xác nhận rằng dấu tích tại ô "Bật watermark sản phẩm" vẫn được giữ nguyên.
6. Xem sản phẩm ngoài storefront để kiểm tra watermark (hình ảnh/chữ) hiển thị đầy đủ và chính xác.
