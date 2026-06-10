Chốt spec mới (đã thêm vụ bản đồ đè header ở `/contact`):

## Mục tiêu
1) `/admin/settings` tab Liên hệ gọn, không field trùng (hotline/facebook dup).  
2) `/contact` hiển thị icon Zalo khi admin nhập **số hoặc link**.  
3) `/contact` fix lỗi map có lớp hiển thị cao làm cảm giác “lăn/menu header bị đè”.

## Phạm vi thay đổi file
1. `components/site/useContactPageData.ts`
- Chuẩn hóa Zalo theo **1 nguồn `contact_zalo`**.
- Thêm normalize:
  - Nếu là số điện thoại -> convert sang `https://zalo.me/<số>`.
  - Nếu là URL hợp lệ -> dùng trực tiếp.
  - Rỗng/sai định dạng -> bỏ qua.
- Bỏ phụ thuộc `social_zalo` cho trang contact.
- Giữ Facebook từ `social_facebook`.

2. `app/(site)/contact/page.tsx`
- Bỏ render mục `Hotline` trong `ContactInfoCard` và `CorporateSidebar`.
- Chỉ giữ 1 mục `Điện thoại` để không trùng.
- Không đổi UI phần khác.

3. `app/admin/settings/page.tsx`
- Ẩn field trùng tại UI settings:
  - `contact_hotline` (bỏ hẳn khỏi tab Liên hệ)
  - `social_zalo` (vì Zalo chuyển sang `contact_zalo`)
- Giữ `social_facebook` ở group social.
- Khi save, bỏ qua 2 key trên để không ghi đè sai.
- Thêm cleanup 1 lần (giống pattern cleanup SEO đang có): nếu tồn tại thì `removeMultiple(['contact_hotline','social_zalo'])`.

4. `lib/get-settings.ts`
- `ContactSettings`: thay `contact_hotline` -> `contact_zalo`.
- `SETTINGS_KEYS.contact`: thay key tương ứng.
- Mapper trả về shape mới thống nhất.

5. `convex/seeders/settings.seeder.ts`
- Xóa default data `contact_hotline`, `social_zalo`.
- Xóa moduleFields `contact_hotline`, `social_zalo`.
- Giữ `contact_zalo`, `social_facebook`.

6. `convex/seed.ts` (legacy seed path)
- Đồng bộ giống seeder phía trên để tránh seed cũ tạo lại field trùng.

7. `components/maps/OpenStreetMapDisplay.tsx` (fix z-index map đè header)
- Thêm stacking context thấp cho map container bằng class `relative z-0` (hoặc equivalent) để Leaflet panes không vượt header sticky `z-50`.
- Giữ nguyên chức năng map, chỉ sửa layering.
- Nếu cần tăng chắc chắn: thêm class scope cho map và set panes/control ở mức thấp trong scope đó (không ảnh hưởng map nơi khác).

## Lý do kỹ thuật cho fix map/header
- Header đang `sticky top-0 z-50`.
- Leaflet có nhiều pane nội bộ với z-index riêng; nếu container map không tạo stacking context phù hợp sẽ gây cảm giác lớp map/overlay đè lên header khi scroll.
- Tạo stacking context tại wrapper map (`z-0`) là cách tối giản, đúng KISS, không cần can thiệp rộng.

## Verify sau implement
1) `/admin/settings` tab Liên hệ:
- Không còn hotline.
- Có `contact_zalo`.
- Facebook chỉ ở phần Mạng xã hội.

2) `/contact`:
- Nhập `contact_zalo=090...` => icon Zalo hiện và link click được.
- Nhập `contact_zalo=https://zalo.me/...` => icon vẫn hiện đúng.
- Không còn dòng Hotline (chỉ còn Điện thoại).
- Scroll trang: map không còn đè/lấn cảm giác lên header/menu.

3) Check type:
- Chạy `bunx tsc --noEmit`.

4) Commit:
- Commit toàn bộ thay đổi code theo rule repo, không push, include `.factory/docs` nếu có phát sinh.