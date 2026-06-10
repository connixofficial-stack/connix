Đã chốt theo yêu cầu của bạn:
- Ẩn hoàn toàn cấu hình CTA/Login khỏi UI config.
- Brand name luôn lấy từ `site_name` ở `/admin/settings`, không cho sửa tay.
- Fallback khi `site_name` trống là `YourBrand`.

Kế hoạch implement chi tiết:
1. **Cập nhật nguồn dữ liệu settings trong** `app/system/experiences/menu/page.tsx`
   - Thêm query lấy `site_name` (dùng `api.settings.getByKey` với key `site_name`).
   - Tạo `resolvedBrandName = site_name?.value || 'YourBrand'` (có trim để tránh chuỗi trắng).
   - Trong `serverConfig` (useMemo), ép `brandName` theo `resolvedBrandName` để đảm bảo luôn CoC, không phụ thuộc dữ liệu cũ trong `header_config`.

2. **Loại bỏ toàn bộ control CTA/Login/Brand khỏi màn hình cấu hình trong** `app/system/experiences/menu/page.tsx`
   - Xóa các UI sau:
     - ToggleRow `CTA`
     - Input `Brand name`
     - Input `CTA text`
     - Input `Login text`
   - Xóa các helper không còn dùng:
     - `updateCta`
     - `updateBrandName`
     - phần update text login nếu không còn chỉnh text
   - Giữ lại toggle `Login` hiện tại nếu cần bật/tắt hiển thị feature đăng nhập theo module (chỉ bỏ cấu hình text như bạn yêu cầu “CTA & Brand”). Nếu bạn muốn bỏ luôn toggle Login, mình sẽ bỏ thêm trong cùng patch.

3. **Chuẩn hóa giá trị cố định trước khi preview/lưu trong** `app/system/experiences/menu/page.tsx`
   - Trước khi render preview và trước khi save, chuẩn hóa config runtime:
     - `brandName = resolvedBrandName`
     - `cta.text = 'Liên hệ'`
     - `login.text = 'Đăng nhập'`
   - Khi `handleSave`, luôn persist config đã chuẩn hóa để dữ liệu DB nhất quán với CoC.

4. **Đảm bảo preview luôn hiển thị đúng mặc định trong** `components/experiences/previews/HeaderMenuPreview.tsx`
   - Không cần đổi layout logic lớn; chỉ đảm bảo mọi nơi render sử dụng giá trị đã chuẩn hóa từ page (brand/cta/login text).
   - Nếu còn đường nào có thể render text rỗng, thêm fallback an toàn tại điểm render:
     - brand: `config.brandName || 'YourBrand'`
     - cta: `config.cta.text || 'Liên hệ'`
     - login: `config.login.text || 'Đăng nhập'`

5. **Dọn type/logic dư thừa để tránh dead code**
   - Rà lại import/state/handler liên quan CTA & Brand editor để không còn biến unused sau khi bỏ UI.

6. **Verify theo rule repo (không chạy lint)**
   - Chạy `bunx tsc --noEmit`.
   - Nếu pass thì chuẩn bị commit local với message theo style hiện tại (không push).

7. **Commit local sau khi hoàn tất**
   - Commit toàn bộ thay đổi code liên quan đúng phạm vi yêu cầu của bạn.