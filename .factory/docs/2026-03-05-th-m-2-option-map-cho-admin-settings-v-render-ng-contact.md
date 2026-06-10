## Problem Graph
1. [Main] Hỗ trợ 2 nguồn bản đồ cho Contact (OSM hiện tại + Google Maps nhúng) và đảm bảo `/contact` render đúng theo lựa chọn <- depends on 1.1, 1.2, 1.3
   1.1 [Data contract] Bổ sung key settings mới cho loại map + iframe Google
   1.2 [Admin UI] Cập nhật `/admin/settings` để chọn kiểu map bằng Radio và nhập iframe Google
   1.3 [Site render] Cập nhật `/contact` để render OSM hoặc iframe Google theo cấu hình

## Execution (with reflection)
1. Solving 1.1 (Data contract)
   - Thought: Không cần sửa schema table, chỉ thêm key trong settings key-value là đủ (KISS/YAGNI).
   - Action:
     - Cập nhật `components/site/useContactPageData.ts`:
       - Mở rộng `ContactData` thêm:
         - `mapProvider: 'openstreetmap' | 'google_embed'`
         - `googleMapEmbedIframe: string`
       - Khi parse `contactSettings`, đọc thêm:
         - `contact_map_provider` (default `'openstreetmap'`)
         - `contact_google_map_embed_iframe` (default `''`)
     - Cập nhật `lib/get-settings.ts`:
       - `ContactSettings` thêm 2 field trên.
       - `SETTINGS_KEYS.contact` thêm 2 key tương ứng.
   - Reflection: ✓ Tương thích ngược, bản ghi cũ không có key vẫn chạy default OSM.

2. Solving 1.2 (Admin UI tại `app/admin/settings/page.tsx` + `MapLocationPicker.tsx`)
   - Thought: Logic map đang nằm trong nhánh `contact_address`, nên thêm UI đúng ngay tại đây để ít đụng chạm nhất.
   - Action:
     - Trong nhánh render `contact_address`:
       - Thêm Radio group 2 lựa chọn:
         - `openstreetmap` (như hiện tại)
         - `google_embed`
       - `updateField('contact_map_provider', ...)` khi đổi lựa chọn.
     - Khi chọn `openstreetmap`:
       - Giữ `MapLocationPicker` như hiện tại.
     - Khi chọn `google_embed`:
       - Ẩn hoàn toàn `MapLocationPicker` (đúng yêu cầu bạn chọn).
       - Hiện `textarea` để dán **nguyên mã iframe** (`contact_google_map_embed_iframe`).
     - Save flow:
       - Đảm bảo `handleSave` luôn push 2 key mới vào `settingsToSave` (group `contact`) tương tự cách đang làm với `contact_lat/lng`.
     - Validation nhẹ:
       - Nếu chọn `google_embed` và có dữ liệu, kiểm tra chuỗi chứa `<iframe` và `</iframe>`; sai thì toast lỗi để tránh render hỏng.
   - Reflection: ✓ UI rõ ràng, không phá luồng cũ, đúng yêu cầu “radio + dán iframe + ẩn OSM khi dùng Google”.

3. Solving 1.3 (Site render tại `app/(site)/contact/page.tsx`)
   - Thought: Tách component nhỏ cho Google embed để tránh phình logic `MapPreview`.
   - Action:
     - Tạo component nội bộ `GoogleMapEmbed` trong file (hoặc file map component riêng nếu cần tái sử dụng):
       - Nhận `iframeHtml`.
       - Render bằng `dangerouslySetInnerHTML` sau bước sanitize tối thiểu:
         - Chỉ chấp nhận khi có thẻ `<iframe ...>`.
         - Loại bỏ script/event-handler cơ bản (`<script`, `onload=`, `onclick=`...) trước khi inject.
     - Đổi `MapPreview`:
       - Nếu `mapProvider === 'google_embed'` và có iframe hợp lệ => render `GoogleMapEmbed`.
       - Ngược lại => fallback `OpenStreetMapDisplay` (đảm bảo không trắng khối map).
     - Các vị trí đang gọi `MapPreview` giữ nguyên (3 layout), nên toàn trang `/contact` tự đồng bộ.
   - Reflection: ✓ Giữ DRY, mọi layout hưởng lợi cùng một logic map.

4. Seed/update dữ liệu mặc định (để môi trường mới có sẵn key)
   - Action:
     - Cập nhật `convex/seeders/settings.seeder.ts` và `convex/seed.ts` thêm default settings:
       - `contact_map_provider = 'openstreetmap'`
       - `contact_google_map_embed_iframe = ''`
   - Reflection: ✓ Cài mới hệ thống vẫn đầy đủ key, không phụ thuộc thao tác thủ công.

5. Verification
   - Chạy duy nhất theo rule repo: `bunx tsc --noEmit`.
   - Test tay nhanh:
     - `/admin/settings` tab Liên hệ:
       - Chọn OSM -> thấy picker, lưu xong `/contact` hiển thị OSM.
       - Chọn Google embed -> chỉ thấy ô iframe, dán iframe, lưu xong `/contact` hiển thị iframe Google.
       - Đổi qua lại 2 option không lỗi, không mất dữ liệu đã nhập.

6. Commit (sau khi bạn duyệt spec và mình implement)
   - `git add` toàn bộ file thay đổi + luôn kèm `.factory/docs` (nếu có).
   - `git commit` message theo style repo, ví dụ: `feat(settings): add map provider switch for contact page`.

## Checklist xác nhận scope
- [x] Có đúng 2 option map ở admin: OpenStreetMap / Google Maps nhúng
- [x] Google dùng cách dán **nguyên iframe**
- [x] Khi chọn Google thì ẩn picker OSM
- [x] `/contact` render map theo option đã lưu
- [x] Có fallback an toàn về OSM khi iframe thiếu/sai

Nếu bạn xác nhận, mình sẽ implement đúng spec này ngay.