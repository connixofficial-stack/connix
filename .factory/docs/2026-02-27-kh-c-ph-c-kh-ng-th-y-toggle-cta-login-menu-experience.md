Mình đã xác nhận trong code hiện tại `app/system/experiences/menu/page.tsx` có 2 toggle `Login` + `CTA` trong card `Hiển thị`, nên khả năng cao lỗi nằm ở render/UI state/runtime (không phải do đã xóa code). Theo yêu cầu của bạn, mình sẽ xử lý full: UI + logic lưu + preview render.

Kế hoạch triển khai:
1. **Rà soát và ổn định render phần toggle ở UI config** (`app/system/experiences/menu/page.tsx`)
   - Giữ đúng 2 toggle trong card `Hiển thị`: `Login`, `CTA`.
   - Thêm guard/fallback để `checked` luôn là boolean hợp lệ từ `config` (tránh undefined làm toggle không hiển thị đúng).
   - Đảm bảo card `Hiển thị` luôn nằm trong layout dễ thấy (không bị điều kiện ẩn theo style/device).

2. **Chuẩn hóa config runtime để không phá CoC hiện tại** (`app/system/experiences/menu/page.tsx`)
   - Tiếp tục giữ `brandName` lấy từ `site_name` + fallback `YourBrand`.
   - Tiếp tục cố định text `cta.text='Liên hệ'`, `login.text='Đăng nhập'`.
   - Chỉ cho phép thay đổi `cta.show` và `login.show` từ toggle.

3. **Kiểm tra và sửa logic lưu settings** (`handleSave` trong `app/system/experiences/menu/page.tsx`)
   - Đảm bảo `configToSave` luôn bao gồm trạng thái mới nhất của `cta.show` và `login.show`.
   - Không ghi đè nhầm `show` khi normalize (chỉ normalize text/brand).

4. **Kiểm tra preview render theo toggle** (`components/experiences/previews/HeaderMenuPreview.tsx`)
   - Verify tất cả layout (`classic`, `topbar`, `allbirds`) đều ẩn/hiện CTA theo `config.cta.show`.
   - Verify login hiển thị theo `config.login.show` kết hợp điều kiện module/login feature như hiện có.
   - Giữ fallback text hiện tại để tránh chuỗi rỗng.

5. **Xác minh kỹ thuật và commit**
   - Chạy `bunx tsc --noEmit`.
   - Commit local đúng phạm vi fix (không push).

Nếu bạn duyệt, mình sẽ implement ngay theo plan này.