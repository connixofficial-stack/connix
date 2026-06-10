Chuẩn, mình chốt theo ý bạn: **xóa hẳn khái niệm `topbar_slogan`**, chỉ dùng 1 trường `Slogan` duy nhất.

## Root cause
- Dữ liệu slogan bị tách 2 key (`site_tagline` và `topbar_slogan`) nên admin nhập 1 chỗ, experience đọc chỗ khác.
- Vì lệch key nên bên trải nghiệm có thể trống dù tab Chung có text.

## Kế hoạch triển khai
1. Chuẩn hóa về 1 nguồn dữ liệu duy nhất
- Dùng `site_tagline` làm slogan chuẩn cho toàn hệ thống.
- Bỏ toàn bộ đọc/ghi `topbar_slogan`.

2. Cập nhật trang trải nghiệm menu
- File: `app/system/experiences/menu/page.tsx`
- Đổi query slogan từ `topbar_slogan` -> `site_tagline`.
- Ô read-only trong UI hiển thị slogan từ `site_tagline`.
- Giữ toggle bật/tắt ở experience như yêu cầu.
- Đổi label UI rõ ràng thành `Slogan` (không còn chữ “topbar”).

3. Cập nhật runtime header site
- File: `components/site/Header.tsx`
- Đổi text slogan lấy từ `settings.site_tagline`.
- Toggle vẫn lấy từ `header_config.topbar.sloganEnabled` (experience control).
- Nếu `site_tagline` rỗng thì ẩn slogan.

4. Dọn contract settings/seed
- Files: `convex/seed.ts`, `convex/seeders/settings.seeder.ts`
- Xóa field/key `topbar_slogan` khỏi seed và module fields.
- Chỉ giữ field `site_tagline`.

5. Rà soát tham chiếu còn sót
- Tìm toàn repo các chỗ dùng `topbar_slogan`, thay hoặc xóa hết.

6. Verify + commit
- Chạy `bunx tsc --noEmit`.
- Commit local (kèm `.factory/docs`) theo rule repo.

## Acceptance checklist
- [ ] Không còn `topbar_slogan` trong code/seed/settings fields.
- [ ] Experience hiển thị đúng slogan từ `site_tagline` (read-only).
- [ ] Toggle bật/tắt slogan chỉ ở experience.
- [ ] Header site render theo `site_tagline`.
- [ ] `bunx tsc --noEmit` pass.